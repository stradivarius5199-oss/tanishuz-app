'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Heart, Camera, Loader2, MapPin } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/lib/i18n';

const CITIES = ['Ташкент', 'Самарканд', 'Бухара', 'Фергана', 'Навои', 'Андижан', 'Нукус'];

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, setUser } = useAuthStore();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    gender: '',
    birthDate: '',
    city: '',
    goal: '',
    bioRu: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      await apiFetch('/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });

      if (photo) {
        const photoData = new FormData();
        photoData.append('file', photo);
        await apiFetch('/upload/photo', {
          method: 'POST',
          body: photoData,
          headers: {}, // fetch automatically sets multipart/form-data with boundary
        });
      }

      // Обновляем юзера
      const meData = await apiFetch('/auth/me');
      if (meData.user) {
        setUser(meData.user);
      }

      router.push('/discover');
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения профиля');
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col p-4">
      <div className="w-full max-w-md mx-auto pt-8">
        <div className="flex gap-2 h-2 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-full transition-colors ${i <= step ? 'bg-pink-500' : 'bg-gray-200 dark:bg-gray-800'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col flex-1"
          >
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6 font-medium">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('onboard.gender')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormData({...formData, gender: 'MALE'})}
                      className={`py-4 rounded-2xl border-2 font-semibold transition-all ${formData.gender === 'MALE' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                    >
                      {t('onboard.male')}
                    </button>
                    <button
                      onClick={() => setFormData({...formData, gender: 'FEMALE'})}
                      className={`py-4 rounded-2xl border-2 font-semibold transition-all ${formData.gender === 'FEMALE' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                    >
                      {t('onboard.female')}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('onboard.birth')}</label>
                  <input
                    type="date"
                    value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setFormData({...formData, birthDate: ''});
                      } else {
                        setFormData({...formData, birthDate: new Date(val).toISOString()});
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('onboard.city')}</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-4 font-semibold text-gray-900 dark:text-white outline-none focus:border-pink-500 appearance-none transition-colors"
                  >
                    <option value="">Выберите город</option>
                    {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                </div>
                <h1 className="text-3xl font-bold font-outfit mb-2">{t('onboard.title')}</h1>
                <p className="text-gray-500">{t('onboard.sub')}</p>
                <div className="space-y-3">
                  {[
                    { id: 'MARRIAGE', label: t('edit.goal.family'), desc: 'Ищу спутника жизни' },
                    { id: 'RELATIONSHIP', label: t('edit.goal.rel'), desc: 'Долгие отношения' },
                    { id: 'FRIENDSHIP', label: t('edit.goal.friend'), desc: 'Общение и дружба' },
                  ].map(g => (
                    <button
                      key={g.id}
                      onClick={() => setFormData({...formData, goal: g.id})}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${formData.goal === g.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <div className="font-semibold">{g.label}</div>
                      <div className="text-sm text-gray-500">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">{t('edit.bio')}</h2>
                <textarea
                  placeholder={t('edit.bio_placeholder')}
                  rows={5}
                  value={formData.bioRu}
                  onChange={(e) => setFormData({...formData, bioRu: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 text-center">
                <h2 className="text-2xl font-bold">{t('photos.title')}</h2>
                <label className="relative block w-48 h-64 mx-auto rounded-3xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800">
                      <Camera className="w-10 h-10 mb-2" />
                      <span className="text-sm">{t('photos.add')}</span>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
            )}

            <div className="flex gap-4 mt-10">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              {step < 5 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 rounded-2xl"
                >
                  {t('onboard.next')}
                  <ArrowRight className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={loading || !photoPreview}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 rounded-2xl disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('onboard.finish')}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
