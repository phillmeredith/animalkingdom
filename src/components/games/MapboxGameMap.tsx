// MapboxGameMap — Mapbox GL satellite + 3D terrain map for World Quest
//
// Replaces the three SVG map components (UKMap, WesternEuropeMap, WorldMap).
// Uses react-map-gl v7 with mapbox-gl v2.
//
// Architecture:
//   - Satellite Streets style + Mapbox DEM terrain (1.5× exaggeration)
//   - GeoJSON sources per year level — country polygons as click targets
//   - Feature state drives fill/stroke highlighting (correct / wrong / target)
//   - Gesture locking: dragPan + scrollZoom disabled during tap-answer questions
//   - Camera flies to the correct region on yearLevel change
//   - All DS colour tokens are hardcoded hex (Mapbox paint cannot consume CSS vars)
//
// Portal rule: this component renders inside a regular div — fixed overlays
// (header, XP strip, etc.) are portalled by the parent WorldQuestGame.

import { useRef, useEffect, useCallback, useState } from 'react'
import Map, { Source, Layer } from 'react-map-gl/mapbox'
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

// ─── DS colour constants (from design-system/DESIGN_SYSTEM.md) ────────────────
// These are used in Mapbox layer paint — CSS custom properties are not supported.
const DS = {
  fill:          'rgba(35,38,47,0.55)',   // --elev at 55% opacity
  border:        '#2C2F3A',              // --border-s
  correct:       { fill: 'rgba(69,178,107,0.45)',  border: '#45B26B' },  // --green
  wrong:         { fill: 'rgba(239,70,111,0.45)',  border: '#EF466F' },  // --red
  target:        { fill: 'rgba(151,87,215,0.45)',  border: '#9757D7' },  // --purple
  borderWidth:   1.2,
  activeBorderWidth: 2.5,
}

// ─── Camera config per year level ────────────────────────────────────────────

const CAMERA = {
  // pitch reduced from 45→20 so the UK sits centred in viewport rather than
  // pushed to the bottom third; latitude moved slightly north to compensate
  // for the remaining perspective offset.
  1: { longitude: -3.0,  latitude: 54.2, zoom: 5.0, pitch: 20, bearing: 0 },
  2: { longitude: 8.0,   latitude: 47.0, zoom: 3.0, pitch: 20, bearing: 0 },
  3: { longitude: 15.0,  latitude: 15.0, zoom: 1.4, pitch: 10, bearing: 0 },
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MapHighlight = 'correct' | 'wrong' | 'target' | null

export interface MapboxGameMapProps {
  yearLevel:          1 | 2 | 3
  highlightedCountry: string | null
  highlight:          MapHighlight
  onCountryTap:       (countryId: string) => void
  mapLocked:          boolean
  /** Increments on each new question — triggers a camera reset to the default view */
  questionIndex:      number
}

// ─── GeoJSON data ─────────────────────────────────────────────────────────────
// Simplified but geographically accurate polygons. Coordinates: [lon, lat].
// Each feature carries a `countryId` property matching the game question IDs.
// Numeric `id` fields are required for Mapbox feature state operations.

type GameGeoJSON = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    id: number
    properties: { countryId: string; name: string }
    geometry: { type: 'Polygon'; coordinates: [number, number][][] }
  }>
}

