import {useState} from 'react';
import type {ReactNode} from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigate, useParams} from 'react-router-dom';

import {
  deleteDevelopment,
  deleteFilmRoll,
  getFilmRoll,
  markDeveloped,
  upsertDevelopment
} from '../api/filmRolls';
import type {FilmRoll} from '../types/api';
import {DevelopmentForm} from '../components/DevelopmentForm';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {useSnackbar} from '../providers/SnackbarProvider';
import {detectFilmBrand} from '../utils/filmBrand';
import {FilmBrandLogo} from '../components/FilmBrandLogo';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

function FilmRollDetailPage() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const [developmentDialogOpen, setDevelopmentDialogOpen] = useState(false);
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [confirmDeleteDevelopment, setConfirmDeleteDevelopment] = useState(false);
  const [confirmDeleteRoll, setConfirmDeleteRoll] = useState(false);

  const {data, isLoading, isError} = useQuery({
    queryKey: ['film-roll', id],
    enabled: !!id,
    queryFn: () => getFilmRoll(id as string)
  });

  const upsertDevelopmentMutation = useMutation({
    mutationFn: (payload: Parameters<typeof upsertDevelopment>[1]) =>
      upsertDevelopment(id as string, payload),
    onSuccess: () => {
      setDevelopmentDialogOpen(false);
      setMarkDialogOpen(false);
      void queryClient.invalidateQueries({queryKey: ['film-roll', id]});
      void queryClient.invalidateQueries({queryKey: ['film-rolls']});
      snackbar.showMessage('Development saved', 'success');
    },
    onError: () => snackbar.showMessage('Could not save development', 'error')
  });

  const markDevelopedMutation = useMutation({
    mutationFn: (payload: Parameters<typeof markDeveloped>[1]) => markDeveloped(id as string, payload),
    onSuccess: () => {
      setMarkDialogOpen(false);
      void queryClient.invalidateQueries({queryKey: ['film-roll', id]});
      void queryClient.invalidateQueries({queryKey: ['film-rolls']});
      snackbar.showMessage('Film roll marked as developed', 'success');
    },
    onError: () => snackbar.showMessage('Failed to mark as developed', 'error')
  });

  const deleteDevelopmentMutation = useMutation({
    mutationFn: () => deleteDevelopment(id as string),
    onSuccess: () => {
      setConfirmDeleteDevelopment(false);
      void queryClient.invalidateQueries({queryKey: ['film-roll', id]});
      void queryClient.invalidateQueries({queryKey: ['film-rolls']});
      snackbar.showMessage('Development deleted', 'info');
    },
    onError: () => snackbar.showMessage('Could not delete development', 'error')
  });

  const deleteRollMutation = useMutation({
    mutationFn: () => deleteFilmRoll(id as string),
    onSuccess: async () => {
      setConfirmDeleteRoll(false);
      snackbar.showMessage('Film roll deleted', 'info');
      await queryClient.invalidateQueries({queryKey: ['film-rolls']});
      navigate('/film-rolls');
    },
    onError: () => snackbar.showMessage('Could not delete film roll', 'error')
  });

  if (isLoading) {
    return <Typography>Loading film roll...</Typography>;
  }

  if (isError || !data) {
    return <Alert severity="error">Could not load film roll details.</Alert>;
  }

  const film = data as FilmRoll;
  const brand = detectFilmBrand(film.filmName);

  return (
    <Stack spacing={3}>
      <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" spacing={2}>
        <Typography variant="h4">{film.filmName}</Typography>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={1}>
          <Button variant="outlined" onClick={() => navigate(`/film-rolls/${film.id}/edit`)}>
            Edit Roll
          </Button>
          <Button
            variant="contained"
            onClick={() => setMarkDialogOpen(true)}
            color={film.isDeveloped ? 'success' : 'primary'}
          >
            {film.isDeveloped ? 'Update Development' : 'Mark as Developed'}
          </Button>
          <Button color="error" variant="outlined" onClick={() => setConfirmDeleteRoll(true)}>
            Delete Roll
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardHeader
          title="Details"
          subheader={`Film ID • ${film.filmId}`}
          action={<FilmBrandLogo brand={brand} size={48} showLabel />}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <InfoRow label="Film Name" value={film.filmName} />
              <InfoRow label="Format" value={film.filmFormat} />
              <InfoRow label="Exposures" value={film.exposures} />
              <InfoRow label="Box ISO" value={film.boxIso} />
              <InfoRow label="Shot ISO" value={film.shotIso ?? '—'} />
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoRow label="Date Shot" value={formatDate(film.dateShot)} />
              <InfoRow
                label="Camera"
                value={
                  film.camera ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={500}>
                        {`${film.camera.manufacturer} ${film.camera.model}`}
                      </Typography>
                      <Button size="small" onClick={() => navigate(`/cameras?cameraId=${film.camera?.id}`)}>
                        View
                      </Button>
                    </Stack>
                  ) : (
                    film.cameraName ?? '—'
                  )
                }
              />
              <InfoRow label="Developed" value={film.isDeveloped ? 'Yes' : 'No'} />
              <InfoRow
                label="Scanned"
                value={film.isScanned ? (film.scanFolder ? `Yes – ${film.scanFolder}` : 'Yes') : 'No'}
              />
              <InfoRow label="Created" value={formatDate(film.createdAt)} />
              <InfoRow label="Last Updated" value={formatDate(film.updatedAt)} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {film.development ? (
        <Card>
          <CardHeader
            title="Development"
            action={
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setDevelopmentDialogOpen(true)} variant="outlined">
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => setConfirmDeleteDevelopment(true)}>
                  Delete
                </Button>
              </Stack>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InfoRow label="Developer" value={film.development.developer} />
                <InfoRow label="Temperature" value={`${film.development.temperatureC.toFixed(1)} °C`} />
                <InfoRow label="Dilution" value={film.development.dilution} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow label="Time" value={formatTime(film.development.timeSeconds)} />
                <InfoRow label="Date Developed" value={formatDate(film.development.dateDeveloped)} />
                <InfoRow label="Agitation" value={film.development.agitationScheme} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">This roll has not been developed yet.</Alert>
      )}

      <Dialog open={developmentDialogOpen} onClose={() => setDevelopmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Development</DialogTitle>
        <DialogContent>
          <DevelopmentForm
            initialValues={film.development ?? undefined}
            onSubmit={async (payload) => {
              await upsertDevelopmentMutation.mutateAsync(payload);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={markDialogOpen} onClose={() => setMarkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{film.isDeveloped ? 'Update Development' : 'Mark as Developed'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            {film.isDeveloped
              ? 'Update the development log for this roll.'
              : 'Provide development details to mark this roll as developed.'}
          </Typography>
          <DevelopmentForm
            initialValues={film.development ?? undefined}
            submitLabel={film.isDeveloped ? 'Save Changes' : 'Mark Developed'}
            onSubmit={async (payload) => {
              if (film.isDeveloped) {
                await upsertDevelopmentMutation.mutateAsync(payload);
              } else {
                await markDevelopedMutation.mutateAsync({development: payload});
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteRoll}
        title="Delete this film roll?"
        description="This will permanently remove the roll and its development data."
        confirmLabel="Delete"
        onClose={() => setConfirmDeleteRoll(false)}
        onConfirm={() => deleteRollMutation.mutate()}
      />

      <ConfirmDialog
        open={confirmDeleteDevelopment}
        title="Remove development?"
        description="This will mark the roll as undeveloped and remove all development data."
        confirmLabel="Remove"
        onClose={() => setConfirmDeleteDevelopment(false)}
        onConfirm={() => deleteDevelopmentMutation.mutate()}
      />
    </Stack>
  );
}

function InfoRow({label, value}: {label: string; value: ReactNode}) {
  return (
    <Stack spacing={0.25} sx={{py: 0.5}}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Typography variant="body1" fontWeight={500}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Stack>
  );
}

export default FilmRollDetailPage;
