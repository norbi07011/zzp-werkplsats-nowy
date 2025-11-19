/**
 * SUPPORT TICKETS MANAGER - Admin Panel
 * ========================================================
 *
 * FUNKCJONALNOŚĆ:
 * - Lista WSZYSTKICH support tickets (nie tylko user)
 * - Filtry (status, priority, category, user_role, search)
 * - Przypisywanie ticketów do admina
 * - Zmiana statusu (new → in_progress → resolved → closed)
 * - Wysyłanie wiadomości jako admin (is_internal dostępne)
 * - Dashboard stats (ile new, in_progress, waiting_user, resolved)
 */

import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllTickets,
  getTicketDetails,
  assignTicket,
  updateTicketStatus,
  sendAdminMessage,
  getTicketStats,
  type SupportTicket,
  type SupportMessage,
  type TicketFilters,
  type TicketStats,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
  type UserRole,
} from "../../src/services/supportTicketService";

export const SupportTicketsManager: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  // Filters
  const [filters, setFilters] = useState<TicketFilters>({
    status: [],
    priority: [],
    category: [],
    user_role: [],
    search: "",
  });

  // Load tickets on mount and when filters change
  useEffect(() => {
    loadTickets();
    loadStats();
    const interval = setInterval(() => {
      loadTickets();
      loadStats();
    }, 30000); // Refresh co 30s
    return () => clearInterval(interval);
  }, [filters]);

  // Load messages for selected ticket
  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
      const interval = setInterval(
        () => loadMessages(selectedTicket.id),
        15000
      );
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await getAllTickets(filters);
      setTickets(data);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("❌ Błąd ładowania zgłoszeń");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getTicketStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const data = await getTicketDetails(ticketId);
      setMessages(data.messages);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    if (!user) return;
    try {
      await assignTicket(ticketId, user.id);
      toast.success("✅ Ticket przypisany do Ciebie");
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, assigned_to: user.id });
      }
    } catch (error: any) {
      toast.error("❌ " + (error.message || "Błąd przypisywania ticketu"));
    }
  };

  const handleStatusChange = async (
    ticketId: string,
    newStatus: TicketStatus
  ) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      toast.success("✅ Status zmieniony");
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error: any) {
      toast.error("❌ " + (error.message || "Błąd zmiany statusu"));
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    setSending(true);
    try {
      await sendAdminMessage(selectedTicket.id, newMessage.trim(), isInternal);
      setNewMessage("");
      setIsInternal(false);
      loadMessages(selectedTicket.id);
      toast.success("✅ Wiadomość wysłana");
    } catch (error: any) {
      toast.error("❌ " + (error.message || "Błąd wysyłania wiadomości"));
    } finally {
      setSending(false);
    }
  };

  const getStatusBadgeColor = (status: TicketStatus) => {
    switch (status) {
      case "new":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "waiting_user":
        return "bg-yellow-100 text-yellow-700";
      case "resolved":
        return "bg-purple-100 text-purple-700";
      case "closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityBadgeColor = (priority: TicketPriority) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-600";
      case "medium":
        return "bg-blue-100 text-blue-600";
      case "high":
        return "bg-orange-100 text-orange-600";
      case "critical":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header with Stats */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Support Tickets
          </h1>
          <p className="text-gray-600">Zarządzanie zgłoszeniami użytkowników</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Nowe</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.new}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">W trakcie</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.in_progress}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Oczekuje</div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.waiting_user}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Rozwiązane</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.resolved}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Zamknięte</div>
              <div className="text-2xl font-bold text-gray-600">
                {stats.closed}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {[
                  { value: "new", label: "Nowe" },
                  { value: "in_progress", label: "W trakcie" },
                  { value: "waiting_user", label: "Oczekuje" },
                  { value: "resolved", label: "Rozwiązane" },
                  { value: "closed", label: "Zamknięte" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={(filters.status || []).includes(option.value as TicketStatus)}
                      onChange={(e) => {
                        const currentStatus = filters.status || [];
                        const newStatus = e.target.checked
                          ? [...currentStatus, option.value as TicketStatus]
                          : currentStatus.filter((s) => s !== option.value);
                        setFilters({ ...filters, status: newStatus });
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorytet
              </label>
              <div className="space-y-2">
                {[
                  { value: "low", label: "Niski" },
                  { value: "medium", label: "Średni" },
                  { value: "high", label: "Wysoki" },
                  { value: "critical", label: "Krytyczny" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={(filters.priority || []).includes(option.value as TicketPriority)}
                      onChange={(e) => {
                        const currentPriority = filters.priority || [];
                        const newPriority = e.target.checked
                          ? [...currentPriority, option.value as TicketPriority]
                          : currentPriority.filter((p) => p !== option.value);
                        setFilters({ ...filters, priority: newPriority });
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategoria
              </label>
              <div className="space-y-2">
                {[
                  { value: "technical", label: "Techniczny" },
                  { value: "billing", label: "Płatności" },
                  { value: "account", label: "Konto" },
                  { value: "bug", label: "Błąd" },
                  { value: "other", label: "Inne" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={(filters.category || []).includes(option.value as TicketCategory)}
                      onChange={(e) => {
                        const currentCategory = filters.category || [];
                        const newCategory = e.target.checked
                          ? [...currentCategory, option.value as TicketCategory]
                          : currentCategory.filter((c) => c !== option.value);
                        setFilters({ ...filters, category: newCategory });
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Szukaj
              </label>
              <input
                type="text"
                placeholder="Szukaj po subject, email..."
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() =>
              setFilters({
                status: [],
                priority: [],
                category: [],
                user_role: [],
                search: "",
              })
            }
            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
          >
            🔄 Wyczyść filtry
          </button>
        </div>

        {/* Main Content - Tickets List + Chat */}
        <div className="grid grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">
              Zgłoszenia ({tickets.length})
            </h2>
            <div className="space-y-3 max-h-[700px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Brak zgłoszeń
                </div>
              ) : (
                tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedTicket?.id === ticket.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm line-clamp-1 mb-1">
                          {ticket.subject}
                        </div>
                        <div className="text-xs text-gray-600">
                          {ticket.user_name} ({ticket.user_role})
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(ticket.created_at!).toLocaleString("pl-PL")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadgeColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {ticket.category}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ticket Detail + Chat */}
          <div className="col-span-2 bg-white rounded-lg shadow p-6">
            {selectedTicket ? (
              <div className="flex flex-col h-[800px]">
                {/* Ticket Header */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedTicket.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">User:</span>{" "}
                      <strong>{selectedTicket.user_name}</strong> (
                      {selectedTicket.user_email})
                    </div>
                    <div>
                      <span className="text-gray-600">Role:</span>{" "}
                      <strong>{selectedTicket.user_role}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>{" "}
                      <select
                        value={selectedTicket.status}
                        onChange={(e) =>
                          handleStatusChange(
                            selectedTicket.id,
                            e.target.value as TicketStatus
                          )
                        }
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="new">Nowy</option>
                        <option value="in_progress">W trakcie</option>
                        <option value="waiting_user">Oczekuje na user</option>
                        <option value="resolved">Rozwiązany</option>
                        <option value="closed">Zamknięty</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-gray-600">Priorytet:</span>{" "}
                      <strong>{selectedTicket.priority}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600">Przypisany:</span>{" "}
                      {selectedTicket.assigned_to ? (
                        <div className="inline-flex flex-col">
                          <strong className="text-green-700">
                            {selectedTicket.assigned_admin_name || "Admin"}
                          </strong>
                          {selectedTicket.assigned_admin_email && (
                            <span className="text-xs text-gray-500">
                              {selectedTicket.assigned_admin_email}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAssignTicket(selectedTicket.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Przypisz do mnie
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.is_internal
                          ? "bg-yellow-50 border border-yellow-200"
                          : msg.sender_role === "admin"
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium text-gray-700">
                          {msg.sender_name} ({msg.sender_role})
                          {msg.is_internal && (
                            <span className="ml-2 text-yellow-600">
                              🔒 Internal
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(msg.created_at!).toLocaleString("pl-PL")}
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-start gap-2 mb-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Wpisz odpowiedź..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 h-[80px]"
                    >
                      {sending ? "Wysyłanie..." : "📤 Wyślij"}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    🔒 Wiadomość wewnętrzna (nie widzi user)
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <span className="text-6xl mb-3 block">🎫</span>
                  <p>Wybierz zgłoszenie z listy</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportTicketsManager;
