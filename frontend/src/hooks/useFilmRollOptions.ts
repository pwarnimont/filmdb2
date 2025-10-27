import {useQuery} from '@tanstack/react-query';

import {listFilmRolls} from '../api/filmRolls';
import type {FilmRoll} from '../types/api';

interface FilmRollOption {
  id: string;
  label: string;
  filmId: string;
  exposures?: number;
  raw?: FilmRoll;
}

export function useFilmRollOptions() {
  return useQuery<FilmRollOption[]>({
    queryKey: ['film-rolls', 'options'],
    queryFn: async () => {
      const result = await listFilmRolls({page: 1, pageSize: 100});
      return result.items.map((roll) => ({
        id: roll.id,
        label: `${roll.filmName} (${roll.filmId})`,
        filmId: roll.filmId,
        exposures: roll.exposures,
        raw: roll
      }));
    }
  });
}

export type {FilmRollOption};
