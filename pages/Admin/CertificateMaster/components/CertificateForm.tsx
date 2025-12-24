/**
 * Certificate Form Component
 * Form for creating new certificates with worker selection
 */

import React, { useState } from "react";
import { Certificate, Language, WorkerData } from "../types";
import { LABELS, CONSTRUCTION_TEMPLATES } from "../constants";
import { generateCertificateNumber } from "../services/certificateStorage";
import { WorkerSelector } from "./WorkerSelector";
import { Save, Upload, User, Briefcase, FileText, X } from "lucide-react";
const BookOpen = FileText;

interface Props {
  language: Language;
  onSave: (cert: Certificate) => void;
  onCancel: () => void;
}

export const CertificateForm: React.FC<Props> = ({
  language,
  onSave,
  onCancel,
}) => {
  const t = (key: string) => LABELS[key]?.[language] || key;

  const [selectedWorker, setSelectedWorker] = useState<WorkerData | null>(null);
  const [formData, setFormData] = useState<Partial<Certificate>>({
    id: crypto.randomUUID(),
    issueDate: new Date().toISOString().split("T")[0],
    certificateNumber: generateCertificateNumber(),
    validityYears: 5,
    companyName: "ZZP Werkplaats",
    companyAddress: "Netherlands",
    instructorName: "Administrator",
  });

  const handleWorkerSelect = (worker: WorkerData) => {
    setSelectedWorker(worker);
    setFormData((prev) => ({
      ...prev,
      worker_id: worker.id,
      candidateName: worker.full_name,
      role: worker.specialization || prev.role,
    }));
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value);
    if (isNaN(idx)) return;
    const template = CONSTRUCTION_TEMPLATES[idx];
    setFormData((prev) => ({
      ...prev,
      role: template.role[language === "nl" ? "nl" : "pl"],
      description: template.desc[language === "nl" ? "nl" : "pl"],
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () =>
        setFormData({ ...formData, candidatePhoto: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidateName) {
      alert("Wybierz pracownika lub wpisz imię i nazwisko");
      return;
    }
    onSave(formData as Certificate);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto border border-slate-200 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-900 text-white rounded-2xl">
            <Briefcase size={24} />
          </div>
          <h2 className="text-3xl font-black text-slate-800">
            {t("newCertificate")}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X size={24} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Worker Selector - NEW */}
        <WorkerSelector
          language={language}
          onSelect={handleWorkerSelect}
          selectedWorkerId={selectedWorker?.id}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Photo Upload */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="relative w-40 h-40 rounded-[2.5rem] border-4 border-dashed border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden group hover:border-brand-500 transition-all">
              {formData.candidatePhoto ? (
                <img
                  src={formData.candidatePhoto}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <User className="text-slate-200" size={56} />
              )}
              <div className="absolute inset-0 bg-brand-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="text-white" size={28} />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 mt-4 tracking-widest">
              {t("uploadPhoto")}
            </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* Template Selection */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black uppercase text-brand-600 mb-2 flex items-center gap-2">
                <BookOpen size={12} /> {t("selectTemplate")}
              </label>
              <select
                onChange={handleTemplateSelect}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">-- WYBIERZ ZAWÓD / KIES BEROEP --</option>
                {CONSTRUCTION_TEMPLATES.map((tmpl, i) => (
                  <option key={i} value={i}>
                    {tmpl.role.nl} / {tmpl.role.pl}
                  </option>
                ))}
              </select>
            </div>

            {/* Certificate Number & Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                  ID No.
                </label>
                <input
                  required
                  name="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificateNumber: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                  Validity (Years)
                </label>
                <input
                  type="number"
                  value={formData.validityYears}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validityYears: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                />
              </div>
            </div>

            {/* Candidate Name (auto-filled from worker or manual) */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                {t("candidateName")}
              </label>
              <input
                required
                value={formData.candidateName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, candidateName: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                placeholder={selectedWorker ? "" : "Lub wpisz ręcznie..."}
              />
            </div>
          </div>
        </div>

        {/* Role & Issue Date */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
              {t("role")}
            </label>
            <input
              required
              value={formData.role || ""}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
              {t("issueDate")}
            </label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) =>
                setFormData({ ...formData, issueDate: e.target.value })
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
            {t("description")}
          </label>
          <textarea
            rows={4}
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm leading-relaxed font-medium"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="px-10 py-3 bg-brand-900 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center gap-3"
          >
            <Save size={18} /> {t("save")}
          </button>
        </div>
      </form>
    </div>
  );
};
