import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { catalogQueryOptions } from "@/lib/catalogQuery";
import SiteHeader from "@/components/SiteHeader";
import HomePage from "@/components/HomePage";
import { usePlanetarySound } from "@/hooks/usePlanetarySound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BR-Exoplanet Detection" },
      {
        name: "description",
        content:
          "Explore confirmed exoplanets in 3D, see their quick facts, and watch how transit detection finds them.",
      },
      { property: "og:title", content: "BR-Exoplanet Detection" },
      {
        property: "og:description",
        content:
          "Explore confirmed exoplanets in 3D, see their quick facts, and watch how transit detection finds them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  component: Index,
});

function Index() {
  const { data: planets } = useSuspenseQuery(catalogQueryOptions());
  const navigate = useNavigate();
  const { autoStart } = usePlanetarySound();

  useEffect(() => {
    autoStart({ period: 10 });
  }, [autoStart]);

  return (
    <div className="relative min-h-screen text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <SiteHeader />
        <HomePage
          planets={planets}
          onSelect={(planet) => navigate({ to: "/planets/$slug", params: { slug: planet.slug } })}
        />
        <footer className="mt-16 text-center text-xs text-slate-600">
          <p>
            All planet data comes from NASA&apos;s Exoplanet Archive (Kepler and TESS confirmed
            worlds).
          </p>
        </footer>
      </div>
    </div>
  );
}
