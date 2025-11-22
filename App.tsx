import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/RealTimeNotificationContext";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { ToastProvider } from "./components/ToastProvider";
import { OfflineProvider, OfflineIndicator } from "./components/OfflineHandler";
import { ProtectedRoute, CleaningRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./layouts/PublicLayout";
import { AuthenticatedLayout } from "./layouts/AuthenticatedLayout";
import { LoadingOverlay } from "./components/Loading";
import { EnhancedErrorBoundary } from "./components/EnhancedErrorBoundary";
import "./src/styles/theme.css";

// Public pages (keep eager loaded - first paint critical)
import { HomePage } from "./pages/public/HomePage";
import { AboutPage } from "./pages/public/AboutPage";
import { ExperienceCertificatePage } from "./pages/public/ExperienceCertificatePage";
import { ForEmployersPage } from "./pages/public/ForEmployersPage";
import { ContactPage } from "./pages/public/ContactPage";
import { LoginPage } from "./pages/public/LoginPage";
import { RegisterSelectPage } from "./pages/public/RegisterSelectPage";
import { RegisterEmployerPage } from "./pages/public/RegisterEmployerPage";
import { RegisterWorkerPage } from "./pages/public/RegisterWorkerPage";
import { RegisterAccountantPage } from "./pages/public/RegisterAccountantPage";
import { RegisterCleaningPage } from "./pages/public/RegisterCleaningPage";
import { LegalPage } from "./pages/public/LegalPage";
import SplineTestPage from "./pages/public/SplineTestPage";
import VerifyCertificatePage from "./pages/public/VerifyCertificatePage";

// Accountant pages
import AccountantRegistration from "./pages/AccountantRegistration";
import AccountantDashboard from "./pages/accountant/AccountantDashboard";
import AccountantProfilePage from "./pages/public/AccountantProfilePage";
import AccountantSearchPage from "./pages/public/AccountantSearchPage";
import EmployerSearchPage from "./pages/public/EmployerSearchPage";
import EmployerPublicProfilePage from "./pages/public/EmployerPublicProfilePage";
import WorkerPublicProfilePage from "./pages/public/WorkerPublicProfilePage";
import CleaningCompanyPublicProfilePage from "./pages/public/CleaningCompanyPublicProfilePage";
import AdminPublicProfilePage from "./pages/public/AdminPublicProfilePage";
import FeedPage from "./pages/FeedPage_PREMIUM"; // 🚀 ULTRA-PREMIUM FEED 2025
import TeamDashboard from "./components/TeamDashboard";
import { Settings } from "./pages/Settings";

// Admin pages (LAZY LOADED - 70% bundle reduction!)
const AdminDashboard = lazy(() =>
  import("./pages/AdminDashboard").then((m) => ({ default: m.AdminDashboard }))
);
// ❌ REMOVED OLD DUPLICATES:
// - AdminWorkersPage (OLD: pages/Admin/) → use WorkersManager (NEW: src/pages/admin/)
// - AdminEmployersPage (OLD) → use EmployersManager (NEW)
// - AdminAccountantsPage (OLD) → use src/pages/admin/ version
// - AdminCleaningCompaniesPage (OLD) → use src/pages/admin/ version
// - AdminAppointmentsPage (OLD) → use AppointmentsManager (NEW)

const WorkersManager = lazy(() => import("./pages/Admin/WorkersManager"));
const EmployersManager = lazy(() => import("./pages/Admin/EmployersManager"));
const MediaManager = lazy(() => import("./pages/Admin/MediaManager"));
const MessagesManager = lazy(() => import("./pages/Admin/MessagesManager"));
const SupportTicketsManager = lazy(
  () => import("./pages/Admin/SupportTicketsManager")
);
const BillingManager = lazy(() => import("./pages/Admin/BillingManager"));
// ❌ REMOVED: AnalyticsManager (DUPLICATE - using DataAnalyticsPage instead)
const SecurityManager = lazy(() => import("./pages/Admin/SecurityManager"));
// ❌ REMOVED ENTERPRISE: SEOManager, EmailMarketingManager, BlogCMSManager
const DatabaseManager = lazy(() => import("./pages/Admin/DatabaseManager"));
const AppointmentsManager = lazy(
  () => import("./pages/Admin/AppointmentsManager")
);
const TestScheduler = lazy(() => import("./pages/Admin/TestSchedulerPageNew"));
const CertificatesManager = lazy(
  () => import("./pages/Admin/CertificatesManager")
);
const CertificateGenerator = lazy(
  () => import("./pages/Admin/CertificateGenerator")
);
const GeneratedCertificatesList = lazy(
  () => import("./pages/Admin/GeneratedCertificatesList")
);
const SettingsPanel = lazy(() => import("./pages/Admin/SettingsPanel"));
const PaymentsManager = lazy(() => import("./pages/Admin/PaymentsManager"));
const SubscriptionsManager = lazy(
  () => import("./pages/Admin/SubscriptionsManager")
);
const AccountantsManager = lazy(
  () => import("./pages/Admin/AccountantsManager")
);
const CleaningCompaniesManager = lazy(
  () => import("./pages/Admin/CleaningCompaniesManager")
);

// MyPosts components for creators
const EmployerMyPosts = lazy(() => import("./pages/employer/MyPosts"));
const AccountantMyPosts = lazy(() => import("./pages/accountant/MyPosts"));
const AdminMyPosts = lazy(() => import("./pages/Admin/MyPosts"));

// SavedActivity components for all roles
const EmployerSavedActivity = lazy(
  () => import("./pages/employer/SavedActivity")
);
const AccountantSavedActivity = lazy(
  () => import("./pages/accountant/SavedActivity")
);
const AdminSavedActivity = lazy(() => import("./pages/Admin/SavedActivity"));
const WorkerSavedActivity = lazy(() => import("./pages/worker/SavedActivity"));
const CleaningCompanySavedActivity = lazy(
  () => import("./pages/CleaningCompany/SavedActivity")
);

const CleaningCompanyDashboard = lazy(() =>
  import("./pages/CleaningCompany/CleaningCompanyDashboard").then((m) => ({
    default: m.default,
  }))
);
const NotificationsManager = lazy(
  () => import("./pages/Admin/NotificationsManager")
);
const ReportsManager = lazy(() => import("./pages/Admin/ReportsManager"));
// ❌ REMOVED ENTERPRISE: AdminPerformancePage, AdvancedSearchPage, APIIntegrationAutomationPage, SecurityCompliancePage
const DataAnalyticsPage = lazy(() => import("./pages/Admin/DataAnalyticsPage"));
// ❌ REMOVED: SystemMonitoringPage - file does not exist
// const SystemMonitoringPage = lazy(
//   () => import("./src/pages/admin/SystemMonitoringPage")
// );
// ❌ REMOVED: BackupRecoveryPage - file does not exist
// const BackupRecoveryPage = lazy(
//   () => import("./src/pages/admin/BackupRecoveryPage")
// );

// Subscription & Certificate Management (FAZA 4)
const CertificateApprovalPage = lazy(() =>
  import("./pages/Admin/CertificateApproval").then((m) => ({
    default: m.AdminCertificateApproval,
  }))
);
const SubscriptionsManagementPage = lazy(() =>
  import("./pages/Admin/Subscriptions").then((m) => ({
    default: m.AdminSubscriptions,
  }))
);

// ❌ REMOVED: Payment success pages - files do not exist
// const PaymentSuccessPage = lazy(() =>
//   import("./src/pages/PaymentSuccess").then((m) => ({
//     default: m.PaymentSuccessPage,
//   }))
// );
// const ExamSuccessPage = lazy(() =>
//   import("./src/pages/ExamPaymentSuccess").then((m) => ({
//     default: m.ExamPaymentSuccessPage,
//   }))
// );

// ❌ REMOVED: ZZP Exam & System Settings - files do not exist
// const ZZPExamApplicationPage = lazy(
//   () => import("./src/pages/ZZPExamApplicationPage")
// );
// const SystemSettingsPage = lazy(
//   () => import("./src/pages/admin/SystemSettingsPage")
// );
// const AdminDocumentationPage = lazy(
//   () => import("./src/pages/admin/AdminDocumentationPage")
// );

// Test pages (LAZY LOADED)
// ❌ REMOVED: AvatarUploadTest - moved to archiwum/smieci
// ❌ REMOVED: SupabaseAuthTest - moved to archiwum/smieci
const AdvancedUIDemo = lazy(() => import("./pages/AdvancedUIDemo"));
const ErrorHandlingUXDemo = lazy(() => import("./pages/ErrorHandlingUXDemo"));
const TestCommunicationPage = lazy(() =>
  import("./pages/TestCommunicationPage").then((m) => ({
    default: m.TestCommunicationPage,
  }))
);
const TestRealtimeCommunicationPage = lazy(() =>
  import("./pages/TestRealtimeCommunicationPage").then((m) => ({
    default: m.TestRealtimeCommunicationPage,
  }))
);

// Employer pages (LAZY LOADED)
const WorkerSearch = lazy(() =>
  import("./pages/employer/WorkerSearch").then((m) => ({
    default: m.WorkerSearch,
  }))
);
const CleaningCompanySearch = lazy(() =>
  import("./pages/employer/CleaningCompanySearch").then((m) => ({
    default: m.default,
  }))
);
const SubscriptionManager = lazy(() =>
  import("./pages/employer/SubscriptionManager").then((m) => ({
    default: m.SubscriptionManager,
  }))
);
const EmployerDashboard = lazy(() =>
  import("./pages/employer/EmployerDashboard").then((m) => ({
    default: m.EmployerDashboard,
  }))
);
const EmployerProfile = lazy(() => import("./pages/employer/EmployerProfile"));
const EditEmployerProfile = lazy(
  () => import("./pages/employer/EditEmployerProfile")
);

// Worker pages (LAZY LOADED)
const WorkerDashboard = lazy(() => import("./pages/WorkerDashboard"));
const WorkerSubscriptionSelectionPage = lazy(
  () => import("./pages/worker/WorkerSubscriptionSelectionPage")
);
// Cleaning Company pages (LAZY LOADED) ✨ NOWE
// ❌ REMOVED: CleaningDashboard, CleaningReviewsPage, CleaningPortfolioPage - moved to archiwum
// CleaningCompanyProfile removed - use Dashboard Settings tab instead

// ✅ Invoice Module (LAZY LOADED) - faktury, BTW, koszty, kilometry
const InvoiceApp = lazy(() => import("./src/modules/invoices/InvoiceApp"));

function App() {
  return (
    <EnhancedErrorBoundary>
      <ThemeProvider>
        <ToastProvider position="top-right">
          <OfflineProvider autoSync={true} syncInterval={30000}>
            <OfflineIndicator position="top" />
            {/* WHY: provide Supabase session globally to all components */}
            <AuthProvider>
              <NotificationProvider>
                <BrowserRouter>
                  <Suspense
                    fallback={
                      <LoadingOverlay isLoading={true} message="Ładowanie..." />
                    }
                  >
                    <Routes>
                      {/* Public routes */}
                      <Route element={<PublicLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route
                          path="/experience-certificate"
                          element={<ExperienceCertificatePage />}
                        />
                        <Route
                          path="/for-employers"
                          element={<ForEmployersPage />}
                        />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route
                          path="/spline-test"
                          element={<SplineTestPage />}
                        />
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                          path="/register"
                          element={<RegisterSelectPage />}
                        />
                        <Route
                          path="/register/employer"
                          element={<RegisterEmployerPage />}
                        />
                        <Route
                          path="/register/worker"
                          element={<RegisterWorkerPage />}
                        />
                        <Route
                          path="/register/accountant"
                          element={<RegisterAccountantPage />}
                        />
                        <Route
                          path="/register/cleaning"
                          element={<RegisterCleaningPage />}
                        />
                        {/* Certificate Verification - Public */}
                        <Route
                          path="/verify/:certificateId"
                          element={<VerifyCertificatePage />}
                        />
                        {/* Public profile pages - beautiful full panels */}
                        <Route
                          path="/employer/profile/:id"
                          element={<EmployerPublicProfilePage />}
                        />
                        <Route
                          path="/worker/profile/:id"
                          element={<WorkerPublicProfilePage />}
                        />
                        <Route
                          path="/accountant/profile/:id"
                          element={<AccountantProfilePage />}
                        />
                        <Route
                          path="/cleaning-company/profile/:id"
                          element={<CleaningCompanyPublicProfilePage />}
                        />
                        <Route
                          path="/admin/profile/:id"
                          element={<AdminPublicProfilePage />}
                        />
                        {/* Legacy routes - redirect to new structure */}
                        <Route
                          path="/register-employer"
                          element={<Navigate to="/register/employer" replace />}
                        />
                        <Route
                          path="/register-worker"
                          element={<Navigate to="/register/worker" replace />}
                        />
                        <Route path="/legal" element={<LegalPage />} />
                        {/* ❌ REMOVED: PaymentSuccessPage - file doesn't exist */}
                        {/* <Route path="/payment-success" element={<PaymentSuccessPage />} /> */}
                        <Route
                          path="/payment-success"
                          element={<Navigate to="/dashboard" replace />}
                        />
                        {/* ❌ REMOVED: ExamSuccessPage - file doesn't exist */}
                        {/* <Route path="/exam-success" element={<ExamSuccessPage />} /> */}
                        <Route
                          path="/exam-success"
                          element={<Navigate to="/dashboard" replace />}
                        />
                        {/* ❌ REMOVED: Test pages moved to archiwum/smieci */}
                        {/* <Route path="/test/auth" element={<SupabaseAuthTest />} /> */}
                        {/* <Route path="/test/avatar-upload" element={<AvatarUploadTest />} /> */}
                        <Route
                          path="/test/communication"
                          element={<TestCommunicationPage />}
                        />
                        <Route
                          path="/test/communication-realtime"
                          element={<TestRealtimeCommunicationPage />}
                        />
                        <Route
                          path="/advanced-ui-demo"
                          element={<AdvancedUIDemo />}
                        />
                        <Route
                          path="/error-handling-demo"
                          element={<ErrorHandlingUXDemo />}
                        />
                      </Route>

                      {/* Protected Search Routes - require login */}
                      <Route element={<AuthenticatedLayout />}>
                        <Route path="/feed" element={<FeedPage />} />
                        <Route path="/team" element={<TeamDashboard />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route
                          path="/accountants"
                          element={<AccountantSearchPage />}
                        />
                        <Route
                          path="/employers"
                          element={<EmployerSearchPage />}
                        />
                        <Route
                          path="/workers"
                          element={
                            <ProtectedRoute>
                              <WorkerSearch />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/cleaning-companies"
                          element={
                            <ProtectedRoute>
                              <CleaningCompanySearch />
                            </ProtectedRoute>
                          }
                        />
                      </Route>

                      {/* Accountant Routes */}
                      <Route element={<AuthenticatedLayout />}>
                        <Route
                          path="/accountant/dashboard"
                          element={
                            <ProtectedRoute requiredRole="accountant">
                              <AccountantDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/accountant/moje-posty"
                          element={
                            <ProtectedRoute requiredRole="accountant">
                              <AccountantMyPosts />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/accountant/historia-aktywnosci"
                          element={
                            <ProtectedRoute requiredRole="accountant">
                              <AccountantSavedActivity />
                            </ProtectedRoute>
                          }
                        />
                      </Route>

                      {/* Admin routes (LAZY LOADED) */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <AuthenticatedLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<AdminDashboard />} />
                        <Route path="moje-posty" element={<AdminMyPosts />} />
                        <Route
                          path="historia-aktywnosci"
                          element={<AdminSavedActivity />}
                        />
                        <Route
                          path="certificate-approval"
                          element={<CertificateApprovalPage />}
                        />
                        {/* ❌ REMOVED: subscriptions duplicate - using SubscriptionsManager below (line 399) */}
                        {/* ❌ REMOVED: zzp-exams route - ZZPExamManagementPage not found */}
                        {/* ❌ REMOVED OLD DUPLICATE ROUTES:
                            - workers → AdminWorkersPage (OLD pages/Admin/) 
                            - employers → AdminEmployersPage (OLD)
                            - accountants → AdminAccountantsPage (OLD)
                            - cleaning-companies → AdminCleaningCompaniesPage (OLD)
                            USE ENTERPRISE VERSIONS BELOW (WorkersManager, etc.) */}

                        {/* OLD: AdminAppointmentsPage removed - using AppointmentsManager (enterprise) below */}
                        <Route path="media" element={<MediaManager />} />
                        <Route path="messages" element={<MessagesManager />} />
                        <Route
                          path="support"
                          element={<SupportTicketsManager />}
                        />
                        <Route path="billing" element={<BillingManager />} />
                        {/* ❌ REMOVED: analytics → AnalyticsManager (DUPLICATE - using DataAnalyticsPage below) */}
                        <Route path="security" element={<SecurityManager />} />
                        {/* ❌ REMOVED ENTERPRISE ROUTES: seo, email-marketing, blog */}
                        <Route path="database" element={<DatabaseManager />} />
                        <Route
                          path="appointments"
                          element={<AppointmentsManager />}
                        />
                        <Route path="scheduler" element={<TestScheduler />} />
                        {/* TestSlotsManager archived - use scheduler instead */}

                        {/* ✅ MANAGEMENT PANELS */}
                        <Route path="workers" element={<WorkersManager />} />
                        <Route
                          path="employers"
                          element={<EmployersManager />}
                        />
                        <Route
                          path="accountants"
                          element={<AccountantsManager />}
                        />
                        <Route
                          path="cleaning-companies"
                          element={<CleaningCompaniesManager />}
                        />

                        <Route path="payments" element={<PaymentsManager />} />
                        <Route
                          path="subscriptions"
                          element={<SubscriptionsManager />}
                        />
                        <Route
                          path="notifications"
                          element={<NotificationsManager />}
                        />
                        <Route path="reports" element={<ReportsManager />} />
                        <Route
                          path="certificates"
                          element={<CertificatesManager />}
                        />
                        <Route
                          path="certificates/generate"
                          element={<CertificateGenerator />}
                        />
                        <Route
                          path="certificates/generated"
                          element={<GeneratedCertificatesList />}
                        />
                        {/* ❌ REMOVED ENTERPRISE ROUTES: performance, performance-optimization, scalability-optimization, search, api-automation, security-compliance */}
                        <Route
                          path="analytics"
                          element={<DataAnalyticsPage />}
                        />
                        {/* ❌ REMOVED: monitoring and backup routes - files do not exist */}
                        {/* <Route path="monitoring" element={<SystemMonitoringPage />} /> */}
                        {/* <Route path="backup" element={<BackupRecoveryPage />} /> */}
                        {/* ❌ REMOVED: SystemSettingsPage - file doesn't exist */}
                        {/* <Route path="settings" element={<SystemSettingsPage />} /> */}
                        <Route
                          path="settings"
                          element={<Navigate to="/admin" replace />}
                        />
                        {/* ❌ REMOVED: AdminDocumentationPage - file doesn't exist */}
                        {/* <Route path="documentation" element={<AdminDocumentationPage />} /> */}
                        <Route
                          path="documentation"
                          element={<Navigate to="/admin" replace />}
                        />
                      </Route>

                      {/* Employer routes (LAZY LOADED) */}
                      {/* Subscription page - no subscription check */}
                      <Route
                        path="/employer/subscription"
                        element={
                          <ProtectedRoute requiredRole="employer">
                            <SubscriptionManager />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected employer routes - profile doesn't require subscription */}
                      <Route
                        path="/employer"
                        element={
                          <ProtectedRoute requiredRole="employer">
                            <AuthenticatedLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<EmployerDashboard />} />
                        <Route
                          path="moje-posty"
                          element={<EmployerMyPosts />}
                        />
                        <Route
                          path="historia-aktywnosci"
                          element={<EmployerSavedActivity />}
                        />
                        <Route path="profile" element={<EmployerProfile />} />
                        <Route
                          path="profile/edit"
                          element={<EditEmployerProfile />}
                        />

                        {/* Search requires subscription */}
                        <Route
                          path="search"
                          element={
                            <ProtectedRoute
                              requiredRole="employer"
                              requireSubscription={true}
                            >
                              <WorkerSearch />
                            </ProtectedRoute>
                          }
                        />
                      </Route>

                      {/* Worker routes (LAZY LOADED) */}
                      <Route
                        path="/worker"
                        element={
                          <ProtectedRoute requiredRole="worker">
                            <AuthenticatedLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<WorkerDashboard />} />
                        <Route
                          path="historia-aktywnosci"
                          element={<WorkerSavedActivity />}
                        />
                        {/* ❌ REMOVED: ZZPExamApplicationPage - file doesn't exist */}
                        {/* <Route path="zzp-exam-application" element={<ZZPExamApplicationPage />} /> */}
                        <Route
                          path="zzp-exam-application"
                          element={<Navigate to="/dashboard" replace />}
                        />
                        <Route
                          path="subscription-selection"
                          element={<WorkerSubscriptionSelectionPage />}
                        />
                      </Route>

                      {/* Cleaning Company routes (DEDICATED DASHBOARD) */}
                      <Route
                        path="/cleaning-company"
                        element={
                          <ProtectedRoute requiredRole="cleaning_company">
                            <AuthenticatedLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<CleaningCompanyDashboard />} />
                        <Route
                          path="historia-aktywnosci"
                          element={<CleaningCompanySavedActivity />}
                        />
                      </Route>

                      {/* ✅ Invoice Module - faktury, BTW, koszty, kilometry */}
                      <Route
                        path="/faktury"
                        element={
                          <ProtectedRoute requiredRole="cleaning_company">
                            <InvoiceApp />
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </NotificationProvider>
            </AuthProvider>
          </OfflineProvider>
        </ToastProvider>
      </ThemeProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;
