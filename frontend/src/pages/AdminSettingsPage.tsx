import {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import {DataGrid, type GridColDef} from '@mui/x-data-grid';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  fetchAdminUsers,
  fetchRegistrationSetting,
  resetAdminUserPassword,
  updateAdminUser,
  updateRegistrationSetting
} from '../api/admin';
import type {AdminUserSummary} from '../types/api';
import {useAuth} from '../providers/AuthProvider';
import {useSnackbar} from '../providers/SnackbarProvider';

function AdminSettingsPage() {
  const {allowRegistration, setAllowRegistration, user: currentUser} = useAuth();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();

  const [localValue, setLocalValue] = useState(allowRegistration);
  const [tab, setTab] = useState<'settings' | 'users'>('settings');
  const [passwordDialogUser, setPasswordDialogUser] = useState<AdminUserSummary | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const registrationQuery = useQuery({
    queryKey: ['admin', 'registration-setting'],
    queryFn: fetchRegistrationSetting
  });

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchAdminUsers,
    enabled: tab === 'users'
  });

  useEffect(() => {
    if (registrationQuery.data) {
      setLocalValue(registrationQuery.data.allowRegistration);
      setAllowRegistration(registrationQuery.data.allowRegistration);
    }
  }, [registrationQuery.data, setAllowRegistration]);

  const updateRegistration = useMutation({
    mutationFn: (value: boolean) => updateRegistrationSetting(value),
    onSuccess: (result) => {
      setAllowRegistration(result.allowRegistration);
      snackbar.showMessage('Registration setting updated', 'success');
    },
    onError: () => snackbar.showMessage('Could not update registration setting', 'error')
  });

  const updateUserMutation = useMutation({
    mutationFn: ({id, payload}: {id: string; payload: {role?: 'USER' | 'ADMIN'; isActive?: boolean}}) =>
      updateAdminUser(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['admin', 'users']});
      snackbar.showMessage('User updated successfully', 'success');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Could not update user';
      snackbar.showMessage(message, 'error');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({id, password}: {id: string; password: string}) =>
      resetAdminUserPassword(id, password),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['admin', 'users']});
      snackbar.showMessage('Password updated', 'success');
      handleClosePasswordDialog();
    },
    onError: () => snackbar.showMessage('Could not update password', 'error')
  });

  const handleClosePasswordDialog = () => {
    setPasswordDialogUser(null);
    setPasswordValue('');
    setPasswordError(null);
  };

  const columns = useMemo<GridColDef<AdminUserSummary>[]>(
    () => [
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        minWidth: 200
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 160,
        sortable: false,
        renderCell: ({row}) => (
          <Select
            size="small"
            value={row.role}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) =>
              updateUserMutation.mutate({id: row.id, payload: {role: event.target.value as 'USER' | 'ADMIN'}})
            }
            sx={{minWidth: 140}}
          >
            <MenuItem value="USER">User</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </Select>
        )
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 140,
        renderCell: ({row}) => (
          <Chip
            label={row.isActive ? 'Active' : 'Disabled'}
            color={row.isActive ? 'success' : 'default'}
            size="small"
          />
        )
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        width: 180,
        valueGetter: ({value}) => new Date(value as string).toLocaleString()
      },
      {
        field: 'updatedAt',
        headerName: 'Updated',
        width: 180,
        valueGetter: ({value}) => new Date(value as string).toLocaleString()
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        width: 240,
        renderCell: ({row}) => (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setPasswordDialogUser(row)}
            >
              Reset Password
            </Button>
            <Button
              size="small"
              color={row.isActive ? 'warning' : 'success'}
              variant="contained"
              disabled={currentUser?.id === row.id && row.isActive}
              onClick={() =>
                updateUserMutation.mutate({
                  id: row.id,
                  payload: {isActive: !row.isActive}
                })
              }
            >
              {row.isActive ? 'Disable' : 'Activate'}
            </Button>
          </Stack>
        )
      }
    ],
    [currentUser?.id, updateUserMutation]
  );

  if (registrationQuery.isLoading) {
    return <Typography>Loading settings...</Typography>;
  }

  if (registrationQuery.isError) {
    return <Alert severity="error">Unable to load admin settings.</Alert>;
  }

  return (
    <Paper sx={{p: 4}}>
      <Stack spacing={3}>
        <div>
          <Typography variant="h4" gutterBottom>
            Admin Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Adjust application access and manage users.
          </Typography>
        </div>
        <Tabs
          value={tab}
          onChange={(_event, value) => setTab(value)}
          aria-label="Admin settings tabs"
        >
          <Tab label="Access Control" value="settings" />
          <Tab label="User Management" value="users" />
        </Tabs>
        {tab === 'settings' && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={localValue}
                  onChange={(_, checked) => {
                    setLocalValue(checked);
                    updateRegistration.mutate(checked);
                  }}
                />
              }
              label="Allow new user registrations"
            />
          </Box>
        )}
        {tab === 'users' && (
          <Box>
            {usersQuery.isLoading ? (
              <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4}}>
                <CircularProgress />
              </Box>
            ) : usersQuery.isError ? (
              <Alert severity="error">Unable to load users.</Alert>
            ) : (
              <DataGrid
                autoHeight
                disableRowSelectionOnClick
                rows={usersQuery.data ?? []}
                columns={columns}
                getRowId={(row) => row.id}
                initialState={{
                  pagination: {
                    paginationModel: {pageSize: 10, page: 0}
                  }
                }}
                pageSizeOptions={[10, 20, 50]}
              />
            )}
          </Box>
        )}
      </Stack>

      <Dialog open={!!passwordDialogUser} onClose={handleClosePasswordDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            Enter a new temporary password for {passwordDialogUser?.email}.
          </Typography>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={passwordValue}
            onChange={(event) => {
              setPasswordValue(event.target.value);
              if (event.target.value.length >= 8) {
                setPasswordError(null);
              }
            }}
            error={!!passwordError}
            helperText={passwordError ?? 'Minimum 8 characters'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (passwordValue.length < 8) {
                setPasswordError('Password must be at least 8 characters');
                return;
              }
              if (passwordDialogUser) {
                resetPasswordMutation.mutate({
                  id: passwordDialogUser.id,
                  password: passwordValue
                });
              }
            }}
            disabled={resetPasswordMutation.status === 'pending'}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default AdminSettingsPage;
