# UR Brief: Explore / Directory

> User: Harry, 7, ADHD + autism. Loves animals. This is his app.

---

## What we know

**Harry's relationship with this screen**
Explore is likely Harry's most-used screen between active sessions. He will browse it for pleasure — looking up favourite animals, discovering new ones, showing adults. It is not a task-completion screen; it is a browsing/discovery screen.

**ADHD implications**
- Long unbroken lists cause attention drop. The A-Z rail and category filters are load-bearing: they give Harry a clear way to jump to a target rather than scroll endlessly.
- Search must be immediate — no delay between typing and results. Filtering must be fast.
- The 2-column grid gives more visual anchors per screen than a 1-column list, reducing the feeling of infinite scroll.

**Autism implications**
- Predictable structure matters. The animal card layout must be consistent — same image region, same text hierarchy, same badge position on every card.
- The stealth quiz must never feel like a test or evaluation. It must feel like a fun fact moment. The question appears gently, the penalty for wrong is zero, the dismiss option is obvious.
- 8 seconds before the quiz appears is deliberate — enough time to read, not long enough to feel watched.

**What Harry wants from this screen**
- Find a specific animal he's thinking of (search)
- Browse within a world he likes (category filter + scroll)
- Read facts about an animal (profile overlay)
- Discover the path to getting that animal (Generate CTA in profile)

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Quiz feels punishing / unexpected | Medium | Gentle appear animation, clear dismiss X, no wrong-answer state — just show correct |
| Long list causes abandonment | Medium | Category filters reduce list to manageable size; A-Z rail allows jumping |
| "Generate" CTA causes confusion about cost | Low | Show animal silhouette + "Free to generate" copy or no mention of cost |
| Image not found (imageUrl 404) | High (early dev) | AnimalImage always shows paw-print fallback — no broken images |
| Search with no results frustrates | Low | Empty state: "No animals match" + clear filter suggestion |

---

## Recommendations

1. **Category filter first, then search.** Most browsing is categorical. Search is targeted retrieval. Show category pills prominently above the grid.
2. **The stealth quiz should feel like a fun pop-up, not a test.** Use warm copy ("Fun fact quiz!"), coin reward visible before answering, friendly dismiss.
3. **A-Z rail touch targets must be 44px height per letter minimum.** With 26 letters in a ~700px tall rail, this works at ~27px per letter — tight but acceptable. Use font-size 11px hairline.
4. **Reduced motion must remove all list animations.** The virtualized list has enter animations for new items. These must be instant under reduced motion.
5. **"Generate this animal" button always visible in profile.** This is the conversion moment — Harry sees an animal he likes and wants it. The pink button must be the most prominent element after the image.
