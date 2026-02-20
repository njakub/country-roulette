# 🌍 Country Roulette

A fun, interactive single-page Next.js app that lets you spin a roulette wheel to randomly select countries from a world map! Built with React, Next.js, TypeScript, and SVG maps.

## ✨ Features

- **Interactive SVG World Map**: Rendered using `react-simple-maps`
- **Roulette Animation**: Rapidly highlights random countries, slowing down to land on a final selection
- **Persistent State**: Remembers used countries between page refreshes via localStorage
- **Smart Controls**:
  - **SPIN**: Start the roulette animation
  - **UNDO LAST**: Remove the most recently selected country
  - **RESET ALL**: Clear all used countries and start fresh
- **Visual Feedback**:
  - Grey for used countries
  - Bright yellow glow for spinning highlights
  - Green for the final selection
  - Hover tooltips showing country names
- **Game Show Aesthetics**: Smooth animations, glowing highlights, and a fun UI

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory**:

   ```bash
   cd country-roulette
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Download the GeoJSON world map file**:

   Create the directory structure:

   ```bash
   mkdir -p public/geo
   ```

   **Option A - Download from Natural Earth**:

   ```bash
   curl -o public/geo/world.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
   ```

   **Option B - Use a different source**:
   - Visit: https://geojson-maps.ash.ms/
   - Download the "World Countries" GeoJSON file
   - Save it as `public/geo/world.geojson`

   **Option C - Use TopoJSON (alternative)**:
   - Download from: https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
   - Note: You'll need to convert TopoJSON to GeoJSON or adjust the code

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Play

1. Click the **🎲 SPIN** button to start the roulette
2. Watch as countries are rapidly highlighted in yellow
3. The animation slows down and lands on a final country (shown in green)
4. The selected country is added to the "Used Countries" list
5. Previously selected countries are greyed out and excluded from future spins
6. Use **↶ UNDO LAST** to remove the most recent selection
7. Use **🔄 RESET ALL** to clear everything and start over
8. When all countries are used, you'll see a completion message!

## 🔧 Technical Details

### Spin Algorithm

The roulette animation works as follows:

1. **Initial Speed**: Starts with a tick delay of ~60ms
2. **Acceleration Curve**: Each tick increases the delay by 10% (multiply by 1.1)
3. **Stop Condition**: Stops after ~50 ticks OR when delay exceeds 700ms
4. **Selection**: The last highlighted country becomes the final selection

**To adjust the spin feel**, edit these values in `app/components/MapRoulette.tsx`:

```typescript
let delay = 60; // Start delay (lower = faster initial spin)
const maxTicks = 50; // Maximum number of ticks (higher = longer spin)
const maxDelay = 700; // Maximum delay in ms (higher = slower ending)
delay *= 1.1; // Multiplier per tick (higher = faster deceleration)
```

### Project Structure

```
country-roulette/
├── app/
│   ├── components/
│   │   ├── MapRoulette.tsx    # Main map component with spin logic
│   │   └── Sidebar.tsx         # Control panel and used countries list
│   ├── utils/
│   │   ├── countries.ts        # Country data parsing utilities
│   │   └── storage.ts          # localStorage helpers
│   ├── globals.css             # Global styles and Tailwind config
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page component
├── public/
│   └── geo/
│       └── world.geojson       # World map data (you need to add this)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

### Key Technologies

- **Next.js 15** (App Router)
- **React 18** with TypeScript
- **react-simple-maps**: SVG-based map rendering
- **react-tooltip**: Hover tooltips for countries
- **Tailwind CSS**: Styling and animations
- **localStorage**: Client-side persistence

### Country Identification

Countries are identified using a priority system:

1. `ISO_A3` (preferred - 3-letter ISO code like "USA", "GBR")
2. `iso_a3` (lowercase variant)
3. `id` (fallback)
4. `NAME` or `name` (last resort)

This ensures stable identification across different GeoJSON sources.

### Edge Cases Handled

- ✅ All countries used → Shows completion message, disables SPIN
- ✅ No timers leak → All timeouts cleared on component unmount
- ✅ SSR-safe → localStorage only accessed client-side
- ✅ Hydration mismatch → Delayed render until client mount
- ✅ Missing GeoJSON → Shows loading state with error handling

## 🎨 Customization

### Colors

Edit `app/components/MapRoulette.tsx` to change country colors:

```typescript
let fill = "#E5E7EB"; // Default (unused countries)
if (isUsed) fill = "#9CA3AF"; // Grey for used
if (isHighlighted) fill = "#FBBF24"; // Yellow for spinning
if (isSelected) fill = "#10B981"; // Green for final selection
```

### Map Projection

Change the map projection in `app/components/MapRoulette.tsx`:

```typescript
<ComposableMap
  projection="geoMercator"  // Try: geoEqualEarth, geoNaturalEarth1, etc.
  projectionConfig={{
    scale: 140,  // Adjust zoom level
  }}
>
```

### Sidebar Width

Adjust in `app/page.tsx`:

```typescript
<div className="w-80 flex-shrink-0">  // Change w-80 to w-64, w-96, etc.
```

## 🐛 Troubleshooting

**Map not loading?**

- Ensure `public/geo/world.geojson` exists and is valid JSON
- Check browser console for fetch errors

**Countries not highlighting?**

- Verify your GeoJSON has `ISO_A3` or similar identifier fields
- Check console for errors in country ID extraction

**localStorage not persisting?**

- Ensure you're not in private/incognito mode
- Check browser localStorage quota hasn't been exceeded

**Build errors?**

- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild: `rm -rf .next && npm run dev`

## 📝 License

MIT - Feel free to use this project however you like!

## 🙏 Credits

- Map data: [Natural Earth](https://www.naturalearthdata.com/)
- Built with [react-simple-maps](https://www.react-simple-maps.io/)

---

**Enjoy exploring the world, one spin at a time! 🎰🌍**
