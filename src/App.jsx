
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import Navbar from './components/layout/Navbar';

import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import CheckoutPage from './pages/CheckoutPage';
import ScrollToTop from './components/layout/ScrollToUp';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './routes/ProtectedRoute';
import ManageCoursesPage from './pages/admin/ManageCoursesPage';
import ManageLessonsPage from './pages/admin/ManageLessonsPage';
import ManageMembersPage from './pages/admin/ManageMembersPage';
import PaymentPage from './pages/PaymentPage';
import PaymentRequestsPage from './pages/admin/PaymentRequestsPage';
import AccountPage from './pages/AccountPage';
import Footer from './components/layout/Footer';
import PageSettings from './pages/admin/PageSetting';


function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Courses */}
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailsPage />} />

        {/* Course Player */}
        <Route
          path="/courses/:courseId/lessons/:lessonId"
          element={<CoursePlayerPage />}
        />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Account */}
        <Route
          path="/account"
          element={
              <AccountPage />
          }
        />

        {/* Payment */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route
          path="/checkout/:courseId"
          element={<CheckoutPage />}
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute>
              <ManageCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/lessons"
          element={
            <ProtectedRoute>
              <ManageLessonsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <ProtectedRoute>
              <ManageMembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute>
              <PaymentRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <PageSettings />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
