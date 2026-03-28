// VirtualAnimalGrid — 4-column virtualised grid using @tanstack/react-virtual
// Exposes scrollToLetter via imperative ref

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search } from 'lucide-react'
import { AnimalCard } from './AnimalCard'
import { EmptyState } from '@/components/ui/EmptyState'
import type { AnimalEntry } from '@/data/animals'

function useColumnCount(containerRef: React.RefObject<HTMLDivElement | null>): number {
  const [cols, setCols] = useState(4)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      setCols(w >= 1024 ? 6 : w >= 768 ? 5 : 4)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return cols
}

const ROW_HEIGHT = 220
const OVERSCAN = 5

export interface VirtualAnimalGridHandle {
  scrollToIndex: (rowIndex: number) => void
}

interface VirtualAnimalGridProps {
  animals: AnimalEntry[]
  onSelectAnimal: (animal: AnimalEntry) => void
}

export const VirtualAnimalGrid = forwardRef<VirtualAnimalGridHandle, VirtualAnimalGridProps>(
  function VirtualAnimalGrid({ animals, onSelectAnimal }, ref) {
    const parentRef = useRef<HTMLDivElement>(null)
    const cols = useColumnCount(parentRef)
    const rowCount = Math.ceil(animals.length / cols)

    const virtualizer = useVirtualizer({
      count: rowCount,
      getScrollElement: () => parentRef.current,
      estimateSize: () => ROW_HEIGHT,
      overscan: OVERSCAN,
      gap: 12,
    })

    useImperativeHandle(ref, () => ({
      scrollToIndex(rowIndex: number) {
        virtualizer.scrollToIndex(rowIndex, { align: 'start' })
      },
    }))

    if (animals.length === 0) {
      return (
        <EmptyState
          icon={<Search size={48} className="text-t3" />}
          title="No animals found"
          description="Try a different search or category"
        />
      )
    }

    const totalSize = virtualizer.getTotalSize()
    const items = virtualizer.getVirtualItems()

    return (
      <div ref={parentRef} className="flex-1 overflow-y-auto pb-24">
        <div style={{ height: totalSize, position: 'relative' }}>
          {items.map(row => {
            const startIndex = row.index * cols
            const rowAnimals = Array.from({ length: cols }, (_, i) => animals[startIndex + i])

            return (
              <div
                key={row.key}
                data-index={row.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  transform: `translateY(${row.start}px)`,
                  width: '100%',
                }}
              >
                <div
                  className="px-6 pb-3 pt-1"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: '8px',
                  }}
                >
                  {rowAnimals.map((animal, i) =>
                    animal ? (
                      <AnimalCard
                        key={animal.id}
                        animal={animal}
                        onTap={() => onSelectAnimal(animal)}
                      />
                    ) : (
                      // Empty cell — preserves grid alignment on last row
                      <div key={`empty-${i}`} />
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
