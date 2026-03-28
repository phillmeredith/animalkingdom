#!/usr/bin/env python3
"""
Generate animals_catalog.json from image directories.

Usage: python3 scripts/generate_animals_catalog.py
Output: src/data/animals_catalog.json

Categories (image dir → AnimalCategory):
  Dinosaurs  → Lost World
  Farm       → Farm
  Home_Pets  → At Home
  Marine     → Sea
  Stables    → Stables
  Wildlife   → Wild
  Habitats   → skipped (background images)
"""

import os
import json
import re
import hashlib

# ── Config ────────────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANIMALS_DIR = os.path.join(BASE_DIR, 'animals')
OUTPUT_PATH = os.path.join(BASE_DIR, 'src', 'data', 'animals_catalog.json')

CATEGORY_MAP = {
    'Dinosaurs':  'Lost World',
    'Farm':       'Farm',
    'Home_Pets':  'At Home',
    'Marine':     'Sea',
    'Stables':    'Stables',
    'Wildlife':   'Wild',
}

# Defaults per category
CATEGORY_DEFAULTS = {
    'At Home':    {'habitat': 'Home', 'diet': 'Varies', 'lifespan': '10–15 years', 'region': 'Worldwide', 'animalType': 'Pet'},
    'Stables':    {'habitat': 'Stables / Pasture', 'diet': 'Herbivore', 'lifespan': '25–30 years', 'region': 'Worldwide', 'animalType': 'Horse'},
    'Farm':       {'habitat': 'Farm', 'diet': 'Herbivore', 'lifespan': '10–20 years', 'region': 'Worldwide', 'animalType': 'Farm Animal'},
    'Sea':        {'habitat': 'Ocean', 'diet': 'Varies', 'lifespan': 'Varies', 'region': 'Worldwide', 'animalType': 'Marine Animal'},
    'Wild':       {'habitat': 'Wilderness', 'diet': 'Varies', 'lifespan': 'Varies', 'region': 'Worldwide', 'animalType': 'Wild Animal'},
    'Lost World': {'habitat': 'Prehistoric', 'diet': 'Varies', 'lifespan': 'Unknown', 'region': 'Prehistoric Earth', 'animalType': 'Dinosaur'},
}

# Name-pattern overrides for Lost World animalType.
# Pterosaurs are flying reptiles — not true dinosaurs — but share the Lost World era.
# Marine reptiles (plesiosaurs, ichthyosaurs, mosasaurs) also lived alongside dinosaurs.
# Detecting these by well-known suffix/substring patterns avoids false "Dinosaur" labels.
PTEROSAUR_PATTERNS = [
    'pteryx', 'pterus', 'pteron', 'dactylus', 'dactyl', 'dactyon',
    'ptenodracon', 'ptenodraco',
    # Ends-with draco/dracon/drakos — most Lost World draco-suffix entries are pterosaurs
    # (exceptions like Pantydraco are rare; the slight mis-label is less confusing than calling
    # them all "Dinosaur" when they visually look like dragons)
]
PTEROSAUR_ENDINGS = ('draco', 'dracon', 'drakos', 'dracus')

MARINE_REPTILE_PATTERNS = [
    'plesiosaur', 'pliosaurus', 'elasmosaur', 'ichthyosaur', 'mosasaur',
    'nothosaur', 'temnodontosaur', 'ophthalmosaur',
]


def lost_world_animal_type(name: str) -> str:
    """Return a more accurate animalType for Lost World (prehistoric) entries."""
    n = name.lower()
    for pat in PTEROSAUR_PATTERNS:
        if pat in n:
            return 'Pterosaur'
    if n.endswith(PTEROSAUR_ENDINGS):
        return 'Pterosaur'
    for pat in MARINE_REPTILE_PATTERNS:
        if pat in n:
            return 'Marine Reptile'
    return 'Dinosaur'

