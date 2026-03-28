# Dev Findings — racing-improvements
Phase C investigation. Date: 2026-03-28.

---

## R-04: `isWaiting` reachability verdict

**Verdict: `isWaiting` is UNREACHABLE in practice.**

### Evidence

`enterRace()` in `src/hooks/useRacing.ts` (lines 145–150) writes `status: 'running'`
synchronously as part of the entry `db.races.update()` call:

```ts
await db.races.update(raceId, {
  participants: [...race.participants, playerParticipant],
  playerEntryPetId: pet.id!,
  status: 'running',   // ← immediately set to 'running' on entry
  updatedAt: now,
})
```

There is no intermediate state between `open` (before player entry) and `running`
(after player entry). The `useLiveQuery` subscription in `useRacing` will always
reflect the post-write state.

`RunningRaceCard` (PlayHubScreen.tsx line 148) checks `const isWaiting = race.status === 'open'`.
A race only reaches `RunningRaceCard` if it is in `yourRaces`, which is filtered as:

```ts
const yourRaces = openRaces.filter(r => r.playerEntryPetId !== null)
```

And `openRaces` in `useRacing` is:

```ts
const openRaces = races.filter(r => r.status === 'open' || r.status === 'running')
```

So `yourRaces` can include races with `status === 'open'` only if the player's entry
write somehow landed with `playerEntryPetId !== null` but `status` still `open`.
Given the single atomic `db.races.update()` in `enterRace()` sets both fields
simultaneously, this window is sub-millisecond at the IDB level and will never be
observed by a `useLiveQuery` subscriber.

### Consequence for Story 2 (PreRaceCountdown)

**Story 2 is OUT OF SCOPE. Do not build `PreRaceCountdown`.** The `isWaiting` branch
inside `RunningRaceCard` is dead code. The FE may clean it up (remove the
`isWaiting` conditional and always render the "In progress" / "Reveal Result" path)
but must not add any new UI for a pre-race waiting state.

---

## BottomNav badge stub — confirmed defects

File: `src/components/layout/BottomNav.tsx`, lines 60–65.

Two confirmed bugs:

1. **Wrong tab:** the badge dot renders on `to === '/shop'` (Store tab). It must
   render on `to === '/play'` (Play tab). The Play tab has `to: '/play'`.

2. **Incomplete condition:** the `freshRaceCount` query only counts `finished` races
   updated in the last 24 hours. It does not distinguish "races where the player
   participated". A `finished` race where the player never entered would trigger the
   dot, which is incorrect. The correct conditions are described below.

---

## Badge conditions and query approach

The badge dot on the Play tab needs to show when either:

- **Condition A:** any race with `status === 'open'` and `playerEntryPetId !== null`
  (entered but not yet resolved — player should come and run it). Note: given the
  `isWaiting` verdict, all such races actually have `status === 'running'` by the
  time the player has entered. So Condition A in practice is:
  `status === 'running' && playerEntryPetId !== null`.

- **Condition B:** any race with `status === 'finished'` where the player
  participated (`playerEntryPetId !== null`) and the result has not yet been "seen".

The `BottomNav` should query `db.races` directly via `useLiveQuery` — it does not
need `useRacing`. The table name is `races` (confirmed: `db.races` declared in
`src/lib/db.ts` line 303, indexed on `status` and `startsAt`).

The FE should replace the existing `freshRaceCount` query with two separate
`useLiveQuery` calls (or one combined query) covering both conditions.

---

## Badge clear mechanism — recommendation

### Options evaluated

**Option 1 — `resultSeen: boolean` field on the Race record**

Adds a new field to the `Race` interface and requires a Dexie schema version bump
(v11). Every `resolveRace()` call would set `resultSeen: false`, and visiting `/play`
would set `resultSeen: true` for all finished races. This is the most semantically
correct approach but introduces a schema migration.

**Option 2 — `lastVisitedPlayTab` timestamp in localStorage**

Store a timestamp in `localStorage` when the player visits `/play`. Condition B is
"any finished race where `updatedAt > lastVisitedPlayTab`". No DB migration, no new
fields, no hook changes.

Potential edge case: `updatedAt` is set by `resolveRace()` at resolution time. If
the player resolves a race and immediately visits the results overlay (still on
`/play`), then `lastVisitedPlayTab` is already at or after the `updatedAt`, so the
badge clears immediately on the next `useLiveQuery` tick. This is correct behaviour.

**Recommendation: Option 2 (localStorage timestamp).**

No schema migration. No changes to `useRacing.ts`. The FE implements it entirely
within `BottomNav` and `PlayHubScreen`. The logic is:

- On mount of `PlayHubScreen` (or when the racing tab gains focus), write
  `localStorage.setItem('lastVisitedPlayTab', Date.now().toString())`.
- `BottomNav` Condition B query: count finished races where
  `playerEntryPetId !== null` and
  `updatedAt.getTime() > Number(localStorage.getItem('lastVisitedPlayTab') ?? '0')`.

Because `useLiveQuery` is reactive, the badge will clear the moment the timestamp
is written and the query re-evaluates.

---

## Implementation notes for the FE

1. **Story 2 is skipped.** Remove the `isWaiting` dead-code branch from
   `RunningRaceCard` or leave it; do not add any PreRaceCountdown UI.

2. **BottomNav badge fix** — replace lines 60–65 in
   `src/components/layout/BottomNav.tsx`:
   - Move the badge condition to `to === '/play'`
   - Replace `freshRaceCount` with two conditions: any running+entered race (Condition A)
     or any unseen finished+entered race (Condition B)
   - Use the localStorage timestamp approach for "unseen" (Condition B)

3. **PlayHubScreen badge clear** — in `PlayHubScreen` or `RacingContent`, write the
   `lastVisitedPlayTab` timestamp to localStorage when the screen mounts or when
   the racing tab is activated. A `useEffect` on the tab state change is sufficient.

4. **`db.races` is the correct table name.** It is indexed on `status`, so
   `db.races.where('status').anyOf(['running', 'finished']).and(r => r.playerEntryPetId !== null)`
   is an efficient query pattern.

5. **No changes to `useRacing.ts` are required.** The badge query goes directly
   against `db.races` via `useLiveQuery` in `BottomNav`, same pattern as the
   existing stub. The timestamp write goes in `PlayHubScreen`.

6. **`resolveRace()` transaction note.** The existing `resolveRace()` calls
   `earn()` outside the `db.races.update()` write (lines 169–176 of `useRacing.ts`).
   This is a pre-existing pattern not introduced by this feature. Do not change it
   as part of this work.

---

## Files the FE needs to touch

- `src/components/layout/BottomNav.tsx` — fix badge tab target and query
- `src/screens/PlayHubScreen.tsx` — write `lastVisitedPlayTab` on play tab visit
- No hook files, no schema changes, no new DB version required
