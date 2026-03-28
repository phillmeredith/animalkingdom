# UR Findings — Schleich Collection Tracker

**Feature:** schleich-collection-tracker
**Phase:** A (parallel with UX)
**Date:** 2026-03-28
**Researcher note:** This is a new section of the app with no prior implementation to audit.
Findings are drawn from: the Schleich data file (566 items across 5 categories), the existing
UR briefs and interaction specs for Explore, Racing, and other features, the design system
documentation, and established research on ADHD, autism, and childhood information-seeking
behaviour. No primary research with Harry has been conducted. All confidence levels are stated
explicitly and should be treated as inputs to the UX spec, not confirmed facts.

---

## 1. User Need Statement

Harry collects Schleich animal figurines in real life. He acquires them over time — as birthday
and Christmas gifts, from pocket money, or found in shops — and builds a physical collection.
That collection lives on a shelf or in a box; it has no digital mirror.

**What Harry is trying to accomplish:**

He wants to know what he has, see what he does not have yet, and find specific figurines he is
thinking about — whether to show an adult, to add to a wish list, or simply to look at.

**Why this matters to him:**

For a child who collects physical objects, the act of cataloguing is itself pleasurable. The
collection is not just the objects — it is the knowledge of the objects: which ones he has, how
many there are, which ones are still to get. A digital catalogue turns a passive shelf into an
active inventory he can browse, complete, and show off.

Horses are Harry's primary Schleich interest (198 of 566 items, the largest single category).
The collection tracker is, at its core, a horse catalogue with other categories alongside it.
The UX must treat horses as the default and primary entry point, even though the feature covers
all five categories equally.

**The need in user need format:**

> As a child who collects Schleich figurines, I need to browse all available figurines and mark
> which ones I own, so that I can see my collection, find things I want next, and share what I
> have with others.

---

## 2. Key Assumptions to Validate

These are things the feature design will implicitly rely on. Each is assessed for likelihood of
being correct and the consequence if it is wrong.

| # | Assumption | Confidence | Consequence if wrong |
|---|------------|------------|----------------------|
| A1 | Harry knows the names of his Schleich figurines and can find them by name or image | Medium | If he does not search by name, the search bar is low-value and category browsing is the primary navigation mode — weight the category UX more heavily |
| A2 | Harry will mark items as owned immediately when he sees them rather than doing a one-off "setup" session | Low | If he does a setup session (marks many items at once), the single-tap interaction must support rapid sequential tapping without confirmation dialogs |
| A3 | Harry will return to the tracker regularly to add newly acquired figurines | Medium | If he only uses it occasionally, the "My Collection" tab needs to be compelling enough to warrant return visits — a count milestone or progress signal may help |
| A4 | The 566-item catalogue can be adequately navigated with a category filter + search | High | 566 items is large but structured into 5 categories (max 198). With a category filter, the heaviest category (horses) is 198 items — manageable in a grid. No pagination is needed if performance is adequate |
| A5 | Harry will understand "tap to mark as owned" without explanation | Medium | The owned state must be visually unambiguous and the tap action must provide immediate feedback. If the model is unclear, confusion will cause mis-taps |
| A6 | Harry will want to see his owned items separately (My Collection tab) | High | Children who collect are strongly motivated by the concept of "what is mine" — a separate owned view is a primary use case, not a secondary one |
| A7 | Harry will use this feature on iPad in portrait or landscape | High | The app is iPad-first. The collection tracker must be functional and non-sparse at 1024px. A grid that looks good on phone but has three-word cards spread across a wide layout is an incomplete build |
| A8 | Descriptions are useful to Harry | Low | The Schleich descriptions are long (often 100–250 words of marketing copy). A child browsing at speed will not read them. They may be useful on a detail view but should not appear in the grid card |
| A9 | Item images are the primary identifier, not item names | High | Schleich names are often obscure ("Pura Raza Espanola Mare", "Lusitano mare") — Harry almost certainly identifies figurines by image first, then name. The image must be the hero of every card |
| A10 | Category-switching needs to be fast and obvious | High | With 566 items, Harry will navigate primarily by category tab/pill, not by scrolling. Category switching is likely the most frequent interaction after initial load |

---

## 3. Usage Patterns

### 3a. Flows by frequency (estimated)

