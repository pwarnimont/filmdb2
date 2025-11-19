import {zodResolver} from '@hookform/resolvers/zod';
import {Button, MenuItem, Stack, TextField, Typography} from '@mui/material';
import {Controller, useForm} from 'react-hook-form';
import {z} from 'zod';

import type {Camera, CameraPayload} from '../types/api';

const filmTypes = ['35mm', '120', '110', '620', '4x5', '8x10', 'instant', 'digital', 'other'] as const;

const schema = z.object({
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  releaseDate: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  filmType: z.string().min(1, 'Film type is required'),
  lensesText: z.string().min(1, 'List at least one lens'),
  notes: z.string().optional()
});

type CameraFormValues = z.infer<typeof schema>;

const formatDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');

const formatLenses = (lenses?: string[]) => (lenses && lenses.length > 0 ? lenses.join('\n') : '');

const parseLensList = (value: string): string[] =>
  value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

interface CameraFormProps {
  defaultValues?: Partial<Camera>;
  onSubmit: (values: CameraPayload) => Promise<void>;
  submitLabel?: string;
}

export function CameraForm({defaultValues, onSubmit, submitLabel = 'Save'}: CameraFormProps) {
  const {
    control,
    handleSubmit,
    register,
    formState: {errors, isSubmitting}
  } = useForm<CameraFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      manufacturer: defaultValues?.manufacturer ?? '',
      model: defaultValues?.model ?? '',
      releaseDate: formatDateInput(defaultValues?.releaseDate),
      purchaseDate: formatDateInput(defaultValues?.purchaseDate),
      filmType: defaultValues?.filmType ?? '35mm',
      lensesText: formatLenses(defaultValues?.lenses),
      notes: defaultValues?.notes ?? ''
    }
  });

  const submitHandler = handleSubmit(async (values) => {
    const lenses = parseLensList(values.lensesText);
    const payload: CameraPayload = {
      manufacturer: values.manufacturer.trim(),
      model: values.model.trim(),
      releaseDate: values.releaseDate ? new Date(values.releaseDate).toISOString() : null,
      purchaseDate: values.purchaseDate ? new Date(values.purchaseDate).toISOString() : null,
      filmType: values.filmType,
      lenses,
      notes: values.notes?.trim() ? values.notes.trim() : null
    };
    await onSubmit(payload);
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={submitHandler}>
      <Stack spacing={0.5}>
        <Typography variant="body2" color="text.secondary">
          Required
        </Typography>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
          <TextField
            label="Manufacturer"
            fullWidth
            {...register('manufacturer')}
            error={!!errors.manufacturer}
            helperText={errors.manufacturer?.message}
          />
          <TextField
            label="Model"
            fullWidth
            {...register('model')}
            error={!!errors.model}
            helperText={errors.model?.message}
          />
        </Stack>
      </Stack>

      <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
        <TextField
          label="Release Date"
          type="date"
          fullWidth
          {...register('releaseDate')}
          InputLabelProps={{shrink: true}}
          error={!!errors.releaseDate}
          helperText={errors.releaseDate?.message}
        />
        <TextField
          label="Purchase Date"
          type="date"
          fullWidth
          {...register('purchaseDate')}
          InputLabelProps={{shrink: true}}
          error={!!errors.purchaseDate}
          helperText={errors.purchaseDate?.message}
        />
      </Stack>

      <Controller
        control={control}
        name="filmType"
        render={({field}) => (
          <TextField select label="Film Type" fullWidth {...field}>
            {filmTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type.toUpperCase()}
              </MenuItem>
            ))}
          </TextField>
        )}
      />

      <TextField
        label="Lenses"
        multiline
        minRows={3}
        placeholder="Enter one lens per line"
        {...register('lensesText')}
        error={!!errors.lensesText}
        helperText={errors.lensesText?.message ?? 'Separate entries by new lines or commas'}
      />

      <TextField
        label="Notes"
        multiline
        minRows={3}
        {...register('notes')}
        placeholder="Optional notes about quirks, service history, or accessories"
      />

      <Button type="submit" variant="contained" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </Stack>
  );
}
