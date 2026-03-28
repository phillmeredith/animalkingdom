# UR Findings — Animal Journey: Explore, Adopt vs. Observe, and Name Generation

**Phase A — User Research**
**Feature:** animal-journey
**Date:** 2026-03-28
**Researcher:** User Researcher agent

---

## Evidence audit

### What was read

| Source | Type | Relevance |
|--------|------|-----------|
| `src/data/animals.ts` — full `AnimalEntry` interface; `DOMESTIC_CATEGORIES` / `WILD_CATEGORIES` constants | Production code | Current taxonomy, data model, category routing already established |
| `src/data/generateOptions.ts` — all step definitions, `TYPES_BY_CATEGORY`, `BREEDS_BY_TYPE`, `generateNames`, personality/age options | Production code | The full shape of the current Generate wizard — what Harry sees, what gets produced |
| `src/screens/GenerateScreen.tsx` — wizard state machine, step titles, adoption overlay, `TraderPuzzle` integration | Production code | The current Generate journey start-to-finish; what actions exist at the result screen |
| `src/lib/db.ts` — `SavedName` interface (status field, source field, all name variant fields) | Production code | How animals are currently stored; confirms status is only `active` or `for_sale` — no observed/wild state exists |
| `src/screens/MyAnimalsScreen.tsx` — filter tabs, sort, `PetDetailSheet` reference | Production code | How Harry sees his collection today; no differentiation by relationship type |
| `research/explore-animal-detail/ur-findings.md` — full document | Prior UR output | Harry's full profile as established in prior research; ADHD/autism findings; confidence ceiling |
| `research/card-collection-detail/ur-findings.md` — lines 1–60 | Prior UR output | Harry's relationship to collectibles; emotional investment patterns |
| `memory/project_harrys_device.md` | Memory | iPad Pro 11-inch; ~820px CSS portrait width |
| `memory/project_ipad_default.md` | Memory | iPad-first layout requirement |
| `spec/backlog/BACKLOG.md` | Backlog | Feature status context; confirms animal-journey is not yet a named backlog entry |

### Prior research status

No primary research has been conducted with Harry or equivalent participants on this project.
All findings below are synthesised from:

