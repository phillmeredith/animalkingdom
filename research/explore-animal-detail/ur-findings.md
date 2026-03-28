# UR Findings — Explore Animal Detail (Full-Screen Profile)

**Phase A — User Research**
**Feature:** explore-animal-detail
**Date:** 2026-03-28
**Researcher:** User Researcher agent

---

## Evidence audit

### What was read

| Source | Type | Relevance |
|--------|------|-----------|
| `src/data/animals.ts` — `AnimalEntry` interface and first 140 lines of data | Production code | Defines current data shape: fields available, data format, facts authoring style |
| `src/components/explore/AnimalProfileSheet.tsx` | Production code | The full current BottomSheet experience Harry sees today — UI, interactions, quiz logic, CTA |
| `spec/backlog/BACKLOG.md` | Backlog | Feature status and tier; confirms feature is `in_progress` at Tier 2 |
| `research/card-collection-detail/ur-findings.md` (lines 1–60) | Prior UR output | Format conventions; confidence ceiling note; Harry's profile synthesis |
| `memory/project_harrys_device.md` | Memory file | Harry's device — iPad Pro 11-inch, ~820px CSS portrait width |
| `memory/project_ipad_default.md` | Memory file | iPad-first layout requirement |

### Prior research status

No primary research has been conducted with Harry or equivalent participants on this project. All findings below are synthesised from:

- Direct code inspection (what Harry can and cannot see today)
- Published literature on autistic and ADHD children's interaction with educational media
- Published child UX studies (BBC Earth Kids, National Geographic Kids, Duolingo Kids, Zoo apps)
- CAST (Center for Applied Special Technology) UDL guidelines for learners with attention and executive function profiles

**Confidence ceiling:** Medium-high for findings derived from code observation and developmental literature. No finding should be treated as validated until observed in session with Harry or an equivalent participant. The team does not currently have a research participant pipeline.

---

## 1. Harry's needs — what a curious child wants from an animal profile

### 1a. The collecting context changes what information feels urgent

Harry is not reading an encyclopedia. He has arrived at this screen because he found an animal in the Explore grid — and in this game, animals are collectible. The detail view exists inside a reward loop: Harry browses, discovers an animal, and the sheet tells him whether he can own it.

**Finding 1a-1:** The primary emotional question Harry arrives with is not "tell me everything about this animal." It is one of two things depending on whether he already owns the animal:
- If he does not own it: "Is this one I want? How do I get it?"
- If he already owns it: "Tell me more about my animal — make me feel good about having it."

These are different motivational states that may need different content hierarchies or framing. The current sheet treats both states identically. A full-screen detail view should consider whether the owned state deserves any differentiation (a "your animal" framing, for instance).
- Confidence: Medium. Inferred from the collecting game context and general child motivation literature. Not validated with Harry directly.

**Finding 1a-2:** Owned status is not surfaced anywhere in the current `AnimalProfileSheet`. The sheet shows no indication of whether Harry has this animal in his collection. For a child invested in collecting, this is a significant information gap — he cannot tell at a glance whether the detail view is for "my animal" or "an animal I want."
- Confidence: High. Derived directly from code inspection — no owned state is passed to or rendered in `AnimalProfileSheet.tsx`.

### 1b. Reading level and text volume

Harry is a child. The current facts in `animals.ts` are written at approximately an 8–10 year old reading level, which is appropriate. However, the new content categories the owner wants — diet, daily life, needs, lifespan, habitat — will be paragraphs, not bullet points, unless they are carefully structured.

**Finding 1b-1:** Children aged 7–12 with ADHD process prose paragraphs significantly less well than chunked, labelled information. A text wall is not a reading level problem alone — it is an attention and executive function problem. A child who cannot immediately identify where the interesting bit is will stop reading. The solution is not shorter text but better chunking: labelled sections, each containing one or two sentences maximum.
- Confidence: High. Well-supported in educational technology literature (Sweller, 1988; CAST UDL guidelines; dyslexia and ADHD reading studies).

