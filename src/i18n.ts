import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh-CN.json'
import ja from './locales/ja-JP.json'
import us from './locales/en-US.json'
import gb from './locales/en-GB.json'
import fr from './locales/fr-FR.json'
void i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zh },
    'ja-JP': { translation: ja },
    'en-US': { translation: us },
    'en-GB': { translation: gb },
    'fr-FR': { translation: fr },
  },
  lng: 'zh-CN',
  fallbackLng: 'en-US',
  keySeparator: false,
  interpolation: { escapeValue: false },
})
export default i18n
