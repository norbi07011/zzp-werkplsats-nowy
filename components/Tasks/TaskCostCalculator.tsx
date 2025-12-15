import React, { useState, useEffect } from "react";
import {
  Calculator,
  Euro,
  Clock,
  Package,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface TaskMaterial {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  supplier?: string;
  supplier_url?: string;
  notes?: string;
}

interface TaskCostCalculatorProps {
  materials: TaskMaterial[];
  hourlyRate?: number;
  estimatedHours?: number;
  onHourlyRateChange?: (rate: number) => void;
  onEstimatedHoursChange?: (hours: number) => void;
  editable?: boolean;
  showBreakdown?: boolean;
}

export function TaskCostCalculator({
  materials,
  hourlyRate = 0,
  estimatedHours = 0,
  onHourlyRateChange,
  onEstimatedHoursChange,
  editable = true,
  showBreakdown = true,
}: TaskCostCalculatorProps) {
  const [editingRate, setEditingRate] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [tempRate, setTempRate] = useState(hourlyRate.toString());
  const [tempHours, setTempHours] = useState(estimatedHours.toString());

  // Calculate materials cost
  const materialsCost = materials.reduce((sum, material) => {
    return sum + material.quantity * material.price;
  }, 0);

  // Calculate labor cost
  const laborCost = hourlyRate * estimatedHours;

  // Total cost
  const totalCost = materialsCost + laborCost;

  // Sync temp values when props change
  useEffect(() => {
    setTempRate(hourlyRate.toString());
  }, [hourlyRate]);

  useEffect(() => {
    setTempHours(estimatedHours.toString());
  }, [estimatedHours]);

  const handleSaveRate = () => {
    const rate = parseFloat(tempRate);
    if (!isNaN(rate) && rate >= 0) {
      onHourlyRateChange?.(rate);
      setEditingRate(false);
    } else {
      setTempRate(hourlyRate.toString());
      setEditingRate(false);
    }
  };

  const handleSaveHours = () => {
    const hours = parseFloat(tempHours);
    if (!isNaN(hours) && hours >= 0) {
      onEstimatedHoursChange?.(hours);
      setEditingHours(false);
    } else {
      setTempHours(estimatedHours.toString());
      setEditingHours(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Kalkulacja kosztów
        </h3>
      </div>

      {/* Breakdown Cards */}
      {showBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Materials Cost Card */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Materiały</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Liczba pozycji:</span>
                <span className="font-medium">{materials.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">Suma:</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatCurrency(materialsCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Labor Cost Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Robocizna</h4>
            </div>
            <div className="space-y-2">
              {/* Hourly Rate */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Stawka godzinowa:</span>
                {editingRate && editable ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={tempRate}
                      onChange={(e) => setTempRate(e.target.value)}
                      onBlur={handleSaveRate}
                      onKeyPress={(e) => e.key === "Enter" && handleSaveRate()}
                      className="w-20 px-2 py-1 border border-blue-300 rounded text-right"
                      step="0.01"
                      min="0"
                      autoFocus
                    />
                    <span className="text-gray-600">€/h</span>
                  </div>
                ) : (
                  <button
                    onClick={() => editable && setEditingRate(true)}
                    className={`font-medium ${
                      editable ? "hover:text-blue-600" : ""
                    }`}
                    disabled={!editable}
                  >
                    {formatCurrency(hourlyRate)}/h
                  </button>
                )}
              </div>

              {/* Estimated Hours */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Szacowany czas:</span>
                {editingHours && editable ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={tempHours}
                      onChange={(e) => setTempHours(e.target.value)}
                      onBlur={handleSaveHours}
                      onKeyPress={(e) => e.key === "Enter" && handleSaveHours()}
                      className="w-20 px-2 py-1 border border-blue-300 rounded text-right"
                      step="0.5"
                      min="0"
                      autoFocus
                    />
                    <span className="text-gray-600">h</span>
                  </div>
                ) : (
                  <button
                    onClick={() => editable && setEditingHours(true)}
                    className={`font-medium ${
                      editable ? "hover:text-blue-600" : ""
                    }`}
                    disabled={!editable}
                  >
                    {estimatedHours}h
                  </button>
                )}
              </div>

              {/* Labor Subtotal */}
              <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                <span className="text-gray-900 font-medium">Suma:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(laborCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Total Cost Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Euro className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Łączny koszt zadania</p>
              <p className="text-3xl font-bold text-green-700">
                {formatCurrency(totalCost)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Package className="w-4 h-4" />
              <span>{formatCurrency(materialsCost)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{formatCurrency(laborCost)}</span>
            </div>
          </div>
        </div>

        {/* Cost per hour indicator */}
        {estimatedHours > 0 && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>Efektywny koszt godzinowy (z materiałami):</span>
              </div>
              <span className="font-bold text-green-700">
                {formatCurrency(totalCost / estimatedHours)}/h
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Warnings */}
      {totalCost === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Brak kalkulacji kosztów</p>
            <p>
              Dodaj materiały lub ustaw stawkę godzinową i szacowany czas, aby
              zobaczyć kalkulację.
            </p>
          </div>
        </div>
      )}

      {hourlyRate === 0 && estimatedHours > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Ustaw stawkę godzinową</p>
            <p>
              Określiłeś szacowany czas ({estimatedHours}h), ale nie ustawiłeś
              stawki godzinowej.
            </p>
          </div>
        </div>
      )}

      {hourlyRate > 0 && estimatedHours === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Ustaw szacowany czas</p>
            <p>
              Określiłeś stawkę ({formatCurrency(hourlyRate)}/h), ale nie
              ustawiłeś szacowanego czasu pracy.
            </p>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {editable && (
        <p className="text-xs text-gray-500 text-center">
          Kliknij na wartości stawki lub czasu, aby je edytować
        </p>
      )}
    </div>
  );
}
