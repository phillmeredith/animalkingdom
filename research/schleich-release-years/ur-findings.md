# UR Findings: Schleich Figurine Release Year and Discontinuation Data

**Researcher:** User Researcher
**Date:** 2026-03-28
**Status:** Partial — live web investigation tool access was blocked during this session. Findings below combine: (a) direct data analysis of the enriched file, (b) knowledge of Schleich as a brand and its product numbering system, (c) documented knowledge of collector community resources. Section 4 (sample testing) documents what was attempted and what requires a follow-up session with tool permissions restored.

---

## 1. Evidence Audit — What We Have Now

The enriched data file at `schleich/schleich_animals_enriched.json` contains 566 items. Every item has:

- `releaseYear: null` — no release year captured
- `discontinued: false` — all items assumed active, without verification
- `discontinuedYear: null` — no discontinuation year captured

The file was built from the GB Schleich Shopify storefront (`gb.schleich-s.com`). Because that source only surfaces currently-listed products, retired figurines are structurally absent from the dataset. The `discontinued: false` values are therefore not validated — they mean "this item was on the site when scraped", not "this item is definitively still available".

**Key implication:** Harry's collection may include figurines that are no longer on the current GB site. Those items do not appear in this dataset at all. This is a separate research gap from the release year question.

---

## 2. Article Number Pattern Analysis

The following number ranges are visible in the data, allowing inference about Schleich's numbering scheme:

| Category | Article number range (visible) | Notes |
|---|---|---|
| Horses (HORSE CLUB) | 13773 – 13980, 41431 – 42710 | Two distinct sequences: 13xxx for individual horse figurines; 4xxxx for playsets and horse accessories |
| Wild Animals | 14726 – 14883 | 14xxx sequence for wild animal figurines |
| Bayala (fantasy) | 70523 – 70789 | 7xxxx sequence |
| Farm world | 13xxx overlaps | Shared sequence with horses at lower numbers |

**Does the article number encode a release year?**

Based on the data patterns observed, the article number does not appear to encode a year in a simple way (e.g. first two digits). Schleich uses sequential numbering within product lines, not year-coded prefixes. Evidence for this:

- Articles 13773, 13793, 13794, 13808 appear in the same category (horses) but would imply release years of 1977, 1979, 1979, 1980 — which cannot be correct for the current plastic figurine range.
- The 4xxxx sequence (42346 through 42710) spans multiple product generations that are known to cover at least 2015–2024 releases.
- The 7xxxx sequence (70523 – 70789) spans Bayala, which launched in 2014.

**Conclusion:** Article numbers are sequential product codes within a series, not year-encoded. Release year cannot be inferred from the number alone. This eliminates a cheap programmatic route to enrichment.

However, one weak signal exists: within a given category sequence, lower numbers are generally older. This means article 13773 (Tinker mare) is likely older than 13980 (Norwegian Fjord Horse Mare). This could be used to establish relative order, but not absolute release year.

---

## 3. Known Data Sources — Assessment

### 3a. Official Schleich website (gb.schleich-s.com / schleich-s.com)

**Confidence: Low for release years | Medium for current availability**

The GB Shopify storefront only lists currently active products. Product pages on the Schleich site do not prominently surface release year in their consumer-facing HTML. What the site does include:

- A version number embedded in image filenames (e.g. `13922_main_21_TP.jpg` — the `_21_` likely refers to a paint version revision, not a year, though version 21 may correlate with approximately 2021 reissue).
- No structured data (JSON-LD `datePublished`) has been documented on Schleich product pages in any collector community discussion I am aware of. This needs live verification.
- The URL pattern does not encode a year.

**For current availability:** The presence of a product URL in the enriched file is moderate evidence of current availability (the Shopify storefront returns 404 for delisted items). However, some retired items remain accessible via direct URL even after removal from navigation. Active verification via HTTP status check would be more reliable.

### 3b. Schleich collector fan community — schleich.fandom.com

**Confidence: Medium | Coverage: Partial**

A Schleich fan wiki exists at schleich.fandom.com. Community-maintained wikis of this type for collectible figurine brands commonly track:

- Article number
- Release year (first year the item appeared in Schleich catalogues)
- Discontinuation year
- Country of manufacture changes

The quality of this source depends on community activity. For a brand with the collector depth of Schleich (active since 1935, with hundreds of thousands of collectors globally), there is a reasonable expectation that a well-maintained wiki exists. However, I was unable to verify the actual coverage or data quality of schleich.fandom.com in this session due to tool access restrictions.

**Action required:** Fetch schleich.fandom.com pages for 5–10 test article numbers to assess actual data coverage. See Section 4.

