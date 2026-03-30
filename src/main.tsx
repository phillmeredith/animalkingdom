import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { runTierMigrationV1 } from '@/lib/db'

// Run one-time tier migration before the app mounts (animal-economy-tiers).
// Fire-and-forget: the migration is idempotent and silent — no toast on success or failure.
runTierMigrationV1()

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
