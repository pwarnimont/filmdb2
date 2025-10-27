import {createContext} from 'react';
import type {PaletteMode} from '@mui/material';

export interface ThemeModeContextValue {
  mode: PaletteMode;
  toggle: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  toggle: () => {}
});

export default ThemeModeContext;
