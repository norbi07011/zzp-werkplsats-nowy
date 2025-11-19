# 📁 PLAN - NOWA KARTA "MOJE PLIKI & DOKUMENTY"

**Data:** 13.11.2025  
**Status:** ANALIZA - Czekam na screenshot

---

## 🎯 CELE PROJEKTU

**User request:**

> "Moje pliki powinien być dla mnie, żebym miał wszystko w jednym miejscu. Dokumenty, zdjęcia, szablony certyfikatów, baza danych."

**POŁĄCZENIE 2 KART W JEDNĄ:**

- ❌ USUŃ: "Media & Pliki" (multimedia dla całej platformy - niepotrzebne)
- ❌ USUŃ: "Baza Danych & Backup" (techniczne admin tools)
- ✅ NOWA: "Moje Pliki & Dokumenty" (PRYWATNE pliki admina)

---

## 🔍 CO MASZ TERAZ - ANALIZA

### **KARTA 1: Media & Pliki** (`/admin/media`)

**Plik:** `pages/Admin/MediaManager.tsx` (479 linii)

**Co robi:**

- Upload plików multimedialnych (images, video, docs)
- System folderów (parent_id, hierarchia)
- Filtrowanie po typie (all, image, video, document)
- Preview, edit metadata (alt_text, description)
- Delete files

**Baza danych:**

```sql
CREATE TABLE media (
  id UUID PRIMARY KEY,
  name TEXT,
  original_filename TEXT,
  type TEXT, -- 'image', 'video', 'document'
  url TEXT,
  size INTEGER,
  folder_id UUID,
  alt_text TEXT,
  description TEXT,
  created_at TIMESTAMP
);

CREATE TABLE media_folders (
  id UUID PRIMARY KEY,
  name TEXT,
  parent_id UUID,
  created_at TIMESTAMP
);
```

**Statystyki:**

- Total Files: 0
- Total Size: 0 MB
- Images: 0
- Videos: 0

**Hook:** `src/hooks/useMedia.ts`

- createFolder(name, parent_id)
- uploadFile(file, folder_id)
- updateMedia(id, updates)
- deleteMedia(id)
- moveMedia(id, folder_id)

**PROBLEM:**

- ❌ To są pliki dla **całej platformy** (avatary userów, gallery)
- ❌ Nie jest to TWOJA prywatna przestrzeń
- ❌ Inni użytkownicy mogą dodawać swoje pliki tutaj

---

### **KARTA 2: Baza Danych & Backup** (`/admin/database`)

**Plik:** `pages/Admin/DatabaseManager.tsx` (360 linii)

**Co robi:**

- Wyświetla statystyki bazy:
  - Liczba tabel
  - Łączna liczba rekordów
  - Rozmiar w MB
  - Status (działa/nie działa)
- Top 5 największych tabel (bar chart)
- Lista wszystkich tabel z:
  - Nazwa tabeli
  - Liczba wierszy
  - Rozmiar
  - Przycisk "Export" (CSV/JSON)
- Eksport wszystkich tabel naraz
- Refresh stats

**Hook:** `src/hooks/useDatabase.ts`

- fetchStats() - statystyki bazy
- fetchTableInfo(tableName) - info o tabeli
- exportTableData(tableName) - export do CSV
- refreshAll() - odśwież wszystkie dane

**Funkcje które SĄ PRZYDATNE:**

- ✅ Export całej bazy (backup)
- ✅ Export pojedynczej tabeli
- ✅ Statystyki rozmiaru

**PROBLEM:**

- ❌ To są **techniczne admin tools**
- ❌ Nie jest to miejsce do trzymania TWOICH dokumentów
- ❌ Brak upload funkcji

---

## 🎯 NOWA KARTA - WYMAGANIA

### **Nazwa:** "Moje Pliki & Dokumenty"

**Route:** `/admin/my-files`

**Ikona:** 📂 lub 🗂️

**Opis:** "Twoje dokumenty, szablony, backupy i zdjęcia firmowe"

---

### **FUNKCJE:**

#### **1. UPLOAD & STORAGE**

```tsx
- Drag & Drop upload
- Multiple files naraz
- Typy: PDF, DOCX, TXT, PNG, JPG, ZIP, SQL, CSV
- Max rozmiar: 50MB na plik
- Storage: Supabase Storage bucket "admin-files"
```

#### **2. FOLDERY (Predefiniowane)**

```tsx
📁 Dokumenty Firmowe
  - Umowy
  - Regulaminy
  - Polityka prywatności

📁 Szablony Certyfikatów
  - VCA Template
  - BHP Template
  - Custom Templates

📁 Backupy Bazy Danych
  - SQL dumps
  - CSV exports
  - JSON backups

📁 Zdjęcia & Loga
  - Logo firmy
  - Zdjęcia projektów
  - Banery

📁 Inne
```

#### **3. PREVIEW**

```tsx
- PDF: Inline viewer (lub download)
- Images: Modal z pełnym rozmiarem
- Text: Syntax highlighting dla SQL/JSON
- Inne: Download button
```