These flows are estimated from the feature context and Harry's known use patterns from other
app areas. No usage data exists yet. These estimates should inform the visual hierarchy of the
screen design.

**Most frequent — browsing within a category:**
Harry opens the tracker to a category (most likely Horses), scrolls through the grid, and
looks at figurines. No action taken — pure browsing. This is the equivalent of flicking
through a toy catalogue.

Implication: The grid must be visually satisfying to scroll. Images must be large. The
loading experience must be fast (images may be remote URLs — fallback states matter).

**Second most frequent — marking a new acquisition as owned:**
Harry gets a new figurine and opens the app to mark it. He knows which one it is (or
approximately). He needs to either search by name or find it in the category. Taps it to
mark it owned. Feels the satisfaction of the owned state appearing.

Implication: The path from opening the section to marking owned must be no more than 3 taps.
The owned marking interaction must be immediate (no confirmation dialog), reversible (in case
of mis-tap), and visually rewarding.

**Third most frequent — viewing My Collection:**
Harry opens the "My Collection" view to see all his owned figurines in one place. This may
be to show a parent, to count them, or simply to look at his collection.

Implication: The My Collection view is a first-class destination, not an afterthought. It
must feel like a gallery, not a filtered list.

**Least frequent — searching for a specific figurine:**
Harry has a specific figurine in mind and uses search to find it. This is likely rare because
he will typically browse by category rather than recall the exact name of a figurine.

Implication: Search is a secondary navigation mode. It must exist and work well, but the
category filter + image grid is the primary navigation pattern.

### 3b. Sessions will likely be short

Harry is 7–8 years old with ADHD. Sessions in this section are likely to be under 5 minutes.
Long registration sessions (marking many owned items at once) are unlikely — he will probably
mark items as he acquires them, one or a few at a time.

However: when first accessing the feature, he may want to mark everything he currently owns.
This is a "setup" session that could involve 20–50 taps in sequence. The owned interaction
must support this without being exhausting.

---

## 4. Friction Points to Avoid

These are specific failure modes that would make the feature frustrating for Harry. They are
derived from his known profile (ADHD, autism, 7–8 years old, iPad primary device) and from
patterns observed in other feature specs.

### F-01: Too many taps to mark ownership (HIGH PRIORITY)
If marking an item as owned requires: tap item to open detail view, then tap "Mark as owned"
button, then confirm — that is 3 taps minimum plus a confirmation. For a setup session with
40 figurines, this is 120 taps. This will cause abandonment.

Recommendation to UX: the owned toggle must be reachable in 1 tap from the grid. Either
the toggle lives on the card directly (a visible button or checkmark), or tapping the card
toggles owned immediately. The detail view, if it exists, should also toggle owned in 1 tap.

### F-02: Unclear owned state on cards (HIGH PRIORITY)
If the owned vs. not-owned state is communicated only by a subtle colour change or a small
icon, Harry will mis-tap and not be sure whether the tap registered. ADHD creates difficulty
with uncertain feedback loops — the action must produce an immediate, unambiguous visual
change.

Recommendation to UX: the owned state must change the card's visual appearance significantly
— not just a border colour change. A checkmark overlay, a badge, or a background tint change.
The transition must be animated (but respect reduced motion).

### F-03: Long names obscuring the figurine in the grid (MEDIUM)
Schleich names are often long and product-specific. "HORSE CLUB Hannah & Cayenne" or
"Groom with Icelandic pony mare" will not fit on a small card. Truncating to one line loses
information; wrapping onto two lines makes the grid dense.

Recommendation to UX: names should be truncated to one line with ellipsis. The image is the
primary identifier. Names serve as confirmation once the image is recognised.

### F-04: Slow image loading breaking the browse experience (MEDIUM)
The Schleich images are CDN-hosted Shopify URLs. On a slow connection, images will load
progressively, leaving blank spaces in the grid. For a child expecting a visual catalogue,
blank spaces break the browsing experience.

Recommendation to UX/Dev: every card must have a skeleton or placeholder state. The
placeholder should suggest the shape of the content (an animal silhouette or a
category-coloured background), not show a broken image icon.

### F-05: The "My Collection" empty state being discouraging (MEDIUM)
On first use, My Collection is empty. An empty grid with no prompt is deadening — it
communicates "you have nothing" rather than "here is where your collection will live".

The empty state must be warm and motivating: a prompt to start marking figurines, not a
neutral blank.

