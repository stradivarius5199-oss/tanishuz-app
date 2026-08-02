'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

const GOOGLE_CLIENT_ID = '387281742438-8lqihf77fcekb4mqtis76tdcfu8npll1.apps.googleusercontent.com';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { login } = useAuthStore();
  const { t } = useTranslation();
  const router = useRouter();

  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleCredential = async (idToken: string) => {
    setGoogleLoading(true);
    setError('');
    try {
      const data = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });
      login(data.accessToken, data.refreshToken, data.user);
      if (!data.user.profile?.isComplete) {
        router.push('/onboarding');
      } else {
        router.push('/discover');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ошибка авторизации Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    // Загружаем Google Identity Services SDK
    const scriptId = 'google-gsi-script';
    const load = () => {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleBtn();
      document.head.appendChild(script);
    };
    if (!document.getElementById(scriptId)) {
      load();
    } else if ((window as any).google) {
      initGoogleBtn();
    }

    // Слушаем токен из redirect-ответа (для Android WebView)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('google_token');
    if (token) {
      handleGoogleCredential(token);
      // Убираем параметр из URL
      const url = new URL(window.location.href);
      url.searchParams.delete('google_token');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const initGoogleBtn = () => {
    const google = (window as any).google;
    if (!google || !googleBtnRef.current) return;
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res: any) => handleGoogleCredential(res.credential),
      ux_mode: 'popup',
    });
    google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      width: 340,
      text: 'continue_with',
      locale: 'ru',
    });
  };

  const handleGoogleLogin = () => {
    // Используем OAuth2 redirect — работает в Android WebView
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/callback');
    const scope = encodeURIComponent('openid email profile');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=select_account`;
    window.location.href = url;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };

      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Сохраняем в Zustand
      login(data.accessToken, data.refreshToken, data.user);
      
      // Если профиль не заполнен, редиректим на онбординг, иначе на свайп
      if (!data.user.profile?.isComplete) {
        router.push('/onboarding');
      } else {
        router.push('/discover');
      }

    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 mb-4 shadow-lg shadow-pink-500/30">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-outfit font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
            {t('login.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isLogin ? t('login.welcome') : t('login.find_match')}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 text-sm text-center border border-red-100 dark:border-red-800"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required={!isLogin}
                  placeholder={t('login.name')}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 transition-shadow outline-none text-gray-900 dark:text-white"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              required
              placeholder={t('login.email')}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 transition-shadow outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              required
              minLength={8}
              placeholder={t('login.password')}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 transition-shadow outline-none text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-2xl py-4 font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? t('login.login') : t('login.register')}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Или</span>
            </div>
          </div>
          
          {/* Google GSI rendered button — official Google button */}
          <div className="mt-4 flex justify-center" ref={googleBtnRef}></div>

          {/* Fallback button if GSI hasn't loaded yet */}
          {googleLoading && (
            <div className="mt-2 w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin"></div>
              Входим через Google...
            </div>
          )}
        </div>


        <div className="mt-8 text-center text-sm">
          <p className="text-gray-500 dark:text-gray-400">
            {isLogin ? t('login.not_registered') : t('login.already')}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-pink-500 font-semibold hover:text-pink-600 transition-colors"
            >
              {isLogin ? t('login.register') : t('login.login')}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
