import { Language, LanguageCode } from '../types';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import ml from '../locales/ml.json';
import kn from '../locales/kn.json';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

const translations: Record<LanguageCode, Record<string, string>> = {
  en,
  hi,
  ta,
  te,
  ml,
  kn,
};

let currentLanguage: LanguageCode = 'en';

export const getLanguage = (): LanguageCode => currentLanguage;

export const setLanguage = (lang: LanguageCode) => {
  currentLanguage = lang;
  try {
    localStorage.setItem('rurallearn_language', lang);
  } catch (e) {
    // Ignore in private mode
  }
};

export const initLanguage = (): LanguageCode => {
  try {
    const saved = localStorage.getItem('rurallearn_language') as LanguageCode;
    if (saved && translations[saved]) {
      currentLanguage = saved;
    }
  } catch (e) {
    // Ignore
  }
  return currentLanguage;
};

export const t = (key: string, fallback?: string): string => {
  const dict = translations[currentLanguage] || translations.en;
  return dict[key] || translations.en[key] || fallback || key;
};

export const getSpeechLocale = (lang: LanguageCode): string => {
  switch (lang) {
    case 'hi':
      return 'hi-IN';
    case 'ta':
      return 'ta-IN';
    case 'te':
      return 'te-IN';
    case 'ml':
      return 'ml-IN';
    case 'kn':
      return 'kn-IN';
    default:
      return 'en-IN';
  }
};
