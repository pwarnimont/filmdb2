import {useEffect} from 'react';
import {zodResolver} from '@hookform/resolvers/zod';
import {Box, Button, Link, Paper, Stack, TextField, Typography} from '@mui/material';
import {useForm} from 'react-hook-form';
import {useLocation, useNavigate} from 'react-router-dom';
import type {Location} from 'react-router-dom';
import {z} from 'zod';

import {useAuth} from '../providers/AuthProvider';
import {useSnackbar} from '../providers/SnackbarProvider';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type LoginFormValues = z.infer<typeof schema>;

function LoginPage() {
  const {register: registerField, handleSubmit, formState} = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {email: '', password: ''}
  });
  const {login, user, allowRegistration} = useAuth();
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate('/film-rolls');
    }
  }, [user, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      const redirectTo = (location.state as {from?: Location})?.from?.pathname ?? '/film-rolls';
      navigate(redirectTo, {replace: true});
    } catch (error) {
      snackbar.showMessage('Login failed. Check your credentials.', 'error');
    }
  });

  return (
    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100'}}>
      <Paper elevation={1} sx={{p: 4, minWidth: 360}}>
        <Stack spacing={3} component="form" onSubmit={onSubmit}>
          <div>
            <Typography variant="h5" gutterBottom>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your analogue film archive.
            </Typography>
          </div>
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
          <Button type="submit" variant="contained" color="primary">
            Sign in
          </Button>
          {allowRegistration && (
            <Typography variant="body2" textAlign="center">
              Need an account?{' '}
              <Link component="button" onClick={() => navigate('/register')} underline="hover">
                Register here
              </Link>
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

export default LoginPage;
