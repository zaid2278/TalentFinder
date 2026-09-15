import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { store } from './store';
import { AppShell } from './components/AppShell';
import { AuthGuard } from './components/AuthGuard';
import { LoginPage } from './pages/LoginPage';
import { TenantListPage } from './pages/TenantListPage';
import { CandidateListPage } from './pages/CandidateListPage';
import { CandidateCreatePage } from './pages/CandidateCreatePage';
import { CandidateDetailsPage } from './pages/CandidateDetailsPage';
import { JobOrderListPage } from './pages/JobOrderListPage';
import { JobOrderCreatePage } from './pages/JobOrderCreatePage';
import { JobOrderDetailsPage } from './pages/JobOrderDetailsPage';
import { SubmissionListPage } from './pages/SubmissionListPage';
import { RecruitersPage } from './pages/RecruitersPage';
import { setUnauthorizedHandler } from './api/client';
import { logout } from './store/authSlice';

function UnauthorizedHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      store.dispatch(logout());
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <UnauthorizedHandler />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthGuard />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/tenants" replace />} />
              <Route path="/tenants" element={<TenantListPage />} />
              <Route path="/recruiters" element={<RecruitersPage />} />
              <Route path="/candidates" element={<CandidateListPage />} />
              <Route path="/candidates/new" element={<CandidateCreatePage />} />
              <Route path="/candidates/:id" element={<CandidateDetailsPage />} />
              <Route path="/job-orders" element={<JobOrderListPage />} />
              <Route path="/job-orders/new" element={<JobOrderCreatePage />} />
              <Route path="/job-orders/:id" element={<JobOrderDetailsPage />} />
              <Route path="/submissions" element={<SubmissionListPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
