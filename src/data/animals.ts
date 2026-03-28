// animals.ts — Static animal catalogue for the Explore / Directory screen
// Structure: AnimalEntry[] sorted A-Z by name
// Full dataset: hand-crafted entries merged with auto-generated catalog (4500+ animals)
// Hand-crafted entries (with quiz, facts, etc.) take priority over catalog entries with same id.

import generatedCatalog from './animals_catalog.json'
import { getEncyclopediaEntry, loadEncyclopedia } from './encyclopediaLookup'

export type AnimalCategory = 'At Home' | 'Stables' | 'Farm' | 'Lost World' | 'Wild' | 'Sea'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type SkillArea = 'maths' | 'spelling' | 'science' | 'geography'

// Category routing helpers — used by AnimalDetailModal to gate Care Needs vs Habitat Threats.
// Any code that branches on domestic/wild status must use these constants, not inline arrays.
export const DOMESTIC_CATEGORIES = ['At Home', 'Stables', 'Farm'] as const
export const WILD_CATEGORIES = ['Wild', 'Sea', 'Lost World'] as const

export interface AnimalQuiz {
  questionId: string
  area: SkillArea
  question: string
  options: string[]
  correctIndex: number
}

export interface AnimalEntry {
  id: string
  name: string
  animalType: string
  breed: string
  category: AnimalCategory
  rarity: Rarity
  imageUrl: string
  habitat: string
  diet: string
  lifespan: string
  region: string
  facts?: [string, string, string]
  quiz?: AnimalQuiz

  // ── Detail modal fields (all optional/nullable — UI handles absent values gracefully) ──

  /** Short punchy superpower sentence, e.g. "can run 112km/h". Shown in aurora callout block.
   *  Null → callout block is absent entirely. */
  superpower?: string | null

  /** Daily routine as an array of short sentences. Max 3 items rendered.
   *  Null → Daily Life section shows placeholder text. */
  dailyLife?: string[] | null

  /**
   * IUCN Red List conservation status code.
   * IMPORTANT: Errors here are educational material errors — verify against
   * https://www.iucnredlist.org before authoring. "LC" must not be used as a placeholder.
   */
  conservationStatus?: 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX' | 'DD' | null

  /** Supporting sentence for the conservation status (max ~40 words).
   *  If non-null, renders below the status pill. If null (but conservationStatus is
   *  non-null), the pill renders alone with no sentence. */
  conservationStatusDetail?: string | null

  /** How the animal lives socially (max ~50 words). Null → Social Life section absent. */
  socialBehaviour?: string | null

  /** Care requirements for domestic animals as a string array. Max 4 items rendered.
   *  Only shown when category is in DOMESTIC_CATEGORIES. Null → Care Needs section absent. */
  careNeeds?: string[] | null

  /** Care difficulty level for domestic animals: 1=Easy, 2=Moderate, 3=Demanding.
   *  Null → difficulty indicator row is omitted. */
  careDifficulty?: 1 | 2 | 3 | null

  /** Habitat threats for wild/sea/lost world animals as a string array. Max 3 items.
   *  Only shown when category is in WILD_CATEGORIES. Null → Threats section absent. */
  habitatThreats?: string[] | null

  /** Expansion sentence for the Habitat quick stat card (max ~25 words).
   *  Null → stat card shows headline value only. */
  habitatDetail?: string | null

  /** Expansion sentence for the Diet quick stat card (max ~25 words).
   *  Null → stat card shows headline value only. */
  dietDetail?: string | null

  /** Expansion sentence for the Lifespan quick stat card (max ~25 words).
   *  Null → stat card shows headline value only. */
  lifespanDetail?: string | null

  // ── Wikipedia enrichment (animal-detail-modal-v3) ────────────────────────────
  /** Short Wikipedia description paragraph. Source: animal_encyclopedia.json */
  wikiDescription?: string | null
  /** Wikipedia Commons thumbnail URL. Source: animal_encyclopedia.json */
  wikiThumbnail?: string | null
  /** Full Wikipedia article URL. Source: animal_encyclopedia.json */
  wikiUrl?: string | null

  // ── Scientific classification ────────────────────────────────────────────────
  scientificName?: string | null
  taxonomy?: {
    kingdom?: string
    phylum?: string
    class?: string
    order?: string
    family?: string
    genus?: string
    species?: string
  } | null

  // ── Physical measurements ────────────────────────────────────────────────────
  physicalSize?: { label: string; value: string; comparison?: string } | null
  physicalWeight?: { value: string; comparison?: string } | null
  topSpeed?: { value: string; comparison?: string } | null
  adaptations?: string[] | null

  // ── Reproduction ─────────────────────────────────────────────────────────────
  reproduction?: {
    gestationPeriod?: string
    litterSize?: string
    offspringName?: string
    ageAtIndependence?: string
    parentalCare?: string
  } | null

  // ── Ecology ──────────────────────────────────────────────────────────────────
  predators?: string[] | null
  geographicRange?: string | null

  // ── Cultural ─────────────────────────────────────────────────────────────────
  culturalSignificance?: string | null

  // ── Gallery ──────────────────────────────────────────────────────────────────
  gallery?: Array<{ url: string; alt: string }> | null
}

