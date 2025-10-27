import {useEffect, useMemo, useState} from 'react';
import type {MouseEvent, ChangeEvent} from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Chip,
  Paper,
  Stack,
  MenuItem,
  TextField,
  Tooltip,
  Skeleton,
  Typography
} from '@mui/material';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import {DataGrid, GridColDef, GridPaginationModel} from '@mui/x-data-grid';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigate, useSearchParams} from 'react-router-dom';

import {deletePrint, getPrint, listPrints} from '../api/prints';
import type {PaginatedPrints, Print} from '../types/api';
import {useFilmRollOptions} from '../hooks/useFilmRollOptions';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {useSnackbar} from '../providers/SnackbarProvider';

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function PrintListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({page: 0, pageSize: 10});
  const [filmRollFilter, setFilmRollFilterState] = useState<string>(() => searchParams.get('filmRollId') ?? '');
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const [selectedPrintRow, setSelectedPrintRow] = useState<Print | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Print | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {data: filmRollOptions = [], isLoading: filmRollLoading} = useFilmRollOptions();

  const {
    data = {items: [], total: 0, page: 1, pageSize: paginationModel.pageSize},
    isFetching
  } = useQuery<PaginatedPrints>({
    queryKey: ['prints', paginationModel, filmRollFilter],
    queryFn: () =>
      listPrints({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        filmRollId: filmRollFilter || undefined
      }),
    placeholderData: (previous) => previous
  });

  const selectedPrintId = selectedPrintRow?.id ?? null;

  const {
    data: selectedPrintData,
    isFetching: selectedPrintLoading
  } = useQuery<Print>({
    queryKey: ['print', selectedPrintId],
    queryFn: () => getPrint(selectedPrintId as string),
    enabled: !!selectedPrintId
  });

  const deleteMutation = useMutation({
    mutationFn: (printId: string) => deletePrint(printId),
    onSuccess: async (_data, removedId) => {
      snackbar.showMessage('Print deleted', 'info');
      setConfirmDelete(false);
      setSelectedPrintRow((current) => (current?.id === removedId ? null : current));
      setDeleteTarget(null);
      await queryClient.invalidateQueries({queryKey: ['prints']});
    },
    onError: () => snackbar.showMessage('Could not delete print', 'error')
  });

  const printDetails = selectedPrintData ?? selectedPrintRow;

  const handleCloseDrawer = () => {
    setSelectedPrintRow(null);
  };

  const columns = useMemo<GridColDef<Print>[]>(
    () => [
      {
        field: 'filmRoll',
        headerName: 'Film Roll',
        flex: 1.2,
        minWidth: 220,
        valueGetter: ({row}) =>
          row.filmRoll ? `${row.filmRoll.filmName} (${row.filmRoll.filmId})` : '—'
      },
      {
        field: 'frameNumber',
        headerName: 'Frame',
        width: 90
      },
      {
        field: 'paperType',
        headerName: 'Paper Type',
        flex: 0.9,
        minWidth: 140
      },
      {
        field: 'paperSize',
        headerName: 'Paper Size',
        flex: 0.7,
        minWidth: 120
      },
      {
        field: 'paperManufacturer',
        headerName: 'Manufacturer',
        flex: 1,
        minWidth: 160
      },
      {
        field: 'developmentTimeSeconds',
        headerName: 'Dev Time',
        width: 120,
        valueGetter: ({row}) => formatSeconds(row.developmentTimeSeconds)
      },
      {
        field: 'fixingTimeSeconds',
        headerName: 'Fix Time',
        width: 120,
        valueGetter: ({row}) => formatSeconds(row.fixingTimeSeconds)
      },
      {
        field: 'splitGradeSteps',
        headerName: 'Split Grade',
        flex: 1.1,
        minWidth: 200,
        renderCell: ({row}) => {
          if (!row.splitGradeSteps || row.splitGradeSteps.length === 0) {
            return '—';
          }
          const summary = row.splitGradeSteps
            .map((step) => `${step.filter}: ${formatSeconds(step.exposureSeconds)}`)
            .join(', ');
          return (
            <Tooltip title={summary}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <InfoIcon fontSize="small" />
                <Typography variant="body2">{`${row.splitGradeSteps.length} step${
                  row.splitGradeSteps.length > 1 ? 's' : ''
                }`}</Typography>
              </Stack>
            </Tooltip>
          );
        }
      },
      {
        field: 'splitGradeInstructions',
        headerName: 'Instructions',
        flex: 1.3,
        minWidth: 220,
        renderCell: ({row}) =>
          row.splitGradeInstructions ? (
            <Tooltip title={row.splitGradeInstructions}>
              <Typography variant="body2" noWrap>
                {row.splitGradeInstructions}
              </Typography>
            </Tooltip>
          ) : (
            '—'
          )
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        width: 160,
        valueGetter: ({row}) => new Date(row.createdAt).toLocaleString()
      },
      {
        field: 'actions',
        headerName: '',
        width: 120,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({row}) => (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="View">
              <span>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/prints/${row.id}`);
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Edit">
              <span>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/prints/${row.id}/edit`);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteTarget(row);
                    setConfirmDelete(true);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )
      }
    ],
    []
  );

  useEffect(() => {
    const paramValue = searchParams.get('filmRollId') ?? '';
    setFilmRollFilterState((prev) => (prev === paramValue ? prev : paramValue));
  }, [searchParams]);

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setFilmRollFilterState(newValue);
    setPaginationModel((prev) => ({...prev, page: 0}));
    if (newValue) {
      setSearchParams({filmRollId: newValue});
    } else {
      setSearchParams({});
    }
  };

  const handleCreateClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate('/prints/new');
  };

  return (
    <Stack spacing={3} sx={{color: 'text.primary'}}>
      <Stack direction={{xs: 'column', md: 'row'}} spacing={2} alignItems={{md: 'center'}}>
        <Typography variant="h4" sx={{flexGrow: 1}}>
          Darkroom Prints
        </Typography>
        <Button variant="contained" onClick={handleCreateClick}>
          Record Print
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          px: {xs: 2, md: 3},
          py: {xs: 2, md: 2.5},
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, rgba(31,81,48,0.08) 0%, rgba(63,139,88,0.08) 100%)',
          border: '1px solid rgba(31,81,48,0.12)'
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Keep track of your darkroom printing sessions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Log print settings, exposure splits, and processing times for future reference.
        </Typography>
      </Paper>

      <Stack direction={{xs: 'column', md: 'row'}} spacing={2} alignItems={{md: 'center'}}>
        <TextField
          select
          label="Filter by Film Roll"
          value={filmRollFilter}
          onChange={handleFilterChange}
          sx={{width: {xs: '100%', md: 320}}}
          disabled={filmRollLoading}
        >
          <MenuItem value="">
            <Typography variant="body2" color="text.secondary">
              All film rolls
            </Typography>
          </MenuItem>
          {filmRollOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
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
          density="standard"
          disableRowSelectionOnClick
          rows={data.items}
          rowCount={data.total}
          loading={isFetching}
          pageSizeOptions={[10, 20, 50]}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          onRowClick={({row}) => setSelectedPrintRow(row)}
          columns={columns}
          getRowId={(row) => row.id}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(63,139,88,0.12)',
              fontWeight: 600
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(31,81,48,0.08)'
            },
            backgroundColor: 'transparent'
          }}
        />
      </Box>

      <Drawer
        anchor="right"
        open={!!selectedPrintRow}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: {xs: '100%', sm: 420, md: 480},
            maxWidth: '100%',
            p: 0
          }
        }}
      >
        {printDetails ? (
          <PrintDetailsPanel
            print={printDetails}
            loading={selectedPrintLoading}
            onClose={handleCloseDrawer}
            onView={() => {
              setSelectedPrintRow(null);
              navigate(`/prints/${printDetails.id}`);
            }}
            onEdit={() => {
              setSelectedPrintRow(null);
              navigate(`/prints/${printDetails.id}/edit`);
            }}
            onDelete={() => setConfirmDelete(true)}
            onOpenFilmRoll={() => {
              if (printDetails.filmRoll) {
                setSelectedPrintRow(null);
                navigate(`/film-rolls/${printDetails.filmRoll.id}`);
              }
            }}
          />
        ) : (
          <Box sx={{p: 3}}>
            <Skeleton variant="rectangular" height={120} />
          </Box>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this print?"
        description="This will remove the print record permanently."
        confirmLabel="Delete"
        onClose={() => {
          setConfirmDelete(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </Stack>
  );
}

export default PrintListPage;

function PrintDetailsPanel({
  print,
  loading,
  onClose,
  onView,
  onEdit,
  onDelete,
  onOpenFilmRoll
}: {
  print: Print;
  loading: boolean;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenFilmRoll: () => void;
}) {
  return (
    <Box sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2
        }}
      >
        <Typography variant="h6">{`Frame #${print.frameNumber}`}</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View details">
            <span>
              <IconButton onClick={onView}>
                <VisibilityIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Edit print">
            <span>
              <IconButton onClick={onEdit}>
                <EditIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete print">
            <span>
              <IconButton color="error" onClick={onDelete}>
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>
      <Divider />
      <Box sx={{px: 3, py: 2, flexGrow: 1, overflowY: 'auto'}}>
        {loading ? (
          <Skeleton variant="rectangular" height={160} sx={{borderRadius: 2}} />
        ) : (
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Film Roll
              </Typography>
              <Typography variant="body1">
                {print.filmRoll
                  ? `${print.filmRoll.filmName} (${print.filmRoll.filmId})`
                  : '—'}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={onOpenFilmRoll}
                disabled={!print.filmRoll}
                sx={{alignSelf: 'flex-start'}}
              >
                View Film Roll
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Print Settings
              </Typography>
              <InfoRow label="Paper Type" value={print.paperType} />
              <InfoRow label="Paper Size" value={print.paperSize} />
              <InfoRow label="Manufacturer" value={print.paperManufacturer} />
              <InfoRow label="Development Time" value={formatSeconds(print.developmentTimeSeconds)} />
              <InfoRow label="Fixing Time" value={formatSeconds(print.fixingTimeSeconds)} />
              <InfoRow label="Washing Time" value={formatSeconds(print.washingTimeSeconds)} />
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Split Grade Notes
              </Typography>
              <Typography variant="body2">
                {print.splitGradeInstructions ?? 'No split grade instructions recorded.'}
              </Typography>
              {print.splitGradeSteps && print.splitGradeSteps.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {print.splitGradeSteps.map((step, index) => (
                    <Chip
                      key={`${step.filter}-${index}`}
                      label={`${step.filter}: ${formatSeconds(step.exposureSeconds)}`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Timestamps
              </Typography>
              <InfoRow label="Created" value={new Date(print.createdAt).toLocaleString()} />
              <InfoRow label="Last Updated" value={new Date(print.updatedAt).toLocaleString()} />
            </Stack>
          </Stack>
        )}
      </Box>
    </Box>
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
