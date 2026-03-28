// animalSounds.ts
// Utility for looking up BBC Sound Effects URLs for animals.
//
// Sound data lives in /Sounds/animal_sounds.json (project root, outside src/).
// Keys are lowercase snake_case animal names: "snow_leopard", "lion", etc.
// Only ~2,604 of 5,005 animals have sound entries — getSoundUrl returns null for the rest.
//
// The public/sounds symlink points to ../Sounds so MP3s are served at /sounds/{filename}.

import soundsData from './animal_sounds.json'

interface SoundEntry {
  filename: string
  path: string
  bbcId: string
}

const sounds = (soundsData as { _meta: unknown; sounds: Record<string, SoundEntry> }).sounds

/** Normalise a catalog animal name to the snake_case key used in animal_sounds.json. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Return the URL for an animal's sound file, or null if no sound exists.
 * The URL is relative to the Vite dev server / built output (served via public/sounds symlink).
 *
 * @param animalName - catalog name, e.g. "Snow Leopard", "Lion", "Blue Whale"
 */
export function getSoundUrl(animalName: string): string | null {
  if (!animalName) return null
  const key = normalizeName(animalName)
  const entry = sounds[key]
  if (!entry) return null
  return `/sounds/${entry.filename}`
}
