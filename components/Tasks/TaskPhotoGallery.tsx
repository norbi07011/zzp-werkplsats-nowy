import React, { useState, useRef } from 'react';
import { Upload, X, ZoomIn, Download, Camera } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';

interface TaskPhoto {
  url: string;
  caption?: string;
  annotations?: string; // JSON string of canvas annotations
  timestamp: string;
  uploaded_by?: string;
}

interface TaskPhotoGalleryProps {
  taskId: string;
  photos: TaskPhoto[];
  onPhotosChange: (photos: TaskPhoto[]) => void;
  maxPhotos?: number;
  showBeforeAfter?: boolean;
  beforePhotos?: TaskPhoto[];
  afterPhotos?: TaskPhoto[];
  onBeforePhotosChange?: (photos: TaskPhoto[]) => void;
  onAfterPhotosChange?: (photos: TaskPhoto[]) => void;
}

export function TaskPhotoGallery({
  taskId,
  photos,
  onPhotosChange,
  maxPhotos = 20,
  showBeforeAfter = false,
  beforePhotos = [],
  afterPhotos = [],
  onBeforePhotosChange,
  onAfterPhotosChange
}: TaskPhotoGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<TaskPhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'before' | 'after'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File, type: 'all' | 'before' | 'after' = 'all') => {
    try {
      setUploading(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `task-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      // Create photo object
      const newPhoto: TaskPhoto = {
        url: publicUrl,
        caption: caption || file.name,
        timestamp: new Date().toISOString(),
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      };

      // Add to appropriate array
      if (type === 'before' && onBeforePhotosChange) {
        onBeforePhotosChange([...beforePhotos, newPhoto]);
      } else if (type === 'after' && onAfterPhotosChange) {
        onAfterPhotosChange([...afterPhotos, newPhoto]);
      } else {
        onPhotosChange([...photos, newPhoto]);
      }

      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert('Błąd podczas przesyłania zdjęcia: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Proszę wybrać plik obrazu');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Plik jest za duży. Maksymalny rozmiar: 5MB');
      return;
    }

    // Check max photos limit
    const currentCount = showBeforeAfter 
      ? (activeTab === 'before' ? beforePhotos.length : activeTab === 'after' ? afterPhotos.length : photos.length)
      : photos.length;

    if (currentCount >= maxPhotos) {
      alert(`Maksymalna liczba zdjęć: ${maxPhotos}`);
      return;
    }

    uploadPhoto(file, activeTab);
  };

  const removePhoto = (index: number, type: 'all' | 'before' | 'after' = 'all') => {
    if (!confirm('Czy na pewno usunąć to zdjęcie?')) return;

    if (type === 'before' && onBeforePhotosChange) {
      const updated = beforePhotos.filter((_, i) => i !== index);
      onBeforePhotosChange(updated);
    } else if (type === 'after' && onAfterPhotosChange) {
      const updated = afterPhotos.filter((_, i) => i !== index);
      onAfterPhotosChange(updated);
    } else {
      const updated = photos.filter((_, i) => i !== index);
      onPhotosChange(updated);
    }
  };

  const getCurrentPhotos = () => {
    if (!showBeforeAfter) return photos;
    if (activeTab === 'before') return beforePhotos;
    if (activeTab === 'after') return afterPhotos;
    return photos;
  };

  const currentPhotos = getCurrentPhotos();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Galeria zdjęć
          <span className="text-sm font-normal text-gray-500">
            ({currentPhotos.length}/{maxPhotos})
          </span>
        </h3>
      </div>

      {/* Before/After Tabs */}
      {showBeforeAfter && (
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Wszystkie ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('before')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'before'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Przed ({beforePhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('after')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'after'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Po ({afterPhotos.length})
          </button>
        </div>
      )}

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading || currentPhotos.length >= maxPhotos}
          className="hidden"
          id="photo-upload"
        />
        
        <div className="text-center">
          <label
            htmlFor="photo-upload"
            className={`cursor-pointer inline-flex flex-col items-center ${
              uploading || currentPhotos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-sm font-medium text-gray-700">
              {uploading ? 'Przesyłanie...' : 'Kliknij aby dodać zdjęcie'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              PNG, JPG, WEBP do 5MB
            </span>
          </label>

          {/* Caption input */}
          <div className="mt-4 max-w-xs mx-auto">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Opcjonalny opis zdjęcia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      {currentPhotos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentPhotos.map((photo, index) => (
            <div
              key={index}
              className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="aspect-square relative">
                <img
                  src={photo.url}
                  alt={photo.caption || 'Zdjęcie zadania'}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full hover:bg-gray-100 transition-opacity"
                    title="Powiększ"
                  >
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                  </button>
                  <a
                    href={photo.url}
                    download
                    className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full hover:bg-gray-100 transition-opacity"
                    title="Pobierz"
                  >
                    <Download className="w-5 h-5 text-gray-700" />
                  </a>
                  <button
                    onClick={() => removePhoto(index, activeTab)}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-opacity"
                    title="Usuń"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Caption */}
              {photo.caption && (
                <div className="p-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-700 truncate" title={photo.caption}>
                    {photo.caption}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(photo.timestamp).toLocaleDateString('pl-PL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {currentPhotos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Camera className="w-16 h-16 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">
            Brak zdjęć{showBeforeAfter && activeTab !== 'all' ? ` w kategorii "${activeTab === 'before' ? 'Przed' : 'Po'}"` : ''}
          </p>
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-100 border-b flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedPhoto.caption}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedPhoto.timestamp).toLocaleString('pl-PL')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 max-h-[80vh] overflow-auto">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || 'Zdjęcie'}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
