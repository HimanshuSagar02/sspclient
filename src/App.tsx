import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const HomePage = lazy(() =>
  import('@/pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const AdminLayout = lazy(() =>
  import('@/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminDashboard = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const SiteContentEditor = lazy(() =>
  import('@/pages/admin/SiteContentEditor').then((m) => ({ default: m.SiteContentEditor }))
);
const UserManagement = lazy(() =>
  import('@/pages/admin/UserManagement').then((m) => ({ default: m.UserManagement }))
);
const CoachingManagement = lazy(() =>
  import('@/pages/admin/CoachingManagement').then((m) => ({ default: m.CoachingManagement }))
);
const LibraryManagement = lazy(() =>
  import('@/pages/admin/LibraryManagement').then((m) => ({ default: m.LibraryManagement }))
);
const MockTestsManagement = lazy(() =>
  import('@/pages/admin/MockTestsManagement').then((m) => ({ default: m.MockTestsManagement }))
);
const AuditLogsPage = lazy(() =>
  import('@/pages/admin/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage }))
);
const EnquiriesManagement = lazy(() =>
  import('@/pages/admin/EnquiriesManagement').then((m) => ({ default: m.EnquiriesManagement }))
);
const PaymentsManagement = lazy(() =>
  import('@/pages/admin/PaymentsManagement').then((m) => ({ default: m.PaymentsManagement }))
);
const NotificationsManagement = lazy(() =>
  import('@/pages/admin/NotificationsManagement').then((m) => ({
    default: m.NotificationsManagement,
  }))
);

const StorageCleanup = lazy(() =>
  import('@/pages/admin/StorageCleanup').then((m) => ({ default: m.StorageCleanup }))
);
const LibrarySeatsPage = lazy(() =>
  import('@/pages/admin/LibrarySeatsPage').then((m) => ({ default: m.LibrarySeatsPage }))
);
const NotesManagement = lazy(() =>
  import('@/pages/admin/NotesManagement').then((m) => ({ default: m.NotesManagement }))
);
const StudentLayout = lazy(() =>

  import('@/layouts/StudentLayout').then((m) => ({ default: m.StudentLayout }))
);
const StudentOverviewPage = lazy(() =>
  import('@/pages/student/StudentOverviewPage').then((m) => ({ default: m.StudentOverviewPage }))
);
const StudentProfilePage = lazy(() =>
  import('@/pages/student/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage }))
);
const StudentPaymentsPage = lazy(() =>
  import('@/pages/student/StudentPaymentsPage').then((m) => ({ default: m.StudentPaymentsPage }))
);
const StudentDuePaymentPage = lazy(() =>
  import('@/pages/student/StudentDuePaymentPage').then((m) => ({ default: m.StudentDuePaymentPage }))
);

const StudentMockTestsPage = lazy(() =>
  import('@/pages/student/StudentMockTestsPage').then((m) => ({ default: m.StudentMockTestsPage }))
);
const MockTestTakePage = lazy(() =>
  import('@/pages/student/MockTestTakePage').then((m) => ({ default: m.MockTestTakePage }))
);
const MockTestResultPage = lazy(() =>
  import('@/pages/student/MockTestResultPage').then((m) => ({ default: m.MockTestResultPage }))
);
const StudentNotificationsPage = lazy(() =>
  import('@/pages/student/StudentNotificationsPage').then((m) => ({
    default: m.StudentNotificationsPage,
  }))
);
const StudentNotesPage = lazy(() =>
  import('@/pages/student/StudentNotesPage').then((m) => ({ default: m.StudentNotesPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Skeleton className="h-12 w-48" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary scope="The app">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                <ErrorBoundary scope="The home page">
                  <HomePage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/login"
              element={
                <ErrorBoundary scope="The login page">
                  <LoginPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/register"
              element={
                <ErrorBoundary scope="The register page">
                  <LoginPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="site" element={<SiteContentEditor />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="coaching" element={<CoachingManagement />} />
              <Route path="library" element={<LibraryManagement />} />
              <Route path="mock-tests" element={<MockTestsManagement />} />
              <Route path="payments" element={<PaymentsManagement />} />
              <Route path="notifications" element={<NotificationsManagement />} />
              <Route path="audit" element={<AuditLogsPage />} />
              <Route path="enquiries" element={<EnquiriesManagement />} />
              <Route path="library-seats" element={<LibrarySeatsPage />} />
              <Route path="notes" element={<NotesManagement />} />
              <Route path="settings" element={<StorageCleanup />} />
            </Route>

            <Route
              path="/student"
              element={
                <ProtectedRoute roles={['coaching_student', 'library_student']}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentOverviewPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
              <Route path="payments" element={<StudentPaymentsPage />} />
              <Route path="payments-due" element={<StudentDuePaymentPage />} />
              <Route path="mock-tests" element={<StudentMockTestsPage />} />
              <Route path="mock-tests/:testId/take" element={<MockTestTakePage />} />
              <Route path="mock-tests/result/:attemptId" element={<MockTestResultPage />} />
              <Route path="notifications" element={<StudentNotificationsPage />} />
              <Route path="notes" element={<StudentNotesPage />} />
              <Route path="*" element={<Navigate to="/student" replace />} />
            </Route>
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </QueryClientProvider>
  );
}

export default App;
