// generateOptions.ts — All wizard step data + name/narrative/rarity generation
// No API calls — everything is local

import type { AnimalCategory, Rarity } from './animals'

// ─── Step option types ────────────────────────────────────────────────────────

export type Age = 'Newborn' | 'Baby' | 'Young' | 'Adult' | 'Old Timer'
export type Gender = 'Male' | 'Female'

export interface CategoryOption {
  value: AnimalCategory
}

export interface TypeOption {
  value: string
  category: AnimalCategory
}

export interface PersonalityOption {
  value: string
  description: string
}

export interface BreedOption {
  value: string
  label: string
  rarity: Rarity
  imageUrl: string
}

export interface ColourOption {
  value: string
  label: string
  hex: string
}

// ─── Step 1 — Categories ─────────────────────────────────────────────────────

export const CATEGORIES: CategoryOption[] = [
  { value: 'At Home' },
  { value: 'Stables' },
  { value: 'Farm' },
  { value: 'Lost World' },
  { value: 'Wild' },
  { value: 'Sea' },
]

// ─── Step 2 — Animal Types per Category ──────────────────────────────────────

export const TYPES_BY_CATEGORY: Record<AnimalCategory, TypeOption[]> = {
  'At Home': [
    { value: 'Dog',        category: 'At Home' },
    { value: 'Cat',        category: 'At Home' },
    { value: 'Rabbit',     category: 'At Home' },
    { value: 'Guinea Pig', category: 'At Home' },
    { value: 'Parrot',     category: 'At Home' },
    { value: 'Hamster',    category: 'At Home' },
  ],
  'Stables': [
    { value: 'Horse',  category: 'Stables' },
    { value: 'Pony',   category: 'Stables' },
    { value: 'Donkey', category: 'Stables' },
  ],
  'Farm': [
    { value: 'Cow',     category: 'Farm' },
    { value: 'Pig',     category: 'Farm' },
    { value: 'Sheep',   category: 'Farm' },
    { value: 'Chicken', category: 'Farm' },
    { value: 'Goat',    category: 'Farm' },
    { value: 'Duck',    category: 'Farm' },
  ],
  'Lost World': [
    { value: 'Dinosaur',  category: 'Lost World' },
    { value: 'Pterosaur', category: 'Lost World' },
    { value: 'Mammoth',   category: 'Lost World' },
  ],
  'Wild': [
    { value: 'Tiger',    category: 'Wild' },
    { value: 'Lion',     category: 'Wild' },
    { value: 'Elephant', category: 'Wild' },
    { value: 'Wolf',     category: 'Wild' },
    { value: 'Bear',     category: 'Wild' },
    { value: 'Panda',    category: 'Wild' },
    { value: 'Fox',      category: 'Wild' },
    { value: 'Gorilla',  category: 'Wild' },
    { value: 'Koala',    category: 'Wild' },
    { value: 'Giraffe',  category: 'Wild' },
  ],
  'Sea': [
    { value: 'Dolphin',  category: 'Sea' },
    { value: 'Shark',    category: 'Sea' },
    { value: 'Whale',    category: 'Sea' },
    { value: 'Turtle',   category: 'Sea' },
    { value: 'Octopus',  category: 'Sea' },
    { value: 'Seahorse', category: 'Sea' },
  ],
}

export const ALL_TYPES: TypeOption[] = Object.values(TYPES_BY_CATEGORY).flat()

// ─── Step 3 — Genders ────────────────────────────────────────────────────────

export const GENDERS: { value: Gender }[] = [
  { value: 'Male' },
  { value: 'Female' },
]

// ─── Step 4 — Ages ───────────────────────────────────────────────────────────

export const AGES: { value: Age; description: string }[] = [
  { value: 'Newborn',   description: 'Just arrived in the world' },
  { value: 'Baby',      description: 'Full of wonder and curiosity' },
  { value: 'Young',     description: 'Energetic and playful' },
  { value: 'Adult',     description: 'Confident and capable' },
  { value: 'Old Timer', description: 'Wise and distinguished' },
]

// ─── Step 5 — Personalities ──────────────────────────────────────────────────

export const PERSONALITIES: PersonalityOption[] = [
  { value: 'Brave',       description: 'Fearless and bold' },
  { value: 'Gentle',      description: 'Calm and kind-hearted' },
  { value: 'Playful',     description: 'Always up for fun' },
  { value: 'Curious',     description: 'Loves to explore' },
  { value: 'Loyal',       description: 'Your faithful companion' },
  { value: 'Mischievous', description: 'Cheeky and unpredictable' },
  { value: 'Proud',       description: 'Regal and dignified' },
  { value: 'Shy',         description: 'Quietly observant' },
  { value: 'Fierce',      description: 'Intense and passionate' },
  { value: 'Cheerful',    description: 'Spreads joy everywhere' },
  { value: 'Clever',      description: 'Quick-thinking problem solver' },
  { value: 'Adventurous', description: 'Born to explore' },
]

// ─── Step 6 — Breeds per Type ────────────────────────────────────────────────

