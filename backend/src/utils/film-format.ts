import {FilmFormat} from '@prisma/client';

export const filmFormatToApi: Record<FilmFormat, string> = {
  [FilmFormat.format35mm]: '35mm',
  [FilmFormat.format6x6]: '6x6',
  [FilmFormat.format6x4_5]: '6x4_5',
  [FilmFormat.format6x7]: '6x7',
  [FilmFormat.format6x9]: '6x9',
  [FilmFormat.other]: 'other'
};

const apiToFilmFormat = Object.fromEntries(
  Object.entries(filmFormatToApi).map(([key, value]) => [value, key as FilmFormat])
) as Record<string, FilmFormat>;

export type FilmFormatApi = (typeof filmFormatToApi)[FilmFormat];

export function parseFilmFormat(format: string): FilmFormat {
  const mapped = apiToFilmFormat[format];
  if (!mapped) {
    throw new Error('Invalid film format');
  }
  return mapped;
}
