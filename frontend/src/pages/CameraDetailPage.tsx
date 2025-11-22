import {useState} from 'react';
import type {ReactNode} from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigate, useParams} from 'react-router-dom';
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import CameraRollIcon from '@mui/icons-material/CameraRoll';
import PhotoCameraIcon from '@mui/icons-material/PhotoCameraOutlined';

import {getCamera, updateCamera, deleteCamera} from '../api/cameras';
import type {Camera, CameraPayload} from '../types/api';
import {CameraForm} from '../components/CameraForm';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {useSnackbar} from '../providers/SnackbarProvider';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function CameraDetailPage() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    data: camera,
    isLoading,
    isError
  } = useQuery<Camera>({
    queryKey: ['camera', id],
    queryFn: () => getCamera(id as string),
    enabled: !!id
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CameraPayload) => updateCamera(id as string, payload),
    onSuccess: async () => {
      setEditOpen(false);
      snackbar.showMessage('Camera updated', 'success');
      await queryClient.invalidateQueries({queryKey: ['camera', id]});
      await queryClient.invalidateQueries({queryKey: ['cameras']});
    },
    onError: () => snackbar.showMessage('Could not update camera', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCamera(id as string),
    onSuccess: async () => {
      setConfirmDelete(false);
      snackbar.showMessage('Camera deleted', 'info');
      await queryClient.invalidateQueries({queryKey: ['cameras']});
      navigate('/cameras');
    },
    onError: () => snackbar.showMessage('Could not delete camera', 'error')
  });

  if (isLoading) {
    return <Typography>Loading camera...</Typography>;
  }

  if (isError || !camera) {
    return <Alert severity="error">Could not load the requested camera.</Alert>;
  }

  const linkedRollsCount = camera.linkedFilmRollsCount;

  return (
    <Stack spacing={3}>
      <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" spacing={2}>
        <Typography variant="h4">
          {camera.manufacturer} {camera.model}
        </Typography>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={1}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
            Edit Camera
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/film-rolls/new')}>
            Log Film Roll
          </Button>
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardHeader
          title="Camera Details"
          subheader={`Added ${formatDate(camera.createdAt)}`}
          action={<PhotoCameraIcon color="primary" fontSize="large" />}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <InfoRow label="Manufacturer" value={camera.manufacturer} />
              <InfoRow label="Model" value={camera.model} />
              <InfoRow label="Film Type" value={camera.filmType.toUpperCase()} />
              <InfoRow label="Linked Rolls" value={linkedRollsCount} />
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoRow label="Release Date" value={formatDate(camera.releaseDate)} />
              <InfoRow label="Purchase Date" value={formatDate(camera.purchaseDate)} />
              <InfoRow label="Last Updated" value={formatDate(camera.updatedAt)} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Lenses" subheader={`${camera.lenses.length} saved`} />
        <CardContent>
          {camera.lenses.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {camera.lenses.map((lens) => (
                <Chip key={lens} label={lens} variant="outlined" color="secondary" />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No lenses recorded for this camera.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Linked Film Rolls"
          subheader={
            camera.linkedFilmRolls.length ? `${camera.linkedFilmRolls.length} linked` : 'No rolls linked yet'
          }
          avatar={<CameraRollIcon color="primary" />}
        />
        <CardContent>
          {camera.linkedFilmRolls.length ? (
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {camera.linkedFilmRolls.map((roll) => (
                <Stack
                  key={roll.id}
                  direction={{xs: 'column', sm: 'row'}}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{sm: 'center'}}
                >
                  <Stack spacing={0.25}>
                    <Typography variant="subtitle2">{roll.filmName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {roll.filmId} • {formatDate(roll.dateShot)}
                    </Typography>
                  </Stack>
                  <Button size="small" onClick={() => navigate(`/film-rolls/${roll.id}`)}>
                    View Roll
                  </Button>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Link rolls when logging film to keep your collection organized.
            </Typography>
          )}
        </CardContent>
      </Card>

      {camera.notes && (
        <Card>
          <CardHeader title="Notes" />
          <CardContent>
            <Typography variant="body2">{camera.notes}</Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Camera</DialogTitle>
        <DialogContent>
          <CameraForm
            defaultValues={camera}
            onSubmit={async (payload) => {
              await updateMutation.mutateAsync(payload);
            }}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete camera?"
        description="This will unlink the camera from any film rolls."
        confirmLabel="Delete"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
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

export default CameraDetailPage;
