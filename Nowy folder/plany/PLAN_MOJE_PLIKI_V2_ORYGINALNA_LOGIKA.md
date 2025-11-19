# 📂 PLAN - NOWA KARTA "MOJE PLIKI & DOKUMENTY"

**WERSJA 2.0 - ORYGINALNA LOGIKA (nie demo code!)**  
**Data:** 13.11.2025

---

## 🎯 ZASADA PROJEKTOWANIA

### **❌ CZEGO NIE ROBIĆ:**

- ❌ Kopiować logic z MediaManager.tsx (to było dla userów, nie admina)
- ❌ Kopiować logic z DatabaseManager.tsx (to były admin tools)
- ❌ Używać ich struktury bazodanowej (media, media_folders)
- ❌ Tworzyć skomplikowane hierarchie folderów (parent_id, recursive queries)

### **✅ CO ZROBIĆ:**

- ✅ **PROSTA struktura** - 5 predefiniowanych folderów (bez hierarchii)
- ✅ **WŁASNA logika** - dedykowana dla potrzeb admina
- ✅ **MINIMALIZM** - tylko funkcje których NAPRAWDĘ potrzebujesz
- ✅ **PRZEJRZYSTOŚĆ** - kod który rozumiesz za 3 miesiące

---

## 🎨 DESIGN PHILOSOPHY - "KEEP IT SIMPLE"

### **Inspiracja:** Dropbox / Google Drive (prostota)

**NIE:** WordPress Media Library (over-engineered)

### **Core Concept:**

```
Admin potrzebuje miejsca gdzie trzyma:
- Dokumenty firmowe (regulaminy, umowy)
- Szablony certyfikatów (VCA, BHP)
- Backupy bazy danych (SQL, CSV)
- Zdjęcia/loga (firma, projekty)
- Inne ważne pliki

Nie potrzebuje:
- Skomplikowanej hierarchii folderów
- Metadata (alt_text, description, tags)
- Media library dla całej platformy
- Advanced search z facets
```

---

## 🗄️ BAZA DANYCH - NOWA STRUKTURA

### **Tabela: `admin_files`** (ORYGINALNA, nie z demo!)

```sql
CREATE TABLE admin_files (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- File info (SIMPLE)
  name TEXT NOT NULL,                    -- "Regulamin 2025.pdf"
  file_type TEXT NOT NULL,               -- "pdf", "docx", "image", "sql", "csv"
  folder TEXT NOT NULL,                  -- "dokumenty", "szablony", "backupy", "zdjecia", "inne"

  -- Storage
  storage_path TEXT NOT NULL,            -- "admin-files/dokumenty/regulamin_2025.pdf"
  public_url TEXT,                       -- Supabase Storage public URL (jeśli public)
  size_bytes INTEGER,                    -- Rozmiar w bajtach

  -- Metadata (MINIMAL)
  notes TEXT,                            -- Opcjonalna notatka admina
  is_important BOOLEAN DEFAULT false,    -- Gwiazdka (favorite)

  -- Audit
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(folder, name)                   -- Nie można mieć 2 plików o tej samej nazwie w folderze
);

-- Indexes (tylko potrzebne!)
CREATE INDEX idx_admin_files_folder ON admin_files(folder);
CREATE INDEX idx_admin_files_type ON admin_files(file_type);
CREATE INDEX idx_admin_files_important ON admin_files(is_important) WHERE is_important = true;

-- RLS (tylko admini)
ALTER TABLE admin_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access admin files" ON admin_files
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### **❌ CO USUNĘLIŚMY z demo code:**

- ~~`original_filename`~~ - niepotrzebne, mamy `name`
- ~~`alt_text`~~ - to dla SEO images, nie dla admin plików
- ~~`description`~~ - mamy `notes` (prostsze)
- ~~`tags TEXT[]`~~ - over-engineered, folder wystarczy
- ~~`updated_at`~~ - nie będziemy edytować plików, tylko upload/delete
- ~~`folder_id UUID`~~ - bez hierarchii! Prosty TEXT folder

### **✅ CO DODALIŚMY (NOWE):**

- ✅ `is_important` - gwiazdka dla ważnych plików
- ✅ `notes` - krótka notatka (opcjonalna)
- ✅ `UNIQUE(folder, name)` - constraint przeciwko duplikatom

---

## 📁 FOLDERY - PREDEFINIOWANE (nie dynamiczne!)

### **5 STAŁYCH FOLDERÓW:**

```typescript
// config/adminFolders.ts
export const ADMIN_FOLDERS = {
  DOKUMENTY: {
    id: "dokumenty",
    name: "Dokumenty Firmowe",
    icon: "📄",
    description: "Regulaminy, umowy, polityki",
    allowedTypes: ["pdf", "docx", "txt"],
  },
  SZABLONY: {
    id: "szablony",
    name: "Szablony Certyfikatów",
    icon: "📜",
    description: "VCA, BHP, custom templates",
    allowedTypes: ["pdf", "docx", "html"],
  },
  BACKUPY: {
    id: "backupy",
    name: "Backupy Bazy Danych",
    icon: "💾",
    description: "SQL dumps, CSV exports",
    allowedTypes: ["sql", "csv", "json", "zip"],
  },
  ZDJECIA: {
    id: "zdjecia",
    name: "Zdjęcia & Loga",
    icon: "🖼️",
    description: "Logo firmy, zdjęcia projektów",
    allowedTypes: ["png", "jpg", "jpeg", "svg", "webp"],
  },
  INNE: {
    id: "inne",
    name: "Inne Pliki",
    icon: "📦",
    description: "Wszystko inne",
    allowedTypes: "*", // Wszystkie typy
  },
} as const;
```

### **❌ Dlaczego NIE dynamic folders?**

- ❌ Nie potrzebujesz tworzyć nowych folderów co tydzień
- ❌ 5 kategorii wystarczy dla 99% przypadków
- ❌ Hierarchia (subfoldery) = kompleksność
- ❌ Demo code miał `media_folders` table - niepotrzebne!

---

## 🔧 BACKEND - SERVICE (WŁASNY, prosty!)

### **`src/services/adminFiles.ts`** (~150 linii, nie 500!)

```typescript
import { supabase } from "@/lib/supabase";
import { ADMIN_FOLDERS } from "@/config/adminFolders";

