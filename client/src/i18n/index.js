import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import enPages from './locales/en.pages.json';
import enCatalog from './locales/en.catalog.json';
import enStudent from './locales/en.student.json';
import enAccount from './locales/en.account.json';
import enReader from './locales/en.reader.json';
import enPanels from './locales/en.panels.json';
import enTeacher from './locales/en.teacher.json';
import enTeacher2 from './locales/en.teacher2.json';
import enShared from './locales/en.shared.json';
import enAdmin from './locales/en.admin.json';
import enAdminCourses from './locales/en.adminCourses.json';
import bn from './locales/bn.json';
import bnPages from './locales/bn.pages.json';
import bnCatalog from './locales/bn.catalog.json';
import bnStudent from './locales/bn.student.json';
import bnAccount from './locales/bn.account.json';
import bnReader from './locales/bn.reader.json';
import bnPanels from './locales/bn.panels.json';
import bnTeacher from './locales/bn.teacher.json';
import bnTeacher2 from './locales/bn.teacher2.json';
import bnShared from './locales/bn.shared.json';
import bnAdmin from './locales/bn.admin.json';
import bnAdminCourses from './locales/bn.adminCourses.json';
import ja from './locales/ja.json';
import jaPages from './locales/ja.pages.json';
import jaCatalog from './locales/ja.catalog.json';
import jaStudent from './locales/ja.student.json';
import jaAccount from './locales/ja.account.json';
import jaReader from './locales/ja.reader.json';
import jaPanels from './locales/ja.panels.json';
import jaTeacher from './locales/ja.teacher.json';
import jaTeacher2 from './locales/ja.teacher2.json';
import jaShared from './locales/ja.shared.json';
import jaAdmin from './locales/ja.admin.json';
import jaAdminCourses from './locales/ja.adminCourses.json';
import zh from './locales/zh.json';
import zhPages from './locales/zh.pages.json';
import zhCatalog from './locales/zh.catalog.json';
import zhStudent from './locales/zh.student.json';
import zhAccount from './locales/zh.account.json';
import zhReader from './locales/zh.reader.json';
import zhPanels from './locales/zh.panels.json';
import zhTeacher from './locales/zh.teacher.json';
import zhTeacher2 from './locales/zh.teacher2.json';
import zhShared from './locales/zh.shared.json';
import zhAdmin from './locales/zh.admin.json';
import zhAdminCourses from './locales/zh.adminCourses.json';
import ar from './locales/ar.json';
import arPages from './locales/ar.pages.json';
import arCatalog from './locales/ar.catalog.json';
import arStudent from './locales/ar.student.json';
import arAccount from './locales/ar.account.json';
import arReader from './locales/ar.reader.json';
import arPanels from './locales/ar.panels.json';
import arTeacher from './locales/ar.teacher.json';
import arTeacher2 from './locales/ar.teacher2.json';
import arShared from './locales/ar.shared.json';
import arAdmin from './locales/ar.admin.json';
import arAdminCourses from './locales/ar.adminCourses.json';
import hi from './locales/hi.json';
import hiPages from './locales/hi.pages.json';
import hiCatalog from './locales/hi.catalog.json';
import hiStudent from './locales/hi.student.json';
import hiAccount from './locales/hi.account.json';
import hiReader from './locales/hi.reader.json';
import hiPanels from './locales/hi.panels.json';
import hiTeacher from './locales/hi.teacher.json';
import hiTeacher2 from './locales/hi.teacher2.json';
import hiShared from './locales/hi.shared.json';
import hiAdmin from './locales/hi.admin.json';
import hiAdminCourses from './locales/hi.adminCourses.json';
import ur from './locales/ur.json';
import urPages from './locales/ur.pages.json';
import urCatalog from './locales/ur.catalog.json';
import urStudent from './locales/ur.student.json';
import urAccount from './locales/ur.account.json';
import urReader from './locales/ur.reader.json';
import urPanels from './locales/ur.panels.json';
import urTeacher from './locales/ur.teacher.json';
import urTeacher2 from './locales/ur.teacher2.json';
import urShared from './locales/ur.shared.json';
import urAdmin from './locales/ur.admin.json';
import urAdminCourses from './locales/ur.adminCourses.json';
import enCoursePrice from './locales/en.coursePrice.json';
import bnCoursePrice from './locales/bn.coursePrice.json';
import jaCoursePrice from './locales/ja.coursePrice.json';
import zhCoursePrice from './locales/zh.coursePrice.json';
import arCoursePrice from './locales/ar.coursePrice.json';
import hiCoursePrice from './locales/hi.coursePrice.json';
import urCoursePrice from './locales/ur.coursePrice.json';
import enReport from './locales/en.report.json';
import bnReport from './locales/bn.report.json';
import jaReport from './locales/ja.report.json';
import zhReport from './locales/zh.report.json';
import arReport from './locales/ar.report.json';
import hiReport from './locales/hi.report.json';
import urReport from './locales/ur.report.json';
import enProgress from './locales/en.progress.json';
import bnProgress from './locales/bn.progress.json';
import jaProgress from './locales/ja.progress.json';
import zhProgress from './locales/zh.progress.json';
import arProgress from './locales/ar.progress.json';
import hiProgress from './locales/hi.progress.json';
import urProgress from './locales/ur.progress.json';
import enLessonLang from './locales/en.lessonLang.json';
import bnLessonLang from './locales/bn.lessonLang.json';
import jaLessonLang from './locales/ja.lessonLang.json';
import zhLessonLang from './locales/zh.lessonLang.json';
import arLessonLang from './locales/ar.lessonLang.json';
import hiLessonLang from './locales/hi.lessonLang.json';
import urLessonLang from './locales/ur.lessonLang.json';
import enCash from './locales/en.cash.json';
import bnCash from './locales/bn.cash.json';
import jaCash from './locales/ja.cash.json';
import zhCash from './locales/zh.cash.json';
import arCash from './locales/ar.cash.json';
import hiCash from './locales/hi.cash.json';
import urCash from './locales/ur.cash.json';
import enOrders from './locales/en.orders.json';
import enAdminOrders from './locales/en.adminOrders.json';
import enAdminFinance from './locales/en.adminFinance.json';
import enAuditLog from './locales/en.auditLog.json';
import bnOrders from './locales/bn.orders.json';
import bnAdminOrders from './locales/bn.adminOrders.json';
import bnAdminFinance from './locales/bn.adminFinance.json';
import bnAuditLog from './locales/bn.auditLog.json';
import jaOrders from './locales/ja.orders.json';
import jaAdminOrders from './locales/ja.adminOrders.json';
import jaAdminFinance from './locales/ja.adminFinance.json';
import jaAuditLog from './locales/ja.auditLog.json';
import zhOrders from './locales/zh.orders.json';
import zhAdminOrders from './locales/zh.adminOrders.json';
import zhAdminFinance from './locales/zh.adminFinance.json';
import zhAuditLog from './locales/zh.auditLog.json';
import arOrders from './locales/ar.orders.json';
import arAdminOrders from './locales/ar.adminOrders.json';
import arAdminFinance from './locales/ar.adminFinance.json';
import arAuditLog from './locales/ar.auditLog.json';
import hiOrders from './locales/hi.orders.json';
import hiAdminOrders from './locales/hi.adminOrders.json';
import hiAdminFinance from './locales/hi.adminFinance.json';
import hiAuditLog from './locales/hi.auditLog.json';
import urOrders from './locales/ur.orders.json';
import urAdminOrders from './locales/ur.adminOrders.json';
import urAdminFinance from './locales/ur.adminFinance.json';
import urAuditLog from './locales/ur.auditLog.json';
import enExtras from './locales/en.extras.json';
import bnExtras from './locales/bn.extras.json';
import jaExtras from './locales/ja.extras.json';
import zhExtras from './locales/zh.extras.json';
import arExtras from './locales/ar.extras.json';
import hiExtras from './locales/hi.extras.json';
import urExtras from './locales/ur.extras.json';

