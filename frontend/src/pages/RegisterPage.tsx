import {useEffect} from 'react';
import {zodResolver} from '@hookform/resolvers/zod';
import {Alert, Box, Button, Link, Paper, Stack, TextField, Typography} from '@mui/material';
import {useForm} from 'react-hook-form';
import {useNavigate} from 'react-router-dom';
import {z} from 'zod';

import {useAuth} from '../providers/AuthProvider';
import {useSnackbar} from '../providers/SnackbarProvider';

const schema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({code: 'custom', message: 'Passwords do not match', path: ['confirmPassword']});
    }
  });

type RegisterFormValues = z.infer<typeof schema>;

function RegisterPage() {
  const {register: registerField, handleSubmit, formState} = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {email: '', password: '', confirmPassword: ''}
  });
  const {register, user, allowRegistration} = useAuth();
  const snackbar = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/film-rolls');
    }
  }, [user, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    if (!allowRegistration) {
      snackbar.showMessage('Registration is currently disabled', 'warning');
      return;
    }
    try {
      await register(values.email, values.password);
      navigate('/film-rolls');
    } catch (error) {
      snackbar.showMessage('Registration failed. Try a different email.', 'error');
    }
  });

  return (
    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100'}}>
      <Paper elevation={1} sx={{p: 4, minWidth: 360}}>
        <Stack spacing={3} component="form" onSubmit={onSubmit}>
          <div>
            <Typography variant="h5" gutterBottom>
              Create your account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start cataloging your film rolls.
            </Typography>
          </div>
          {!allowRegistration && (
            <Alert severity="warning">Registration is currently disabled by an administrator.</Alert>
          )}
          <TextField
            label="Email"
            type="email"
            {...registerField('email')}
            error={!!formState.errors.email}
            helperText={formState.errors.email?.message}
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            {...registerField('password')}
            error={!!formState.errors.password}
            helperText={formState.errors.password?.message}
            fullWidth
          />
          <TextField
            label="Confirm Password"
            type="password"
            {...registerField('confirmPassword')}
            error={!!formState.errors.confirmPassword}
            helperText={formState.errors.confirmPassword?.message}
            fullWidth
          />
          <Button type="submit" variant="contained" color="primary" disabled={!allowRegistration}>
            Register
          </Button>
          <Typography variant="body2" textAlign="center">
            Already have an account?{' '}
            <Link component="button" onClick={() => navigate('/login')} underline="hover">
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

export default RegisterPage;
