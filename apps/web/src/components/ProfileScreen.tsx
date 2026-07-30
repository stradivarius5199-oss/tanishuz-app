'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Edit3, Image as ImageIcon, Settings, LogOut, Heart, MessageCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Avatar from './Avatar';
import { useTranslation } from '@/lib/i18n';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const { logout } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiFetch('/profiles/me');
      setProfile(data.profile);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!profile) return null;

  const age = new Date().getFullYear() - new Date(profile.birthDate).getFullYear();
  const mainPhoto = profile.photos.find((p: any) => p.isMain)?.url || profile.photos[0]?.url || 'https://via.placeholder.com/300';

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col pb-safe">
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <button onClick={() => router.push('/discover')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">{t('profile.title')}</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* Аватар и Инфо */}
        <div className="bg-white dark:bg-gray-900 pt-4 pb-8 px-4 flex flex-col items-center border-b border-gray-100 dark:border-gray-800">
          <div className="relative w-32 h-32 mb-4">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-pink-500 p-1">
              <Avatar 
                src={mainPhoto !== 'https://via.placeholder.com/300' ? mainPhoto : undefined} 
                name={profile.name} 
                className="w-full h-full rounded-full" 
              />
            </div>
            <button 
              onClick={() => router.push('/profile/photos')}
              className="absolute bottom-0 right-0 p-2 bg-gradient-to-tr from-pink-500 to-orange-400 text-white rounded-full shadow-lg"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-2xl font-bold">{profile.name}, {age}</h2>
          <p className="text-gray-500 mt-1">{profile.profession || 'Студент'}</p>
        </div>

        {/* Статистика */}
        <div className="flex bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 py-4 flex flex-col items-center border-r border-gray-100 dark:border-gray-800">
            <Heart className="w-6 h-6 text-pink-500 mb-1" />
            <span className="text-xl font-bold">{profile.likesCount || 0}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{t('profile.likes')}</span>
          </div>
          <div className="flex-1 py-4 flex flex-col items-center">
            <MessageCircle className="w-6 h-6 text-blue-500 mb-1" />
            <span className="text-xl font-bold">{profile.matchesCount || 0}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{t('profile.matches')}</span>
          </div>
        </div>

        {/* Навигация */}
        <div className="p-4 space-y-3 mt-4">
          <button 
            onClick={() => router.push('/profile/edit')}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:ring-2 hover:ring-pink-500 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-500 rounded-xl">
                <Edit3 className="w-6 h-6" />
              </div>
              <span className="font-semibold">{t('profile.edit')}</span>
            </div>
          </button>

          <button 
            onClick={() => router.push('/profile/photos')}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:ring-2 hover:ring-purple-500 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-500 rounded-xl">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="font-semibold">{t('profile.photos')}</span>
            </div>
          </button>

          <button 
            onClick={() => router.push('/profile/settings')}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:ring-2 hover:ring-gray-300 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl">
                <Settings className="w-6 h-6" />
              </div>
              <span className="font-semibold">{t('profile.settings')}</span>
            </div>
            <ChevronLeft className="w-5 h-5 rotate-180 text-gray-400" />
          </button>

          {/* Кнопка выхода перенесена в Настройки, но оставим здесь для удобства */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm mt-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-xl">
                <LogOut className="w-6 h-6" />
              </div>
              <span className="font-semibold text-red-500">{t('profile.logout')}</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
