import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicOnly, RequireAuth, RequireRoles } from './components/RouteGuards';
import { defaultRouteByRole } from './lib/navigation';
import { AppLayout } from './layouts/AppLayout';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DriversPage } from './pages/DriversPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { FuelLogsPage } from './pages/FuelLogsPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ResendVerificationPage } from './pages/ResendVerificationPage';
import { TripsPage } from './pages/TripsPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { DispatcherDashboardPage } from './pages/dashboard/DispatcherDashboardPage';
import { DriverDashboardPage } from './pages/dashboard/DriverDashboardPage';
import { FinanceDashboardPage } from './pages/dashboard/FinanceDashboardPage';
import { ManagerDashboardPage } from './pages/dashboard/ManagerDashboardPage';
import { SafetyDashboardPage } from './pages/dashboard/SafetyDashboardPage';
import { useAuthStore } from './store/auth.store';

const HomeRedirect = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={defaultRouteByRole[user.role]} replace />;
};

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      {
        path: '/',
        element: <HomePage />
      },
      {
        path: '/login',
        element: <LoginPage />
      },
      {
        path: '/register',
        element: <RegisterPage />
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />
      },
      {
        path: '/verify-email',
        element: <VerifyEmailPage />
      },
      {
        path: '/resend-verification',
        element: <ResendVerificationPage />
      }
    ]
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: 'dashboard', element: <HomeRedirect /> },
          {
            element: <RequireRoles roles={['MANAGER']} />,
            children: [{ path: 'dashboard/manager', element: <ManagerDashboardPage /> }]
          },
          {
            element: <RequireRoles roles={['DRIVER']} />,
            children: [{ path: 'dashboard/driver', element: <DriverDashboardPage /> }]
          },
          {
            element: <RequireRoles roles={['DISPATCHER']} />,
            children: [{ path: 'dashboard/dispatcher', element: <DispatcherDashboardPage /> }]
          },
          {
            element: <RequireRoles roles={['SAFETY']} />,
            children: [{ path: 'dashboard/safety', element: <SafetyDashboardPage /> }]
          },
          {
            element: <RequireRoles roles={['ANALYST']} />,
            children: [{ path: 'dashboard/finance', element: <FinanceDashboardPage /> }]
          },
          {
            element: <RequireRoles roles={['MANAGER', 'DISPATCHER', 'SAFETY']} />,
            children: [
              { path: 'dashboard/ops', element: <DashboardPage /> },
              { path: 'vehicles', element: <VehiclesPage /> },
              { path: 'trips', element: <TripsPage /> },
              { path: 'maintenance', element: <MaintenancePage /> },
              { path: 'fuel', element: <FuelLogsPage /> },
              { path: 'drivers', element: <DriversPage /> }
            ]
          },
          {
            element: <RequireRoles roles={['MANAGER', 'ANALYST']} />,
            children: [{ path: 'analytics', element: <AnalyticsPage /> }]
          }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);