export const BREEDS_BY_TYPE: Record<string, BreedOption[]> = {
  'Dog': [
    { value: 'Labrador',        label: 'Labrador Retriever', rarity: 'common',    imageUrl: '/Animals/Home_Pets/Labrador_Retriever.jpg' },
    { value: 'Golden Retriever',label: 'Golden Retriever',   rarity: 'common',    imageUrl: '/Animals/Home_Pets/Golden_Retriever.jpg' },
    { value: 'Beagle',          label: 'Beagle',             rarity: 'common',    imageUrl: '/Animals/Home_Pets/Beagle.jpg' },
    { value: 'Border Collie',   label: 'Border Collie',      rarity: 'uncommon',  imageUrl: '/Animals/Home_Pets/Border_Collie.jpg' },
    { value: 'French Bulldog',  label: 'French Bulldog',     rarity: 'rare',      imageUrl: '/Animals/Home_Pets/French_Bulldog.jpg' },
    { value: 'Husky',           label: 'Siberian Husky',     rarity: 'uncommon',  imageUrl: '/Animals/Home_Pets/Siberian_Husky.jpg' },
    { value: 'Dalmatian',       label: 'Dalmatian',          rarity: 'rare',      imageUrl: '/Animals/Home_Pets/Dalmatian.jpg' },
    { value: 'Corgi',           label: 'Pembroke Welsh Corgi', rarity: 'rare',    imageUrl: '/Animals/Home_Pets/Pembroke_Welsh_Corgi.jpg' },
  ],
  'Cat': [
    { value: 'Abyssinian',  label: 'Abyssinian',    rarity: 'uncommon',  imageUrl: '/Animals/Home_Pets/Abyssinian.jpg' },
    { value: 'Bengal',      label: 'Bengal Cat',    rarity: 'rare',      imageUrl: '/Animals/Home_Pets/Bengal_Cat.jpg' },
    { value: 'Persian',     label: 'Persian',       rarity: 'rare',      imageUrl: '/Animals/Home_Pets/Persian.jpg' },
    { value: 'Maine Coon',  label: 'Maine Coon',    rarity: 'uncommon',  imageUrl: '/Animals/Home_Pets/Maine_Coon.jpg' },
    { value: 'Siamese',     label: 'Siamese',       rarity: 'uncommon',  imageUrl: '/Animals/Home_Pets/Siamese.jpg' },
    { value: 'Ragdoll',     label: 'Ragdoll',       rarity: 'common',    imageUrl: '/Animals/Home_Pets/Ragdoll.jpg' },
    { value: 'Scottish Fold', label: 'Scottish Fold', rarity: 'rare',    imageUrl: '/Animals/Home_Pets/Scottishfold_Cats_Scottish_Fold.jpg' },
    { value: 'Sphynx',     label: 'Sphynx',        rarity: 'epic',      imageUrl: '/Animals/Home_Pets/Sphynx.jpg' },
  ],
  'Rabbit': [
    { value: 'Holland Lop',     label: 'Holland Lop',       rarity: 'uncommon', imageUrl: '/Animals/Farm/Mini_Lop_Rabbit.jpg' },
    { value: 'Lionhead',        label: 'Lionhead',           rarity: 'rare',     imageUrl: '/Animals/Home_Pets/Rabbit.jpg' },
    { value: 'Dutch',           label: 'Dutch Rabbit',       rarity: 'common',   imageUrl: '/Animals/Home_Pets/Dutch_Rabbit.jpg' },
    { value: 'Rex',             label: 'Rex Rabbit',         rarity: 'uncommon', imageUrl: '/Animals/Home_Pets/Rex_Rabbit.jpg' },
    { value: 'Angora',          label: 'English Angora',     rarity: 'rare',     imageUrl: '/Animals/Home_Pets/English_Angora_Rabbit.jpg' },
  ],
  'Guinea Pig': [
    { value: 'Abyssinian GP',   label: 'Abyssinian',   rarity: 'common',   imageUrl: '/Animals/Home_Pets/Abyssinian_Guinea_Pig.jpg' },
    { value: 'Peruvian',        label: 'Peruvian',     rarity: 'uncommon', imageUrl: '/Animals/Home_Pets/Abyssinian_Guinea_Pig.jpg' },
    { value: 'Teddy',           label: 'Teddy',        rarity: 'common',   imageUrl: '/Animals/Home_Pets/Abyssinian_Guinea_Pig.jpg' },
    { value: 'Silkie',          label: 'Silkie',       rarity: 'rare',     imageUrl: '/Animals/Home_Pets/Abyssinian_Guinea_Pig.jpg' },
  ],
  'Parrot': [
    { value: 'African Grey',    label: 'African Grey',      rarity: 'epic',      imageUrl: '/Animals/Home_Pets/African_Grey_Parrot.jpg' },
    { value: 'Budgerigar',      label: 'Budgerigar',        rarity: 'common',    imageUrl: '/Animals/Home_Pets/Budgerigar.jpg' },
    { value: 'Cockatiel',       label: 'Cockatiel',         rarity: 'common',    imageUrl: '/Animals/Home_Pets/Cockatiel.jpg' },
    { value: 'Macaw',           label: 'Blue and Gold Macaw', rarity: 'legendary', imageUrl: '/Animals/Home_Pets/Macaw.jpg' },
    { value: 'Conure',          label: 'Sun Conure',        rarity: 'rare',      imageUrl: '/Animals/Home_Pets/Conure.jpg' },
  ],
  'Hamster': [
    { value: 'Syrian',          label: 'Syrian Hamster',    rarity: 'common',    imageUrl: '/Animals/Home_Pets/Syrian_Hamster.jpg' },
    { value: 'Roborovski',      label: 'Roborovski Dwarf',  rarity: 'uncommon',  imageUrl: '/Animals/Home_Pets/Dwarf_Hamster.jpg' },
    { value: 'Chinese',         label: 'Chinese Hamster',   rarity: 'rare',      imageUrl: '/Animals/Home_Pets/Hamster.jpg' },
  ],
  'Horse': [
    { value: 'Andalusian',    label: 'Andalusian',       rarity: 'rare',      imageUrl: '/Animals/Stables/Andalusian_horse.jpg' },
    { value: 'Arabian',       label: 'Arabian',          rarity: 'epic',      imageUrl: '/Animals/Stables/Arabian_horse.jpg' },
    { value: 'Thoroughbred',  label: 'Thoroughbred',     rarity: 'rare',      imageUrl: '/Animals/Stables/Thoroughbred_horse.jpg' },
    { value: 'Shire',         label: 'Shire Horse',      rarity: 'uncommon',  imageUrl: '/Animals/Stables/Shire_Horse_1.jpg' },
    { value: 'Appaloosa',     label: 'Appaloosa',        rarity: 'uncommon',  imageUrl: '/Animals/Stables/Appaloosa_horse.jpg' },
    { value: 'Friesian',      label: 'Friesian',         rarity: 'rare',      imageUrl: '/Animals/Stables/Friesian_horse.jpg' },
    { value: 'Mustang',       label: 'Mustang',          rarity: 'epic',      imageUrl: '/Animals/Stables/Mustang_horse.jpg' },
    { value: 'Lipizzaner',    label: 'Lipizzaner',       rarity: 'legendary', imageUrl: '/Animals/Stables/Lipizzaner_horse.jpg' },
  ],
  'Pony': [
    { value: 'Shetland',      label: 'Shetland Pony',   rarity: 'common',    imageUrl: '/Animals/Stables/Shetland_Pony.jpg' },
    { value: 'Miniature',     label: 'Miniature Horse',  rarity: 'uncommon',  imageUrl: '/Animals/Stables/Miniature_horse.jpg' },
    { value: 'Welsh',         label: 'Welsh Pony',       rarity: 'uncommon',  imageUrl: '/Animals/Stables/Welsh_Pony.jpg' },
    { value: 'Connemara',     label: 'Connemara Pony',   rarity: 'rare',      imageUrl: '/Animals/Stables/Connemara_Pony.jpg' },
  ],
  'Donkey': [
    { value: 'Miniature Donkey', label: 'Miniature Donkey', rarity: 'common',  imageUrl: '/Animals/Stables/Donkey.jpg' },
    { value: 'Standard',         label: 'Standard Donkey',  rarity: 'common',  imageUrl: '/Animals/Stables/Donkey.jpg' },
    { value: 'Mammoth',          label: 'Mammoth Jackstock', rarity: 'rare',   imageUrl: '/Animals/Stables/Donkey.jpg' },
  ],
  'Cow': [
    { value: 'Angus',         label: 'Angus',            rarity: 'common',    imageUrl: '/Animals/Farm/Cow.jpg' },
    { value: 'Hereford',      label: 'Hereford',         rarity: 'common',    imageUrl: '/Animals/Farm/Hereford Cow.jpg' },
    { value: 'Highland',      label: 'Highland',         rarity: 'rare',      imageUrl: '/Animals/Farm/Highland_Cattle.jpg' },
    { value: 'Holstein',      label: 'Holstein',         rarity: 'common',    imageUrl: '/Animals/Farm/Holstein Cow.jpg' },
    { value: 'Longhorn',      label: 'Texas Longhorn',   rarity: 'uncommon',  imageUrl: '/Animals/Farm/English_Longhorn_Cattle.jpg' },
  ],
  'Pig': [
    { value: 'Old Spots',     label: 'Gloucestershire Old Spots', rarity: 'uncommon', imageUrl: '/Animals/Farm/Pig.jpg' },
    { value: 'Tamworth',      label: 'Tamworth',         rarity: 'uncommon',  imageUrl: '/Animals/Farm/Tamworth_Pig.jpg' },
    { value: 'Berkshire',     label: 'Berkshire',        rarity: 'rare',      imageUrl: '/Animals/Farm/Pig.jpg' },
    { value: 'Kunekune',      label: 'Kunekune',         rarity: 'rare',      imageUrl: '/Animals/Farm/Pig.jpg' },
    { value: 'Saddleback',    label: 'Saddleback',       rarity: 'common',    imageUrl: '/Animals/Farm/Saddleback_Pig.jpg' },
  ],
  'Sheep': [
    { value: 'Suffolk',       label: 'Suffolk',          rarity: 'common',    imageUrl: '/Animals/Farm/Sheep.jpg' },
    { value: 'Merino',        label: 'Merino',           rarity: 'uncommon',  imageUrl: '/Animals/Farm/Sheep.jpg' },
    { value: 'Valais Blacknose', label: 'Valais Blacknose', rarity: 'epic',   imageUrl: '/Animals/Farm/Valais_Blacknose_Sheep.jpg' },
    { value: 'Herdwick',      label: 'Herdwick',         rarity: 'uncommon',  imageUrl: '/Animals/Farm/Sheep.jpg' },
  ],
  'Chicken': [
    { value: 'Buff Orpington', label: 'Buff Orpington',  rarity: 'common',   imageUrl: '/Animals/Farm/Buff_Orpington_Chicken.jpg' },
    { value: 'Silkie',         label: 'Silkie',          rarity: 'rare',      imageUrl: '/Animals/Farm/Chicken.jpg' },
    { value: 'Rhode Island',   label: 'Rhode Island Red', rarity: 'common',   imageUrl: '/Animals/Farm/Chicken.jpg' },
    { value: 'Brahma',         label: 'Brahma',          rarity: 'uncommon',  imageUrl: '/Animals/Farm/Brahma_Chicken.jpg' },
  ],
  'Goat': [
    { value: 'Alpine',         label: 'Alpine Goat',     rarity: 'common',   imageUrl: '/Animals/Farm/Alpine_Goat.jpg' },
    { value: 'Pygmy',          label: 'Pygmy Goat',      rarity: 'uncommon', imageUrl: '/Animals/Farm/American_Pygmy_Goat.jpg' },
    { value: 'Angora',         label: 'Angora Goat',     rarity: 'rare',     imageUrl: '/Animals/Farm/Angora_Goat.jpg' },
    { value: 'Cashmere',       label: 'Cashmere Goat',   rarity: 'epic',     imageUrl: '/Animals/Farm/Cashmere_Goat.jpg' },
  ],
  'Duck': [
    { value: 'Mallard',        label: 'Mallard',         rarity: 'common',   imageUrl: '/Animals/Wildlife/Duck.jpg' },
    { value: 'Khaki Campbell', label: 'Khaki Campbell',  rarity: 'common',   imageUrl: '/Animals/Wildlife/Duck.jpg' },
    { value: 'Pekin',          label: 'Pekin Duck',      rarity: 'uncommon', imageUrl: '/Animals/Wildlife/Duck.jpg' },
    { value: 'Muscovy',        label: 'Muscovy Duck',    rarity: 'uncommon', imageUrl: '/Animals/Wildlife/Duck.jpg' },
  ],
  'Dinosaur': [
    { value: 'T. rex',         label: 'Tyrannosaurus Rex',   rarity: 'legendary', imageUrl: '/Animals/Dinosaurs/Tyrannosaurus.jpg' },
    { value: 'Triceratops',    label: 'Triceratops',         rarity: 'rare',      imageUrl: '/Animals/Dinosaurs/Triceratops.jpg' },
    { value: 'Stegosaurus',    label: 'Stegosaurus',         rarity: 'uncommon',  imageUrl: '/Animals/Dinosaurs/Stegosaurus.jpg' },
    { value: 'Brachiosaurus',  label: 'Brachiosaurus',       rarity: 'epic',      imageUrl: '/Animals/Dinosaurs/Brachiosaurus.jpg' },
    { value: 'Ankylosaurus',   label: 'Ankylosaurus',        rarity: 'rare',      imageUrl: '/Animals/Dinosaurs/Ankylosaurus.jpg' },
    { value: 'Raptor',         label: 'Velociraptor',        rarity: 'epic',      imageUrl: '/Animals/Dinosaurs/Velociraptor.jpg' },
    { value: 'Spinosaurus',    label: 'Spinosaurus',         rarity: 'legendary', imageUrl: '/Animals/Dinosaurs/Spinosaurus.jpg' },
  ],
  'Pterosaur': [
    { value: 'Pterodactyl',    label: 'Pterodactyl',         rarity: 'uncommon',  imageUrl: '/Animals/Dinosaurs/Pterodactyl.jpg' },
    { value: 'Quetzalcoatlus', label: 'Quetzalcoatlus',      rarity: 'legendary', imageUrl: '/Animals/Dinosaurs/Pterodactyl.jpg' },
    { value: 'Rhamphorhynchus', label: 'Rhamphorhynchus',    rarity: 'rare',      imageUrl: '/Animals/Dinosaurs/Pterodactyl.jpg' },
  ],
  'Mammoth': [
    { value: 'Woolly',         label: 'Woolly Mammoth',      rarity: 'legendary', imageUrl: '/Animals/Wildlife/Woolly_Mammoth.jpg' },
    { value: 'Columbian',      label: 'Columbian Mammoth',   rarity: 'epic',      imageUrl: '/Animals/Wildlife/Woolly_Mammoth.jpg' },
  ],
  'Tiger': [
    { value: 'Bengal',         label: 'Bengal Tiger',        rarity: 'legendary', imageUrl: '/Animals/Home_Pets/Bengal_Tiger.jpg' },
    { value: 'Siberian',       label: 'Siberian Tiger',      rarity: 'legendary', imageUrl: '/Animals/Wildlife/Siberian_Tiger.jpg' },
    { value: 'Sumatran',       label: 'Sumatran Tiger',      rarity: 'epic',      imageUrl: '/Animals/Wildlife/Sumatran_Tiger.jpg' },
    { value: 'White',          label: 'White Tiger',         rarity: 'legendary', imageUrl: '/Animals/Wildlife/White_Tiger.jpg' },
  ],
  'Lion': [
    { value: 'African',        label: 'African Lion',        rarity: 'epic',      imageUrl: '/Animals/Wildlife/African Lion.jpg' },
    { value: 'Asiatic',        label: 'Asiatic Lion',        rarity: 'legendary', imageUrl: '/Animals/Wildlife/African Lion.jpg' },
    { value: 'White Lion',     label: 'White Lion',          rarity: 'legendary', imageUrl: '/Animals/Wildlife/African Lion.jpg' },
  ],
  'Elephant': [
    { value: 'African Bush',   label: 'African Bush',        rarity: 'epic',      imageUrl: '/Animals/Wildlife/African_Elephant.jpg' },
    { value: 'African Forest', label: 'African Forest',      rarity: 'rare',      imageUrl: '/Animals/Wildlife/African_Forest_Elephant.jpg' },
    { value: 'Asian',          label: 'Asian Elephant',      rarity: 'epic',      imageUrl: '/Animals/Wildlife/Asian_Elephant.jpg' },
  ],
  'Wolf': [
    { value: 'Grey',           label: 'Grey Wolf',           rarity: 'rare',      imageUrl: '/Animals/Wildlife/Gray Wolf.jpg' },
    { value: 'Arctic',         label: 'Arctic Wolf',         rarity: 'epic',      imageUrl: '/Animals/Wildlife/Arctic_Wolf.jpg' },
    { value: 'Red',            label: 'Red Wolf',            rarity: 'rare',      imageUrl: '/Animals/Wildlife/Red_Wolf.jpg' },
    { value: 'Maned',          label: 'Maned Wolf',          rarity: 'legendary', imageUrl: '/Animals/Wildlife/Maned_Wolf.jpg' },
  ],
  'Bear': [
    { value: 'Polar',          label: 'Polar Bear',          rarity: 'epic',      imageUrl: '/Animals/Wildlife/Polar_Bear.jpg' },
    { value: 'Grizzly',        label: 'Grizzly Bear',        rarity: 'rare',      imageUrl: '/Animals/Wildlife/Grizzly_Bear.jpg' },
    { value: 'Panda',          label: 'Giant Panda',         rarity: 'legendary', imageUrl: '/Animals/Wildlife/Giant_Panda_Bear.jpg' },
    { value: 'Black',          label: 'American Black Bear', rarity: 'uncommon',  imageUrl: '/Animals/Wildlife/North_American_Black_Bear.jpg' },
  ],
  'Panda': [
    { value: 'Giant',          label: 'Giant Panda',         rarity: 'legendary', imageUrl: '/Animals/Wildlife/Giant_Panda_Bear.jpg' },
    { value: 'Red Panda',      label: 'Red Panda',           rarity: 'rare',      imageUrl: '/Animals/Wildlife/Red_Panda.jpg' },
  ],
  'Fox': [
    { value: 'Red Fox',        label: 'Red Fox',             rarity: 'common',    imageUrl: '/Animals/Wildlife/Red_Fox.jpg' },
    { value: 'Arctic Fox',     label: 'Arctic Fox',          rarity: 'rare',      imageUrl: '/Animals/Wildlife/Arctic_Fox.jpg' },
    { value: 'Fennec',         label: 'Fennec Fox',          rarity: 'epic',      imageUrl: '/Animals/Wildlife/Fennec_Fox.jpg' },
  ],
  'Gorilla': [
    { value: 'Western Lowland', label: 'Western Lowland',   rarity: 'epic',      imageUrl: '/Animals/Wildlife/Gorilla.jpg' },
    { value: 'Mountain',        label: 'Mountain Gorilla',  rarity: 'legendary', imageUrl: '/Animals/Wildlife/Mountain_Gorilla.jpg' },
    { value: 'Cross River',     label: 'Cross River',       rarity: 'legendary', imageUrl: '/Animals/Wildlife/Cross_River_Gorilla.jpg' },
  ],
  'Koala': [
    { value: 'Koala',          label: 'Koala',               rarity: 'rare',      imageUrl: '/Animals/Wildlife/Koala.jpg' },
  ],
  'Giraffe': [
    { value: 'Reticulated',    label: 'Reticulated Giraffe', rarity: 'rare',      imageUrl: '/Animals/Wildlife/Giraffe.jpg' },
    { value: 'Masai',          label: 'Masai Giraffe',       rarity: 'uncommon',  imageUrl: '/Animals/Wildlife/Giraffe.jpg' },
    { value: 'Rothschild',     label: 'Rothschild Giraffe',  rarity: 'legendary', imageUrl: '/Animals/Wildlife/Giraffe.jpg' },
  ],
  'Dolphin': [
    { value: 'Bottlenose',     label: 'Bottlenose',          rarity: 'uncommon',  imageUrl: '/Animals/Marine/Bottlenose_Dolphin.jpg' },
    { value: 'Spinner',        label: 'Spinner Dolphin',     rarity: 'rare',      imageUrl: '/Animals/Marine/Bottlenose_Dolphin.jpg' },
    { value: 'Pink River',     label: 'Pink River Dolphin',  rarity: 'legendary', imageUrl: '/Animals/Marine/Bottlenose_Dolphin.jpg' },
  ],
  'Shark': [
    { value: 'Great White',    label: 'Great White',         rarity: 'legendary', imageUrl: '/Animals/Marine/Great_White_Shark.jpg' },
    { value: 'Hammerhead',     label: 'Hammerhead',          rarity: 'rare',      imageUrl: '/Animals/Marine/Hammerhead_Shark.jpg' },
    { value: 'Whale Shark',    label: 'Whale Shark',         rarity: 'epic',      imageUrl: '/Animals/Marine/Whale_Shark.jpg' },
    { value: 'Nurse',          label: 'Nurse Shark',         rarity: 'common',    imageUrl: '/Animals/Marine/Great_White_Shark.jpg' },
  ],
  'Whale': [
    { value: 'Humpback',       label: 'Humpback Whale',      rarity: 'epic',      imageUrl: '/Animals/Marine/Humpback_Whale.jpg' },
    { value: 'Blue',           label: 'Blue Whale',          rarity: 'legendary', imageUrl: '/Animals/Marine/Humpback_Whale.jpg' },
    { value: 'Orca',           label: 'Orca',                rarity: 'epic',      imageUrl: '/Animals/Marine/Humpback_Whale.jpg' },
    { value: 'Beluga',         label: 'Beluga Whale',        rarity: 'rare',      imageUrl: '/Animals/Marine/Humpback_Whale.jpg' },
  ],
  'Turtle': [
    { value: 'Green Sea',      label: 'Green Sea Turtle',    rarity: 'rare',      imageUrl: '/Animals/Marine/Sea_Turtle.jpg' },
    { value: 'Leatherback',    label: 'Leatherback',         rarity: 'epic',      imageUrl: '/Animals/Marine/Leatherback_Sea_Turtle.jpg' },
    { value: 'Hawksbill',      label: 'Hawksbill',           rarity: 'epic',      imageUrl: '/Animals/Marine/Sea_Turtle.jpg' },
  ],
  'Octopus': [
    { value: 'Common',         label: 'Common Octopus',      rarity: 'uncommon',  imageUrl: '/Animals/Marine/Octopus.jpg' },
    { value: 'Blue-Ringed',    label: 'Blue-Ringed Octopus', rarity: 'legendary', imageUrl: '/Animals/Marine/Octopus.jpg' },
    { value: 'Giant Pacific',  label: 'Giant Pacific',       rarity: 'epic',      imageUrl: '/Animals/Marine/Octopus.jpg' },
  ],
  'Seahorse': [
    { value: 'Common Seahorse', label: 'Common Seahorse',    rarity: 'uncommon',  imageUrl: '/Animals/Stables/Seahorse.jpg' },
    { value: 'Leafy Sea Dragon', label: 'Leafy Sea Dragon',  rarity: 'legendary', imageUrl: '/Animals/Marine/leafy-sea-dragon.jpg' },
    { value: 'Pygmy Seahorse',  label: 'Pygmy Seahorse',     rarity: 'epic',      imageUrl: '/Animals/Stables/Seahorse.jpg' },
  ],
}

