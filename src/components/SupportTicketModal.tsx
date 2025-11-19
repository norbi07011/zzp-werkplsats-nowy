/**
 * SUPPORT TICKET MODAL - Główny kontener systemu wsparcia
 * ========================================================
 *
 * FUNKCJONALNOŚĆ:
 * - Otwierany z każdego dashboardu przez przycisk "Kontakt z Supportem"
 * - Tab 1: Utwórz nowy ticket (SupportTicketForm)
 * - Tab 2: Moje zgłoszenia (lista ticketów + chat)
 * - Auto-refresh co 30s dla nowych wiadomości
 * - Badge z liczbą nowych ticketów
 */

import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  createTicket,
  getUserTickets,
  getTicketDetails,
  sendMessage,
  closeTicket,
  type SupportTicket,
  type SupportMessage,
  type CreateTicketData,
  type TicketCategory,
  type TicketPriority,
} from "../services/supportTicketService";

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "new" | "my-tickets";

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("new");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ticketToRate, setTicketToRate] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  // Form state dla nowego ticketu
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("technical");
  const [priority, setPriority] = useState<TicketPriority>("medium");

  // Load user tickets
  useEffect(() => {
    if (isOpen && activeTab === "my-tickets" && user) {
      loadTickets();
      const interval = setInterval(loadTickets, 30000); // Refresh co 30s
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab, user]);

  // Load messages dla wybranego ticketu
  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket);
      const interval = setInterval(() => loadMessages(selectedTicket), 15000); // Refresh co 15s
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    if (!user) return;
    try {
      const data = await getUserTickets();
      setTickets(data);
    } catch (error) {
      console.error("Error loading tickets:", error);
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("❌ Musisz być zalogowany");
      return;
    }

    setLoading(true);
    try {
      const ticketData: CreateTicketData = {
        subject,
        description,
        category,
        priority,
      };

      const newTicket = await createTicket(ticketData);
      toast.success("✅ Zgłoszenie utworzone! Odpowiemy wkrótce.");

      // Reset form i przełącz na listę ticketów
      setSubject("");
      setDescription("");
      setCategory("technical");
      setPriority("medium");
      setActiveTab("my-tickets");
      setSelectedTicket(newTicket.id);
      loadTickets();
    } catch (error: any) {
      toast.error(
        "❌ " + (error.message || "Błąd podczas tworzenia zgłoszenia")
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    setSending(true);
    try {
      await sendMessage(selectedTicket, newMessage.trim());
      setNewMessage("");
      loadMessages(selectedTicket);
      toast.success("✅ Wiadomość wysłana");
    } catch (error: any) {
      toast.error(
        "❌ " + (error.message || "Błąd podczas wysyłania wiadomości")
      );
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    // Pokaż rating modal przed zamknięciem
    setTicketToRate(ticketId);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!ticketToRate || rating === 0) {
      toast.error("❌ Proszę wybrać ocenę (1-5 gwiazdek)");
      return;
    }

    try {
      await closeTicket(ticketToRate, rating, ratingComment.trim() || undefined);
      toast.success("✅ Zgłoszenie zamknięte - dziękujemy za opinię!");
      
      // Reset rating modal
      setShowRatingModal(false);
      setTicketToRate(null);
      setRating(0);
      setRatingComment("");
      
      loadTickets();
      setSelectedTicket(null);
    } catch (error: any) {
      toast.error(
        "❌ " + (error.message || "Błąd podczas zamykania zgłoszenia")
      );
      console.error(error);
    }
  };

  if (!isOpen) return null;

  const selectedTicketData = tickets.find((t) => t.id === selectedTicket);

  return (
    <>
      <Toaster position="top-right" richColors />
      
      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ⭐ Oceń naszą pomoc
            </h3>
            <p className="text-gray-600 mb-6">
              Jak oceniasz jakość wsparcia?
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                >
                  {star <= (hoveredStar || rating) ? (
                    <span className="text-yellow-400">★</span>
                  ) : (
                    <span className="text-gray-300">☆</span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Rating Text */}
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 mb-4">
                {rating === 1 && "😞 Bardzo słabo"}
                {rating === 2 && "😕 Słabo"}
                {rating === 3 && "😐 Średnio"}
                {rating === 4 && "😊 Dobrze"}
                {rating === 5 && "😍 Rewelacyjnie!"}
              </p>
            )}

            {/* Comment Textarea */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dodatkowy komentarz (opcjonalnie)
              </label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Co moglibyśmy poprawić?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setRatingComment("");
                  setTicketToRate(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Zamknij zgłoszenie
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center gap-3">
              <span className="text-4xl">💬</span>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Centrum Wsparcia
                </h2>
                <p className="text-blue-100 text-sm">
                  Pomożemy rozwiązać Twój problem
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <span className="text-2xl">✖️</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setActiveTab("new");
                setSelectedTicket(null);
              }}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "new"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🎫</span>
                <span>Nowe zgłoszenie</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("my-tickets")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "my-tickets"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">📨</span>
                <span>Moje zgłoszenia</span>
                {tickets.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {tickets.length}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "new" ? (
              // NEW TICKET FORM
              <form onSubmit={handleCreateTicket} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temat zgłoszenia *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Krótko opisz problem..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={200}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategoria *
                    </label>
                    <select
                      required
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as TicketCategory)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="technical">🐛 Problem techniczny</option>
                      <option value="billing">
                        💰 Płatności i rozliczenia
                      </option>
                      <option value="account">👤 Konto użytkownika</option>
                      <option value="feature_request">
                        ✨ Propozycja funkcji
                      </option>
                      <option value="bug">🐞 Zgłoszenie błędu</option>
                      <option value="data">📊 Problem z danymi</option>
                      <option value="performance">⚡ Wydajność</option>
                      <option value="security">🔒 Bezpieczeństwo</option>
                      <option value="other">❓ Inne</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priorytet
                    </label>
                    <select
                      value={priority}
                      onChange={(e) =>
                        setPriority(e.target.value as TicketPriority)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Niski</option>
                      <option value="medium">Średni</option>
                      <option value="high">Wysoki</option>
                      <option value="critical">Pilne</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opis problemu *
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opisz szczegółowo problem, krok po kroku..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
                    maxLength={2000}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {description.length}/2000 znaków
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Wysyłanie..." : "Wyślij zgłoszenie"}
                </button>
              </form>
            ) : (
              // MY TICKETS LIST + CHAT
              <div className="grid grid-cols-3 gap-6 h-full">
                {/* Tickets List */}
                <div className="col-span-1 space-y-3 overflow-y-auto max-h-[600px] pr-2">
                  {tickets.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-6xl opacity-50">🎫</span>
                      <p className="mt-3">Brak zgłoszeń</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedTicket === ticket.id
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-sm line-clamp-1">
                            {ticket.subject}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              ticket.status === "new"
                                ? "bg-green-100 text-green-700"
                                : ticket.status === "in_progress"
                                ? "bg-blue-100 text-blue-700"
                                : ticket.status === "waiting_user"
                                ? "bg-yellow-100 text-yellow-700"
                                : ticket.status === "resolved"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(ticket.created_at!).toLocaleDateString(
                            "pl-PL"
                          )}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                {/* Chat */}
                <div className="col-span-2 flex flex-col h-[600px] border border-gray-200 rounded-lg">
                  {selectedTicketData ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-medium text-lg">
                          {selectedTicketData.subject}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {selectedTicketData.description}
                        </p>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender_id === user?.id
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.sender_id === user?.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-white border border-gray-200"
                              }`}
                            >
                              <p className="text-xs opacity-75 mb-1">
                                {msg.sender_name}
                              </p>
                              <p className="text-sm whitespace-pre-wrap">
                                {msg.message}
                              </p>
                              <p className="text-xs opacity-60 mt-1">
                                {new Date(msg.created_at!).toLocaleString(
                                  "pl-PL"
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      {selectedTicketData.status !== "closed" && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" &&
                                !e.shiftKey &&
                                handleSendMessage()
                              }
                              placeholder="Wpisz wiadomość..."
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={sending || !newMessage.trim()}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 px-4"
                            >
                              📤
                            </button>
                          </div>
                          {selectedTicketData.status !== "resolved" && (
                            <button
                              onClick={() => handleCloseTicket(selectedTicket!)}
                              className="mt-2 text-sm text-red-600 hover:text-red-700"
                            >
                              🔒 Zamknij zgłoszenie
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <span className="text-6xl opacity-50">📨</span>
                        <p className="mt-3">
                          Wybierz zgłoszenie, aby zobaczyć wiadomości
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
