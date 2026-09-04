import { createFileRoute } from "@tanstack/react-router";
import SiteHeader from "@/components/SiteHeader";
import ConstellationGallery from "@/components/ConstellationGallery";

export const Route = createFileRoute("/constellations")({
  head: () => ({
    meta: [
      { title: "3D Constellation Star Map | BR-EGATE" },
      {
        name: "description",
        content:
          "Fly through a live 3D sky: real IAU stick figures and Bright Star positions for the constellations hosting confirmed exoplanets.",
      },
      { property: "og:title", content: "3D Constellation Star Map | BR-EGATE" },
      {
        property: "og:description",
        content:
          "Drag to look around and scroll to zoom through a planetarium-style 3D map of exoplanet-hosting constellations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConstellationsRoute,
});

function ConstellationsRoute() {
  return (
    <div className="relative min-h-screen text-white">
      <ConstellationGallery />
      <div className="pointer-events-none relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="pointer-events-auto [&_*]:drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          <SiteHeader />
        </div>
      </div>
    </div>
  );
}
