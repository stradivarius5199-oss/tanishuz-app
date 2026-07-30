'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Bell, Shield, HelpCircle, FileText, LogOut, Trash2, Heart, Info } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/lib/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { t } = useTranslation();
  
  const [notifMsg, setNotifMsg] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);

  useEffect(() => {
    const savedMsg = localStorage.getItem('notifMsg');
    const savedLikes = localStorage.getItem('notifLikes');
    if (savedMsg !== null) setNotifMsg(savedMsg === 'true');
    if (savedLikes !== null) setNotifLikes(savedLikes === 'true');
  }, []);

  const handleToggleMsg = (val: boolean) => {
    setNotifMsg(val);
    localStorage.setItem('notifMsg', String(val));
  };

  const handleToggleLikes = (val: boolean) => {
    setNotifLikes(val);
    localStorage.setItem('notifLikes', String(val));
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleDeleteAccount = () => {
    if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
      // Здесь должен быть вызов API удаления, пока мокаем
      alert('Аккаунт удален');
      logout();
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col pb-safe">
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">{t('settings.title')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">{t('settings.notif')}</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-500" />
                <span>{t('settings.notif.msg')}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={notifLikes} onChange={(e) => handleToggleLikes(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-gray-500" />
                <span>{t('settings.notif.likes')}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">{t('settings.sec')}</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <span>{t('settings.sec.priv')}</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-500" />
                <span>{t('settings.sec.help')}</span>
              </div>
            </button>
            <button 
              onClick={() => router.push('/about')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-500" />
                </div>
                <span>{t('settings.about')}</span>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">{t('settings.acc')}</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left text-gray-900 dark:text-white">
              <LogOut className="w-5 h-5 text-gray-500" />
              <span>{t('profile.logout')}</span>
            </button>
            <button onClick={handleDeleteAccount} className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left text-red-500">
              <Trash2 className="w-5 h-5" />
              <span>{t('settings.delete')}</span>
            </button>
          </div>
        </section>

        {user?.isAdmin && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider px-2">Админ</h2>
            <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => router.push('/admin')}
                className="w-full flex items-center justify-between p-4 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors text-left text-pink-500"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  <span>Панель Управления</span>
                </div>
                <ChevronLeft className="w-5 h-5 opacity-50 rotate-180" />
              </button>
            </div>
          </section>
        )}

        <div className="text-center pb-8 pt-4">
          <p className="text-xs text-gray-400">Tanishuz v0.1.0</p>
        </div>

      </main>
    </div>
  );
}
