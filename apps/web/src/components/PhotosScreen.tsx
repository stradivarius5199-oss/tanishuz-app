'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, Trash2, Star, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiFetch('/profiles/me');
      setPhotos(data.profile.photos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (photos.length >= 6) {
      alert('Максимум 6 фотографий');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await apiFetch('/upload/photo', {
        method: 'POST',
        body: formData
      });
      
      setPhotos(prev => [...prev, data.photo]);
    } catch (err) {
      console.error(err);
      alert('Не удалось загрузить фото');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Удалить фото?')) return;
    try {
      await apiFetch(`/upload/photo/${photoId}`, { method: 'DELETE' });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetMain = async (photoId: string) => {
    try {
      await apiFetch(`/upload/photo/${photoId}/main`, { method: 'PUT' });
      setPhotos(prev => prev.map(p => ({ ...p, isMain: p.id === photoId })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col pb-safe">
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">{t('photos.title')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-gray-500 mb-4 text-center">
          {t('photos.sub')}
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group">
              <img src={photo.url} alt="Photo" className="w-full h-full object-cover" />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <button 
                  onClick={() => handleSetMain(photo.id)}
                  className={`self-start p-1.5 rounded-full backdrop-blur-md ${photo.isMain ? 'bg-yellow-400 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                  title="Сделать главной"
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
                
                <button 
                  onClick={() => handleDelete(photo.id)}
                  className="self-end p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-500 backdrop-blur-md"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {photo.isMain && (
                <div className="absolute bottom-2 left-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  ГЛАВНАЯ
                </div>
              )}
            </div>
          ))}

          {/* Add Photo Button */}
          {photos.length < 6 && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-[3/4] bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              ) : (
                <>
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm mb-2 text-pink-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">{t('photos.add')}</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
        />
      </main>
    </div>
  );
}
