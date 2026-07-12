import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Layouts
import { AppShell } from './layouts/AppShell';
import { AuthLayout } from './layouts/AuthLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { FleetPage } from './pages/fleet/FleetPage';
import { DriversPage } from './pages/drivers/DriversPage';
import { TripsPage } from './pages/trips/TripsPage';
import { MaintenancePage } from './pages/maintenance/MaintenancePage';
import { FuelExpensesPage } from './pages/fuel/FuelExpensesPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { SettingsPage } from './pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    // Single ProtectedRoute wrapping all authenticated routes (auth check only)
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/fleet', element: <FleetPage /> },
          { path: '/drivers', element: <DriversPage /> },
          { path: '/trips', element: <TripsPage /> },
          { path: '/maintenance', element: <MaintenancePage /> },
          { path: '/fuel-expenses', element: <FuelExpensesPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster richColors position="top-right" duration={3500} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
