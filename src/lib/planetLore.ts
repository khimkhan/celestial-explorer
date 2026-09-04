import type { PlanetVisualType } from '@/types';

/**
 * Editorial layer for the catalog: slug, host constellation and plain-English
 * story text. Every numeric value comes from the NASA Exoplanet Archive at
 * runtime (see exoplanets.functions.ts) — nothing here is a measurement.
 */
export interface PlanetLore {
  slug: string;
  plName: string; // exact NASA Exoplanet Archive planet name
  constellation: string; // IAU abbreviation
  planetType: PlanetVisualType;
  planetColor: string;
  planetColor2: string;
  hasKnownImage: boolean;
  description: string;
  lifeCycle: string;
}

/** Real figures fetched from the NASA Exoplanet Archive, merged with lore. */
export interface CatalogPlanet extends PlanetLore {
  hostName: string;
  periodDays: number;
  radiusEarth: number;
  semiMajorAxisAu: number | null;
  eqTempK: number | null;
  transitDepthPct: number | null;
  transitDurationHours: number | null;
  stellarRadius: number | null;
  stellarTemp: number | null;
  distanceLy: number | null;
  ra: number;
  dec: number;
  discoveryYear: number;
  discoveryMethod: string;
  discoveryFacility: string;
}

export const PLANET_LORE: PlanetLore[] = [
  {
    slug: 'kepler-10-b',
    plName: 'Kepler-10 b',
    constellation: 'Dra',
    planetType: 'lava',
    planetColor: '#ff6b35',
    planetColor2: '#c9302c',
    hasKnownImage: true,
    description:
      'Kepler-10 b was the first rocky planet confirmed by the Kepler mission. It orbits its star in under one day, so its dayside is hot enough to keep the surface molten.',
    lifeCycle:
      'Locked close to its star, one hemisphere faces the heat forever while the other stays dark. Over billions of years the intense radiation will keep boiling rock off the surface.',
  },
  {
    slug: 'tres-2-b',
    plName: 'TrES-2 b',
    constellation: 'Dra',
    planetType: 'gas-stripped',
    planetColor: '#2c2c2c',
    planetColor2: '#1a1a2e',
    hasKnownImage: true,
    description:
      'TrES-2 b is one of the darkest planets known — it reflects less than 1% of the starlight that reaches it, making it blacker than coal.',
    lifeCycle:
      'This hot Jupiter circles its Sun-like star every 2.5 days. Constant irradiation inflates and slowly erodes its atmosphere.',
  },
  {
    slug: 'kepler-7-b',
    plName: 'Kepler-7 b',
    constellation: 'Lyr',
    planetType: 'gas-orange',
    planetColor: '#e8a87c',
    planetColor2: '#c38d5e',
    hasKnownImage: true,
    description:
      'Kepler-7 b is one of the puffiest planets ever measured — larger than Jupiter but with a density closer to polystyrene foam. It was the first exoplanet to have its clouds mapped.',
    lifeCycle:
      'Bright reflective clouds hang over its western hemisphere. As its aging star brightens, the planet will keep inflating and shedding gas.',
  },
  {
    slug: 'hat-p-7-b',
    plName: 'HAT-P-7 b',
    constellation: 'Cyg',
    planetType: 'gas-blue',
    planetColor: '#4a90d9',
    planetColor2: '#2e6da4',
    hasKnownImage: false,
    description:
      'HAT-P-7 b is a scorching gas giant whose clouds were seen changing from night to night — the first weather ever detected on a planet outside the solar system.',
    lifeCycle:
      'Winds sweep heat from the dayside to the nightside at thousands of kilometres per hour, building and tearing down cloud banks in days.',
  },
  {
    slug: 'kepler-5-b',
    plName: 'Kepler-5 b',
    constellation: 'Cyg',
    planetType: 'gas-orange',
    planetColor: '#d4843a',
    planetColor2: '#a66527',
    hasKnownImage: false,
    description:
      'Kepler-5 b was among the first planets announced by the Kepler mission. It is a massive hot Jupiter orbiting a star hotter and larger than the Sun.',
    lifeCycle:
      'Its close orbit keeps the upper atmosphere puffed up. When the host star swells into a red giant, the planet will be engulfed.',
  },
  {
    slug: 'wasp-47-b',
    plName: 'WASP-47 b',
    constellation: 'Aqr',
    planetType: 'gas-orange',
    planetColor: '#c9974f',
    planetColor2: '#9c7536',
    hasKnownImage: false,
    description:
      'WASP-47 b is a rare hot Jupiter with close planetary neighbours: a super-Earth inside its orbit and a Neptune-sized world just outside it.',
    lifeCycle:
      'The three inner planets tug on each other, and those tiny timing shifts let astronomers weigh them without ever seeing them directly.',
  },
  {
    slug: 'kepler-11-b',
    plName: 'Kepler-11 b',
    constellation: 'Cyg',
    planetType: 'mini-ice',
    planetColor: '#6bb6d6',
    planetColor2: '#4a8caa',
    hasKnownImage: false,
    description:
      'Kepler-11 b is the innermost of six planets packed tighter around their star than Venus is around the Sun — one of the flattest, most compact systems known.',
    lifeCycle:
      'Low density suggests a thick envelope of light gas over a small core. That envelope is slowly being stripped by stellar radiation.',
  },
  {
    slug: 'kepler-22-b',
    plName: 'Kepler-22 b',
    constellation: 'Cyg',
    planetType: 'desert',
    planetColor: '#5cb85c',
    planetColor2: '#3d8b3d',
    hasKnownImage: true,
    description:
      'Kepler-22 b was the first Kepler planet found in the habitable zone of a Sun-like star, where liquid water could survive on a surface or in an ocean.',
    lifeCycle:
      'It takes about 290 days to circle its slightly cooler star. Its true nature — ocean world or thick-atmosphere mini-Neptune — is still unknown.',
  },
  {
    slug: 'kepler-186-f',
    plName: 'Kepler-186 f',
    constellation: 'Cyg',
    planetType: 'rocky',
    planetColor: '#7d6b5d',
    planetColor2: '#5a4d42',
    hasKnownImage: true,
    description:
      'Kepler-186 f was the first Earth-sized planet discovered in the habitable zone of another star. Its host is a small, cool red dwarf.',
    lifeCycle:
      'It receives roughly a third of the light Earth gets, so any surface water would need a substantial greenhouse atmosphere. Red dwarfs burn slowly, giving it billions of stable years.',
  },
  {
    slug: 'kepler-452-b',
    plName: 'Kepler-452 b',
    constellation: 'Cyg',
    planetType: 'rocky',
    planetColor: '#4a7c59',
    planetColor2: '#2d5a3d',
    hasKnownImage: true,
    description:
      'Kepler-452 b orbits a star almost identical to the Sun at almost Earth\u2019s distance, which earned it the nickname "Earth\u2019s older cousin".',
    lifeCycle:
      'Its star is around 6 billion years old and growing brighter. Any oceans on this world may already be evaporating — a preview of Earth\u2019s far future.',
  },
  {
    slug: 'toi-700-d',
    plName: 'TOI-700 d',
    constellation: 'Dor',
    planetType: 'rocky',
    planetColor: '#8c7a6b',
    planetColor2: '#6b5d52',
    hasKnownImage: false,
    description:
      'TOI-700 d was TESS\u2019s first Earth-sized habitable-zone discovery, and its quiet red dwarf host shows no violent flares.',
    lifeCycle:
      'Probably tidally locked, with one face in permanent daylight. Climate models allow both an ocean world and a dry, cloud-banded desert planet.',
  },
  {
    slug: 'wasp-12-b',
    plName: 'WASP-12 b',
    constellation: 'Aur',
    planetType: 'gas-stripped',
    planetColor: '#8b0000',
    planetColor2: '#4a0000',
    hasKnownImage: true,
    description:
      'WASP-12 b is being devoured by its star. Tidal forces have stretched it into an egg shape and gas streams away in a long tail.',
    lifeCycle:
      'It loses mass continuously and its orbit is shrinking measurably. Current estimates give it only a few million years before destruction.',
  },
  {
    slug: '55-cnc-e',
    plName: '55 Cnc e',
    constellation: 'Cnc',
    planetType: 'lava',
    planetColor: '#e8453c',
    planetColor2: '#a82a23',
    hasKnownImage: true,
    description:
      '55 Cancri e is a nearby super-Earth orbiting a naked-eye star. JWST observations point to a molten surface beneath a thick, possibly volcanic atmosphere.',
    lifeCycle:
      'Its dayside heat pattern shifts between observations, suggesting volcanic outgassing repeatedly rebuilds and loses its atmosphere.',
  },
  {
    slug: 'gj-1214-b',
    plName: 'GJ 1214 b',
    constellation: 'Oph',
    planetType: 'mini-ice',
    planetColor: '#3e7cb1',
    planetColor2: '#2a5680',
    hasKnownImage: false,
    description:
      'GJ 1214 b is the best-studied sub-Neptune. Its spectrum is muted by high hazes, and it may be a steamy world rich in water.',
    lifeCycle:
      'Circling a tiny red dwarf every 1.6 days, it is warm but not scorched. Its metal-rich, hazy atmosphere should survive for billions of years.',
  },
  {
    slug: 'hd-209458-b',
    plName: 'HD 209458 b',
    constellation: 'Peg',
    planetType: 'gas-stripped',
    planetColor: '#9b59b6',
    planetColor2: '#6c3483',
    hasKnownImage: true,
    description:
      'Nicknamed Osiris, HD 209458 b was the first planet ever seen transiting its star and the first with a detected atmosphere.',
    lifeCycle:
      'Hydrogen escapes from its upper atmosphere in a comet-like tail. Over billions of years it will keep shrinking toward its dense core.',
  },
  {
    slug: 'trappist-1-e',
    plName: 'TRAPPIST-1 e',
    constellation: 'Aqr',
    planetType: 'rocky',
    planetColor: '#6f8ba4',
    planetColor2: '#455c73',
    hasKnownImage: true,
    description:
      'TRAPPIST-1 e is one of seven Earth-sized planets around an ultracool dwarf 40 light-years away, and the one whose density is most Earth-like.',
    lifeCycle:
      'It sits mid-habitable zone in a resonant chain of siblings. Whether it kept an atmosphere against early stellar flaring is the key open question.',
  },
  {
    slug: 'hd-189733-b',
    plName: 'HD 189733 b',
    constellation: 'Vul',
    planetType: 'gas-blue',
    planetColor: '#3b6ea5',
    planetColor2: '#22456b',
    hasKnownImage: true,
    description:
      'HD 189733 b is the closest bright transiting hot Jupiter, famous for deep-blue scattered light and evidence of glass-like silicate rain.',
    lifeCycle:
      'Supersonic winds circle the globe and its atmosphere boils off in gusts whenever the active host star flares.',
  },
  {
    slug: 'k2-18-b',
    plName: 'K2-18 b',
    constellation: 'Leo',
    planetType: 'mini-ice',
    planetColor: '#5aa9a3',
    planetColor2: '#357a76',
    hasKnownImage: true,
    description:
      'K2-18 b is a habitable-zone sub-Neptune where JWST detected methane and carbon dioxide — a leading candidate for a deep-ocean "hycean" world.',
    lifeCycle:
      'A hydrogen-rich envelope may cap a global ocean. Whether that envelope survives or escapes decides if the planet stays temperate.',
  },
  {
    slug: 'lhs-1140-b',
    plName: 'LHS 1140 b',
    constellation: 'Cet',
    planetType: 'rocky',
    planetColor: '#7f8fa6',
    planetColor2: '#525f73',
    hasKnownImage: false,
    description:
      'LHS 1140 b is a dense super-Earth in the habitable zone of a calm red dwarf, one of the best rocky targets for atmospheric follow-up.',
    lifeCycle:
      'Its high density suggests a large iron core, and early JWST hints point to a nitrogen atmosphere with a possible ice-covered ocean.',
  },
  {
    slug: 'wasp-121-b',
    plName: 'WASP-121 b',
    constellation: 'Pup',
    planetType: 'gas-stripped',
    planetColor: '#ff8c42',
    planetColor2: '#a83a10',
    hasKnownImage: true,
    description:
      'WASP-121 b is an ultra-hot Jupiter with a glowing upper atmosphere where metals like iron and magnesium have been detected escaping.',
    lifeCycle:
      'Almost touching its star, it is distorted by tides and permanently losing gas. Its nightside may rain liquid gems.',
  },
  {
    slug: 'kelt-9-b',
    plName: 'KELT-9 b',
    constellation: 'Cyg',
    planetType: 'gas-stripped',
    planetColor: '#ffd166',
    planetColor2: '#e05c1c',
    hasKnownImage: true,
    description:
      'KELT-9 b is the hottest known giant planet — its dayside is hotter than many stars, hot enough to tear molecules apart.',
    lifeCycle:
      'Ultraviolet light from its blue A-type star evaporates the planet at an enormous rate, trailing gas behind it in orbit.',
  },
];

export const LORE_BY_SLUG = new Map(PLANET_LORE.map((l) => [l.slug, l]));
