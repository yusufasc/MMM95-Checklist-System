import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Departments from './pages/Departments';
import Checklists from './pages/Checklists';
import Tasks from './pages/Tasks';
import Machines from './pages/Machines';
import Inventory from './pages/Inventory';
import ControlPending from './pages/ControlPending';
import Performance from './pages/Performance';
import WorkTasks from './pages/WorkTasks';
import QualityControl from './pages/QualityControl';
import QualityControlManagement from './pages/QualityControlManagement';
import HRPage from './pages/HR';
import HRManagement from './pages/HRManagement';
import MachineSelectionTest from './pages/MachineSelectionTest';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import MyActivity from './pages/MyActivity';

// Material-UI tema
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="users"
            element={
              <ProtectedRoute module="Kullanıcı Yönetimi">
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute module="Rol Yönetimi">
                <Roles />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments"
            element={
              <ProtectedRoute module="Departman Yönetimi">
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="checklists"
            element={
              <ProtectedRoute module="Checklist Yönetimi">
                <Checklists />
              </ProtectedRoute>
            }
          />
          <Route
            path="tasks"
            element={
              <ProtectedRoute module="Görev Yönetimi">
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="machines"
            element={
              <ProtectedRoute module="Envanter Yönetimi">
                <Machines />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <ProtectedRoute module="Envanter Yönetimi">
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="control-pending"
            element={
              <ProtectedRoute module="Kontrol Bekleyenler">
                <ControlPending />
              </ProtectedRoute>
            }
          />
          <Route
            path="performance"
            element={
              <ProtectedRoute module="Performans">
                <Performance />
              </ProtectedRoute>
            }
          />
          <Route
            path="worktasks"
            element={
              <ProtectedRoute module="Yaptım">
                <WorkTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="quality-control"
            element={
              <ProtectedRoute module="Kalite Kontrol">
                <QualityControl />
              </ProtectedRoute>
            }
          />
          <Route
            path="quality-control-management"
            element={
              <ProtectedRoute module="Kalite Kontrol Yönetimi">
                <QualityControlManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="hr"
            element={
              <ProtectedRoute module="İnsan Kaynakları" customCheck={true}>
                <HRPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="hr-management"
            element={
              <ProtectedRoute module="İnsan Kaynakları Yönetimi">
                <HRManagement />
              </ProtectedRoute>
            }
          />
          <Route path="machine-test" element={<MachineSelectionTest />} />
          <Route path="my-activity" element={<MyActivity />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SnackbarProvider>
          <AppRoutes />
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