export const ANIMALS: AnimalEntry[] = [
  // ── At Home ─────────────────────────────────────────────────────────────────
  {
    id: 'abyssinian-cat',
    name: 'Abyssinian Cat',
    animalType: 'Cat',
    breed: 'Abyssinian',
    category: 'At Home',
    rarity: 'uncommon',
    imageUrl: '/Animals/Home_Pets/Abyssinian.jpg',
    habitat: 'Home',
    diet: 'Carnivore',
    lifespan: '9–15 years',
    region: 'Ethiopia (origin)',
    facts: [
      'One of the oldest known cat breeds in the world.',
      'They love to climb and are incredibly athletic.',
      'Their ticked coat gives each hair multiple bands of colour.',
    ],
    quiz: {
      questionId: 'abyssinian-cat-q1',
      area: 'science',
      question: 'What is a cat that eats only meat called?',
      options: ['Herbivore', 'Omnivore', 'Carnivore', 'Insectivore'],
      correctIndex: 2,
    },
  },
  {
    id: 'beagle',
    name: 'Beagle',
    animalType: 'Dog',
    breed: 'Beagle',
    category: 'At Home',
    rarity: 'common',
    imageUrl: '/Animals/Home_Pets/Beagle.jpg',
    habitat: 'Home',
    diet: 'Omnivore',
    lifespan: '12–15 years',
    region: 'England',
    facts: [
      'Beagles have one of the best noses of any dog breed.',
      'They were originally bred to hunt rabbits and hares.',
      'Their howl can be heard up to a mile away!',
    ],
    quiz: {
      questionId: 'beagle-q1',
      area: 'geography',
      question: 'Beagles were originally bred in which country?',
      options: ['France', 'England', 'Germany', 'Spain'],
      correctIndex: 1,
    },
    // Detail modal enrichment
    superpower: 'can follow a scent trail over 40 hours old',
    dailyLife: [
      'Beagles need at least an hour of outdoor exercise each day to burn off energy.',
      'They eat twice daily and are prone to overeating, so portion control matters.',
      'Mental stimulation — like sniff walks or puzzle feeders — is just as important as physical activity.',
    ],
    conservationStatus: 'LC',
    conservationStatusDetail: 'Beagles are a domesticated breed with a large global population. They face no conservation concerns.',
    socialBehaviour: 'Beagles are pack animals at heart and thrive with company — whether human or another dog. Left alone for long periods, they can become vocal and destructive.',
    careNeeds: [
      'At least 60 minutes of off-lead exercise or scent walks daily.',
      'High-quality, measured meals twice a day — Beagles will overeat if allowed.',
      'Regular brushing once a week to manage shedding.',
      'Ear checks weekly — their floppy ears trap moisture and can lead to infections.',
    ],
    careDifficulty: 2,
    dietDetail: 'Omnivore, but thrives on high-protein dog food. Prone to weight gain without careful portion control.',
    lifespanDetail: 'Generally healthy with good nutrition and exercise. Common issues include hip dysplasia and ear infections.',
  },
  {
    id: 'bengal-cat',
    name: 'Bengal Cat',
    animalType: 'Cat',
    breed: 'Bengal',
    category: 'At Home',
    rarity: 'rare',
    imageUrl: '/Animals/Home_Pets/Bengal_Cat.jpg',
    habitat: 'Home',
    diet: 'Carnivore',
    lifespan: '12–16 years',
    region: 'USA (breed origin)',
    facts: [
      'Bengal cats were created by crossing domestic cats with Asian leopard cats.',
      'They love water — many Bengals will join you in the shower!',
      'Their spots and rosettes look just like a wild leopard.',
    ],
    quiz: {
      questionId: 'bengal-cat-q1',
      area: 'science',
      question: 'What wild cat was crossed with a domestic cat to create the Bengal?',
      options: ['African Lion', 'Asian Leopard Cat', 'Cheetah', 'Ocelot'],
      correctIndex: 1,
    },
  },
  {
    id: 'border-collie',
    name: 'Border Collie',
    animalType: 'Dog',
    breed: 'Border Collie',
    category: 'At Home',
    rarity: 'uncommon',
    imageUrl: '/Animals/Home_Pets/Border_Collie.jpg',
    habitat: 'Home & Farm',
    diet: 'Omnivore',
    lifespan: '12–15 years',
    region: 'Scotland / England border',
    facts: [
      'Considered the most intelligent dog breed in the world.',
      'They herd sheep using a hypnotic stare called "the eye".',
      'A Border Collie named Chaser learned over 1,000 object names.',
    ],
    quiz: {
      questionId: 'border-collie-q1',
      area: 'science',
      question: 'Border Collies are famous for herding which animal?',
      options: ['Cows', 'Horses', 'Sheep', 'Pigs'],
      correctIndex: 2,
    },
  },
  {
    id: 'budgerigar',
    name: 'Budgerigar',
    animalType: 'Bird',
    breed: 'Budgerigar',
    category: 'At Home',
    rarity: 'common',
    imageUrl: '/Animals/Home_Pets/Budgerigar.jpg',
    habitat: 'Home',
    diet: 'Herbivore',
    lifespan: '5–10 years',
    region: 'Australia',
    facts: [
      'Budgerigars are one of the most popular pet birds in the world.',
      'Wild budgies live in enormous flocks across Australian grasslands.',
      'They can mimic human speech very well.',
    ],
    quiz: {
      questionId: 'budgerigar-q1',
      area: 'geography',
      question: 'Which country do wild budgerigars come from?',
      options: ['Brazil', 'India', 'Australia', 'South Africa'],
      correctIndex: 2,
    },
  },
  {
    id: 'french-bulldog',
    name: 'French Bulldog',
    animalType: 'Dog',
    breed: 'French Bulldog',
    category: 'At Home',
    rarity: 'rare',
    imageUrl: '/Animals/Home_Pets/French_Bulldog.jpg',
    habitat: 'Home',
    diet: 'Omnivore',
    lifespan: '10–12 years',
    region: 'France',
    facts: [
      'French Bulldogs can\'t swim well due to their heavy heads and small legs.',
      'They are one of the quietest dog breeds — they rarely bark.',
      'Their bat-like ears are one of their most recognisable features.',
    ],
    quiz: {
      questionId: 'french-bulldog-q1',
      area: 'geography',
      question: 'French Bulldogs are named after which country?',
      options: ['England', 'France', 'Italy', 'Belgium'],
      correctIndex: 1,
    },
  },
  {
    id: 'golden-retriever',
    name: 'Golden Retriever',
    animalType: 'Dog',
    breed: 'Golden Retriever',
    category: 'At Home',
    rarity: 'common',
    imageUrl: '/Animals/Home_Pets/Golden_Retriever.jpg',
    habitat: 'Home',
    diet: 'Omnivore',
    lifespan: '10–12 years',
    region: 'Scotland',
    facts: [
      'Golden Retrievers were bred to retrieve shot waterfowl for hunters.',
      'They are one of the most popular dog breeds in the UK and US.',
      'Goldens have a water-repellent double coat that keeps them warm in cold water.',
    ],
    quiz: {
      questionId: 'golden-retriever-q1',
      area: 'maths',
      question: 'A Golden Retriever lives about 10–12 years. What is the average lifespan?',
      options: ['9 years', '11 years', '14 years', '7 years'],
      correctIndex: 1,
    },
  },
  {
    id: 'holland-lop-rabbit',
    name: 'Holland Lop Rabbit',
    animalType: 'Rabbit',
    breed: 'Holland Lop',
    category: 'At Home',
    rarity: 'uncommon',
    imageUrl: '/Animals/Farm/Mini_Lop_Rabbit.jpg',
    habitat: 'Home',
    diet: 'Herbivore',
    lifespan: '7–14 years',
    region: 'Netherlands',
    facts: [
      'Holland Lop rabbits have distinctive floppy ears that hang down the sides of their heads.',
      'They are one of the smallest lop rabbit breeds.',
      'Despite their small size, they are very active and love to hop around.',
    ],
    quiz: {
      questionId: 'holland-lop-rabbit-q1',
      area: 'geography',
      question: 'Holland Lop rabbits were developed in which country?',
      options: ['Belgium', 'France', 'Netherlands', 'Germany'],
      correctIndex: 2,
    },
  },
  {
    id: 'maine-coon',
    name: 'Maine Coon',
    animalType: 'Cat',
    breed: 'Maine Coon',
    category: 'At Home',
    rarity: 'uncommon',
    imageUrl: '/Animals/Home_Pets/Maine_Coon.jpg',
    habitat: 'Home',
    diet: 'Carnivore',
    lifespan: '12–15 years',
    region: 'Maine, USA',
    facts: [
      'Maine Coons are one of the largest domestic cat breeds.',
      'They are sometimes called "dogs of the cat world" due to their sociable nature.',
      'Maine Coons love water and are excellent swimmers.',
    ],
    quiz: {
      questionId: 'maine-coon-q1',
      area: 'geography',
      question: 'Maine Coon cats are named after which US state?',
      options: ['Maryland', 'Montana', 'Maine', 'Michigan'],
      correctIndex: 2,
    },
  },
  {
    id: 'persian-cat',
    name: 'Persian Cat',
    animalType: 'Cat',
    breed: 'Persian',
    category: 'At Home',
    rarity: 'rare',
    imageUrl: '/Animals/Home_Pets/Persian.jpg',
    habitat: 'Home',
    diet: 'Carnivore',
    lifespan: '12–17 years',
    region: 'Iran (Persia)',
    facts: [
      'Persian cats have a flat face and long, silky coat.',
      'They are one of the oldest cat breeds — they appear in 17th-century paintings.',
      'Persians are calm and gentle — they rarely jump to high places.',
    ],
    quiz: {
      questionId: 'persian-cat-q1',
      area: 'geography',
      question: 'Persia is the old name for which modern country?',
      options: ['Iraq', 'Iran', 'Turkey', 'Egypt'],
      correctIndex: 1,
    },
  },

  // ── Stables ──────────────────────────────────────────────────────────────────
  {
    id: 'andalusian-horse',
    name: 'Andalusian Horse',
    animalType: 'Horse',
    breed: 'Andalusian',
    category: 'Stables',
    rarity: 'rare',
    imageUrl: '/Animals/Stables/Andalusian_horse.jpg',
    habitat: 'Grassland',
    diet: 'Herbivore',
    lifespan: '20–25 years',
    region: 'Andalusia, Spain',
    facts: [
      'Andalusians have been used in war, ceremonies, and bullfighting for centuries.',
      'Their thick mane and tail set them apart from other breeds.',
      'They are known for their intelligence and willingness to learn.',
    ],
    quiz: {
      questionId: 'andalusian-horse-q1',
      area: 'geography',
      question: 'Andalusia is a region in which country?',
      options: ['Portugal', 'Italy', 'Spain', 'France'],
      correctIndex: 2,
    },
  },
  {
    id: 'arabian-horse',
    name: 'Arabian Horse',
    animalType: 'Horse',
    breed: 'Arabian',
    category: 'Stables',
    rarity: 'epic',
    imageUrl: '/Animals/Stables/Arabian_horse.jpg',
    habitat: 'Desert',
    diet: 'Herbivore',
    lifespan: '25–30 years',
    region: 'Arabian Peninsula',
    facts: [
      'The Arabian is one of the oldest horse breeds in the world — over 4,500 years old.',
      'They have one fewer vertebra and rib than other horses.',
      'Arabians are so fast they have won races against thoroughbreds.',
    ],
    quiz: {
      questionId: 'arabian-horse-q1',
      area: 'maths',
      question: 'Arabian horses are over 4,500 years old. That started approximately how many centuries ago?',
      options: ['25 centuries', '45 centuries', '10 centuries', '100 centuries'],
      correctIndex: 1,
    },
    // Detail modal enrichment
    superpower: 'has a unique skeletal structure — one fewer vertebra and rib than all other horse breeds',
    dailyLife: [
      'Arabians thrive with daily exercise — at least an hour of ridden work or free movement in a paddock.',
      'They form deep bonds with their handlers and can become anxious if stabled in isolation.',
      'Regular grooming of their distinctive silky coat and tail is essential for their wellbeing.',
    ],
    conservationStatus: 'LC',
    conservationStatusDetail: 'Arabians are a globally widespread domestic breed with strong breed registries. They face no conservation risk.',
    socialBehaviour: 'Highly social and sensitive. Arabians communicate expressively through body language and develop strong attachments to familiar handlers. They do not do well in isolation.',
    careNeeds: [
      'Daily exercise of at least one hour — ridden, lunged, or free in a paddock.',
      'High-quality hay and measured hard feed; prone to weight gain on rich grass.',
      'Regular grooming including mane, tail, and feathered coat checks.',
      'Social company — another horse or suitable companion animal reduces stress significantly.',
    ],
    careDifficulty: 2,
    habitatDetail: 'Adapted to arid desert climates; now kept worldwide in stables, paddocks, and open grassland environments.',
    dietDetail: 'Herbivore — hay, grass, and measured hard feed. Sensitive digestion; changes in diet must be made gradually.',
    lifespanDetail: 'One of the longer-lived horse breeds. Many Arabians remain active into their late 20s with good care.',
  },
  {
    id: 'miniature-pony',
    name: 'Miniature Pony',
    animalType: 'Pony',
    breed: 'Miniature',
    category: 'Stables',
    rarity: 'uncommon',
    imageUrl: '/Animals/Stables/Miniature_horse.jpg',
    habitat: 'Grassland',
    diet: 'Herbivore',
    lifespan: '25–35 years',
    region: 'Europe (various)',
    facts: [
      'Miniature Ponies stand less than 97cm tall at the shoulder.',
      'Despite their small size, they are incredibly strong.',
      'Some Miniature Ponies are trained as therapy animals in hospitals.',
    ],
    quiz: {
      questionId: 'miniature-pony-q1',
      area: 'maths',
      question: 'A Miniature Pony stands less than 97cm tall. If a door is 200cm high, how much taller is the door?',
      options: ['93cm', '103cm', '113cm', '83cm'],
      correctIndex: 1,
    },
  },
  {
    id: 'shire-horse',
    name: 'Shire Horse',
    animalType: 'Horse',
    breed: 'Shire',
    category: 'Stables',
    rarity: 'uncommon',
    imageUrl: '/Animals/Stables/Shire_Horse_1.jpg',
    habitat: 'Farmland',
    diet: 'Herbivore',
    lifespan: '20–25 years',
    region: 'England',
    facts: [
      'Shire Horses are the tallest horse breed in the world.',
      'A Shire called Sampson (born 1846) was the tallest horse ever recorded at 219cm.',
      'They were used to pull heavy loads through city streets before cars existed.',
    ],
    quiz: {
      questionId: 'shire-horse-q1',
      area: 'geography',
      question: 'Shire Horses originated in which country?',
      options: ['Scotland', 'Ireland', 'Wales', 'England'],
      correctIndex: 3,
    },
  },
  {
    id: 'thoroughbred',
    name: 'Thoroughbred',
    animalType: 'Horse',
    breed: 'Thoroughbred',
    category: 'Stables',
    rarity: 'rare',
    imageUrl: '/Animals/Stables/Thoroughbred_horse.jpg',
    habitat: 'Grassland',
    diet: 'Herbivore',
    lifespan: '25–28 years',
    region: 'England',
    facts: [
      'Thoroughbreds can reach speeds of over 70km/h.',
      'Every thoroughbred racehorse traces its ancestry to just three Arabian stallions.',
      'Their birthdays are all counted from 1st January, regardless of actual birth date.',
    ],
    quiz: {
      questionId: 'thoroughbred-q1',
      area: 'maths',
      question: 'A Thoroughbred runs at 70km/h. How far would it travel in 30 minutes?',
      options: ['25km', '35km', '50km', '70km'],
      correctIndex: 1,
    },
  },

  // ── Farm ─────────────────────────────────────────────────────────────────────
  {
    id: 'angus-cow',
    name: 'Angus Cow',
    animalType: 'Cow',
    breed: 'Angus',
    category: 'Farm',
    rarity: 'common',
    imageUrl: '/Animals/Farm/Cow.jpg',
    habitat: 'Farmland',
    diet: 'Herbivore',
    lifespan: '15–20 years',
    region: 'Aberdeenshire, Scotland',
    facts: [
      'Angus cattle are naturally polled — they are born without horns.',
      'They are known for producing high-quality, well-marbled beef.',
      'Black Angus is the most common beef cattle breed in the USA.',
    ],
    quiz: {
      questionId: 'angus-cow-q1',
      area: 'geography',
      question: 'Angus cattle come from Aberdeenshire, in which country?',
      options: ['Ireland', 'England', 'Scotland', 'Wales'],
      correctIndex: 2,
    },
  },
  {
    id: 'gloucestershire-old-spots-pig',
    name: 'Gloucestershire Old Spots Pig',
    animalType: 'Pig',
    breed: 'Gloucestershire Old Spots',
    category: 'Farm',
    rarity: 'uncommon',
    imageUrl: '/Animals/Farm/Pig.jpg',
    habitat: 'Farmland',
    diet: 'Omnivore',
    lifespan: '10–15 years',
    region: 'Gloucestershire, England',
    facts: [
      'The first pig breed to get protected breed status in Europe.',
      'Their large floppy ears almost cover their eyes.',
      'They are excellent foragers and thrive outdoors.',
    ],
    quiz: {
      questionId: 'gloucestershire-old-spots-pig-q1',
      area: 'spelling',
      question: 'How do you spell the county this pig is named after?',
      options: ['Glousestershire', 'Gloucestershire', 'Glosestershire', 'Glostershire'],
      correctIndex: 1,
    },
  },
  {
    id: 'khaki-campbell-duck',
    name: 'Khaki Campbell Duck',
    animalType: 'Duck',
    breed: 'Khaki Campbell',
    category: 'Farm',
    rarity: 'common',
    imageUrl: '/Animals/Wildlife/Duck.jpg',
    habitat: 'Wetland / Farm',
    diet: 'Omnivore',
    lifespan: '10–15 years',
    region: 'England',
    facts: [
      'Khaki Campbell ducks can lay up to 340 eggs per year — more than most chickens.',
      'They were bred by Mrs Adele Campbell in England in the 1890s.',
      'Their khaki-brown colour acts as camouflage in dry grass.',
    ],
    quiz: {
      questionId: 'khaki-campbell-duck-q1',
      area: 'maths',
      question: 'A Khaki Campbell can lay up to 340 eggs per year. About how many eggs per week is that?',
      options: ['3', '5', '7', '10'],
      correctIndex: 2,
    },
  },
  {
    id: 'suffolk-sheep',
    name: 'Suffolk Sheep',
    animalType: 'Sheep',
    breed: 'Suffolk',
    category: 'Farm',
    rarity: 'common',
    imageUrl: '/Animals/Farm/Sheep.jpg',
    habitat: 'Farmland',
    diet: 'Herbivore',
    lifespan: '10–12 years',
    region: 'Suffolk, England',
    facts: [
      'Suffolk sheep have distinctive black faces and black legs.',
      'They are the most popular meat sheep breed in the United Kingdom.',
      'Suffolks grow very quickly and are usually ready to leave the farm early.',
    ],
    quiz: {
      questionId: 'suffolk-sheep-q1',
      area: 'geography',
      question: 'Suffolk sheep are named after a county in which country?',
      options: ['Scotland', 'Ireland', 'England', 'Wales'],
      correctIndex: 2,
    },
  },

  // ── Lost World ───────────────────────────────────────────────────────────────
  {
    id: 'ankylosaurus',
    name: 'Ankylosaurus',
    animalType: 'Dinosaur',
    breed: 'Ankylosaurus',
    category: 'Lost World',
    rarity: 'rare',
    imageUrl: '/Animals/Dinosaurs/Ankylosaurus.jpg',
    habitat: 'Forest',
    diet: 'Herbivore',
    lifespan: '70+ years (estimated)',
    region: 'North America',
    facts: [
      'Ankylosaurus had armoured plates covering its entire back for protection.',
      'Its club-like tail could swing hard enough to break the bones of a T. rex.',
      'They lived during the Late Cretaceous period, about 68–66 million years ago.',
    ],
    quiz: {
      questionId: 'ankylosaurus-q1',
      area: 'maths',
      question: 'Ankylosaurus lived about 67 million years ago. Roughly how many millions of years before today?',
      options: ['6.7 million', '67 million', '670 million', '6,700 million'],
      correctIndex: 1,
    },
  },
  {
    id: 'brachiosaurus',
    name: 'Brachiosaurus',
    animalType: 'Dinosaur',
    breed: 'Brachiosaurus',
    category: 'Lost World',
    rarity: 'epic',
    imageUrl: '/Animals/Dinosaurs/Brachiosaurus.jpg',
    habitat: 'Forest',
    diet: 'Herbivore',
    lifespan: '100+ years (estimated)',
    region: 'North America & Africa',
    facts: [
      'Brachiosaurus could reach leaves 13 metres off the ground — as tall as a 4-storey building.',
      'They had nostrils on top of their head, not at the end of their snout.',
      'A single Brachiosaurus may have weighed as much as 60 tonnes.',
    ],
    quiz: {
      questionId: 'brachiosaurus-q1',
      area: 'maths',
      question: 'Brachiosaurus could reach 13 metres high. If one storey is 3 metres, how many storeys is that?',
      options: ['3', '5', '4', '6'],
      correctIndex: 2,
    },
  },
  {
    id: 'pterodactyl',
    name: 'Pterodactyl',
    animalType: 'Pterosaur',
    breed: 'Pterodactyl',
    category: 'Lost World',
    rarity: 'uncommon',
    imageUrl: '/Animals/Dinosaurs/Pterodactyl.jpg',
    habitat: 'Coastal / Sky',
    diet: 'Carnivore',
    lifespan: 'Unknown',
    region: 'Europe & Africa',
    facts: [
      'Pterodactyls were not dinosaurs — they were flying reptiles called pterosaurs.',
      'Their wingspan could reach up to 1 metre.',
      'They ate fish, catching them by dipping their beaks into water.',
    ],
    quiz: {
      questionId: 'pterodactyl-q1',
      area: 'science',
      question: 'Pterodactyls were not dinosaurs. What type of animal were they?',
      options: ['Flying dinosaur', 'Flying reptile', 'Giant bird', 'Flying mammal'],
      correctIndex: 1,
    },
  },
  {
    id: 'stegosaurus',
    name: 'Stegosaurus',
    animalType: 'Dinosaur',
    breed: 'Stegosaurus',
    category: 'Lost World',
    rarity: 'uncommon',
    imageUrl: '/Animals/Dinosaurs/Stegosaurus.jpg',
    habitat: 'Forest',
    diet: 'Herbivore',
    lifespan: '80+ years (estimated)',
    region: 'North America & Europe',
    facts: [
      'Stegosaurus had 17 bony plates running along its back.',
      'Despite being as big as a bus, its brain was only the size of a walnut.',
      'Its spiked tail is called a "thagomizer" — named after a cartoon character!',
    ],
    quiz: {
      questionId: 'stegosaurus-q1',
      area: 'maths',
      question: 'Stegosaurus had 17 bony plates. If each side had the same number, how many were on each side?',
      options: ['7', '8', 'They can\'t be split evenly', '9'],
      correctIndex: 2,
    },
  },
  {
    id: 'triceratops',
    name: 'Triceratops',
    animalType: 'Dinosaur',
    breed: 'Triceratops',
    category: 'Lost World',
    rarity: 'rare',
    imageUrl: '/Animals/Dinosaurs/Triceratops.jpg',
    habitat: 'Forest & Plains',
    diet: 'Herbivore',
    lifespan: '70+ years (estimated)',
    region: 'North America',
    facts: [
      'Triceratops had three horns — one on its nose and two above its eyes.',
      'Its frill could flush with blood to show off to rivals or attract mates.',
      'Triceratops lived alongside and often faced the T. rex.',
    ],
    quiz: {
      questionId: 'triceratops-q1',
      area: 'maths',
      question: 'Triceratops had 3 horns. If 5 Triceratops were in a field, how many horns in total?',
      options: ['10', '12', '15', '18'],
      correctIndex: 2,
    },
  },
  {
    id: 'tyrannosaurus-rex',
    name: 'Tyrannosaurus Rex',
    animalType: 'Dinosaur',
    breed: 'T. rex',
    category: 'Lost World',
    rarity: 'legendary',
    imageUrl: '/Animals/Dinosaurs/Tyrannosaurus.jpg',
    habitat: 'Forest & Plains',
    diet: 'Carnivore',
    lifespan: '28–30 years (estimated)',
    region: 'North America',
    facts: [
      'T. rex had the most powerful bite of any land animal — ever.',
      'Its tiny arms were actually very strong, despite their small size.',
      'Scientists now believe T. rex may have been covered in feathers.',
    ],
    quiz: {
      questionId: 'tyrannosaurus-rex-q1',
      area: 'spelling',
      question: 'Which spelling of Tyrannosaurus Rex\'s short name is correct?',
      options: ['T. rex', 'T. Rex', 'T. Reks', 'T. Recs'],
      correctIndex: 0,
    },
  },
  {
    id: 'woolly-mammoth',
    name: 'Woolly Mammoth',
    animalType: 'Mammoth',
    breed: 'Woolly',
    category: 'Lost World',
    rarity: 'legendary',
    imageUrl: '/Animals/Wildlife/Woolly_Mammoth.jpg',
    habitat: 'Arctic Tundra',
    diet: 'Herbivore',
    lifespan: '60–80 years (estimated)',
    region: 'Northern Hemisphere',
    facts: [
      'Woolly Mammoths were about the same size as modern African elephants.',
      'They had curved tusks up to 4 metres long — used for sweeping snow to find food.',
      'Scientists have found Woolly Mammoth DNA preserved in Siberian permafrost.',
    ],
    quiz: {
      questionId: 'woolly-mammoth-q1',
      area: 'science',
      question: 'What modern animal is the Woolly Mammoth most closely related to?',
      options: ['Rhinoceros', 'Hippopotamus', 'Elephant', 'Giraffe'],
      correctIndex: 2,
    },
  },

  // ── Wild ─────────────────────────────────────────────────────────────────────
  {
    id: 'african-elephant',
    name: 'African Elephant',
    animalType: 'Elephant',
    breed: 'African',
    category: 'Wild',
    rarity: 'epic',
    imageUrl: '/Animals/Wildlife/African_Elephant.jpg',
    habitat: 'Savanna',
    diet: 'Herbivore',
    lifespan: '60–70 years',
    region: 'Sub-Saharan Africa',
    facts: [
      'African Elephants are the largest land animals on Earth.',
      'They use their trunks for drinking, smelling, and even hugging.',
      'Elephants can remember people and places for decades.',
    ],
    quiz: {
      questionId: 'african-elephant-q1',
      area: 'geography',
      question: 'Which continent do African Elephants live on?',
      options: ['Asia', 'South America', 'Africa', 'Australia'],
      correctIndex: 2,
    },
    // Detail modal enrichment
    superpower: 'can drink 200 litres of water in a single session',
    dailyLife: [
      'Elephants spend up to 18 hours a day eating, travelling up to 80km in search of food.',
      'Matriarchs lead the herd and use low-frequency rumbles to communicate over kilometres.',
      'Calves stay close to their mothers and are cared for by the whole herd.',
    ],
    conservationStatus: 'VU',
    conservationStatusDetail: 'Listed as Vulnerable by the IUCN. Poaching for ivory and habitat loss from farming expansion are the primary threats.',
    socialBehaviour: 'African Elephants live in tight-knit matriarchal herds of 10–20 individuals. Males leave the herd at adolescence and live semi-solitary lives or in loose bachelor groups.',
    habitatThreats: [
      'Illegal poaching for ivory, despite international trade bans.',
      'Habitat fragmentation as farmland expands across historic migration corridors.',
      'Conflict with human settlements as elephants raid crops during dry seasons.',
    ],
    habitatDetail: 'Savanna grasslands, bush, and forest fringes across Sub-Saharan Africa.',
    dietDetail: 'Herbivore — eats grasses, leaves, bark, and fruit. An adult requires up to 150kg of vegetation daily.',
    lifespanDetail: 'Elephants are limited by their teeth: they cycle through six sets of molars. When the last set wears out, they can no longer eat and decline rapidly.',
  },
  {
    id: 'arctic-fox',
    name: 'Arctic Fox',
    animalType: 'Fox',
    breed: 'Arctic',
    category: 'Wild',
    rarity: 'rare',
    imageUrl: '/Animals/Wildlife/Arctic_Fox.jpg',
    habitat: 'Arctic Tundra',
    diet: 'Omnivore',
    lifespan: '3–6 years',
    region: 'Arctic Circle',
    facts: [
      'Arctic Foxes change colour — white in winter, brown in summer.',
      'They can survive temperatures as low as -70°C.',
      'Their thick bushy tail acts as a warm blanket when they curl up to sleep.',
    ],
    quiz: {
      questionId: 'arctic-fox-q1',
      area: 'science',
      question: 'Why does an Arctic Fox turn white in winter?',
      options: ['It gets cold', 'Camouflage in snow', 'It loses pigment', 'It hibernates'],
      correctIndex: 1,
    },
  },
  {
    id: 'bengal-tiger',
    name: 'Bengal Tiger',
    animalType: 'Tiger',
    breed: 'Bengal',
    category: 'Wild',
    rarity: 'legendary',
    imageUrl: '/Animals/Home_Pets/Bengal_Tiger.jpg',
    habitat: 'Rainforest',
    diet: 'Carnivore',
    lifespan: '10–15 years',
    region: 'South & Southeast Asia',
    facts: [
      'Bengal Tigers are the largest wild cat species in the world.',
      'Each tiger has a unique stripe pattern — like human fingerprints.',
      'A tiger\'s roar can be heard up to 3km away.',
    ],
    quiz: {
      questionId: 'bengal-tiger-q1',
      area: 'geography',
      question: 'Bengal Tigers are found in South and Southeast Asia. Which of these is in that region?',
      options: ['Brazil', 'India', 'Kenya', 'Australia'],
      correctIndex: 1,
    },
  },
  {
    id: 'cheetah',
    name: 'Cheetah',
    animalType: 'Cheetah',
    breed: 'Cheetah',
    category: 'Wild',
    rarity: 'epic',
    imageUrl: '/Animals/Wildlife/Cheetah.jpg',
    habitat: 'Savanna',
    diet: 'Carnivore',
    lifespan: '10–12 years',
    region: 'Africa & Iran',
    facts: [
      'Cheetahs are the fastest land animals, reaching 120km/h in short bursts.',
      'Unlike other big cats, cheetahs cannot roar — they purr instead.',
      'Cheetah cubs have a silver mane that makes them look like honey badgers to predators.',
    ],
    quiz: {
      questionId: 'cheetah-q1',
      area: 'maths',
      question: 'A Cheetah runs at 120km/h. A human runs at about 10km/h. How many times faster is the cheetah?',
      options: ['8', '10', '12', '15'],
      correctIndex: 2,
    },
  },
  {
    id: 'giant-panda',
    name: 'Giant Panda',
    animalType: 'Panda',
    breed: 'Giant',
    category: 'Wild',
    rarity: 'legendary',
    imageUrl: '/Animals/Wildlife/Giant_Panda_Bear.jpg',
    habitat: 'Bamboo Forest',
    diet: 'Herbivore',
    lifespan: '20 years',
    region: 'China',
    facts: [
      'Giant Pandas eat up to 14kg of bamboo every single day.',
      'They have a "false thumb" — an extended wrist bone used to grip bamboo.',
      'Baby pandas are tiny at birth — about the size of a stick of butter.',
    ],
    quiz: {
      questionId: 'giant-panda-q1',
      area: 'maths',
      question: 'A panda eats 14kg of bamboo a day. How much in a week (7 days)?',
      options: ['49kg', '84kg', '98kg', '70kg'],
      correctIndex: 2,
    },
  },
  {
    id: 'gorilla',
    name: 'Gorilla',
    animalType: 'Gorilla',
    breed: 'Western Lowland',
    category: 'Wild',
    rarity: 'epic',
    imageUrl: '/Animals/Wildlife/Gorilla.jpg',
    habitat: 'Rainforest',
    diet: 'Herbivore',
    lifespan: '35–40 years',
    region: 'Central Africa',
    facts: [
      'Gorillas share about 98% of their DNA with humans.',
      'A silverback gorilla can lift up to 800kg — more than 10 times its own body weight.',
      'Gorillas make a new sleeping nest from branches and leaves every single night.',
    ],
    quiz: {
      questionId: 'gorilla-q1',
      area: 'science',
      question: 'Gorillas share approximately what percentage of DNA with humans?',
      options: ['80%', '90%', '95%', '98%'],
      correctIndex: 3,
    },
  },
  {
    id: 'grey-wolf',
    name: 'Grey Wolf',
    animalType: 'Wolf',
    breed: 'Grey',
    category: 'Wild',
    rarity: 'rare',
    imageUrl: '/Animals/Wildlife/Gray Wolf.jpg',
    habitat: 'Forest & Tundra',
    diet: 'Carnivore',
    lifespan: '6–8 years',
    region: 'Northern Hemisphere',
    facts: [
      'Grey Wolves are the ancestors of every domestic dog breed.',
      'A wolf pack is led by an alpha male and female.',
      'They can travel up to 100km in a single day when tracking prey.',
    ],
    quiz: {
      questionId: 'grey-wolf-q1',
      area: 'science',
      question: 'Grey Wolves are the ancestors of which animals?',
      options: ['Cats', 'Foxes', 'Domestic dogs', 'Hyenas'],
      correctIndex: 2,
    },
  },
  {
    id: 'koala',
    name: 'Koala',
    animalType: 'Koala',
    breed: 'Koala',
    category: 'Wild',
    rarity: 'rare',
    imageUrl: '/Animals/Wildlife/Koala.jpg',
    habitat: 'Eucalyptus Forest',
    diet: 'Herbivore',
    lifespan: '13–18 years',
    region: 'Eastern Australia',
    facts: [
      'Koalas sleep up to 22 hours a day — eucalyptus leaves give them very little energy.',
      'They are not bears — they are marsupials, related to wombats.',
      'Koalas have fingerprints almost identical to human fingerprints.',
    ],
    quiz: {
      questionId: 'koala-q1',
      area: 'geography',
      question: 'Koalas are native to which country?',
      options: ['New Zealand', 'South Africa', 'Australia', 'Brazil'],
      correctIndex: 2,
    },
  },
  {
    id: 'lion',
    name: 'Lion',
    animalType: 'Lion',
    breed: 'African',
    category: 'Wild',
    rarity: 'epic',
    imageUrl: '/Animals/Wildlife/African Lion.jpg',
    habitat: 'Savanna',
    diet: 'Carnivore',
    lifespan: '10–14 years',
    region: 'Sub-Saharan Africa',
    facts: [
      'Lions are the only cats that live in groups, called prides.',
      'A lion\'s roar can be heard up to 8km away.',
      'Female lions (lionesses) do most of the hunting.',
    ],
    quiz: {
      questionId: 'lion-q1',
      area: 'science',
      question: 'Lions are the only cats that live in groups. What is a group of lions called?',
      options: ['Pack', 'Pride', 'Herd', 'Colony'],
      correctIndex: 1,
    },
  },
  {
    id: 'polar-bear',
    name: 'Polar Bear',
    animalType: 'Bear',
    breed: 'Polar',
    category: 'Wild',
    rarity: 'epic',
    imageUrl: '/Animals/Wildlife/Polar_Bear.jpg',
    habitat: 'Arctic Ice',
    diet: 'Carnivore',
    lifespan: '20–30 years',
    region: 'Arctic Circle',
    facts: [
      'Polar bear fur is actually transparent, not white — it just appears white.',
      'They are the largest land predators on Earth.',
      'Polar bears can swim over 160km without stopping.',
    ],
    quiz: {
      questionId: 'polar-bear-q1',
      area: 'science',
      question: 'What colour is polar bear fur really?',
      options: ['White', 'Yellow', 'Transparent', 'Grey'],
      correctIndex: 2,
    },
  },
  {
    id: 'red-panda',
    name: 'Red Panda',
    animalType: 'Panda',
    breed: 'Red',
    category: 'Wild',
    rarity: 'rare',
    imageUrl: '/Animals/Wildlife/Red_Panda.jpg',
    habitat: 'Temperate Forest',
    diet: 'Herbivore',
    lifespan: '8–10 years',
    region: 'Eastern Himalayas & China',
    facts: [
      'Red Pandas were discovered 50 years before the Giant Panda.',
      'They use their bushy tail as a blanket to keep warm in winter.',
      'Red Pandas are more closely related to raccoons than to Giant Pandas.',
    ],
    quiz: {
      questionId: 'red-panda-q1',
      area: 'geography',
      question: 'Red Pandas live in the Himalayas. The Himalayas are in which continent?',
      options: ['Africa', 'Europe', 'Asia', 'South America'],
      correctIndex: 2,
    },
  },
  {
    id: 'snow-leopard',
    name: 'Snow Leopard',
    animalType: 'Leopard',
    breed: 'Snow',
    category: 'Wild',
    rarity: 'legendary',
    imageUrl: '/Animals/Wildlife/Snow_Leopard.jpg',
    habitat: 'Mountain',
    diet: 'Carnivore',
    lifespan: '10–12 years',
    region: 'Central Asia',
    facts: [
      'Snow Leopards cannot roar — they can only meow, hiss, and purr.',
      'Their long thick tail helps them balance on steep mountain slopes.',
      'They are so elusive they are called "ghost cats of the mountains".',
    ],
    quiz: {
      questionId: 'snow-leopard-q1',
      area: 'geography',
      question: 'Snow Leopards live in mountain ranges in Central Asia. Which is the highest mountain range?',
      options: ['Alps', 'Rockies', 'Himalayas', 'Andes'],
      correctIndex: 2,
    },
  },

  // ── Sea ──────────────────────────────────────────────────────────────────────
  {
    id: 'bottlenose-dolphin',
    name: 'Bottlenose Dolphin',
    animalType: 'Dolphin',
    breed: 'Bottlenose',
    category: 'Sea',
    rarity: 'uncommon',
    imageUrl: '/Animals/Marine/Bottlenose_Dolphin.jpg',
    habitat: 'Ocean',
    diet: 'Carnivore',
    lifespan: '20–45 years',
    region: 'Worldwide (temperate & tropical)',
    facts: [
      'Bottlenose Dolphins are one of the few animals that recognise themselves in a mirror.',
      'They sleep with one half of their brain at a time so they can keep swimming.',
      'Dolphins call each other by unique whistle names.',
    ],
    quiz: {
      questionId: 'bottlenose-dolphin-q1',
      area: 'science',
      question: 'Dolphins sleep with one half of their brain at a time. This is called what?',
      options: ['Half-sleep', 'Unihemispheric sleep', 'Deep sleep', 'Dolphin nap'],
      correctIndex: 1,
    },
  },
  {
    id: 'clownfish',
    name: 'Clownfish',
    animalType: 'Fish',
    breed: 'Clownfish',
    category: 'Sea',
    rarity: 'common',
    imageUrl: '/Animals/Marine/Clownfish.jpg',
    habitat: 'Coral Reef',
    diet: 'Omnivore',
    lifespan: '3–6 years',
    region: 'Indo-Pacific Ocean',
    facts: [
      'Clownfish are immune to sea anemone stings — they live safely among the tentacles.',
      'All clownfish are born male — the dominant fish can change to female.',
      'They are named after clown make-up because of their bright orange and white pattern.',
    ],
    quiz: {
      questionId: 'clownfish-q1',
      area: 'science',
      question: 'What gives clownfish protection from the sea anemone\'s sting?',
      options: ['Thick scales', 'Special slime coating', 'Immunity', 'Speed'],
      correctIndex: 2,
    },
  },
  {
    id: 'great-white-shark',
    name: 'Great White Shark',
    animalType: 'Shark',
    breed: 'Great White',
    category: 'Sea',
    rarity: 'legendary',
    imageUrl: '/Animals/Marine/Great_White_Shark.jpg',
    habitat: 'Ocean',
    diet: 'Carnivore',
    lifespan: '70+ years',
    region: 'Worldwide (cool coastal waters)',
    facts: [
      'Great White Sharks can grow up to 6 metres long.',
      'They have up to 300 teeth arranged in multiple rows.',
      'Great Whites can detect a single drop of blood in 100 litres of water.',
    ],
    quiz: {
      questionId: 'great-white-shark-q1',
      area: 'maths',
      question: 'A Great White Shark has up to 300 teeth in multiple rows. If there are 5 rows, how many teeth per row?',
      options: ['30', '40', '60', '50'],
      correctIndex: 2,
    },
  },
  {
    id: 'humpback-whale',
    name: 'Humpback Whale',
    animalType: 'Whale',
    breed: 'Humpback',
    category: 'Sea',
    rarity: 'epic',
    imageUrl: '/Animals/Marine/Humpback_Whale.jpg',
    habitat: 'Ocean',
    diet: 'Carnivore',
    lifespan: '45–100 years',
    region: 'Worldwide',
    facts: [
      'Humpback Whales sing complex songs that can last for hours.',
      'They can leap completely out of the water — a behaviour called breaching.',
      'Humpbacks travel up to 8,000km between feeding and breeding grounds.',
    ],
    quiz: {
      questionId: 'humpback-whale-q1',
      area: 'maths',
      question: 'Humpback Whales travel up to 8,000km. If they swim 200km per day, how many days is that journey?',
      options: ['20', '30', '40', '50'],
      correctIndex: 2,
    },
  },
  {
    id: 'octopus',
    name: 'Octopus',
    animalType: 'Octopus',
    breed: 'Common',
    category: 'Sea',
    rarity: 'rare',
    imageUrl: '/Animals/Marine/Octopus.jpg',
    habitat: 'Ocean',
    diet: 'Carnivore',
    lifespan: '1–2 years',
    region: 'Worldwide',
    facts: [
      'Octopuses have three hearts and blue blood.',
      'They can change colour and texture in less than a second.',
      'Octopuses are extremely intelligent — they can open jars and solve puzzles.',
    ],
    quiz: {
      questionId: 'octopus-q1',
      area: 'maths',
      question: 'An octopus has 8 arms. If 3 octopuses were in a rock pool, how many arms in total?',
      options: ['16', '18', '24', '32'],
      correctIndex: 2,
    },
  },
  {
    id: 'sea-turtle',
    name: 'Sea Turtle',
    animalType: 'Turtle',
    breed: 'Green Sea',
    category: 'Sea',
    rarity: 'rare',
    imageUrl: '/Animals/Marine/Sea_Turtle.jpg',
    habitat: 'Tropical Ocean',
    diet: 'Herbivore',
    lifespan: '80+ years',
    region: 'Worldwide (tropical & subtropical)',
    facts: [
      'Sea Turtles return to the exact beach where they were born to lay their own eggs.',
      'They have been on Earth for over 100 million years — they outlived the dinosaurs.',
      'Female sea turtles lay up to 100 eggs in a single nest.',
    ],
    quiz: {
      questionId: 'sea-turtle-q1',
      area: 'maths',
      question: 'A sea turtle lays up to 100 eggs per nest. If she makes 3 nests a season, how many eggs in total?',
      options: ['200', '250', '300', '350'],
      correctIndex: 2,
    },
  },
  {
    id: 'seahorse',
    name: 'Seahorse',
    animalType: 'Seahorse',
    breed: 'Common',
    category: 'Sea',
    rarity: 'uncommon',
    imageUrl: '/Animals/Stables/Seahorse.jpg',
    habitat: 'Seagrass & Coral Reef',
    diet: 'Carnivore',
    lifespan: '1–5 years',
    region: 'Worldwide (tropical & temperate)',
    facts: [
      'Male seahorses carry and give birth to the babies — not the females.',
      'Seahorses have no stomachs, so they must eat almost continuously.',
      'They are the slowest fish in the sea — they move just 1.5m per hour.',
    ],
    quiz: {
      questionId: 'seahorse-q1',
      area: 'science',
      question: 'Which parent carries seahorse babies?',
      options: ['The female', 'The male', 'Both share equally', 'Neither — eggs float freely'],
      correctIndex: 1,
    },
  },
]