// Languages shown in the switcher. dir = text direction (rtl for Arabic and Urdu).
export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'bn', label: 'বাংলা', dir: 'ltr' },
  { code: 'ja', label: '日本語', dir: 'ltr' },
  { code: 'zh', label: '中文', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
];

// Each language = all its locale files (merged)
// Deep merge: two files can share a top-level key (e.g. "student"), and both must survive
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const deepMerge = (...sources) => {
  const out = {};
  for (const src of sources) {
    for (const [key, value] of Object.entries(src)) {
      out[key] = isObj(value) && isObj(out[key]) ? deepMerge(out[key], value) : value;
    }
  }
  return out;
};
const bundle = (...parts) => ({ translation: deepMerge(...parts) });

const STORAGE_KEY = 'deenlearn-lang';
const saved = localStorage.getItem(STORAGE_KEY);

i18n.use(initReactI18next).init({
  resources: {
    en: bundle(en, enPages, enCatalog, enStudent, enAccount, enReader, enPanels, enTeacher, enTeacher2, enShared, enAdmin, enAdminCourses, enCoursePrice, enReport, enProgress, enLessonLang, enCash, enOrders, enAdminOrders, enAdminFinance, enAuditLog, enExtras),
    bn: bundle(bn, bnPages, bnCatalog, bnStudent, bnAccount, bnReader, bnPanels, bnTeacher, bnTeacher2, bnShared, bnAdmin, bnAdminCourses, bnCoursePrice, bnReport, bnProgress, bnLessonLang, bnCash, bnOrders, bnAdminOrders, bnAdminFinance, bnAuditLog, bnExtras),
    ja: bundle(ja, jaPages, jaCatalog, jaStudent, jaAccount, jaReader, jaPanels, jaTeacher, jaTeacher2, jaShared, jaAdmin, jaAdminCourses, jaCoursePrice, jaReport, jaProgress, jaLessonLang, jaCash, jaOrders, jaAdminOrders, jaAdminFinance, jaAuditLog, jaExtras),
    zh: bundle(zh, zhPages, zhCatalog, zhStudent, zhAccount, zhReader, zhPanels, zhTeacher, zhTeacher2, zhShared, zhAdmin, zhAdminCourses, zhCoursePrice, zhReport, zhProgress, zhLessonLang, zhCash, zhOrders, zhAdminOrders, zhAdminFinance, zhAuditLog, zhExtras),
    ar: bundle(ar, arPages, arCatalog, arStudent, arAccount, arReader, arPanels, arTeacher, arTeacher2, arShared, arAdmin, arAdminCourses, arCoursePrice, arReport, arProgress, arLessonLang, arCash, arOrders, arAdminOrders, arAdminFinance, arAuditLog, arExtras),
    hi: bundle(hi, hiPages, hiCatalog, hiStudent, hiAccount, hiReader, hiPanels, hiTeacher, hiTeacher2, hiShared, hiAdmin, hiAdminCourses, hiCoursePrice, hiReport, hiProgress, hiLessonLang, hiCash, hiOrders, hiAdminOrders, hiAdminFinance, hiAuditLog, hiExtras),
    ur: bundle(ur, urPages, urCatalog, urStudent, urAccount, urReader, urPanels, urTeacher, urTeacher2, urShared, urAdmin, urAdminCourses, urCoursePrice, urReport, urProgress, urLessonLang, urCash, urOrders, urAdminOrders, urAdminFinance, urAuditLog, urExtras),
  },
  lng: LANGUAGES.some((l) => l.code === saved) ? saved : 'en', // English by default
  fallbackLng: 'en', // a missing translation shows the English text
  interpolation: { escapeValue: false }, // React already escapes text
});

// Remember the choice, and set <html lang> and direction for the current language
function applyLanguage(lng) {
  const code = lng.split('-')[0];
  const info = LANGUAGES.find((l) => l.code === code);
  document.documentElement.lang = code;
  document.documentElement.dir = info?.dir ?? 'ltr';
  localStorage.setItem(STORAGE_KEY, code);
}
applyLanguage(i18n.language);
i18n.on('languageChanged', applyLanguage);

export default i18n;
