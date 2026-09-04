import charts from '@/data/constellationCharts.json';

export interface ConstellationChart {
  /** Polyline segments of the official IAU stick figure: [raDeg(-180..180), decDeg] */
  lines: number[][][];
  /** Bright stars in the field: [raDeg, decDeg, visualMagnitude] */
  stars: number[][];
}

export interface Constellation {
  abbr: string;
  name: string;
  meaning: string;
  brightestStar: string;
  hemisphere: 'Northern' | 'Southern' | 'Equatorial';
  bestSeen: string;
  mythology: string;
  chart: ConstellationChart;
}

const CHARTS = charts as Record<string, ConstellationChart>;

const META: Omit<Constellation, 'chart'>[] = [
  {
    abbr: 'Cyg',
    name: 'Cygnus',
    meaning: 'The Swan',
    brightestStar: 'Deneb (α Cygni)',
    hemisphere: 'Northern',
    bestSeen: 'September evenings',
    mythology:
      'Zeus took the form of a swan to approach Leda, queen of Sparta; from that union came Helen of Troy and the twins Castor and Pollux. Greek storytellers also saw the swan as Orpheus, placed beside his lyre after his death so that music would never leave the sky. The Kepler space telescope stared into this patch of the Milky Way for four years, which is why so many known worlds carry the name Kepler.',
  },
  {
    abbr: 'Lyr',
    name: 'Lyra',
    meaning: 'The Lyre',
    brightestStar: 'Vega (α Lyrae)',
    hemisphere: 'Northern',
    bestSeen: 'August evenings',
    mythology:
      'The lyre of Orpheus, whose playing calmed wild beasts and persuaded the lord of the underworld to release his wife Eurydice — until he looked back and lost her. After his death the Muses set the instrument among the stars, marked by brilliant Vega.',
  },
  {
    abbr: 'Dra',
    name: 'Draco',
    meaning: 'The Dragon',
    brightestStar: 'Eltanin (γ Draconis)',
    hemisphere: 'Northern',
    bestSeen: 'July evenings',
    mythology:
      'Ladon, the hundred-headed dragon that guarded the golden apples of the Hesperides, slain by Heracles during his eleventh labour and raised into the sky by the goddess Hera. Its long body coils forever around the north celestial pole and never sets for northern observers.',
  },
  {
    abbr: 'Aqr',
    name: 'Aquarius',
    meaning: 'The Water Bearer',
    brightestStar: 'Sadalsuud (β Aquarii)',
    hemisphere: 'Southern',
    bestSeen: 'October evenings',
    mythology:
      'Ganymede, the most beautiful of mortals, carried off by Zeus\u2019s eagle to pour nectar for the gods on Olympus. Babylonian sky-watchers saw the same figure as the god Ea spilling an endless stream of water, a sign of the rainy season.',
  },
  {
    abbr: 'Aur',
    name: 'Auriga',
    meaning: 'The Charioteer',
    brightestStar: 'Capella (α Aurigae)',
    hemisphere: 'Northern',
    bestSeen: 'January evenings',
    mythology:
      'Erichthonius of Athens, who invented the four-horse chariot and was honoured by Zeus with a place in the heavens. The bright star Capella is the she-goat Amalthea, who suckled the infant Zeus in a Cretan cave.',
  },
  {
    abbr: 'Cnc',
    name: 'Cancer',
    meaning: 'The Crab',
    brightestStar: 'Tarf (β Cancri)',
    hemisphere: 'Northern',
    bestSeen: 'March evenings',
    mythology:
      'The giant crab sent by Hera to distract Heracles while he fought the many-headed Hydra. Heracles crushed it underfoot, and Hera set the loyal creature among the stars — faint, but keeper of the beautiful Beehive star cluster.',
  },
  {
    abbr: 'Oph',
    name: 'Ophiuchus',
    meaning: 'The Serpent Bearer',
    brightestStar: 'Rasalhague (α Ophiuchi)',
    hemisphere: 'Equatorial',
    bestSeen: 'July evenings',
    mythology:
      'Asclepius, the greatest of healers, who learned from a serpent how to raise the dead. Zeus struck him down with a thunderbolt to protect the order of mortality, then placed him in the sky still holding his snake — the emblem of medicine to this day.',
  },
  {
    abbr: 'Peg',
    name: 'Pegasus',
    meaning: 'The Winged Horse',
    brightestStar: 'Enif (ε Pegasi)',
    hemisphere: 'Northern',
    bestSeen: 'October evenings',
    mythology:
      'The winged horse born from the blood of Medusa, tamed by Bellerophon with a golden bridle. When the rider tried to fly to Olympus he was thrown down, but Pegasus flew on and was kept by Zeus to carry his thunderbolts.',
  },
  {
    abbr: 'Leo',
    name: 'Leo',
    meaning: 'The Lion',
    brightestStar: 'Regulus (α Leonis)',
    hemisphere: 'Northern',
    bestSeen: 'April evenings',
    mythology:
      'The Nemean lion, whose hide no weapon could pierce. Heracles strangled it in its cave for his first labour and wore its skin ever after. Regulus, the "little king", sits almost exactly on the path of the Sun.',
  },
  {
    abbr: 'Cet',
    name: 'Cetus',
    meaning: 'The Sea Monster',
    brightestStar: 'Diphda (β Ceti)',
    hemisphere: 'Equatorial',
    bestSeen: 'November evenings',
    mythology:
      'The sea beast sent by Poseidon to devour Andromeda, turned to stone when Perseus revealed the head of Medusa. Within its outline lies Mira, the first star ever recognised as variable, fading and brightening over eleven months.',
  },
  {
    abbr: 'Pup',
    name: 'Puppis',
    meaning: 'The Stern',
    brightestStar: 'Naos (ζ Puppis)',
    hemisphere: 'Southern',
    bestSeen: 'February evenings',
    mythology:
      'The stern of Argo Navis, the ship that carried Jason and the Argonauts to the Golden Fleece. Astronomers later broke the enormous vessel into three parts — keel, sails and stern — and Puppis holds its richest Milky Way star fields.',
  },
  {
    abbr: 'Vul',
    name: 'Vulpecula',
    meaning: 'The Little Fox',
    brightestStar: 'Anser (α Vulpeculae)',
    hemisphere: 'Northern',
    bestSeen: 'September evenings',
    mythology:
      'A modern figure invented by Johannes Hevelius in 1687 as a fox carrying a goose — companions to the neighbouring hunting constellations. It has no ancient myth, but it holds the Dumbbell Nebula and the site where the first pulsar was found.',
  },
  {
    abbr: 'Dor',
    name: 'Dorado',
    meaning: 'The Dolphinfish',
    brightestStar: 'α Doradus',
    hemisphere: 'Southern',
    bestSeen: 'January evenings (southern skies)',
    mythology:
      'Charted by Dutch navigators in the 1590s and named for the swift golden dolphinfish that chased flying fish alongside their ships. It has no classical legend, but it contains the Large Magellanic Cloud, our nearest large companion galaxy.',
  },
];

export const CONSTELLATIONS: Constellation[] = META.filter((m) => CHARTS[m.abbr]).map((m) => ({
  ...m,
  chart: CHARTS[m.abbr]!,
}));

export const CONSTELLATION_BY_ABBR = new Map(CONSTELLATIONS.map((c) => [c.abbr, c]));