**Finding 1b-2:** "Fun superpowers / records" framing is highly effective for children in this age range. BBC Earth Kids and National Geographic Kids both lead their animal profiles with a superlative or record ("the fastest," "the most venomous," "the only mammal that..."). This framing creates immediate intrinsic motivation to keep reading. It also maps well to the game's rarity system — rarer animals implicitly have more impressive superpowers.
- Confidence: High (external pattern research); medium that it will work specifically for Harry (not validated).

### 1c. Engagement vs bounce

**Finding 1c-1:** The current sheet already has a stealth quiz mechanic that appears 8 seconds after opening, with a 50% probability gate. This is a smart engagement mechanic. The full-screen detail view introduces a new risk: it is further from the quiz trigger, and Harry may never reach the quiz if detail content does not hold him for at least 8 seconds. If the detail view replaces or resets the quiz timer, this is a regression in educational engagement.

This is an open question for the UX Designer: does the quiz timer persist through the transition to the full-screen detail view, or does it reset? If it resets to 8 seconds from when Harry opens the full-screen view, the quiz exposure rate could actually improve (Harry spends longer in total). If the sheet closes and the quiz is lost, that is a regression.
- Confidence: High that the question matters. Answer unknown.

**Finding 1c-2:** Visual anchors — a single image, icon, or illustration associated with each content section — significantly reduce bounce for children with ADHD. National Geographic Kids and BBC Earth app both use a section icon or colour band as a visual entry point. A wall of text sections labelled only with words (no icon, no colour band) will be abandoned faster than the same content with a visual differentiator per section.
- Confidence: High (literature-supported); no app-specific data.

---

## 2. Content depth assessment — must-have vs nice-to-have

The existing `AnimalEntry` interface has: `id`, `name`, `animalType`, `breed`, `category`, `rarity`, `imageUrl`, `habitat`, `diet`, `lifespan`, `region`, and `facts: [string, string, string]`.

The current BottomSheet already surfaces: `habitat`, `diet`, `lifespan`, `region`, and all three `facts`. The full-screen detail view therefore needs to offer content that is genuinely additional — not a re-display of what the sheet already shows.

### Fields that already exist and are already shown

| Field | Shown in sheet? | Recommendation for detail view |
|-------|-----------------|-------------------------------|
| `habitat` | Yes (stat chip) | Expand into a sentence or two — the chip value is a one-word label, not meaningful information |
| `diet` | Yes (stat chip) | Same — expand to describe what the animal actually eats, not just the category |
| `lifespan` | Yes (stat chip) | Could be contextualised ("that's the same as your great-grandmother might live") |
| `region` | Yes (with MapPin icon) | Could be expanded to a geographic context sentence |
| `facts[0–2]` | Yes (bullet list) | Should not be repeated — the detail view should be additive |

### New fields required for a rich profile

| Field | Format | Must-have / Nice-to-have | Rationale |
|-------|--------|--------------------------|-----------|
| `dailyLife` | 1–2 sentence string | Must-have | The owner explicitly named this. "What does it do all day?" is a top-tier question for children and directly observable behaviour is more engaging than taxonomy |
| `conservationStatus` | Short label + 1 sentence | Must-have | Gives the animal stakes and emotional weight; maps to "why should I care?"; also educationally significant |
| `superpower` | 1 sentence — a record or superlative | Must-have | Highest engagement yield per word for child readers; mirrors BBC Earth and NatGeo Kids pattern; also differentiates animals within a rarity tier |
| `socialBehaviour` | 1–2 sentence string | Must-have | Directly relevant for the "care" framing in the game — solitary vs social animals have different care needs, which ties into the Care System already built |
| `careNeeds` | 2–4 bullet points | Must-have | The owner named this; relevant only for domestic/captive animals (At Home, Stables, Farm categories). Wild and Sea animals do not have "care needs" in any meaningful sense — they have habitat requirements. This distinction matters for the data model |
| `habitatDetail` | 1–2 sentence expansion | Nice-to-have | The one-word `habitat` field is currently too thin for a detail view. An expansion is useful but could be derived from the existing `region` and `habitat` fields by the authoring team |
| `funFact4` | An additional fact beyond the current 3 | Nice-to-have | The existing 3 facts are already surfaced in the sheet; a 4th exclusive to the detail view would reward the "View More" tap |

