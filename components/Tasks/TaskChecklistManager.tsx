import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  Circle,
  CheckCircle2,
  ListChecks,
} from "lucide-react";

export interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

interface TaskChecklistManagerProps {
  checklist: ChecklistItem[];
  onChecklistChange: (checklist: ChecklistItem[]) => void;
  editable?: boolean;
}

export function TaskChecklistManager({
  checklist,
  onChecklistChange,
  editable = true,
}: TaskChecklistManagerProps) {
  const [newItemText, setNewItemText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItemText.trim()) {
      return;
    }

    const newItem: ChecklistItem = {
      id: Date.now(),
      text: newItemText.trim(),
      completed: false,
    };

    onChecklistChange([...checklist, newItem]);
    setNewItemText("");
    setShowAddForm(false);
  };

  const handleToggleItem = (index: number) => {
    const updated = [...checklist];
    const item = updated[index];

    item.completed = !item.completed;

    if (item.completed) {
      item.completed_at = new Date().toISOString();
      // Would set completed_by from auth context
    } else {
      item.completed_at = undefined;
      item.completed_by = undefined;
    }

    onChecklistChange(updated);
  };

  const handleDeleteItem = (index: number) => {
    if (!confirm("Czy na pewno usunąć ten krok?")) return;
    const updated = checklist.filter((_, i) => i !== index);
    onChecklistChange(updated);
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === checklist.length - 1)
    ) {
      return;
    }

    const updated = [...checklist];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Swap items
    [updated[index], updated[targetIndex]] = [
      updated[targetIndex],
      updated[index],
    ];

    onChecklistChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-purple-600" />
          Checklist kroków
          {totalCount > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({completedCount}/{totalCount})
            </span>
          )}
        </h3>
        {editable && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj krok
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Postęp</span>
            <span className="text-sm font-bold text-purple-600">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
            <span>
              <Check className="w-3 h-3 inline mr-1" />
              {completedCount} wykonanych
            </span>
            <span>
              <Circle className="w-3 h-3 inline mr-1" />
              {totalCount - completedCount} pozostałych
            </span>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && editable && (
        <form
          onSubmit={handleAddItem}
          className="bg-purple-50 border border-purple-200 rounded-lg p-4"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nowy krok
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="np. Wykleić listwy taśmą"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Dodaj
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewItemText("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      {/* Checklist Items */}
      {checklist.length > 0 ? (
        <div className="space-y-2">
          {checklist.map((item, index) => (
            <div
              key={item.id}
              className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
                item.completed
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200 hover:border-purple-300"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggleItem(index)}
                className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 hover:border-purple-500"
                }`}
                disabled={!editable}
              >
                {item.completed && <Check className="w-4 h-4" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    item.completed
                      ? "line-through text-gray-500"
                      : "text-gray-900"
                  }`}
                >
                  {item.text}
                </p>
                {item.completed && item.completed_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    Wykonano:{" "}
                    {new Date(item.completed_at).toLocaleDateString("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {/* Actions */}
              {editable && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Move up */}
                  {index > 0 && (
                    <button
                      onClick={() => handleMoveItem(index, "up")}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Przesuń w górę"
                    >
                      <span className="text-gray-600">↑</span>
                    </button>
                  )}

                  {/* Move down */}
                  {index < checklist.length - 1 && (
                    <button
                      onClick={() => handleMoveItem(index, "down")}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Przesuń w dół"
                    >
                      <span className="text-gray-600">↓</span>
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
          <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Brak kroków w checkliście</p>
          {editable && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-sm text-purple-600 hover:text-purple-800"
            >
              Dodaj pierwszy krok
            </button>
          )}
        </div>
      )}

      {/* Completion Badge */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Wszystkie kroki zostały wykonane! 🎉
          </span>
        </div>
      )}
    </div>
  );
}
