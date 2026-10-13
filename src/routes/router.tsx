import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRoute } from './RoleBasedRoute';
import { RouteError } from './RouteError';
import { rolesFor } from './navigation';

// Each page is its own chunk: the first load only pays for the shell and the page it opens.
const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((module) => ({ default: module[name] })));

const LoginPage = page(() => import('../pages/LoginPage'), 'LoginPage');
const RegisterPage = page(() => import('../pages/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = page(() => import('../pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('../pages/ResetPasswordPage'), 'ResetPasswordPage');
const DashboardPage = page(() => import('../pages/DashboardPage'), 'DashboardPage');
const ProfilePage = page(() => import('../pages/ProfilePage'), 'ProfilePage');
const EventListPage = page(() => import('../pages/events/EventListPage'), 'EventListPage');
const EventDetailPage = page(() => import('../pages/events/EventDetailPage'), 'EventDetailPage');
const PostListPage = page(() => import('../pages/posts/PostListPage'), 'PostListPage');
const PostDetailPage = page(() => import('../pages/posts/PostDetailPage'), 'PostDetailPage');
const ChatPage = page(() => import('../pages/ChatPage'), 'ChatPage');
const NotificationPage = page(() => import('../pages/NotificationPage'), 'NotificationPage');
const MemberListPage = page(() => import('../pages/members/MemberListPage'), 'MemberListPage');
const MemberDetailPage = page(() => import('../pages/members/MemberDetailPage'), 'MemberDetailPage');
const OrganizationPage = page(() => import('../pages/organizations/OrganizationPage'), 'OrganizationPage');
const AuditPage = page(() => import('../pages/admin/AuditPage'), 'AuditPage');

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
        element: <AppLayout />,
        children: [
          {
            errorElement: <RouteError />,
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
                element: <RoleBasedRoute allowedRoles={rolesFor('/members')} />,
                children: [
                  { path: '/members', element: <MemberListPage /> },
                  { path: '/members/:id', element: <MemberDetailPage /> },
                ],
              },
              {
                element: <RoleBasedRoute allowedRoles={rolesFor('/organizations')} />,
                children: [{ path: '/organizations', element: <OrganizationPage /> }],
              },
              {
                element: <RoleBasedRoute allowedRoles={rolesFor('/audit-logs')} />,
                children: [{ path: '/audit-logs', element: <AuditPage /> }],
              },
              { path: '*', element: <Navigate to="/dashboard" replace /> },
            ],
          },
        ],
      },
    ],
  },
]);
