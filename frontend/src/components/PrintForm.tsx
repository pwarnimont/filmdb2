import {zodResolver} from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {Controller, useFieldArray, useForm} from 'react-hook-form';
import {z} from 'zod';

import type {FilmRollOption} from '../hooks/useFilmRollOptions';
import type {PrintPayload, SplitGradeStep} from '../types/api';

interface PrintFormProps {
  defaultValues?: Partial<PrintPayload & {splitGradeSteps: SplitGradeStep[] | null}>;
  initialTimes?: {
    developmentTimeSeconds?: number;
    fixingTimeSeconds?: number;
    washingTimeSeconds?: number;
  };
  filmRollOptions: FilmRollOption[];
  onSubmit: (payload: PrintPayload) => Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}

const timePattern = /^[0-9]{1,2}:[0-9]{2}$/u;

const timeField = z
  .string()
  .min(1, 'Time is required')
  .refine((value) => timePattern.test(value), {message: 'Use mm:ss format, e.g. 02:30'});

const splitGradeStepSchema = z.object({
  filter: z.string().min(1, 'Filter is required'),
  exposure: timeField
});

const schema = z.object({
  filmRollId: z.string().min(1, 'Select a film roll'),
  frameNumber: z
    .number({invalid_type_error: 'Frame number must be a number'})
    .int('Frame number must be an integer')
    .positive('Frame number must be positive'),
  paperType: z.string().min(1, 'Paper type is required'),
  paperSize: z.string().min(1, 'Paper size is required'),
  paperManufacturer: z.string().min(1, 'Paper manufacturer is required'),
  developmentTime: timeField,
  fixingTime: timeField,
  washingTime: timeField,
  splitGradeInstructions: z.string().optional(),
  splitGradeSteps: z.array(splitGradeStepSchema).optional()
});

type PrintFormValues = z.infer<typeof schema>;

