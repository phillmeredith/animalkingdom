// arcadeQuestions.ts — Question banks for all 4 arcade games
// 20 questions per area, animal-themed throughout

import type { SkillArea } from '@/lib/db'

export interface ArcadeQuestion {
  id: string
  area: SkillArea
  question: string
  options: string[]
  correctIndex: number
}

// ─── Maths — Coin Rush ───────────────────────────────────────────────────────

const MATHS: ArcadeQuestion[] = [
  { id: 'cr-1',  area: 'maths', question: 'A lion pride has 6 lions. 3 more join. How many lions?',               options: ['7','8','9','10'],          correctIndex: 2 },
  { id: 'cr-2',  area: 'maths', question: 'A dolphin swims 8km per hour. How far in 3 hours?',                    options: ['16km','24km','20km','32km'], correctIndex: 1 },
  { id: 'cr-3',  area: 'maths', question: 'You have 50 coins and spend 18. How many are left?',                   options: ['28','32','34','38'],       correctIndex: 1 },
  { id: 'cr-4',  area: 'maths', question: 'A tiger sleeps 16 hours a day. How many hours is it awake?',           options: ['6','7','8','9'],           correctIndex: 2 },
  { id: 'cr-5',  area: 'maths', question: 'A farm has 4 pigs and 7 chickens. How many animals in total?',         options: ['9','10','11','12'],        correctIndex: 2 },
  { id: 'cr-6',  area: 'maths', question: 'A horse runs 12km each day for 5 days. How far in total?',             options: ['50km','55km','60km','65km'], correctIndex: 2 },
  { id: 'cr-7',  area: 'maths', question: '3 elephants each drink 200 litres a day. How much in total?',          options: ['400L','500L','600L','700L'], correctIndex: 2 },
  { id: 'cr-8',  area: 'maths', question: 'A zoo has 24 animals split equally into 4 enclosures. How many each?', options: ['4','5','6','7'],           correctIndex: 2 },
  { id: 'cr-9',  area: 'maths', question: 'If you earn 25 coins 3 times, how many coins total?',                  options: ['50','65','75','80'],       correctIndex: 2 },
  { id: 'cr-10', area: 'maths', question: 'A whale is 30m long. A dolphin is 3m long. How many dolphins long?',   options: ['8','9','10','11'],         correctIndex: 2 },
  { id: 'cr-11', area: 'maths', question: 'A parrot lives 80 years. A hamster lives 2 years. Difference?',        options: ['76','77','78','79'],       correctIndex: 2 },
  { id: 'cr-12', area: 'maths', question: 'You buy 3 packs of animal cards at 15 coins each. Total cost?',        options: ['35','40','45','50'],       correctIndex: 2 },
  { id: 'cr-13', area: 'maths', question: 'A cheetah runs 100km/h. How far in 30 minutes?',                       options: ['25km','50km','75km','100km'], correctIndex: 1 },
  { id: 'cr-14', area: 'maths', question: 'There are 7 kittens in a litter. How many paws in total?',             options: ['14','21','28','35'],       correctIndex: 2 },
  { id: 'cr-15', area: 'maths', question: 'A wolf pack hunts 9 rabbits a day for a week. Total?',                 options: ['54','56','61','63'],       correctIndex: 3 },
  { id: 'cr-16', area: 'maths', question: 'You have 100 coins. You earn 35 more. How many now?',                  options: ['125','130','135','140'],   correctIndex: 2 },
  { id: 'cr-17', area: 'maths', question: 'A penguin colony has 120 birds. 40 swim away. How many remain?',       options: ['70','75','80','90'],       correctIndex: 2 },
  { id: 'cr-18', area: 'maths', question: 'A rabbit hops 2m each hop. To travel 18m, how many hops?',             options: ['7','8','9','10'],          correctIndex: 2 },
  { id: 'cr-19', area: 'maths', question: 'A giraffe eats 30kg of leaves a day. How much in 5 days?',             options: ['100kg','125kg','150kg','175kg'], correctIndex: 2 },
  { id: 'cr-20', area: 'maths', question: 'You adopt 2 animals per month. How many in a year?',                   options: ['18','20','22','24'],       correctIndex: 3 },
]

