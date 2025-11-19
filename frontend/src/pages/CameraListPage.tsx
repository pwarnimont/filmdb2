import {useEffect, useMemo, useState} from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {alpha, useTheme} from '@mui/material/styles';
import {DataGrid, GridColDef, GridPaginationModel} from '@mui/x-data-grid';
import PhotoCameraIcon from '@mui/icons-material/PhotoCameraOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CameraRollIcon from '@mui/icons-material/CameraRoll';
import MovieFilterIcon from '@mui/icons-material/MovieFilterOutlined';
import AddIcon from '@mui/icons-material/AddOutlined';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigate, useSearchParams} from 'react-router-dom';

import {
  createCamera,
  deleteCamera,
  getCamera,
  listCameras,
  updateCamera
} from '../api/cameras';
import type {Camera, CameraPayload, PaginatedCameras} from '../types/api';
import {CameraForm} from '../components/CameraForm';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {useSnackbar} from '../providers/SnackbarProvider';

const filmTypes = ['35mm', '120', '110', '620', '4x5', '8x10', 'instant', 'digital', 'other'];

function CameraListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [filmTypeFilter, setFilmTypeFilter] = useState<string>('all');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({page: 0, pageSize: 10});
  const [formState, setFormState] = useState<{mode: 'create' | 'edit'; camera?: Camera | null} | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Camera | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      filmType: filmTypeFilter !== 'all' ? filmTypeFilter : undefined,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize
    }),
    [search, filmTypeFilter, paginationModel]
  );

  const {data, isFetching} = useQuery<PaginatedCameras>({
    queryKey: ['cameras', filters],
    queryFn: () => listCameras(filters),
    placeholderData: (previousData: PaginatedCameras | undefined) => previousData
  });

  const {data: statsData, isLoading: statsLoading} = useQuery<PaginatedCameras>({
    queryKey: ['cameras', 'stats'],
    queryFn: () => listCameras({page: 1, pageSize: 500}),
    staleTime: 1000 * 60 * 5
  });

  const {data: selectedCameraData} = useQuery<Camera | null>({
    queryKey: ['camera', selectedCameraId],
    queryFn: () => (selectedCameraId ? getCamera(selectedCameraId) : Promise.resolve(null)),
    enabled: !!selectedCameraId
  });

  useEffect(() => {
    const cameraFromParams = searchParams.get('cameraId');
    if (cameraFromParams && cameraFromParams !== selectedCameraId) {
      setSelectedCameraId(cameraFromParams);
    }
  }, [searchParams, selectedCameraId]);

  const drawerCamera =
    selectedCameraData ??
    (selectedCameraId ? data?.items.find((camera) => camera.id === selectedCameraId) ?? null : null);

  const stats = useMemo(() => {
    const items = statsData?.items ?? [];
    const total = statsData?.total ?? 0;
    const linkedRolls = items.reduce(
      (sum: number, camera: Camera) => sum + camera.linkedFilmRollsCount,
      0
    );
    const filmTypeMap = items.reduce<Record<string, number>>((acc, camera) => {
      acc[camera.filmType] = (acc[camera.filmType] ?? 0) + 1;
      return acc;
    }, {});
    return {total, linkedRolls, filmTypeMap};
  }, [statsData]);

  const invalidateCameraQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({queryKey: ['cameras']}),
      queryClient.invalidateQueries({queryKey: ['cameras', 'stats']}),
      queryClient.invalidateQueries({queryKey: ['cameras', 'options']})
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (payload: CameraPayload) => createCamera(payload),
    onSuccess: async () => {
      await invalidateCameraQueries();
      snackbar.showMessage('Camera added', 'success');
      setFormState(null);
    },
    onError: () => snackbar.showMessage('Could not add camera', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({id, payload}: {id: string; payload: Partial<CameraPayload>}) => updateCamera(id, payload),
    onSuccess: async (_, variables) => {
      await invalidateCameraQueries();
      snackbar.showMessage('Camera updated', 'success');
      queryClient.invalidateQueries({queryKey: ['camera', variables.id]});
      setFormState(null);
    },
    onError: () => snackbar.showMessage('Could not update camera', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCamera(id),
    onSuccess: async () => {
      await invalidateCameraQueries();
      snackbar.showMessage('Camera deleted', 'info');
      setDeleteTarget(null);
      setSelectedCameraId(null);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('cameraId');
        return next;
      });
    },
    onError: () => snackbar.showMessage('Could not delete camera', 'error')
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPaginationModel((prev) => ({...prev, page: 0}));
  };

  const handleFilmTypeChange = (value: string) => {
    setFilmTypeFilter(value);
    setPaginationModel((prev) => ({...prev, page: 0}));
  };

  const handleSelectCamera = (camera: Camera) => {
    queryClient.setQueryData(['camera', camera.id], camera);
    setSelectedCameraId(camera.id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('cameraId', camera.id);
      return next;
    });
  };

  const handleCloseDrawer = () => {
    setSelectedCameraId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('cameraId');
      return next;
    });
  };

  const columns = useMemo<GridColDef<Camera>[]>(
    () => [
      {
        field: 'manufacturer',
        headerName: 'Manufacturer',
        minWidth: 160,
        flex: 1
      },
      {
        field: 'model',
        headerName: 'Model',
        flex: 1.2,
        minWidth: 200
      },
      {
        field: 'filmType',
        headerName: 'Film Type',
        minWidth: 140,
        renderCell: ({value}) => <Chip label={value as string} size="small" variant="outlined" color="primary" />
      },
      {
        field: 'releaseDate',
        headerName: 'Release Date',
        minWidth: 150,
        valueGetter: ({value}) => (value ? new Date(value as string).toLocaleDateString() : '—')
      },
      {
        field: 'purchaseDate',
        headerName: 'Date Purchased',
        minWidth: 150,
        valueGetter: ({value}) => (value ? new Date(value as string).toLocaleDateString() : '—')
      },
      {
        field: 'lenses',
        headerName: 'Lenses',
        flex: 1.5,
        minWidth: 260,
        sortable: false,
        renderCell: ({value}) => {
          const lenses = (value as string[]) ?? [];
          return (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {lenses.slice(0, 3).map((lens) => (
                <Chip key={lens} label={lens} size="small" color="secondary" />
              ))}
              {lenses.length > 3 && <Chip label={`+${lenses.length - 3}`} size="small" />}
            </Stack>
          );
        }
      },
      {
        field: 'linkedFilmRolls',
        headerName: 'Linked Rolls',
        flex: 1.2,
        minWidth: 200,
        sortable: false,
        renderCell: ({row}) =>
          row.linkedFilmRolls.length ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {row.linkedFilmRolls.slice(0, 3).map((roll) => (
                <Tooltip key={roll.id} title={roll.dateShot ? `Shot ${new Date(roll.dateShot).toLocaleDateString()}` : undefined}>
                  <Chip
                    label={roll.filmName}
                    size="small"
                    color="success"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/film-rolls/${roll.id}`);
                    }}
                  />
                </Tooltip>
              ))}
              {row.linkedFilmRollsCount > 3 && (
                <Chip label={`+${row.linkedFilmRollsCount - 3}`} size="small" variant="outlined" />
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No rolls linked
            </Typography>
          )
      }
    ],
    [navigate]
  );

  const statsChips = Object.entries(stats.filmTypeMap).map(([type, count]) => `${type.toUpperCase()} ×${count}`);

  return (
    <Stack spacing={3} sx={{color: 'text.primary'}}>
      <Stack
        direction={{xs: 'column', md: 'row'}}
        spacing={2}
        alignItems={{xs: 'flex-start', md: 'center'}}
        justifyContent="space-between"
      >
        <Stack spacing={0.5}>
          <Typography variant="h4">Cameras</Typography>
          <Typography variant="body2" color="text.secondary">
            Keep track of your camera bodies, favorite lenses, and the rolls they shot.
          </Typography>
        </Stack>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={1.5}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormState({mode: 'create'})}>
            Add Camera
          </Button>
          <Button
            variant="outlined"
            startIcon={<MovieFilterIcon />}
            onClick={() => navigate('/film-rolls/new')}
          >
            Log Film Roll
          </Button>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: {xs: 2, md: 2.5},
          p: 2,
          background: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.8 : 0.95)
        }}
      >
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h5">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total cameras cataloged
            </Typography>
          </Stack>
          <Divider flexItem orientation="vertical" sx={{display: {xs: 'none', sm: 'block'}}} />
          <Stack spacing={0.5}>
            <Typography variant="h5">{stats.linkedRolls}</Typography>
            <Typography variant="body2" color="text.secondary">
              Film rolls linked
            </Typography>
          </Stack>
          <Divider flexItem orientation="vertical" sx={{display: {xs: 'none', sm: 'block'}}} />
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Film types
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {statsLoading ? (
                <Typography variant="caption" color="text.secondary">
                  Loading types...
                </Typography>
              ) : statsChips.length ? (
                statsChips.map((chip) => <Chip key={chip} label={chip} size="small" />)
              ) : (
                <Typography variant="caption" color="text.secondary">
                  —
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction={{xs: 'column', md: 'row'}} spacing={2}>
        <TextField
          label="Search"
          placeholder="Search by manufacturer or model"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          sx={{width: {xs: '100%', md: 320}}}
        />
        <TextField
          select
          label="Film Type"
          sx={{width: {xs: '100%', md: 200}}}
          value={filmTypeFilter}
          onChange={(event) => handleFilmTypeChange(event.target.value)}
        >
          <MenuItem value="all">All types</MenuItem>
          {filmTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type.toUpperCase()}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box
        sx={{
          width: '100%',
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.85 : 0.98),
          borderRadius: {xs: 2, md: 2.5},
          border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.4 : 0.2)}`,
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 18px 40px rgba(5, 15, 10, 0.5)'
              : '0 18px 32px rgba(18, 46, 76, 0.06)',
          p: {xs: 1.5, md: 2}
        }}
      >
        <DataGrid
          autoHeight
          disableRowSelectionOnClick
          rows={data?.items ?? []}
          rowCount={data?.total ?? 0}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          loading={isFetching}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={({row}) => handleSelectCamera(row)}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.18 : 0.08),
              fontWeight: 600
            }
          }}
        />
      </Box>

      <Drawer
        anchor="right"
        open={!!selectedCameraId}
        onClose={handleCloseDrawer}
        PaperProps={{sx: {width: {xs: '100%', sm: 420}}}}
      >
        <Stack spacing={2} sx={{p: 3, height: '100%'}}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="h6">{drawerCamera?.model ?? 'Camera details'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {drawerCamera?.manufacturer ?? ''}
              </Typography>
            </Stack>
            <IconButton onClick={handleCloseDrawer}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider />
          {drawerCamera ? (
            <Stack spacing={2} sx={{flexGrow: 1, overflowY: 'auto'}}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Specifications
                </Typography>
                <Stack spacing={1}>
                  <InfoRow label="Film type" value={drawerCamera.filmType.toUpperCase()} />
                  <InfoRow
                    label="Release date"
                    value={drawerCamera.releaseDate ? new Date(drawerCamera.releaseDate).toLocaleDateString() : '—'}
                  />
                  <InfoRow
                    label="Purchase date"
                    value={drawerCamera.purchaseDate ? new Date(drawerCamera.purchaseDate).toLocaleDateString() : '—'}
                  />
                </Stack>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Lenses
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {drawerCamera!.lenses.map((lens: string) => (
                    <Chip key={lens} label={lens} size="small" />
                  ))}
                </Stack>
              </Stack>
              {drawerCamera.notes && (
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body2">{drawerCamera.notes}</Typography>
                </Stack>
              )}
              <Divider />
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CameraRollIcon color="primary" />
                  <Typography variant="subtitle1">Linked Film Rolls</Typography>
                </Stack>
                {drawerCamera!.linkedFilmRolls.length ? (
                  <Stack spacing={1}>
                    {drawerCamera!.linkedFilmRolls.map((roll: Camera['linkedFilmRolls'][number]) => (
                      <Stack
                        key={roll.id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Stack spacing={0.25}>
                          <Typography variant="body2">{roll.filmName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {roll.dateShot ? new Date(roll.dateShot).toLocaleDateString() : 'Date unknown'}
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
                    No film rolls linked yet.
                  </Typography>
                )}
                <Button variant="outlined" onClick={() => navigate('/film-rolls')}>
                  Manage film rolls
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a camera to view details.
            </Typography>
          )}
          {drawerCamera && (
            <Stack direction="row" spacing={1}>
              <Button variant="contained" fullWidth onClick={() => setFormState({mode: 'edit', camera: drawerCamera})}>
                Edit
              </Button>
              <Button variant="outlined" color="error" onClick={() => setDeleteTarget(drawerCamera)}>
                Delete
              </Button>
            </Stack>
          )}
        </Stack>
      </Drawer>

      <Dialog open={!!formState} onClose={() => setFormState(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{formState?.mode === 'create' ? 'Add Camera' : 'Edit Camera'}</DialogTitle>
        <DialogContent>
          <CameraForm
            defaultValues={formState?.camera ?? undefined}
            onSubmit={async (payload) => {
              if (formState?.mode === 'create') {
                await createMutation.mutateAsync(payload);
              } else if (formState?.camera) {
                await updateMutation.mutateAsync({id: formState.camera.id, payload});
              }
            }}
            submitLabel={formState?.mode === 'create' ? 'Add Camera' : 'Save Changes'}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete camera?"
        description="This will unlink the camera from any film rolls."
        confirmLabel="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </Stack>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

export default CameraListPage;
