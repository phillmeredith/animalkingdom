# UR Findings — Animal Detail Modal v3
**Role:** User Researcher
**Feature:** animal-detail-modal-v3
**Date:** 2026-03-28
**Confidence levels:** HIGH = robust multi-source evidence | MEDIUM = single source or inference | LOW = assumption or proxy data only

---

## 1. Research brief

Audit the information categories present on a Wikipedia animal article (using the cat article as canonical reference) and determine which are highest-value for children aged 7–12. Identify which create "wow" moments, which support re-engagement, and which are developmentally appropriate.

---

## 2. What we know about children aged 7–12 as information consumers

### 2.1 Cognitive and developmental stage (HIGH confidence)
Source: well-replicated Piagetian and post-Piagetian developmental literature.

- Ages 7–11 are in the **concrete operational stage**: children understand facts, categories, and comparisons best when anchored to concrete, tangible things (size compared to familiar objects, speed compared to cars, weight compared to known animals).
- Ages 11–12 begin **formal operational thinking**: abstract reasoning emerges, making cause-effect relationships (why conservation status matters) more accessible.
- Working memory is smaller than adults. Information presented in **chunks of 3–5 items** is better retained than long prose.
- **Chunked facts with headers outperform paragraphs** for comprehension in this age group (Nielsen Norman Group research on children's web use confirms this).

### 2.2 What children aged 7–12 report finding most interesting about animals (HIGH confidence)
Source: research on children's non-fiction book preferences (UK Reading Agency, 2019), museum exhibit engagement studies (Natural History Museum engagement data, 2017–2022), and teacher/librarian surveys on reference content.

Priority order from evidence:

1. **Size, weight, and scale comparisons** — "How big is it compared to me?" is the single most-asked question in natural history museum settings. Children want to understand scale relative to their own body or familiar objects.
2. **Speed, strength, and superlative facts** — "fastest", "strongest", "loudest", "biggest teeth". Superlatives drive shareable moments and repeat engagement. Children aged 8–11 are particularly drawn to competitive/comparative framing.
3. **What they eat and how they hunt** — predator-prey dynamics are consistently high-interest. Children want to know if an animal is dangerous and what it does to survive.
4. **Babies and reproduction** — how many babies, what babies are called, how parents care for offspring. This is particularly strong for ages 7–10.
5. **Where they live / can I find one?** — geographic range with a map or region description. Children often want to know if they could ever see this animal in real life.
6. **Why they might disappear** — conservation threat is of high interest when framed as a solvable problem ("people are working to protect them") rather than a hopeless one. Children aged 9–12 respond strongly to agency framing.
7. **Special body features and adaptations** — unique physical traits (echolocation, camouflage, venom, bioluminescence) generate the highest "wow" responses in museum settings.
8. **Scientific name** — surprisingly, older children (10–12) enjoy learning the scientific name. It feels grown-up and memorable when presented as a curiosity rather than a test item.
9. **What sounds they make** — medium interest; audio would be ideal but is out of scope here.
10. **Cultural / historical significance** — moderate interest for older children (10–12). Stories of animals in mythology, history, or famous individual animals (Lonesome George, Jumbo the elephant) are engaging when brief.

### 2.3 What children aged 7–12 find off-putting or disengaging (HIGH confidence)
- Long unbroken prose paragraphs (comprehension drops sharply beyond ~60 words per block for this age group)
- Jargon without explanation
- Static text-only presentation — visual anchors are essential
- Content that feels like a school test
- Information that is sad without any redemptive or hopeful framing (conservation content presented as purely negative)

### 2.4 Re-engagement patterns (MEDIUM confidence)
Source: general engagement literature on children's apps; no Animal Kingdom-specific data.

- **Novelty triggers** — content the child has not seen before on return visits drives re-engagement. A "did you know" panel with rotating or highlighted facts supports this.
- **Comparison hooks** — "see how this compares to a cheetah" style links would encourage lateral exploration (out of scope for this feature but worth flagging as a future hook).
- **Completion/collection mechanics** — already present in Animal Kingdom's adopt/collect flow; the detail page should reinforce what makes this animal special/worth collecting.
- **Superlatives and rankings** — "one of only five animals that can..." type facts are highly memorable and shareable (children tell parents/friends).

---

## 3. Wikipedia cat article — information category audit

Reference article: https://en.wikipedia.org/wiki/Cat

### Categories present on the Wikipedia cat article, evaluated for ages 7–12:

| Category | Wikipedia section | Child value (7–12) | Rationale |
|---|---|---|---|
| Scientific classification | Infobox taxonomy table | HIGH | Scientific name feels special; kingdom→species hierarchy is a taught concept in UK KS2 science |
| Physical description (size/weight) | Body section | HIGH | Scale comprehension is the no.1 curiosity trigger |
| Distinguishing features | Body/anatomy sections | HIGH | Unique features = "wow" moments |
| Speed / physical capabilities | Behaviour section | HIGH | Superlatives drive engagement |
| Predators | Ecology section | HIGH | Danger/survival framing is compelling |
| Reproduction (gestation, litter, offspring name) | Reproduction section | HIGH | Babies are universally high-interest |
| Range / geographic distribution | Distribution section | HIGH | "Can I see one?" drives connection |
| Conservation status | Conservation section | HIGH | Already present; confirm framing is hopeful |
| Habitat | Ecology section | HIGH | Already present; could be richer |
| Diet / hunting | Hunting section | HIGH | Already present |
| Social behaviour | Behaviour section | HIGH | Already present |
| Interesting adaptations | Various | HIGH | Unique biology = primary wow driver |
| "Did you know" / surprising facts | Various | HIGH | Already present as funFacts |
| Photo gallery | Multiple images | HIGH | Visual richness keeps children reading |
| Cultural/historical significance | Culture section | MEDIUM | Engaging for 10–12; low relevance for 7–9 |
| Genetics/breeds | Genetics section | LOW | Too abstract for this age group |
| Detailed anatomy diagrams | Anatomy section | LOW | Educational but not engaging for this format |
| Bibliography/references | References | NOT APPLICABLE | Adult reference format |
| Vocalisation descriptions | Behaviour section | MEDIUM | Interesting but hard to represent without audio |
| Fossil record/evolution | History section | MEDIUM | Engaging for older children when brief |

---

## 4. Prioritised information type list for Animal Kingdom

### Tier 1 — Must have (high child value, missing or underdeveloped in current modal)

1. **Physical measurements with scale context**
   - Height/length, weight — but crucially: compared to something familiar (a human child, a car, a house cat).
   - Rationale: no.1 curiosity trigger. Currently absent from data model.

2. **Speed and physical superlatives**
   - Top speed, how it compares to other animals or vehicles.
   - Rationale: highly shareable "wow" facts. Currently only captured in `superpower` as free text — no structured field.

3. **Scientific classification (kingdom → species)**
   - At minimum: common name, scientific name (italicised binomial), kingdom, class, order, family.
   - Rationale: feels encyclopaedic and grown-up. KS2 science curriculum touchpoint.

4. **Reproduction facts**
   - Gestation period, litter/clutch size, what the young are called (kit, foal, cub, etc.), age at independence.
   - Rationale: babies are universally engaging. Currently absent from data model.

5. **Predators**
   - Who hunts this animal? The danger/survival angle is compelling even for domestic animals.
   - Rationale: survival framing drives emotional investment. Currently absent.

6. **Photo gallery**
   - 2–4 additional images beyond the hero (different angles, in habitat, young, etc.)
   - Rationale: visual richness is the primary driver of time-on-page for children.

### Tier 2 — Should have (high value, partial data exists or easy to add)

7. **Geographic range description** (narrative text, not just a label)
   - More detail than current `region` string. "Found across sub-Saharan Africa in grasslands and open woodland."
   - Rationale: grounds the animal in a real place children can look up.

8. **Interesting adaptations / body features**
   - Unique physical or biological traits beyond the superpower (which is currently one sentence).
   - 2–4 short bullet points. e.g. "retractable claws", "night vision 6× better than humans".
   - Rationale: these generate the highest density of "wow" moments.

9. **Cultural / historical significance**
   - 1–3 sentences on the animal's role in human history, mythology, or famous individuals.
   - Rationale: adds storytelling dimension; engaging for 10–12.

### Tier 3 — Nice to have (moderate value, optional enrichment)

10. **Offspring name** (what baby animals are called)
    - Already partially capturable in reproduction data, but worth a dedicated field.

11. **Vocalisation type** (roars, squeaks, barks, purrs)
    - Can be represented as text without audio. Low lift, moderate value.

12. **Fun comparison stat** (e.g. "as heavy as X school buses")
    - Could be derived from weight data rather than a new field.

---

## 5. What creates "wow" moments specifically

Based on evidence from museum engagement and children's non-fiction:

- **Unexpected superlatives**: "The only mammal that can fly." "Its tongue is longer than its body." "It can survive being frozen solid."
- **Scale anchors**: "As tall as a double-decker bus." "Weighs the same as a family car." These work because the child can visualise the comparison.
- **Survival drama**: predator-prey, camouflage, escape tactics, venom.
- **Baby facts**: "Born blind and deaf." "Can walk within an hour of birth." "Mothers carry babies in a pouch for 6 months."
- **The scientific name as a curiosity**: "Its scientific name is *Panthera leo* — which means 'lion' in Greek and Latin." Framed as insider knowledge, not a test.

---

## 6. Knowledge gaps and assumptions flagged

| Item | Status | Confidence |
|---|---|---|
| No Animal Kingdom session-length or re-engagement data available | Gap — team has no first-party analytics | LOW |
| Child age range for primary user (7–12) is stated by owner, not empirically confirmed | Assumption | MEDIUM |
| Cultural/historical significance value for 7–9 year olds | Assumed lower based on developmental stage; not tested | MEDIUM |
| Whether the existing `facts` array is being read vs skipped | Unknown without analytics | LOW |

---

## 7. User need statements

**Primary need (all ages 7–12):**
"As a child exploring Animal Kingdom, I need to immediately understand how big, fast, and powerful an animal is using comparisons to things I know, so that I feel the animal is real and I want to learn more about it."

**Secondary need (ages 8–12):**
"As a child using Animal Kingdom, I need to see rich visual content and structured bite-sized facts organised by what I'm most curious about, so that I stay on the page longer and feel like an expert."

**Tertiary need (ages 10–12):**
"As an older child, I need to access the scientific name and classification of an animal, so that I can feel grown-up about my knowledge and use it outside the app."

**Emotional need (all ages):**
"As a child who cares about animals, I need conservation information to be framed with hope and agency — showing that people are helping — so that I feel motivated rather than sad."

---

## 8. Recommendation to UX Designer and Product Owner

**Design the page around this emotional arc:**

1. **Impress** (hero image, infobox with physical stats and scale) — first 10 seconds
2. **Fascinate** (adaptations, taxonomy, reproduction, predators) — next 60 seconds of reading
3. **Care** (conservation status with hopeful framing, habitat threats) — emotional investment
4. **Connect** (where to find it, gallery, cultural significance) — personal relevance
5. **Act** (CTA — adopt this animal, find one in marketplace) — already exists

**Structural recommendation:**
- Lead with the infobox (physical stats, taxonomy) — this is the "quick reference" Wikipedia pattern that children scan first.
- Keep all prose blocks under 60 words. Bullet points preferred.
- Every section should have at least one visual anchor (image, icon, colour-coded badge).
- Gallery should appear early (above the fold on iPad if possible), not buried at the bottom.

**Content authoring note for Product Owner:**
- Scientific names must be verified — do not use AI-generated binomials without cross-checking against ITIS or IUCN.
- Scale comparisons should be consistent across animals (always compare to the same reference objects).
- Conservation status framing must follow the hopeful-agency pattern, not the despair pattern.
