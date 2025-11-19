import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ============================================
// TYPES & INTERFACES
// ============================================

export type FileType =
  | "image"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "archive"
  | "video"
  | "audio"
  | "cad"
  | "blueprint"
  | "other";
export type FileStatus =
  | "uploading"
  | "active"
  | "processing"
  | "archived"
  | "deleted";

export interface ProjectFile {
  id: string;
  task_id: string; // używane jako project_id dla kompatybilności z task_attachments
  uploaded_by: string;
  file_name: string; // task_attachments używa file_name zamiast original_filename
  storage_path: string;
  file_size: number;
  file_type?: string; // opcjonalne w task_attachments
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
  uploadProgress: UploadProgress[];
  uploadFiles: (files: File[]) => Promise<ProjectFile[]>;
  downloadFile: (file: ProjectFile) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  updateFile: (fileId: string, updates: Partial<ProjectFile>) => Promise<void>;
  getFileUrl: (file: ProjectFile, download?: boolean) => Promise<string>;
  generateThumbnail: (file: ProjectFile) => Promise<string | null>;
  refreshFiles: () => Promise<void>;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

const determineFileType = (mimeType: string): FileType => {
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("document")
  )
    return "document";
  if (
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    mimeType === "text/csv"
  )
    return "spreadsheet";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
    return "presentation";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  )
    return "archive";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("dwg") || mimeType.includes("dxf")) return "cad";
  return "other";
};

const generateFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

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
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  // ============================================
  // FETCH FILES
  // ============================================

  const fetchFiles = useCallback(async () => {
    if (!enabled || !projectId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(`Błąd pobierania plików: ${fetchError.message}`);
      }

      setFiles(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Nieznany błąd podczas pobierania plików";
      setError(errorMessage);
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, enabled]);

  // ============================================
  // UPLOAD FILES
  // ============================================

  const uploadFiles = useCallback(
    async (filesToUpload: File[]): Promise<ProjectFile[]> => {
      const uploadedFiles: ProjectFile[] = [];

      try {
        setError(null);

        for (const file of filesToUpload) {
          const fileId = crypto.randomUUID();
          const progressItem: UploadProgress = {
            fileId,
            filename: file.name,
            progress: 0,
            status: "uploading",
          };

          setUploadProgress((prev) => [...prev, progressItem]);

          try {
            // 1. Validate file
            if (file.size > 100 * 1024 * 1024) {
              // 100MB limit
              throw new Error(`Plik ${file.name} jest za duży (max 100MB)`);
            }

            // 2. Generate hash for deduplication
            const fileHash = await generateFileHash(file);

            // 3. Check if file already exists
            const { data: existingFile } = await supabase
              .from("project_files")
              .select("id, original_filename")
              .eq("project_id", projectId)
              .eq("file_hash", fileHash)
              .eq("status", "active")
              .single();

            if (existingFile) {
              setUploadProgress((prev) =>
                prev.map((p) =>
                  p.fileId === fileId
                    ? {
                        ...p,
                        status: "error",
                        error: `Plik już istnieje: ${existingFile.original_filename}`,
                      }
                    : p
                )
              );
              continue;
            }

            // 4. Get current user
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("Brak autoryzacji");

            // 5. Create storage path
            const fileExtension = file.name.split(".").pop() || "";
            const storagePath = `${user.id}/${fileId}.${fileExtension}`;

            // 6. Upload to Supabase Storage
            setUploadProgress((prev) =>
              prev.map((p) =>
                p.fileId === fileId ? { ...p, progress: 10 } : p
              )
            );

            const { error: uploadError } = await supabase.storage
              .from("project-files")
              .upload(storagePath, file, {
                cacheControl: "3600",
                upsert: false,
              });

            if (uploadError) {
              throw new Error(`Błąd uploadu: ${uploadError.message}`);
            }

            setUploadProgress((prev) =>
              prev.map((p) =>
                p.fileId === fileId ? { ...p, progress: 70 } : p
              )
            );

            // 7. Save file metadata to database
            const fileData = {
              id: fileId,
              project_id: projectId,
              uploaded_by: user.id,
              original_filename: file.name,
              storage_path: storagePath,
              file_size: file.size,
              mime_type: file.type,
              file_type: determineFileType(file.type),
              file_hash: fileHash,
              status: "active" as FileStatus,
              is_public: false,
              download_count: 0,
            };

            const { data: savedFile, error: dbError } = await supabase
              .from("project_files")
              .insert([fileData])
              .select()
              .single();

            if (dbError) {
              // Clean up storage if database insert fails
              await supabase.storage
                .from("project-files")
                .remove([storagePath]);
              throw new Error(`Błąd zapisu do bazy: ${dbError.message}`);
            }

            uploadedFiles.push(savedFile);

            setUploadProgress((prev) =>
              prev.map((p) =>
                p.fileId === fileId
                  ? { ...p, progress: 100, status: "complete" }
                  : p
              )
            );
          } catch (fileError) {
            const errorMessage =
              fileError instanceof Error
                ? fileError.message
                : "Nieznany błąd uploadu";
            setUploadProgress((prev) =>
              prev.map((p) =>
                p.fileId === fileId
                  ? { ...p, status: "error", error: errorMessage }
                  : p
              )
            );
            console.error(`Upload error for ${file.name}:`, fileError);
          }
        }

        // Refresh files list
        await fetchFiles();

        // Clear progress after delay
        setTimeout(() => {
          setUploadProgress([]);
        }, 3000);

        return uploadedFiles;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Nieznany błąd uploadu";
        setError(errorMessage);
        setUploadProgress([]);
        return [];
      }
    },
    [projectId, fetchFiles]
  );

  // ============================================
  // DOWNLOAD FILE
  // ============================================

  const downloadFile = useCallback(
    async (file: ProjectFile): Promise<void> => {
      try {
        setError(null);

        const { data, error: downloadError } = await supabase.storage
          .from("project-files")
          .download(file.storage_path);

        if (downloadError) {
          throw new Error(`Błąd pobierania: ${downloadError.message}`);
        }

        // Create download link
        const blob = new Blob([data], {
          type: file.file_type || "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // File downloaded successfully
        console.log("✅ File downloaded:", file.file_name);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Nieznany błąd pobierania";
        setError(errorMessage);
        console.error("Download error:", err);
      }
    },
    [fetchFiles]
  );

  // ============================================
  // DELETE FILE
  // ============================================

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      try {
        setError(null);

        const fileToDelete = files.find((f) => f.id === fileId);
        if (!fileToDelete) {
          throw new Error("Plik nie został znaleziony");
        }

        // Soft delete in database
        const { error: dbError } = await supabase
          .from("project_files")
          .update({
            status: "deleted",
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", fileId);

        if (dbError) {
          throw new Error(`Błąd usuwania z bazy: ${dbError.message}`);
        }

        // Remove from storage
        const { error: storageError } = await supabase.storage
          .from("project-files")
          .remove([fileToDelete.storage_path]);

        if (storageError) {
          console.warn("Storage removal warning:", storageError.message);
          // Don't throw here - database deletion succeeded
        }

        // Refresh files
        await fetchFiles();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Nieznany błąd usuwania";
        setError(errorMessage);
        console.error("Delete error:", err);
      }
    },
    [files, fetchFiles]
  );

  // ============================================
  // UPDATE FILE
  // ============================================

  const updateFile = useCallback(
    async (fileId: string, updates: Partial<ProjectFile>): Promise<void> => {
      try {
        setError(null);

        const { error: updateError } = await supabase
          .from("project_files")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", fileId);

        if (updateError) {
          throw new Error(`Błąd aktualizacji: ${updateError.message}`);
        }

        // Refresh files
        await fetchFiles();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Nieznany błąd aktualizacji";
        setError(errorMessage);
        console.error("Update error:", err);
      }
    },
    [fetchFiles]
  );

  // ============================================
  // GET FILE URL
  // ============================================

  const getFileUrl = useCallback(
    async (file: ProjectFile, download = false): Promise<string> => {
      try {
        const { data, error } = await supabase.storage
          .from("project-files")
          .createSignedUrl(file.storage_path, 3600, {
            // 1 hour expiry
            download: download ? file.file_name : undefined,
          });

        if (error) {
          throw new Error(`Błąd generowania URL: ${error.message}`);
        }

        return data.signedUrl;
      } catch (err) {
        console.error("URL generation error:", err);
        return "";
      }
    },
    []
  );

  // ============================================
  // GENERATE THUMBNAIL
  // ============================================

  const generateThumbnail = useCallback(
    async (file: ProjectFile): Promise<string | null> => {
      if (file.file_type !== "image") return null;

      try {
        const url = await getFileUrl(file);
        if (!url) return null;

        // For now, return the same URL - in production you might want to generate actual thumbnails
        return url;
      } catch (err) {
        console.error("Thumbnail generation error:", err);
        return null;
      }
    },
    [getFileUrl]
  );

  // ============================================
  // REFRESH FILES
  // ============================================

  const refreshFiles = useCallback(async () => {
    await fetchFiles();
  }, [fetchFiles]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ============================================
  // RETURN
  // ============================================

  return {
    files,
    loading,
    error,
    uploadProgress,
    uploadFiles,
    downloadFile,
    deleteFile,
    updateFile,
    getFileUrl,
    generateThumbnail,
    refreshFiles,
  };
};

// ============================================
// UTILITY EXPORT
// ============================================

export { formatFileSize, determineFileType };
