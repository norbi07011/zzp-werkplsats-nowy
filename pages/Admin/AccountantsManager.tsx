import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToasts } from "../../contexts/ToastContext";
import { supabase } from "@/lib/supabase";
import {
  User,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from "lucide-react";

type Accountant = {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  created_at: string;
};

export const AccountantsManager = () => {
  const { addToast } = useToasts();
  const navigate = useNavigate();

  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "verified" | "unverified"
  >("all");

  // Fetch accountants from database
  useEffect(() => {
    fetchAccountants();
  }, []);

  const fetchAccountants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("accountants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccountants((data || []) as Accountant[]);
    } catch (error) {
      console.error("❌ Error fetching accountants:", error);
      addToast("Błąd podczas ładowania księgowych", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToggle = async (
    id: string,
    currentStatus: boolean | null
  ) => {
    try {
      const { error } = await supabase
        .from("accountants")
        .update({ is_verified: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      addToast(
        `Księgowy ${!currentStatus ? "zweryfikowany" : "odweryfikowany"}`,
        "success"
      );
      fetchAccountants(); // Refresh list
    } catch (error) {
      console.error("❌ Error verifying accountant:", error);
      addToast("Błąd podczas zmiany statusu weryfikacji", "error");
    }
  };

  const filteredAccountants = useMemo(() => {
    return accountants.filter((accountant) => {
      const matchesSearch =
        accountant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accountant.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "verified" && accountant.is_verified) ||
        (filterStatus === "unverified" && !accountant.is_verified);

      return matchesSearch && matchesStatus;
    });
  }, [accountants, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: accountants.length,
      verified: accountants.filter((a) => a.is_verified).length,
      unverified: accountants.filter((a) => !a.is_verified).length,
      newThisMonth: accountants.filter(
        (a) => new Date(a.created_at) >= thisMonthStart
      ).length,
    };
  }, [accountants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <span className="text-white text-lg">Ładowanie księgowych...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              📊 Zarządzanie Księgowymi
            </h1>
            <p className="text-gray-300">
              Przeglądaj księgowych, zarządzaj klientami i monitoruj usługi
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            ← Powrót
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-6 border border-blue-400/30">
            <div className="flex items-center justify-between mb-4">
              <User className="text-blue-300" size={32} />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {stats.total}
            </div>
            <div className="text-blue-300 text-sm">Wszyscy księgowi</div>
          </div>

          {/* Verified */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-6 border border-green-400/30">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="text-green-300" size={32} />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {stats.verified}
            </div>
            <div className="text-green-300 text-sm">Zweryfikowani</div>
            <div className="text-green-200 text-xs mt-2">
              {((stats.verified / stats.total) * 100 || 0).toFixed(0)}%
              wszystkich
            </div>
          </div>

          {/* Unverified */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md rounded-2xl p-6 border border-yellow-400/30">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="text-yellow-300" size={32} />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {stats.unverified}
            </div>
            <div className="text-yellow-300 text-sm">Niezweryfikowani</div>
            <div className="text-yellow-200 text-xs mt-2">
              Wymagają weryfikacji
            </div>
          </div>

          {/* New This Month */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-purple-300" size={32} />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {stats.newThisMonth}
            </div>
            <div className="text-purple-300 text-sm">Nowi w tym miesiącu</div>
            <div className="text-purple-200 text-xs mt-2">
              <Calendar className="inline mr-1" size={12} />
              {new Date().toLocaleString("pl-PL", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="🔍 Szukaj po nazwisku lub emailu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Filtruj po statusie weryfikacji"
            >
              <option value="all" className="bg-slate-800">
                Wszyscy
              </option>
              <option value="verified" className="bg-slate-800">
                Zweryfikowani
              </option>
              <option value="unverified" className="bg-slate-800">
                Niezweryfikowani
              </option>
            </select>
          </div>
        </div>

        {/* Accountants Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-white/10">
            {filteredAccountants.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <User className="mx-auto text-gray-600 mb-3" size={48} />
                <p className="text-lg">Brak księgowych do wyświetlenia</p>
              </div>
            ) : (
              filteredAccountants.map((accountant) => (
                <div
                  key={accountant.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                  onClick={() =>
                    navigate(`/profile/accountant/${accountant.id}`)
                  }
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        accountant.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${accountant.id}`
                      }
                      alt={accountant.full_name}
                      className="w-12 h-12 rounded-full border-2 border-white/20 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-white truncate">
                          {accountant.full_name}
                        </h3>
                        {accountant.is_verified ? (
                          <span className="text-green-400 text-xs flex items-center gap-1">
                            <CheckCircle size={12} /> Zweryfikowany
                          </span>
                        ) : (
                          <span className="text-yellow-400 text-xs flex items-center gap-1">
                            <AlertTriangle size={12} /> Niezweryfikowany
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {accountant.email}
                      </p>
                      {accountant.phone && (
                        <p className="text-sm text-gray-500">
                          {accountant.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Zarejestrowany:{" "}
                        {new Date(accountant.created_at).toLocaleDateString(
                          "pl-PL"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto scrollable-table-container scroll-right">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Księgowy
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Telefon
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Data rejestracji
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/80">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAccountants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <User className="text-gray-600" size={48} />
                        <p className="text-lg">
                          Brak księgowych do wyświetlenia
                        </p>
                        <p className="text-sm text-gray-500">
                          {searchTerm
                            ? "Spróbuj zmienić kryteria wyszukiwania"
                            : "Księgowi pojawią się tutaj po rejestracji"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccountants.map((accountant) => (
                    <tr
                      key={accountant.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/profile/accountant/${accountant.id}`)
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              accountant.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${accountant.id}`
                            }
                            alt={accountant.full_name}
                            className="w-10 h-10 rounded-full border-2 border-white/20"
                          />
                          <span className="text-white font-medium">
                            {accountant.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {accountant.email}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {accountant.phone || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {accountant.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-400/30">
                            <CheckCircle size={14} />
                            Zweryfikowany
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-medium border border-yellow-400/30">
                            <AlertTriangle size={14} />
                            Niezweryfikowany
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(accountant.created_at).toLocaleDateString(
                          "pl-PL",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/profile/accountant/${accountant.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                          >
                            👁️ Profil
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyToggle(
                                accountant.id,
                                accountant.is_verified
                              );
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                              accountant.is_verified
                                ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-400/30"
                                : "bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30"
                            }`}
                          >
                            {accountant.is_verified
                              ? "❌ Odweryfikuj"
                              : "✅ Weryfikuj"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export as default for lazy loading
export default AccountantsManager;
