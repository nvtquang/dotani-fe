import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuditPage } from '../pages/admin/AuditPage';
import { AuthLayout } from '../layouts/AuthLayout';
import { RoleLayout } from '../layouts/RoleLayout';
import { ChatPage } from '../pages/ChatPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EventDetailPage } from '../pages/events/EventDetailPage';
import { EventListPage } from '../pages/events/EventListPage';
import { LoginPage } from '../pages/LoginPage';
import { MemberDetailPage } from '../pages/members/MemberDetailPage';
import { MemberListPage } from '../pages/members/MemberListPage';
import { NotificationPage } from '../pages/NotificationPage';
import { OrganizationPage } from '../pages/organizations/OrganizationPage';
import { PostDetailPage } from '../pages/posts/PostDetailPage';
import { PostListPage } from '../pages/posts/PostListPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRoute } from './RoleBasedRoute';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/events', element: <EventListPage /> },
          { path: '/events/:id', element: <EventDetailPage /> },
          { path: '/posts', element: <PostListPage /> },
          { path: '/posts/:id', element: <PostDetailPage /> },
          { path: '/chat', element: <ChatPage /> },
          { path: '/notifications', element: <NotificationPage /> },
          {
            element: (
              <RoleBasedRoute
                allowedRoles={[
                  'WARD_SECRETARY',
                  'WARD_DEPUTY_SECRETARY',
                  'TDP_SECRETARY',
                  'TDP_DEPUTY_SECRETARY',
                ]}
              />
            ),
            children: [
              { path: '/members', element: <MemberListPage /> },
              { path: '/members/:id', element: <MemberDetailPage /> },
            ],
          },
          {
            element: <RoleBasedRoute allowedRoles={['WARD_SECRETARY', 'WARD_DEPUTY_SECRETARY']} />,
            children: [
              { path: '/organizations', element: <OrganizationPage /> },
            ],
          },
          {
            element: <RoleBasedRoute allowedRoles={['WARD_SECRETARY', 'WARD_DEPUTY_SECRETARY']} />,
            children: [
              { path: '/audit-logs', element: <AuditPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
