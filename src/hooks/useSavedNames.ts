// useSavedNames — manages the player's adopted pet collection
// Leaf hook — no dependencies on other hooks

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { SavedName } from '@/lib/db'

export function useSavedNames() {
  const pets = useLiveQuery(
    () => db.savedNames.orderBy('id').reverse().toArray(),
    [],
    [] as SavedName[],
  )

  const petCount = pets.length

  const petsByCategory = pets.reduce<Record<string, SavedName[]>>((acc, pet) => {
    if (!acc[pet.category]) acc[pet.category] = []
    acc[pet.category].push(pet)
    return acc
  }, {})

  async function getPet(id: number): Promise<SavedName | undefined> {
    return db.savedNames.get(id)
  }

  async function adoptPet(
    data: Omit<SavedName, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<number> {
    const now = new Date()
    return db.savedNames.add({ ...data, createdAt: now, updatedAt: now })
  }

  async function releasePet(id: number): Promise<{ success: boolean; reason?: string }> {
    const pet = await db.savedNames.get(id)
    if (!pet) return { success: false, reason: 'Pet not found.' }

    // Guard: cannot release a pet that is currently listed for sale (R-06)
    // Note (INT-003): releasing a pet that is mid-race is not yet guarded here —
    // full race-forfeit logic is deferred. The for_sale status guard covers the
    // most common accidental release case.
    if (pet.status === 'for_sale') {
      return { success: false, reason: 'Pet is currently listed for sale. Remove the listing first.' }
    }

    await db.savedNames.delete(id)
    return { success: true }
  }

  async function renamePet(id: number, name: string): Promise<void> {
    await db.savedNames.update(id, { name, updatedAt: new Date() })
  }

  async function updatePet(id: number, changes: Partial<SavedName>): Promise<void> {
    await db.savedNames.update(id, { ...changes, updatedAt: new Date() })
  }

  async function setForSale(id: number): Promise<void> {
    await db.savedNames.update(id, { status: 'for_sale', updatedAt: new Date() })
  }

  async function clearForSale(id: number): Promise<void> {
    await db.savedNames.update(id, { status: 'active', updatedAt: new Date() })
  }

  async function getHorses(): Promise<SavedName[]> {
    return db.savedNames.where('animalType').equals('horse').toArray()
  }

  return {
    pets,
    petCount,
    petsByCategory,
    getPet,
    adoptPet,
    releasePet,
    renamePet,
    updatePet,
    setForSale,
    clearForSale,
    getHorses,
  }
}
