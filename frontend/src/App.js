import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React, { Suspense } from 'react';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import './utils/hrExcelTest';

// ===== CODE SPLITTING - LAZY LOADED PAGES =====
// Critical pages (always loaded)
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// Lazy loaded pages (loaded on demand)
const Users = React.lazy(() => import('./pages/Users'));
const Roles = React.lazy(() => import('./pages/Roles'));
const Departments = React.lazy(() => import('./pages/Departments'));
const Machines = React.lazy(() => import('./pages/Machines'));
const Checklists = React.lazy(() => import('./pages/Checklists'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const ControlPending = React.lazy(() => import('./pages/ControlPending'));
const Performance = React.lazy(() => import('./pages/Performance'));
const QualityControl = React.lazy(() => import('./pages/QualityControl'));
const QualityControlManagement = React.lazy(
  () => import('./pages/QualityControlManagement'),
);
const Inventory = React.lazy(() => import('./pages/Inventory'));
const HR = React.lazy(() => import('./pages/HR'));
const HRManagement = React.lazy(() => import('./pages/HRManagement'));
const WorkTasks = React.lazy(() => import('./pages/WorkTasks'));
const MyActivity = React.lazy(() => import('./pages/MyActivity'));
const WorkTaskControl = React.lazy(() => import('./pages/WorkTaskControl'));
const PersonnelTracking = React.lazy(() => import('./pages/PersonnelTracking'));
const Profile = React.lazy(() => import('./pages/Profile'));
// Bonus Evaluation sayfaları
const BonusEvaluation = React.lazy(() => import('./pages/BonusEvaluation'));
const BonusEvaluationManagement = React.lazy(
  () => import('./pages/BonusEvaluationManagement'),
);
const EquipmentManagement = React.lazy(
  () => import('./pages/EquipmentManagement'),
);

// Initialize crash reporter
console.log('🛡️ Crash detection system active');
console.log(
  '💡 Crash reports stored in localStorage, check console for alerts',
);

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
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Suspense
        fallback={
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            minHeight='100vh'
          >
            <CircularProgress size={60} />
          </Box>
        }
      >
        <Routes>
          <Route
            path='/login'
            element={
              !isAuthenticated ? (
                <Login />
              ) : (
                <Navigate to='/dashboard' replace />
              )
            }
          />
          <Route
            path='/'
            element={
              isAuthenticated ? <Layout /> : <Navigate to='/login' replace />
            }
          >
            <Route index element={<Dashboard />} />
            <Route path='dashboard' element={<Dashboard />} />
            <Route
              path='users'
              element={
                <ProtectedRoute module='Kullanıcı Yönetimi'>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path='roles'
              element={
                <ProtectedRoute module='Rol Yönetimi'>
                  <Roles />
                </ProtectedRoute>
              }
            />
            <Route
              path='departments'
              element={
                <ProtectedRoute module='Departman Yönetimi'>
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path='checklists'
              element={
                <ProtectedRoute module='Checklist Yönetimi'>
                  <Checklists />
                </ProtectedRoute>
              }
            />
            <Route
              path='tasks'
              element={
                <ProtectedRoute module='Görev Yönetimi'>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path='machines'
              element={
                <ProtectedRoute module='Envanter Yönetimi'>
                  <Machines />
                </ProtectedRoute>
              }
            />
            <Route
              path='inventory'
              element={
                <ProtectedRoute module='Envanter Yönetimi'>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path='control-pending'
              element={
                <ProtectedRoute module='Kontrol Bekleyenler'>
                  <ControlPending />
                </ProtectedRoute>
              }
            />
            <Route
              path='worktask-control'
              element={
                <ProtectedRoute module='Kontrol Bekleyenler'>
                  <WorkTaskControl />
                </ProtectedRoute>
              }
            />
            <Route
              path='performance'
              element={
                <ProtectedRoute module='Performans'>
                  <Performance />
                </ProtectedRoute>
              }
            />
            <Route
              path='worktasks'
              element={
                <ProtectedRoute module='Yaptım'>
                  <WorkTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path='quality-control'
              element={
                <ProtectedRoute module='Kalite Kontrol'>
                  <QualityControl />
                </ProtectedRoute>
              }
            />
            <Route
              path='quality-control-management'
              element={
                <ProtectedRoute module='Kalite Kontrol Yönetimi'>
                  <QualityControlManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path='hr'
              element={
                <ProtectedRoute module='İnsan Kaynakları' customCheck={true}>
                  <HR />
                </ProtectedRoute>
              }
            />
            <Route
              path='hr-management'
              element={
                <ProtectedRoute module='İnsan Kaynakları Yönetimi'>
                  <HRManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path='my-activity'
              element={
                <ProtectedRoute module='Performans'>
                  <MyActivity />
                </ProtectedRoute>
              }
            />
            <Route
              path='personnel-tracking'
              element={
                <ProtectedRoute module='Personel Takip'>
                  <PersonnelTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path='bonus-evaluation'
              element={
                <ProtectedRoute module='Bonus Değerlendirme'>
                  <BonusEvaluation />
                </ProtectedRoute>
              }
            />
            <Route
              path='bonus-evaluation-management'
              element={
                <ProtectedRoute module='Bonus Değerlendirme Yönetimi'>
                  <BonusEvaluationManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path='equipment-management'
              element={
                <ProtectedRoute module='Ekipman Yönetimi'>
                  <EquipmentManagement />
                </ProtectedRoute>
              }
            />
            <Route path='profile' element={<Profile />} />
          </Route>
          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SnackbarProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