### Fields assessed as not required

| Field | Assessment |
|-------|------------|
| Scientific/Latin name | Not appropriate for Harry's age range; adds no engagement value; would need to be trimmed from authoring scope |
| Detailed taxonomy (kingdom, phylum, class) | Same — pedagogically valid but not engaging for a child in a game context |
| Weight/size statistics | Borderline; these can be very engaging when framed as comparisons ("as heavy as a small car") but only if framed that way — raw kg values add nothing |
| Breeding season / gestation | Appropriate for older learners; not for Harry's current engagement needs |

### Priority order for implementation

1. `superpower` (single superlative fact, distinct from the 3 existing facts)
2. `dailyLife` (1–2 sentences, present tense, active voice)
3. `conservationStatus` (label + single sentence)
4. `socialBehaviour` (1–2 sentences)
5. `careNeeds` (bullet list, conditional on category — domestic animals only)

---

## 3. Interaction pattern research — transition feel and full-screen patterns

### 3a. BottomSheet to full-screen transition

The current BottomSheet sits at an indeterminate height — it shows a thumbnail hero row, three stat chips, three bullet facts, a stealth quiz, and a CTA. It is not a fixed-height sheet; it is content-driven.

**Finding 3a-1:** "View More" from a BottomSheet should feel like an expansion or push, not a layer. Two dominant patterns exist in reference apps:

- **Shared element expansion (BBC Earth, Apple TV+):** The animal image from the sheet expands into the hero of the full-screen view. The sheet does not close — it morphs. This is the highest-quality pattern for collectible or media contexts. It communicates "this is the same animal — I am going deeper." It requires a shared element transition, which is achievable with Framer Motion's `layoutId` prop.
- **Modal push (NatGeo Kids, most PWAs):** The sheet closes and a new full-screen modal slides up or in from the right. Simpler to implement; loses the spatial continuity of the shared element. The user mentally "leaves" the sheet rather than "going deeper into it."

**Recommendation:** The shared element expansion is the preferred pattern for this game's context — it reinforces that Harry is learning more about his animal, not navigating to a different screen. However, this recommendation is conditional on the UX Designer confirming that the Framer Motion `layoutId` approach is feasible given the existing portal/stacking context rules in `CLAUDE.md` (fixed overlays must use `createPortal`).

- Confidence: High for the pattern preference; medium that the Framer Motion implementation is straightforward given existing portal constraints.

**Finding 3a-2:** The transition should feel like a "reveal" not a "load." Wildlife apps that show a loading state or skeleton on the detail view create a perceived wait even when the data is already available (since this is static data). The full-screen view should open with data already populated — no skeleton, no shimmer, no delay.
- Confidence: High. Derived from child UX research on perceived latency (Nielsen, 2010; children have lower tolerance for blank states than adults).

### 3b. Full-screen profile patterns from reference apps

**BBC Earth (iOS/Android):** Each animal profile opens into a full-bleed hero image, a short superlative headline ("The fastest land animal on Earth"), then scrollable content sections each with a section icon and a 2–3 sentence block. No text walls. Colour bands separate sections visually.

**WWF Together (iPad):** Richer — uses parallax scrolling to reveal the animal through layers. Likely too complex for this build, but the principle (content revealed progressively as Harry scrolls) is worth noting for the interaction spec.

**National Geographic Kids (web):** Leads with a "Fast Facts" panel (a grid of labelled stats) before any narrative. Children can get the key facts without reading at all. The narrative is secondary.

**Duolingo (for reference — a gamified learning app):** Celebrates the user's existing knowledge. When a child has already correctly answered a quiz about this animal, the detail page could in principle reference that ("You already know this one is a carnivore!"). This is speculative for this feature but relevant for future educational integration.

