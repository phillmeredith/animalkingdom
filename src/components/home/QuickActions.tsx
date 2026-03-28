// QuickActions — 3 navigation buttons: Explore, Play, Shop

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="flex gap-3">
      <Button variant="primary" size="lg" className="flex-1" onClick={() => navigate('/explore')}>
        Explore
      </Button>
      <Button variant="accent" size="lg" className="flex-1" onClick={() => navigate('/play')}>
        Play
      </Button>
      <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('/shop')}>
        Shop
      </Button>
    </div>
  )
}