// Year 1 — UK constituent nations
const UK_GEOJSON: GameGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature', id: 1,
      properties: { countryId: 'england', name: 'England' },
      geometry: { type: 'Polygon', coordinates: [[
        [-5.72, 50.07], [-3.03, 50.02], [1.77, 51.16], [1.77, 53.00],
        [0.10, 53.65], [-0.20, 54.18], [-1.25, 55.45], [-2.00, 55.80],
        [-3.35, 54.65], [-3.18, 53.35], [-4.25, 52.48], [-5.20, 51.78],
        [-5.72, 50.50], [-5.72, 50.07],
      ]] },
    },
    {
      type: 'Feature', id: 2,
      properties: { countryId: 'scotland', name: 'Scotland' },
      geometry: { type: 'Polygon', coordinates: [[
        [-2.00, 55.80], [-1.25, 55.45], [-0.20, 55.80], [0.05, 57.40],
        [-1.85, 58.55], [-3.45, 58.70], [-4.90, 58.45], [-6.20, 57.45],
        [-6.35, 56.50], [-5.15, 55.95], [-4.50, 55.85], [-3.42, 55.08],
        [-2.00, 55.80],
      ]] },
    },
    {
      type: 'Feature', id: 3,
      properties: { countryId: 'wales', name: 'Wales' },
      geometry: { type: 'Polygon', coordinates: [[
        [-2.68, 51.38], [-3.15, 51.18], [-5.05, 51.68], [-5.32, 52.08],
        [-4.82, 53.42], [-3.28, 53.42], [-3.18, 53.35], [-4.25, 52.48],
        [-3.42, 51.72], [-2.68, 51.38],
      ]] },
    },
    {
      type: 'Feature', id: 4,
      properties: { countryId: 'northern-ireland', name: 'Northern Ireland' },
      geometry: { type: 'Polygon', coordinates: [[
        [-7.22, 54.12], [-6.02, 53.88], [-5.45, 54.05], [-5.05, 54.88],
        [-6.05, 55.28], [-7.18, 55.18], [-7.98, 54.42], [-7.22, 54.12],
      ]] },
    },
  ],
}

// Year 2 — Western Europe
const EUROPE_GEOJSON: GameGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature', id: 1,
      properties: { countryId: 'uk', name: 'United Kingdom' },
      geometry: { type: 'Polygon', coordinates: [[
        [-5.72, 50.07], [1.77, 51.16], [1.77, 53.00], [0.10, 53.65],
        [-1.25, 55.45], [-2.00, 55.80], [-4.90, 58.45], [-6.35, 56.50],
        [-5.72, 51.00], [-5.72, 50.07],
      ]] },
    },
    {
      type: 'Feature', id: 2,
      properties: { countryId: 'france', name: 'France' },
      geometry: { type: 'Polygon', coordinates: [[
        [-1.82, 43.42], [3.22, 43.28], [7.68, 43.82], [7.00, 45.95],
        [8.22, 47.62], [7.42, 49.45], [6.28, 49.52], [5.92, 50.02],
        [2.52, 51.08], [1.42, 50.92], [0.28, 49.72], [-1.82, 47.05],
        [-4.72, 47.82], [-4.32, 48.42], [-2.02, 48.62], [-1.55, 49.22],
        [-1.82, 49.65], [1.42, 50.92],
        [-4.72, 47.82], [-1.82, 43.42],
      ]] },
    },
    {
      type: 'Feature', id: 3,
      properties: { countryId: 'spain', name: 'Spain' },
      geometry: { type: 'Polygon', coordinates: [[
        [-9.28, 36.00], [3.32, 42.45], [3.32, 42.45],
        [-1.82, 43.42], [-9.28, 43.78], [-9.28, 36.00],
      ]] },
    },
    {
      type: 'Feature', id: 4,
      properties: { countryId: 'germany', name: 'Germany' },
      geometry: { type: 'Polygon', coordinates: [[
        [6.12, 50.02], [5.98, 51.52], [6.85, 52.42], [8.28, 52.98],
        [10.08, 55.05], [12.08, 54.18], [14.35, 53.75], [15.02, 51.12],
        [12.08, 50.32], [13.05, 48.02], [10.48, 47.42], [8.22, 47.62],
        [7.42, 49.45], [6.12, 50.02],
      ]] },
    },
    {
      type: 'Feature', id: 5,
      properties: { countryId: 'italy', name: 'Italy' },
      geometry: { type: 'Polygon', coordinates: [[
        [7.00, 43.82], [7.68, 43.82], [8.22, 47.62], [13.05, 47.42],
        [13.72, 45.58], [12.38, 44.22], [15.22, 37.22], [15.58, 38.22],
        [16.55, 39.62], [18.52, 40.08], [16.58, 41.35], [13.08, 44.35],
        [12.38, 44.22], [11.08, 43.82], [10.22, 43.88], [8.48, 44.38],
        [7.68, 43.82], [7.00, 43.82],
      ]] },
    },
    {
      type: 'Feature', id: 6,
      properties: { countryId: 'netherlands', name: 'Netherlands' },
      geometry: { type: 'Polygon', coordinates: [[
        [3.32, 51.38], [4.22, 51.38], [5.92, 51.08], [6.12, 50.78],
        [5.98, 51.52], [6.85, 52.42], [4.85, 53.08], [3.35, 53.52],
        [3.32, 51.38],
      ]] },
    },
    {
      type: 'Feature', id: 7,
      properties: { countryId: 'poland', name: 'Poland' },
      geometry: { type: 'Polygon', coordinates: [[
        [14.35, 53.75], [18.52, 54.42], [22.78, 54.38], [24.08, 53.88],
        [23.48, 52.28], [24.15, 50.88], [22.58, 49.08], [18.82, 49.52],
        [15.02, 50.78], [14.82, 50.88], [14.35, 53.75],
      ]] },
    },
  ],
}