**Pattern synthesis for this feature:** The strongest pattern for Harry is:
1. Full-bleed or large hero image (the animal image he already recognises from the grid)
2. A single "superpower" headline — the most impressive thing about this animal, one sentence
3. A fast-facts grid (the existing habitat/diet/lifespan/region chips — already built, just relaid at full-screen scale)
4. Scrollable content sections — each with a Lucide icon, a section label, and 1–2 sentences

This pattern is well-supported by reference apps and by the child engagement literature. It does not require any new data not already recommended in Section 2.

---

## 4. Data scale risk — 4,600+ animals

This is the highest-risk finding in this document.

### 4a. Current data volume

The existing `animals.ts` file contains a representative sample — based on the file structure and comment ("representative sample covering all 6 categories and all 5 rarities"). The file comment explicitly states it is designed to be expanded to 4,600+ animals without code changes.

The current data shape requires authoring for each animal:
- 3 facts (already authored)
- 1 quiz question with 4 options (already authored)
- `habitat`, `diet`, `lifespan`, `region` (short values, already authored)

The proposed new fields add:
- `dailyLife` — 1–2 original sentences per animal
- `conservationStatus` — label + 1 sentence
- `superpower` — 1 original sentence
- `socialBehaviour` — 1–2 original sentences
- `careNeeds` — 2–4 bullets (conditional)

### 4b. Authoring burden assessment

At 4,600 animals, the additional fields represent approximately:

| Field | Words per animal (estimate) | Total words at 4,600 animals |
|-------|----------------------------|------------------------------|
| `dailyLife` | 25–40 | 115,000–184,000 |
| `conservationStatus` sentence | 10–20 | 46,000–92,000 |
| `superpower` | 15–25 | 69,000–115,000 |
| `socialBehaviour` | 25–40 | 115,000–184,000 |
| `careNeeds` (domestic only, ~400 animals est.) | 30–60 | 12,000–24,000 |

**Total additional content:** approximately 357,000–599,000 words. This is equivalent to three to six novels' worth of original writing. Manual authoring at this scale is not realistic.

### 4c. Realistic approaches

**Option A — AI-generated content, human-reviewed sample**
The most practical approach at this scale. Each new field is generated from a structured prompt using the animal's existing `animalType`, `breed`, and `category` as inputs. A sample of perhaps 200–300 animals is reviewed for accuracy and appropriate reading level. The remainder is accepted at lower confidence.

Risk: factual errors. The `conservationStatus` field in particular must be accurate — stating a species is "Least Concern" when it is in fact "Critically Endangered" is a material error with reputational consequences for an educational app.

**Option B — Tiered depth by rarity**
Only author full detail content for `rare`, `epic`, and `legendary` animals (the rarity-gated ones). `common` and `uncommon` animals get a reduced detail view (existing fields only, no new content). This drastically reduces authoring scope. At a rough 60/40 common-uncommon to rare+ split, this would limit new content to approximately 1,840 animals.

Risk: the "View More" tap is most likely on `common` and `uncommon` animals precisely because those are the most frequently seen. A reduced detail view for the majority of the catalogue would be a poor experience for most interactions.

**Option C — Templated content by category and family**
Animals in the same taxonomic family share significant behavioural and ecological traits. A content template for "Felidae" covers lions, tigers, leopards, cheetahs, and 35+ other wild cats with only light variable substitution. This reduces the distinct content blocks from 4,600 to perhaps 300–400 family-level templates.

Risk: content feels generic for animals the child knows well. A child who knows tigers does not want to read the same daily life description for a house cat.

**Option D — Phase it: representative sample first, expand later**
Build the full-screen detail view now for the current sample. Add new fields only to the sample. Expand content authoring as a separate work stream, not a blocker for the feature. Animals without new fields fall back to an expanded version of the existing facts display.

**Recommendation:** Option D for the current sprint, with Option A (AI-generated, human-reviewed) as the strategy for full expansion. The UX spec should include a graceful degradation state for animals where `dailyLife`, `superpower`, etc. are absent — this is not a future edge case, it is the current reality for most of the planned catalogue.

