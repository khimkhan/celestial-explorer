# Stellar UX Overhaul

Refactor the application layout, audio behavior, and page architecture to adhere to the following professional UI/UX requirements:

Side-by-Side Object Detail Layout:

On every object details page (PlanetDetailPage.tsx), restructure the main layout into a balanced 3-column responsive grid system (grid-cols-1 lg:grid-cols-12).

Left Side (lg:col-span-3): Place the "Quick Facts" panel (ResultsPanel).

Center (lg:col-span-6): Center the interactive 3D animation model (OrbitalAnimation).

Right Side (lg:col-span-3): Place the "What We Found" detection data and charts (LightCurveChart / PeriodogramChart).

Homepage & Object Section Clean-up:

Remove all detailed object description cards and narrative summaries from HomePage.tsx.

Move object-specific descriptions and technical breakdowns exclusively into the individual object view (PlanetDetailPage.tsx), positioned clearly within or below the 3-column layout.

Automatic Ambient Audio:

Update usePlanetarySound.ts / AmbientSoundBar.tsx to automatically trigger sound as soon as the site starts working.

Handle browser autoplay restrictions smoothly by attaching an initial auto-start handler on the first global user interaction (click, pointerdown, or keydown) if autoplay is initially blocked.

UI/UX & Styling Enhancements:

Apply a sleek, professional space-themed UI using translucent glassmorphism cards (backdrop-blur-md bg-slate-900/60 border border-slate-800), smooth transition animations, and high-contrast typography for improved scannability.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/44d1c9e6-1156-4f17-ae7b-f07a09e47c8f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
