import {zodResolver} from '@hookform/resolvers/zod';
import {Button, Stack, TextField} from '@mui/material';
import {useForm} from 'react-hook-form';
import {z} from 'zod';

import type {DevelopmentPayload} from '../types/api';

const schema = z.object({
  developer: z.string().min(1, 'Developer is required'),
  temperatureC: z
    .number({invalid_type_error: 'Temperature must be a number'})
    .min(0, 'Temperature must be positive')
    .max(100, 'Temperature too high'),
  dilution: z.string().min(1, 'Dilution is required'),
  time: z
    .string()
    .regex(/^[0-9]{1,2}:[0-9]{2}$/u, 'Use mm:ss format, e.g. 08:30'),
  dateDeveloped: z.string().min(1, 'Date developed is required'),
  agitationScheme: z.string().min(1, 'Agitation scheme is required')
});

type DevelopmentFormValues = z.infer<typeof schema>;

interface DevelopmentFormProps {
  initialValues?: Partial<DevelopmentPayload>;
  onSubmit: (values: DevelopmentPayload) => Promise<void>;
  submitLabel?: string;
}

function toTimeString(seconds: number | undefined) {
  if (!seconds && seconds !== 0) {
    return '';
  }
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export function DevelopmentForm({initialValues, onSubmit, submitLabel = 'Save'}: DevelopmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting}
  } = useForm<DevelopmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      developer: initialValues?.developer ?? '',
      temperatureC: initialValues?.temperatureC ?? 20,
      dilution: initialValues?.dilution ?? '1+9',
      time: toTimeString(initialValues?.timeSeconds),
      dateDeveloped: initialValues?.dateDeveloped
        ? initialValues.dateDeveloped.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      agitationScheme: initialValues?.agitationScheme ?? ''
    }
  });

  const convertTimeToSeconds = (value: string) => {
    const [minutes, seconds] = value.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const onValid = handleSubmit(async (values) => {
    const payload: DevelopmentPayload = {
      developer: values.developer,
      temperatureC: values.temperatureC,
      dilution: values.dilution,
      timeSeconds: convertTimeToSeconds(values.time),
      dateDeveloped: new Date(values.dateDeveloped).toISOString(),
      agitationScheme: values.agitationScheme
    };

    await onSubmit(payload);
  });

  return (
    <Stack component="form" spacing={2} onSubmit={onValid}>
      <TextField
        label="Developer"
        fullWidth
        {...register('developer')}
        error={!!errors.developer}
        helperText={errors.developer?.message}
      />
      <TextField
        label="Temperature (°C)"
        type="number"
        fullWidth
        {...register('temperatureC', {valueAsNumber: true})}
        error={!!errors.temperatureC}
        helperText={errors.temperatureC?.message}
      />
      <TextField
        label="Dilution"
        fullWidth
        {...register('dilution')}
        error={!!errors.dilution}
        helperText={errors.dilution?.message}
      />
      <TextField
        label="Development Time (mm:ss)"
        fullWidth
        {...register('time')}
        error={!!errors.time}
        helperText={errors.time?.message}
      />
      <TextField
        label="Date Developed"
        type="date"
        fullWidth
        InputLabelProps={{shrink: true}}
        {...register('dateDeveloped')}
        error={!!errors.dateDeveloped}
        helperText={errors.dateDeveloped?.message}
      />
      <TextField
        label="Agitation Scheme"
        multiline
        minRows={3}
        fullWidth
        {...register('agitationScheme')}
        error={!!errors.agitationScheme}
        helperText={errors.agitationScheme?.message}
      />
      <Button type="submit" variant="contained" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </Stack>
  );
}
