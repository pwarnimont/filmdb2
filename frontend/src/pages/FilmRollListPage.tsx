import {useMemo, useState} from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import {DataGrid, GridColDef, GridPaginationModel, GridSortModel} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
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
            <IconButton aria-label="View" onClick={() => navigate(`/film-rolls/${row.id}`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="Edit" onClick={() => navigate(`/film-rolls/${row.id}/edit`)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Mark developed"
              color={row.isDeveloped ? 'success' : 'primary'}
              onClick={() => setSelectedForDevelop(row)}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton color="error" aria-label="Delete" onClick={() => setSelectedForDelete(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        )
      }
    ],
    [navigate]
  );

  return (
    <Stack spacing={3}>
      <Stack direction={{xs: 'column', md: 'row'}} spacing={2} alignItems={{md: 'center'}}>
        <Typography variant="h4" sx={{flexGrow: 1}}>
          Film Rolls
        </Typography>
        <Button variant="contained" onClick={() => navigate('/film-rolls/new')}>
          Add Film Roll
        </Button>
      </Stack>
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
      <Box sx={{width: '100%', bgcolor: 'background.paper'}}>
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
        <DialogTitle>Mark as Developed</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            Provide development details to archive this roll.
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
              submitLabel="Mark Developed"
            />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

export default FilmRollListPage;