### F-06: Category names being hard to parse (LOW)
The raw Schleich category identifiers (`horses`, `farm-animals-farm-toys`,
`wild-animals-adventure`, `dinosaurs-and-volcano`, `monsters-and-dragons`) are URL slugs, not
display labels. Rendering them verbatim as filter pills would be both ugly and hard to scan.

Recommendation to UX: define display labels for each category. See section 5 for
recommended labels.

### F-07: 566-item grid without a filter being overwhelming (HIGH PRIORITY)
If the screen opens with all 566 items visible and no active filter, the initial view will
show a very long grid. For a child with ADHD this is visually overwhelming and the
scroll-to-find task becomes impossible.

Recommendation to UX: the screen must open with a default category active — Horses is the
natural default given Harry's interest. "All" should be available but should not be the
opening state.

---

## 5. Category Behaviour

### 5a. Catalogue breakdown

| Category slug | Recommended display label | Item count | Priority for Harry |
|---|---|---|---|
| `horses` | Horses | 198 | Primary — his main collection |
| `wild-animals-adventure` | Wild Animals | 116 | Secondary — adventure animals |
| `farm-animals-farm-toys` | Farm | 111 | Secondary |
| `monsters-and-dragons` | Monsters | 74 | Unknown — may appeal |
| `dinosaurs-and-volcano` | Dinosaurs | 67 | Unknown — common childhood interest |

Harry collects horses specifically. Horses at 198 items is the largest single category and
constitutes 35% of the total catalogue. It should be the default active category on screen
open.

### 5b. Category filter behaviour recommendations

The category filter should behave as a mutually exclusive selector (one active at a time),
matching the existing `CategoryPills` pattern in Explore. An "All" option should exist but
should not be the default.

The filter must be persistent within a session — if Harry switches from Horses to Dinosaurs
and back, the scroll position within Horses should ideally be preserved (though scroll
restoration is a Phase C concern, not a UX spec concern).

### 5c. Combined filter + search behaviour

When a category filter is active and Harry searches, search should operate within the active
category. This reduces the result set to a manageable size and prevents a "Groom" search
returning results from Farm that Harry did not intend to see.

However: if search returns zero results within the active category, the feature should offer
to search across all categories. This is a sensible fallback — Harry may not know which
category a figurine belongs to.

Confidence: medium. This "search within category" behaviour is an inference from how similar
catalogue apps work. It should be noted as a design decision for the UX to resolve explicitly.

### 5d. The "My Collection" view should not require a category filter

When Harry views "My Collection", he wants to see everything he owns, regardless of category.
Category filtering in the My Collection view would fragment his owned items unnecessarily.

The My Collection view may offer a category filter as an optional secondary tool, but it
should not be required or shown prominently. The primary My Collection experience is all
owned items in one grid.

---

## 6. "Owned" Interaction

### 6a. Recommended interaction model

**Single tap on the card toggles owned state. No confirmation required.**

Rationale:
- Harry will be in browsing mode. A confirmation dialog breaks the scanning flow.
- The owned state is easily reversible — a mis-tap can be corrected with another tap.
- For a setup session marking many items at once, the lack of confirmation makes rapid
  sequential tapping possible.
- The design system's accessibility baseline requires visual feedback within 200ms — a
  confirmation dialog cannot meet this for the desired "immediate" feedback character.

Confidence: high (derived from known ADHD user profile and the reversibility of the action).

### 6b. What the owned state must communicate

The card in owned state must be visually distinct from the card in unowned state in a way
that is:
- Immediately visible when scanning the grid (not a subtle change)
- Not reliant on colour alone (accessibility requirement from the DS)
- Consistent with the DS token system (no new colours invented)

Appropriate signals:
- A green checkmark badge on the card (using `--green-sub` / `--green-t` — matching the
  existing "OWNED" pill in the Shop Item Card spec)
- A background tint (the card background steps from `--card` to `--elev` or adds a faint
  green tint)
- The border changes to `--green` in owned state

Exactly which of these signals the UX designer chooses is a UX decision. The UR finding is
that at least two signals must be combined (badge + colour change, or badge + border), and
the badge must include text or an icon — not colour alone.

### 6c. Undo / reversal

The owned state must be reversible by tapping the card again. There should be no "are you
sure?" prompt. The owned state is not permanent data in the same way that a purchase is —
it is a soft label that Harry can update freely.