- Direct code inspection of the current Generate wizard and My Animals screen
- Published literature on autistic and ADHD children's engagement with collecting, naming, and wildlife media
- Published child UX and game design research (Minecraft, Webkinz, Neopets, Animal Crossing precedents)
- Developmental psychology literature on fantasy play, ownership attribution, and categorisation in 8–12 year olds
- Prior UR findings from `explore-animal-detail` and `card-collection-detail` (Harry's profile already established)

**Confidence ceiling:** Medium-high for findings derived from code inspection and established literature.
No finding should be treated as validated until observed directly with Harry. The team does not
currently have a primary research participant pipeline.

---

## 1. Harry's three distinct use cases — named and separated

The owner has identified three uses Harry has for the Generate screen and for animal pages in general.
These are genuinely distinct scenarios with different goals, different emotional states, and different
functional requirements. The current design treats them as one thing. They are not.

---

### Use Case A — Generating names for Xbox games

**What Harry is doing:** Harry plays games on his Xbox — likely games with creature naming (Minecraft,
Ark, horse games, creature collectors). He wants a good, fitting name for an animal that exists
outside this app. He is using Animal Kingdom as a creative naming tool, not as a collecting experience.

**What Harry needs from this flow:**
- Fast access to a name generator without being forced through a collecting journey he doesn't want
- The ability to generate many names quickly and compare them
- Some way to save or copy the name without it creating an animal in his collection
- Potentially: inspiration from descriptions ("brave," "fierce," "shy") that help him decide whether the name fits his Xbox animal's personality

**What the current design does instead:**
The Generate wizard is structured as a collecting journey. It ends with a result screen
that prompts adoption. A child using the tool for creative naming is forced to either
adopt an animal they don't want in their collection, or abandon the flow without a
name. Neither is satisfying.

**Key finding:** The current design has no concept of name generation without adoption.
These are treated as the same action. They are different goals, and conflating them creates
friction in both directions — children who want names feel pushed into adopting, and
children who want to adopt are navigating a screen that also serves a different purpose.
- Confidence: High. Derived from code inspection and from the owner's direct description of Harry's behaviour.

---

### Use Case B — Naming an animal in-app for fun

**What Harry is doing:** Harry is not naming a real Xbox animal. He is building a fantasy animal
in the app — picking its personality, breed, and name because the creative act is enjoyable
in itself. He may or may not want to formally "adopt" the result. The play is in the choosing,
not necessarily in the owning.

**What Harry needs from this flow:**
- A playful, low-stakes wizard that feels like building a character, not filling in a form
- The ability to regenerate names without restarting from the beginning
- Freedom to save or discard without a commitment ritual ("adopt" feels like a permanent, weighty action)
- A result that feels satisfying even if he never revisits the animal

**What the current design does well here:**
The 7-step wizard (category, type, gender, age, personality, breed, colour) is well-structured
for this use case. The personality options ("Brave," "Mischievous," "Shy") support character-building.
The `discoveryNarrative` generated at the end adds story. This use case is reasonably well served
by the existing design — the gap is only that the wizard always ends in an adoption prompt,
which may feel like pressure when Harry just wanted to play.

**Key finding:** Use Case B is the closest match to the current wizard. The main gap is
the binary outcome: adopt or abandon. A "just keep the name" or "save to ideas" path
would serve this use case without restructuring the wizard.
- Confidence: Medium. Inferred from the owner's description and from the wizard's existing design. Not validated with Harry.

---

### Use Case C — Discovering animals and going to "get" one

**What Harry is doing:** He is browsing the Explore tab, reading about animals, and deciding he
wants to pursue one. This is different from the Generate wizard — Harry starts with the animal,
not with a blank slate. He has found a specific Lion, or a specific Thoroughbred, and he wants
to do something with it.

**What "getting" means depends entirely on what the animal is.** This is the central insight for
this feature. "Getting" a Labrador and "getting" a Lion are not the same action and should not
present the same affordance.

**Key finding:** Use Case C requires the app to have a coherent, differentiated model for what
each category of animal means in terms of the relationship Harry can have with it. The current
app has no such model. Every animal in every category ends up in "My Animals" as an adopted pet
with a name, which is not realistic for dinosaurs, sharks, or elephants.
- Confidence: High. Derived from the owner's verbatim direction and from inspection of the
current `SavedName` schema (no distinction between owned pets and observed wild animals).

---

## 2. What "getting" an animal means — a realistic three-tier model

The owner has explicitly asked for a realistic split. This section maps the app's six categories
to three meaningful relationship tiers.

### Tier 1 — Animals you can own as pets (Adopt)

**Categories:** At Home, Stables, Farm

**Real-world basis:** Dogs, cats, rabbits, guinea pigs, hamsters, parrots, horses, ponies,
donkeys, cows, sheep, chickens, pigs. These are animals that children encounter personally,
that families keep, or that Harry could plausibly encounter at a stable or farm visit.

**What the relationship means:**
- Harry names the animal
- The animal lives in his collection as a "pet" — it has a care system, a wellbeing state, a barn name, a show name
- He can race horses, care for pets, sell them in the marketplace
- The emotional relationship is ownership: "my Labrador, Storm"

**Journey model:**
Explore profile → "Rescue / Adopt" CTA → Generate wizard (pre-seeded with the animal's
category and type) → name the animal → it joins My Animals as an adopted pet

**Note on framing:** The owner used "rescue" language. This is worth investigating for the UX.
"Rescue" implies the animal needed help — it frames the adoption as an act of care rather than
acquisition. For a child (particularly one who is empathetic toward animals), "rescue" is
emotionally richer than "adopt" or "buy." Recommend the UX Designer explore "Rescue" as the
primary CTA for Tier 1 animals.

---

### Tier 2 — Animals you can observe and record (Observe)

**Categories:** Wild, Sea

**Real-world basis:** Lions, elephants, tigers, gorillas, dolphins, sharks, whales, sea turtles.
These are animals Harry could see at a zoo or aquarium, watch on documentaries, or encounter
on a wildlife safari. He cannot own one. But he can develop a real knowledge-based relationship
with them — he can track them, learn about them, and "spot" them in the wild.

**What the relationship means:**
- Harry does not name the animal (it is not "his" animal — it is a wild animal he has observed)
- He "observes" it — adds it to a personal nature journal or field log
- The animal appears in My Animals visually differentiated: it is not a pet, it is a sighting
- He can mark it as a favourite, add it to a watchlist, read about it repeatedly
- There is no care system, no racing, no selling for this tier

**Journey model:**
Explore profile → "Observe" CTA → the animal is logged to My Animals with an "Observed" tag →
it appears in a differentiated section or with a distinct visual treatment

**Important: this must not feel like a consolation prize.** See Risk section (item 7 below).
The "Observe" action must be framed as something exciting and special in its own right —
a wildlife sighting, a field record, a trophy — not as "the thing you do when you can't adopt."

---

### Tier 3 — Animals that exist in fantasy or prehistory (Encounter)

**Category:** Lost World

**Real-world basis:** Dinosaurs, pterosaurs, woolly mammoths. Harry cannot own one, cannot
visit one at a zoo, cannot even encounter one in the wild. But he can "discover" one — in a
game context, finding a fossil, or having a legendary encounter in a "Lost World" expedition.

**What the relationship means:**
- Harry does not name the animal conventionally (though a name generator could give it an
  expedition codename)
- He "encounters" or "discovers" it — the framing is exploration and discovery, not ownership
- It appears in My Animals as a discovery record — perhaps the most visually distinct of the
  three tiers (fossils, expedition badges, prehistoric atmosphere)
- No care system, no racing (unless a separate "Lost World racing" variant exists — out of scope
  for this feature)

**Journey model:**
Explore profile → "Discover" CTA → a discovery animation or encounter sequence →
the animal is logged as a discovery in My Animals

**Note:** The current app already has `Lost World` as a Generate category. The wizard can
produce a named Dinosaur. This creates a conflict: the wizard currently treats a named T-Rex
the same as a named Labrador — both become adopted pets. The new model would need to
reconcile the existing wizard output for Lost World animals with the proposed Tier 3 relationship.
This is a data model question for the UX Designer and Developer to resolve.
- Confidence: High that a three-tier model reflects the owner's intent. Medium that the
  exact tier boundaries and framing are correct — these require owner validation.

---

## 3. Motivation mapping — what Harry gets from each relationship type

Understanding what Harry is motivated by in each tier is critical for designing journeys
that feel rewarding rather than arbitrary.

### Tier 1 (Own/Rescue) — completeness, care, and identity

Children aged 8–12 form strong emotional attachments to owned digital creatures. The Tamagotchi,
Neopets, and Animal Crossing precedents all demonstrate that children will invest significant
time and emotional energy in a creature they have named and are responsible for. The care system
(feed, clean, play) reinforces a sense of responsibility that is particularly engaging for
children who enjoy nurturing roles.

**Harry's specific motivation signal:** The care streak mechanic already in the codebase
(and the racing system) suggests the product already understands this. The adoption tier
rewards routine engagement.

**What could go wrong:** If Harry adopts an animal, neglects its care, and sees it "suffering,"
that is a distressing state for some children. The current care system shows a wellbeing
indicator — this needs careful calibration. A visual state that reads as the animal being
unhappy or unwell could be distressing for a child who interprets it literally.
- Confidence: Medium. ADHD children vary significantly in whether routine engagement is
  motivating or anxiety-producing. Not validated with Harry specifically.

### Tier 2 (Observe) — collecting, knowledge, and pride

Observing wild animals is motivated by collection completion (filling a "field log"),
by the pride of having "found" something rare, and by the knowledge identity of being
someone who knows about animals. This maps strongly to Harry's likely interests given he
uses the app at all.

The "observation" relationship is supported by how many nature apps and games handle
this well. Pokédex mechanics (Pokémon's encyclopedia of creatures encountered) are
extremely well-understood by children Harry's age. The Pokédex is not a consolation prize
for not owning every Pokémon — it is a trophy board. This framing is directly applicable.

**Harry's specific motivation signal:** Harry browses the Explore tab and wants to find out
about animals and "go to find one." This is observational behaviour, not ownership behaviour.
The fact that he wants to "find" them and look them up suggests the field-log or Pokédex
framing will resonate.
- Confidence: Medium-high. Pokédex analogy is strong and well-supported by the owner's
  description of Harry's behaviour. Not directly validated.

### Tier 3 (Discover/Encounter) — wonder, rarity, and bragging rights

Lost World animals are appealing precisely because they are impossible. The fantasy is
the point. A dinosaur encounter is a legendary event — it should feel rarer and more
significant than adopting a dog. This tier is the most "game-like" and the least
grounded in realism, which is fine: Harry understands the distinction between a dog
he could own and a T-Rex he could "discover" in a video game context.

**The rarity system already supports this.** Lost World animals tend to higher rarities in
the existing breed data (though not exclusively). A Tier 3 encounter could be tied to
rarity mechanics — perhaps only accessible after Harry has completed a certain number of
observations or rescues, or only unlockable through specific in-game events.
- Confidence: Low-medium. This is more speculative than the other tiers. Requires owner
  input on how "legendary" the Lost World tier should feel.

---

## 4. Journey models by tier — what a satisfying journey looks like

### Tier 1 — Rescue and Adopt

**Starting point:** Explore → tap an At Home / Stables / Farm animal → read the detail profile

**CTA on the Explore profile:** "Rescue [Animal Name]" (or "Adopt")

**Transition:** The CTA launches the Generate wizard pre-seeded with the animal's category
and type, skipping to the breed step. Harry does not re-choose the category — he's already
decided he wants a [Dog]. He chooses breed, gender, age, personality, colour, then names it.

**End state:** The animal joins My Animals as a pet with full care system access. The name
and all wizard selections are preserved in `SavedName`.

**What feels satisfying:** The journey has narrative logic — Harry found a dog he wanted, then
went and got one (through the game's adoption mechanism). He named it. It is now his.

**Relationship with the Generate wizard:**
The wizard currently accepts `?type=Dog&breed=Labrador` query params to pre-seed. The
Explore-to-Generate journey already partially exists in code. This feature is partly a
UX connection, not a full new build.

---

### Tier 2 — Observe and Record

**Starting point:** Explore → tap a Wild / Sea animal → read the detail profile

**CTA on the Explore profile:** "Observe [Animal Name]" or "Add to Field Log"

**What happens:** The animal is logged to My Animals in an "observed" state. No wizard.
No naming (the animal is not Harry's — it is a Lion, not "his Lion"). No wizard friction.
This should be a single-tap action.

**End state:** The animal appears in My Animals in a visually distinct section (or with
a distinct visual treatment on the card). Harry can see all his observations. He can
tap through to re-read the profile at any time.

**What feels satisfying:** It is immediate — one tap and it is "mine" in the sense of
being in my collection. It rewards browsing and discovery. Over time, Harry builds a
field log of every wild and sea animal he has observed — this becomes a completionist goal.

**Open question for UX:** Can Harry "observe" the same animal multiple times, or is
it a single entry? A field log that allows multiple observation dates (like a real wildlife
journal) is richer, but adds data complexity.

---

### Tier 3 — Discover and Encounter

**Starting point:** Explore → tap a Lost World animal → read the detail profile

**CTA on the Explore profile:** "Discover [Animal Name]" or "Find in Lost World"

**What happens:** An encounter sequence — brief, dramatic, distinct from the Observe flow.
Could be a mini-animation, a discovery card, or a short narrative reveal. The animal is
logged to My Animals as a discovery.

**End state:** The animal appears in My Animals under a "Discoveries" section or with a
fossil/expedition visual treatment. If naming is desired here, the name is an expedition
codename rather than a pet name (e.g., "Expedition Sigma" or "Discovery #47").

**What feels satisfying:** The rarity and spectacle of the encounter. A dinosaur discovery
should feel like an event, not a form submission.

**Note on the Generate wizard for Lost World:** The current wizard allows Harry to generate
a named dinosaur. Under the proposed model, a "Lost World" generate result would produce
a discovery, not an adoption. The wizard output for this category needs to be reconsidered
— either the wizard is gated so Lost World leads to discovery framing, or the wizard
remains the tool for fantasy naming (Use Case A) and is decoupled from the Explore journey
for this tier.
- Confidence: Medium. The Tier 3 journey is the most speculative. Owner input is needed
  before UX begins on the encounter sequence.

---

## 5. Name generation — two distinct flows

This is one of the most important findings in this document. The owner's description reveals
that name generation serves two completely different needs. These must be separated in the UX.

### Flow 1 — Creative naming tool (for Xbox, for fun — Use Cases A and B)

**What it is:** A name generator that produces names Harry can use anywhere — for Xbox
characters, for imaginative play, for fun — without creating an animal in his collection.

**What it needs:**
- A clean, fast wizard that focuses on personality and animal type (the inputs that shape
  the name quality)
- The ability to regenerate names many times without restarting
- A "copy name" or "save idea" action that does not trigger an adoption
- No commitment to the collection — Harry can close the screen with nothing added to My Animals
- Potentially a dedicated "Name Ideas" or "Saved Names" list that is separate from his
  actual adopted pet collection

**What the current design does instead:**
The Generate wizard ends with a result screen that has an adoption CTA and a save-to-history
action. The history tab is buried inside the Generate screen. There is no concept of a
"name ideas" list separate from adopted animals. The wizard always implies that Harry is
about to adopt — the language, the flow, and the animations all frame the result as
an animal Harry will keep.

**Recommended model:**
The Generate screen becomes explicitly a "name generator" tool with two exit paths:
1. "Save name idea" — stores the name in a separate ideas list, no animal created
2. "Rescue / Adopt this animal" — creates the animal in My Animals (for Tier 1 animal types only)

For Tier 2 and Tier 3 animal types generated through the wizard (a Tiger, a T-Rex), the
"adopt" path should either be absent, replaced with "Add to field log" (Tier 2) or
"Record discovery" (Tier 3), or made explicit that this is a fantasy character, not
a collection animal.
- Confidence: High that the current design conflates two flows. Medium-high on the recommended
  separation. Requires owner validation before UX designs the exit paths.

---

### Flow 2 — Naming an animal you are adopting from Explore (Use Case C)

**What it is:** Harry has found a specific Thoroughbred on the Explore screen and wants
to rescue it. He needs to name it before it joins his collection. This is the naming step
of an adoption journey — not a standalone creative tool.

**What it needs:**
- Pre-seeding from the Explore profile — the category and type are already known, possibly
  the breed too
- A shorter wizard (personality, age, colour only — category, type, and breed are already set)
- A name that feels like it was generated for this specific animal, not a random result
- A clear "this is your animal now" moment at the end

**What the current design does well:**
The query param pre-seeding (`?type=Dog&breed=Labrador`) already exists for the wizard.
The `AdoptionOverlay` provides a celebratory moment. These are good foundations.

**What needs to change:**
The wizard currently shows all 7 steps even when some are pre-filled. For the Explore-to-Adopt
journey, showing category and type steps that Harry did not choose is confusing — he knows
what animal he is adopting. The UX Designer should consider whether the wizard skips
pre-filled steps entirely (auto-advancing past them) or collapses them into a "you chose:
[Thoroughbred]" confirmation before proceeding to the remaining choices.

**Note on Tier 2 and 3 animals from Explore:**
If Harry taps "Observe" on a Lion in Explore, there is no naming step — the observation
is nameless. The wizard is not involved. The name generator (Flow 1) remains available
separately if Harry wants to generate a fantasy Lion name for Xbox, but that is a
separate action.
- Confidence: High. Derived from code inspection of the current wizard pre-seeding mechanism
  and from the owner's description of how the flows differ.

---

## 6. My Animals differentiation — what Harry would expect to see

Currently, every animal in My Animals is a named, adopted pet. Under the proposed model,
My Animals would contain three relationship types. Harry's expectation — and the right
UX design — will differ across them.

### What Harry would expect for an adopted pet (Tier 1)

- His chosen name prominently displayed
- The animal's image, rarity, and breed
- Care indicators (wellbeing, streak)
- Actions: care, race (if applicable), sell
- A sense of "this is mine" — personal ownership framing

**Existing design:** Already serves this well. `PetDetailSheet` shows name, breed, rarity,
care streak, actions. This tier requires no change to the card treatment, only potential
refinement of the detail sheet.

---

### What Harry would expect for an observed wild/sea animal (Tier 2)

- The species name (not a personal name — "Lion," not "Simba")
- The date or approximate date it was observed (a field log has observation dates)
- A visual treatment that reads as "wildlife record" not "pet" — muted, natural, possibly
  showing a location or habitat icon rather than care indicators
- Actions: "learn more" (back to the Explore profile), "mark as favourite," no care actions
- No price, no sale listing, no care streak

**Visual differentiation signal:** The existing design uses the same card component for
all animals. A Tier 2 observation card must look different — not inferior, just different.
Consider: a landscape-format image (field guide style), a binoculars or telescope icon,
a location chip showing where this animal lives, no rarity badge in the conventional
sense (or a different one that signals "field record" rather than "collectible rarity").

---

### What Harry would expect for a Lost World discovery (Tier 3)

- The species name with a "discovered" framing (fossil icon, prehistoric atmosphere)
- A discovery date or discovery number
- A visual treatment that reads as "expedition record" — dark, dramatic, distinct from
  both pets and field observations
- Actions: "learn more," "share discovery" (speculative)
- No care actions, no racing, no selling

**Visual differentiation signal:** The most visually distinct of the three. Could use
a fossil or amber visual motif. The card should feel like a museum exhibit entry, not
a collection card or field log entry.

---

### How My Animals screen should handle three types

**Option A — Separate sections:** The screen has three labelled sections: "My Pets,"
"Field Log," "Discoveries." The FILTER_TABS already exist in the code (`All`, `At Home`,
`Stables`, etc.) — these could be supplemented or replaced by relationship-type filters.

**Option B — Unified grid with visual differentiation:** All animals in one grid, but
cards are visually different per type. The filter row adds "Pets | Observed | Discovered"
filters. This preserves the current layout approach.

**Option C — Separate tabs at the screen level:** A tab switcher between "Pets" and
"Field Log" (grouping Tier 2 and Tier 3 together or separately).

**UR recommendation:** The UX Designer should decide this based on the expected
volume of each type. If Harry has 20 pets, 30 observations, and 5 discoveries, a
unified grid with filters is probably correct. If the volumes are more equal, separate
tabs may aid navigation. This is a UX design decision, not a research finding — flagged
here as a question that must be answered in the interaction spec before Phase C.
- Confidence: High that differentiation is required. Low-medium on which layout pattern
  is best — this depends on volume assumptions the team does not currently have data on.

---

## 7. Risks and edge cases

### Risk 1 — "You can't adopt this animal" reads as rejection

**Finding:** The owner has explicitly flagged this. Harry is autistic. A clear message
of "you cannot have this" — even in a game — could land as rejection, particularly for
animals he has formed an attachment to through the detail view. An autistic child who
has spent time learning about elephants may feel rejected by a message that says
"elephants can't be adopted."

**Impact:** High. A design that frames the inability to adopt as a limitation could
actively harm Harry's experience of the app. This is not a minor copy issue — it is
a framing issue that affects the entire Tier 2 and Tier 3 journey model.

**Recommendation:**
- Never frame the Tier 2/3 CTA as a fallback from something Harry cannot do.
  Frame it as the best thing to do with this animal.
- The copy must celebrate the observation: "Wild animals belong in the wild —
  but you can track this one forever" is better than "You can't adopt a Lion."
- The "Observe" CTA must be presented as the primary and correct action for
  this animal, not as an alternative to adoption.
- There should be no visible "Adopt" button for Tier 2/3 animals that is then
  greyed out or locked. A greyed-out "Adopt" button says "you want this but
  you can't have it." The correct design is to not show the "Adopt" button
  at all, and to show "Observe" as the primary, positive CTA.
- Confidence: High. Derived from autism communication and UX literature on
  avoidance of "failure states" for autistic children. Prior UR findings also
  note Harry's likely sensitivity to rejection framing.
- Priority: High. Must be addressed in the interaction spec before Phase C begins.

---

### Risk 2 — Lost World animals already exist as adopted pets in the current app

**Finding:** The current Generate wizard includes Lost World as a category and allows
Harry to generate and adopt a T-Rex or a Pterosaur as a named pet. Under the proposed
model, Lost World animals would move to a discovery model. This creates a data migration
problem: Harry may already have named Lost World pets in his collection.

**Impact:** Medium-high. If the new design removes the adoption path for Lost World
animals, any existing Lost World pets in `SavedName` with `category: 'Lost World'`
would be in an inconsistent state — they are "pets" under the old model but should
be "discoveries" under the new one.

**Recommendation:** The Developer must audit the data migration path. Options include:
(a) grandfather existing Lost World adoptions (they remain as pets, new ones become
discoveries), or (b) migrate existing Lost World pets to the discovery tier with a
one-time UI message explaining the change. This is a data model concern that must be
raised in the dev-brief.
- Priority: High. A data migration without a plan is a data integrity risk.

---

### Risk 3 — The Generate wizard is currently category-agnostic for the adoption CTA

**Finding:** The ResultsScreen currently shows an adoption CTA regardless of the
category selected. If Harry generates a Wild Tiger through the wizard and is shown
an "Adopt" button, adopting a tiger into his collection is currently possible. The
proposed model would make this incorrect behaviour — tigers should either not be
adoptable through the wizard, or should become an "observation" entry, not a pet.

**Impact:** Medium. The wizard needs to gate the CTA by category/tier. This is a
logic change in the ResultsScreen.

**Recommendation:** The interaction spec must define how the wizard CTA changes
by category. Specifically: for Wild and Sea category results, does the wizard
produce a name-only output (Use Case A/B) or an observation entry (Tier 2 journey)?
The answer affects how the wizard steps and result screen are designed.
- Priority: Medium. Needs to be resolved in the interaction spec.

---

### Risk 4 — Name generator used for fantasy (Xbox) vs. app-internal adoption

**Finding:** Under the proposed model, the same wizard must serve two distinct purposes
(creative naming tool and adoption wizard). If these are not clearly separated in the UI,
Harry could accidentally adopt an animal he only wanted a name for, or could save a name
idea and not understand why his animal is not in My Animals.

**Recommendation:** The UX Designer must make the exit paths after the result screen
explicit and visually distinct. "Save this name idea" and "Rescue this animal" must
look and feel different — different CTA sizes, different colours, different positions.
The default action (the largest, most prominent button) should match what Harry is
most likely to want: if the wizard was entered from Explore, adoption is the default;
if entered standalone, naming is the default.
- Priority: Medium.

---

### Risk 5 — Farm animals as pets vs. food

**Finding:** The Farm category includes cows, pigs, sheep, and chickens. Children are
generally aware of the dual status of farm animals. For most 8–12 year olds this is not
a problem — they can hold "pet cow" and "food cow" as separate concepts. However, for
some children (particularly those who are empathetic or anxious), naming a pig and then
seeing it listed for sale in the marketplace may create discomfort.

**Impact:** Low for most children. Potentially medium for Harry depending on his
specific sensitivities (not known from available evidence).

**Recommendation:** This is flagged for the owner to assess based on knowledge of
Harry that the research team does not have. No design change is recommended at this stage.
- Priority: Low.

---

### Risk 6 — "Observe" as a meaningful action vs. a tap that goes nowhere

**Finding:** If "Observe" adds a Wild animal to My Animals but there is nothing to
do with it there — no action, no learning hook, no completionist hook — it will stop
feeling rewarding after the first few times. The risk is that the observation tier
becomes a thin feature that Harry uses once and ignores.

**Recommendation:** The observation record must have something to do:
- A "last observed" or "observation count" indicator (encourages revisiting)
- A learning nudge — "did you know [this animal's superpower]?" visible on the collection card
- A completionist hook — "You've observed 5/12 Wild animals" visible in My Animals
- The Explore profile should show "Observed" status when Harry has already logged this animal
- Confidence: Medium. Based on game design literature on repeat engagement with observation mechanics.
- Priority: Medium.

---

### Risk 7 — Category ambiguity at the edges

**Finding:** Some animals sit at category boundaries that may not feel obvious to a child.
Fish are listed as At Home (domestic fish in a tank) but sharks are Sea — yet both are fish.
Horses are Stables (adoptable) but wild horses (mustangs) are listed in Stables with an epic
rarity — should a Mustang be "rescued" or "observed"?

Seahorses appear in the Sea category (observe tier) even though seahorses are commonly kept
in aquariums. A child who knows this may find it confusing that they can "rescue" a goldfish
but can only "observe" a seahorse.

**Recommendation:** The category-to-tier mapping should follow the app's existing category
taxonomy (`DOMESTIC_CATEGORIES` / `WILD_CATEGORIES`), not individual animal biology. This
creates some edge cases but is predictable and consistent. The key is that the rule is applied
at the category level, not the animal level — every At Home animal is rescuable, every Wild
and Sea animal is observable. Exceptions would create inconsistency that is confusing for
an autistic child who relies on predictable systems.

The Mustang edge case (it exists in Stables, not Wild) means it would be rescuable under
this model — which is actually appropriate, as wild horse adoption and rescue programmes
do exist in the real world.
- Confidence: Medium. The category-level rule is the simplest consistent approach.
- Priority: Medium.

---

## 8. Recommendations for UX

These are constraints and ideas the UX Designer should build on. They are grounded in
the findings above.

### R1 — Separate name-for-fun from name-to-adopt explicitly in the Generate wizard entry point

The wizard must communicate its purpose before Harry starts. Consider two entry points:
one labelled for naming ("Create a name"), one for finding an animal to rescue ("Find an animal
to rescue"). These could be two buttons on a landing step or two separate routes into the
same wizard. The UX Designer must decide the interaction model — but the two purposes must
be explicit, not implicit.

### R2 — The Explore profile CTA must be tier-specific and positive

For Tier 1 (At Home, Stables, Farm): **"Rescue [Animal Name]"** as primary CTA.
For Tier 2 (Wild, Sea): **"Observe"** or **"Add to Field Log"** as primary CTA.
For Tier 3 (Lost World): **"Discover"** or **"Record Expedition"** as primary CTA.

Do not show the wrong CTA as greyed-out. Do not use negative framing ("cannot be adopted").
Each CTA is the right and best thing to do with that animal. Framing is everything here.

### R3 — My Animals must visually separate the three relationship types

The card component for observed animals and discovered animals must look different from
pet cards. Specifically: observed animals should not show a personal name, should not
show care indicators, and should use a visual language that reads as "field record."
Discovery records should be the most visually distinct — prehistoric, dramatic, trophy-like.

The existing `PetCard` component is the correct reference for Tier 1 only. The UX Designer
must design new card variants for Tier 2 and Tier 3 and include their full anatomy in
the interaction spec (per CLAUDE.md spec requirement — card anatomy section is mandatory).

### R4 — The wizard pre-seeding for adoption journeys should skip visible category/type steps

When Harry enters the wizard from an Explore profile ("Rescue this Labrador"), he should
not be shown the category or type selection steps he has already implicitly made. Pre-filled
steps should be either auto-advanced silently or shown as a confirmation chip ("You're rescuing
a Labrador") before Harry proceeds to the open choices (personality, age, colour, breed).

### R5 — Completionist hooks are required for the observation tier

The "Field Log" section of My Animals should show Harry's progress toward observing every
Wild and Sea animal. A count like "17 of 45 Wild animals observed" gives the observation
tier long-term replay value. Without a completionist hook, the observation mechanic is
a single-use feature.

### R6 — The "Save name idea" exit from the wizard must be clearly differentiated from adoption

The result screen needs a hierarchy of two actions:
- Primary: the relationship action appropriate to the animal type (rescue / observe / discover)
- Secondary: "Save as name idea only" — clearly labelled, clearly less prominent

The secondary action must not feel like Harry failed to adopt. It must feel like a
deliberate choice: "I just wanted a cool name."

### R7 — Observe action from Explore should be a single tap (no wizard)

The friction model for each tier differs:
- Rescue: high friction is acceptable (wizard, naming, celebration) because the commitment is real
- Observe: low friction is required (one tap, immediate logging) because the observation is
  a browsing behaviour, not a commitment
- Discover: medium friction (a brief encounter sequence) because the event is special but not
  a long commitment

Requiring Harry to go through the Generate wizard to observe a wild animal would break the
browsing flow. Observation must be instant.

### R8 — Address the data model gap in the dev-brief

The current `SavedName` schema has `status: 'active' | 'for_sale'` and `category` but no
`relationshipType` field to distinguish pets from observations from discoveries. The Developer
must extend the schema before Phase C begins. This is not a cosmetic change — it affects
filtering, display, available actions, and the My Animals screen's component logic.

A suggested extension: add `relationshipType: 'pet' | 'observed' | 'discovered'` to `SavedName`,
with a migration that sets all existing records to `'pet'`. This is the simplest approach
that does not break existing data.

---

## Summary — confidence levels

| Finding | Confidence | Basis |
|---------|------------|-------|
| Three use cases are genuinely distinct and currently conflated | High | Owner's description + code inspection |
| Tier 1/2/3 model maps to the owner's intent | High | Owner's verbatim direction |
| "You can't adopt this" framing is a rejection risk for Harry | High | Autism UX literature; prior UR findings |
| Lost World animals are already adoptable in current app — data migration needed | High | Code inspection (`generateOptions.ts`, `db.ts`) |
| Observe CTA must be single-tap, no wizard | High | Friction model analysis |
| Three card variants needed in My Animals | High | Code inspection — current `PetCard` is pet-only |
| "Rescue" framing is richer than "Adopt" for Tier 1 | Medium-high | Child motivation literature; owner language |
| Completionist hooks are required for observation tier to have replay value | Medium | Game design literature |
| Farm animal edge cases (pig as pet) are low risk | Low-medium | General child development literature; Harry-specific sensitivity unknown |
| Lost World generates wizard must be reconsidered for CTA | High | Code inspection |
| Wizard pre-seeding skipping visible steps is the right UX | Medium | Inferred from wizard flow analysis; not validated |

---

## Open questions for the UX Designer and Product Owner

| # | Question | Who answers | Priority |
|---|----------|-------------|----------|
| OQ-1 | Does "Rescue" replace "Adopt" as the primary CTA label for Tier 1 animals? | Product Owner | High |
| OQ-2 | What happens when Harry generates a Wild or Sea animal in the wizard — does it produce a name-only result, an observation entry, or a blocked action? | UX Designer + Product Owner | High |
| OQ-3 | How should existing Lost World pets (already adopted under the old model) be handled — grandfather or migrate? | Developer + Product Owner | High |
| OQ-4 | Does My Animals use separate sections (Pets / Field Log / Discoveries) or a unified grid with filter pills? This decision must appear in the interaction spec before Phase C begins. | UX Designer | High |
| OQ-5 | Can Harry observe the same wild animal multiple times (multiple observation dates) or is it a one-time log entry? | Product Owner | Medium |
| OQ-6 | What is the encounter sequence for a Tier 3 discovery — is it a mini animation, a narrative card, or simply an instant log action? | UX Designer + Product Owner | Medium |
| OQ-7 | Should observations and discoveries have their own care/engagement mechanic, or are they truly passive records? | Product Owner | Medium |
| OQ-8 | What is the completionist hook for observations — is "17 of 45 Wild animals observed" the right model, or is there a different progress framing? | Product Owner | Medium |
| OQ-9 | Is the Generate wizard retained as a standalone screen (for Use Cases A and B) while a shorter adoption flow is introduced for Use Case C, or does one wizard serve all three uses? | UX Designer + Product Owner | High |
| OQ-10 | How does the "save name idea" flow work — does it save to the existing `HistoryEntry` table, or does it need a new "name ideas" data structure? | Developer + UX Designer | Medium |

---

## Assumptions flagged

The following assumptions are embedded in this document. They are stated explicitly, not
treated as facts.

- **A1:** Harry is the sole user. If a parent occasionally uses the app, the framing choices
  (especially "rescue" language and the ADHD/autism accommodation notes) may not hold for
  all users.
- **A2:** Harry understands and accepts that wild animals cannot be owned as pets. This is
  assumed based on general child development literature for this age range. If Harry
  specifically has difficulty with this concept, the rejection risk (Risk 1) is amplified.
- **A3:** The three-tier model (adopt / observe / discover) maps cleanly onto the existing
  six categories. The assumption is that the category taxonomy is correct and consistent.
  Edge cases (seahorses, mustangs) are identified in Risk 7 and handled by applying the
  rule at category level.
- **A4:** Harry will find observation and discovery intrinsically rewarding without a
  coin/XP mechanic attached to them. If he only engages with features that give coins,
  the Observe and Discover flows need economic incentives that are not currently designed.
  This is flagged for the Product Owner.

---

## Sign-off

UR findings complete. UX Designer and Product Owner may proceed to Phase A (UX) and Phase B.

The highest-priority findings for the interaction spec to address before Phase C begins are:

1. **Rejection risk (Risk 1):** The CTA framing for Tier 2 and Tier 3 animals must be
   explicitly positive. No greyed-out "Adopt" buttons. No negative framing.
2. **Data model gap (Recommendation R8):** `relationshipType` field must be added to
   `SavedName` schema before any Phase C work begins.
3. **Open Questions OQ-1, OQ-3, OQ-4, and OQ-9** require owner resolution before
   UX can finalise the interaction spec.

[ ] High-risk findings (Risk 1, Risk 2, Risk 3) have been reviewed by [OWNER] before UX begins.
