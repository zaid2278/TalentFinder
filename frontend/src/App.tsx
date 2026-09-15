import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppShell } from './components/AppShell';
import { TenantListPage } from './pages/TenantListPage';
import { CandidateListPage } from './pages/CandidateListPage';
import { CandidateCreatePage } from './pages/CandidateCreatePage';
import { CandidateDetailsPage } from './pages/CandidateDetailsPage';
import { JobOrderListPage } from './pages/JobOrderListPage';
import { JobOrderCreatePage } from './pages/JobOrderCreatePage';
import { JobOrderDetailsPage } from './pages/JobOrderDetailsPage';
import { SubmissionListPage } from './pages/SubmissionListPage';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/tenants" replace />} />
            <Route path="/tenants" element={<TenantListPage />} />
            <Route path="/candidates" element={<CandidateListPage />} />
            <Route path="/candidates/new" element={<CandidateCreatePage />} />
            <Route path="/candidates/:id" element={<CandidateDetailsPage />} />
            <Route path="/job-orders" element={<JobOrderListPage />} />
            <Route path="/job-orders/new" element={<JobOrderCreatePage />} />
            <Route path="/job-orders/:id" element={<JobOrderDetailsPage />} />
            <Route path="/submissions" element={<SubmissionListPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}