// ─── Step 7 — Colours per Type ───────────────────────────────────────────────

const DEFAULT_COLOURS: ColourOption[] = [
  { value: 'Brown',      label: 'Brown',       hex: '#8B5E3C' },
  { value: 'Black',      label: 'Black',       hex: '#2D2D2D' },
  { value: 'White',      label: 'White',       hex: '#F5F5F5' },
  { value: 'Grey',       label: 'Grey',        hex: '#9E9E9E' },
  { value: 'Golden',     label: 'Golden',      hex: '#D4A017' },
  { value: 'Spotted',    label: 'Spotted',     hex: '#B5651D' },
]

export const COLOURS_BY_TYPE: Record<string, ColourOption[]> = {
  'Dog': [
    { value: 'Golden',     label: 'Golden',          hex: '#D4A017' },
    { value: 'Black',      label: 'Black',            hex: '#2D2D2D' },
    { value: 'Chocolate',  label: 'Chocolate Brown',  hex: '#7B3F00' },
    { value: 'White',      label: 'White',            hex: '#F5F5F5' },
    { value: 'Tri-colour', label: 'Tri-colour',       hex: '#B5651D' },
    { value: 'Brindle',    label: 'Brindle',          hex: '#8B6914' },
  ],
  'Cat': [
    { value: 'Tabby',      label: 'Tabby',            hex: '#C4A882' },
    { value: 'Black',      label: 'Black',            hex: '#2D2D2D' },
    { value: 'White',      label: 'White',            hex: '#F5F5F5' },
    { value: 'Ginger',     label: 'Ginger',           hex: '#E07B39' },
    { value: 'Calico',     label: 'Calico',           hex: '#D4A017' },
    { value: 'Tortoiseshell', label: 'Tortoiseshell', hex: '#8B4513' },
  ],
  'Horse': [
    { value: 'Bay',        label: 'Bay',              hex: '#6B2D0F' },
    { value: 'Chestnut',   label: 'Chestnut',         hex: '#954535' },
    { value: 'Black',      label: 'Black',            hex: '#2D2D2D' },
    { value: 'Grey',       label: 'Dapple Grey',      hex: '#9E9E9E' },
    { value: 'Palomino',   label: 'Palomino',         hex: '#D4A017' },
    { value: 'Roan',       label: 'Blue Roan',        hex: '#7B8FA1' },
    { value: 'Skewbald',   label: 'Skewbald',         hex: '#C4872A' },
    { value: 'Appaloosa',  label: 'Spotted Appaloosa', hex: '#D0C4B0' },
  ],
  'Tiger': [
    { value: 'Orange and Black', label: 'Orange & Black', hex: '#E07B39' },
    { value: 'White',            label: 'White',          hex: '#F0EEE8' },
    { value: 'Golden',           label: 'Golden',         hex: '#D4A017' },
  ],
  'Lion': [
    { value: 'Tawny',    label: 'Tawny',       hex: '#C49A3C' },
    { value: 'White',    label: 'White',       hex: '#F5F5F5' },
    { value: 'Golden',   label: 'Golden',      hex: '#D4A017' },
  ],
  'Wolf': [
    { value: 'Grey',     label: 'Grey',        hex: '#9E9E9E' },
    { value: 'White',    label: 'Arctic White', hex: '#F5F5F5' },
    { value: 'Black',    label: 'Black',       hex: '#2D2D2D' },
    { value: 'Brown',    label: 'Brown',       hex: '#8B5E3C' },
  ],
  'Bear': [
    { value: 'White',    label: 'Polar White', hex: '#F0EEE8' },
    { value: 'Grizzly Brown', label: 'Grizzly Brown', hex: '#8B5E3C' },
    { value: 'Black',    label: 'Black',       hex: '#2D2D2D' },
    { value: 'Black and White', label: 'Black & White', hex: '#D0D0D0' },
  ],
  'Dinosaur': [
    { value: 'Forest Green', label: 'Forest Green', hex: '#2E7D32' },
    { value: 'Sandy Brown',  label: 'Sandy Brown',  hex: '#C49A3C' },
    { value: 'Amber',        label: 'Amber',        hex: '#D4A017' },
    { value: 'Dark Grey',    label: 'Dark Grey',    hex: '#555555' },
    { value: 'Blue-Green',   label: 'Blue-Green',   hex: '#2E6B6B' },
  ],
}

