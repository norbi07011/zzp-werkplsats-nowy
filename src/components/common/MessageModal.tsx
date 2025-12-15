/**
 * =====================================================
 * MESSAGE MODAL - Full Message View with Reply
 * =====================================================
 * Features: Read message, reply, mark as read
 */

import { useState } from "react";

interface MessageModalProps {
  message: {
    id: string;
    content: string;
    subject?: string;
    created_at: string;
    is_read?: boolean;
    sender: {
      id: string;
      first_name: string | null;
      last_name: string | null;
    };
  };
  onClose: () => void;
  onReply: (messageId: string, content: string) => Promise<void>;
  onMarkAsRead?: (messageId: string) => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  message,
  onClose,
  onReply,
  onMarkAsRead,
}) => {
  const [replyContent, setReplyContent] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [sending, setSending] = useState(false);

  const getSenderName = (): string => {
    const { first_name, last_name } = message.sender;
    if (first_name || last_name) {
      return `${first_name || ""} ${last_name || ""}`.trim();
    }
    return "Użytkownik";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("pl-PL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      alert("Wpisz treść odpowiedzi");
      return;
    }

    try {
      setSending(true);
      await onReply(message.id, replyContent);
      setReplyContent("");
      setShowReplyForm(false);
      alert("✅ Odpowiedź wysłana!");
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("❌ Nie udało się wysłać odpowiedzi");
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = () => {
    if (!message.is_read && onMarkAsRead) {
      onMarkAsRead(message.id);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overscroll-contain"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {message.subject || "Wiadomość"}
              </h2>
              <div className="flex items-center gap-2 text-blue-100">
                <span className="font-medium">{getSenderName()}</span>
                <span>•</span>
                <span className="text-sm">
                  {formatDate(message.created_at)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Status badge */}
          {!message.is_read && (
            <div className="inline-flex items-center gap-1 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              Nieprzeczytana
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!message.is_read && onMarkAsRead ? (
              <button
                onClick={handleMarkAsRead}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Oznacz jako przeczytaną
              </button>
            ) : (
              <div className="flex-1"></div>
            )}

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              {showReplyForm ? "Anuluj odpowiedź" : "Odpowiedz"}
            </button>
          </div>

          {/* Reply Form */}
          <div className={showReplyForm ? "mt-6" : "hidden"}>
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📝 Twoja odpowiedź
              </h3>

              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Wpisz swoją odpowiedź..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={sending}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={sending}
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyContent.trim()}
                  className={`
                    flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                    ${
                      sending || !replyContent.trim()
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }
                  `}
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Wysyłanie...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Wyślij odpowiedź
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