// Year 3 — World continents
const WORLD_GEOJSON: GameGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature', id: 1,
      properties: { countryId: 'africa', name: 'Africa' },
      geometry: { type: 'Polygon', coordinates: [[
        [-17.52, 14.75], [-5.52, 7.88], [2.18, 5.35], [9.42, 4.02],
        [15.08, -4.02], [12.52, -17.02], [18.52, -34.82], [27.18, -29.52],
        [35.02, -11.52], [42.08, 10.08], [50.52, 11.52], [43.52, 11.02],
        [41.68, 12.08], [38.52, 15.52], [36.52, 22.08], [32.52, 31.08],
        [25.02, 31.52], [10.52, 37.08], [0.02, 35.52],
        [-5.52, 36.02], [-13.08, 27.52], [-17.52, 14.75],
      ]] },
    },
    {
      type: 'Feature', id: 2,
      properties: { countryId: 'south-america', name: 'South America' },
      geometry: { type: 'Polygon', coordinates: [[
        [-75.52, 11.08], [-63.52, 11.52], [-59.52, 8.08], [-51.52, 4.52],
        [-50.02, -1.52], [-44.52, -23.08], [-43.52, -23.52],
        [-39.52, -15.52], [-35.52, -8.52], [-34.52, -7.08],
        [-36.52, -36.52], [-53.52, -55.02], [-68.52, -55.52],
        [-75.52, -50.52], [-80.52, -36.52], [-81.52, -6.52],
        [-77.52, 0.52], [-75.52, 11.08],
      ]] },
    },
    {
      type: 'Feature', id: 3,
      properties: { countryId: 'australia', name: 'Australia' },
      geometry: { type: 'Polygon', coordinates: [[
        [113.52, -22.08], [122.52, -18.08], [130.52, -12.08], [135.52, -12.08],
        [137.52, -13.52], [141.52, -10.52], [145.52, -14.52], [150.52, -22.52],
        [153.52, -28.52], [153.52, -38.08], [148.52, -40.52],
        [144.52, -38.52], [140.52, -36.52], [136.52, -35.08],
        [130.52, -33.52], [125.52, -34.52], [114.52, -34.52],
        [113.52, -26.52], [113.52, -22.08],
      ]] },
    },
    {
      type: 'Feature', id: 4,
      properties: { countryId: 'asia', name: 'Asia' },
      geometry: { type: 'Polygon', coordinates: [[
        [26.08, 71.52], [40.08, 71.52], [70.08, 72.52], [100.08, 72.52],
        [140.08, 72.52], [168.08, 65.52], [180.0, 55.52],
        [142.08, 45.52], [130.08, 32.52], [120.08, 22.52],
        [100.08, 5.52], [95.08, -1.52], [85.08, 8.52],
        [72.08, 8.52], [58.08, 22.52], [44.08, 12.52],
        [32.08, 12.52], [26.08, 42.52], [26.08, 71.52],
      ]] },
    },
    {
      type: 'Feature', id: 5,
      properties: { countryId: 'north-america', name: 'North America' },
      geometry: { type: 'Polygon', coordinates: [[
        [-168.0, 68.0], [-140.0, 70.0], [-100.0, 72.0], [-70.0, 68.0],
        [-52.0, 60.0], [-55.0, 47.0], [-66.0, 44.0], [-70.0, 42.0],
        [-82.0, 24.0], [-87.0, 15.0], [-77.0, 7.0], [-75.5, 11.0],
        [-90.0, 20.0], [-98.0, 19.0], [-104.0, 19.0], [-117.0, 32.0],
        [-122.0, 37.0], [-124.0, 49.0], [-140.0, 60.0],
        [-168.0, 68.0],
      ]] },
    },
    {
      type: 'Feature', id: 6,
      properties: { countryId: 'europe', name: 'Europe' },
      geometry: { type: 'Polygon', coordinates: [[
        [-9.0, 36.0], [3.0, 36.0], [15.0, 36.0], [28.0, 42.0],
        [32.0, 47.0], [26.0, 52.0], [26.0, 60.0], [15.0, 62.0],
        [5.0, 62.0], [-2.0, 58.0], [-9.0, 43.0], [-9.0, 36.0],
      ]] },
    },
  ],
}

