import {useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {
  Box,
  Button,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import {DataGrid, GridColDef, GridPaginationModel, GridSortModel} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';

import {
  deleteFilmRoll,
  listFilmRolls,
  markDeveloped,
  type FilmRollFilters
} from '../api/filmRolls';
import type {FilmRoll, PaginatedFilmRolls} from '../types/api';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {DevelopmentForm} from '../components/DevelopmentForm';
import {useSnackbar} from '../providers/SnackbarProvider';
import {detectFilmBrand} from '../utils/filmBrand';
import {FilmBrandLogo} from '../components/FilmBrandLogo';

function FilmRollListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'developed' | 'undeveloped'>('all');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({page: 0, pageSize: 10});
  const [sortModel, setSortModel] = useState<GridSortModel>([
    {field: 'dateShot', sort: 'desc'}
  ]);
  const [selectedForDelete, setSelectedForDelete] = useState<FilmRoll | null>(null);
  const [selectedForDevelop, setSelectedForDevelop] = useState<FilmRoll | null>(null);
  const [selectedForDetails, setSelectedForDetails] = useState<FilmRoll | null>(null);
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const filters = useMemo<FilmRollFilters>(() => {
    const base: FilmRollFilters = {
      search: search || undefined,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize
    };
    if (statusFilter === 'developed') {
      base.isDeveloped = true;
    } else if (statusFilter === 'undeveloped') {
      base.isDeveloped = false;
    }
    if (sortModel.length > 0) {
      base.sortBy = sortModel[0].field as FilmRollFilters['sortBy'];
      base.sortDir = sortModel[0].sort ?? undefined;
    }
    return base;
  }, [paginationModel, search, sortModel, statusFilter]);

  const {
    data = {
      items: [],
      total: 0,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 10
    },
    isFetching
  } = useQuery<PaginatedFilmRolls>({
    queryKey: ['film-rolls', filters],
    queryFn: () => listFilmRolls(filters),
    placeholderData: (previousData) => previousData
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFilmRoll(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['film-rolls']});
      snackbar.showMessage('Film roll deleted', 'success');
    },
    onError: () => snackbar.showMessage('Could not delete film roll', 'error')
  });

  const markDevelopedMutation = useMutation({
    mutationFn: ({id, development}: {id: string; development: Parameters<typeof markDeveloped>[1]}) =>
      markDeveloped(id, development),
    onSuccess: () => {
      setSelectedForDevelop(null);
      void queryClient.invalidateQueries({queryKey: ['film-rolls']});
      snackbar.showMessage('Film roll marked as developed', 'success');
    },
    onError: () => snackbar.showMessage('Failed to mark as developed', 'error')
  });

  const {data: stats, isLoading: statsLoading} = useQuery({
    queryKey: ['film-rolls', 'stats'],
    queryFn: async () => {
      const [all, developed, undeveloped] = await Promise.all([
        listFilmRolls({page: 1, pageSize: 1}),
        listFilmRolls({page: 1, pageSize: 1, isDeveloped: true}),
        listFilmRolls({page: 1, pageSize: 1, isDeveloped: false})
      ]);

      const total = all.total;
      const developedCount = developed.total;
      const undevelopedCount = undeveloped.total;
      const percentage = total > 0 ? Math.round((developedCount / total) * 100) : 0;

      return {
        total,
        developed: developedCount,
        undeveloped: undevelopedCount,
        developedPercentage: percentage
      };
    }
  });

  const columns = useMemo<GridColDef<FilmRoll>[]>(
    () => [
      {
        field: 'brand',
        headerName: 'Brand',
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: ({row}) => {
          const brand = detectFilmBrand(row.filmName);
          return <FilmBrandLogo brand={brand} />;
        }
      },
      {
        field: 'filmName',
        headerName: 'Film',
        flex: 1,
        minWidth: 180
      },
      {
        field: 'filmId',
        headerName: 'Film ID',
        flex: 1,
        minWidth: 120
      },
      {
        field: 'filmFormat',
        headerName: 'Format',
        width: 120
      },
      {
        field: 'boxIso',
        headerName: 'Box ISO',
        width: 100
      },
      {
        field: 'exposures',
        headerName: 'Exposures',
        width: 110
      },
      {
        field: 'dateShot',
        headerName: 'Date Shot',
        width: 140,
        valueGetter: (params) =>
          params.value ? new Date(params.value as string).toLocaleDateString() : '—'
      },
      {
        field: 'isDeveloped',
        headerName: 'Developed',
        width: 120,
        valueGetter: (params) => ((params.value as boolean) ? 'Yes' : 'No')
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        width: 180,
        renderCell: ({row}) => (
          <Stack direction="row" spacing={1}>
            <IconButton
              aria-label="View"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/film-rolls/${row.id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Edit"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/film-rolls/${row.id}/edit`);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <Tooltip title={row.isDeveloped ? 'Already developed' : 'Mark as developed'}>
              <span>
                <IconButton
                  aria-label="Mark developed"
                  color={row.isDeveloped ? 'success' : 'primary'}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedForDevelop(row);
                  }}
                  disabled={row.isDeveloped}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton
              color="error"
              aria-label="Delete"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedForDelete(row);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        )
      }
    ],
    [navigate]
  );

  return (
    <Stack spacing={3} sx={{color: 'text.primary'}}>
      <Stack direction={{xs: 'column', md: 'row'}} spacing={2} alignItems={{md: 'center'}}>
        <Typography variant="h4" sx={{flexGrow: 1}}>
          Film Rolls
        </Typography>
        <Button variant="contained" onClick={() => navigate('/film-rolls/new')}>
          Add Film Roll
        </Button>
      </Stack>
      <StatisticsStrip stats={stats} loading={statsLoading} />
      <Stack direction={{xs: 'column', md: 'row'}} spacing={2} alignItems={{md: 'center'}}>
        <TextField
          label="Search"
          placeholder="Search by film, ID, or camera"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{width: {xs: '100%', md: 320}}}
        />
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_event, value) => value && setStatusFilter(value)}
          color="primary"
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="developed">Developed</ToggleButton>
          <ToggleButton value="undeveloped">Undeveloped</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box
        sx={{
          width: '100%',
          bgcolor: 'rgba(255,255,255,0.85)',
          borderRadius: {xs: 2, md: 2.5},
          boxShadow: '0 18px 36px rgba(18, 46, 76, 0.08)',
          backdropFilter: 'blur(4px)',
          p: {xs: 1.5, md: 2}
        }}
      >
        <DataGrid
          autoHeight
          disableRowSelectionOnClick
          rows={data.items}
          rowCount={data.total}
          loading={isFetching}
          pageSizeOptions={[10, 20, 50]}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={(model) => setSortModel(model.length ? model : [{field: 'dateShot', sort: 'desc'}])}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={({row}) => setSelectedForDetails(row)}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(29,53,87,0.08)',
              fontWeight: 600
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(58,110,165,0.08)'
            },
            backgroundColor: 'transparent'
          }}
        />
      </Box>

      <ConfirmDialog
        open={!!selectedForDelete}
        title="Delete film roll?"
        description="This will permanently remove the roll and its development data."
        confirmLabel="Delete"
        onClose={() => setSelectedForDelete(null)}
        onConfirm={() => {
          if (selectedForDelete) {
            deleteMutation.mutate(selectedForDelete.id);
            setSelectedForDelete(null);
          }
        }}
      />

      <Dialog open={!!selectedForDevelop} onClose={() => setSelectedForDevelop(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedForDevelop?.isDeveloped ? 'Update Development' : 'Mark as Developed'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            {selectedForDevelop?.isDeveloped
              ? 'Update the development log for this roll.'
              : 'Provide development details to archive this roll.'}
          </Typography>
          {selectedForDevelop && (
            <DevelopmentForm
              initialValues={selectedForDevelop.development ? {
                ...selectedForDevelop.development,
                timeSeconds: selectedForDevelop.development.timeSeconds
              } : undefined}
              onSubmit={async (payload) => {
                await markDevelopedMutation.mutateAsync({
                  id: selectedForDevelop.id,
                  development: {development: payload}
                });
              }}
              submitLabel={selectedForDevelop.isDeveloped ? 'Save Development' : 'Mark Developed'}
            />
          )}
        </DialogContent>
      </Dialog>

      <Drawer
        anchor="right"
        open={!!selectedForDetails}
        onClose={() => setSelectedForDetails(null)}
        PaperProps={{
          sx: {
            width: {xs: '100%', sm: 420, md: 480},
            maxWidth: '100%',
            p: 0
          }
        }}
      >
        {selectedForDetails && (
          <FilmRollDetailsPanel
            film={selectedForDetails}
            onClose={() => setSelectedForDetails(null)}
            onEdit={() => {
              setSelectedForDetails(null);
              navigate(`/film-rolls/${selectedForDetails.id}/edit`);
            }}
            onOpen={() => {
              setSelectedForDetails(null);
              navigate(`/film-rolls/${selectedForDetails.id}`);
            }}
            onOpenDevelopmentDialog={() => {
              setSelectedForDetails(null);
              setSelectedForDevelop(selectedForDetails);
            }}
          />
        )}
      </Drawer>
    </Stack>
  );
}

