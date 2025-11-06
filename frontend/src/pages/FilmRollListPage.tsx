import {useMemo, useRef, useState} from 'react';
import type {ChangeEvent, ReactNode} from 'react';
import {
  Box,
  Button,
  Collapse,
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
import {alpha, useTheme} from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/PrintOutlined';
import UploadIcon from '@mui/icons-material/UploadOutlined';
import TimelineIcon from '@mui/icons-material/TimelineOutlined';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';

import {
  deleteFilmRoll,
  listFilmRolls,
  markDeveloped,
  type FilmRollFilters
} from '../api/filmRolls';
import {exportBackup, importBackup} from '../api/backups';
import type {
  BackupImportPayload,
  FilmRoll,
  PaginatedFilmRolls,
  Print
} from '../types/api';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {DevelopmentForm} from '../components/DevelopmentForm';
import {
  DevelopmentHistoryHeatmap,
  type DevelopmentHistoryMap
} from '../components/DevelopmentHistoryHeatmap';
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
  const [showHistory, setShowHistory] = useState(false);
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportBackup = async () => {
    try {
      const snapshot = await exportBackup();
      const timestamp = new Date(snapshot.generatedAt ?? new Date().toISOString())
        .toISOString()
        .replace(/[:.]/g, '-');
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `film-manager-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      snackbar.showMessage('Backup exported', 'success');
    } catch (error) {
      console.error(error);
      snackbar.showMessage('Could not export backup', 'error');
    }
  };

  const handleImportBackupClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportBackupSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as Partial<BackupImportPayload> & {
        generatedAt?: string;
      };

      if (!Array.isArray(parsed.filmRolls)) {
        throw new Error('Invalid backup structure');
      }

      const filmRolls = parsed.filmRolls as FilmRoll[];
      const printMap = new Map<string, Print>();

      for (const roll of filmRolls) {
        if (Array.isArray(roll.prints)) {
          for (const nestedPrint of roll.prints) {
            printMap.set(nestedPrint.id, nestedPrint);
          }
        }
      }

      if (Array.isArray(parsed.prints)) {
        for (const print of parsed.prints as Print[]) {
          printMap.set(print.id, print);
        }
      }

      const payload: BackupImportPayload = {
        filmRolls,
        prints: Array.from(printMap.values())
      };

      if (Array.isArray(parsed.users)) {
        payload.users = parsed.users;
      }

      const summary = await importBackup(payload);
      const filmRollTotal = summary.filmRollsCreated + summary.filmRollsUpdated;
      const printTotal = summary.printsCreated + summary.printsUpdated;

      snackbar.showMessage(
        `Imported ${filmRollTotal} film rolls and ${printTotal} prints`,
        'success'
      );

      await Promise.all([
        queryClient.invalidateQueries({queryKey: ['film-rolls']}),
        queryClient.invalidateQueries({queryKey: ['film-rolls', 'stats']}),
        queryClient.invalidateQueries({queryKey: ['prints']})
      ]);
    } catch (error) {
      console.error(error);
      snackbar.showMessage('Could not import backup. Please verify the file.', 'error');
    } finally {
      event.target.value = '';
    }
  };

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

  const {data: historySource, isLoading: historyLoading, isFetching: historyFetching} = useQuery({
    queryKey: ['film-rolls', 'history'],
    staleTime: 1000 * 60 * 2,
    enabled: showHistory,
    queryFn: async () => {
      const pageSize = 100; // backend max page size per film-roll.schema
      let page = 1;
      let total = Infinity;
      const collected: FilmRoll[] = [];

      while (collected.length < total) {
        const response = await listFilmRolls({page, pageSize});
        collected.push(...response.items);
        total = response.total;
        if (response.items.length < pageSize) {
          break;
        }
        page += 1;
      }

      return collected;
    }
  });

  const historyMap = useMemo<DevelopmentHistoryMap>(() => {
    if (!historySource) {
      return {};
    }

    const map: DevelopmentHistoryMap = {};

    const addEntry = (value: string | null | undefined, type: 'shot' | 'developed') => {
      if (!value) {
        return;
      }
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }
      parsed.setHours(0, 0, 0, 0);
      const key = `${parsed.getFullYear()}-${`${parsed.getMonth() + 1}`.padStart(2, '0')}-${`${parsed.getDate()}`.padStart(2, '0')}`;

      const existing = map[key] ?? {total: 0, shot: 0, developed: 0};
      if (type === 'shot') {
        existing.shot += 1;
      } else {
        existing.developed += 1;
      }
      existing.total = existing.shot + existing.developed;
      map[key] = existing;
    };

    for (const roll of historySource) {
      addEntry(roll.dateShot, 'shot');
      addEntry(roll.development?.dateDeveloped, 'developed');
    }

    return map;
  }, [historySource]);

  const heatmapLoading = showHistory && (historyLoading || historyFetching) && !historySource;

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
        field: 'isScanned',
        headerName: 'Scanned',
        width: 140,
        sortable: false,
        renderCell: ({row}) =>
          row.isScanned ? (
            <Tooltip title={row.scanFolder ?? 'Scans available'}>
              <Typography variant="body2" component="span">
                {row.scanFolder ? `Yes (${row.scanFolder})` : 'Yes'}
              </Typography>
            </Tooltip>
          ) : (
            'No'
          )
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
            <Tooltip title="Record print from this roll">
              <IconButton
                aria-label="Record print"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/prints/new?filmRollId=${row.id}`);
                }}
              >
                <PrintIcon fontSize="small" />
              </IconButton>
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
      <Stack spacing={2}>
        <Stack
          direction={{xs: 'column', md: 'row'}}
          spacing={2}
          alignItems={{xs: 'flex-start', md: 'center'}}
          justifyContent="space-between"
        >
          <Typography variant="h4">Film Rolls</Typography>
          <Stack direction={{xs: 'column', sm: 'row'}} spacing={1.5}>
            <Button variant="contained" onClick={() => navigate('/film-rolls/new')}>
              Add Film Roll
            </Button>
            <Button variant="outlined" onClick={() => navigate('/prints/new')}>
              Record Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportBackup}
            >
              Export Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleImportBackupClick}
            >
              Import Backup
            </Button>
          </Stack>
        </Stack>
      </Stack>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportBackupSelected}
        hidden
      />
      <StatisticsStrip stats={stats} loading={statsLoading} />
      <Stack spacing={1.5}>
        <Button
          variant={showHistory ? 'contained' : 'outlined'}
          color="success"
          startIcon={<TimelineIcon />}
          onClick={() => setShowHistory((prev) => !prev)}
          sx={{alignSelf: {xs: 'stretch', sm: 'flex-start'}}}
        >
          {showHistory ? 'Hide Development History' : 'Show Development History'}
        </Button>
        <Collapse in={showHistory} timeout="auto" unmountOnExit>
          <DevelopmentHistoryHeatmap data={historyMap} loading={heatmapLoading} />
        </Collapse>
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
      <Box
        sx={{
          width: '100%',
          bgcolor: isDark ? alpha(theme.palette.background.paper, 0.85) : alpha('#ffffff', 0.9),
          borderRadius: {xs: 2, md: 2.5},
          boxShadow: isDark ? '0 16px 32px rgba(5, 15, 10, 0.7)' : '0 18px 36px rgba(18, 46, 76, 0.08)',
          border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.4 : 0.12)}`,
          backdropFilter: 'blur(6px)',
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
            backgroundColor: 'transparent',
            color: 'text.primary',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: isDark
                ? alpha(theme.palette.secondary.main, 0.18)
                : alpha(theme.palette.primary.main, 0.08),
              fontWeight: 600,
              borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.6 : 0.2)}`
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: isDark
                ? alpha(theme.palette.secondary.main, 0.14)
                : alpha(theme.palette.primary.main, 0.06),
              borderTop: `1px solid ${alpha(theme.palette.divider, isDark ? 0.6 : 0.2)}`
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: alpha(theme.palette.secondary.main, isDark ? 0.24 : 0.12)
            },
            '& .MuiDataGrid-withBorderColor': {
              borderColor: alpha(theme.palette.divider, isDark ? 0.6 : 0.18)
            },
            '& .MuiDataGrid-cell': {
              borderColor: alpha(theme.palette.divider, isDark ? 0.6 : 0.18)
            }
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
          <InfoRow
            label="Scanned"
            value={
              film.isScanned ? (film.scanFolder ? `Yes – ${film.scanFolder}` : 'Yes') : 'No'
            }
          />
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
  const cards: Array<{
    label: string;
    value: string | number;
    helper?: string;
    background: string;
    border: string;
  }> = [
    {
      label: 'Total Rolls',
      value: stats?.total ?? '—',
      background: 'rgba(29, 53, 87, 0.06)',
      border: '1px solid rgba(29, 53, 87, 0.12)'
    },
    {
      label: 'Developed',
      value: stats?.developed ?? '—',
      helper: stats ? `${stats.developedPercentage}% of collection` : undefined,
      background: 'rgba(42, 157, 143, 0.08)',
      border: '1px solid rgba(42, 157, 143, 0.16)'
    },
    {
      label: 'Undeveloped',
      value: stats?.undeveloped ?? '—',
      background: 'rgba(230, 57, 70, 0.06)',
      border: '1px solid rgba(230, 57, 70, 0.12)'
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
            border: card.border,
            backgroundColor: card.background,
            color: 'text.primary',
            boxShadow: 'none'
          }}
        >
          {loading ? (
            <Skeleton variant="rectangular" height={64} sx={{bgcolor: 'rgba(255,255,255,0.4)'}} />
          ) : (
            <Stack spacing={0.5}>
              <Typography variant="overline" sx={{letterSpacing: 1.2, color: 'text.secondary'}}>
                {card.label}
              </Typography>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {card.value}
              </Typography>
              {card.helper && (
                <Typography variant="caption" sx={{color: 'text.secondary'}}>
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