// ─── Spelling — Word Safari ───────────────────────────────────────────────────

const SPELLING: ArcadeQuestion[] = [
  { id: 'ws-1',  area: 'spelling', question: 'Which is the correct spelling?',                 options: ['Giraffe','Girafe','Girrafe','Girraffe'],             correctIndex: 0 },
  { id: 'ws-2',  area: 'spelling', question: 'Which is spelt correctly?',                      options: ['Dalmatian','Dalmation','Dalmasian','Dalmachian'],     correctIndex: 0 },
  { id: 'ws-3',  area: 'spelling', question: 'How do you spell the big African animal?',       options: ['Elefant','Elephent','Elephant','Elephannt'],          correctIndex: 2 },
  { id: 'ws-4',  area: 'spelling', question: 'Which is the correct spelling?',                 options: ['Cheetah','Cheeta','Cheeteh','Chieetah'],              correctIndex: 0 },
  { id: 'ws-5',  area: 'spelling', question: 'Which is spelt correctly?',                      options: ['Dalphim','Dolphin','Dolfin','Doulphin'],              correctIndex: 1 },
  { id: 'ws-6',  area: 'spelling', question: 'Which spelling is correct?',                     options: ['Pengueen','Pinguine','Penguin','Penguinn'],           correctIndex: 2 },
  { id: 'ws-7',  area: 'spelling', question: 'How do you spell the spotted wild cat?',         options: ['Lepard','Leoperd','Leopard','Leppard'],               correctIndex: 2 },
  { id: 'ws-8',  area: 'spelling', question: 'Which is the correct spelling?',                 options: ['Crocodile','Crocadile','Crocodyle','Crocidile'],      correctIndex: 0 },
  { id: 'ws-9',  area: 'spelling', question: 'Which is spelt correctly?',                      options: ['Cameleon','Chameleon','Chamelion','Camelieon'],       correctIndex: 1 },
  { id: 'ws-10', area: 'spelling', question: 'How do you spell the black and white bear?',     options: ['Panda','Pander','Pandah','Pannda'],                   correctIndex: 0 },
  { id: 'ws-11', area: 'spelling', question: 'Which spelling is correct?',                     options: ['Jagwar','Jaguer','Jaguar','Jagguar'],                 correctIndex: 2 },
  { id: 'ws-12', area: 'spelling', question: 'Which is the correct spelling?',                 options: ['Hippopotamus','Hipopotamus','Hipopotermus','Hippopotermus'], correctIndex: 0 },
  { id: 'ws-13', area: 'spelling', question: 'How do you spell the Australian bear?',          options: ['Koalar','Koala','Kawala','Koalar'],                   correctIndex: 1 },
  { id: 'ws-14', area: 'spelling', question: 'Which is spelt correctly?',                      options: ['Gorila','Gorilla','Goriller','Gorillah'],             correctIndex: 1 },
  { id: 'ws-15', area: 'spelling', question: 'Which spelling is correct?',                     options: ['Ocelot','Oscelot','Oselot','Occelot'],                correctIndex: 0 },
  { id: 'ws-16', area: 'spelling', question: 'How do you spell the dog-like wild animal?',     options: ['Hyaena','Hyena','Hiena','Hiyena'],                    correctIndex: 1 },
  { id: 'ws-17', area: 'spelling', question: 'Which is the correct spelling?',                 options: ['Flamingo','Flamingo','Flamingow','Flamingoe'],        correctIndex: 0 },
  { id: 'ws-18', area: 'spelling', question: 'Which is spelt correctly?',                      options: ['Armadilo','Armidillo','Armadillo','Armedillo'],        correctIndex: 2 },
  { id: 'ws-19', area: 'spelling', question: 'How do you spell the big African cat?',          options: ['Cheetah','Cheeter','Cheetha','Chita'],                correctIndex: 0 },
  { id: 'ws-20', area: 'spelling', question: 'Which spelling is correct?',                     options: ['Alligater','Alligator','Aligator','Alligatur'],       correctIndex: 1 },
]

// ─── Science — Habitat Builder ────────────────────────────────────────────────