# Rarity distribution — deterministic via name hash
# Distribution: 50% common, 25% uncommon, 15% rare, 7% epic, 3% legendary
RARITY_THRESHOLDS = [
    (0.50, 'common'),
    (0.75, 'uncommon'),
    (0.90, 'rare'),
    (0.97, 'epic'),
    (1.00, 'legendary'),
]

PREFERRED_EXTS = ['.jpg', '.jpeg', '.webp', '.png']


def name_from_filename(filename: str) -> str:
    """Convert filename to display name.
    'African_Lion.jpg' → 'African Lion'
    'African Lion.jpg' → 'African Lion'
    Remove trailing _N suffix for numbered variants.
    """
    stem = os.path.splitext(filename)[0]
    # Remove trailing _1, _2 ... _9 suffix (numbered color variants)
    stem = re.sub(r'_\d+$', '', stem)
    # Replace underscores with spaces
    name = stem.replace('_', ' ').strip()
    return name


def slug_from_name(name: str) -> str:
    """Convert display name to kebab-case id."""
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def assign_rarity(name: str) -> str:
    """Deterministic rarity from name hash."""
    h = int(hashlib.md5(name.encode()).hexdigest(), 16)
    p = (h % 1000) / 1000.0
    for threshold, rarity in RARITY_THRESHOLDS:
        if p < threshold:
            return rarity
    return 'common'


def public_image_url(dir_name: str, filename: str) -> str:
    return f'/Animals/{dir_name}/{filename}'


def main():
    entries = {}  # id → entry (dedup by id, first write wins)

    for dir_name, category in CATEGORY_MAP.items():
        dir_path = os.path.join(ANIMALS_DIR, dir_name)
        if not os.path.isdir(dir_path):
            print(f'  SKIP {dir_name} — directory not found')
            continue

        files = [
            f for f in os.listdir(dir_path)
            if not f.startswith('.')
            and os.path.splitext(f)[1].lower() in PREFERRED_EXTS
        ]

        # Group files by base name (to pick best format and deduplicate numbered variants)
        groups: dict[str, list[str]] = {}
        for f in files:
            stem = os.path.splitext(f)[0]
            # Normalise: strip trailing _N to get base
            base = re.sub(r'_\d+$', '', stem)
            groups.setdefault(base, []).append(f)

        for base_stem, group_files in sorted(groups.items()):
            # Pick best file: prefer lowest-numbered variant, then best extension
            def sort_key(fname):
                ext = os.path.splitext(fname)[1].lower()
                ext_rank = PREFERRED_EXTS.index(ext) if ext in PREFERRED_EXTS else 99
                # For numbered variants, pick _1 first
                m = re.search(r'_(\d+)', os.path.splitext(fname)[0])
                num = int(m.group(1)) if m else 0
                return (num, ext_rank)

            group_files_sorted = sorted(group_files, key=sort_key)
            chosen = group_files_sorted[0]

            name = name_from_filename(chosen)
            if not name:
                continue

            entry_id = slug_from_name(name)
            if entry_id in entries:
                continue  # hand-crafted entries take priority (loaded separately)

            defaults = CATEGORY_DEFAULTS[category]
            rarity = assign_rarity(name)
            animal_type = (
                lost_world_animal_type(name)
                if category == 'Lost World'
                else defaults['animalType']
            )

            entry = {
                'id': entry_id,
                'name': name,
                'animalType': animal_type,
                'breed': name,
                'category': category,
                'rarity': rarity,
                'imageUrl': public_image_url(dir_name, chosen),
                'habitat': defaults['habitat'],
                'diet': defaults['diet'],
                'lifespan': defaults['lifespan'],
                'region': defaults['region'],
            }
            entries[entry_id] = entry

        print(f'  {dir_name}: {len([b for b in groups])} animals')

    result = sorted(entries.values(), key=lambda e: e['name'].lower())
    print(f'\nTotal generated: {len(result)} animals')

    with open(OUTPUT_PATH, 'w') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f'Written to {OUTPUT_PATH}')


if __name__ == '__main__':
    main()
