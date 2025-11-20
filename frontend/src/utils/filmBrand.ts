export type FilmBrand =
  | 'Kodak'
  | 'Ilford'
  | 'Fujifilm'
  | 'Agfa'
  | 'AgfaGevaert'
  | 'AgfaPhoto'
  | 'ADOX'
  | 'Foma'
  | 'Cinestill'
  | 'Ferrania'
  | 'FilmWashi'
  | 'Holga'
  | 'Kentmere'
  | 'Lomography'
  | 'Polaroid'
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
    brand: 'AgfaGevaert',
    patterns: [/agfa[-\s]?gevaert/i, /avi ?phot/i]
  },
  {
    brand: 'AgfaPhoto',
    patterns: [/agfa ?photo/i, /precisa/i]
  },
  {
    brand: 'ADOX',
    patterns: [/adox/i, /cms/i, /silvermax/i, /hr-50/i]
  },
  {
    brand: 'Foma',
    patterns: [/foma/i, /fomapan/i, /retropan/i]
  },
  {
    brand: 'Cinestill',
    patterns: [/cinestill/i, /800t/i, /50d/i]
  },
  {
    brand: 'Ferrania',
    patterns: [/ferrania/i, /p30/i]
  },
  {
    brand: 'FilmWashi',
    patterns: [/washi/i]
  },
  {
    brand: 'Holga',
    patterns: [/holga/i]
  },
  {
    brand: 'Kentmere',
    patterns: [/kentmere/i]
  },
  {
    brand: 'Lomography',
    patterns: [/lomography/i, /lomochrome/i, /lomo/i]
  },
  {
    brand: 'Polaroid',
    patterns: [/polaroid/i, /sx-?70/i, /i[-\s]?type/i]
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