const SCIENCE: ArcadeQuestion[] = [
  { id: 'hb-1',  area: 'science', question: 'What do we call an animal that eats only plants?',              options: ['Carnivore','Herbivore','Omnivore','Insectivore'],       correctIndex: 1 },
  { id: 'hb-2',  area: 'science', question: 'Which animal is a mammal?',                                     options: ['Shark','Salmon','Whale','Crocodile'],                   correctIndex: 2 },
  { id: 'hb-3',  area: 'science', question: 'What is a group of lions called?',                              options: ['Pack','Herd','Flock','Pride'],                          correctIndex: 3 },
  { id: 'hb-4',  area: 'science', question: 'What do dinosaurs belong to?',                                  options: ['Mammals','Reptiles','Amphibians','Birds'],              correctIndex: 1 },
  { id: 'hb-5',  area: 'science', question: 'Which sense do sharks use to detect blood in water?',           options: ['Sight','Hearing','Smell','Touch'],                      correctIndex: 2 },
  { id: 'hb-6',  area: 'science', question: 'What is a baby kangaroo called?',                               options: ['Cub','Joey','Foal','Kit'],                              correctIndex: 1 },
  { id: 'hb-7',  area: 'science', question: 'Which animal uses echolocation to navigate?',                   options: ['Eagle','Bat','Cat','Horse'],                            correctIndex: 1 },
  { id: 'hb-8',  area: 'science', question: 'What is a group of fish called?',                               options: ['Flock','Pack','School','Colony'],                       correctIndex: 2 },
  { id: 'hb-9',  area: 'science', question: 'Which of these is a cold-blooded animal?',                      options: ['Dog','Cat','Snake','Rabbit'],                           correctIndex: 2 },
  { id: 'hb-10', area: 'science', question: 'What do caterpillars turn into?',                               options: ['Moths or Butterflies','Bees','Wasps','Dragonflies'],    correctIndex: 0 },
  { id: 'hb-11', area: 'science', question: 'Which animal has the largest brain relative to its body?',      options: ['Elephant','Chimpanzee','Dolphin','Crow'],               correctIndex: 2 },
  { id: 'hb-12', area: 'science', question: 'What is the outer covering of a reptile?',                      options: ['Fur','Feathers','Scales','Skin'],                       correctIndex: 2 },
  { id: 'hb-13', area: 'science', question: 'Which animal can change colour to camouflage itself?',          options: ['Lion','Chameleon','Giraffe','Wolf'],                    correctIndex: 1 },
  { id: 'hb-14', area: 'science', question: 'What do we call animals that are active at night?',             options: ['Diurnal','Crepuscular','Nocturnal','Seasonal'],         correctIndex: 2 },
  { id: 'hb-15', area: 'science', question: 'How do penguins keep their eggs warm?',                         options: ['Bury in sand','Balance on feet','Nests of grass','Underwater'], correctIndex: 1 },
  { id: 'hb-16', area: 'science', question: 'Which is the largest land animal?',                             options: ['Giraffe','Hippopotamus','African Elephant','Rhino'],    correctIndex: 2 },
  { id: 'hb-17', area: 'science', question: 'What do we call animals that eat both plants and meat?',        options: ['Herbivore','Carnivore','Omnivore','Predator'],          correctIndex: 2 },
  { id: 'hb-18', area: 'science', question: 'A tadpole grows into which animal?',                            options: ['Fish','Frog','Salamander','Lizard'],                    correctIndex: 1 },
  { id: 'hb-19', area: 'science', question: 'Which part of a tree provides food for a koala?',               options: ['Bark','Roots','Eucalyptus leaves','Flowers'],           correctIndex: 2 },
  { id: 'hb-20', area: 'science', question: 'What is the term for an animal\'s natural home?',               options: ['Territory','Habitat','Domain','Range'],                 correctIndex: 1 },
]

// ─── Geography — World Quest ──────────────────────────────────────────────────

