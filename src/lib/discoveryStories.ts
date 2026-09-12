/**
 * Discovery stories: a per-planet chronology of the observations and refereed
 * papers that established each world. Dates are publication / announcement
 * dates from the peer-reviewed literature; every entry cites its source so the
 * chronology can be checked against the record. Nothing here is simulated.
 */

export interface DiscoveryEvent {
  /** Human-readable date, as precise as the published record allows. */
  date: string;
  /** Sort key, ISO-ish. */
  sort: string;
  title: string;
  body: string;
  paper?: {
    citation: string;
    /** DOI or arXiv link to the refereed paper. */
    url: string;
  };
}

export interface DiscoveryStory {
  /** Matches the catalog slug in planetLore.ts. */
  slug: string;
  name: string;
  summary: string;
  events: DiscoveryEvent[];
}

export const DISCOVERY_STORIES: DiscoveryStory[] = [
  {
    slug: 'hd-209458-b',
    name: 'HD 209458 b',
    summary:
      'The first planet ever seen crossing its star, and the template for every transit measurement that followed.',
    events: [
      {
        date: 'November 1999',
        sort: '1999-11',
        title: 'Two teams catch the first transit',
        body: 'Charbonneau, Brown, Latham and Mayor detected a 1.7% dip in the starlight of HD 209458, matching a radial-velocity planet already suspected in the data. An independent team led by Greg Henry reported the same event.',
        paper: {
          citation: 'Charbonneau, Brown, Latham & Mayor 1999, ApJ 529, L45',
          url: 'https://doi.org/10.1086/312457',
        },
      },
      {
        date: 'January 2000',
        sort: '2000-01',
        title: 'Independent photometric confirmation',
        body: 'Henry, Marcy, Butler & Vogt published their own transit detection, making HD 209458 b the first exoplanet with both a mass and a true radius.',
        paper: {
          citation: 'Henry, Marcy, Butler & Vogt 2000, ApJ 529, L41',
          url: 'https://doi.org/10.1086/312458',
        },
      },
      {
        date: 'November 2002',
        sort: '2002-11',
        title: 'First atmosphere detected on any exoplanet',
        body: 'Hubble measured extra absorption in the sodium D lines during transit — starlight filtering through an alien atmosphere.',
        paper: {
          citation: 'Charbonneau et al. 2002, ApJ 568, 377',
          url: 'https://doi.org/10.1086/338770',
        },
      },
      {
        date: 'March 2003',
        sort: '2003-03',
        title: 'An escaping hydrogen tail',
        body: 'Vidal-Madjar and colleagues found a vast, evaporating hydrogen envelope, showing that close-in giants lose mass to their stars.',
        paper: {
          citation: 'Vidal-Madjar et al. 2003, Nature 422, 143',
          url: 'https://doi.org/10.1038/nature01448',
        },
      },
    ],
  },
  {
    slug: 'hd-189733-b',
    name: 'HD 189733 b',
    summary:
      'A bright, nearby hot Jupiter that became the most-observed exoplanet atmosphere of the Hubble era.',
    events: [
      {
        date: 'October 2005',
        sort: '2005-10',
        title: 'Discovery by radial velocity and transit',
        body: 'Bouchy and collaborators found a transiting giant around a bright K dwarf just 65 light-years away — close enough for detailed spectroscopy.',
        paper: {
          citation: 'Bouchy et al. 2005, A&A 444, L15',
          url: 'https://doi.org/10.1051/0004-6361:200500201',
        },
      },
      {
        date: 'May 2007',
        sort: '2007-05',
        title: 'First map of heat around an exoplanet',
        body: 'Spitzer tracked the planet through half an orbit and produced a longitudinal temperature map, revealing fierce day-to-night winds.',
        paper: {
          citation: 'Knutson et al. 2007, Nature 447, 183',
          url: 'https://doi.org/10.1038/nature05782',
        },
      },
      {
        date: 'July 2013',
        sort: '2013-07',
        title: 'Measured to be deep blue',
        body: 'Hubble measured the planet\u2019s reflected-light colour, attributed to Rayleigh scattering by high silicate hazes.',
        paper: {
          citation: 'Evans et al. 2013, ApJ 772, L16',
          url: 'https://doi.org/10.1088/2041-8205/772/2/L16',
        },
      },
    ],
  },
  {
    slug: 'kepler-10-b',
    name: 'Kepler-10 b',
    summary: 'Kepler\u2019s first unambiguously rocky planet, and proof the mission could find Earth-sized worlds.',
    events: [
      {
        date: '10 January 2011',
        sort: '2011-01',
        title: 'Announced at the AAS meeting',
        body: 'Eight months of Kepler photometry plus asteroseismology of the host star pinned the radius to 1.4 Earth radii and the density to rock.',
        paper: {
          citation: 'Batalha et al. 2011, ApJ 729, 27',
          url: 'https://doi.org/10.1088/0004-637X/729/1/27',
        },
      },
      {
        date: 'May 2011',
        sort: '2011-05',
        title: 'A second planet in the system',
        body: 'Kepler-10 c was validated statistically using the BLENDER technique, an approach that later confirmed hundreds of candidates.',
        paper: {
          citation: 'Fressin et al. 2011, ApJS 197, 5',
          url: 'https://doi.org/10.1088/0067-0049/197/1/5',
        },
      },
    ],
  },
  {
    slug: 'kepler-22-b',
    name: 'Kepler-22 b',
    summary: 'The first Kepler planet found in the habitable zone of a Sun-like star.',
    events: [
      {
        date: '5 December 2011',
        sort: '2011-12',
        title: 'Habitable-zone confirmation',
        body: 'Three transits over three years — the minimum Kepler required — established a 290-day orbit around a star only slightly cooler than the Sun.',
        paper: {
          citation: 'Borucki et al. 2012, ApJ 745, 120',
          url: 'https://doi.org/10.1088/0004-637X/745/2/120',
        },
      },
    ],
  },
  {
    slug: 'kepler-186-f',
    name: 'Kepler-186 f',
    summary: 'The first Earth-sized planet found in another star\u2019s habitable zone.',
    events: [
      {
        date: '18 April 2014',
        sort: '2014-04',
        title: 'An Earth-sized world in the habitable zone',
        body: 'Quintana and colleagues validated the outermost of five planets around a red dwarf, at 1.11 Earth radii and receiving about a third of Earth\u2019s sunlight.',
        paper: {
          citation: 'Quintana et al. 2014, Science 344, 277',
          url: 'https://doi.org/10.1126/science.1249403',
        },
      },
    ],
  },
  {
    slug: 'kepler-452-b',
    name: 'Kepler-452 b',
    summary: 'Nicknamed Earth\u2019s older cousin: a near-Earth-sized planet at a near-Earth orbital distance from a Sun-like star.',
    events: [
      {
        date: '23 July 2015',
        sort: '2015-07',
        title: 'Validation announced with the 4,175-candidate Kepler catalog',
        body: 'A 385-day orbit around a G2 star roughly 6 billion years old, with statistical validation rather than a mass measurement.',
        paper: {
          citation: 'Jenkins et al. 2015, AJ 150, 56',
          url: 'https://doi.org/10.1088/0004-6256/150/2/56',
        },
      },
    ],
  },
  {
    slug: 'kepler-11-b',
    name: 'Kepler-11 b',
    summary: 'Innermost planet of the flattest, most tightly packed multi-planet system Kepler found.',
    events: [
      {
        date: '3 February 2011',
        sort: '2011-02',
        title: 'Six transiting planets at once',
        body: 'Lissauer and colleagues used transit-timing variations to weigh the planets against each other, revealing low densities and thick gas envelopes.',
        paper: {
          citation: 'Lissauer et al. 2011, Nature 470, 53',
          url: 'https://doi.org/10.1038/nature09760',
        },
      },
    ],
  },
  {
    slug: 'kepler-7-b',
    name: 'Kepler-7 b',
    summary: 'A hot Jupiter so low in density it would float on water — and the first exoplanet with a cloud map.',
    events: [
      {
        date: 'April 2010',
        sort: '2010-04',
        title: 'Among Kepler\u2019s first five planets',
        body: 'Latham and collaborators reported a bloated giant with a density near 0.17 g/cm³, from Kepler\u2019s earliest photometry.',
        paper: {
          citation: 'Latham et al. 2010, ApJ 713, L140',
          url: 'https://doi.org/10.1088/2041-8205/713/2/L140',
        },
      },
      {
        date: 'October 2013',
        sort: '2013-10',
        title: 'Clouds mapped across the dayside',
        body: 'Combining Kepler optical phase curves with Spitzer infrared data localised bright reflective clouds to the western hemisphere.',
        paper: {
          citation: 'Demory et al. 2013, ApJ 776, L25',
          url: 'https://doi.org/10.1088/2041-8205/776/2/L25',
        },
      },
    ],
  },
  {
    slug: 'kepler-5-b',
    name: 'Kepler-5 b',
    summary: 'One of the first planets Kepler announced, confirming the spacecraft\u2019s photometric precision.',
    events: [
      {
        date: 'April 2010',
        sort: '2010-04b',
        title: 'Discovery in Kepler\u2019s first light data',
        body: 'A 2.1-Jupiter-mass giant on a 3.5-day orbit around a hot, evolved F star, confirmed with Keck radial velocities.',
        paper: {
          citation: 'Koch et al. 2010, ApJ 713, L131',
          url: 'https://doi.org/10.1088/2041-8205/713/2/L131',
        },
      },
    ],
  },
  {
    slug: 'tres-2-b',
    name: 'TrES-2 b',
    summary: 'A ground-discovered hot Jupiter that later turned out to be one of the darkest planets known.',
    events: [
      {
        date: 'September 2006',
        sort: '2006-09',
        title: 'Found by the Trans-Atlantic Exoplanet Survey',
        body: 'O\u2019Donovan and colleagues discovered the planet with 10-cm survey telescopes, inside what would become Kepler\u2019s field of view.',
        paper: {
          citation: 'O\u2019Donovan et al. 2006, ApJ 651, L61',
          url: 'https://doi.org/10.1086/509123',
        },
      },
      {
        date: 'August 2011',
        sort: '2011-08',
        title: 'Darker than coal',
        body: 'Kipping & Spiegel used Kepler phase-curve data to measure a geometric albedo below 1% — the least reflective planet then known.',
        paper: {
          citation: 'Kipping & Spiegel 2011, MNRAS 417, L88',
          url: 'https://doi.org/10.1111/j.1745-3933.2011.01127.x',
        },
      },
    ],
  },
  {
    slug: 'hat-p-7-b',
    name: 'HAT-P-7 b',
    summary: 'The planet on which weather was first detected outside the solar system.',
    events: [
      {
        date: 'August 2008',
        sort: '2008-08',
        title: 'Discovered by the HATNet survey',
        body: 'Pál and colleagues found a very hot Jupiter transiting a bright F star, later shown to be on a retrograde orbit.',
        paper: {
          citation: 'Pál et al. 2008, ApJ 680, 1450',
          url: 'https://doi.org/10.1086/588010',
        },
      },
      {
        date: 'December 2016',
        sort: '2016-12',
        title: 'Changing cloud cover measured',
        body: 'Four years of Kepler phase curves showed the brightness peak shifting, interpreted as variable clouds blown by equatorial winds.',
        paper: {
          citation: 'Armstrong et al. 2016, Nature Astronomy 1, 0004',
          url: 'https://doi.org/10.1038/s41550-016-0004',
        },
      },
    ],
  },
  {
    slug: 'wasp-47-b',
    name: 'WASP-47 b',
    summary: 'The hot Jupiter that broke the rule that hot Jupiters have no close neighbours.',
    events: [
      {
        date: 'December 2012',
        sort: '2012-12',
        title: 'Discovered by WASP-South',
        body: 'Hellier and colleagues reported an apparently ordinary hot Jupiter on a 4.16-day orbit.',
        paper: {
          citation: 'Hellier et al. 2012, MNRAS 426, 739',
          url: 'https://doi.org/10.1111/j.1365-2966.2012.21780.x',
        },
      },
      {
        date: 'October 2015',
        sort: '2015-10',
        title: 'Two companion planets found in K2 data',
        body: 'Becker and collaborators found a super-Earth and a Neptune bracketing the giant, forcing a rethink of hot-Jupiter migration.',
        paper: {
          citation: 'Becker et al. 2015, ApJ 812, L18',
          url: 'https://doi.org/10.1088/2041-8205/812/2/L18',
        },
      },
    ],
  },
  {
    slug: 'wasp-12-b',
    name: 'WASP-12 b',
    summary: 'A planet caught in the act of spiralling into its star.',
    events: [
      {
        date: 'April 2009',
        sort: '2009-04',
        title: 'Discovery of an extremely irradiated giant',
        body: 'Hebb and colleagues reported a 1.1-day orbit and an equilibrium temperature above 2,500 K.',
        paper: {
          citation: 'Hebb et al. 2009, ApJ 693, 1920',
          url: 'https://doi.org/10.1088/0004-637X/693/2/1920',
        },
      },
      {
        date: 'December 2020',
        sort: '2020-12',
        title: 'Orbital decay confirmed',
        body: 'A decade of transit timings showed the orbital period shrinking by about 29 milliseconds per year — the first clear case of tidal orbital decay.',
        paper: {
          citation: 'Yee et al. 2020, ApJ 888, L5',
          url: 'https://doi.org/10.3847/2041-8213/ab5c16',
        },
      },
    ],
  },
  {
    slug: '55-cnc-e',
    name: '55 Cnc e',
    summary: 'A super-Earth around a naked-eye star, found by radial velocity years before it was seen to transit.',
    events: [
      {
        date: 'September 2004',
        sort: '2004-09',
        title: 'Detected in radial velocities',
        body: 'McArthur and colleagues extracted a short-period signal from the crowded 55 Cancri planetary system.',
        paper: {
          citation: 'McArthur et al. 2004, ApJ 614, L81',
          url: 'https://doi.org/10.1086/425561',
        },
      },
      {
        date: 'November 2010',
        sort: '2010-11',
        title: 'The true period corrected to 0.74 days',
        body: 'Dawson & Fabrycky showed the original 2.8-day period was an alias, which made a transit search possible.',
        paper: {
          citation: 'Dawson & Fabrycky 2010, ApJ 722, 937',
          url: 'https://doi.org/10.1088/0004-637X/722/1/937',
        },
      },
      {
        date: 'May 2011',
        sort: '2011-05b',
        title: 'Transit detected with MOST',
        body: 'Winn and collaborators caught the transit, turning the planet into a rare super-Earth with both mass and radius.',
        paper: {
          citation: 'Winn et al. 2011, ApJ 737, L18',
          url: 'https://doi.org/10.1088/2041-8205/737/1/L18',
        },
      },
      {
        date: 'May 2024',
        sort: '2024-05',
        title: 'JWST evidence for a volatile atmosphere',
        body: 'Hu and colleagues reported carbon-bearing gases over a magma ocean, suggesting an atmosphere resupplied by volcanism.',
        paper: {
          citation: 'Hu et al. 2024, Nature 630, 609',
          url: 'https://doi.org/10.1038/s41586-024-07432-x',
        },
      },
    ],
  },
  {
    slug: 'gj-1214-b',
    name: 'GJ 1214 b',
    summary: 'The first well-characterised sub-Neptune, and a decade-long puzzle about hazy atmospheres.',
    events: [
      {
        date: 'December 2009',
        sort: '2009-12',
        title: 'Discovery by the MEarth survey',
        body: 'Charbonneau and colleagues found a transiting super-Earth around a nearby M dwarf with 40-cm robotic telescopes.',
        paper: {
          citation: 'Charbonneau et al. 2009, Nature 462, 891',
          url: 'https://doi.org/10.1038/nature08679',
        },
      },
      {
        date: 'January 2014',
        sort: '2014-01',
        title: 'A featureless, cloudy spectrum',
        body: 'Kreidberg and colleagues used Hubble to rule out cloud-free atmospheres, showing high-altitude clouds mute the spectral features.',
        paper: {
          citation: 'Kreidberg et al. 2014, Nature 505, 69',
          url: 'https://doi.org/10.1038/nature12888',
        },
      },
    ],
  },
  {
    slug: 'trappist-1-e',
    name: 'TRAPPIST-1 e',
    summary: 'One of seven Earth-sized planets around an ultracool dwarf, and the most Earth-like in density.',
    events: [
      {
        date: 'May 2016',
        sort: '2016-05',
        title: 'First three planets announced',
        body: 'Gillon and colleagues reported temperate Earth-sized planets transiting a very cool, very small star 40 light-years away.',
        paper: {
          citation: 'Gillon et al. 2016, Nature 533, 221',
          url: 'https://doi.org/10.1038/nature17448',
        },
      },
      {
        date: '22 February 2017',
        sort: '2017-02',
        title: 'Seven planets, three in the habitable zone',
        body: 'Spitzer monitoring resolved the full resonant chain, including TRAPPIST-1 e in the middle of the habitable zone.',
        paper: {
          citation: 'Gillon et al. 2017, Nature 542, 456',
          url: 'https://doi.org/10.1038/nature21360',
        },
      },
      {
        date: 'February 2018',
        sort: '2018-02',
        title: 'Masses and densities refined',
        body: 'Transit-timing analysis gave TRAPPIST-1 e a density consistent with a rocky, largely iron-and-silicate composition.',
        paper: {
          citation: 'Grimm et al. 2018, A&A 613, A68',
          url: 'https://doi.org/10.1051/0004-6361/201732233',
        },
      },
    ],
  },
  {
    slug: 'k2-18-b',
    name: 'K2-18 b',
    summary: 'A habitable-zone sub-Neptune at the centre of the debate over ocean-bearing "hycean" worlds.',
    events: [
      {
        date: 'October 2015',
        sort: '2015-10b',
        title: 'Discovered in K2 data',
        body: 'Montet and colleagues validated a transiting planet in the habitable zone of a nearby M dwarf.',
        paper: {
          citation: 'Montet et al. 2015, ApJ 809, 25',
          url: 'https://doi.org/10.1088/0004-637X/809/1/25',
        },
      },
      {
        date: 'September 2019',
        sort: '2019-09',
        title: 'Water vapour reported from Hubble',
        body: 'Two independent teams found evidence of water absorption in the planet\u2019s hydrogen-rich envelope.',
        paper: {
          citation: 'Benneke et al. 2019, ApJ 887, L14',
          url: 'https://doi.org/10.3847/2041-8213/ab59dc',
        },
      },
      {
        date: 'September 2023',
        sort: '2023-09',
        title: 'JWST detects methane and carbon dioxide',
        body: 'Madhusudhan and colleagues reported carbon-bearing molecules and a tentative, contested hint of dimethyl sulphide.',
        paper: {
          citation: 'Madhusudhan et al. 2023, ApJ 956, L13',
          url: 'https://doi.org/10.3847/2041-8213/acf577',
        },
      },
    ],
  },
  {
    slug: 'lhs-1140-b',
    name: 'LHS 1140 b',
    summary: 'A dense, temperate super-Earth around a quiet red dwarf — a prime target for atmosphere hunting.',
    events: [
      {
        date: '20 April 2017',
        sort: '2017-04',
        title: 'Discovery with MEarth and HARPS',
        body: 'Dittmann and colleagues reported a rocky planet in the habitable zone of a slowly rotating, magnetically calm M dwarf.',
        paper: {
          citation: 'Dittmann et al. 2017, Nature 544, 333',
          url: 'https://doi.org/10.1038/nature22055',
        },
      },
      {
        date: 'July 2024',
        sort: '2024-07',
        title: 'JWST hints at a secondary atmosphere',
        body: 'Early JWST transmission data were interpreted as tentative evidence for a nitrogen-rich atmosphere, pending more transits.',
        paper: {
          citation: 'Cadieux et al. 2024, ApJ 970, L2',
          url: 'https://doi.org/10.3847/2041-8213/ad5afa',
        },
      },
    ],
  },
  {
    slug: 'toi-700-d',
    name: 'TOI-700 d',
    summary: 'TESS\u2019s first Earth-sized habitable-zone planet.',
    events: [
      {
        date: '6 January 2020',
        sort: '2020-01',
        title: 'Announced at the AAS meeting',
        body: 'Gilbert and colleagues reported the planet after a stellar-parameter correction revised the host from a subgiant to a small M dwarf.',
        paper: {
          citation: 'Gilbert et al. 2020, AJ 160, 116',
          url: 'https://doi.org/10.3847/1538-3881/aba4b2',
        },
      },
      {
        date: 'August 2020',
        sort: '2020-08',
        title: 'Independent validation and climate modelling',
        body: 'Rodriguez and colleagues validated the system and modelled plausible ocean and desert climates.',
        paper: {
          citation: 'Rodriguez et al. 2020, AJ 160, 117',
          url: 'https://doi.org/10.3847/1538-3881/aba4b3',
        },
      },
    ],
  },
  {
    slug: 'wasp-121-b',
    name: 'WASP-121 b',
    summary: 'An ultra-hot Jupiter with a glowing stratosphere and metals streaming away into space.',
    events: [
      {
        date: 'December 2016',
        sort: '2016-12b',
        title: 'Discovered by WASP-South',
        body: 'Delrez and colleagues reported a bloated giant almost filling its Roche lobe on a 1.27-day orbit.',
        paper: {
          citation: 'Delrez et al. 2016, MNRAS 458, 4025',
          url: 'https://doi.org/10.1093/mnras/stw522',
        },
      },
      {
        date: 'August 2017',
        sort: '2017-08',
        title: 'First clear exoplanet stratosphere',
        body: 'Evans and colleagues detected water in emission with Hubble, requiring a temperature inversion in the upper atmosphere.',
        paper: {
          citation: 'Evans et al. 2017, Nature 548, 58',
          url: 'https://doi.org/10.1038/nature23266',
        },
      },
    ],
  },
  {
    slug: 'kelt-9-b',
    name: 'KELT-9 b',
    summary: 'The hottest giant planet known, orbiting a blue A-type star.',
    events: [
      {
        date: '5 June 2017',
        sort: '2017-06',
        title: 'Discovery of a 4,600 K dayside',
        body: 'Gaudi and colleagues reported a planet hotter than most K dwarfs, on a polar orbit around a rapidly rotating A0 star.',
        paper: {
          citation: 'Gaudi et al. 2017, Nature 546, 514',
          url: 'https://doi.org/10.1038/nature22392',
        },
      },
      {
        date: 'August 2018',
        sort: '2018-08',
        title: 'Iron and titanium found in the atmosphere',
        body: 'High-resolution spectroscopy detected neutral and ionised iron, showing molecules are dissociated into bare atoms.',
        paper: {
          citation: 'Hoeijmakers et al. 2018, Nature 560, 453',
          url: 'https://doi.org/10.1038/s41586-018-0401-y',
        },
      },
    ],
  },
];

export const STORY_BY_SLUG = new Map(DISCOVERY_STORIES.map((s) => [s.slug, s]));