// Merge generated catalog into ANIMALS — hand-crafted entries take priority.
// Cast is safe: catalog entries satisfy all required AnimalEntry fields.
const handCraftedIds = new Set(ANIMALS.map(a => a.id))
// Also build a set of hand-crafted name tokens (lowercased) to catch cases where
// the catalog generates "Abyssinian" but we already have "Abyssinian Cat" (same animal,
// different filename stem). A catalog entry is a duplicate if its full name is a
// prefix (case-insensitive) of any hand-crafted entry name.
const handCraftedNames = ANIMALS.map(a => a.name.toLowerCase())
const catalogEntries = (generatedCatalog as AnimalEntry[]).filter(e => {
  if (handCraftedIds.has(e.id)) return false
  const nameLower = e.name.toLowerCase()
  return !handCraftedNames.some(hc => hc.startsWith(nameLower))
})
ANIMALS.push(...catalogEntries)

/**
 * Enrich a single AnimalEntry with Wikipedia data from the lazy-loaded encyclopedia.
 * Call this when a detail view opens — not at module load time.
 *
 * Hand-crafted fields take priority: encyclopedia values are only applied when
 * the field is undefined (never explicitly set) on the entry. An explicit null
 * in a hand-crafted entry is preserved as-is.
 *
 * Returns the same object reference (mutated in place) for convenience.
 */
