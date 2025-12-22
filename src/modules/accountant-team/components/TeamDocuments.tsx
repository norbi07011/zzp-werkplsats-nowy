/**
 * Team Documents - Document Management
 */

import React, { useState } from "react";
import { Language } from "../types";
import { DICTIONARY } from "../constants";
import {
  FileText,
  Upload,
  Folder,
  Search,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Filter,
  Grid3X3,
  List,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface TeamDocumentsProps {
  language: Language;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  folder: string;
  uploadedBy: string;
  uploadedAt: string;
  icon: string;
}

export const TeamDocuments: React.FC<TeamDocumentsProps> = ({ language }) => {
  const t = DICTIONARY[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFolder, setActiveFolder] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Mock folders
  const folders = [
    { id: "all", name: "Wszystkie", count: 12 },
    { id: "btw", name: "BTW Deklaracje", count: 4 },
    { id: "facturen", name: "Faktury", count: 5 },
    { id: "contracts", name: "Umowy", count: 3 },
  ];

  // Mock documents
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "BTW Q3 2024.pdf",
      type: "pdf",
      size: "2.4 MB",
      folder: "btw",
      uploadedBy: "Anna K.",
      uploadedAt: "2024-10-15",
      icon: "📄",
    },
    {
      id: "2",
      name: "Faktura 2024-001.pdf",
      type: "pdf",
      size: "156 KB",
      folder: "facturen",
      uploadedBy: "Jan M.",
      uploadedAt: "2024-10-14",
      icon: "📄",
    },
    {
      id: "3",
      name: "Umowa zlecenie.docx",
      type: "docx",
      size: "89 KB",
      folder: "contracts",
      uploadedBy: "Anna K.",
      uploadedAt: "2024-10-10",
      icon: "📝",
    },
    {
      id: "4",
      name: "Raport finansowy.xlsx",
      type: "xlsx",
      size: "1.2 MB",
      folder: "all",
      uploadedBy: "Piotr S.",
      uploadedAt: "2024-10-08",
      icon: "📊",
    },
  ]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFolder = activeFolder === "all" || doc.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const newDoc: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.name.split(".").pop() || "unknown",
        size: formatFileSize(file.size),
        folder: activeFolder === "all" ? "all" : activeFolder,
        uploadedBy: "Ty",
        uploadedAt: new Date().toISOString().split("T")[0],
        icon: getFileIcon(file.name),
      };
      setDocuments((prev) => [...prev, newDoc]);
    });

    toast.success(`✅ Przesłano ${files.length} plik(ów)`);
    setShowUploadModal(false);
  };

  const handleDelete = (docId: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten dokument?")) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success("🗑️ Dokument usunięty");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "📄";
      case "docx":
      case "doc":
        return "📝";
      case "xlsx":
      case "xls":
        return "📊";
      case "pptx":
      case "ppt":
        return "📽️";
      case "jpg":
      case "jpeg":
      case "png":
        return "🖼️";
      default:
        return "📎";
    }
  };

  const typeColors: Record<string, string> = {
    pdf: "bg-red-100 text-red-600",
    docx: "bg-blue-100 text-blue-600",
    xlsx: "bg-emerald-100 text-emerald-600",
    default: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t.documents}</h2>
          <p className="text-slate-500 text-sm">
            {documents.length} dokumentów
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          Prześlij plik
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Szukaj dokumentów..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-indigo-100 text-indigo-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-indigo-100 text-indigo-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Folders Sidebar */}
        <div className="w-56 shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-medium text-slate-800 mb-3">Foldery</h3>
            <div className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    activeFolder === folder.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    <span className="text-sm">{folder.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{folder.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents Grid/List */}
        <div className="flex-1">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                Brak dokumentów
              </h3>
              <p className="text-slate-500 mb-4">Prześlij pierwszy dokument</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Prześlij plik
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{doc.icon}</div>
                    <button className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-medium text-slate-700 truncate mb-1">
                    {doc.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        typeColors[doc.type] || typeColors.default
                      }`}
                    >
                      {doc.type.toUpperCase()}
                    </span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button className="flex-1 p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition">
                      <Eye className="w-4 h-4 mx-auto" />
                    </button>
                    <button className="flex-1 p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition">
                      <Download className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="flex-1 p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="text-2xl">{doc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-700 truncate">
                      {doc.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {doc.uploadedBy} •{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      typeColors[doc.type] || typeColors.default
                    }`}
                  >
                    {doc.type.toUpperCase()}
                  </span>
                  <span className="text-sm text-slate-400">{doc.size}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 rounded">
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Prześlij dokumenty
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
              <Upload className="w-12 h-12 text-slate-400 mb-3" />
              <span className="text-sm text-slate-600 font-medium">
                Kliknij lub przeciągnij pliki
              </span>
              <span className="text-xs text-slate-400 mt-1">
                PDF, DOCX, XLSX do 10MB
              </span>
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.docx,.xlsx,.doc,.xls"
                onChange={handleUpload}
              />
            </label>

            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full mt-4 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDocuments;