If Harry mis-taps, he should be able to correct it immediately without navigating away.

### 6d. What the interaction must not include

- A bottom sheet or modal to confirm ownership
- A mandatory "how many do I own?" counter — this adds friction. Quantity tracking is not
  in scope for this feature.
- An undo toast — while toasts are used elsewhere in the app, an undo toast for an owned
  toggle is over-engineered for this interaction type.

---

## 7. Empty Collection State

Harry will arrive at "My Collection" with zero owned items on first use. This is a critical
moment — if the empty state communicates failure or emptiness, it sets a negative first
impression for the entire feature.

### 7a. What the empty state must do

- Communicate that this is where his collection will live — a positive, forward-looking message
- Give Harry a clear path to start marking items (a CTA that takes him to browse)
- Feel warm and age-appropriate, not clinical

### 7b. Suggested empty state structure (UR recommendation — not a UX spec decision)

- An image or illustration representing a Schleich-style collection (not an emoji — per DS rules,
  use a Lucide icon or an image asset)
- Headline: something like "No figurines yet"
- Supporting text: a single short sentence inviting him to browse and mark what he has
- A button taking him to the catalogue (All items view or Horses as default)

### 7c. What the empty state must not include

- A count of zero (e.g. "0 items owned") — counting to zero emphasises absence
- Instructions in multiple steps — one CTA, one message
- Any suggestion of failure ("You haven't added anything yet" has a slightly accusatory tone)

Confidence: medium. Empty state copy is sensitive and the exact wording should be reviewed
with the owner. The structural recommendations (icon, headline, single CTA) are well-supported
by research on child-facing empty states.

---

## 8. Discoverability

### 8a. Nav positioning

This is a new section requiring a new nav item. The current bottom nav has 5 tabs:
Home, Explore, Animals, Play, Shop.

A sixth tab for Collection would require either:
- Replacing one of the five existing tabs
- Extending to a six-tab nav (risking overflow or too-small tap targets)
- Nesting the tracker within an existing tab (Explore or Animals being most thematically relevant)

This is a significant UX decision that UR cannot make alone, but the following is flagged as
a risk:

**Risk: Adding a sixth nav item at full-width nav will compress all tap targets below the 44px
minimum.** The current nav has 5 items. On an iPad at 1024px, 5 items = 204px per item, well
within spec. Adding a sixth = 170px per item — still comfortable. On phone at 375px, 5 items
= 75px per item. Six items = 62px per item — still above 44px minimum. So a sixth tab is
technically feasible at both breakpoints.

**However:** the visual density of 6 tabs on a phone at 375px is high. This should be
verified in the UX spec and flagged in the Phase C self-review.

Confidence on nav feasibility: medium. A sixth tab works numerically but the visual
consistency with the existing nav (which has been styled and tested at 5 items) must be
explicitly verified by the UX designer.

### 8b. Nav label and icon

For a child user, the nav label must be a single common word they immediately understand.
Candidate labels and their risks:

| Label | Assessment |
|---|---|
| "Collection" | Clear, but 10 characters — may truncate on phone at small font sizes |
| "My Toys" | Direct, age-appropriate, but "Toys" implies physical objects which may be confusing next to virtual animals |
| "Schleich" | Brand-specific — Harry knows this word, but it is longer (7 chars) and may confuse users unfamiliar with the brand |
| "Collect" | Verb form — may be confusing as a noun tab label |
| "Figures" | Clear enough, but less natural in children's vocabulary than "Collection" |

UR recommendation: "Collection" is the strongest label. The app already uses noun-form tab
labels (Explore, Animals, Play, Shop). "Collection" fits this pattern.

For the icon, the DS requires Lucide icons only. Candidate Lucide icons:
- `Package` — represents a box/collection
- `BookOpen` — represents a catalogue
- `Grid3x3` — represents a grid view
- `Star` — represents collecting / favourites (risk: already used elsewhere in DS for other purposes)
- `Archive` — represents a stored collection

UR recommendation: `Package` or `BookOpen`. Final icon selection is a UX decision, but the
UR flagging is that the icon must not suggest "virtual items" (which could be confused with
the virtual animals in the Animals tab) — it should suggest "physical items" or "a catalogue".

Confidence: low. Icon selection for a new nav tab requires user testing to confirm Harry
immediately understands what section he is entering. This is a genuine knowledge gap (see
section 9).

