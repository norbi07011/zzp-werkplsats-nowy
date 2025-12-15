import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// =====================================================
// TYPES
// =====================================================

interface Subscription {
  id: string;
  user_id: string;
  profile_id: string;
  user_type: "worker" | "employer" | "cleaning_company" | "accountant";

  // User info
  full_name?: string;
  email?: string;
  company_name?: string;

  // Subscription details
  subscription_tier: "basic" | "pro" | "premium";
  subscription_status: "active" | "cancelled" | "expired" | "trial";
  monthly_fee: number;

  // Dates
  subscription_start_date: string;
  subscription_end_date?: string;
  last_payment_date?: string;

  // Stripe
  stripe_customer_id?: string;
  stripe_subscription_id?: string;

  // Promocje/ulgi
  discount_code?: string;
  discount_percentage?: number;
  is_annual?: boolean;

  created_at: string;
}

interface SubscriptionStats {
  total: number;
  active: number;
  cancelled: number;
  trial: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
}

// =====================================================
// COMPONENT
// =====================================================

export const SubscriptionsManager: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    cancelled: 0,
    trial: 0,
    mrr: 0,
    arr: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status: string;
    tier: string;
    userType: string;
  }>({
    status: "all",
    tier: "all",
    userType: "all",
  });

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      console.log("[SubscriptionsManager] Starting to load subscriptions...");

      // Fetch all subscriptions from different tables
      const [
        { data: workers, error: workersError },
        { data: employers, error: employersError },
        { data: cleaningCompanies, error: cleaningError },
        { data: accountants, error: accountantsError },
      ] = await Promise.all([
        // Workers
        supabase.from("workers").select(`
            id,
            profile_id,
            subscription_tier,
            subscription_status,
            subscription_start_date,
            subscription_end_date,
            last_payment_date,
            monthly_fee,
            stripe_customer_id,
            stripe_subscription_id,
            profiles!workers_profile_id_fkey(full_name, email)
          `),
        // Employers
        supabase.from("employers").select(`
            id,
            profile_id,
            company_name,
            subscription_tier,
            subscription_status,
            subscription_start_date,
            created_at,
            profiles!employers_profile_id_fkey(email)
          `),
        // Cleaning Companies
        supabase.from("cleaning_companies").select(`
            id,
            profile_id,
            company_name,
            subscription_tier,
            subscription_status,
            created_at,
            profiles!cleaning_companies_profile_id_fkey(email)
          `),
        // Accountants
        supabase.from("accountants").select(`
            id,
            profile_id,
            company_name,
            subscription_tier,
            subscription_status,
            created_at,
            profiles!accountants_profile_id_fkey(email)
          `),
      ]);

      // Log results
      console.log("[SubscriptionsManager] Query results:", {
        workers: workers?.length || 0,
        workersError: workersError?.message,
        employers: employers?.length || 0,
        employersError: employersError?.message,
        cleaningCompanies: cleaningCompanies?.length || 0,
        cleaningError: cleaningError?.message,
        accountants: accountants?.length || 0,
        accountantsError: accountantsError?.message,
      });

      // If there are errors, log them
      if (workersError)
        console.error("[SubscriptionsManager] Workers error:", workersError);
      if (employersError)
        console.error(
          "[SubscriptionsManager] Employers error:",
          employersError
        );
      if (cleaningError)
        console.error("[SubscriptionsManager] Cleaning error:", cleaningError);
      if (accountantsError)
        console.error(
          "[SubscriptionsManager] Accountants error:",
          accountantsError
        );

      // Transform workers
      const workerSubs: Subscription[] = (workers || []).map((w: any) => ({
        id: w.id,
        user_id: w.profile_id,
        profile_id: w.profile_id,
        user_type: "worker" as const,
        full_name: w.profiles?.full_name,
        email: w.profiles?.email,
        subscription_tier: w.subscription_tier || "basic",
        subscription_status: w.subscription_status || "active",
        monthly_fee: parseFloat(w.monthly_fee || "13"),
        subscription_start_date: w.subscription_start_date,
        subscription_end_date: w.subscription_end_date,
        last_payment_date: w.last_payment_date,
        stripe_customer_id: w.stripe_customer_id,
        stripe_subscription_id: w.stripe_subscription_id,
        created_at: w.subscription_start_date,
      }));

      // Transform employers
      const employerSubs: Subscription[] = (employers || []).map((e: any) => ({
        id: e.id,
        user_id: e.profile_id,
        profile_id: e.profile_id,
        user_type: "employer" as const,
        company_name: e.company_name,
        email: e.profiles?.email,
        subscription_tier: e.subscription_tier || "basic",
        subscription_status: e.subscription_status || "active",
        monthly_fee:
          e.subscription_tier === "premium"
            ? 25 // Premium €25
            : 13, // Basic €13
        subscription_start_date: e.subscription_start_date || e.created_at,
        created_at: e.subscription_start_date || e.created_at,
      }));

      // Transform cleaning companies
      const cleaningSubs: Subscription[] = (cleaningCompanies || []).map(
        (c: any) => ({
          id: c.id,
          user_id: c.profile_id,
          profile_id: c.profile_id,
          user_type: "cleaning_company" as const,
          company_name: c.company_name,
          email: c.profiles?.email,
          subscription_tier: c.subscription_tier || "basic",
          subscription_status: c.subscription_status || "active",
          monthly_fee:
            c.subscription_tier === "premium"
              ? 149
              : c.subscription_tier === "pro"
              ? 99
              : 49,
          subscription_start_date: c.created_at,
          created_at: c.created_at,
        })
      );

      // Transform accountants
      const accountantSubs: Subscription[] = (accountants || []).map(
        (a: any) => ({
          id: a.id,
          user_id: a.profile_id,
          profile_id: a.profile_id,
          user_type: "accountant" as const,
          company_name: a.company_name,
          email: a.profiles?.email,
          subscription_tier: a.subscription_tier || "basic",
          subscription_status: a.subscription_status || "active",
          monthly_fee:
            a.subscription_tier === "premium"
              ? 129
              : a.subscription_tier === "pro"
              ? 79
              : 29,
          subscription_start_date: a.created_at,
          created_at: a.created_at,
        })
      );

      // Combine all subscriptions
      const allSubs = [
        ...workerSubs,
        ...employerSubs,
        ...cleaningSubs,
        ...accountantSubs,
      ];

      console.log("[SubscriptionsManager] All subscriptions loaded:", {
        total: allSubs.length,
        workers: workerSubs.length,
        employers: employerSubs.length,
        cleaning: cleaningSubs.length,
        accountants: accountantSubs.length,
        data: allSubs,
      });

      setSubscriptions(allSubs);

      // Calculate stats
      const activeCount = allSubs.filter(
        (s) => s.subscription_status === "active"
      ).length;
      const cancelledCount = allSubs.filter(
        (s) => s.subscription_status === "cancelled"
      ).length;
      const trialCount = allSubs.filter(
        (s) => s.subscription_status === "trial"
      ).length;

      const mrr = allSubs
        .filter((s) => s.subscription_status === "active")
        .reduce((sum, s) => sum + s.monthly_fee, 0);

      setStats({
        total: allSubs.length,
        active: activeCount,
        cancelled: cancelledCount,
        trial: trialCount,
        mrr,
        arr: mrr * 12,
      });

      console.log("📊 SUBSCRIPTIONS DEBUG:", {
        total: allSubs.length,
        workers: workerSubs.length,
        employers: employerSubs.length,
        cleaning: cleaningSubs.length,
        accountants: accountantSubs.length,
        mrr: mrr.toFixed(2),
      });
    } catch (error) {
      console.error("❌ Error loading subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FILTERING
  // =====================================================

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filter.status !== "all" && sub.subscription_status !== filter.status)
      return false;
    if (filter.tier !== "all" && sub.subscription_tier !== filter.tier)
      return false;
    if (filter.userType !== "all" && sub.user_type !== filter.userType)
      return false;
    return true;
  });

  // =====================================================
  // HELPERS
  // =====================================================

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
      trial: "bg-blue-100 text-blue-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      basic: "bg-blue-100 text-blue-800",
      pro: "bg-purple-100 text-purple-800",
      premium: "bg-yellow-100 text-yellow-800",
    };
    return colors[tier as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getUserTypeLabel = (type: string) => {
    const labels = {
      worker: "👷 Worker",
      employer: "🏢 Employer",
      cleaning_company: "🧹 Cleaning",
      accountant: "📊 Accountant",
    };
    return labels[type as keyof typeof labels] || type;
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Ładowanie subskrypcji...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          📋 Zarządzanie Subskrypcjami
        </h1>
        <p className="text-gray-600 mt-2">
          Pełna historia subskrypcji - wszyscy użytkownicy, plany, ulgi i
          płatności
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Wszystkie</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-green-600">Aktywne</div>
          <div className="text-3xl font-bold text-green-600">
            {stats.active}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-red-600">Anulowane</div>
          <div className="text-3xl font-bold text-red-600">
            {stats.cancelled}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-blue-600">Trial</div>
          <div className="text-3xl font-bold text-blue-600">{stats.trial}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-purple-600">MRR</div>
          <div className="text-3xl font-bold text-purple-600">
            €{stats.mrr.toFixed(0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-yellow-600">ARR</div>
          <div className="text-3xl font-bold text-yellow-600">
            €{stats.arr.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">Wszystkie</option>
              <option value="active">Aktywne</option>
              <option value="cancelled">Anulowane</option>
              <option value="trial">Trial</option>
              <option value="expired">Wygasłe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan
            </label>
            <select
              value={filter.tier}
              onChange={(e) => setFilter({ ...filter, tier: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">Wszystkie</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ użytkownika
            </label>
            <select
              value={filter.userType}
              onChange={(e) =>
                setFilter({ ...filter, userType: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">Wszystkie</option>
              <option value="worker">Workers</option>
              <option value="employer">Employers</option>
              <option value="cleaning_company">Cleaning Companies</option>
              <option value="accountant">Accountants</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Użytkownik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  MRR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Start
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ostatnia płatność
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {sub.full_name || sub.company_name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">{sub.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">
                      {getUserTypeLabel(sub.user_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierBadge(
                        sub.subscription_tier
                      )}`}
                    >
                      {sub.subscription_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                        sub.subscription_status
                      )}`}
                    >
                      {sub.subscription_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    €{sub.monthly_fee.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sub.subscription_start_date
                      ? new Date(
                          sub.subscription_start_date
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sub.last_payment_date
                      ? new Date(sub.last_payment_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Brak subskrypcji spełniających kryteria filtrowania
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Podsumowanie</h3>
        <div className="text-sm text-gray-600">
          Wyświetlono {filteredSubscriptions.length} z {stats.total} subskrypcji
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsManager;
