import React, { useState, useEffect } from 'react';
import {
  FileText,
  ChevronDown,
  Check,
  X,
  Package,
  ListChecks,
  Clock,
  Euro,
  Sparkles,
} from 'lucide-react';

interface TaskMaterial {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  supplier?: string;
  supplier_url?: string;
  notes?: string;
}

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

export interface TaskTemplate {
  id: string;
  template_name: string;
  template_category: string;
  description?: string;
  materials: TaskMaterial[];
  checklist: ChecklistItem[];
  hourly_rate: number;
  estimated_hours: number;
  calculated_cost: number;
}

interface TaskTemplateSelectorProps {
  templates: TaskTemplate[];
  onTemplateSelect: (template: TaskTemplate) => void;
  loading?: boolean;
}

export function TaskTemplateSelector({
  templates,
  onTemplateSelect,
  loading = false
}: TaskTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const categoryIcons: Record<string, string> = {
    painting: '🎨',
    renovation: '🔨',
    electrical: '⚡',
    plumbing: '🚰',
    carpentry: '🪚',
    other: '📋'
  };

  const categoryLabels: Record<string, string> = {
    painting: 'Malowanie',
    renovation: 'Renowacja',
    electrical: 'Elektryka',
    plumbing: 'Hydraulika',
    carpentry: 'Stolarka',
    other: 'Inne'
  };

  const handleSelectTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
    setIsOpen(false);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate);
      setShowPreview(false);
      setSelectedTemplate(null);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setSelectedTemplate(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    const category = template.template_category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, TaskTemplate[]>);

  return (
    <div className="space-y-4">
      {/* Selector Button */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Użyj szablonu zadania
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading || templates.length === 0}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-purple-300 rounded-lg hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-gray-700">
              {loading ? 'Ładowanie szablonów...' : `Wybierz szablon (${templates.length} dostępnych)`}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Templates Dropdown */}
      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {Object.keys(templatesByCategory).length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Brak dostępnych szablonów</p>
            </div>
          ) : (
            Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
              <div key={category} className="border-b border-gray-200 last:border-0">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <span>{categoryIcons[category] || categoryIcons.other}</span>
                    {categoryLabels[category] || category}
                  </h4>
                </div>
                {categoryTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{template.template_name}</p>
                      {template.description && (
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {template.materials.length} materiałów
                        </span>
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3 h-3" />
                          {template.checklist.length} kroków
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {template.estimated_hours}h
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{formatCurrency(template.calculated_cost)}</p>
                      <p className="text-xs text-gray-500 mt-1">szacowany koszt</p>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedTemplate.template_name}</h3>
                    <p className="text-purple-100 text-sm mt-1">
                      {categoryIcons[selectedTemplate.template_category]}
                      {' '}
                      {categoryLabels[selectedTemplate.template_category]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Cost Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Szacowany koszt całkowity</p>
                    <p className="text-3xl font-bold text-green-700 mt-1">
                      {formatCurrency(selectedTemplate.calculated_cost)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4" />
                      <span>{formatCurrency(selectedTemplate.hourly_rate)}/h</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedTemplate.estimated_hours}h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials */}
              {selectedTemplate.materials.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-purple-600" />
                    Materiały ({selectedTemplate.materials.length})
                  </h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left p-2">Materiał</th>
                          <th className="text-right p-2">Ilość</th>
                          <th className="text-right p-2">Cena</th>
                          <th className="text-right p-2">Suma</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTemplate.materials.map((material, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="p-2">{material.name}</td>
                            <td className="text-right p-2">
                              {material.quantity} {material.unit}
                            </td>
                            <td className="text-right p-2">{formatCurrency(material.price)}</td>
                            <td className="text-right p-2 font-medium">
                              {formatCurrency(material.quantity * material.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Checklist */}
              {selectedTemplate.checklist.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <ListChecks className="w-5 h-5 text-purple-600" />
                    Checklist kroków ({selectedTemplate.checklist.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.checklist.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedTemplate.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Opis</h4>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex items-center justify-between">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleApplyTemplate}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Zastosuj szablon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
