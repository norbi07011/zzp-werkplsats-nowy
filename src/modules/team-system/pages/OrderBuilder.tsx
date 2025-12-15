/**
 * ================================================================
 * ORDER BUILDER - Budowa Zleceń
 * ================================================================
 * Kreator zleceń dla pracodawcy
 * Pozwala tworzyć zlecenia krok po kroku
 */

import React, { useState } from "react";
import { useTeamStore } from "../context/TeamStoreContext";
import { Priority, TaskStatus, Task, Project } from "../types";














interface OrderFormData {
  title: string;
  description: string;
  projectId: string;
  priority: Priority;
  dueDate: string;
  estimatedHours: number;
  budget: number;
  location: string;
  assignedWorkers: string[];
  toolsRequired: string[];
  materialsDescription: string;
}

const STEPS = [
  { id: 1, title: "Podstawowe informacje", icon: FileText },
  { id: 2, title: "Lokalizacja i czas", icon: MapPin },
  { id: 3, title: "Przypisanie pracowników", icon: Users },
  { id: 4, title: "Materiały i narzędzia", icon: Briefcase },
  { id: 5, title: "Podsumowanie", icon: CheckCircle },
];

export const OrderBuilder = () => {
  const { projects, users, addTask, t } = useTeamStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<OrderFormData>({
    title: "",
    description: "",
    projectId: "",
    priority: Priority.MEDIUM,
    dueDate: "",
    estimatedHours: 8,
    budget: 0,
    location: "",
    assignedWorkers: [],
    toolsRequired: [],
    materialsDescription: "",
  });

  const [newTool, setNewTool] = useState("");

  const updateForm = (field: keyof OrderFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleWorker = (workerId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedWorkers: prev.assignedWorkers.includes(workerId)
        ? prev.assignedWorkers.filter((id) => id !== workerId)
        : [...prev.assignedWorkers, workerId],
    }));
  };

  const addTool = () => {
    if (newTool.trim()) {
      setFormData((prev) => ({
        ...prev,
        toolsRequired: [...prev.toolsRequired, newTool.trim()],
      }));
      setNewTool("");
    }
  };

  const removeTool = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      toolsRequired: prev.toolsRequired.filter((_, i) => i !== index),
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const newTask: Task = {
      id: `order-${Date.now()}`,
      projectId: formData.projectId || "default",
      title: formData.title,
      description: formData.description,
      assignedToIds: formData.assignedWorkers,
      status: TaskStatus.TODO,
      priority: formData.priority,
      dueDate: formData.dueDate,
      estimatedHours: formData.estimatedHours,
      toolsRequired: formData.toolsRequired,
      materialsRequired: [],
      materialsUsed: [],
      comments: [],
      photos: [],
      workLogs: [],
    };

    addTask(newTask);
    setShowSuccess(true);

    // Reset form after 2 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setCurrentStep(1);
      setFormData({
        title: "",
        description: "",
        projectId: "",
        priority: Priority.MEDIUM,
        dueDate: "",
        estimatedHours: 8,
        budget: 0,
        location: "",
        assignedWorkers: [],
        toolsRequired: [],
        materialsDescription: "",
      });
    }, 2000);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() !== "";
      case 2:
        return formData.dueDate !== "";
      case 3:
        return true; // Workers optional
      case 4:
        return true; // Materials optional
      case 5:
        return true;
      default:
        return true;
    }
  };

  // Success overlay
  if (showSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Zlecenie utworzone!
          </h2>
          <p className="text-slate-600">
            Twoje zlecenie zostało pomyślnie dodane do systemu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Plus size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Budowa Zlecenia
            </h1>
            <p className="text-slate-500">Utwórz nowe zlecenie krok po kroku</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-50"
                      : isCompleted
                      ? "bg-green-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden md:block ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-green-600"
                        : "text-slate-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      currentStep > step.id ? "bg-green-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Podstawowe informacje
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tytuł zlecenia *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="np. Malowanie elewacji budynku"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Opis zlecenia
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Szczegółowy opis prac do wykonania..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Projekt
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => updateForm("projectId", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Wybierz projekt --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priorytet
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    updateForm("priority", e.target.value as Priority)
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={Priority.LOW}>🟢 Niski</option>
                  <option value={Priority.MEDIUM}>🟡 Średni</option>
                  <option value={Priority.HIGH}>🟠 Wysoki</option>
                  <option value={Priority.URGENT}>🔴 Pilny</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location & Time */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              Lokalizacja i czas
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adres / Lokalizacja
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => updateForm("location", e.target.value)}
                placeholder="np. ul. Przykładowa 15, Warszawa"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Termin wykonania *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => updateForm("dueDate", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Szacowany czas (godziny)
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    updateForm("estimatedHours", parseInt(e.target.value) || 0)
                  }
                  min="1"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Budżet (EUR)
              </label>
              <div className="relative">
                <Euro
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    updateForm("budget", parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="100"
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Assign Workers */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Przypisz pracowników
            </h2>

            <p className="text-slate-500 text-sm">
              Wybierz pracowników, którzy będą wykonywać to zlecenie. Możesz
              pominąć ten krok.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users
                .filter((u) => u.role !== "ADMIN")
                .map((worker) => {
                  const isSelected = formData.assignedWorkers.includes(
                    worker.id
                  );
                  return (
                    <button
                      key={worker.id}
                      onClick={() => toggleWorker(worker.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={worker.avatar}
                        alt={worker.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="text-left flex-1">
                        <p className="font-medium text-slate-800">
                          {worker.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {worker.specialization || "Pracownik"}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle size={14} className="text-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>

            {formData.assignedWorkers.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-700 font-medium">
                  Wybrano {formData.assignedWorkers.length} pracownik(ów)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Materials & Tools */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Briefcase size={20} className="text-blue-600" />
              Materiały i narzędzia
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Wymagane narzędzia
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTool()}
                  placeholder="np. Wiertarka, Rusztowanie..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addTool}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.toolsRequired.map((tool, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-sm"
                  >
                    {tool}
                    <button
                      onClick={() => removeTool(index)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Opis materiałów
              </label>
              <textarea
                value={formData.materialsDescription}
                onChange={(e) =>
                  updateForm("materialsDescription", e.target.value)
                }
                placeholder="Opisz potrzebne materiały, ilości itp..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 5: Summary */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Podsumowanie zlecenia
            </h2>

            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Tytuł</p>
                  <p className="font-medium text-slate-800">
                    {formData.title || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Priorytet</p>
                  <p className="font-medium text-slate-800">
                    {formData.priority === Priority.URGENT && "🔴 Pilny"}
                    {formData.priority === Priority.HIGH && "🟠 Wysoki"}
                    {formData.priority === Priority.MEDIUM && "🟡 Średni"}
                    {formData.priority === Priority.LOW && "🟢 Niski"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Termin</p>
                  <p className="font-medium text-slate-800">
                    {formData.dueDate || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Szacowany czas</p>
                  <p className="font-medium text-slate-800">
                    {formData.estimatedHours}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Budżet</p>
                  <p className="font-medium text-slate-800">
                    €{formData.budget}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Lokalizacja</p>
                  <p className="font-medium text-slate-800">
                    {formData.location || "-"}
                  </p>
                </div>
              </div>

              {formData.description && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Opis</p>
                  <p className="text-slate-700">{formData.description}</p>
                </div>
              )}

              {formData.assignedWorkers.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-2">
                    Przypisani pracownicy
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.assignedWorkers.map((workerId) => {
                      const worker = users.find((u) => u.id === workerId);
                      return worker ? (
                        <span
                          key={workerId}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          <img
                            src={worker.avatar}
                            alt={worker.name}
                            className="w-5 h-5 rounded-full"
                          />
                          {worker.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {formData.toolsRequired.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-2">Narzędzia</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.toolsRequired.map((tool, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-slate-200 rounded-full text-sm"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            currentStep === 1
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          <ChevronLeft size={20} />
          Wstecz
        </button>

        {currentStep < STEPS.length ? (
          <button
            onClick={nextStep}
            disabled={!isStepValid()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              isStepValid()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Dalej
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all"
          >
            <Save size={20} />
            Utwórz zlecenie
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderBuilder;
