'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, Shield, HeartHandshake } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <header className="p-4 flex items-center gap-4 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">{t('settings.about')}</h1>
      </header>

      <main className="p-6 max-w-2xl mx-auto w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-orange-400 items-center justify-center shadow-lg shadow-pink-500/20 mb-4 text-white font-outfit font-bold text-2xl">
            T
          </div>
          <h2 className="text-2xl font-bold font-outfit mb-2">Tanishuz</h2>
          <p className="text-gray-500">Версия 0.1.0 (MVP)</p>
        </div>

        <section className="space-y-4">
          <div className="flex items-start gap-4 p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">О приложении</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tanishuz — это кросс-платформенное приложение для знакомств, созданное специально для Узбекистана. Наша цель — помочь людям найти свою вторую половинку с уважением к традициям и семейным ценностям.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Модерация и безопасность</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Мы строго следим за соблюдением правил. В приложении запрещена публикация неподобающего контента. Пожалуйста, будьте вежливы друг с другом. Нарушители будут навсегда заблокированы.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Политика конфиденциальности</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Ваши данные надежно защищены. Мы не передаем личные сообщения и скрытые фото третьим лицам.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
