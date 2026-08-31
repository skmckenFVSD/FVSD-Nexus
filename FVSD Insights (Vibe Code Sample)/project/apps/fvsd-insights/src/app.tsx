import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { initialize } from '@microsoft/power-apps/app';

import { AnalyticsShell } from '@/components/analytics-shell';
import { queryClient } from '@/lib/query-client';
import { RoleProvider } from '@/lib/role-context';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/system/error-boundary';

import { HomePage } from '@/pages/home-page';
import { SchoolProfilePage } from '@/pages/school-profile-page';
import { StudentSuccessPage } from '@/pages/student-success-page';
import { AttendancePage } from '@/pages/attendance-page';
import { LiteracyPage } from '@/pages/literacy-page';
import { InterventionTrackingPage } from '@/pages/intervention-tracking-page';
import { AnalyticsAssistantPage } from '@/pages/analytics-assistant-page';
import { SettingsPage } from '@/pages/settings-page';
import { DataQualityPage } from '@/pages/data-quality-page';
import { DataAdministrationPage } from '@/pages/data-administration-page';
import NotFoundPage from '@/pages/not-found';

function App() {
  useEffect(() => {
    initialize();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary resetQueryCache>
        <JotaiProvider>
          <Toaster richColors />
          <RoleProvider>
            <Router>
              <Routes>
                <Route path="/" element={<AnalyticsShell />}>
                  <Route index element={<HomePage />} />
                  <Route path="school-profile" element={<SchoolProfilePage />} />
                  <Route path="student-success" element={<StudentSuccessPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="literacy" element={<LiteracyPage />} />
                  <Route path="data-quality" element={<DataQualityPage />} />
                  <Route path="data-administration" element={<DataAdministrationPage />} />
                  <Route path="intervention-tracking" element={<InterventionTrackingPage />} />
                  <Route path="analytics-assistant" element={<AnalyticsAssistantPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Router>
          </RoleProvider>
        </JotaiProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