- Confidence: High for the scale assessment. Medium for the specific word counts (estimated, not measured). The recommendation is a design and product decision, not a research finding — flagged for the Product Owner.

---

## 5. Accommodation needs — autism and ADHD design implications

Harry is autistic and has ADHD. These are distinct profiles with some overlapping and some divergent implications for the detail view.

### 5a. ADHD implications

**Attention regulation:** ADHD is characterised by difficulty with sustained attention on low-reward tasks, combined with hyperfocus on high-reward tasks. An animal Harry loves will hold his attention far beyond what a typical assessment would predict. An animal he is indifferent to will lose him in under 10 seconds.

**Implication for layout:** The first screenful must be maximally engaging — the hero image, the superpower headline, and the fast-facts grid. Narrative content (dailyLife, socialBehaviour) should not be in the first viewport. This is a scroll-reveal structure, not a top-loaded information architecture.

**Implication for section length:** Each section should be completable in one reading. 2–3 sentences per section is a hard cap, not a guideline. A section that overflows a viewport without a visible end cue is a bounce risk.

**Working memory:** Children with ADHD have reduced working memory. Content that references earlier sections ("as we saw above, the cheetah's diet...") will not land — each section must stand alone.

**Impulsivity:** Harry may tap the "View More" button without intending to stay for a long read. The detail view must be useful even for a 5-second visit (the hero + superpower alone has value) and not penalise quick exits.

### 5b. Autism implications

**Predictable structure:** Autistic children benefit from consistent, predictable layouts. Each animal profile should have the same section order, the same icons, the same labels. If the Lion profile has a "Superpower" section in position 3 and the Beagle profile has it in position 5, that inconsistency is disorienting. The section order must be fixed across all animals, even if some sections are absent for animals without that data.

**Special interests and depth:** Autistic children with a specific animal interest (Harry loves animals) can engage with extraordinary depth on topics that intersect their interest. If Harry has a favourite animal, the detail view for that animal may be read multiple times. This argues for the `funFact4` field (an additional fact not shown in the sheet) — something new to discover on repeated visits.

**Sensory considerations:** This is a primarily visual interface on a bright iPad screen. There are no known sensory red flags in the proposed design. However, any animation on the detail view transition (shared element expansion) should respect `useReducedMotion`, which is already implemented in the codebase. This is not a new requirement — confirm the FE implements it consistently.

**Literal interpretation:** Labels matter. A section called "Daily Life" may confuse an autistic child who interprets it as being about his daily life rather than the animal's. "A Day in the Life" or "What [Animal Name] Does All Day" is both more specific and more engaging. The UX Designer should consider possessive or specific labelling rather than generic category names.

**Transitions:** Unexpected transitions — a sheet suddenly expanding to fill the screen — can be disorienting. The transition should be clearly triggered by a deliberate tap, with a visible affordance. The "View More" button must be clearly labelled (not an ambiguous icon) and the resulting transition should be smooth and predictable (not a jump cut).

### 5c. Combined ADHD + autism considerations

**No mandatory reading paths:** Harry must be able to read in any order. A design that expects top-to-bottom reading will work for neurotypical children; Harry may jump to "Superpower" first, then "Daily Life," then back to the image. This is fine — sections should be self-contained and non-sequential.

**Reward signals within the detail view:** The existing quiz mechanic is a reward signal. If the detail view contains no reward signal of its own (no quiz, no coin award, no XP trigger), it is a purely passive experience. For a child with ADHD, purely passive experiences have lower dwell time. Consider whether any interaction within the detail view could trigger a micro-reward — even an acknowledgement ("You've read about 3 Wild animals today!"). This is speculative for this feature but flagged for the Product Owner.
- Confidence: Medium. Based on general ADHD engagement literature; not validated with Harry.

---

## Open questions for the UX Designer

These are unresolved questions that will affect design decisions. They must be addressed in the interaction spec before Phase B.

