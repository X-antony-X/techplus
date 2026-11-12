import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Footer, Navbar, AdminLayout, DashboardLayout } from '../components/layout';
import AdminRoute from '../routes/AdminRoute';
import EnrollmentRoute from '../routes/EnrollmentRoute';
import ProtectedRoute from '../routes/ProtectedRoute';
import HomePage from '../pages/HomePage';
import CoursesPage from '../pages/CoursesPage';
import CourseDetailsPage from '../pages/CourseDetailsPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import CheckoutPage from '../pages/CheckoutPage';
import PaymentPendingPage from '../pages/PaymentPendingPage';
import MyCoursesPage from '../pages/MyCoursesPage';
import CoursePlayerPage from '../pages/CoursePlayerPage';
import NotFoundPage from '../pages/NotFoundPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import PaymentRequestsPage from '../pages/admin/PaymentRequestsPage';
import ManageCoursesPage from '../pages/admin/ManageCoursesPage';
import ManageLessonsPage from '../pages/admin/ManageLessonsPage';

const PublicLayout = () => <div className="flex min-h-screen flex-col"><Navbar /><main className="flex-1"><Outlet /></main><Footer /></div>;

export const router = createBrowserRouter([
  { element: <PublicLayout />, children: [
    { index: true, element: <HomePage /> },
    { path: 'courses', element: <CoursesPage /> },
    { path: 'courses/:courseId', element: <CourseDetailsPage /> },
    { path: 'login', element: <LoginPage /> },
    { path: 'register', element: <RegisterPage /> },
    { element: <ProtectedRoute />, children: [
      { element: <DashboardLayout />, children: [{ path: 'my-courses', element: <MyCoursesPage /> }, { path: 'payments/pending', element: <PaymentPendingPage /> }] },
      { path: 'checkout/:courseId', element: <CheckoutPage /> },
      { element: <EnrollmentRoute />, children: [{ path: 'learn/:courseId', element: <CoursePlayerPage /> }] },
      { element: <AdminRoute />, children: [{ element: <AdminLayout />, children: [
        { path: 'admin', element: <AdminDashboardPage /> }, { path: 'admin/payments', element: <PaymentRequestsPage /> }, { path: 'admin/courses', element: <ManageCoursesPage /> }, { path: 'admin/lessons', element: <ManageLessonsPage /> },
      ] }] },
    ] },
    { path: '404', element: <NotFoundPage /> }, { path: '*', element: <Navigate to="/404" replace /> },
  ] },
]);
