import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth, type UserRole } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requireAuth?: boolean;
  requireSubscription?: boolean; // NEW: Check for active subscription
}

// WHY: paths that should be accessible without active subscription (e.g. payment/onboarding pages)
// ALSO: paths where we may return from Stripe with temporary session loss
const SUBSCRIPTION_WHITELIST_PATHS = [
  "/employer/subscription",
  "/employer/payment",
  "/employer/checkout",
  "/cleaning-company/subscription", // Added for payment success redirect
  "/cleaning-company/payment",
  "/accountant/subscription", // Added for accountant payment success redirect
  "/worker/subscription",
  "/payment-success",
  "/payment-cancel",
];

export const ProtectedRoute = ({
  children,
  requiredRole,
  requireAuth = true,
  requireSubscription = false,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ✅ CRITICAL: Check if returning from Stripe payment - allow access for session recovery
  const isPaymentReturn =
    searchParams.get("payment_success") === "true" ||
    searchParams.get("success") === "true";
  const isWhitelistedPath = SUBSCRIPTION_WHITELIST_PATHS.some((path) =>
    location.pathname.startsWith(path)
  );

  // If returning from payment AND on whitelisted path, allow access (session will be recovered on page)
  if (isPaymentReturn && isWhitelistedPath) {
    console.log(
      "[ProtectedRoute] Payment return detected on whitelisted path, allowing access:",
      location.pathname
    );
    return <>{children}</>;
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no role is required, just check authentication
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Check if user has required role
  const allowedRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];
  const hasRequiredRole = user && allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    // Redirect based on user's actual role
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "employer":
        return <Navigate to="/employer" replace />;
      case "worker":
        return <Navigate to="/worker" replace />;
      case "cleaning_company":
        return <Navigate to="/cleaning-company" replace />;
      case "accountant":
        return <Navigate to="/accountant/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Check subscription requirement for employer role
  if (requireSubscription && user?.role === "employer") {
    // WHY: prevent redirect loop - whitelist paths that can be accessed without subscription
    const isWhitelisted = SUBSCRIPTION_WHITELIST_PATHS.some((path) =>
      location.pathname.startsWith(path)
    );

    if (isWhitelisted) {
      console.log(
        "[SUBS-GUARD] Path whitelisted, skipping subscription check:",
        location.pathname
      );
      return <>{children}</>;
    }

    const hasActiveSubscription = user.subscription?.status === "ACTIVE";
    console.log("[SUBS-GUARD] Subscription check:", {
      has_subscription: !!user.subscription,
      status: user.subscription?.status,
      hasActive: hasActiveSubscription,
      path: location.pathname,
    });

    if (!hasActiveSubscription) {
      console.log("[SUBS-GUARD] Redirecting to subscription page");
      // Redirect to subscription selection page
      return <Navigate to="/employer/subscription" replace />;
    }
  }

  return <>{children}</>;
};

// Helper component for admin-only routes
export const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

// Helper component for employer-only routes (with subscription check)
export const EmployerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRole="employer" requireSubscription={true}>
    {children}
  </ProtectedRoute>
);

// Helper component for worker-only routes
export const WorkerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRole="worker">{children}</ProtectedRoute>
);

// Helper component for cleaning company-only routes
export const CleaningRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRole="cleaning_company">{children}</ProtectedRoute>
);

// Helper component for accountant-only routes
export const AccountantRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => <ProtectedRoute requiredRole="accountant">{children}</ProtectedRoute>;

// Helper component for routes accessible by multiple roles
export const MultiRoleRoute = ({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: UserRole[];
}) => <ProtectedRoute requiredRole={roles}>{children}</ProtectedRoute>;
