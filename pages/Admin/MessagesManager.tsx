// @ts-nocheck
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useToasts } from "../../contexts/ToastContext";
import { useMessages } from "../../src/hooks/useMessages";
import { MessageReplyModal } from "../../components/Admin/MessageReplyModal";
import {
  RefreshCw,
  Mail,
  Inbox,
  AlertCircle,
  MessageSquare,
  Search,
  Filter,
} from "lucide-react";
import type {
  Message,
  MessageCategory,
  MessagePriority,
} from "../../src/services/messages";

const MessagesManager = () => {
  const { addToast } = useToasts();

  // Use Supabase data via custom hook
  const {
    messages: allMessages,
    unreadMessages,
    urgentUnreadMessages,
    stats: messageStats,
    loading,
    error,
    refreshMessages,
    markAsRead,
    markMultipleAsRead,
    reply: replyToMessage,
    remove: removeMessage,
    removeMultiple,
  } = useMessages();

  // Local state
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedMessageForReply, setSelectedMessageForReply] =
    useState<Message | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"messages" | "conversations">(
    "messages"
  );

  // Filter messages
  const filteredMessages = useMemo(() => {
    return allMessages.filter((msg) => {
      const matchesCategory =
        filterCategory === "all" || msg.category === filterCategory;
      const matchesPriority =
        filterPriority === "all" || msg.priority === filterPriority;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "read" && msg.is_read) ||
        (filterStatus === "unread" && !msg.is_read);
      const matchesSearch =
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.from_user?.profile?.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        msg.body.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesCategory && matchesPriority && matchesStatus && matchesSearch
      );
    });
  }, [allMessages, filterCategory, filterPriority, filterStatus, searchTerm]);

  // Handlers using Supabase operations
  const handleMarkAsRead = async (messageId: string) => {
    const success = await markAsRead(messageId);
    if (success) {
      addToast("Wiadomość oznaczona jako przeczytana", "success");
    } else {
      addToast("Błąd oznaczania wiadomości", "error");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę wiadomość?")) return;

    const success = await removeMessage(messageId);
    if (success) {
      addToast("Wiadomość została usunięta", "success");
      setSelectedMessage(null);
    } else {
      addToast("Błąd usuwania wiadomości", "error");
    }
  };

  const handleReply = (message: Message) => {
    setSelectedMessageForReply(message);
    setShowReplyModal(true);
  };

  const handleSendReply = async (replyBody: string) => {
    if (!selectedMessageForReply) return;

    // TODO: Get current admin user ID from auth context
    const adminUserId = "current-admin-id"; // Replace with actual auth

    const reply = await replyToMessage(
      selectedMessageForReply.id,
      adminUserId,
      replyBody
    );

    if (reply) {
      addToast("Odpowiedź wysłana", "success");
      setShowReplyModal(false);
      setSelectedMessageForReply(null);
    } else {
      addToast("Błąd wysyłania odpowiedzi", "error");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-400">Ładowanie wiadomości...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 mb-4">❌ Błąd ładowania: {error}</p>
          <button
            onClick={refreshMessages}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            🔄 Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    total: messageStats.total,
    unread: messageStats.unread,
    urgent: messageStats.byPriority.urgent,
    inquiry: messageStats.byCategory.inquiry,
    complaint: messageStats.byCategory.complaint,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              💬 Zarządzanie Wiadomościami
            </h1>
            <p className="text-gray-300">
              Przeglądaj i odpowiadaj na wiadomości użytkowników
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            ← Powrót
          </Link>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
            <button
              onClick={() => setViewMode("messages")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                viewMode === "messages"
                  ? "bg-blue-500 text-white shadow-glow-blue"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              💬 Wiadomości
            </button>
            <button
              onClick={() => setViewMode("conversations")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                viewMode === "conversations"
                  ? "bg-purple-500 text-white shadow-glow-purple"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🧵 Konwersacje
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-6 border border-blue-400/30">
            <div className="text-blue-300 text-sm font-medium mb-2">
              Wszystkie
            </div>
            <div className="text-4xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md rounded-2xl p-6 border border-red-400/30">
            <div className="text-red-300 text-sm font-medium mb-2">
              Nieprzeczytane
            </div>
            <div className="text-4xl font-bold text-white">{stats.unread}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-md rounded-2xl p-6 border border-orange-400/30">
            <div className="text-orange-300 text-sm font-medium mb-2">
              Pilne
            </div>
            <div className="text-4xl font-bold text-white">{stats.urgent}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30">
            <div className="text-purple-300 text-sm font-medium mb-2">
              Konwersacje
            </div>
            <div className="text-4xl font-bold text-white">
              {stats.conversations}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-6 border border-green-400/30">
            <div className="text-green-300 text-sm font-medium mb-2">
              Zapytania
            </div>
            <div className="text-4xl font-bold text-white">{stats.inquiry}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md rounded-2xl p-6 border border-yellow-400/30">
            <div className="text-yellow-300 text-sm font-medium mb-2">
              Reklamacje
            </div>
            <div className="text-4xl font-bold text-white">
              {stats.complaint}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Szukaj wiadomości..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filtruj według kategorii"
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400"
            >
              <option value="all">Wszystkie kategorie</option>
              <option value="inquiry">Zapytania</option>
              <option value="complaint">Reklamacje</option>
              <option value="support">Wsparcie</option>
              <option value="feedback">Opinie</option>
              <option value="other">Inne</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              aria-label="Filtruj według priorytetu"
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400"
            >
              <option value="all">Wszystkie priorytety</option>
              <option value="low">Niski</option>
              <option value="normal">Normalny</option>
              <option value="high">Wysoki</option>
              <option value="urgent">Pilny</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filtruj według statusu"
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="read">Przeczytane</option>
              <option value="unread">Nieprzeczytane</option>
            </select>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-white/10">
            {filteredMessages.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-xl text-gray-400">Brak wiadomości</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 hover:bg-white/5 transition-colors ${!msg.is_read ? 'bg-blue-500/5' : ''}`}
                  onClick={() => setSelectedMessage(msg)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {!msg.is_read ? (
                        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-glow-blue"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-white truncate">
                          {msg.from_user?.profile?.full_name || "Brak danych"}
                        </h3>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(msg.created_at).toLocaleDateString("pl-PL")}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium truncate">{msg.subject}</p>
                      <p className="text-sm text-gray-400 truncate">{msg.body}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          msg.category === "inquiry" ? "bg-blue-500/20 text-blue-400" :
                          msg.category === "complaint" ? "bg-red-500/20 text-red-400" :
                          msg.category === "support" ? "bg-green-500/20 text-green-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {msg.category === "inquiry" ? "Zapytanie" :
                           msg.category === "complaint" ? "Reklamacja" :
                           msg.category === "support" ? "Wsparcie" : "Inne"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          msg.priority === "urgent" ? "bg-red-500/20 text-red-400" :
                          msg.priority === "high" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {msg.priority === "urgent" ? "🔴 Pilne" :
                           msg.priority === "high" ? "🟡 Wysokie" : "🔵 Normalne"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto scrollable-table-container scroll-right">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Od
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Temat
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Kategoria
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Priorytet
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Data
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => {
                  const conversationMessages = allMessages.filter(
                    (m) => m.conversation_id === msg.conversation_id
                  );

                  return (
                    <tr
                      key={msg.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!msg.is_read && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-glow-blue"></div>
                          )}
                          {msg.is_read && (
                            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          {msg.from_user?.profile?.full_name || "Brak danych"}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {msg.from_user?.profile?.role === "client"
                            ? "👤 Klient"
                            : msg.from_user?.profile?.role === "worker"
                            ? "👷 Pracownik"
                            : "👨‍💼 Admin"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          {msg.subject}
                        </div>
                        <div className="text-gray-400 text-sm truncate max-w-xs">
                          {msg.body}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            msg.category === "inquiry"
                              ? "bg-blue-500/20 text-blue-400"
                              : msg.category === "complaint"
                              ? "bg-red-500/20 text-red-400"
                              : msg.category === "support"
                              ? "bg-green-500/20 text-green-400"
                              : msg.category === "feedback"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {msg.category === "inquiry"
                            ? "Zapytanie"
                            : msg.category === "complaint"
                            ? "Reklamacja"
                            : msg.category === "support"
                            ? "Wsparcie"
                            : msg.category === "feedback"
                            ? "Opinia"
                            : "Inne"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              msg.priority === "urgent"
                                ? "bg-red-500/20 text-red-400"
                                : msg.priority === "high"
                                ? "bg-orange-500/20 text-orange-400"
                                : msg.priority === "normal"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {msg.priority === "urgent"
                              ? "Pilny"
                              : msg.priority === "high"
                              ? "Wysoki"
                              : msg.priority === "normal"
                              ? "Normalny"
                              : "Niski"}
                          </span>
                          {conversationMessages.length > 1 && (
                            <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">
                              {conversationMessages.length} msg
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(msg.sent_at).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {!msg.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(msg.id)}
                              className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                              title="Oznacz jako przeczytane"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => handleReply(msg)}
                            className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                            title="Odpowiedz"
                          >
                            ↪️
                          </button>
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                            title="Podgląd"
                          >
                            👁️
                          </button>
                          {msg.priority !== "urgent" && (
                            <button
                              onClick={() => handleEscalateMessage(msg.id)}
                              className="px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-all"
                              title="Eskaluj"
                            >
                              ⚠️
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                            title="Usuń"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMessages.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <div className="text-6xl mb-4">📧</div>
              <div className="text-xl mb-2">Brak wiadomości</div>
              <div>Nie znaleziono wiadomości spełniających kryteria</div>
            </div>
          )}
        </div>

        {/* Message Reply Modal */}
        {showReplyModal && selectedMessageForReply && (
          <MessageReplyModal
            isOpen={showReplyModal}
            originalMessage={selectedMessageForReply}
            onClose={() => {
              setShowReplyModal(false);
              setSelectedMessageForReply(null);
            }}
            onSent={(reply) => {
              const newMessage: Message = {
                id: messages.length + 1,
                from: "Admin",
                fromRole: "admin",
                to: selectedMessageForReply.from,
                toRole: selectedMessageForReply.fromRole,
                subject: `Re: ${selectedMessageForReply.subject}`,
                body: reply.content,
                sentDate: new Date().toISOString().split("T")[0],
                isRead: true,
                category: selectedMessageForReply.category,
                priority: selectedMessageForReply.priority,
                conversationId: selectedMessageForReply.conversationId,
                parentMessageId: selectedMessageForReply.id,
              };
              setMessages((prev) => [...prev, newMessage]);
              setShowReplyModal(false);
              setSelectedMessageForReply(null);
              addToast("Odpowiedź została wysłana", "success");
            }}
          />
        )}

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-600 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {selectedMessage.subject}
                    </h3>
                    <div className="flex items-center gap-4 text-gray-400">
                      <span>Od: {selectedMessage.from}</span>
                      <span>•</span>
                      <span>{selectedMessage.sentDate}</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          selectedMessage.priority === "urgent"
                            ? "bg-red-500/20 text-red-400"
                            : selectedMessage.priority === "high"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {selectedMessage.priority === "urgent"
                          ? "Pilny"
                          : selectedMessage.priority === "high"
                          ? "Wysoki"
                          : "Normalny"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-slate-700/50 rounded-xl p-6">
                    <div className="text-white leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.body}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      handleReply(selectedMessage);
                      setSelectedMessage(null);
                    }}
                    className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-semibold"
                  >
                    ↪️ Odpowiedz
                  </button>
                  {!selectedMessage.isRead && (
                    <button
                      onClick={() => {
                        handleMarkAsRead(selectedMessage.id);
                        setSelectedMessage(null);
                      }}
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold"
                    >
                      ✓ Oznacz jako przeczytane
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all font-semibold"
                  >
                    Zamknij
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { MessagesManager };
export default MessagesManager;
