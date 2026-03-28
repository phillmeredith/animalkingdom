---
# Owner decisions — LeMieux Equipment System
**Confirmed 2026-03-28**

## Scope decisions

### Hobby horses — IN SCOPE, separate section
- Hobby horses (63 items) are included in this feature
- They occupy a **separate section** from horsewear items in BOTH the shop (Store → Items) and My Animals collection view
- They are NOT equippable on virtual horses — they are collectible display items only
- Shop: two distinct tabs or sections — "Horsewear" and "Hobby Horses"
- My Animals: two distinct tabs or sections — "Equipment" and "Hobby Horses"

### Grooming items — IN SCOPE, separate section, future care hook
- Grooming items (grooming-care category, 59 items) are included
- They occupy a **separate section** in the shop — "Grooming"
- They are NOT equippable on horses (no equipment slot)
- They are NOT usable yet — they are purchasable now and will be usable for animal care in a future feature
- Display purchased grooming items in My Animals under a "Grooming" section
- The schema must include them in the owned-items table so the future care feature can query them

### Non-equippable categories (supplements, stable-yard, fly-protection)
- Status not confirmed by owner — treat as out of scope for Phase C unless UR/UX spec them in
- Do not block Phase C on this decision

## Equipment decisions

### Unequip behaviour — confirmed
- Harry CAN unequip an item from a horse's slot
- On unequip, the item returns to his inventory
- He can then re-equip it on the same horse or a different horse
- **One horse at a time per item** — the same item cannot be equipped on two horses simultaneously
- **Exception:** if Harry buys the same item twice, he has two copies and can equip one on each horse

### Horse-only slots — confirmed
- Equipment slots exist only for horses
- Dogs, cats, dinosaurs, farm animals, sea creatures — no equipment slots
- Only animals with `category === 'Stables'` (or equivalent horse category) get an equip screen

### Leg slots — owner not asked, use UR recommendation
- Use a **single "Legs" slot** (one boot/bandage purchase equips the visual across all four legs)
- This is simpler and avoids requiring Harry to buy 4 copies of the same item

### Equip gesture — owner not asked, use UR recommendation
- **Tap-slot-then-pick** as the primary interaction:
  1. Harry taps an empty slot on the horse silhouette
  2. A bottom sheet appears showing compatible owned items for that slot
  3. Harry taps an item to equip it
- Drag-to-slot is a future enhancement, not required for Phase C

## Pricing — confirmed approximately correct, will adjust later
- Epic items (boots, fly hoods, headcollars, stable items): 300–600 coins
- Legendary items (rugs, saddle pads, saddlery): 700–1,200 coins
- Hobby horses: owner to confirm price tier (treat as Epic range 300–600 until confirmed)
- Grooming items: treat as a lower tier — suggest 100–250 coins (purchasable without heavy saving)

## Image quality issue — flagged, not yet resolved
- UR flagged that ~half the horsewear product images may be placeholders
- This is a known risk. Dev must verify image availability at Phase C start
- If images are missing, the feature uses `image_url` (CDN) as fallback

## Age-restricted item
- One hobby horse product is labelled "Not suitable for persons under 14 years of age"
- This item must be excluded from the shop data at the data layer
- Dev must filter it out when importing hobby horse data

---

**Note:** UX spec was already finalised before these decisions were written — UX spec requires review against these decisions before Phase B.

---

## Equip gesture — CONFIRMED: drag-to-slot

**Confirmed by [OWNER] 2026-03-28**

The owner has confirmed **drag-to-slot** as the equip interaction (not tap-slot-then-pick).

UX spec must define:
1. Drag gesture: Harry long-presses or picks up an item from the compatible items strip, drags it to a slot on the horse silhouette, releases to equip
2. Visual feedback during drag: item follows finger/cursor, slot highlights when compatible item is hovering over it
3. Failed drag (dropped outside a slot): item animates back to strip
4. Slot states: empty (dashed border, slot icon), drag-hover (highlighted, `--blue` glow), filled (item thumbnail)
5. The compatible items strip remains horizontally scrollable while a drag is not in progress
6. On iPad the drag target zones around the horse must be large enough for a child's finger (minimum 44×44pt hit areas per HIG)
7. Tap-to-equip (tap item, then tap slot) should also work as an alternative — drag is primary, tap is fallback

---

## Equip/unequip gestures — FINAL (confirmed 2026-03-28)

### Equip
- **Primary:** drag item from the compatible items strip onto a slot on the horse silhouette
- **Fallback:** double-tap an item in the compatible items strip to equip it to the next available compatible slot

### Unequip
- **Double-tap a filled slot** to unequip the item — item returns to inventory
- No confirmation dialog required — double-tap is deliberate enough to be unambiguous

### Leg slot rule (unchanged)
- Dragging or double-tapping a boots/bandages item fills all 4 leg slots simultaneously
- Double-tapping any filled leg slot unequips all 4 simultaneously and returns one item to inventory

### What this replaces in the spec
- Single-tap item → tap slot (tap-to-equip) was previously the spec'd fallback — REPLACE with double-tap
- Single-tap filled slot to unequip — REPLACE with double-tap
- These changes must be reflected in the interaction-spec.md equip screen section
