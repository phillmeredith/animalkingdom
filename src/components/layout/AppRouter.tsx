// AppRouter — main routing shell with bottom nav
// Placeholder screens will be replaced by feature builds

import { Routes, Route, Navigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { GradientFade } from './GradientFade'
import { usePersonalisation } from '@/hooks/usePersonalisation'
import { PlaceholderScreen } from './PlaceholderScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { ExploreScreen } from '@/screens/ExploreScreen'
import { GenerateScreen } from '@/screens/GenerateScreen'
import { AdoptScreen } from '@/screens/AdoptScreen'
import { MyAnimalsScreen } from '@/screens/MyAnimalsScreen'
import { PlayHubScreen } from '@/screens/PlayHubScreen'
import { CoinRushScreen } from '@/screens/CoinRushScreen'
import { WordSafariScreen } from '@/screens/WordSafariScreen'
import { HabitatBuilderScreen } from '@/screens/HabitatBuilderScreen'
import { WorldQuestScreen } from '@/screens/WorldQuestScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { StoreHubScreen } from '@/screens/StoreHubScreen'
import { EquipScreen } from '@/screens/EquipScreen'

export function AppRouter() {
  usePersonalisation() // applies background/font/headingCase to DOM on mount

  return (
    <div className="relative h-full flex flex-col bg-bg">
      {/* Screen area */}
      <main className="relative flex-1 overflow-hidden flex flex-col">
        <Routes>
          <Route path="/"                      element={<HomeScreen />} />
          <Route path="/explore"               element={<ExploreScreen />} />
          <Route path="/generate"              element={<GenerateScreen />} />
          <Route path="/adopt"                 element={<AdoptScreen />} />
          <Route path="/animals"               element={<MyAnimalsScreen />} />
          <Route path="/play"                  element={<PlayHubScreen />} />
          <Route path="/play/coin-rush"        element={<CoinRushScreen />} />
          <Route path="/play/word-safari"      element={<WordSafariScreen />} />
          <Route path="/play/habitat-builder"  element={<HabitatBuilderScreen />} />
          <Route path="/play/world-quest"      element={<WorldQuestScreen />} />
          <Route path="/settings"              element={<SettingsScreen />} />
          <Route path="/shop"                  element={<StoreHubScreen />} />
          {/* /auctions is the canonical URL for the Auction Hub (spec §2).
              It opens StoreHubScreen with the auctions tab pre-selected.
              The tab switch is handled via URL param rather than separate screen
              to keep the bottom nav active on the Store tab as spec requires. */}
          <Route path="/auctions"              element={<Navigate to="/shop?tab=auctions" replace />} />
          <Route path="/schleich"              element={<Navigate to="/explore" replace />} />
          <Route path="/equip/:petId"          element={<EquipScreen />} />
          {/* Redirects — legacy routes now consolidated into hub screens */}
          <Route path="/racing"                element={<Navigate to="/play" replace />} />
          <Route path="/marketplace"           element={<Navigate to="/shop" replace />} />
          <Route path="/cards"                 element={<Navigate to="/shop" replace />} />
          <Route path="*"                      element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <GradientFade />
      <BottomNav />
    </div>
  )
}