export async function enrichAnimalWithEncyclopedia(animal: AnimalEntry): Promise<AnimalEntry> {
  // Load the encyclopedia if it hasn't been fetched yet. Errors are silently
  // ignored here — the detail view renders fine with missing wiki fields.
  await loadEncyclopedia().catch(() => undefined)

  const enc = getEncyclopediaEntry(animal.name)
  if (!enc) return animal
  if (animal.wikiDescription === undefined) animal.wikiDescription = enc.description
  if (animal.wikiThumbnail === undefined) animal.wikiThumbnail = enc.thumbnail
  if (animal.wikiUrl === undefined) animal.wikiUrl = enc.wikiUrl
  return animal
}

// Sort A-Z by name (data is already sorted but enforcing here for safety)
ANIMALS.sort((a, b) => a.name.localeCompare(b.name))

// Derived lookups
export const ALL_CATEGORIES: AnimalCategory[] = [
  'At Home', 'Stables', 'Farm', 'Lost World', 'Wild', 'Sea',
]

/** Build A-Z index: letter → first index in the given sorted array */
export function buildAZIndex(entries: AnimalEntry[]): Map<string, number> {
  const map = new Map<string, number>()
  entries.forEach((e, i) => {
    const letter = e.name[0].toUpperCase()
    if (!map.has(letter)) map.set(letter, i)
  })
  return map
}
