import {Navigate, Route, Routes} from 'react-router-dom';

import {AppLayout} from './components/AppLayout';
import {ProtectedRoute, PublicOnlyRoute, AdminRoute} from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FilmRollListPage from './pages/FilmRollListPage';
import FilmRollDetailPage from './pages/FilmRollDetailPage';
import FilmRollFormPage from './pages/FilmRollFormPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/film-rolls" element={<FilmRollListPage />} />
          <Route path="/film-rolls/new" element={<FilmRollFormPage mode="create" />} />
          <Route path="/film-rolls/:id" element={<FilmRollDetailPage />} />
          <Route path="/film-rolls/:id/edit" element={<FilmRollFormPage mode="edit" />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/film-rolls" replace />} />
        <Route path="*" element={<Navigate to="/film-rolls" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