### 8c. First-launch onboarding

There is no existing onboarding pattern in the app for new sections. Harry will encounter
this section for the first time without explanation. Two approaches:

1. Make the UI self-explanatory through visual affordances (cards clearly showing an owned
   toggle, category default immediately visible)
2. A one-time introductory message in the empty "My Collection" state on first use

UR recommendation: approach 1 should be the primary method. The UI must explain itself.
Approach 2 (a one-time message) is a valid addition but must not be the only onboarding —
Harry may arrive at the Catalogue tab first and never see the Collection tab message.

---

## 9. Knowledge Gaps

These are questions we cannot answer from available evidence. Each is rated by its impact on
the design and a recommendation for how to proceed.

| # | Gap | Impact | Recommendation |
|---|-----|--------|----------------|
| G-01 | We do not know which Schleich figurines Harry currently owns | High — if we knew, we could pre-populate the collection state. Without it, Harry starts from zero | Accept as risk. The empty state must be designed for zero-owned launch. Note for future: parent could manually add initial data |
| G-02 | We do not know whether Harry identifies figurines by image, name, or product code | High — determines whether image size or searchability is the primary design lever | Assume image-first based on the visual nature of Schleich products and Harry's age. Low risk if wrong, as both signals are present on the card |
| G-03 | We do not know Harry's reading level or whether he will attempt to read figurine descriptions | Medium — if he reads them, descriptions add value on a detail view; if not, they are noise | Assume minimal reading on the grid. Provide descriptions on a tap-through detail view only |
| G-04 | We do not know how many Schleich figurines Harry currently owns (could be 5 or 50) | Medium — affects the density of the "setup session" and how long marking all owned items will take | Design for a 20–50 item setup session as a realistic upper bound. Single-tap owned toggle is critical for this |
| G-05 | We do not know whether Harry uses this app independently or with a parent present | Medium — if with a parent, complexity is more tolerable; if independently, the UI must be fully self-explanatory | Assume independent use, consistent with the rest of the app which is designed for solo child use |
| G-06 | We do not know whether Harry will want to share his collection (e.g. show a parent) | Low — the "My Collection" view is useful for sharing regardless of whether it is the primary motivation | Design the My Collection view to be shareable-looking (not dense or raw) even if sharing is not an explicit feature |
| G-07 | We do not know whether the "monsters" or "dinosaurs" categories are relevant to Harry's collection | Low — these categories are included regardless; the feature serves the whole catalogue | Horses as default is sufficient to serve Harry's primary interest |
| G-08 | We do not know whether Harry would find a "wish list" (items he wants but does not own) useful | Low for this feature (not in scope) but potentially high for a future iteration | Flag as a post-launch enhancement to investigate. Do not design for it now. |
| G-09 | We do not know whether Harry would find an "item count" or "completion percentage" motivating | Medium — for ADHD profiles, quantified progress can be highly motivating; but it can also create anxiety about an unreachable total (566 is a lot) | If progress indicators are added, base them on category completion (e.g. "32 of 198 horses") rather than total catalogue completion. Total completion percentage against 566 would feel unachievable |
| G-10 | We do not know which Lucide icon Harry will immediately associate with "my collection" | Medium — wrong icon increases confusion on nav | Low risk of serious harm (he will explore and find the section); design decision can be revised post-launch |

---

## 10. Accommodations

### 10a. ADHD accommodations required for this feature

**Immediate visual feedback on owned toggle (200ms):**
The DS accessibility baseline requires visual feedback within 200ms of a user action. For
the owned toggle specifically, this means the card state must update on-screen before any
database write confirms. Optimistic UI is appropriate here — mark the card as owned
immediately in local state, write to the database in the background.

**No confirmation dialogs for owned toggle:**
As established in section 6, confirmation dialogs break the scanning flow. They introduce
a delay between decision and feedback that disrupts the ADHD user experience. The owned
action must be immediate and reversible.

**Category filter reduces cognitive load:**
Presenting 566 items in an unfiltered grid is an ADHD anti-pattern. The default
Horses-filtered view (198 items) is still large but is the expected content area. The UX must
never land on an "All 566" default view.

**Consistent card anatomy:**
The DS and existing UR briefs establish that consistent card anatomy (same image position,
same text hierarchy, same badge position on every card) is important for Harry. This applies
here: every Schleich card must use the same layout regardless of category.