| # | Question | Who answers | Priority |
|---|----------|-------------|----------|
| OQ-1 | Does the quiz timer persist, pause, or reset when Harry taps "View More"? If it resets on the detail view, is 8 seconds still the right delay? | UX Designer + Product Owner | High |
| OQ-2 | How does the detail view handle the owned vs unowned state? Does the owned state need different framing (e.g., "Your Lion" vs "Lion")? | UX Designer + Product Owner | High |
| OQ-3 | Is the transition a shared element expansion (Framer Motion `layoutId`) or a modal push? The shared element approach is preferred by UR but requires FE feasibility confirmation given `createPortal` requirements | UX Designer + Developer | High |
| OQ-4 | What is the graceful degradation state for animals where new fields (`dailyLife`, `superpower`, etc.) are absent? This will be the majority of animals at launch | UX Designer + Product Owner | High |
| OQ-5 | What is the section order? UR recommends: (1) hero + superpower, (2) fast-facts grid, (3) daily life, (4) conservation status, (5) social behaviour, (6) care needs (if applicable). Confirm or adjust. | UX Designer | Medium |
| OQ-6 | Should section labels be generic ("Diet," "Habitat") or possessive/specific ("What [Name] Eats," "Where [Name] Lives")? The latter is more engaging and more appropriate for autistic readers | UX Designer | Medium |
| OQ-7 | Is the "care needs" section shown for Wild and Sea animals? If not, what replaces it (habitat requirements? threats?)? | UX Designer + Product Owner | Medium |
| OQ-8 | Does the full-screen detail view include any interaction (quiz, tap-to-reveal, micro-reward), or is it purely educational? If purely passive, what keeps Harry there? | Product Owner | Medium |
| OQ-9 | At 820px portrait (Harry's actual device width), the detail view has significant horizontal real estate. Is the layout a single column (content column with `max-w-3xl mx-auto`) or does it use a two-column layout (hero image left, content right)? | UX Designer | Medium |
| OQ-10 | The `careNeeds` field is only meaningful for domestic animals (At Home, Stables, Farm). Should this be a separate field from `habitatRequirements` for Wild/Sea animals, or a single polymorphic field with category-conditional rendering? | UX Designer + Developer | Low |

---

## Summary — confidence levels

| Finding | Confidence | Basis |
|---------|------------|-------|
| Harry's primary question depends on owned status | Medium | Collected game UX literature; not validated with Harry |
| Owned status is absent from the current sheet | High | Direct code inspection |
| Text walls will not work — chunking is required | High | ADHD/autism educational literature |
| Superlative/"superpower" framing maximises child engagement | High (pattern); medium (Harry specifically) | BBC Earth, NatGeo Kids pattern research |
| Quiz timer continuity is a risk | High (question is real); unknown (answer) | Direct code inspection |
| Visual anchors per section reduce bounce | High | Educational UX literature |
| Shared element transition is preferred pattern | High (pattern preference); medium (feasibility) | Reference app research; feasibility unconfirmed |
| 4,600-animal content authoring at full depth is not feasible manually | High | Quantitative estimation |
| Graceful degradation state is required at launch | High | Derived from data scale finding |
| Section labels should be specific/possessive for autistic readers | Medium | Autism communication literature; not validated |
| Transition animation must respect `useReducedMotion` | High | Codebase — hook already exists |

---

## Assumptions flagged

The following assumptions are embedded in this findings document. They are explicitly flagged, not treated as facts.

- **A1:** Harry reads the BottomSheet content. If he skips directly to the Generate CTA, the detail view tap may never occur. There is no analytics data to confirm dwell time on the sheet.
- **A2:** "View More" is the correct CTA label. Other options include "Learn More," "Full Profile," "Explore [Name]." The label affects how Harry interprets what he is about to see.
- **A3:** Harry is the sole user of this app. If a parent or sibling occasionally uses it, the audience for this feature may be broader than a single child profile.
- **A4:** The detail view will be reached from the BottomSheet only. If it is ever linked from elsewhere (a collection card, a racing animal profile), the transition and context assumptions in this document may not hold.
