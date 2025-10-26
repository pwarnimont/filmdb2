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
          backgroundColor: visual.background,
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
