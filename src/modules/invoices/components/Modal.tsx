import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overscroll-contain">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 sticky top-0 bg-white z-20 rounded-t-3xl flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Zamknij"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  );
};
