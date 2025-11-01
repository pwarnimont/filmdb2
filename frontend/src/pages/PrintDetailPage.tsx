import {useState} from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNavigate, useParams} from 'react-router-dom';

import {deletePrint, getPrint} from '../api/prints';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {useSnackbar} from '../providers/SnackbarProvider';
import type {Print} from '../types/api';
import {getSplitGradeChipStyles} from '../utils/splitGradeColors';

function formatTime(value: number) {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function PrintDetailPage() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const theme = useTheme();

  const {
    data: print,
    isLoading,
    isError
  } = useQuery<Print>({
    queryKey: ['print', id],
    queryFn: () => getPrint(id as string),
    enabled: !!id
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePrint(id as string),
    onSuccess: async () => {
      snackbar.showMessage('Print deleted', 'info');
      setConfirmDelete(false);
      await queryClient.invalidateQueries({queryKey: ['prints']});
      navigate('/prints');
    },
    onError: () => snackbar.showMessage('Could not delete print', 'error')
  });

  if (isLoading) {
    return <Typography>Loading print details...</Typography>;
  }

  if (isError || !print) {
    return <Alert severity="error">Unable to load the requested print.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" spacing={2}>
        <Typography variant="h4">Print of Frame #{print.frameNumber}</Typography>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={1}>
          <Button variant="outlined" onClick={() => navigate(`/prints/${print.id}/edit`)}>
            Edit
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (print.filmRoll) {
                navigate(`/film-rolls/${print.filmRoll.id}`);
              }
            }}
            disabled={!print.filmRoll}
          >
            View Film Roll
          </Button>
          <Button color="error" variant="contained" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardHeader
          title="Print Details"
          subheader={
            print.filmRoll
              ? `${print.filmRoll.filmName} (${print.filmRoll.filmId})`
              : 'Film roll information unavailable'
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <InfoRow label="Frame Number" value={String(print.frameNumber)} />
              <InfoRow label="Paper Type" value={print.paperType} />
              <InfoRow label="Paper Size" value={print.paperSize} />
              <InfoRow label="Manufacturer" value={print.paperManufacturer} />
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoRow label="Development Time" value={formatTime(print.developmentTimeSeconds)} />
              <InfoRow label="Fixing Time" value={formatTime(print.fixingTimeSeconds)} />
              <InfoRow label="Washing Time" value={formatTime(print.washingTimeSeconds)} />
              <InfoRow
                label="Created"
                value={new Date(print.createdAt).toLocaleString()}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Split Grade Notes" />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              {print.splitGradeInstructions ?? 'No split grade instructions recorded.'}
            </Typography>
            {print.splitGradeSteps && print.splitGradeSteps.length > 0 && (
              <>
                <Divider />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {print.splitGradeSteps.map((step, index) => (
                    <Chip
                      key={`${step.filter}-${index}`}
                      label={`${step.filter}: ${formatTime(step.exposureSeconds)}`}
                      variant="filled"
                      sx={getSplitGradeChipStyles(step.filter, theme)}
                    />
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this print?"
        description="This action will remove the print record permanently."
        confirmLabel="Delete"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
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

export default PrintDetailPage;