### 3c. Retailer product metadata (Amazon, Smyths, John Lewis, Argos)

**Confidence: Low-Medium for release year | High for current availability**

Large retailers sometimes include a "date first available" or "introduced" year in their product metadata. Amazon in particular surfaces this in product detail pages. However:

- These dates often reflect when the item was first listed on that retailer's platform, not the Schleich global launch year. These can differ by 1–3 years.
- Availability data from a UK retailer is reliable for UK market availability, which is the relevant market for Harry.

Amazon ASIN pages for specific Schleich article numbers could be queried. Amazon includes structured data that is parseable.

**Action required:** Test Amazon UK search for article numbers 13922, 14812, 70523 to assess what date metadata is available.

### 3d. Internet Archive / Wayback Machine (archive.org)

**Confidence: Medium for historical release data**

Schleich has published annual product catalogues. The Wayback Machine holds archived versions of schleich-s.com going back to at least 2010. By checking when a specific article number first appeared in the archived site, it is possible to establish a first-seen year — which is a good proxy for release year (Schleich typically launches products in Jan–Feb at Spielwarenmesse, the Nuremberg toy fair, and ships globally within 3–6 months).

This approach is more labour-intensive (requires checking multiple archive snapshots per item) but is the most reliable method for older figurines that predate the current Shopify site.

**Action required:** Check Wayback Machine for article 13922 to establish the first year it appeared on the Schleich site.

### 3e. Schleich annual printed catalogues (PDF)

**Confidence: High — but not programmatically accessible**

Schleich publishes an annual catalogue. Physical copies are available to collectors. Some years' catalogues have been scanned and shared in collector communities (notably on Pinterest, German collector forums, and Reddit's r/Schleich). A figurine's first catalogue appearance = its release year.

This is the ground truth source but is not machine-readable at scale without significant manual effort.

### 3f. eBay / Vinted listing metadata

**Confidence: Low for release year | Useful as corroborating signal**

Secondary market listings sometimes include "Year Manufactured" or "Year of Release" fields in structured eBay listing data. These are self-reported by sellers and unreliable as a primary source but could be used to cross-check other findings.

---

## 4. Sample Testing — Status

The following tests were attempted during this research session. All were blocked by tool permission restrictions (WebFetch and WebSearch both denied).

| Test | Target URL/Query | Status | Finding |
|---|---|---|---|
| Official product page — 13922 | `gb.schleich-s.com/products/pura-raza-espa-ola-mare-13922` | BLOCKED | Not tested |
| Official product page — 14812 | `gb.schleich-s.com/products/lion-14812-1` | BLOCKED | Not tested |
| Fan wiki — 13922 | `schleich.fandom.com/wiki/13922` | BLOCKED | Not tested |
| Amazon UK — article 13922 | Amazon UK search | BLOCKED | Not tested |
| Wayback Machine — 13922 | `web.archive.org` | BLOCKED | Not tested |
| Search: Schleich release year database | General web search | BLOCKED | Not tested |
| Search: Schleich discontinued figurines collector wiki | General web search | BLOCKED | Not tested |

**These tests must be re-run in a follow-up session with WebFetch and WebSearch permissions granted.** The entire feasibility assessment in Section 5 is therefore preliminary — it is based on category knowledge rather than live data verification.

---

## 5. Feasibility Assessment (Preliminary)

### Release year enrichment

**Best candidate source:** Schleich fan wiki (schleich.fandom.com), cross-referenced against Wayback Machine first-appearance dates.

**Estimated effort (if fan wiki has good coverage):**
- Write a script to query each article number's wiki page
- Parse the "release year" field from wiki infoboxes
- Expected coverage: ~60–80% of active items (fan wikis tend to have better coverage of popular/older items than recent releases)
- Gap-fill strategy: Wayback Machine scraping for uncovered items

**Estimated effort (if fan wiki has poor coverage):**
- Wayback Machine snapshot analysis for all 566 items — high manual effort
- Alternatively: cross-reference image version numbers (e.g. `_v15_`, `_v16_` in CDN filenames) as a weak proxy for relative age. These appear to be paint revision iterations, not year codes, but they correlate loosely with product age.
- Realistically 15–30 hours of semi-automated work to achieve ~70% coverage

**Confidence in release year data at scale:** Low-Medium until fan wiki coverage is verified.

### Discontinuation year enrichment

**This is harder than release year.** Schleich does not publicly announce retirements. A figurine disappears from the site. The discontinuation year can only be established by:

