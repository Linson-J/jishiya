import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import PageLoader from './components/PageLoader';
import Login from './pages/Login';

// Dashboard pages are code-split; the login page stays in the main bundle.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Enquiries = lazy(() => import('./pages/Enquiries'));
const Workshops = lazy(() => import('./pages/Workshops'));
const StatsEdit = lazy(() => import('./pages/StatsEdit'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Curriculum = lazy(() => import('./pages/Curriculum'));
const Gallery = lazy(() => import('./pages/Gallery'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader fullScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected: everything under /dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="workshop" element={<Workshops />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="stats" element={<StatsEdit />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="curriculum" element={<Curriculum />} />
            <Route path="gallery" element={<Gallery />} />
          </Route>
        </Route>

        {/* Anything else */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
