export type FilmBrand =
  | 'Kodak'
  | 'Ilford'
  | 'Fujifilm'
  | 'Agfa'
  | 'Cinestill'
  | 'Rollei'
  | 'Other';

interface BrandRule {
  brand: FilmBrand;
  patterns: Array<RegExp>;
}

const brandRules: BrandRule[] = [
  {
    brand: 'Kodak',
    patterns: [
      /kodak/i,
      /portra/i,
      /ektar/i,
      /t[-\s]?max/i,
      /tri[-\s]?x/i,
      /gold/i,
      /colorplus/i,
      /pro ?image/i,
      /vision3/i
    ]
  },
  {
    brand: 'Ilford',
    patterns: [/ilford/i, /hp5/i, /fp4/i, /delta/i, /pan f/i, /sfx/i]
  },
  {
    brand: 'Fujifilm',
    patterns: [/fujifilm/i, /fuji/i, /velvia/i, /provia/i, /acros/i, /superia/i, /pro 400h/i]
  },
  {
    brand: 'Agfa',
    patterns: [/agfa/i, /vista/i, /apx/i]
  },
  {
    brand: 'Cinestill',
    patterns: [/cinestill/i, /800t/i, /50d/i]
  },
  {
    brand: 'Rollei',
    patterns: [/rollei/i, /retro/i, /ortho/i, /infrared/i, /superpan/i]
  }
];

export function detectFilmBrand(name: string): FilmBrand {
  for (const rule of brandRules) {
    if (rule.patterns.some((pattern) => pattern.test(name))) {
      return rule.brand;
    }
  }
  return 'Other';
}