function secondsToTimeString(value?: number) {
  if (value === undefined || value === null) {
    return '';
  }
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function timeStringToSeconds(value: string) {
  const [minutes, seconds] = value.split(':').map(Number);
  return minutes * 60 + seconds;
}

export function PrintForm({
  defaultValues,
  initialTimes,
  filmRollOptions,
  onSubmit,
  submitLabel = 'Save Print',
  disabled
}: PrintFormProps) {
  const {
    control,
    handleSubmit,
    register,
    formState: {errors, isSubmitting},
    watch
  } = useForm<PrintFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      filmRollId: defaultValues?.filmRollId ?? '',
      frameNumber: defaultValues?.frameNumber ?? 1,
      paperType: defaultValues?.paperType ?? '',
      paperSize: defaultValues?.paperSize ?? '',
      paperManufacturer: defaultValues?.paperManufacturer ?? '',
      developmentTime: secondsToTimeString(initialTimes?.developmentTimeSeconds ?? defaultValues?.developmentTimeSeconds),
      fixingTime: secondsToTimeString(initialTimes?.fixingTimeSeconds ?? defaultValues?.fixingTimeSeconds),
      washingTime: secondsToTimeString(initialTimes?.washingTimeSeconds ?? defaultValues?.washingTimeSeconds),
      splitGradeInstructions: defaultValues?.splitGradeInstructions ?? '',
      splitGradeSteps:
        defaultValues?.splitGradeSteps?.map((step) => ({
          filter: step.filter,
          exposure: secondsToTimeString(step.exposureSeconds)
        })) ?? []
    }
  });

  const {fields, append, remove} = useFieldArray({
    control,
    name: 'splitGradeSteps'
  });

  const selectedFilmRollId = watch('filmRollId');
  const selectedFilmRoll = filmRollOptions.find((option) => option.id === selectedFilmRollId);

  const handleAddStep = () => {
    append({filter: '', exposure: '00:30'});
  };

  const onValid = handleSubmit(async (values) => {
    const payload: PrintPayload = {
      filmRollId: values.filmRollId,
      frameNumber: values.frameNumber,
      paperType: values.paperType,
      paperSize: values.paperSize,
      paperManufacturer: values.paperManufacturer,
      developmentTimeSeconds: timeStringToSeconds(values.developmentTime),
      fixingTimeSeconds: timeStringToSeconds(values.fixingTime),
      washingTimeSeconds: timeStringToSeconds(values.washingTime),
      splitGradeInstructions: values.splitGradeInstructions?.trim()
        ? values.splitGradeInstructions.trim()
        : null,
      splitGradeSteps:
        values.splitGradeSteps && values.splitGradeSteps.length > 0
          ? values.splitGradeSteps.map((step) => ({
              filter: step.filter,
              exposureSeconds: timeStringToSeconds(step.exposure)
            }))
          : null
    };

    await onSubmit(payload);
  });

  return (
    <Box component="form" onSubmit={onValid} noValidate>
      <Stack spacing={3}>
        <div>
          <Typography variant="h6" gutterBottom>
            Print Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Document your darkroom print, including paper selection and processing steps.
          </Typography>
        </div>
        {filmRollOptions.length === 0 && (
          <Alert severity="warning">
            You do not have any film rolls yet. Please add a roll before recording prints.
          </Alert>
        )}
        <Controller
          control={control}
          name="filmRollId"
          render={({field}) => (
            <TextField
              select
              label="Film Roll"
              fullWidth
              {...field}
              error={!!errors.filmRollId}
              helperText={
                errors.filmRollId?.message ??
                (selectedFilmRoll
                  ? `Film ID: ${selectedFilmRoll.filmId}${
                      selectedFilmRoll.exposures ? ` • ${selectedFilmRoll.exposures} frames` : ''
                    }`
                  : 'Choose the roll used for this print')
              }
              disabled={disabled || filmRollOptions.length === 0}
            >
              {filmRollOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
          <TextField
            label="Frame Number"
            type="number"
            fullWidth
            inputProps={{min: 1}}
            {...register('frameNumber', {valueAsNumber: true})}
            error={!!errors.frameNumber}
            helperText={
              errors.frameNumber?.message ??
              (selectedFilmRoll?.exposures
                ? `Roll contains ${selectedFilmRoll.exposures} frames`
                : undefined)
            }
            disabled={disabled}
          />
          <TextField
            label="Paper Type"
            fullWidth
            {...register('paperType')}
            error={!!errors.paperType}
            helperText={errors.paperType?.message}
            disabled={disabled}
          />
        </Stack>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
          <TextField
            label="Paper Size"
            fullWidth
            {...register('paperSize')}
            error={!!errors.paperSize}
            helperText={errors.paperSize?.message}
            disabled={disabled}
          />
          <TextField
            label="Paper Manufacturer"
            fullWidth
            {...register('paperManufacturer')}
            error={!!errors.paperManufacturer}
            helperText={errors.paperManufacturer?.message}
            disabled={disabled}
          />
        </Stack>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
          <TextField
            label="Development Time (mm:ss)"
            fullWidth
            {...register('developmentTime')}
            error={!!errors.developmentTime}
            helperText={errors.developmentTime?.message ?? 'Total time the print stayed in developer'}
            disabled={disabled}
          />
          <TextField
            label="Fixing Time (mm:ss)"
            fullWidth
            {...register('fixingTime')}
            error={!!errors.fixingTime}
            helperText={errors.fixingTime?.message}
            disabled={disabled}
          />
          <TextField
            label="Washing Time (mm:ss)"
            fullWidth
            {...register('washingTime')}
            error={!!errors.washingTime}
            helperText={errors.washingTime?.message}
            disabled={disabled}
          />
        </Stack>

        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1">Split Grade Steps</Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={handleAddStep}
              disabled={disabled}
            >
              Add Step
            </Button>
          </Stack>
          {fields.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Add optional split grade exposures with their filters and times.
            </Typography>
          )}
          <Stack spacing={1.5}>
            {fields.map((field, index) => (
              <Stack
                key={field.id}
                direction={{xs: 'column', sm: 'row'}}
                spacing={1.5}
                alignItems={{sm: 'center'}}
              >
                <TextField
                  label="Filter"
                  fullWidth
                  {...register(`splitGradeSteps.${index}.filter` as const)}
                  error={!!errors.splitGradeSteps?.[index]?.filter}
                  helperText={errors.splitGradeSteps?.[index]?.filter?.message}
                  disabled={disabled}
                />
                <TextField
                  label="Exposure (mm:ss)"
                  fullWidth
                  {...register(`splitGradeSteps.${index}.exposure` as const)}
                  error={!!errors.splitGradeSteps?.[index]?.exposure}
                  helperText={errors.splitGradeSteps?.[index]?.exposure?.message}
                  disabled={disabled}
                />
                <IconButton
                  aria-label="Remove step"
                  color="error"
                  onClick={() => remove(index)}
                  disabled={disabled}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <TextField
          label="Split Grade Instructions"
          placeholder="Notes on filter changes, dodging/burning, etc."
          multiline
          minRows={3}
          fullWidth
          {...register('splitGradeInstructions')}
          error={!!errors.splitGradeInstructions}
          helperText={errors.splitGradeInstructions?.message}
          disabled={disabled}
        />

        <Button type="submit" variant="contained" disabled={disabled || isSubmitting}>
          {submitLabel}
        </Button>
      </Stack>
    </Box>
  );
}