const GEOGRAPHY: ArcadeQuestion[] = [
  { id: 'wq-1',  area: 'geography', question: 'Which continent do wild lions mostly live on?',              options: ['Asia','Australia','Africa','South America'],         correctIndex: 2 },
  { id: 'wq-2',  area: 'geography', question: 'Which country is the Giant Panda from?',                    options: ['Japan','India','China','Thailand'],                  correctIndex: 2 },
  { id: 'wq-3',  area: 'geography', question: 'Kangaroos are native to which country?',                    options: ['New Zealand','South Africa','Australia','Brazil'],   correctIndex: 2 },
  { id: 'wq-4',  area: 'geography', question: 'The Amazon Rainforest is mostly in which country?',         options: ['Colombia','Brazil','Peru','Venezuela'],              correctIndex: 1 },
  { id: 'wq-5',  area: 'geography', question: 'Which ocean do Great White Sharks commonly live in?',       options: ['Arctic','Indian','Atlantic / Pacific','Red Sea'],    correctIndex: 2 },
  { id: 'wq-6',  area: 'geography', question: 'Where are polar bears native to?',                          options: ['Antarctica','Arctic','Greenland only','Siberia'],    correctIndex: 1 },
  { id: 'wq-7',  area: 'geography', question: 'Which country do Bengal tigers mostly come from?',          options: ['China','Bangladesh / India','Nepal','Vietnam'],      correctIndex: 1 },
  { id: 'wq-8',  area: 'geography', question: 'The Serengeti, home to the Great Migration, is in which country?', options: ['Kenya / Tanzania','South Africa','Ethiopia','Zambia'], correctIndex: 0 },
  { id: 'wq-9',  area: 'geography', question: 'Where do emperor penguins live?',                           options: ['Arctic','South America','Antarctica','New Zealand'], correctIndex: 2 },
  { id: 'wq-10', area: 'geography', question: 'Which river is home to the Amazon river dolphin?',          options: ['Nile','Congo','Amazon','Mississippi'],               correctIndex: 2 },
  { id: 'wq-11', area: 'geography', question: 'Orangutans are found in the rainforests of which islands?', options: ['Madagascar','Borneo and Sumatra','Sri Lanka','Java'], correctIndex: 1 },
  { id: 'wq-12', area: 'geography', question: 'Which African country is named after the Guinea baboon?',   options: ['Guinea','Ghana','Gabon','Gambia'],                   correctIndex: 0 },
  { id: 'wq-13', area: 'geography', question: 'The Komodo dragon is found only on islands in which country?', options: ['Philippines','Malaysia','Indonesia','Papua New Guinea'], correctIndex: 2 },
  { id: 'wq-14', area: 'geography', question: 'Where is the world\'s largest coral reef system?',          options: ['Caribbean','Red Sea','Australia','Philippines'],     correctIndex: 2 },
  { id: 'wq-15', area: 'geography', question: 'Which continent has the most species of big cats?',         options: ['Africa','Asia','South America','North America'],     correctIndex: 0 },
  { id: 'wq-16', area: 'geography', question: 'Snow leopards live in the mountains of which region?',      options: ['Alps','Andes','Himalayas','Rockies'],                correctIndex: 2 },
  { id: 'wq-17', area: 'geography', question: 'Which island is home to the ring-tailed lemur?',            options: ['Borneo','Sri Lanka','Madagascar','Fiji'],            correctIndex: 2 },
  { id: 'wq-18', area: 'geography', question: 'The bald eagle is the national bird of which country?',     options: ['Canada','Mexico','USA','Australia'],                 correctIndex: 2 },
  { id: 'wq-19', area: 'geography', question: 'African elephants roam mainly across which type of landscape?', options: ['Rainforest','Desert','Savanna','Tundra'],        correctIndex: 2 },
  { id: 'wq-20', area: 'geography', question: 'Which country has the most species of freshwater fish?',    options: ['USA','Brazil','China','Congo'],                      correctIndex: 1 },
]

// ─── Exports ──────────────────────────────────────────────────────────────────

export const ARCADE_QUESTIONS: Record<SkillArea, ArcadeQuestion[]> = {
  maths:     MATHS,
  spelling:  SPELLING,
  science:   SCIENCE,
  geography: GEOGRAPHY,
}

export function getArcadeQuestions(area: SkillArea, count = 10, recentIds: string[] = []): ArcadeQuestion[] {
  const pool = ARCADE_QUESTIONS[area]
  const recent = new Set(recentIds)

  // Prefer questions not recently seen
  const fresh = pool.filter(q => !recent.has(q.id))
  const source = fresh.length >= count ? fresh : pool

  // Shuffle and take `count`
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
