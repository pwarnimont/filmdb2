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
    background: '#E84639',
    foreground: '#ffffff',
    label: 'Agfa'
  },
  Cinestill: {
    background: '#c62828',
    foreground: '#ffffff',
    label: 'CineStill'
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

  return (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 0,
          backgroundColor: visual.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #0f1115'
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            fontSize: size <= 36 ? '0.72rem' : '0.82rem',
            letterSpacing: 0.5,
            color: visual.foreground,
            textTransform: 'uppercase'
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