const GEOJSON_BY_LEVEL: Record<1 | 2 | 3, GameGeoJSON> = {
  1: UK_GEOJSON,
  2: EUROPE_GEOJSON,
  3: WORLD_GEOJSON,
}

// ─── Layer paint expressions using feature state ───────────────────────────────

const FILL_PAINT = {
  'fill-color': [
    'case',
    ['==', ['feature-state', 'highlight'], 'correct'], DS.correct.fill,
    ['==', ['feature-state', 'highlight'], 'wrong'],   DS.wrong.fill,
    ['==', ['feature-state', 'highlight'], 'target'],  DS.target.fill,
    DS.fill,
  ] as mapboxgl.FillPaint['fill-color'],
  'fill-opacity': 1,
}

const LINE_PAINT = {
  'line-color': [
    'case',
    ['==', ['feature-state', 'highlight'], 'correct'], DS.correct.border,
    ['==', ['feature-state', 'highlight'], 'wrong'],   DS.wrong.border,
    ['==', ['feature-state', 'highlight'], 'target'],  DS.target.border,
    DS.border,
  ] as mapboxgl.LinePaint['line-color'],
  'line-width': [
    'case',
    ['!=', ['feature-state', 'highlight'], null], DS.activeBorderWidth,
    DS.borderWidth,
  ] as mapboxgl.LinePaint['line-width'],
}

import mapboxgl from 'mapbox-gl'

// ─── Component ────────────────────────────────────────────────────────────────

