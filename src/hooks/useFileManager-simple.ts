import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ============================================
// TYPES & INTERFACES (bazujące na task_attachments)
// ============================================

export interface ProjectFile {
  id: string;
  task_id: string; // używane jako project_id
  uploaded_by: string;
  file_name: string;
  file_size: number;
  file_type?: string;
  storage_path: string;
  description?: string;
  created_at: string;
  deleted_at?: string;
}

export interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

interface UseFileManagerProps {
  projectId: string;
  enabled?: boolean;
}

interface UseFileManagerReturn {
  files: ProjectFile[];
  loading: boolean;
  error: string | null;
  uploadProgress: Record<string, UploadProgress>;

  // Core operations
  uploadFiles: (files: FileList) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  downloadFile: (file: ProjectFile) => Promise<void>;
  getFileUrl: (file: ProjectFile, download?: boolean) => Promise<string>;

  // Utilities
  refreshFiles: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// MAIN HOOK
// ============================================

export const useFileManager = ({
  projectId,
  enabled = true,
}: UseFileManagerProps): UseFileManagerReturn => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgress>
  >({});

  // ============================================
  // FETCH FILES
  // ============================================

  const fetchFiles = useCallback(async () => {
    if (!enabled || !projectId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", projectId) // używamy task_id jako project_id
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(`Błąd pobierania plików: ${fetchError.message}`);
      }

      setFiles(data || []);
    } catch (err) {
      console.error("Błąd fetchFiles:", err);
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, [projectId, enabled]);

  // ============================================
  // UPLOAD FILES
  // ============================================

  const uploadFiles = useCallback(
    async (fileList: FileList) => {
      if (!projectId) {
        setError("Brak ID projektu");
        return;
      }

      const filesArray = Array.from(fileList);

      for (const file of filesArray) {
        const fileId = crypto.randomUUID();
        const fileName = file.name;
        const fileSize = file.size;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const storagePath = `project-files/${projectId}/${timestamp}-${fileName}`;

        try {
          // Progress tracking
          setUploadProgress((prev) => ({
            ...prev,
            [fileId]: {
              fileId,
              filename: fileName,
              progress: 0,
              status: "uploading",
            },
          }));

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("project-files")
              .upload(storagePath, file, {
                cacheControl: "3600",
                upsert: false,
              });

          if (uploadError) {
            throw new Error(`Błąd uploadu: ${uploadError.message}`);
          }

          // Progress update
          setUploadProgress((prev) => ({
            ...prev,
            [fileId]: { ...prev[fileId], progress: 50, status: "processing" },
          }));

          // Get current user
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError || !user) {
            throw new Error("Użytkownik nie jest zalogowany");
          }

          // Save to database using task_attachments table
          const { data: dbData, error: dbError } = await supabase
            .from("task_attachments")
            .insert({
              task_id: projectId, // używamy task_id jako project_id
              uploaded_by: user.id,
              file_name: fileName,
              file_size: fileSize,
              file_type: file.type || "application/octet-stream",
              storage_path: storagePath,
              description: `Uploaded file: ${fileName}`,
            })
            .select()
            .single();

          if (dbError) {
            // Jeśli database insert fail, usuń plik ze storage
            await supabase.storage.from("project-files").remove([storagePath]);
            throw new Error(`Błąd zapisu do bazy: ${dbError.message}`);
          }

          // Final progress update
          setUploadProgress((prev) => ({
            ...prev,
            [fileId]: { ...prev[fileId], progress: 100, status: "complete" },
          }));

          console.log("✅ Plik uploaded:", dbData);
        } catch (err) {
          console.error("❌ Błąd upload:", err);
          setUploadProgress((prev) => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              status: "error",
              error: err instanceof Error ? err.message : "Nieznany błąd",
            },
          }));
          setError(err instanceof Error ? err.message : "Błąd uploadu");
        }
      }

      // Refresh files list
      await fetchFiles();

      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress({});
      }, 3000);
    },
    [projectId, fetchFiles]
  );

  // ============================================
  // DELETE FILE
  // ============================================

  const deleteFile = useCallback(
    async (fileId: string) => {
      try {
        setLoading(true);

        // Znajdź plik w bazie
        const { data: fileData, error: findError } = await supabase
          .from("task_attachments")
          .select("*")
          .eq("id", fileId)
          .single();

        if (findError || !fileData) {
          throw new Error("Plik nie został znaleziony");
        }

        // Usuń plik ze storage
        const { error: storageError } = await supabase.storage
          .from("project-files")
          .remove([fileData.storage_path]);

        if (storageError) {
          console.warn("Ostrzeżenie storage delete:", storageError.message);
        }

        // Soft delete w bazie (ustaw deleted_at)
        const { error: dbError } = await supabase
          .from("task_attachments")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", fileId);

        if (dbError) {
          throw new Error(`Błąd usuwania z bazy: ${dbError.message}`);
        }

        // Refresh files
        await fetchFiles();
      } catch (err) {
        console.error("❌ Błąd delete:", err);
        setError(err instanceof Error ? err.message : "Błąd usuwania");
      } finally {
        setLoading(false);
      }
    },
    [fetchFiles]
  );

  // ============================================
  // DOWNLOAD FILE
  // ============================================

  const downloadFile = useCallback(async (file: ProjectFile) => {
    try {
      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from("project-files")
        .download(file.storage_path);

      if (error) {
        throw new Error(`Błąd pobierania: ${error.message}`);
      }

      // Create download link
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.file_name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Błąd download:", err);
      setError(err instanceof Error ? err.message : "Błąd pobierania");
    }
  }, []);

  // ============================================
  // GET FILE URL
  // ============================================

  const getFileUrl = useCallback(
    async (file: ProjectFile, download = false) => {
      try {
        const { data, error } = await supabase.storage
          .from("project-files")
          .createSignedUrl(file.storage_path, 60 * 60, {
            // 1 hour
            download: download ? file.file_name : undefined,
          });

        if (error) {
          throw new Error(`Błąd URL: ${error.message}`);
        }

        return data.signedUrl;
      } catch (err) {
        console.error("❌ Błąd getFileUrl:", err);
        throw err;
      }
    },
    []
  );

  // ============================================
  // UTILITIES
  // ============================================

  const refreshFiles = useCallback(async () => {
    await fetchFiles();
  }, [fetchFiles]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (enabled && projectId) {
      fetchFiles();
    }
  }, [fetchFiles, enabled, projectId]);

  return {
    files,
    loading,
    error,
    uploadProgress,
    uploadFiles,
    deleteFile,
    downloadFile,
    getFileUrl,
    refreshFiles,
    clearError,
  };
};
