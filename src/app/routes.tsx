import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { ExecutiveDashboard } from './components/dashboards/ExecutiveDashboard';
import { GoalPerformanceDashboard } from './components/dashboards/GoalPerformanceDashboard';
import { OfficeDashboard } from './components/dashboards/OfficeDashboard';
import { KPITrackingDashboard } from './components/dashboards/KPITrackingDashboard';
import { IssuesDashboard } from './components/dashboards/IssuesDashboard';
import { ComplianceDashboard } from './components/dashboards/ComplianceDashboard';
import { MOVDashboard } from './components/dashboards/MOVDashboard';
import { MonthlyDashboard } from './components/dashboards/MonthlyDashboard';
import { PillarPerformanceDashboard } from './components/dashboards/PillarPerformanceDashboard';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { RequireAuth } from './components/auth/RequireAuth';

function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppLayout />
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
  {
    path: '/',
    Component: ProtectedLayout,
    children: [
      {
        index: true,
        Component: ExecutiveDashboard,
      },
      {
        path: 'goals',
        Component: GoalPerformanceDashboard,
      },
      {
        path: 'offices',
        Component: OfficeDashboard,
      },
      {
        path: 'kpi-tracking',
        Component: KPITrackingDashboard,
      },
      {
        path: 'issues',
        Component: IssuesDashboard,
      },
      {
        path: 'compliance',
        Component: ComplianceDashboard,
      },
      {
        path: 'mov',
        Component: MOVDashboard,
      },
      {
        path: 'monthly',
        Component: MonthlyDashboard,
      },
      {
        path: 'pillars',
        Component: PillarPerformanceDashboard,
      },
    ],
  },
]);