export function getColours(animalType: string): ColourOption[] {
  return COLOURS_BY_TYPE[animalType] ?? DEFAULT_COLOURS
}

// ─── Rarity determination ─────────────────────────────────────────────────────

export function determineRarity(breedRarity: Rarity): Rarity {
  return breedRarity
}

// ─── Name generation ──────────────────────────────────────────────────────────

const CLASSIC_NAMES_M = ['Archie','Buster','Charlie','Duke','Finn','George','Harry','Jake','Leo','Max','Oscar','Rex','Rufus','Sam','Theo']
const CLASSIC_NAMES_F = ['Bella','Coco','Daisy','Ella','Grace','Ivy','Lily','Luna','Molly','Nala','Poppy','Rose','Ruby','Stella','Violet']
const NATURE_WORDS    = ['Amber','Ash','Birch','Blaze','Cedar','Clay','Cloud','Dawn','Dusk','Ember','Fern','Flint','Frost','Gale','Hazel','Maple','Mist','Oak','River','Shadow','Sky','Snow','Storm','Thorn','Willow']
const BRAVE_NAMES     = ['Ace','Arrow','Bolt','Dash','Falcon','Flint','Force','Hunter','Ranger','Scout','Spirit','Swift','Thunder','Titan']
const GENTLE_NAMES    = ['Angel','Blossom','Breeze','Buttercup','Cloud','Dove','Feather','Honey','Misty','Pearl','Petal','Pudding','Snowdrop']
const DINO_NAMES      = ['Apex','Blaze','Crusher','Ember','Fury','Glacier','Inferno','Jaws','Magma','Nova','Quake','Rumble','Spike','Titan','Vortex']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Picks 4 unique names by cycling through pools twice.
// Pool depth verified 2026-03-29: smallest pool (GENTLE_NAMES) has 13 entries;
// three consecutive calls to generateNames() with the same parameters will
// almost certainly return different sets because each pool is independently
// shuffled per call. No thin-pool risk at 4 names.
function uniqueFour(pools: string[][]): string[] {
  const result: string[] = []
  const used = new Set<string>()
  // Two passes over the pool list to reach 4 unique picks
  for (let pass = 0; pass < 2 && result.length < 4; pass++) {
    for (const pool of pools) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      for (const name of shuffled) {
        if (!used.has(name)) {
          result.push(name)
          used.add(name)
          break
        }
      }
      if (result.length === 4) break
    }
  }
  // Fallback if pools exhausted
  while (result.length < 4) result.push(pickRandom(CLASSIC_NAMES_M))
  return result
}