export default FilmRollListPage;

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function formatTime(value: number) {
  const mins = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

function FilmRollDetailsPanel({
  film,
  onClose,
  onOpen,
  onEdit,
  onOpenDevelopmentDialog
}: {
  film: FilmRoll;
  onClose: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onOpenDevelopmentDialog: () => void;
}) {
  const brand = detectFilmBrand(film.filmName);
  const developedLabel = film.isDeveloped ? 'Update Development' : 'Mark as Developed';

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2}}>
        <Typography variant="h6">{film.filmName}</Typography>
        <IconButton onClick={onClose} aria-label="Close details panel">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto'}}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FilmBrandLogo brand={brand} size={48} showLabel />
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Film ID
            </Typography>
            <Typography variant="subtitle1">{film.filmId}</Typography>
          </Stack>
        </Stack>

        <InfoSection>
          <InfoRow label="Format" value={film.filmFormat} />
          <InfoRow label="Exposures" value={String(film.exposures)} />
          <InfoRow label="Box ISO" value={String(film.boxIso)} />
          <InfoRow label="Shot ISO" value={film.shotIso ? String(film.shotIso) : '—'} />
        </InfoSection>

        <InfoSection>
          <InfoRow label="Date Shot" value={formatDate(film.dateShot)} />
          <InfoRow label="Camera" value={film.cameraName ?? '—'} />
          <InfoRow label="Developed" value={film.isDeveloped ? 'Yes' : 'No'} />
          <InfoRow label="Created" value={formatDate(film.createdAt)} />
          <InfoRow label="Updated" value={formatDate(film.updatedAt)} />
        </InfoSection>

        {film.development ? (
          <InfoSection title="Development">
            <InfoRow label="Developer" value={film.development.developer} />
            <InfoRow label="Temperature" value={`${film.development.temperatureC.toFixed(1)} °C`} />
            <InfoRow label="Dilution" value={film.development.dilution} />
            <InfoRow label="Time" value={formatTime(film.development.timeSeconds)} />
            <InfoRow label="Date Developed" value={formatDate(film.development.dateDeveloped)} />
            <InfoRow label="Agitation" value={film.development.agitationScheme} />
          </InfoSection>
        ) : (
          <Box sx={{p: 2, borderRadius: 1, bgcolor: 'warning.light', color: 'warning.contrastText'}}>
            <Typography variant="body2">This roll has not been developed yet.</Typography>
          </Box>
        )}
      </Box>
      <Divider />
      <Stack spacing={1} sx={{p: 3}}>
        <Button variant="contained" onClick={onOpen}>
          View Full Details
        </Button>
        <Button variant="outlined" onClick={onEdit}>
          Edit Roll
        </Button>
        <Button variant="outlined" color={film.isDeveloped ? 'success' : 'primary'} onClick={onOpenDevelopmentDialog}>
          {developedLabel}
        </Button>
      </Stack>
    </Box>
  );
}

