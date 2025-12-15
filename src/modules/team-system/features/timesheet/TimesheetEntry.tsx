/**
 * ================================================================
 * TIMESHEET ENTRY FORM - Wpis godzin pracy
 * ================================================================
 */

import React, { useState, useEffect } from "react";






import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
}

interface TimesheetEntryProps {
  teamId: string;
  preselectedProjectId?: string;
  preselectedTaskId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export const TimesheetEntry: React.FC<TimesheetEntryProps> = ({
  teamId,
  preselectedProjectId,
  preselectedTaskId,
  onSave,
  onCancel,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:30");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [projectId, setProjectId] = useState(preselectedProjectId || "");
  const [hourlyRate, setHourlyRate] = useState<number | "">("");
  const [workType, setWorkType] = useState("regular");
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchUserHourlyRate();
  }, [teamId]);

  const fetchProjects = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("team_projects")
      .select("id, title")
      .eq("team_id", teamId)
      .eq("status", "ACTIVE")
      .order("title");

    if (data) {
      setProjects(data);
      if (!projectId && data.length > 0) {
        setProjectId(data[0].id);
      }
    }
    setIsLoading(false);
  };

  const fetchUserHourlyRate = async () => {
    if (!user?.id) return;

    // Try to get rate from worker profile
    const { data: worker } = await supabase
      .from("workers")
      .select("hourly_rate")
      .eq("profile_id", user.id)
      .single();

    if (worker?.hourly_rate) {
      setHourlyRate(Number(worker.hourly_rate));
    }
  };

  const calculateTotalHours = (): number => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const totalMinutes = endMinutes - startMinutes - breakMinutes;
    return Math.round((totalMinutes / 60) * 100) / 100;
  };

  const calculateTotalAmount = (): number => {
    if (!hourlyRate) return 0;
    return Math.round(calculateTotalHours() * Number(hourlyRate) * 100) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      toast.error("Wybierz projekt");
      return;
    }

    const totalHours = calculateTotalHours();
    if (totalHours <= 0) {
      toast.error("Czas pracy musi być większy niż 0");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("team_timesheets").insert({
        team_id: teamId,
        user_id: user?.id,
        project_id: projectId,
        task_id: preselectedTaskId || null,
        date: date,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMinutes,
        total_hours: totalHours,
        hourly_rate: hourlyRate || null,
        total_amount: hourlyRate ? calculateTotalAmount() : null,
        billable: billable,
        work_type: workType,
        status: "pending",
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast.success("✅ Godziny zapisane!");
      onSave?.();
    } catch (error: any) {
      console.error("Error saving timesheet:", error);
      toast.error("Błąd podczas zapisywania");
    } finally {
      setIsSaving(false);
    }
  };

  const workTypes = [
    { value: "regular", label: "Zwykłe godziny" },
    { value: "overtime", label: "Nadgodziny" },
    { value: "weekend", label: "Weekend" },
    { value: "holiday", label: "Święto" },
    { value: "night", label: "Nocne" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
          <Clock className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Rejestracja godzin
          </h2>
          <p className="text-sm text-gray-500">Urenregistratie</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Date & Project Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Projekt
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">-- Wybierz projekt --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rozpoczęcie
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zakończenie
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Coffee className="w-4 h-4 inline mr-1" />
              Przerwa (min)
            </label>
            <input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              min="0"
              max="180"
              step="15"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Work Type & Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ pracy
            </label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {workTypes.map((wt) => (
                <option key={wt.value} value={wt.value}>
                  {wt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stawka godzinowa (€)
            </label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) =>
                setHourlyRate(e.target.value ? Number(e.target.value) : "")
              }
              min="0"
              step="0.01"
              placeholder="np. 45.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Billable Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="billable"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
            className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="billable" className="text-sm text-gray-700">
            Godziny płatne (fakturowane klientowi)
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notatki (opcjonalnie)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Co robiłeś/aś..."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Summary */}
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-emerald-700">Podsumowanie</p>
              <p className="text-2xl font-bold text-emerald-800">
                {calculateTotalHours()} godzin
              </p>
            </div>
            {hourlyRate && (
              <div className="text-right">
                <p className="text-sm text-emerald-700">Wartość</p>
                <p className="text-2xl font-bold text-emerald-800">
                  €{calculateTotalAmount().toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              isSaving
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
            }`}
          >
            {isSaving ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Zapisz godziny
          </button>
        </div>
      </div>
    </form>
  );
};

export default TimesheetEntry;
