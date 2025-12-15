import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Package, ExternalLink } from 'lucide-react';

export interface TaskMaterial {
  name: string;
  quantity: number;
  unit: string; // szt, m2, mb, litr, kg, etc.
  price: number; // per unit
  supplier?: string;
  supplier_url?: string;
  notes?: string;
}

interface TaskMaterialsListProps {
  materials: TaskMaterial[];
  onMaterialsChange: (materials: TaskMaterial[]) => void;
  editable?: boolean;
}

export function TaskMaterialsList({
  materials,
  onMaterialsChange,
  editable = true
}: TaskMaterialsListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<TaskMaterial>({
    name: '',
    quantity: 1,
    unit: 'szt',
    price: 0,
    supplier: '',
    supplier_url: '',
    notes: ''
  });

  const commonUnits = ['szt', 'm2', 'mb', 'litr', 'kg', 'rolka', 'paczka', 'worek'];
  const commonSuppliers = ['Bouwmaat', 'Gamma', 'Praxis', 'Hornbach', 'Technische Unie', 'Houthandel'];

  const totalCost = materials.reduce((sum, m) => sum + (m.quantity * m.price), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Nazwa materiału jest wymagana');
      return;
    }

    if (formData.quantity <= 0) {
      alert('Ilość musi być większa niż 0');
      return;
    }

    if (formData.price < 0) {
      alert('Cena nie może być ujemna');
      return;
    }

    if (editingIndex !== null) {
      // Update existing
      const updated = [...materials];
      updated[editingIndex] = formData;
      onMaterialsChange(updated);
      setEditingIndex(null);
    } else {
      // Add new
      onMaterialsChange([...materials, formData]);
    }

    // Reset form
    setFormData({
      name: '',
      quantity: 1,
      unit: 'szt',
      price: 0,
      supplier: '',
      supplier_url: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (index: number) => {
    setFormData(materials[index]);
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleDelete = (index: number) => {
    if (!confirm('Czy na pewno usunąć ten materiał?')) return;
    const updated = materials.filter((_, i) => i !== index);
    onMaterialsChange(updated);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingIndex(null);
    setFormData({
      name: '',
      quantity: 1,
      unit: 'szt',
      price: 0,
      supplier: '',
      supplier_url: '',
      notes: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-green-600" />
          Materiały
          {materials.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({materials.length} {materials.length === 1 ? 'pozycja' : 'pozycji'})
            </span>
          )}
        </h3>
        {editable && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj materiał
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && editable && (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">
            {editingIndex !== null ? 'Edytuj materiał' : 'Nowy materiał'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa materiału *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Farba ścienna biała"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ilość *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jednostka *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {commonUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cena za jednostkę (€) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Subtotal (calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suma
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 font-semibold">
                €{(formData.quantity * formData.price).toFixed(2)}
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dostawca
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="np. Bouwmaat"
                list="suppliers-list"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <datalist id="suppliers-list">
                {commonSuppliers.map(supplier => (
                  <option key={supplier} value={supplier} />
                ))}
              </datalist>
            </div>

            {/* Supplier URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link do produktu
              </label>
              <input
                type="url"
                value={formData.supplier_url}
                onChange={(e) => setFormData({ ...formData, supplier_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notatki
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Dodatkowe informacje..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {editingIndex !== null ? 'Zapisz zmiany' : 'Dodaj materiał'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      {/* Materials Table */}
      {materials.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Materiał</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Ilość</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Cena/j.</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Suma</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Dostawca</th>
                {editable && <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Akcje</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {materials.map((material, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{material.name}</div>
                      {material.notes && (
                        <div className="text-xs text-gray-500 mt-1">{material.notes}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700">
                    {material.quantity} {material.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    €{material.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    €{(material.quantity * material.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {material.supplier && (
                      <div className="flex items-center gap-1">
                        <span>{material.supplier}</span>
                        {material.supplier_url && (
                          <a
                            href={material.supplier_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title="Otwórz link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  {editable && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Edytuj"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Usuń"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={editable ? 3 : 2} className="px-4 py-3 text-right font-semibold text-gray-900">
                  Razem:
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                  €{totalCost.toFixed(2)}
                </td>
                <td colSpan={editable ? 2 : 1}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Brak materiałów</p>
          {editable && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Dodaj pierwszy materiał
            </button>
          )}
        </div>
      )}
    </div>
  );
}