export function MapboxGameMap({
  yearLevel,
  highlightedCountry,
  highlight,
  onCountryTap,
  mapLocked,
  questionIndex,
}: MapboxGameMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [mapReady, setMapReady] = useState(false)
  const [sourceReady, setSourceReady] = useState(false)

  const geoJson = GEOJSON_BY_LEVEL[yearLevel]

  // ── Fly to region when yearLevel changes ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) return
    const cam = CAMERA[yearLevel]
    map.flyTo({
      center:   [cam.longitude, cam.latitude],
      zoom:     cam.zoom,
      pitch:    cam.pitch,
      bearing:  cam.bearing,
      duration: 1200,
      essential: true,
    })
  }, [yearLevel, mapReady])

  // ── Reset camera on each new question ────────────────────────────────────────
  // Ensures the map re-centres to the default view so prior panning or height
  // changes (e.g. tap-map → MCQ with options panel) don't leave the region
  // positioned awkwardly in the shorter viewport.
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) return
    const cam = CAMERA[yearLevel]
    // resize() tells Mapbox to re-measure its container after the layout change
    // (e.g. tap-map → MCQ panel appearing shrinks the map height). Must call
    // before flyTo so the camera lands correctly in the new viewport.
    map.resize()
    map.flyTo({
      center:    [cam.longitude, cam.latitude],
      zoom:      cam.zoom,
      pitch:     cam.pitch,
      bearing:   cam.bearing,
      duration:  600,
      essential: true,
    })
  }, [questionIndex, mapReady, yearLevel])

  // ── Track when the countries GeoJSON source is fully indexed ─────────────────
  // setFeatureState throws if called before the source tiles are indexed, even
  // after the onLoad event. We listen for 'sourcedata' to know when it's safe.
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) return

    const check = () => {
      if (map.isSourceLoaded('countries')) setSourceReady(true)
    }
    check()
    map.on('sourcedata', check)
    return () => { map.off('sourcedata', check) }
  }, [mapReady])

  // When yearLevel changes the source data is swapped — reset sourceReady
  // so the highlight effect waits for the new source to finish indexing.
  useEffect(() => {
    setSourceReady(false)
  }, [yearLevel])

  // ── Update feature state for highlighted country ────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady || !sourceReady) return

    try {
      // Clear all highlights on this source first
      geoJson.features.forEach(f => {
        map.removeFeatureState({ source: 'countries', id: f.id })
      })

      // Apply new highlight
      if (highlightedCountry && highlight) {
        const feature = geoJson.features.find(
          f => f.properties.countryId === highlightedCountry
        )
        if (feature) {
          map.setFeatureState(
            { source: 'countries', id: feature.id },
            { highlight }
          )
        }
      }
    } catch {
      // Silently skip — next sourcedata event will re-trigger via sourceReady change
    }
  }, [highlightedCountry, highlight, geoJson, mapReady, sourceReady])

  // ── Gesture locking ─────────────────────────────────────────────────────────
  // Disabled during tap-answer questions so panning doesn't swallow the tap.
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) return

    if (mapLocked) {
      map.dragPan.disable()
      map.scrollZoom.disable()
      map.doubleClickZoom.disable()
      map.touchZoomRotate.disable()
    } else {
      map.dragPan.enable()
      map.scrollZoom.enable()
      map.doubleClickZoom.enable()
      map.touchZoomRotate.enable()
    }
  }, [mapLocked, mapReady])

  // ── Click handler ────────────────────────────────────────────────────────────
  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    if (!e.features || e.features.length === 0) return
    const countryId = e.features[0].properties?.countryId as string | undefined
    if (countryId) onCountryTap(countryId)
  }, [onCountryTap])

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      initialViewState={CAMERA[yearLevel]}
      terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
      projection={{ name: 'globe' }}
      fog={{
        color:           'rgb(10,10,16)',
        'horizon-blend': 0.04,
        'high-color':    'rgb(20,20,30)',
        'space-color':   'rgb(5,5,10)',
        'star-intensity': 0.6,
      }}
      onClick={handleClick}
      interactiveLayerIds={['country-fill']}
      onLoad={() => setMapReady(true)}
      attributionControl={false}
    >
      {/* Terrain DEM source */}
      <Source
        id="mapbox-dem"
        type="raster-dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        tileSize={512}
        maxzoom={14}
      />

      {/* Country boundary source */}
      <Source
        id="countries"
        type="geojson"
        data={geoJson as unknown as GeoJSON.FeatureCollection}
        generateId={false}
      >
        <Layer id="country-fill"    type="fill" paint={FILL_PAINT} />
        <Layer id="country-border"  type="line" paint={LINE_PAINT} />
      </Source>
    </Map>
  )
}
