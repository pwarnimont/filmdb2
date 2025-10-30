import {useMemo} from 'react';
import {Alert, Paper, Stack, Typography} from '@mui/material';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigate, useParams} from 'react-router-dom';

import {createFilmRoll, getFilmRoll, updateFilmRoll} from '../api/filmRolls';
import type {FilmRollPayload} from '../types/api';
import {FilmRollForm} from '../components/FilmRollForm';
import {useSnackbar} from '../providers/SnackbarProvider';

interface FilmRollFormPageProps {
  mode: 'create' | 'edit';
}

function FilmRollFormPage({mode}: FilmRollFormPageProps) {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();

  const {data, isLoading, isError} = useQuery({
    queryKey: ['film-roll', id],
    queryFn: () => getFilmRoll(id as string),
    enabled: mode === 'edit' && !!id
  });

  const createMutation = useMutation({
    mutationFn: (payload: FilmRollPayload) => createFilmRoll(payload),
    onSuccess: (film) => {
      snackbar.showMessage('Film roll created', 'success');
      void queryClient.invalidateQueries({queryKey: ['film-rolls']});
      navigate(`/film-rolls/${film.id}`);
    },
    onError: () => snackbar.showMessage('Could not create film roll', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: (payload: FilmRollPayload) => updateFilmRoll(id as string, payload),
    onSuccess: (film) => {
      snackbar.showMessage('Film roll updated', 'success');
      void queryClient.invalidateQueries({queryKey: ['film-roll', id]});
      void queryClient.invalidateQueries({queryKey: ['film-rolls']});
      navigate(`/film-rolls/${film.id}`);
    },
    onError: () => snackbar.showMessage('Could not update film roll', 'error')
  });

  const defaultValues = useMemo(() => {
    if (!data) {
      return undefined;
    }
    return {
      filmId: data.filmId,
      filmName: data.filmName,
      boxIso: data.boxIso,
      shotIso: data.shotIso,
      dateShot: data.dateShot ? data.dateShot.slice(0, 10) : '',
      cameraName: data.cameraName ?? '',
      filmFormat: data.filmFormat,
      exposures: data.exposures,
      isDeveloped: data.isDeveloped,
      isScanned: data.isScanned,
      scanFolder: data.scanFolder ?? ''
    } as const;
  }, [data]);

  const handleSubmit = async (values: FilmRollPayload) => {
    if (mode === 'create') {
      await createMutation.mutateAsync(values);
    } else {
      await updateMutation.mutateAsync(values);
    }
  };

  if (mode === 'edit' && isLoading) {
    return <Typography>Loading film roll...</Typography>;
  }

  if (mode === 'edit' && (isError || !data)) {
    return <Alert severity="error">Unable to load film roll.</Alert>;
  }

  return (
    <Paper sx={{p: 4}} elevation={1}>
      <Stack spacing={3}>
        <div>
          <Typography variant="h4" gutterBottom>
            {mode === 'create' ? 'New Film Roll' : 'Edit Film Roll'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mode === 'create'
              ? 'Add a new film roll to your archive.'
              : 'Update the details of this film roll.'}
          </Typography>
        </div>
        <FilmRollForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitLabel={mode === 'create' ? 'Create' : 'Save Changes'}
        />
      </Stack>
    </Paper>
  );
}

export default FilmRollFormPage;