export function generateNames(
  animalType: string,
  gender: Gender,
  personality: string,
): string[] {
  const classicPool = gender === 'Male' ? CLASSIC_NAMES_M : CLASSIC_NAMES_F
  const personalityPool = ['Brave', 'Fierce', 'Adventurous'].includes(personality) ? BRAVE_NAMES : GENTLE_NAMES
  const isDino = ['Dinosaur', 'Pterosaur', 'Mammoth'].includes(animalType)

  if (isDino) {
    return uniqueFour([DINO_NAMES, NATURE_WORDS, classicPool])
  }
  return uniqueFour([classicPool, NATURE_WORDS, personalityPool])
}

// ─── Discovery narrative ──────────────────────────────────────────────────────

const HABITATS: Record<string, string> = {
  'At Home':    'a cosy neighbourhood',
  'Stables':    'rolling green meadows',
  'Farm':       'a quiet countryside farm',
  'Lost World': 'a hidden prehistoric valley',
  'Wild':       'the heart of the wilderness',
  'Sea':        'the shimmering ocean depths',
}

const NARRATIVE_TEMPLATES = [
  'Found near {habitat}, this {personality} {age} {breed} caught the eye of an explorer. Their {colour} markings and bright eyes made them impossible to ignore.',
  'Deep in {habitat}, a {rarity} {age} {breed} was spotted all alone. With a {personality} spirit, they seemed ready for a new adventure.',
  'A chance encounter near {habitat} revealed this remarkable {age} {breed}. Their {personality} nature and {colour} colouring made them truly one of a kind.',
]

