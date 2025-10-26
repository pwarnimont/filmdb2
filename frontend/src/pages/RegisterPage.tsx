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
    firstName: z.string().min(1, 'Enter your first name'),
    lastName: z.string().min(1, 'Enter your last name'),
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
    defaultValues: {firstName: '', lastName: '', email: '', password: '', confirmPassword: ''}
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
      await register(values.email, values.password, values.firstName, values.lastName);
      navigate('/film-rolls');
    } catch (error) {
      snackbar.showMessage('Registration failed. Try a different email.', 'error');
    }
  });

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #f1f6ff 0%, #e4ecfd 45%, #f9f9ff 100%)',
        px: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: {xs: 3, sm: 4},
          minWidth: {xs: '100%', sm: 380},
          borderRadius: 3,
          boxShadow: '0 24px 44px rgba(18, 46, 76, 0.12)',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(237, 244, 254, 0.95) 100%)'
        }}
      >
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
          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
            <TextField
              label="First Name"
              {...registerField('firstName')}
              error={!!formState.errors.firstName}
              helperText={formState.errors.firstName?.message}
              fullWidth
            />
            <TextField
              label="Last Name"
              {...registerField('lastName')}
              error={!!formState.errors.lastName}
              helperText={formState.errors.lastName?.message}
              fullWidth
            />
          </Stack>
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
