import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
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
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  fetchRegistrationSetting,
  resetAdminUserPassword,
  updateAdminUser,
  updateRegistrationSetting
} from '../api/admin';
import type {AdminUserSummary} from '../types/api';
import {useAuth} from '../providers/AuthProvider';
import {useSnackbar} from '../providers/SnackbarProvider';
import {z} from 'zod';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'ADMIN']),
  isActive: z.boolean()
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const CREATE_USER_INITIAL: CreateUserForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'USER',
  isActive: true
};

function AdminSettingsPage() {
  const {allowRegistration, setAllowRegistration, user: currentUser} = useAuth();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();

  const [localValue, setLocalValue] = useState(allowRegistration);
  const [tab, setTab] = useState<'settings' | 'users'>('settings');
  const [passwordDialogUser, setPasswordDialogUser] = useState<AdminUserSummary | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createValues, setCreateValues] = useState<CreateUserForm>(CREATE_USER_INITIAL);
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof CreateUserForm, string>>>({});
  const [deleteDialogUser, setDeleteDialogUser] = useState<AdminUserSummary | null>(null);

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
    mutationFn: ({id, payload}: {id: string; payload: Parameters<typeof updateAdminUser>[1]}) =>
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

  const createUserMutation = useMutation({
    mutationFn: (payload: CreateUserForm) => createAdminUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['admin', 'users']});
      snackbar.showMessage('User created successfully', 'success');
      setCreateDialogOpen(false);
      setCreateValues(CREATE_USER_INITIAL);
      setCreateErrors({});
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Could not create user';
      snackbar.showMessage(message, 'error');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['admin', 'users']});
      snackbar.showMessage('User removed', 'success');
      setDeleteDialogUser(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Could not remove user';
      snackbar.showMessage(message, 'error');
    }
  });

  const handleInlineNameUpdate = useCallback(
    (user: AdminUserSummary, field: 'firstName' | 'lastName', rawValue: string): boolean => {
      const trimmed = rawValue.trim();
      if (!trimmed || trimmed === user[field]) {
        if (!trimmed) {
          snackbar.showMessage(`${field === 'firstName' ? 'First' : 'Last'} name cannot be empty`, 'error');
        }
        return false;
      }
      updateUserMutation.mutate({id: user.id, payload: {[field]: trimmed}});
      return true;
    },
    [snackbar, updateUserMutation]
  );

  const handleOpenCreateDialog = () => {
    setCreateValues(CREATE_USER_INITIAL);
    setCreateErrors({});
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateErrors({});
  };

  const handleCreateInputChange = (field: keyof CreateUserForm) => (value: string | boolean) => {
    setCreateValues((prev) => ({...prev, [field]: value}));
    setCreateErrors((prev) => ({...prev, [field]: undefined}));
  };

  const handleCreateSubmit = () => {
    const result = createUserSchema.safeParse(createValues);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const mapped: Partial<Record<keyof CreateUserForm, string>> = {};
      (Object.keys(fieldErrors) as Array<keyof CreateUserForm>).forEach((key) => {
        if (fieldErrors[key]?.length) {
          mapped[key] = fieldErrors[key]![0];
        }
      });
      setCreateErrors(mapped);
      return;
    }
    createUserMutation.mutate(result.data);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogUser(null);
    setPasswordValue('');
    setPasswordError(null);
  };

  const columns = useMemo<GridColDef<AdminUserSummary>[]>(
    () => [
      {
        field: 'firstName',
        headerName: 'First Name',
        width: 160,
        sortable: false,
        renderCell: ({row}) => (
          <TextField
            size="small"
            variant="standard"
            key={`${row.id}-firstName-${row.firstName}`}
            defaultValue={row.firstName}
            onBlur={(event) => {
              const updated = handleInlineNameUpdate(row, 'firstName', event.target.value);
              if (!updated) {
                event.target.value = row.firstName;
              }
            }}
            onClick={(event) => event.stopPropagation()}
            fullWidth
          />
        )
      },
      {
        field: 'lastName',
        headerName: 'Last Name',
        width: 160,
        sortable: false,
        renderCell: ({row}) => (
          <TextField
            size="small"
            variant="standard"
            key={`${row.id}-lastName-${row.lastName}`}
            defaultValue={row.lastName}
            onBlur={(event) => {
              const updated = handleInlineNameUpdate(row, 'lastName', event.target.value);
              if (!updated) {
                event.target.value = row.lastName;
              }
            }}
            onClick={(event) => event.stopPropagation()}
            fullWidth
          />
        )
      },
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
            <Button
              size="small"
              color="error"
              variant="text"
              startIcon={<DeleteOutlineIcon fontSize="small" />}
              disabled={currentUser?.id === row.id}
              onClick={() => setDeleteDialogUser(row)}
            >
              Remove
            </Button>
          </Stack>
        )
      }
    ],
    [currentUser?.id, handleInlineNameUpdate, updateUserMutation]
  );

  if (registrationQuery.isLoading) {
    return <Typography>Loading settings...</Typography>;
  }

  if (registrationQuery.isError) {
    return <Alert severity="error">Unable to load admin settings.</Alert>;
  }

  return (
    <Paper
      sx={{
        p: {xs: 3, md: 4},
        borderRadius: {xs: 2, md: 3},
        background: 'linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(226,241,230,0.92) 100%)',
        boxShadow: '0 18px 36px rgba(26, 74, 45, 0.1)'
      }}
    >
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
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 3
            }
          }}
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
            <Stack
              direction={{xs: 'column', sm: 'row'}}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{sm: 'center'}}
              sx={{mb: 2}}
            >
              <Typography variant="subtitle1" color="text.secondary">
                Manage platform accounts and elevate collaborators.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                sx={{alignSelf: {xs: 'stretch', sm: 'auto'}}}
              >
                Add User
              </Button>
            </Stack>
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

      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{mt: 1}}>
            <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
              <TextField
                label="First Name"
                value={createValues.firstName}
                onChange={(event) => handleCreateInputChange('firstName')(event.target.value)}
                error={!!createErrors.firstName}
                helperText={createErrors.firstName}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={createValues.lastName}
                onChange={(event) => handleCreateInputChange('lastName')(event.target.value)}
                error={!!createErrors.lastName}
                helperText={createErrors.lastName}
                fullWidth
              />
            </Stack>
            <TextField
              label="Email"
              type="email"
              value={createValues.email}
              onChange={(event) => handleCreateInputChange('email')(event.target.value)}
              error={!!createErrors.email}
              helperText={createErrors.email}
              fullWidth
            />
            <TextField
              label="Temporary Password"
              type="password"
              value={createValues.password}
              onChange={(event) => handleCreateInputChange('password')(event.target.value)}
              error={!!createErrors.password}
              helperText={createErrors.password ?? 'Minimum 8 characters'}
              fullWidth
            />
            <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} alignItems={{sm: 'center'}}>
              <Select
                size="small"
                value={createValues.role}
                onChange={(event) => handleCreateInputChange('role')(event.target.value)}
                sx={{minWidth: 160}}
              >
                <MenuItem value="USER">User</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
              <FormControlLabel
                control={
                  <Switch
                    checked={createValues.isActive}
                    onChange={(_, checked) => handleCreateInputChange('isActive')(checked)}
                  />
                }
                label={createValues.isActive ? 'Active on creation' : 'Disabled on creation'}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={createUserMutation.status === 'pending'}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

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

      <Dialog open={!!deleteDialogUser} onClose={() => setDeleteDialogUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {deleteDialogUser?.email}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogUser(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteDialogUser && deleteUserMutation.mutate(deleteDialogUser.id)}
            disabled={deleteUserMutation.status === 'pending'}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default AdminSettingsPage;