export interface CompleteSelections {
  category: AnimalCategory
  animalType: string
  gender: Gender
  age: Age
  personality: string
  breed: string
  colour: string
  rarity: Rarity
}

export function generateNarrative(s: CompleteSelections): string {
  const template = NARRATIVE_TEMPLATES[Math.floor(Math.random() * NARRATIVE_TEMPLATES.length)]
  return template
    .replace('{habitat}',     HABITATS[s.category] ?? s.category)
    .replace('{personality}', s.personality.toLowerCase())
    .replace('{age}',         s.age.toLowerCase())
    .replace('{breed}',       s.breed)
    .replace('{rarity}',      s.rarity)
    .replace('{colour}',      s.colour.toLowerCase())
}

// ─── TraderPuzzle question bank ───────────────────────────────────────────────

export interface TraderQuestion {
  questionId: string
  area: 'maths' | 'spelling' | 'science' | 'geography'
  question: string
  options: string[]
  correctIndex: number
}

export const TRADER_QUESTIONS: TraderQuestion[] = [
  { questionId: 'tq-m1', area: 'maths',     question: 'If you have 8 coins and earn 7 more, how many do you have?',         options: ['13','14','15','16'],      correctIndex: 2 },
  { questionId: 'tq-m2', area: 'maths',     question: 'A horse runs 12km each day for 5 days. How far in total?',           options: ['50km','60km','55km','65km'], correctIndex: 1 },
  { questionId: 'tq-m3', area: 'maths',     question: 'You have 50 coins. You spend 17. How many are left?',                options: ['23','33','37','43'],      correctIndex: 1 },
  { questionId: 'tq-m4', area: 'maths',     question: 'A tiger sleeps 16 hours a day. How many hours is it awake?',        options: ['6','7','8','9'],          correctIndex: 2 },
  { questionId: 'tq-m5', area: 'maths',     question: '3 elephants drink 200 litres each per day. How much in total?',     options: ['400L','500L','600L','700L'], correctIndex: 2 },
  { questionId: 'tq-s1', area: 'spelling',  question: 'Which is the correct spelling?',                                     options: ['Giraffe','Girafe','Girrafe','Girraffe'], correctIndex: 0 },
  { questionId: 'tq-s2', area: 'spelling',  question: 'Which is spelt correctly?',                                          options: ['Dalmatian','Dalmation','Dalmasian','Dalmachian'], correctIndex: 0 },
  { questionId: 'tq-s3', area: 'spelling',  question: 'How do you spell the big African animal?',                           options: ['Elefant','Elephent','Elephant','Elephannt'], correctIndex: 2 },
  { questionId: 'tq-s4', area: 'spelling',  question: 'Which is the correct spelling?',                                     options: ['Cheetah','Cheeta','Cheeteh','Chieetah'], correctIndex: 0 },
  { questionId: 'tq-sc1', area: 'science',  question: 'What do we call an animal that eats only plants?',                  options: ['Carnivore','Herbivore','Omnivore','Insectivore'], correctIndex: 1 },
  { questionId: 'tq-sc2', area: 'science',  question: 'Which animal is a mammal?',                                          options: ['Shark','Salmon','Whale','Crocodile'], correctIndex: 2 },
  { questionId: 'tq-sc3', area: 'science',  question: 'What is a group of lions called?',                                   options: ['Pack','Herd','Flock','Pride'], correctIndex: 3 },
  { questionId: 'tq-sc4', area: 'science',  question: 'What do dinosaurs belong to?',                                       options: ['Mammals','Reptiles','Amphibians','Birds'], correctIndex: 1 },
  { questionId: 'tq-sc5', area: 'science',  question: 'Which sense do sharks use to detect blood in water?',               options: ['Sight','Hearing','Smell','Touch'], correctIndex: 2 },
  { questionId: 'tq-g1', area: 'geography', question: 'Which continent do wild lions mostly live on?',                     options: ['Asia','Australia','Africa','South America'], correctIndex: 2 },
  { questionId: 'tq-g2', area: 'geography', question: 'Which country is the Giant Panda from?',                            options: ['Japan','India','China','Thailand'], correctIndex: 2 },
  { questionId: 'tq-g3', area: 'geography', question: 'Kangaroos are native to which country?',                            options: ['New Zealand','South Africa','Australia','Brazil'], correctIndex: 2 },
  { questionId: 'tq-g4', area: 'geography', question: 'The Amazon Rainforest is mostly in which country?',                 options: ['Colombia','Brazil','Peru','Venezuela'], correctIndex: 1 },
  { questionId: 'tq-g5', area: 'geography', question: 'Which ocean do Great White Sharks commonly live in?',               options: ['Arctic','Indian','Atlantic / Pacific','Red Sea'], correctIndex: 2 },
]
