// Простая реализация локализации для MVP
export type AppLanguage = 'ru' | 'uz' | 'en';

type Dictionary = {
  [key: string]: string;
};

const dictionaries: Record<AppLanguage, Dictionary> = {
  ru: {
    // Auth
    'login.title': 'Sparks UZ',
    'login.welcome': 'С возвращением!',
    'login.find_match': 'Найди свою половину',
    'login.register': 'Создать аккаунт',
    'login.login': 'Войти',
    'login.already': 'Уже есть аккаунт?',
    'login.not_registered': 'Нет аккаунта?',
    'login.email': 'Email',
    'login.password': 'Пароль (мин. 8 символов)',
    'login.name': 'Ваше имя',
    
    // Onboarding
    'onboard.title': 'Давай познакомимся!',
    'onboard.sub': 'Заполни профиль, чтобы начать общаться',
    'onboard.gender': 'Я...',
    'onboard.male': 'Парень',
    'onboard.female': 'Девушка',
    'onboard.birth': 'Дата рождения',
    'onboard.city': 'Город',
    'onboard.next': 'Продолжить',
    'onboard.finish': 'Начать!',
    
    // Discover
    'discover.empty': 'На сегодня всё!',
    'discover.empty_sub': 'Заходи позже, чтобы увидеть новые лица',
    'discover.its_match': 'MATCH!',
    'discover.match_sub': 'Вы понравились друг другу',
    'discover.send_msg': 'Написать сообщение',
    'discover.continue': 'Продолжить поиск',
    
    // Profile
    'profile.title': 'Профиль',
    'profile.edit': 'Редактировать профиль',
    'profile.photos': 'Мои фотографии',
    'profile.settings': 'Настройки приложения',
    'profile.logout': 'Выйти из аккаунта',
    'profile.likes': 'Лайки',
    'profile.matches': 'Пары',
    
    // Edit
    'edit.title': 'Редактирование',
    'edit.ready': 'Готово',
    'edit.lang': 'Язык приложения',
    'edit.bio': 'О себе',
    'edit.bio_placeholder': 'Расскажите о себе...',
    'edit.city': 'Город',
    'edit.goal': 'Цель знакомства',
    'edit.goal.friend': 'Дружба',
    'edit.goal.rel': 'Отношения',
    'edit.goal.family': 'Семья',
    'edit.looking_for': 'Кого вы ищете?',
    'edit.look.guys': 'Парней',
    'edit.look.girls': 'Девушек',
    'edit.age': 'Возраст',
    'edit.privacy': 'Приватность фото',
    'edit.privacy_sub': 'Твои фото будут размыты для других пользователей, пока ты не поставишь им лайк.',
    
    // Photos
    'photos.title': 'Фотографии',
    'photos.sub': 'Добавь лучшие фото, чтобы получать больше симпатий. (Максимум 6)',
    'photos.add': 'Добавить',
    
    // Matches
    'matches.title': 'Сообщения',
    'matches.new': 'Новые пары',
    'matches.chats': 'Сообщения',
    'matches.no_chats': 'Пока нет сообщений',
    'matches.vip': 'Узнай, кому ты нравишься!',
    'matches.vip_btn': 'Получить VIP',
    
    // Settings
    'settings.title': 'Настройки',
    'settings.notif': 'Уведомления',
    'settings.notif.msg': 'Новые сообщения',
    'settings.notif.likes': 'Новые лайки и совпадения',
    'settings.sec': 'Безопасность и Помощь',
    'settings.sec.priv': 'Безопасность и Приватность',
    'settings.sec.help': 'Помощь и Поддержка',
    'settings.sec.terms': 'Пользовательское соглашение',
    'settings.about': 'О приложении',
    'settings.acc': 'Аккаунт',
    'settings.logout': 'Выйти',
    'settings.delete': 'Удалить аккаунт',
  },
  uz: {
    // Auth
    'login.title': 'Sparks UZ',
    'login.welcome': 'Xush kelibsiz!',
    'login.find_match': 'O\'z juftingizni toping',
    'login.register': 'Ro\'yxatdan o\'tish',
    'login.login': 'Kirish',
    'login.already': 'Akkauntingiz bormi?',
    'login.not_registered': 'Akkauntingiz yo\'qmi?',
    'login.email': 'Email',
    'login.password': 'Parol (min. 8 belgi)',
    'login.name': 'Ismingiz',
    
    // Onboarding
    'onboard.title': 'Keling, tanishamiz!',
    'onboard.sub': 'Muloqotni boshlash uchun profilni to\'ldiring',
    'onboard.gender': 'Men...',
    'onboard.male': 'Yigit',
    'onboard.female': 'Qiz',
    'onboard.birth': 'Tug\'ilgan sana',
    'onboard.city': 'Shahar',
    'onboard.next': 'Davom etish',
    'onboard.finish': 'Boshlash!',
    
    // Discover
    'discover.empty': 'Bugunga shuncha!',
    'discover.empty_sub': 'Yangi odamlarni ko\'rish uchun keyinroq kiring',
    'discover.its_match': 'MATCH!',
    'discover.match_sub': 'Siz bir-biringizga yoqdingiz',
    'discover.send_msg': 'Xabar yozish',
    'discover.continue': 'Izlashda davom etish',
    
    // Profile
    'profile.title': 'Profil',
    'profile.edit': 'Profilni tahrirlash',
    'profile.photos': 'Mening rasmlarim',
    'profile.settings': 'Ilova sozlamalari',
    'profile.logout': 'Chiqish',
    'profile.likes': 'Layklar',
    'profile.matches': 'Juftliklar',
    
    // Edit
    'edit.title': 'Tahrirlash',
    'edit.ready': 'Tayyor',
    'edit.lang': 'Ilova tili',
    'edit.bio': 'O\'zingiz haqida',
    'edit.bio_placeholder': 'O\'zingiz haqingizda gapirib bering...',
    'edit.city': 'Shahar',
    'edit.goal': 'Maqsad',
    'edit.goal.friend': 'Do\'stlik',
    'edit.goal.rel': 'Munosabatlar',
    'edit.goal.family': 'Oila',
    'edit.looking_for': 'Kimni izlayapsiz?',
    'edit.look.guys': 'Yigitlarni',
    'edit.look.girls': 'Qizlarni',
    'edit.age': 'Yosh',
    'edit.privacy': 'Rasmlar maxfiyligi',
    'edit.privacy_sub': 'Siz ularga layk bosmaguningizcha rasmlaringiz boshqalar uchun xiralashgan bo\'ladi.',
    
    // Photos
    'photos.title': 'Rasmlar',
    'photos.sub': 'Ko\'proq layk olish uchun eng yaxshi rasmlaringizni qo\'shing. (Maksimum 6)',
    'photos.add': 'Qo\'shish',
    
    // Matches
    'matches.title': 'Xabarlar',
    'matches.new': 'Yangi juftliklar',
    'matches.chats': 'Xabarlar',
    'matches.no_chats': 'Hozircha xabarlar yo\'q',
    'matches.vip': 'Siz kimga yoqishingizni bilib oling!',
    'matches.vip_btn': 'VIP olish',
    
    // Settings
    'settings.title': 'Sozlamalar',
    'settings.notif': 'Xabarnomalar',
    'settings.notif.msg': 'Yangi xabarlar',
    'settings.notif.likes': 'Yangi layklar va juftliklar',
    'settings.sec': 'Xavfsizlik va Yordam',
    'settings.sec.priv': 'Xavfsizlik va Maxfiylik',
    'settings.sec.help': 'Yordam va Qo\'llab-quvvatlash',
    'settings.sec.terms': 'Foydalanish shartlari',
    'settings.about': 'Ilova haqida',
    'settings.acc': 'Akkaunt',
    'settings.logout': 'Chiqish',
    'settings.delete': 'Akkauntni o\'chirish',
  },
  en: {
    // Auth
    'login.title': 'Sparks UZ',
    'login.welcome': 'Welcome back!',
    'login.find_match': 'Find your soulmate',
    'login.register': 'Create account',
    'login.login': 'Log in',
    'login.already': 'Already have an account?',
    'login.not_registered': 'Don\'t have an account?',
    'login.email': 'Email',
    'login.password': 'Password (min. 8 chars)',
    'login.name': 'Your name',
    
    // Onboarding
    'onboard.title': 'Let\'s get to know you!',
    'onboard.sub': 'Fill out your profile to start chatting',
    'onboard.gender': 'I am a...',
    'onboard.male': 'Guy',
    'onboard.female': 'Girl',
    'onboard.birth': 'Date of Birth',
    'onboard.city': 'City',
    'onboard.next': 'Continue',
    'onboard.finish': 'Start!',
    
    // Discover
    'discover.empty': 'That\'s it for today!',
    'discover.empty_sub': 'Come back later to see new faces',
    'discover.its_match': 'MATCH!',
    'discover.match_sub': 'You liked each other',
    'discover.send_msg': 'Send a message',
    'discover.continue': 'Keep swiping',
    
    // Profile
    'profile.title': 'Profile',
    'profile.edit': 'Edit profile',
    'profile.photos': 'My photos',
    'profile.settings': 'App settings',
    'profile.logout': 'Log out',
    'profile.likes': 'Likes',
    'profile.matches': 'Matches',
    
    // Edit
    'edit.title': 'Edit Profile',
    'edit.ready': 'Done',
    'edit.lang': 'App Language',
    'edit.bio': 'About me',
    'edit.bio_placeholder': 'Tell us about yourself...',
    'edit.city': 'City',
    'edit.goal': 'Dating Goal',
    'edit.goal.friend': 'Friendship',
    'edit.goal.rel': 'Relationship',
    'edit.goal.family': 'Marriage',
    'edit.looking_for': 'Who are you looking for?',
    'edit.look.guys': 'Guys',
    'edit.look.girls': 'Girls',
    'edit.age': 'Age',
    'edit.privacy': 'Photo Privacy',
    'edit.privacy_sub': 'Your photos will be blurred for other users until you like them back.',
    
    // Photos
    'photos.title': 'Photos',
    'photos.sub': 'Add your best photos to get more likes. (Max 6)',
    'photos.add': 'Add photo',
    
    // Matches
    'matches.title': 'Messages',
    'matches.new': 'New Matches',
    'matches.chats': 'Messages',
    'matches.no_chats': 'No messages yet',
    'matches.vip': 'Find out who likes you!',
    'matches.vip_btn': 'Get VIP',
    
    // Settings
    'settings.title': 'Settings',
    'settings.notif': 'Notifications',
    'settings.notif.msg': 'New messages',
    'settings.notif.likes': 'New likes & matches',
    'settings.sec': 'Security & Help',
    'settings.sec.priv': 'Security & Privacy',
    'settings.sec.help': 'Help & Support',
    'settings.sec.terms': 'Terms of Service',
    'settings.about': 'About',
    'settings.acc': 'Account',
    'settings.logout': 'Log out',
    'settings.delete': 'Delete account',
  }
};

// Функция перевода
export function t(key: string, lang: string = 'ru'): string {
  const safeLang = (dictionaries[lang as AppLanguage] ? lang : 'ru') as AppLanguage;
  return dictionaries[safeLang][key] || key;
}

export const setAppLanguage = (lang: AppLanguage) => {
  localStorage.setItem('appLang', lang);
  window.dispatchEvent(new Event('languageChange'));
};

// Хук для компонентов
import { useState, useEffect } from 'react';

export function useTranslation() {
  const [lang, setLang] = useState<AppLanguage>('ru');

  useEffect(() => {
    const loadLang = () => {
      const saved = localStorage.getItem('appLang') as AppLanguage;
      if (saved && dictionaries[saved]) {
        setLang(saved);
      }
    };
    
    loadLang();
    window.addEventListener('languageChange', loadLang);
    return () => window.removeEventListener('languageChange', loadLang);
  }, []);

  const translate = (key: string) => t(key, lang);

  return { t: translate, lang };
}