export type AdminFile = {
  id: string;
  name: string;
  file_type: string;
  folder: string;
  storage_path: string;
  public_url: string | null;
  size_bytes: number;
  notes: string | null;
  is_important: boolean;
  uploaded_by: string;
  created_at: string;
};

// ========================================
// UPLOAD
// ========================================
export const uploadFile = async (
  file: File,
  folder: keyof typeof ADMIN_FOLDERS,
  notes?: string
): Promise<AdminFile> => {
  // 1. Validate file type
  const allowedTypes = ADMIN_FOLDERS[folder].allowedTypes;
  const fileExt = file.name.split(".").pop()?.toLowerCase();

  if (allowedTypes !== "*" && !allowedTypes.includes(fileExt!)) {
    throw new Error(`File type .${fileExt} not allowed in ${folder}`);
  }

  // 2. Upload to Supabase Storage
  const storagePath = `${folder}/${Date.now()}_${file.name}`;
  const { data: storageData, error: storageError } = await supabase.storage
    .from("admin-files")
    .upload(storagePath, file);

  if (storageError) throw storageError;

  // 3. Get public URL
  const { data: urlData } = supabase.storage
    .from("admin-files")
    .getPublicUrl(storagePath);

  // 4. Save metadata to database
  const { data, error } = await supabase
    .from("admin_files")
    .insert({
      name: file.name,
      file_type: fileExt,
      folder: folder.toLowerCase(),
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      size_bytes: file.size,
      notes: notes || null,
      is_important: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ========================================
// GET FILES
// ========================================
export const getFilesByFolder = async (
  folder: string
): Promise<AdminFile[]> => {
  const { data, error } = await supabase
    .from("admin_files")
    .select("*")
    .eq("folder", folder)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getAllFiles = async (): Promise<AdminFile[]> => {
  const { data, error } = await supabase
    .from("admin_files")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getImportantFiles = async (): Promise<AdminFile[]> => {
  const { data, error } = await supabase
    .from("admin_files")
    .select("*")
    .eq("is_important", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// ========================================
// UPDATE
// ========================================
export const toggleImportant = async (id: string): Promise<void> => {
  const { data: file } = await supabase
    .from("admin_files")
    .select("is_important")
    .eq("id", id)
    .single();

  await supabase
    .from("admin_files")
    .update({ is_important: !file?.is_important })
    .eq("id", id);
};

export const updateNotes = async (id: string, notes: string): Promise<void> => {
  await supabase.from("admin_files").update({ notes }).eq("id", id);
};

// ========================================
// DELETE
// ========================================
export const deleteFile = async (id: string): Promise<void> => {
  // 1. Get file metadata
  const { data: file } = await supabase
    .from("admin_files")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (!file) throw new Error("File not found");

  // 2. Delete from Storage
  await supabase.storage.from("admin-files").remove([file.storage_path]);

  // 3. Delete from Database
  await supabase.from("admin_files").delete().eq("id", id);
};

// ========================================
// DOWNLOAD
// ========================================
export const downloadFile = async (id: string): Promise<void> => {
  const { data: file } = await supabase
    .from("admin_files")
    .select("storage_path, name")
    .eq("id", id)
    .single();

  if (!file) throw new Error("File not found");

  const { data, error } = await supabase.storage
    .from("admin-files")
    .download(file.storage_path);

  if (error) throw error;

  // Trigger browser download
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
};

// ========================================
// BACKUP DATABASE (from DatabaseManager)
// ========================================
export const exportDatabaseBackup = async (): Promise<void> => {
  // TODO: Implement SQL dump export
  // This will be separate function in next iteration
  console.log("Database backup - TODO");
};
```

### **❌ CO USUNĘLIŚMY z demo:**

- ~~`moveMedia()`~~ - bez hierarchii, nie można przenosić
- ~~`updateMedia()`~~ - tylko notes i important, nie cała metadata
- ~~`searchMedia()`~~ - prosty filter w UI wystarczy
- ~~`createFolder()`~~ - foldery są stałe!

### **✅ CO DODALIŚMY:**

- ✅ `toggleImportant()` - gwiazdka
- ✅ `getImportantFiles()` - filter po gwiazdkach
- ✅ Walidacja file types per folder

---

## 🎨 FRONTEND - UI (PROSTY!)

### **`pages/Admin/MyFilesManager.tsx`** (~300 linii, nie 700!)

```tsx
import React, { useState, useEffect } from "react";
import { ADMIN_FOLDERS } from "@/config/adminFolders";
import * as adminFilesService from "@/services/adminFiles";
import { Upload, Star, Download, Trash2, FileText } from "lucide-react";

export const MyFilesManager = () => {
  const [activeFolder, setActiveFolder] = useState<string>("dokumenty");
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [activeFolder]);

  const loadFiles = async () => {
    setLoading(true);
    const data = await adminFilesService.getFilesByFolder(activeFolder);
    setFiles(data);
    setLoading(false);
  };

  const handleUpload = async (file: File, notes: string) => {
    await adminFilesService.uploadFile(file, activeFolder, notes);
    loadFiles();
    setUploadModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno usunąć ten plik?")) return;
    await adminFilesService.deleteFile(id);
    loadFiles();
  };

  const handleToggleImportant = async (id: string) => {
    await adminFilesService.toggleImportant(id);
    loadFiles();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">📂 Moje Pliki & Dokumenty</h1>
            <p className="text-gray-600">
              Dokumenty, szablony, backupy i zdjęcia firmowe
            </p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload Plik
          </button>
        </div>

        {/* Folder Tabs (SIMPLE) */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {Object.entries(ADMIN_FOLDERS).map(([key, folder]) => (
            <button
              key={key}
              onClick={() => setActiveFolder(folder.id)}
              className={`
                px-6 py-4 rounded-lg whitespace-nowrap
                ${
                  activeFolder === folder.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <span className="text-2xl mr-2">{folder.icon}</span>
              <span className="font-medium">{folder.name}</span>
            </button>
          ))}
        </div>

        {/* Files Grid (SIMPLE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow p-6">
              {/* File Icon */}
              <div className="text-6xl text-center mb-4">
                {getFileIcon(file.file_type)}
              </div>

              {/* File Name */}
              <h3 className="font-semibold text-center mb-2 truncate">
                {file.name}
              </h3>

              {/* File Size */}
              <p className="text-sm text-gray-500 text-center mb-4">
                {formatBytes(file.size_bytes)}
              </p>

              {/* Actions */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleToggleImportant(file.id)}
                  className={
                    file.is_important ? "text-yellow-500" : "text-gray-400"
                  }
                >
                  <Star
                    className="w-5 h-5"
                    fill={file.is_important ? "currentColor" : "none"}
                  />
                </button>
                <button onClick={() => adminFilesService.downloadFile(file.id)}>
                  <Download className="w-5 h-5 text-blue-600" />
                </button>
                <button onClick={() => handleDelete(file.id)}>
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>

              {/* Notes (if exists) */}
              {file.notes && (
                <p className="text-xs text-gray-500 mt-4 italic">
                  {file.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {files.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Brak plików w tym folderze</p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4 text-blue-600 hover:underline"
            >
              Upload pierwszy plik →
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal (TODO) */}
      {uploadModalOpen && (
        <UploadModal
          folder={activeFolder}
          onUpload={handleUpload}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </div>
  );
};

// Helper functions
const getFileIcon = (type: string) => {
  const icons: Record<string, string> = {
    pdf: "📄",
    docx: "📝",
    txt: "📃",
    png: "🖼️",
    jpg: "🖼️",
    jpeg: "🖼️",
    svg: "🎨",
    sql: "💾",
    csv: "📊",
    json: "📋",
    zip: "📦",
  };
  return icons[type] || "📄";
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};
```

### **❌ CO USUNĘLIŚMY z demo:**

- ~~Complicated folder navigation~~ - tylko tabs
- ~~Media preview modal z metadata edit~~ - tylko download
- ~~Tags autocomplete~~ - bez tagów
- ~~Advanced filters~~ - prosty folder tab wystarczy
- ~~WYSIWYG editor dla content~~ - to nie CMS!

### **✅ CO DODALIŚMY:**

- ✅ Star (important) button - szybkie oznaczanie
- ✅ Simple grid layout - czytelny
- ✅ File icons per type - wizualne
- ✅ Empty state - UX
- ✅ Notes display - jeśli są

---

## 🎯 PORÓWNANIE: DEMO vs WŁASNY KOD

### **Demo Code (MediaManager + DatabaseManager):**

```
Pliki:
- MediaManager.tsx         479 linii
- DatabaseManager.tsx      360 linii
- useMedia.ts              ~200 linii
- useDatabase.ts           ~150 linii
TOTAL:                     ~1,189 linii

Tabele:
- media                    10 kolumn
- media_folders            5 kolumn
TOTAL:                     2 tabele

Funkcje:
- 15+ funkcji (createFolder, moveMedia, updateMetadata, etc.)
- Hierarchiczne foldery (parent_id, recursive)
- Advanced search, filters, tags
```

### **Własny Kod (MyFilesManager):**

```
Pliki:
- MyFilesManager.tsx       ~300 linii
- adminFiles.ts            ~150 linii
- adminFolders.ts          ~50 linii
TOTAL:                     ~500 linii

Tabele:
- admin_files              10 kolumn (ale prostsze!)
TOTAL:                     1 tabela

Funkcje:
- 8 funkcji (upload, delete, download, toggleImportant, etc.)
- Predefiniowane foldery (no parent_id!)
- Simple filter by folder
```

### **OSZCZĘDNOŚCI:**

- 📉 **~690 linii kodu mniej** (60% mniej!)
- 📉 **1 tabela mniej** w bazie
- 📉 **50% mniej funkcji** do maintain
- ✅ **Łatwiejsze w zrozumieniu** (za 3 miesiące też!)

---

## 🚀 WDROŻENIE - ETAPY

### **WIECZOREM (kodowanie):**

**FAZA 1: Database (10 min)**

```bash
# Run migration
psql -h your-supabase-host -d postgres -f database-migrations/create_admin_files.sql

# Create Supabase Storage bucket:
# Dashboard → Storage → Create bucket "admin-files"
# Settings: Private, 50MB limit
```

**FAZA 2: Backend (20 min)**

```bash
# Create files
touch src/services/adminFiles.ts
touch src/config/adminFolders.ts

# Copy code from this plan (not from demo!)
```

**FAZA 3: Frontend (30 min)**

```bash
# Create component
touch pages/Admin/MyFilesManager.tsx

# Create upload modal
touch components/Admin/UploadModal.tsx

# Copy code from this plan
```

**FAZA 4: Routing (5 min)**

```tsx
// App.tsx
<Route path="my-files" element={<MyFilesManager />} />

// AdminDashboard.tsx - dodaj kartę
{
  title: "Moje Pliki & Dokumenty",
  path: "/admin/my-files",
  icon: "📂",
  // ...
}
```

**FAZA 5: Cleanup (15 min)**

```bash
# USUŃ stare pliki (demo code):
rm pages/Admin/MediaManager.tsx
rm pages/Admin/DatabaseManager.tsx
rm src/hooks/useMedia.ts
rm src/hooks/useDatabase.ts

# USUŃ stare routes:
# App.tsx - remove /admin/media, /admin/database
```

**FAZA 6: Test (10 min)**

```bash
# Dev server
npm run dev

# Test:
# - Upload PDF do Dokumenty ✅
# - Upload PNG do Zdjęcia ✅
# - Star plik ✅
# - Download plik ✅
# - Delete plik ✅
# - Console Ninja - check logs ✅
```

---

## ✅ CHECKLIST PRZED STARTEM

- [ ] Przeczytałem cały plan
- [ ] Rozumiem dlaczego NIE kopiujemy demo code
- [ ] Rozumiem strukturę folderów (5 stałych, nie dynamiczne)
- [ ] Rozumiem minimalną bazę danych (tylko potrzebne kolumny)
- [ ] Mam dostęp do Supabase Dashboard (bucket creation)
- [ ] Gotowy na kodowanie wieczorem

---

**Koniec planu**  
**Zasada:** SIMPLE > COMPLEX  
**Motto:** "Less code = Less bugs"  
**Autor:** GitHub Copilot  
**Data:** 13.11.2025