function InfoSection({children, title}: {children: ReactNode; title?: string}) {
  return (
    <Stack spacing={1.5}>
      {title && (
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      )}
      <Stack spacing={1}>{children}</Stack>
    </Stack>
  );
}

function StatisticsStrip({
  stats,
  loading
}: {
  stats:
    | {
        total: number;
        developed: number;
        undeveloped: number;
        developedPercentage: number;
      }
    | undefined;
  loading: boolean;
}) {
  const cards: Array<{label: string; value: string | number; helper?: string; accent: string; text: string}> = [
    {
      label: 'Total Rolls',
      value: stats?.total ?? '—',
      accent: 'linear-gradient(135deg, #1d3557 0%, #3a6ea5 100%)',
      text: '#f1f5fb'
    },
    {
      label: 'Developed',
      value: stats?.developed ?? '—',
      helper: stats ? `${stats.developedPercentage}% of collection` : undefined,
      accent: 'linear-gradient(135deg, #2a9d8f 0%, #5ed5c0 100%)',
      text: '#f0fffa'
    },
    {
      label: 'Undeveloped',
      value: stats?.undeveloped ?? '—',
      accent: 'linear-gradient(135deg, #e63946 0%, #f77f93 100%)',
      text: '#fff5f6'
    }
  ];

  return (
    <Stack direction={{xs: 'column', md: 'row'}} spacing={2}>
      {cards.map((card) => (
        <Paper
          key={card.label}
          elevation={0}
          sx={{
            flex: {md: 1},
            px: {xs: 2.5, md: 3},
            py: {xs: 2, md: 2.5},
            borderRadius: 2.5,
            border: 'none',
            background: card.accent,
            color: card.text,
            boxShadow: '0 18px 28px rgba(18, 46, 76, 0.14)'
          }}
        >
          {loading ? (
            <Skeleton variant="rectangular" height={64} sx={{bgcolor: 'rgba(255,255,255,0.35)'}} />
          ) : (
            <Stack spacing={0.5}>
              <Typography variant="overline" sx={{letterSpacing: 1.2, color: 'inherit'}}>
                {card.label}
              </Typography>
              <Typography variant="h5" fontWeight={700} color="inherit">
                {card.value}
              </Typography>
              {card.helper && (
                <Typography variant="caption" sx={{color: 'rgba(255,255,255,0.8)'}}>
                  {card.helper}
                </Typography>
              )}
            </Stack>
          )}
        </Paper>
      ))}
    </Stack>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}