#### **4. ZARZĄDZANIE**

```tsx
- Rename file
- Move to folder
- Delete (z confirmacją)
- Download
- Copy link (jeśli public)
- Tags (opcjonalne: "ważne", "draft", "archiwum")
```

#### **5. BACKUP BAZY (z DatabaseManager)**

```tsx
- Button "📥 Backup całej bazy"
- Export do:
  * SQL dump (wszystkie tabele)
  * ZIP z CSV (każda tabela osobno)
  * JSON (strukturalne dane)
- Auto-save do folderu "Backupy Bazy Danych"
- Timestamp w nazwie (backup_2025-11-13_14-30.sql)
```

#### **6. SEARCH & FILTER**

```tsx
- Search po nazwie pliku
- Filter po folderze
- Filter po typie (PDF, Image, SQL, etc.)
- Sort by: nazwa, data, rozmiar
```

---

## 🗄️ BAZA DANYCH - NOWA TABELA

### **Tabela: `admin_files`**

```sql
CREATE TABLE admin_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'image', 'sql', 'csv', 'zip'
  folder TEXT NOT NULL, -- 'dokumenty', 'szablony', 'backupy', 'zdjecia', 'inne'
  url TEXT NOT NULL, -- Supabase Storage URL
  size INTEGER, -- bytes
  tags TEXT[], -- ['ważne', 'draft', 'archiwum']
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_files_folder ON admin_files(folder);
CREATE INDEX idx_admin_files_type ON admin_files(file_type);
CREATE INDEX idx_admin_files_created ON admin_files(created_at DESC);

-- RLS Policies
ALTER TABLE admin_files ENABLE ROW LEVEL SECURITY;

-- Only admins can access
CREATE POLICY "Admins full access" ON admin_files
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### **Supabase Storage Bucket:**

```sql
-- Bucket name: "admin-files"
-- Public: false (tylko admin ma dostęp)
-- Max file size: 50MB
-- Allowed MIME types:
--   - application/pdf
--   - image/png, image/jpeg
--   - text/plain, text/csv
--   - application/zip
--   - application/sql
```

---

## 📁 STRUKTURA PLIKÓW - CO STWORZYĆ

### **NOWE PLIKI:**

1. **`pages/Admin/MyFilesManager.tsx`** (~400 linii)

   - Main panel component
   - Upload UI (drag & drop)
   - Files grid/list
   - Folder tabs
   - Preview modals

2. **`src/services/adminFiles.ts`** (~250 linii)

   ```typescript
   uploadFile(file: File, folder: string)
   getFilesByFolder(folder: string)
   getAllFiles()
   deleteFile(id: string)
   updateFile(id: string, updates)
   downloadFile(id: string)
   exportDatabaseBackup() // NEW - from DatabaseManager
   ```

3. **`src/hooks/useAdminFiles.ts`** (~180 linii)

   ```typescript
   const { files, loading, upload, deleteFile, downloadFile, exportBackup } =
     useAdminFiles();
   ```

4. **`components/Admin/FileUploadZone.tsx`** (~100 linii)

   - Drag & Drop area
   - Progress bar
   - File type validation

5. **`components/Admin/FilePreview.tsx`** (~150 linii)

   - PDF viewer
   - Image modal
   - Text/SQL syntax highlighting

6. **`database-migrations/20XX_create_admin_files.sql`**
   - CREATE TABLE admin_files
   - Indexes
   - RLS policies

---

## 🔧 CO ZROBIĆ Z ISTNIEJĄCYMI PLIKAMI

### **PLIKI DO USUNIĘCIA:**

❌ **`pages/Admin/MediaManager.tsx`** (479 linii)

- Już nie potrzebny - zastąpiony przez MyFilesManager

❌ **`pages/Admin/DatabaseManager.tsx`** (360 linii)

- Funkcja "export backup" zostaje ale w MyFilesManager

❌ **`src/hooks/useMedia.ts`** (jeśli istnieje)

- Zastąpiony przez useAdminFiles

❌ **`src/hooks/useDatabase.ts`** (jeśli istnieje)

- Tylko eksport funkcje przepisujemy do adminFiles.ts

❌ **Tabele `media` i `media_folders`** (opcjonalnie - jeśli puste)

```sql
DROP TABLE media;
DROP TABLE media_folders;
```

### **PLIKI DO MODYFIKACJI:**

📝 **`App.tsx`**

```tsx
// USUŃ:
<Route path="media" element={<MediaManager />} />
<Route path="database" element={<DatabaseManager />} />

// DODAJ:
<Route path="my-files" element={<MyFilesManager />} />
```

📝 **`pages/AdminDashboard.tsx`**

```tsx
// USUŃ karty (linie 634-640 i 693-698):
{
  title: "Media & Pliki",
  path: "/admin/media",
  ...
},
{
  title: "Baza Danych & Backup",
  path: "/admin/database",
  ...
}

