import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { Layout } from '@/shared/ui/Layout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

import { LoginPage } from '@/pages/login/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { PlayersListPage } from '@/pages/players/PlayersListPage';
import { SessionsListPage } from '@/pages/sessions/SessionsListPage';
import { ReportsListPage, ReportDetailPage } from '@/pages/reports';
import { TeamsListPage } from '@/pages/teams/TeamsListPage';
import { TeamDetailPage } from '@/pages/teams/TeamDetailPage';
import { TeamReportPage } from '@/pages/teams/TeamReportPage';
import { WaveDetailPage } from '@/pages/teams/WaveDetailPage';
import { TeamDynamicsPage } from '@/pages/teams/TeamDynamicsPage';
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
        path: 'teams',
        element: <TeamsListPage />,
      },
      {
        path: 'teams/:id',
        element: <TeamDetailPage />,
      },
      {
        path: 'teams/:id/reports/:reportId',
        element: <TeamReportPage />,
      },
      {
        path: 'teams/:id/waves/:waveId',
        element: <WaveDetailPage />,
      },
      {
        path: 'teams/:id/dynamics',
        element: <TeamDynamicsPage />,
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
