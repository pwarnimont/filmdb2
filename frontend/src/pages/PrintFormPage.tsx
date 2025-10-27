import {Alert, Button, Paper, Stack, Typography} from '@mui/material';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useMemo} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';

import {createPrint, getPrint, updatePrint} from '../api/prints';
import {PrintForm} from '../components/PrintForm';
import {useFilmRollOptions} from '../hooks/useFilmRollOptions';
import type {Print, PrintPayload} from '../types/api';
import {useSnackbar} from '../providers/SnackbarProvider';

interface PrintFormPageProps {
  mode: 'create' | 'edit';
}

function PrintFormPage({mode}: PrintFormPageProps) {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [searchParams] = useSearchParams();
  const isEdit = mode === 'edit';

  const {
    data: filmRollOptionsData = [],
    isLoading: filmRollLoading,
    isError: filmRollError
  } = useFilmRollOptions();

  const {
    data: existingPrint,
    isLoading: printLoading,
    isError: printError
  } = useQuery<Print>({
    queryKey: ['print', id],
    queryFn: () => getPrint(id as string),
    enabled: isEdit && !!id
  });

  const filmRollOptions = useMemo(() => {
    if (!isEdit || !existingPrint?.filmRoll) {
      return filmRollOptionsData;
    }
    const exists = filmRollOptionsData.some((option) => option.id === existingPrint.filmRollId);
    if (exists) {
      return filmRollOptionsData;
    }
    return [
      ...filmRollOptionsData,
      {
        id: existingPrint.filmRollId,
        label: `${existingPrint.filmRoll?.filmName ?? existingPrint.filmRollId} (${existingPrint.filmRoll?.filmId ?? 'Roll'})`,
        filmId: existingPrint.filmRoll?.filmId ?? existingPrint.filmRollId,
        exposures: undefined
      }
    ];
  }, [existingPrint, filmRollOptionsData, isEdit]);

  const createMutation = useMutation({
    mutationFn: (payload: PrintPayload) => createPrint(payload),
    onSuccess: async (print) => {
      snackbar.showMessage('Print recorded', 'success');
      await Promise.allSettled([
        queryClient.invalidateQueries({queryKey: ['prints']}),
        queryClient.invalidateQueries({queryKey: ['print', print.id]})
      ]);
      navigate(`/prints?filmRollId=${print.filmRollId}`);
    },
    onError: () => snackbar.showMessage('Could not save print', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: (payload: PrintPayload) => updatePrint(id as string, payload),
    onSuccess: async (print) => {
      snackbar.showMessage('Print updated', 'success');
      await Promise.allSettled([
        queryClient.invalidateQueries({queryKey: ['prints']}),
        queryClient.invalidateQueries({queryKey: ['print', id]}),
        queryClient.invalidateQueries({queryKey: ['print', print.id]})
      ]);
      navigate(`/prints/${print.id}`);
    },
    onError: () => snackbar.showMessage('Could not update print', 'error')
  });

  const handleSubmit = async (payload: PrintPayload) => {
    if (isEdit) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const initialFilmRollId = !isEdit ? searchParams.get('filmRollId') ?? '' : undefined;

  const defaultValues = useMemo(() => {
    if (isEdit) {
      if (!existingPrint) {
        return undefined;
      }
      return {
        filmRollId: existingPrint.filmRollId,
        frameNumber: existingPrint.frameNumber,
        paperType: existingPrint.paperType,
        paperSize: existingPrint.paperSize,
        paperManufacturer: existingPrint.paperManufacturer,
        developmentTimeSeconds: existingPrint.developmentTimeSeconds,
        fixingTimeSeconds: existingPrint.fixingTimeSeconds,
        washingTimeSeconds: existingPrint.washingTimeSeconds,
        splitGradeInstructions: existingPrint.splitGradeInstructions ?? '',
        splitGradeSteps: existingPrint.splitGradeSteps
      } as const;
    }
    return {
      filmRollId: initialFilmRollId
    } as Partial<PrintPayload>;
  }, [existingPrint, initialFilmRollId, isEdit]);

  const initialTimes = useMemo(
    () =>
      isEdit && existingPrint
        ? {
            developmentTimeSeconds: existingPrint.developmentTimeSeconds,
            fixingTimeSeconds: existingPrint.fixingTimeSeconds,
            washingTimeSeconds: existingPrint.washingTimeSeconds
          }
        : undefined,
    [existingPrint, isEdit]
  );

  if (filmRollError || (isEdit && printError)) {
    return <Alert severity="error">Unable to load data for the print.</Alert>;
  }

  if ((isEdit && printLoading) || filmRollLoading) {
    return (
      <Paper sx={{p: {xs: 3, md: 4}}}>
        <Typography>Loading...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{p: {xs: 3, md: 4}}}>
      <Stack spacing={3}>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} alignItems={{sm: 'center'}}>
          <Typography variant="h4" sx={{flexGrow: 1}}>
            {isEdit ? 'Edit Darkroom Print' : 'Record Darkroom Print'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              if (isEdit && id) {
                navigate(`/prints/${id}`);
              } else {
                navigate(-1);
              }
            }}
          >
            Cancel
          </Button>
        </Stack>
        <PrintForm
          filmRollOptions={filmRollOptions}
          defaultValues={defaultValues}
          initialTimes={initialTimes}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Save Print' : 'Save Print'}
          disabled={
            filmRollLoading ||
            createMutation.isPending ||
            updateMutation.isPending ||
            (isEdit && printLoading)
          }
        />
      </Stack>
    </Paper>
  );
}

export default PrintFormPage;
