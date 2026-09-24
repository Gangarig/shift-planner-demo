/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'
import AppLayout from '../layout/AppLayout'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import AppProvider from '../context/AppProvider'

const PlannerPage = lazy(() => import('../pages/PlannerPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const WorkersPage = lazy(() => import('../pages/WorkersPage'))
const StationsPage = lazy(() => import('../pages/StationsPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'))
const ForgotPasswordPage = lazy(
  () => import('../pages/Auth/ForgotPasswordPage'),
)
const ResetPasswordPage = lazy(() => import('../pages/Auth/ResetPasswordPage'))
const TeamAccessPage = lazy(() => import('../pages/TeamAccessPage'))
const Unauthorized = lazy(() => import('../pages/Unauthorized'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const AuditPage = lazy(() => import('../pages/AuditPage'))
const PayrollPage = lazy(() => import('../pages/PayrollPage'))

export const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
    { path: '/forgot-password', element: <ForgotPasswordPage /> },
    { path: '/reset-password', element: <ResetPasswordPage /> },
    {
      element: (
        <ProtectedRoute
          allowedRoles={['worker', 'manager', 'admin', 'owner', 'accountant']}
        />
      ),
      children: [
        {
          element: <AppProvider />,
          children: [
            {
              path: '/',
              element: <AppLayout />,
              children: [
                { index: true, element: <DashboardPage /> },
                { path: 'planner', element: <PlannerPage /> },
                {
                  element: (
                    <ProtectedRoute
                      allowedRoles={['manager', 'admin', 'owner']}
                    />
                  ),
                  children: [
                    { path: 'workers', element: <WorkersPage /> },
                    { path: 'stations', element: <StationsPage /> },
                  ],
                },
                {
                  element: <ProtectedRoute allowedRoles={['admin', 'owner']} />,
                  children: [{ path: 'settings', element: <SettingsPage /> }],
                },
                {
                  element: (
                    <ProtectedRoute
                      allowedRoles={['worker', 'accountant', 'admin', 'owner']}
                    />
                  ),
                  children: [{ path: 'payroll', element: <PayrollPage /> }],
                },
                {
                  element: <ProtectedRoute allowedRoles={['owner']} />,
                  children: [
                    { path: 'team', element: <TeamAccessPage /> },
                    { path: 'audit', element: <AuditPage /> },
                  ],
                },
                { path: 'unauthorized', element: <Unauthorized /> },
                { path: '*', element: <NotFoundPage /> },
              ],
            },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