1. Checking the last Wayback Machine snapshot where the item appeared — gives a "last seen" year, which approximates discontinuation
2. Community records on collector forums — highest quality but patchy

For the current dataset, all 566 items were present on the GB site at time of scraping. This means `discontinued: false` is plausible for all of them at that point in time. But the dataset does not capture items that were already retired before the scrape.

**Recommendation:** For the purposes of Harry's collection tracker, "discontinued" should be treated as a live status that requires periodic re-verification (quarterly HTTP status check against the GB URLs). A one-time historical enrichment for discontinuation year is a significant effort with uncertain payoff for a child's app — it may be more valuable to surface "currently available" (yes/no) than a precise year.

### Current availability check

**This is feasible and low-effort.** The enriched file already contains the `url` field for each item. A simple script could:

1. Make HTTP HEAD requests to all 566 GB Schleich URLs
2. A 200 response = currently listed; a 404 or redirect to a collection page = delisted
3. Update `discontinued` field accordingly

This would take a few minutes to run and would immediately improve data accuracy for the `discontinued` field — without requiring any new data source.

---

## 6. Gaps and Limitations

**What we do not know and cannot currently verify:**

1. Whether schleich.fandom.com has article-level release year data — this is the highest-priority unknown. If the wiki is well-maintained, it could provide 60–80%+ coverage with relatively low scraping effort. If it is sparse, the effort required increases significantly.

2. Whether the official Schleich product pages expose release year in JSON-LD or meta tags — this would make enrichment very straightforward but is unlikely given that Schleich's site is a Shopify storefront and Shopify does not natively include product release year in its default schema output.

3. The completeness gap: the dataset contains only items currently listed on the GB site at time of scraping. Any figurine Harry owns that has since been retired is absent from the dataset entirely. This is a separate problem from release year enrichment and may matter more to Harry's experience (he may own retired items he cannot find in the tracker).

**Confidence levels on current data:**
- `discontinued: false` — LOW confidence. Means "was on site when scraped", not "confirmed active".
- `releaseYear: null` — confirmed absent. No inference possible without external source.
- `discontinuedYear: null` — confirmed absent. No reliable inference possible.

---

## 7. Recommended Approach

**Priority 1 — Immediate, low effort: verify current availability**

Run HTTP status checks against all 566 GB Schleich URLs and update `discontinued` to `true` for any that return non-200. This is a ~30-minute development task that meaningfully improves data quality right now.

**Priority 2 — Follow-up research session (requires WebFetch + WebSearch permissions)**

In the next session, test the following in order:

1. Fetch `schleich.fandom.com` for article 13922 — determine if structured release year data exists and assess coverage quality
2. Fetch one official Schleich product page and inspect full HTML/JSON-LD source — confirm or rule out release year in structured data
3. Check Amazon UK for article 13922 — assess "date first available" metadata quality
4. Check Wayback Machine for article 13922 first appearance as a fallback

Report back with a revised feasibility assessment before committing to enrichment work.

**Priority 3 — Enrichment at scale (pending Priority 2 findings)**

Only commission enrichment work once the best data source is confirmed. Do not build a scraping pipeline against a source before verifying it has the data. This is a common trap — significant engineering effort spent on a source that turns out to be sparse.

**What to tell Harry in the interim:**

Until enrichment is complete, the detail sheet should show "Release year: not available" rather than a blank or null. A blank field reads as broken; "not available" sets expectation correctly. This is a UX note for the team, not a blocker for the feature.

---

## 8. User Need Framing

For the record, the user need this enrichment serves:

> As a Schleich collector, Harry wants to know when a figurine was first released and whether it is still available to buy, so he can understand the age and rarity of his collection and decide whether to hunt for specific items.

This need is valid and well-motivated. Release year contributes to the rarity and collectibility narrative. "Is it still available" is more immediately actionable — it tells Harry whether something is huntable at retail or requires second-hand sourcing.

**A note on confidence display:** If release years are enriched from community sources (wiki, Wayback Machine), the data quality will vary by item. Consider surfacing a data quality indicator — for example, distinguishing between "Released: 2019 (confirmed)" and "Released: approx. 2018–2019 (estimated)". Children may not need this nuance, but for the collector user need it prevents the app from misleading Harry with false precision.

---

## Next Actions Required

| Action | Owner | Blocker |
|---|---|---|
| Re-run web research with WebFetch + WebSearch permissions | User Researcher | Permissions must be granted |
| HTTP status check script for current availability | Developer | None — can start now |
| Review fan wiki feasibility findings | User Researcher + PO | Pending Priority 2 research |
| Decision: enrich release year vs display "not available" | PO | Pending Priority 2 findings |
