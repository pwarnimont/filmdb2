import {Box, Typography} from '@mui/material';

import type {FilmBrand} from '../utils/filmBrand';

interface FilmBrandLogoProps {
  brand: FilmBrand;
  size?: number;
  showLabel?: boolean;
}

type BrandVisual = {
  background: string;
  foreground: string;
  label: string;
};

const BRAND_VISUALS: Record<FilmBrand, BrandVisual> = {
  Kodak: {
    background: '#FFCE00',
    foreground: '#D10A1E',
    label: 'Kodak'
  },
  Ilford: {
    background: '#000000',
    foreground: '#FFFFFF',
    label: 'Ilford'
  },
  Fujifilm: {
    background: '#00A05A',
    foreground: '#ffffff',
    label: 'Fujifilm'
  },
  Agfa: {
    background: 'linear-gradient(135deg, #E84639 0%, #B90F0A 100%)',
    foreground: '#ffffff',
    label: 'Agfa'
  },
  AgfaGevaert: {
    background: '#B9140D',
    foreground: '#FFFFFF',
    label: 'Agfa-Gevaert'
  },
  AgfaPhoto: {
    background: 'linear-gradient(90deg, #D90429 0%, #9D0208 100%)',
    foreground: '#FFFFFF',
    label: 'AgfaPhoto'
  },
  ADOX: {
    background: '#B71C1C',
    foreground: '#FFFFFF',
    label: 'ADOX'
  },
  Foma: {
    background: '#003D63',
    foreground: '#F6F9FC',
    label: 'Foma'
  },
  Cinestill: {
    background: '#c62828',
    foreground: '#ffffff',
    label: 'CineStill'
  },
  Ferrania: {
    background: '#0052A5',
    foreground: '#FFFFFF',
    label: 'Ferrania'
  },
  FilmWashi: {
    background: '#1C1C1C',
    foreground: '#F5F5F5',
    label: 'Film Washi'
  },
  Holga: {
    background: '#009688',
    foreground: '#FFFFFF',
    label: 'Holga'
  },
  Kentmere: {
    background: '#0F5DA2',
    foreground: '#FFFFFF',
    label: 'Kentmere'
  },
  Lomography: {
    background: '#C2185B',
    foreground: '#FFFFFF',
    label: 'Lomography'
  },
  Polaroid: {
    background: 'linear-gradient(90deg, #FF8C00 0%, #FFD700 40%, #00A1FF 80%)',
    foreground: '#1A1A1A',
    label: 'Polaroid'
  },
  Rollei: {
    background: '#646369',
    foreground: '#ffffff',
    label: 'Rollei'
  },
  Other: {
    background: '#607d8b',
    foreground: '#ffffff',
    label: 'Film'
  }
};

export function FilmBrandLogo({brand, size = 36, showLabel = false}: FilmBrandLogoProps) {
  const visual = BRAND_VISUALS[brand];
  const paddingX = Math.max(size * 0.3, 8);
  const paddingY = Math.max(size * 0.15, 4);
  const fontSize = Math.max(size * 0.32, 12);
  const minWidth = Math.max(size * 1.6, fontSize * visual.label.length * 0.7 + paddingX * 2);

  return (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
      <Box
        sx={{
          minWidth: `${minWidth}px`,
          height: size,
          borderRadius: 0,
          background: visual.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #0f1115',
          px: `${paddingX}px`,
          py: `${paddingY}px`,
          boxSizing: 'border-box'
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            fontSize: `${fontSize}px`,
            letterSpacing: 0.5,
            color: visual.foreground,
            textTransform: 'uppercase',
            lineHeight: 1,
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          {visual.label}
        </Typography>
      </Box>
      {showLabel && (
        <Typography variant="body2" fontWeight={600}>
          {visual.label}
        </Typography>
      )}
    </Box>
  );
}