**Short item names on cards:**
Names must be truncated to 1–2 lines maximum. Variable-length names that reflow the grid
create visual inconsistency that distracts from the browse experience.

### 10b. Autism accommodations required for this feature

**Predictable owned state:**
The owned state must always look the same — not "sometimes a checkmark, sometimes a tint
depending on the card". The owned visual treatment must be defined once and applied
consistently everywhere the figurine appears (catalogue view and My Collection view).

**No ambiguous partially-owned states:**
Either Harry owns it or he does not. There must be no intermediate state (e.g. "wishlist")
that creates ambiguity. This feature is binary: owned or not owned.

**Stable grid layout:**
When Harry marks an item as owned, the card should not move (e.g. jump to the top of the
list, or sort differently). The grid position of a card must remain stable when its state
changes. Movement within the grid after a tap is disorienting.

Exception: in "My Collection" view, newly added items may appear. This view is specifically
about owned items and Harry expects its content to reflect only owned items. Stability in the
Catalogue view is the non-negotiable; the My Collection view will naturally change as items
are added.

**No sounds or notifications for owned toggle (unless already established in app):**
The existing app uses toast notifications for significant actions (coin earn, daily bonus).
The owned toggle is a personal cataloguing action, not a "reward moment". A toast for
marking a figurine as owned would be over-engineered and potentially startling. The visual
change on the card is sufficient feedback.

Confidence: high. This follows directly from the DS principle that notifications should be
reserved for events with material consequence (coin changes, game completions).

### 10c. Reading support

Several Schleich figurine names contain Latin breed names ("Pura Raza Espanola Mare",
"Lusitano mare") or technical horse terminology ("Oldenburger Foal", "Hannoverian Gelding")
that a 7-year-old is unlikely to be able to read or recognise.

The image is Harry's primary identifier. Names are secondary confirmation. The UX should
reflect this hierarchy by:
- Making images significantly larger than text on cards
- Not penalising the experience if Harry cannot read the name (the image tells him what
  it is)
- Not requiring Harry to type a name accurately in search to find a figurine he knows by
  sight

Implication for search: search should match on the common/simple words in a name (e.g.
"horse", "pony", "dragon") as well as the full name. This is a hook/data concern, but UR
flags it now so it is not designed around strict exact-match search.

Confidence: high. The vocabulary evidence from the Schleich data is direct. Many horse names
are breed-specific Latin terms a child will not recognise by name.

### 10d. Touch target requirements

All interactive elements — most critically the owned toggle — must meet the 44px minimum
touch target from the DS accessibility baseline. This is an ADHD and general child UX
requirement: children have less precise motor control than adults, and imprecise tap targets
lead to frustrating mis-taps.

If the owned toggle is a button on the card (rather than the whole card being tappable), it
must be at minimum 44×44px, which may be larger than the visual badge it contains. The
visual badge can be smaller; the tap target wrapping it must meet the minimum.

---

## 11. Assumptions Summary for UX Designer

The following assumptions from the feature brief are assessed as most likely to need design
attention before the UX spec is written:

**Hold — design around these with high confidence:**
- Images are the primary identifier; names are secondary
- Horses is the default category
- Single-tap owned toggle is the correct interaction model (no confirmation)
- The screen must not open showing all 566 items
- The "My Collection" empty state is a critical design moment
- Consistent card anatomy is mandatory

**Design with caution — these assumptions carry medium confidence:**
- Harry will use search rarely; category browsing is the primary navigation pattern
- Harry identifies figurines by image first, not name
- A sixth nav tab is feasible — but tap target and visual density must be explicitly verified
- Progress indicators (count) are useful if scoped to category, not total catalogue

**Treat as knowledge gaps — accept risk and monitor:**
- Which nav icon Harry immediately associates with "my collection"
- How many figurines Harry currently owns (setup session size)
- Whether Harry reads descriptions (assume not, but provide a detail view)

---

## Sign-off

UR findings complete. UX may proceed.

No findings in this document require [OWNER] review before UX begins. The highest-risk items
(nav tab addition, default category, single-tap owned toggle) are design decisions that the
UR findings inform but do not block. The UX designer should address all HIGH PRIORITY friction
points (F-01, F-02, F-07) in the interaction spec before Phase B.
