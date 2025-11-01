import {alpha, type Theme} from '@mui/material/styles';

const FILTER_COLORS: Record<string, string> = {
  '00': '#c5e56b',
  '0': '#f4ec70',
  '0.5': '#f3de55',
  '1': '#f0c645',
  '1.5': '#f5a54a',
  '2': '#f48fb1',
  '2.5': '#ef6aa8',
  '3': '#d966d4',
  '3.5': '#c052ce',
  '4': '#ab47bc',
  '4.5': '#8e24aa',
  '5': '#6a1b9a',
  default: '#9e9e9e'
};

function normalizeFilterValue(rawFilter: string | undefined | null): string {
  if (!rawFilter) {
    return 'default';
  }

  const trimmed = rawFilter.trim();
  if (!trimmed) {
    return 'default';
  }

  if (trimmed === '00') {
    return '00';
  }

  const normalizedNumber = trimmed.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  if (normalizedNumber) {
    const parsed = Number.parseFloat(normalizedNumber[1]);
    if (!Number.isNaN(parsed)) {
      const rounded = Math.round(parsed * 2) / 2;
      return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
    }
  }

  const directMatch = trimmed.toLowerCase();
  if (FILTER_COLORS[directMatch]) {
    return directMatch;
  }

  return 'default';
}

export function getSplitGradeChipStyles(filter: string, theme: Theme) {
  const key = normalizeFilterValue(filter);
  const baseColor = FILTER_COLORS[key] ?? FILTER_COLORS.default;
  const contrastText = theme.palette.getContrastText(baseColor);
  const backgroundAlpha = theme.palette.mode === 'dark' ? 0.6 : 0.2;
  const borderAlpha = theme.palette.mode === 'dark' ? 0.8 : 0.5;

  return {
    backgroundColor: alpha(baseColor, backgroundAlpha),
    borderColor: alpha(baseColor, borderAlpha),
    color: contrastText,
    fontWeight: 600
  };
}
