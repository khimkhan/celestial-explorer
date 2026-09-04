import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { catalogQueryOptions } from "@/lib/catalogQuery";
import { getExoplanetBySlug } from "@/lib/exoplanets.functions";
import SiteHeader from "@/components/SiteHeader";
import PlanetDetailPage from "@/components/PlanetDetailPage";

export const Route = createFileRoute("/planets/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ");
    const title = `${name} · Transit Analysis | BR`;
    const description = `Orbital telemetry, 3D orbit model and transit light-curve analysis for the confirmed exoplanet ${name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  component: PlanetRoute,
});

function PlanetRoute() {
  const { slug } = Route.useParams();
  const { data: planets } = useSuspenseQuery(catalogQueryOptions());
  const local = planets.find((p) => p.slug === slug);

  // Planets found through live search are not in the default catalog: resolve
  // them straight from the NASA archive so the detail view always renders.
  const live = useQuery({
    queryKey: ["exoplanet-by-slug", slug],
    queryFn: () => getExoplanetBySlug({ data: { slug } }),
    enabled: !local,
    staleTime: 60 * 60 * 1000,
  });

  const planet = local ?? live.data ?? null;

  return (
    <div className="relative min-h-screen text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <SiteHeader />
        {planet ? (
          <PlanetDetailPage planet={planet} />
        ) : live.isLoading ? (
          <p className="py-24 text-center text-sm text-slate-400">
            Loading live data from the NASA Exoplanet Archive…
          </p>
        ) : (
          <NotFoundBody slug={slug} />
        )}
      </div>
    </div>
  );
}

function NotFoundBody({ slug }: { slug: string }) {
  return (
    <p className="py-24 text-center text-sm text-slate-400">
      No confirmed exoplanet matches &ldquo;{slug.replace(/-/g, " ")}&rdquo;.
    </p>
  );
}
