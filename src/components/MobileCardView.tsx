import React, { useState } from "react";



export interface CardField {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
}

export interface CardAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "danger" | "success" | "default";
}

export interface CardItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  fields: CardField[];
  actions?: CardAction[];
  onClick?: () => void;
}

interface MobileCardViewProps {
  items: CardItem[];
  emptyMessage?: string;
}

export function MobileCardView({
  items,
  emptyMessage = "Brak elementów",
}: MobileCardViewProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-6xl mb-4 opacity-20">📋</div>
        <p className="text-slate-400 text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 p-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else if (item.actions && item.actions.length > 0) {
                setActiveCardId(item.id);
              }
            }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-transform"
          >
            {/* Card Header */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-base mb-1 truncate">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-sm text-slate-500 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                {item.badge && (
                  <div className="flex-shrink-0">{item.badge}</div>
                )}
                {item.actions && item.actions.length > 0 && (
                  <ChevronRight
                    size={20}
                    className="text-slate-400 flex-shrink-0"
                  />
                )}
              </div>
            </div>

            {/* Card Fields */}
            <div className="p-4 space-y-3">
              {item.fields.map((field, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start gap-3"
                >
                  <span className="text-sm text-slate-500 font-medium">
                    {field.label}:
                  </span>
                  <span
                    className={`text-sm text-right font-semibold ${
                      field.highlight ? "text-blue-600" : "text-slate-900"
                    }`}
                  >
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions Bottom Sheet */}
      {activeCardId && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
            onClick={() => setActiveCardId(null)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-in slide-in-from-bottom duration-300 safe-bottom">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Akcje</h3>
              <button
                onClick={() => setActiveCardId(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {items
                .find((item) => item.id === activeCardId)
                ?.actions?.map((action, idx) => {
                  const variantStyles = {
                    primary: "bg-blue-50 text-blue-600 hover:bg-blue-100",
                    danger: "bg-red-50 text-red-600 hover:bg-red-100",
                    success:
                      "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
                    default: "bg-slate-50 text-slate-700 hover:bg-slate-100",
                  };

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        action.onClick();
                        setActiveCardId(null);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-colors min-h-[56px] ${
                        variantStyles[action.variant || "default"]
                      }`}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
