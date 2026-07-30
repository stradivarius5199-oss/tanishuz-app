'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { setAppLanguage, AppLanguage, useTranslation } from '@/lib/i18n';

export default function EditProfileScreen() {
  const [formData, setFormData] = useState({
    bioRu: '',
    city: '',
    goal: '',
    searchGender: '',
    searchAgeMin: 18,
    searchAgeMax: 50,
    blurPhotos: false,
    language: 'ru', // local setting
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiFetch('/profiles/me');
      const p = data.profile;
      setFormData({
        bioRu: p.bioRu || '',
        city: p.city || '',
        goal: p.goal || 'RELATIONSHIP',
        searchGender: p.searchGender || 'FEMALE',
        searchAgeMin: p.searchAgeMin || 18,
        searchAgeMax: p.searchAgeMax || 50,
        blurPhotos: p.blurPhotos || false,
        language: localStorage.getItem('appLang') || 'ru',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      setAppLanguage(formData.language as AppLanguage);
      
      await apiFetch('/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify({
          bioRu: formData.bioRu,
          city: formData.city,
          goal: formData.goal,
          searchGender: formData.searchGender,
          searchAgeMin: formData.searchAgeMin,
          searchAgeMax: formData.searchAgeMax,
          blurPhotos: formData.blurPhotos,
        }),
      });
      router.back();
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
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
        <h1 className="text-lg font-bold">{t('edit.title')}</h1>
        <button onClick={handleSave} disabled={saving} className="p-2 -mr-2 text-pink-500 font-semibold disabled:opacity-50">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : t('edit.ready')}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('edit.lang')}</label>
          <select 
            value={formData.language}
            onChange={(e) => setFormData({...formData, language: e.target.value})}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none"
          >
            <option value="ru">Русский</option>
            <option value="uz">O'zbekcha</option>
            <option value="en">English</option>
          </select>
        </section>

        <section>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('edit.bio')}</label>
          <textarea 
            value={formData.bioRu}
            onChange={(e) => setFormData({...formData, bioRu: e.target.value})}
            placeholder={t('edit.bio_placeholder')}
            rows={4}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none resize-none"
          />
        </section>

        <section>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('edit.city')}</label>
          <input 
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none"
          />
        </section>

        <section>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('edit.goal')}</label>
          <div className="grid grid-cols-1 gap-2">
            {['FRIENDSHIP', 'RELATIONSHIP', 'MARRIAGE'].map(goal => (
              <label key={goal} className={`flex items-center p-3 rounded-2xl border cursor-pointer transition-colors ${formData.goal === goal ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <input type="radio" name="goal" value={goal} checked={formData.goal === goal} onChange={() => setFormData({...formData, goal})} className="hidden" />
                <span className={`flex-1 text-sm ${formData.goal === goal ? 'font-semibold text-pink-600 dark:text-pink-400' : ''}`}>
                  {goal === 'FRIENDSHIP' ? t('edit.goal.friend') : goal === 'RELATIONSHIP' ? t('edit.goal.rel') : t('edit.goal.family')}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('edit.looking_for')}</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setFormData({...formData, searchGender: 'MALE'})}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${formData.searchGender === 'MALE' ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              {t('edit.look.guys')}
            </button>
            <button 
              onClick={() => setFormData({...formData, searchGender: 'FEMALE'})}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${formData.searchGender === 'FEMALE' ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              {t('edit.look.girls')}
            </button>
          </div>
        </section>

        <section>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('edit.age')} ({formData.searchAgeMin} - {formData.searchAgeMax})</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="18" max="80" 
              value={formData.searchAgeMin}
              onChange={(e) => setFormData({...formData, searchAgeMin: Math.min(Number(e.target.value), formData.searchAgeMax)})}
              className="w-full accent-pink-500"
            />
            <input 
              type="range" 
              min="18" max="80" 
              value={formData.searchAgeMax}
              onChange={(e) => setFormData({...formData, searchAgeMax: Math.max(Number(e.target.value), formData.searchAgeMin)})}
              className="w-full accent-pink-500"
            />
          </div>
        </section>

        <section className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{t('edit.privacy')}</h3>
              <p className="text-xs text-gray-500 mt-1 pr-4">{t('edit.privacy_sub')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" checked={formData.blurPhotos} onChange={(e) => setFormData({...formData, blurPhotos: e.target.checked})} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-500"></div>
            </label>
          </div>
        </section>
      </main>
    </div>
  );
}