// DODAJ NOWĄ:
{
  title: "Moje Pliki & Dokumenty",
  description: "Dokumenty, szablony, backupy i zdjęcia firmowe",
  path: "/admin/my-files",
  icon: "📂",
  color: "premium" as const,
  stats: {
    label: "Files",
    value: filesCount.toString(),
    trend: `${totalSizeMB} MB`
  },
}
```

---

## 🎨 UI/UX DESIGN

### **Layout:**

```
┌─────────────────────────────────────────────────────┐
│  📂 Moje Pliki & Dokumenty              [Upload] [Backup DB] │
├─────────────────────────────────────────────────────┤
│  Stats: Files: 24 | Size: 156 MB | Last upload: 2h ago  │
├─────────────────────────────────────────────────────┤
│  [📁 Dokumenty] [📁 Szablony] [📁 Backupy] [📁 Zdjęcia] [📁 Inne] │
├─────────────────────────────────────────────────────┤
│  Search: [.....................] [🔍]                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ PDF  │  │ DOCX │  │ PNG  │  │ SQL  │           │
│  │ Icon │  │ Icon │  │ Icon │  │ Icon │           │
│  │      │  │      │  │      │  │      │           │
│  │Name  │  │Name  │  │Name  │  │Name  │           │
│  │2.5MB │  │1.2MB │  │850KB │  │4.1MB │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
│                                                     │
│  [Download] [Preview] [Delete]                      │
└─────────────────────────────────────────────────────┘
```

### **Upload Modal:**

```
┌─────────────────────────────────────┐
│  Upload Pliki                   [X] │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📤 Przeciągnij pliki tutaj │   │
│  │     lub kliknij aby wybrać   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Folder: [▼ Dokumenty Firmowe]      │
│                                     │
│  Typ: PDF, DOCX, TXT, PNG, JPG, SQL │
│  Max: 50MB                           │
│                                     │
│  [Wybierz pliki] [Anuluj]           │
└─────────────────────────────────────┘
```

---

## ❓ PYTANIA DO CIEBIE

### **1. Czy usunąć tabele `media` i `media_folders`?**

- [ ] TAK - wywal wszystko (puste i tak)
- [ ] NIE - zostaw (może komuś przydatne)

### **2. Backup bazy - jakie formaty?**

- [ ] SQL dump (cała baza jako .sql)
- [ ] ZIP z CSV (każda tabela osobno)
- [ ] JSON (strukturalne dane)
- [ ] Wszystkie 3

### **3. Predefiniowane foldery - OK?**

- [ ] Dokumenty, Szablony, Backupy, Zdjęcia, Inne - OK
- [ ] Dodaj inne: ********\_********

### **4. Max rozmiar pliku:**

- [ ] 50MB - OK
- [ ] Więcej: ****\_****MB

### **5. Auto-backup bazy?**

- [ ] Tak - codziennie o 3:00 w nocy
- [ ] Nie - tylko manualnie

---

## 🚀 WDROŻENIE - ETAPY

**Po Twoich decyzjach:**

### **FAZA 1: Database (10 min)**

- [ ] CREATE TABLE admin_files
- [ ] RLS policies
- [ ] Supabase Storage bucket "admin-files"
- [ ] Test: INSERT 1 testowy plik

### **FAZA 2: Backend (20 min)**

- [ ] src/services/adminFiles.ts
- [ ] src/hooks/useAdminFiles.ts
- [ ] Przepisać exportDatabaseBackup() z DatabaseManager

### **FAZA 3: Components (25 min)**

- [ ] pages/Admin/MyFilesManager.tsx (main panel)
- [ ] components/Admin/FileUploadZone.tsx
- [ ] components/Admin/FilePreview.tsx

### **FAZA 4: Routing (5 min)**

- [ ] App.tsx - dodaj route
- [ ] AdminDashboard.tsx - nowa karta
- [ ] Usuń stare routes (media, database)

### **FAZA 5: Cleanup (10 min)**

- [ ] Usuń MediaManager.tsx
- [ ] Usuń DatabaseManager.tsx
- [ ] Usuń stare hooks
- [ ] (Opcjonalnie) DROP TABLE media, media_folders

### **FAZA 6: Testing (10 min)**

- [ ] Upload PDF
- [ ] Upload obrazek
- [ ] Preview
- [ ] Download
- [ ] Delete
- [ ] Backup bazy
- [ ] Check Console Ninja logs

---

## 📊 SZACUNKI

**Pliki do stworzenia:** 6 nowych  
**Pliki do usunięcia:** 4-5 starych  
**Pliki do modyfikacji:** 2 (App.tsx, AdminDashboard.tsx)  
**Czas:** ~80 minut  
**Ryzyko:** Niskie (nowa funkcja, nie ruszamy core systemu)

---

## 🎯 NASTĘPNE KROKI

**CO TERAZ:**

1. **Wyślij screenshot** - pokażę gdzie są te 2 karty
2. **Odpowiedz na 5 pytań** powyżej
3. **Powiedz "START"** i zaczynam kodować!

**Czekam!** 🚀

---

**Koniec planu**  
**Autor:** GitHub Copilot  
**Data:** 13.11.2025
