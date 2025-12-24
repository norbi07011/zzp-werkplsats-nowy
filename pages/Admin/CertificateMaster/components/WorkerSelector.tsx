/**
 * Worker Selector Component
 * Allows admin to select a worker from database for certificate generation
 */

import React, { useState, useEffect } from "react";
import { Search, User, Loader2, CheckCircle } from "lucide-react";
import { WorkerData, Language } from "../types";
import { LABELS } from "../constants";
import { fetchWorkersForSelection } from "../services/certificateStorage";

interface Props {
  language: Language;
  onSelect: (worker: WorkerData) => void;
  selectedWorkerId?: string;
}

export const WorkerSelector: React.FC<Props> = ({
  language,
  onSelect,
  selectedWorkerId,
}) => {
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const t = (key: string) => LABELS[key]?.[language] || key;

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    setLoading(true);
    const data = await fetchWorkersForSelection();
    setWorkers(data);
    setLoading(false);
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.specialization || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500 mr-3" />
        <span className="text-slate-600">Ładowanie pracowników...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
      <label className="text-[10px] font-black uppercase text-brand-600 mb-3 flex items-center gap-2">
        <User size={14} /> {t("selectWorker")}
      </label>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={t("searchWorker")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
        />
      </div>

      {/* Workers List */}
      <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {t("noWorkersFound")}
          </div>
        ) : (
          filteredWorkers.map((worker) => (
            <button
              key={worker.id}
              onClick={() => onSelect(worker)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                selectedWorkerId === worker.id
                  ? "bg-brand-50 border-brand-300 ring-2 ring-brand-500/20"
                  : "bg-white border-slate-200 hover:border-brand-300 hover:bg-brand-50/50"
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                {worker.avatar_url ? (
                  <img
                    src={worker.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={20} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 truncate">
                  {worker.full_name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {worker.specialization || worker.email}
                </div>
              </div>

              {/* Selected indicator */}
              {selectedWorkerId === worker.id && (
                <CheckCircle className="w-5 h-5 text-brand-600 flex-shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
