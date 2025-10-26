import {zodResolver} from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import {Controller, useForm} from 'react-hook-form';
import {z} from 'zod';

import type {FilmRollPayload} from '../types/api';

const filmFormats = ['35mm', '6x6', '6x4_5', '6x7', '6x9', 'other'] as const;
const filmFormatLabels: Record<(typeof filmFormats)[number], string> = {
  '35mm': '35mm',
  '6x6': '6x6',
  '6x4_5': '6x4.5',
  '6x7': '6x7',
  '6x9': '6x9',
  other: 'Other'
};

const schema = z.object({
  filmId: z.string().min(1, 'Film ID is required'),
  filmName: z.string().min(1, 'Film name is required'),
  boxIso: z.number({invalid_type_error: 'Box ISO must be a number'})
    .int('Box ISO must be an integer')
    .positive('Box ISO must be positive'),
  shotIso: z
    .number({invalid_type_error: 'Shot ISO must be a number'})
    .int('Shot ISO must be an integer')
    .positive('Shot ISO must be positive')
    .nullable()
    .optional(),
  dateShot: z.string().optional().nullable(),
  cameraName: z.string().optional().nullable(),
  filmFormat: z.enum(filmFormats),
  exposures: z
    .number({invalid_type_error: 'Exposures must be a number'})
    .int('Exposures must be an integer')
    .positive('Exposures must be positive'),
  isDeveloped: z.boolean().optional()
});

type FilmRollFormValues = z.infer<typeof schema>;

interface FilmRollFormProps {
  defaultValues?: Partial<FilmRollFormValues>;
  onSubmit: (values: FilmRollPayload) => Promise<void>;
  submitLabel?: string;
}

export function FilmRollForm({defaultValues, onSubmit, submitLabel = 'Save'}: FilmRollFormProps) {
  const {
    control,
    handleSubmit,
    register,
    formState: {errors, isSubmitting}
  } = useForm<FilmRollFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      filmId: '',
      filmName: '',
      boxIso: 100,
      shotIso: null,
      dateShot: '',
      cameraName: '',
      filmFormat: '35mm',
      exposures: 36,
      isDeveloped: false,
      ...defaultValues
    }
  });

  const onValid = handleSubmit(async (values) => {
    const payload: FilmRollPayload = {
      filmId: values.filmId,
      filmName: values.filmName,
      boxIso: values.boxIso,
      shotIso: values.shotIso ?? null,
      dateShot: values.dateShot ? new Date(values.dateShot).toISOString() : null,
      cameraName: values.cameraName ?? null,
      filmFormat: values.filmFormat,
      exposures: values.exposures,
      isDeveloped: values.isDeveloped
    };

    await onSubmit(payload);
  });

  return (
    <Box component="form" onSubmit={onValid} noValidate>
      <Stack spacing={3}>
        <Typography variant="h6">Film Roll Details</Typography>
        <TextField
          label="Film Identifier"
          fullWidth
          {...register('filmId')}
          error={!!errors.filmId}
          helperText={errors.filmId?.message}
        />
        <TextField
          label="Film Name"
          fullWidth
          {...register('filmName')}
          error={!!errors.filmName}
          helperText={errors.filmName?.message}
        />
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
          <TextField
            label="Box ISO"
            type="number"
            fullWidth
            {...register('boxIso', {valueAsNumber: true})}
            error={!!errors.boxIso}
            helperText={errors.boxIso?.message}
          />
          <TextField
            label="Shot ISO"
            type="number"
            fullWidth
            {...register('shotIso', {setValueAs: (value) => (value === '' ? null : Number(value))})}
            error={!!errors.shotIso}
            helperText={errors.shotIso?.message}
          />
        </Stack>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
          <TextField
            label="Date Shot"
            type="date"
            fullWidth
            {...register('dateShot')}
            InputLabelProps={{shrink: true}}
            error={!!errors.dateShot}
            helperText={errors.dateShot?.message}
          />
          <TextField
            label="Camera Name"
            fullWidth
            {...register('cameraName')}
            error={!!errors.cameraName}
            helperText={errors.cameraName?.message}
          />
        </Stack>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
          <Controller
            control={control}
            name="filmFormat"
            render={({field}) => (
              <TextField select label="Film Format" fullWidth {...field}>
                {filmFormats.map((format) => (
                  <MenuItem key={format} value={format}>
                    {filmFormatLabels[format]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            label="Exposures"
            type="number"
            fullWidth
            {...register('exposures', {valueAsNumber: true})}
            error={!!errors.exposures}
            helperText={errors.exposures?.message}
          />
        </Stack>
        <FormControlLabel
          control={
            <Controller
              control={control}
              name="isDeveloped"
              render={({field}) => <Switch color="primary" {...field} checked={field.value ?? false} />}
            />
          }
          label="Developed"
        />
        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </Stack>
    </Box>
  );
}
