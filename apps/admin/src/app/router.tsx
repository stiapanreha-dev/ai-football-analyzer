import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { Layout } from '@/shared/ui/Layout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

import { LoginPage } from '@/pages/login/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { PlayersListPage } from '@/pages/players/PlayersListPage';
import { SessionsListPage } from '@/pages/sessions/SessionsListPage';
import { ReportsListPage, ReportDetailPage } from '@/pages/reports';
import { PinsPage } from '@/pages/pins/PinsPage';
import { AuditPage } from '@/pages/audit/AuditPage';
import { PromptsPage } from '@/pages/prompts/PromptsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'players',
        element: <PlayersListPage />,
      },
      {
        path: 'sessions',
        element: <SessionsListPage />,
      },
      {
        path: 'reports',
        element: <ReportsListPage />,
      },
      {
        path: 'reports/:id',
        element: <ReportDetailPage />,
      },
      {
        path: 'pins',
        element: <PinsPage />,
      },
      {
        path: 'audit',
        element: <AuditPage />,
      },
      {
        path: 'prompts',
        element: <PromptsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(routes);
