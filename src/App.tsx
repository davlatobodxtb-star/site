/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  User
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { auth, db, storage, isFirebaseConfigured } from './firebase';
import {
  School,
  Baby,
  Building2,
  Lock,
  Mail,
  UserCheck,
  LogOut,
  Plus,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  MapPin,
  Monitor,
  Shield,
  KeyRound,
  FileText,
  X,
  Sparkles,
  ExternalLink,
  Globe,
  Navigation
} from 'lucide-react';

// ==========================================
// Типы данных
// ==========================================
export type Language = 'uz' | 'ru';

export interface ComputerClass {
  id: string;
  name: string; // e.g. "1-informatika xonasi" / "Кабинет №1"
  computersCount: number;
  computersYear: number | null;
}

export interface Region {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  regionId: string;
}

export interface Institution {
  id: string;
  type: 'school' | 'kindergarten';
  districtId: string;
  number: string;
  location: string;
  googleMapsUrl?: string;
  passportData: string;
  imageUrl: string;
  studentsCount: number; // Maktabda: o'quvchilar; Bog'chada: tarbiyalanuvchilar
  teachersCount: number; // Maktabda: o'qituvchilar; Bog'chada: tarbiyachilar
  computerClassesCount: number;
  computersCount: number;
  computersYear: number | null;
  computerClasses?: ComputerClass[];
  createdAt?: any;
}

// ==========================================
// Словарь локализации (O'zbekcha / Русский)
// ==========================================
const DICTIONARY = {
  uz: {
    app_title: "Maktab va bog'chalar hisobi",
    app_subtitle: "Maktablar va maktabgacha ta'lim tashkilotlari",
    admin_mode: "Administrator",
    guest_mode: "Mehmon (faqat ko'rish)",
    login_title: "Muassasalar hisobi tizimi",
    login_btn: "Tizimga kirish",
    logging_in: "Kirilmoqda...",
    login_placeholder: "admin yoki admin@edu.gov",
    password_label: "Parol",
    login_label: "Login yoki Email",
    guest_btn: "Mehmon sifatida kirish",
    admin_login_btn: "Admin kirishi",
    exit_btn: "Chiqish",
    reset_btn: "Qayta tiklash",
    tab_institutions: "Muassasalar",
    tab_regions: "Viloyat va Tumanlar",
    tab_settings: "Parolni o'zgartirish",
    
    // Statistika
    stats_total_objects: "Jami muassasalar",
    stats_schools: "Maktablar",
    stats_kindergartens: "Bolalar bog'chalari",
    stats_school_pupils: "Maktab o'quvchilari",
    stats_school_teachers: "Maktab o'qituvchilari",
    stats_kindergarten_kids: "Bog'cha tarbiyalanuvchilari",
    stats_kindergarten_educators: "Bog'cha tarbiyachilari",
    stats_total_contingent: "Jami ta'lim oluvchilar",
    stats_total_staff: "Jami pedagoglar",
    stats_comp_classes: "Kompyuter sinflari",
    stats_computers: "Jami kompyuterlar",
    stats_computers_by_year_title: "Yillar kesimida kompyuterlar statistikasi (2020-yildan boshlab)",
    stats_computers_by_year_desc: "2020-yildan boshlab har bir yil bo'yicha kompyuterlar soni va sinflar hisobi",
    stats_filter_by_year: "Tanlangan yil",
    stats_clear_year_filter: "Yil filtrini bekor qilish",
    stats_equipped_classes: "Jihozlangan xonalar",

    // Filtrlash
    filters_title: "Filtrlar va qidiruv",
    region_label: "Viloyat (Hudud)",
    all_regions: "Barcha viloyatlar",
    district_label: "Tuman / Shahar",
    all_districts: "Barcha tumanlar",
    select_region_first: "Avval viloyatni tanlang",
    type_label: "Muassasa turi",
    all_types: "Barcha turlar",
    type_school: "Maktab",
    type_schools: "Maktablar",
    type_kindergarten: "Bolalar bog'chasi",
    type_kindergartens: "Bolalar bog'chalari",
    search_placeholder: "Raqam, manzil yoki tuman bo'yicha qidiruv...",
    reset_filters: "Filtrlarni tozalash",
    not_found_title: "Muassasalar topilmadi",
    not_found_desc: "Berilgan mezonlar bo'yicha maktab yoki bog'cha topilmadi.",

    // Kartochka va jadval
    card_number: "№",
    students_school: "O'quvchilar",
    teachers_school: "O'qituvchilar",
    students_kindergarten: "Tarbiyalanuvchilar",
    teachers_kindergarten: "Tarbiyachilar",
    comp_classes_short: "sinf",
    computers_short: "kompyuter",
    open_map_btn: "Google Xarita",
    new_badge: "Yangi",
    photo_missing: "Foto mavjud emas",
    details_btn: "Batafsil",

    // Jadval ustunlari
    th_type_num: "Tur va №",
    th_district: "Tuman",
    th_address: "Manzil",
    th_students: "Tarbiyalanuvchilar / O'quvchilar",
    th_teachers: "Tarbiyachilar / O'qituvchilar",
    th_computers: "Kompyuterlar",
    th_actions: "Amallar",

    // Qo'shish formasi
    modal_add_title: "Yangi muassasa qo'shish",
    modal_add_subtitle: "Maktab yoki bolalar bog'chasi ma'lumotlarini kiriting",
    field_number: "Muassasa raqami *",
    field_location: "Manzil (ko'cha, mahalla, uy)",
    field_google_maps: "Google Maps havolasi (link)",
    field_photo: "Bosh kirish qismi fotosurati",
    field_photo_hint: "Maksimal rasm hajmi: 1 MB (JPG, PNG, WebP)",
    photo_size_error: "Rasm hajmi 1 MB dan oshmasligi kerak! Iltimos, 1 MB gacha bo'lgan rasm tanlang.",
    field_passport: "Pasport ma'lumotlari va qo'shimcha tavsif",
    btn_save: "Muassasani saqlash",
    btn_saving: "Saqlanmoqda...",
    btn_cancel: "Bekor qilish",
    btn_delete: "O'chirish",
    btn_add_inst: "Muassasa qo'shish",
    btn_add_district: "+ Tuman qo'shish",
    quick_district_name: "Yangi tuman nomi...",

    // Alohida kompyuter sinflari
    classes_section_title: "Kompyuter sinflari (har bir sinf alohida)",
    btn_add_class: "+ Kompyuter sinfini qo'shish",
    class_name_placeholder: "Sinf nomi (masalan: 1-informatika xonasi)",
    class_computers_count: "Kompyuter soni",
    class_year: "Yetkazilgan yili",
    no_classes_yet: "Kompyuter sinflari kiritilmagan",

    // Xarita modali
    map_modal_title: "Google Maps xaritasi",
    map_open_external: "Google Maps veb-saytida ochish",
    map_not_specified: "Xarita havolasi kiritilmagan",

    // Pasport modali
    passport_modal_title: "Muassasa pasporti",
    passport_equip_title: "Kompyuter sinflari va jihozlar ro'yxati:",
    close_btn: "Yopish",

    // Sozlamalar va parollar
    settings_title: "Administrator parolini o'zgartirish",
    settings_subtitle: "Barcha qurilmalarda darhol yangilanadi",
    new_password_label: "Yangi parol",
    confirm_password_label: "Yangi parolni tasdiqlang",
    update_password_btn: "Parolni yangilash",
    password_success: "Administrator paroli barcha qurilmalarda muvaffaqiyatli saqlandi!",
    password_error_short: "Parol kamida 6 belgidan iborat bo'lishi kerak.",
    password_error_match: "Parollar bir-biriga mos kelmadi.",

    // Regionlar
    regions_title: "Viloyatlar (Hududlar)",
    districts_title: "Tumanlar / Shaharlar",
    add_region_placeholder: "Viloyat nomi...",
    add_district_placeholder: "Tuman nomi...",
    add_btn: "Qo'shish",
    select_region_required: "Viloyatni tanlang *",

    // Toast
    saved_toast: "muvaffaqiyatli saqlandi!",
    deleted_toast: "muvaffaqiyatli o'chirildi.",
  },
  ru: {
    app_title: "Учет школ и детских садов",
    app_subtitle: "Школы и дошкольные образовательные организации",
    admin_mode: "Администратор",
    guest_mode: "Гость (только просмотр)",
    login_title: "Система учета учреждений",
    login_btn: "Войти в систему",
    logging_in: "Авторизация...",
    login_placeholder: "admin или admin@edu.gov",
    password_label: "Пароль",
    login_label: "Логин или Email",
    guest_btn: "Войти как гость",
    admin_login_btn: "Вход администратора",
    exit_btn: "Выйти",
    reset_btn: "Сбросить",
    tab_institutions: "Учреждения",
    tab_regions: "Области и Районы",
    tab_settings: "Смена пароля",
    
    // Статистика
    stats_total_objects: "Всего объектов",
    stats_schools: "Школ",
    stats_kindergartens: "Детских садов",
    stats_school_pupils: "Учащихся школ",
    stats_school_teachers: "Учителей школ",
    stats_kindergarten_kids: "Воспитанников ДОО",
    stats_kindergarten_educators: "Воспитателей ДОО",
    stats_total_contingent: "Всего учащихся/детей",
    stats_total_staff: "Всего педагогов",
    stats_comp_classes: "Компьютерных классов",
    stats_computers: "Всего компьютеров",
    stats_computers_by_year_title: "Статистика компьютеров по годам поставки (начиная с 2020 г.)",
    stats_computers_by_year_desc: "Раздельный учёт количества компьютеров и классов по каждому году, начиная с 2020 г.",
    stats_filter_by_year: "Выбранный год",
    stats_clear_year_filter: "Сбросить фильтр по году",
    stats_equipped_classes: "Оборудованных кабинетов",

    // Фильтрация
    filters_title: "Фильтры и поиск",
    region_label: "Область (Регион)",
    all_regions: "Все области",
    district_label: "Район / Туман",
    all_districts: "Все районы",
    select_region_first: "Сначала выберите область",
    type_label: "Тип учреждения",
    all_types: "Все типы",
    type_school: "Школа",
    type_schools: "Школы",
    type_kindergarten: "Детский сад",
    type_kindergartens: "Детские сады",
    search_placeholder: "Номер, адрес или район...",
    reset_filters: "Сбросить фильтры",
    not_found_title: "Учреждения не найдены",
    not_found_desc: "По заданным критериям не найдено ни одного учреждения.",

    // Карточка и таблица
    card_number: "№",
    students_school: "Учеников",
    teachers_school: "Учителей",
    students_kindergarten: "Воспитанников",
    teachers_kindergarten: "Воспитателей",
    comp_classes_short: "кл.",
    computers_short: "ПК",
    open_map_btn: "Google Карты",
    new_badge: "Новое",
    photo_missing: "Фото отсутствует",
    details_btn: "Подробнее",

    // Таблица
    th_type_num: "Тип и №",
    th_district: "Район",
    th_address: "Адрес",
    th_students: "Воспитанники / Ученики",
    th_teachers: "Воспитатели / Учителя",
    th_computers: "Компьютеры",
    th_actions: "Действия",

    // Форма добавления
    modal_add_title: "Добавление учреждения",
    modal_add_subtitle: "Заполните данные паспорта школы или детского сада",
    field_number: "Номер учреждения *",
    field_location: "Адрес (улица, дом, махалля)",
    field_google_maps: "Ссылка на Google Maps (URL)",
    field_photo: "Фотография главного входа",
    field_photo_hint: "Максимальный размер фото: 1 МБ (JPG, PNG, WebP)",
    photo_size_error: "Размер фотографии не должен превышать 1 МБ! Пожалуйста, выберите файл до 1 МБ.",
    field_passport: "Паспортные данные и примечания",
    btn_save: "Сохранить учреждение",
    btn_saving: "Сохранение...",
    btn_cancel: "Отмена",
    btn_delete: "Удалить",
    btn_add_inst: "Добавить учреждение",
    btn_add_district: "+ Создать район",
    quick_district_name: "Название района...",

    // Отдельные компьютерные классы
    classes_section_title: "Компьютерные классы (по отдельности)",
    btn_add_class: "+ Добавить компьютерный класс",
    class_name_placeholder: "Название класса (напр. Кабинет информатики №1)",
    class_computers_count: "Количество ПК",
    class_year: "Год поставки",
    no_classes_yet: "Компьютерные классы пока не добавлены",

    // Модалка карты
    map_modal_title: "Карта Google Maps",
    map_open_external: "Открыть на сайте Google Maps",
    map_not_specified: "Ссылка на карту не указана",

    // Модалка паспорта
    passport_modal_title: "Паспорт учреждения",
    passport_equip_title: "Список компьютерных классов и оснащение:",
    close_btn: "Закрыть",

    // Настройки
    settings_title: "Изменение пароля администратора",
    settings_subtitle: "Обновляется мгновенно на всех устройствах",
    new_password_label: "Новый пароль",
    confirm_password_label: "Повторите новый пароль",
    update_password_btn: "Обновить пароль",
    password_success: "Пароль администратора успешно сохранен на всех устройствах!",
    password_error_short: "Пароль должен содержать минимум 6 символов.",
    password_error_match: "Пароли не совпадают.",

    // Регионы
    regions_title: "Области (Регионы)",
    districts_title: "Районы / Туманы",
    add_region_placeholder: "Название области...",
    add_district_placeholder: "Название района...",
    add_btn: "Добавить",
    select_region_required: "Выберите область *",

    // Toast
    saved_toast: "успешно сохранено!",
    deleted_toast: "успешно удалено.",
  }
};

// ==========================================
// Ключи локального хранилища (Persistence)
// ==========================================
const STORAGE_KEYS = {
  LANG: 'edu_app_language',
  REGIONS: 'edu_regions_data_v3',
  DISTRICTS: 'edu_districts_data_v3',
  INSTITUTIONS: 'edu_institutions_data_v3',
  ADMIN_SESSION: 'edu_admin_session_v3',
  ADMIN_PASSWORD: 'admin_password',
};

// Безопасное сохранение в localStorage с защитой от QuotaExceededError
function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`localStorage quota warning for ${key}:`, err);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const trimmed = parsed.map((item, idx) => ({
          ...item,
          imageUrl: idx === 0 ? item.imageUrl : (item.imageUrl?.startsWith('data:') ? '' : item.imageUrl)
        }));
        localStorage.setItem(key, JSON.stringify(trimmed));
      }
    } catch (_) {}
  }
}

// ==========================================
// Начальные данные (Seed Data)
// ==========================================
const INITIAL_REGIONS: Region[] = [
  { id: 'reg_tashkent_city', name: 'Toshkent shahri' },
  { id: 'reg_tashkent_reg', name: 'Toshkent viloyati' },
  { id: 'reg_samarkand', name: 'Samarqand viloyati' },
  { id: 'reg_fergana', name: "Farg'ona viloyati" },
  { id: 'reg_bukhara', name: 'Buxoro viloyati' },
];

const INITIAL_DISTRICTS: District[] = [
  { id: 'dist_yunusabad', name: 'Yunusobod tumani', regionId: 'reg_tashkent_city' },
  { id: 'dist_mirzo_ulugbek', name: "Mirzo Ulug'bek tumani", regionId: 'reg_tashkent_city' },
  { id: 'dist_chilonzor', name: 'Chilonzor tumani', regionId: 'reg_tashkent_city' },
  { id: 'dist_chirchik', name: 'Chirchiq shahri', regionId: 'reg_tashkent_reg' },
  { id: 'dist_kibray', name: 'Qibray tumani', regionId: 'reg_tashkent_reg' },
  { id: 'dist_sam_city', name: 'Samarqand shahri', regionId: 'reg_samarkand' },
  { id: 'dist_pastdargom', name: 'Pastdargʻom tumani', regionId: 'reg_samarkand' },
  { id: 'dist_fergana_city', name: "Farg'ona shahri", regionId: 'reg_fergana' },
  { id: 'dist_kokand', name: "Qo'qon shahri", regionId: 'reg_fergana' },
  { id: 'dist_bukhara_city', name: 'Buxoro shahri', regionId: 'reg_bukhara' },
];

const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: 'inst_1',
    type: 'school',
    districtId: 'dist_yunusabad',
    number: '257',
    location: '11-mavze, Yangishahar koʻchasi, 14-uy',
    googleMapsUrl: 'https://maps.google.com/?q=41.368,69.288',
    passportData: "Aniq fanlarga ixtisoslashtirilgan umumiy o'rta ta'lim maktabi. Litsenziya № 04821.",
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    studentsCount: 1420,
    teachersCount: 88,
    computerClassesCount: 2,
    computersCount: 50,
    computersYear: 2026,
    computerClasses: [
      { id: 'cc_1_1', name: '1-informatika xonasi', computersCount: 25, computersYear: 2023 },
      { id: 'cc_1_2', name: '2-informatika xonasi', computersCount: 25, computersYear: 2026 },
    ]
  },
  {
    id: 'inst_2',
    type: 'kindergarten',
    districtId: 'dist_yunusabad',
    number: '48',
    location: 'Yunusobod 4-mavze, 18A-uy',
    googleMapsUrl: 'https://maps.google.com/?q=41.356,69.282',
    passportData: "Davlat ko'p tarmoqli maktabgacha ta'lim tashkiloti. Pasport № MTT-229.",
    imageUrl: 'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?auto=format&fit=crop&w=800&q=80',
    studentsCount: 280, // Tarbiyalanuvchilar
    teachersCount: 26, // Tarbiyachilar
    computerClassesCount: 1,
    computersCount: 8,
    computersYear: 2022,
    computerClasses: [
      { id: 'cc_2_1', name: 'Interaktiv mashgʻulot xonasi', computersCount: 8, computersYear: 2022 }
    ]
  },
  {
    id: 'inst_3',
    type: 'school',
    districtId: 'dist_sam_city',
    number: '14',
    location: 'Dagbitskaya koʻchasi, 45-uy',
    googleMapsUrl: 'https://maps.google.com/?q=39.654,66.959',
    passportData: "Alisher Navoiy nomidagi umumta'lim maktabi. 3 qavatli bino, kapital ta'mirdan chiqqan.",
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    studentsCount: 1150,
    teachersCount: 72,
    computerClassesCount: 2,
    computersCount: 40,
    computersYear: 2027,
    computerClasses: [
      { id: 'cc_3_1', name: 'Katta informatika xonasi', computersCount: 20, computersYear: 2027 },
      { id: 'cc_3_2', name: 'Kichik informatika xonasi', computersCount: 20, computersYear: 2020 },
    ]
  },
  {
    id: 'inst_4',
    type: 'kindergarten',
    districtId: 'dist_mirzo_ulugbek',
    number: '105',
    location: 'Qorasuv-4 massivi, 2B-uy',
    googleMapsUrl: 'https://maps.google.com/?q=41.332,69.341',
    passportData: "Inlyuziv va logopedik guruhlarga ega davlat bog'chasi. Pasport № D-105.",
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
    studentsCount: 210, // Tarbiyalanuvchilar
    teachersCount: 22, // Tarbiyachilar
    computerClassesCount: 1,
    computersCount: 4,
    computersYear: 2021,
    computerClasses: [
      { id: 'cc_4_1', name: "O'qituvchilar metodika xonasi", computersCount: 4, computersYear: 2021 }
    ]
  },
];

/**
 * Быстрое сжатие изображения в компактный легкий формат (~20-40 КБ)
 */
function compressImage(file: File, maxWidth = 640, maxHeight = 420, quality = 0.65): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve('');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// ==========================================
// Компонент LoginForm
// ==========================================
interface LoginFormProps {
  lang: Language;
  onSuccess: (user: User) => void;
  onGuestMode: () => void;
}

export function LoginForm({ lang, onSuccess, onGuestMode }: LoginFormProps) {
  const t = DICTIONARY[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedInput = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedInput) {
      setError(lang === 'uz' ? 'Login yoki emailni kiriting' : 'Введите логин или email');
      return;
    }
    if (!trimmedPassword) {
      setError(lang === 'uz' ? 'Parolni kiriting' : 'Введите пароль');
      return;
    }

    let currentAdminPassword = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin123';
    const isAdminLogin = (trimmedInput.toLowerCase() === 'admin' || trimmedInput.toLowerCase() === 'admin@edu.gov');

    if (isAdminLogin && isFirebaseConfigured) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'auth'));
        if (snap.exists() && snap.data()?.adminPassword) {
          currentAdminPassword = snap.data().adminPassword;
          localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, currentAdminPassword);
        }
      } catch (_) {}
    }

    // Авторизация администратора (admin / admin123 или обновленный пароль)
    if (isAdminLogin && trimmedPassword === currentAdminPassword) {
      const adminUser = {
        uid: 'admin_master_id',
        email: 'admin@edu.gov',
        displayName: 'Bosh Administrator',
      } as unknown as User;

      safeSetItem(STORAGE_KEYS.ADMIN_SESSION, 'true');

      if (isFirebaseConfigured) {
        signInWithEmailAndPassword(auth, 'admin@edu.gov', trimmedPassword).catch(() => {});
      }

      onSuccess(adminUser);
      return;
    }

    const emailToUse = trimmedInput.includes('@')
      ? trimmedInput
      : `${trimmedInput}@edu.gov`;

    setIsLoading(true);

    try {
      if (isFirebaseConfigured) {
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, trimmedPassword);
        safeSetItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
        onSuccess(userCredential.user);
      } else {
        if (isAdminLogin) {
          throw new Error(lang === 'uz' ? 'Admin paroli noto‘g‘ri.' : 'Неверный пароль администратора.');
        } else {
          throw new Error(lang === 'uz' ? 'Kirish uchun admin va admin123 dan foydalaning.' : 'Для входа используйте логин admin и пароль admin123.');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let message = lang === 'uz' ? 'Login yoki parol noto‘g‘ri.' : 'Неверный логин или пароль.';
      if (err.message) message = err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4 shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t.login_title}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              {t.app_subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t.login_label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.login_placeholder}
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t.password_label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t.logging_in}</span>
                </>
              ) : (
                <span>{t.login_btn}</span>
              )}
            </button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">yoki / или</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGuestMode}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
            <span>{t.guest_btn}</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Maktabgacha va maktab ta'limi vazirligi elektron reyestri
        </p>
      </div>
    </div>
  );
}

// ==========================================
// Основное приложение App
// ==========================================
export default function App() {
  // Язык интерфейса (по умолчанию O'zbekcha)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || 'uz';
  });

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'uz' ? 'ru' : 'uz';
    setLang(nextLang);
    safeSetItem(STORAGE_KEYS.LANG, nextLang);
  };

  const t = DICTIONARY[lang];

  // Пользователь администратор
  const [user, setUser] = useState<User | null>(() => {
    const hasAdminSession = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
    if (hasAdminSession) {
      return {
        uid: 'admin_master_id',
        email: 'admin@edu.gov',
        displayName: 'Bosh Administrator',
      } as unknown as User;
    }
    return null;
  });

  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState<'institutions' | 'regions' | 'settings'>('institutions');

  // Уведомление об успешном сохранении (Toast)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // 1. Персистентные данные
  const [regions, setRegions] = useState<Region[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Regions read error:', e);
    }
    return INITIAL_REGIONS;
  });

  const [districts, setDistricts] = useState<District[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISTRICTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Districts read error:', e);
    }
    return INITIAL_DISTRICTS;
  });

  const [institutions, setInstitutions] = useState<Institution[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Institutions read error:', e);
    }
    return INITIAL_INSTITUTIONS;
  });

  // Подсвеченное учреждение (только что добавленное)
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Автоматическая синхронизация состояния в localStorage
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.REGIONS, JSON.stringify(regions));
  }, [regions]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.DISTRICTS, JSON.stringify(districts));
  }, [districts]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(institutions));
  }, [institutions]);

  // Фильтрация
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Модальные окна
  const [selectedInstitutionForView, setSelectedInstitutionForView] = useState<Institution | null>(null);
  const [isAddInstitutionOpen, setIsAddInstitutionOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Модальное окно просмотра Google Maps
  const [googleMapModal, setGoogleMapModal] = useState<{
    isOpen: boolean;
    title: string;
    locationText: string;
    url: string;
  }>({
    isOpen: false,
    title: '',
    locationText: '',
    url: '',
  });

  // Форма добавления учреждения
  const [newInst, setNewInst] = useState({
    type: 'school' as 'school' | 'kindergarten',
    regionId: '',
    districtId: '',
    number: '',
    location: '',
    googleMapsUrl: '',
    passportData: '',
    studentsCount: '' as string | number,
    teachersCount: '' as string | number,
  });

  // Динамические компьютерные классы для нового учреждения
  const [newComputerClasses, setNewComputerClasses] = useState<ComputerClass[]>([
    { id: 'cls_1', name: '1-informatika xonasi', computersCount: 15, computersYear: new Date().getFullYear() }
  ]);

  // Быстрое создание нового района прямо в модалке
  const [isQuickAddDistrictOpen, setIsQuickAddDistrictOpen] = useState(false);
  const [quickDistrictName, setQuickDistrictName] = useState('');

  const [newInstImageFile, setNewInstImageFile] = useState<File | null>(null);
  const [newInstImagePreview, setNewInstImagePreview] = useState<string>('');
  const [isSavingInst, setIsSavingInst] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Формы управления областями и районами
  const [newRegionName, setNewRegionName] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newDistrictRegionId, setNewDistrictRegionId] = useState('');

  // Форма смены пароля
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Модалка подтверждения удаления
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'institution' | 'region' | 'district' | 'reset';
    id?: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'institution',
    title: '',
    message: '',
  });

  // Слушатель Firebase Auth
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setIsGuest(false);
          safeSetItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Синхронизация Firestore в реальном времени (между всеми устройствами)
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    // 1. Области (Regions)
    const unsubRegs = onSnapshot(collection(db, 'regions'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Region));
        items.sort((a, b) => a.name.localeCompare(b.name, 'uz'));
        setRegions(items);
        safeSetItem(STORAGE_KEYS.REGIONS, JSON.stringify(items));
      } else {
        const batch = writeBatch(db);
        INITIAL_REGIONS.forEach((r) => {
          batch.set(doc(db, 'regions', r.id), { name: r.name });
        });
        batch.commit().catch(() => {});
      }
    }, (err) => console.warn('Regions onSnapshot error:', err));

    // 2. Районы (Districts)
    const unsubDists = onSnapshot(collection(db, 'districts'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as District));
        items.sort((a, b) => a.name.localeCompare(b.name, 'uz'));
        setDistricts(items);
        safeSetItem(STORAGE_KEYS.DISTRICTS, JSON.stringify(items));
      } else {
        const batch = writeBatch(db);
        INITIAL_DISTRICTS.forEach((d) => {
          batch.set(doc(db, 'districts', d.id), { name: d.name, regionId: d.regionId });
        });
        batch.commit().catch(() => {});
      }
    }, (err) => console.warn('Districts onSnapshot error:', err));

    // 3. Учреждения (Institutions)
    const unsubInsts = onSnapshot(collection(db, 'institutions'), (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Institution));
        setInstitutions(items);
        safeSetItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(items));
      } else {
        const batch = writeBatch(db);
        INITIAL_INSTITUTIONS.forEach((inst) => {
          const { id, ...rest } = inst;
          batch.set(doc(db, 'institutions', id), rest);
        });
        batch.commit().catch(() => {});
      }
    }, (err) => console.warn('Institutions onSnapshot error:', err));

    // 4. Синхронизация пароля администратора из Firestore
    const unsubSettings = onSnapshot(doc(db, 'settings', 'auth'), (snap) => {
      if (snap.exists() && snap.data()?.adminPassword) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, snap.data().adminPassword);
      }
    }, (err) => console.warn('Settings onSnapshot error:', err));

    return () => {
      unsubRegs();
      unsubDists();
      unsubInsts();
      unsubSettings();
    };
  }, []);

  // Каскадное обновление районов при смене области
  const filteredDistrictsForSelect = useMemo(() => {
    if (!selectedRegionId) return districts;
    return districts.filter((d) => d.regionId === selectedRegionId);
  }, [districts, selectedRegionId]);

  const districtsForNewInst = useMemo(() => {
    if (!newInst.regionId) return [];
    return districts.filter((d) => d.regionId === newInst.regionId);
  }, [districts, newInst.regionId]);

  // Справочники
  const districtsMap = useMemo(() => {
    const map: Record<string, string> = {};
    districts.forEach((d) => { map[d.id] = d.name; });
    return map;
  }, [districts]);

  const regionsMap = useMemo(() => {
    const map: Record<string, string> = {};
    regions.forEach((r) => { map[r.id] = r.name; });
    return map;
  }, [regions]);

  // Базовая фильтрация по области, району, типу и поисковому запросу
  const baseInstitutionsForStats = useMemo(() => {
    return institutions.filter((item) => {
      if (selectedRegionId) {
        const dist = districts.find((d) => d.id === item.districtId);
        if (!dist || dist.regionId !== selectedRegionId) return false;
      }
      if (selectedDistrictId && item.districtId !== selectedDistrictId) {
        return false;
      }
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = String(item.number || '').toLowerCase().includes(q);
        const matchLocation = String(item.location || '').toLowerCase().includes(q);
        const matchDistrict = (districtsMap[item.districtId] || '').toLowerCase().includes(q);
        if (!matchNumber && !matchLocation && !matchDistrict) return false;
      }
      return true;
    });
  }, [institutions, selectedRegionId, selectedDistrictId, selectedType, searchQuery, districts, districtsMap]);

  // Финальный список учреждений с учётом выбранного фильтра по году поставки компьютеров
  const filteredInstitutions = useMemo(() => {
    if (!selectedYearFilter) return baseInstitutionsForStats;
    return baseInstitutionsForStats.filter((item) => {
      if (item.computerClasses && item.computerClasses.length > 0) {
        return item.computerClasses.some((c) => Number(c.computersYear) === selectedYearFilter);
      }
      return Number(item.computersYear) === selectedYearFilter;
    });
  }, [baseInstitutionsForStats, selectedYearFilter]);

  // Раздельный учёт: школы, детские сады, количество компьютерных классов и компьютеры по годам (2020-2027)
  const stats = useMemo(() => {
    const targetList = baseInstitutionsForStats;
    const total = targetList.length;
    const schoolsList = targetList.filter((i) => i.type === 'school');
    const kindergartensList = targetList.filter((i) => i.type === 'kindergarten');

    const schoolsCount = schoolsList.length;
    const kindergartensCount = kindergartensList.length;

    // Школы: ученики и учителя
    const schoolPupils = schoolsList.reduce((acc, curr) => acc + (Number(curr.studentsCount) || 0), 0);
    const schoolTeachers = schoolsList.reduce((acc, curr) => acc + (Number(curr.teachersCount) || 0), 0);

    // Детские сады: воспитанники и воспитатели
    const kindergartenKids = kindergartensList.reduce((acc, curr) => acc + (Number(curr.studentsCount) || 0), 0);
    const kindergartenEducators = kindergartensList.reduce((acc, curr) => acc + (Number(curr.teachersCount) || 0), 0);

    // Общий контингент и педагоги
    const totalContingent = schoolPupils + kindergartenKids;
    const totalStaff = schoolTeachers + kindergartenEducators;

    // 1. Сколько всего компьютерных классов
    let totalComputerClasses = 0;
    let totalComputers = 0;

    // 2. Статистика количества компьютеров по годам по отдельности: 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027
    const defaultYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];
    const yearStatsMap: Record<number, { computers: number; classes: number }> = {};
    defaultYears.forEach((y) => {
      yearStatsMap[y] = { computers: 0, classes: 0 };
    });

    targetList.forEach((inst) => {
      if (inst.computerClasses && inst.computerClasses.length > 0) {
        totalComputerClasses += inst.computerClasses.length;
        inst.computerClasses.forEach((cls) => {
          const cCount = Number(cls.computersCount) || 0;
          totalComputers += cCount;
          const yr = Number(cls.computersYear);
          // Учитываем только года, начиная с 2020
          if (yr && yr >= 2020) {
            if (!yearStatsMap[yr]) {
              yearStatsMap[yr] = { computers: 0, classes: 0 };
            }
            yearStatsMap[yr].computers += cCount;
            yearStatsMap[yr].classes += 1;
          }
        });
      } else {
        const clsCount = Number(inst.computerClassesCount) || (Number(inst.computersCount) > 0 ? 1 : 0);
        totalComputerClasses += clsCount;
        const cCount = Number(inst.computersCount) || 0;
        totalComputers += cCount;
        const yr = Number(inst.computersYear);
        if (yr && yr >= 2020) {
          if (!yearStatsMap[yr]) {
            yearStatsMap[yr] = { computers: 0, classes: 0 };
          }
          yearStatsMap[yr].computers += cCount;
          yearStatsMap[yr].classes += clsCount;
        }
      }
    });

    // Сортировка годов по возрастанию: 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027...
    const sortedYears = Object.keys(yearStatsMap)
      .map(Number)
      .sort((a, b) => a - b);

    const totalComputersSince2020 = sortedYears.reduce((sum, y) => sum + yearStatsMap[y].computers, 0);

    const computersByYear = sortedYears.map((year) => ({
      year,
      computers: yearStatsMap[year].computers,
      classes: yearStatsMap[year].classes,
      percentage: totalComputersSince2020 > 0 ? Math.round((yearStatsMap[year].computers / totalComputersSince2020) * 100) : 0,
    }));

    return {
      total,
      schoolsCount,
      kindergartensCount,
      schoolPupils,
      schoolTeachers,
      kindergartenKids,
      kindergartenEducators,
      totalContingent,
      totalStaff,
      totalComputerClasses,
      totalComputers,
      totalComputersSince2020,
      computersByYear,
    };
  }, [baseInstitutionsForStats]);

  // Максимальный допустимый размер загружаемого фото: 1 МБ (1 048 576 байт)
  const MAX_PHOTO_BYTES = 1024 * 1024;

  // Выбор фото с валидацией ограничения в 1 Мегабайт
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Строгое ограничение: размер не более 1 МБ
      if (file.size > MAX_PHOTO_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        const errorText = `${t.photo_size_error} (${lang === 'uz' ? 'Fayl hajmi' : 'Размер файла'}: ${sizeMb} MB > 1.00 MB)`;
        setModalError(errorText);
        setNewInstImageFile(null);
        setNewInstImagePreview('');
        if (e.target) e.target.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setModalError(null);
      setNewInstImageFile(file);
      const compressedBase64 = await compressImage(file);
      setNewInstImagePreview(compressedBase64);
    }
  };

  // Управление компьютерными классами в форме добавления
  const addComputerClassRow = () => {
    const nextNum = newComputerClasses.length + 1;
    const nextName = lang === 'uz' ? `${nextNum}-informatika xonasi` : `Кабинет информатики №${nextNum}`;
    setNewComputerClasses((prev) => [
      ...prev,
      {
        id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        name: nextName,
        computersCount: 15,
        computersYear: new Date().getFullYear(),
      }
    ]);
  };

  const removeComputerClassRow = (id: string) => {
    setNewComputerClasses((prev) => prev.filter((c) => c.id !== id));
  };

  const updateComputerClassRow = (id: string, field: keyof ComputerClass, value: any) => {
    setNewComputerClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Быстрое создание района прямо из модального окна добавления учреждения
  const handleQuickAddDistrict = () => {
    const name = quickDistrictName.trim();
    if (!name) return;
    if (!newInst.regionId) {
      setModalError(t.select_region_first);
      return;
    }

    const newDistId = `dist_${Date.now()}`;
    const newDistrict: District = {
      id: newDistId,
      name,
      regionId: newInst.regionId,
    };

    setDistricts((prev) => {
      const updated = [...prev, newDistrict];
      safeSetItem(STORAGE_KEYS.DISTRICTS, JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured) {
      setDoc(doc(db, 'districts', newDistId), {
        name,
        regionId: newInst.regionId,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }

    setNewInst((prev) => ({ ...prev, districtId: newDistId }));
    setQuickDistrictName('');
    setIsQuickAddDistrictOpen(false);
    setModalError(null);
  };

  // Открыть модальное окно Google Maps
  const openGoogleMap = (item: Institution, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const districtName = districtsMap[item.districtId] || '';
    const queryLocation = item.location ? `${item.location}, ${districtName}` : districtName;

    let targetUrl = item.googleMapsUrl?.trim() || '';
    if (!targetUrl) {
      targetUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryLocation)}`;
    }

    setGoogleMapModal({
      isOpen: true,
      title: `${item.type === 'school' ? t.type_school : t.type_kindergarten} № ${item.number}`,
      locationText: item.location || districtName,
      url: targetUrl,
    });
  };

  // ==============================================================
  // СОХРАНЕНИЕ УЧРЕЖДЕНИЯ (С ОТДЕЛЬНЫМИ КОМПЬЮТЕРНЫМИ КЛАССАМИ И GOOGLE MAPS)
  // ==============================================================
  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Валидация полей
    if (!newInst.regionId) {
      setModalError(t.select_region_required);
      return;
    }
    if (!newInst.districtId) {
      setModalError(lang === 'uz' ? 'Tumanni tanlang' : 'Выберите район');
      return;
    }
    if (!newInst.number.trim()) {
      setModalError(lang === 'uz' ? 'Muassasa raqamini kiriting' : 'Укажите номер учреждения');
      return;
    }

    // Проверка размера фотографии перед сохранением: не более 1 МБ
    if (newInstImageFile && newInstImageFile.size > MAX_PHOTO_BYTES) {
      const sizeMb = (newInstImageFile.size / (1024 * 1024)).toFixed(2);
      setModalError(`${t.photo_size_error} (${sizeMb} MB > 1.00 MB)`);
      return;
    }

    setIsSavingInst(true);
    // Используем готовое оптимизированное превью мгновенно без блокирующих таймаутов
    const finalImageUrl = newInstImagePreview || '';

    try {
      // Вычисляем суммарные показатели компьютеров из классов
      const validClasses = newComputerClasses.map((cls) => ({
        id: cls.id,
        name: cls.name.trim() || 'Informatika xonasi',
        computersCount: Number(cls.computersCount) || 0,
        computersYear: Number(cls.computersYear) || null,
      }));

      const totalCompCount = validClasses.reduce((sum, c) => sum + c.computersCount, 0);
      const totalCompClassesCount = validClasses.length;
      const latestCompYear = validClasses.length > 0
        ? Math.max(...validClasses.map(c => c.computersYear || 0)) || null
        : null;

      const newId = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const payload: Institution = {
        id: newId,
        type: newInst.type,
        districtId: newInst.districtId,
        number: newInst.number.trim(),
        location: newInst.location.trim(),
        googleMapsUrl: newInst.googleMapsUrl.trim(),
        passportData: newInst.passportData.trim(),
        imageUrl: finalImageUrl,
        studentsCount: Number(newInst.studentsCount) || 0,
        teachersCount: Number(newInst.teachersCount) || 0,
        computerClassesCount: totalCompClassesCount,
        computersCount: totalCompCount,
        computersYear: latestCompYear,
        computerClasses: validClasses,
      };

      // 1. Мгновенно обновляем локальное состояние и постоянную память
      setInstitutions((prev) => {
        const updated = [payload, ...prev];
        safeSetItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
        return updated;
      });

      // 2. Сбрасываем фильтры, подсвечиваем новый объект
      setSelectedRegionId('');
      setSelectedDistrictId('');
      setSelectedType('all');
      setSearchQuery('');
      setSelectedYearFilter(null);
      setHighlightedId(newId);

      // 3. Мгновенная синхронизация с Firestore по фиксированному ID (без задержек addDoc)
      if (isFirebaseConfigured) {
        const { id: _, ...dataToSave } = payload;
        setDoc(doc(db, 'institutions', newId), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        }).catch((fsErr) => {
          console.warn('Firestore setDoc warning:', fsErr);
        });

        // Фоновая асинхронная выгрузка в Firebase Storage без блокировки интерфейса
        if (newInstImageFile) {
          const storageRef = ref(storage, `institutions/${Date.now()}_${newInstImageFile.name}`);
          uploadBytes(storageRef, newInstImageFile)
            .then((snap) => getDownloadURL(snap.ref))
            .then((downloadUrl) => {
              if (downloadUrl) {
                setDoc(doc(db, 'institutions', newId), { imageUrl: downloadUrl }, { merge: true }).catch(() => {});
                setInstitutions((prev) =>
                  prev.map((item) => (item.id === newId ? { ...item, imageUrl: downloadUrl } : item))
                );
              }
            })
            .catch(() => {});
        }
      }

      showToast(`${payload.type === 'school' ? t.type_school : t.type_kindergarten} № ${payload.number} ${t.saved_toast}`);

      // Закрываем модалку и сбрасываем форму
      setIsAddInstitutionOpen(false);
      setNewInst({
        type: 'school',
        regionId: '',
        districtId: '',
        number: '',
        location: '',
        googleMapsUrl: '',
        passportData: '',
        studentsCount: '',
        teachersCount: '',
      });
      setNewComputerClasses([
        { id: `cls_${Date.now()}`, name: '1-informatika xonasi', computersCount: 15, computersYear: new Date().getFullYear() }
      ]);
      setNewInstImageFile(null);
      setNewInstImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Save error:', err);
      setModalError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSavingInst(false);
    }
  };

  // Удаление учреждения
  const confirmDeleteInstitution = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const inst = institutions.find(i => i.id === id);
    setDeleteConfirm({
      isOpen: true,
      type: 'institution',
      id,
      title: lang === 'uz' ? "Muassasani o'chirish" : 'Удаление учреждения',
      message: `${inst?.type === 'school' ? t.type_school : t.type_kindergarten} № ${inst?.number || id} ${lang === 'uz' ? "ni o'chirishni xohlaysizmi?" : 'удалить из базы?'}`,
    });
  };

  const executeDelete = () => {
    const { type, id } = deleteConfirm;
    if (type === 'institution' && id) {
      if (isFirebaseConfigured) {
        deleteDoc(doc(db, 'institutions', id)).catch(() => {});
      }
      setInstitutions((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        safeSetItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
        return updated;
      });
      if (selectedInstitutionForView?.id === id) {
        setSelectedInstitutionForView(null);
      }
      showToast(`${t.tab_institutions} ${t.deleted_toast}`);
    } else if (type === 'region' && id) {
      if (isFirebaseConfigured) {
        deleteDoc(doc(db, 'regions', id)).catch(() => {});
      }
      setRegions((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        safeSetItem(STORAGE_KEYS.REGIONS, JSON.stringify(updated));
        return updated;
      });
      showToast(`${t.region_label} ${t.deleted_toast}`);
    } else if (type === 'district' && id) {
      if (isFirebaseConfigured) {
        deleteDoc(doc(db, 'districts', id)).catch(() => {});
      }
      setDistricts((prev) => {
        const updated = prev.filter((d) => d.id !== id);
        safeSetItem(STORAGE_KEYS.DISTRICTS, JSON.stringify(updated));
        return updated;
      });
      showToast(`${t.district_label} ${t.deleted_toast}`);
    } else if (type === 'reset') {
      localStorage.removeItem(STORAGE_KEYS.REGIONS);
      localStorage.removeItem(STORAGE_KEYS.DISTRICTS);
      localStorage.removeItem(STORAGE_KEYS.INSTITUTIONS);
      setRegions(INITIAL_REGIONS);
      setDistricts(INITIAL_DISTRICTS);
      setInstitutions(INITIAL_INSTITUTIONS);
      showToast(lang === 'uz' ? 'Maʼlumotlar boshlang‘ich holatga qaytarildi.' : 'Данные сброшены к начальным.');
    }
    setDeleteConfirm({ isOpen: false, type: 'institution', title: '', message: '' });
  };

  // Управление областями
  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRegionName.trim();
    if (!name) return;

    const newId = `reg_${Date.now()}`;
    const newRegItem: Region = { id: newId, name };

    setRegions((prev) => {
      const updated = [...prev, newRegItem];
      safeSetItem(STORAGE_KEYS.REGIONS, JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured) {
      setDoc(doc(db, 'regions', newId), {
        name,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }

    setNewRegionName('');
    showToast(`"${name}" ${t.saved_toast}`);
  };

  const promptDeleteRegion = (regionId: string) => {
    const hasDistricts = districts.some((d) => d.regionId === regionId);
    if (hasDistricts) {
      showToast(lang === 'uz' ? 'Avval bu viloyatga bog‘langan tumanlarni o‘chiring' : 'Сначала удалите районы, привязанные к этой области');
      return;
    }
    const reg = regions.find(r => r.id === regionId);
    setDeleteConfirm({
      isOpen: true,
      type: 'region',
      id: regionId,
      title: lang === 'uz' ? "Viloyatni o'chirish" : 'Удаление области',
      message: `"${reg?.name || ''}" ${lang === 'uz' ? "viloyatini o'chirasizmi?" : 'удалить?'}`,
    });
  };

  // Управление районами
  const handleAddDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newDistrictName.trim();
    if (!name || !newDistrictRegionId) {
      showToast(lang === 'uz' ? 'Tuman nomini kiriting va viloyatni tanlang' : 'Заполните название района и выберите область');
      return;
    }

    const newId = `dist_${Date.now()}`;
    const newDistItem: District = { id: newId, name, regionId: newDistrictRegionId };

    setDistricts((prev) => {
      const updated = [...prev, newDistItem];
      safeSetItem(STORAGE_KEYS.DISTRICTS, JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured) {
      setDoc(doc(db, 'districts', newId), {
        name,
        regionId: newDistrictRegionId,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }

    setNewDistrictName('');
    showToast(`"${name}" ${t.saved_toast}`);
  };

  const promptDeleteDistrict = (districtId: string) => {
    const hasInst = institutions.some((i) => i.districtId === districtId);
    if (hasInst) {
      showToast(lang === 'uz' ? 'Ushbu tumanda muassasalar mavjud. Avval ularni o‘chiring.' : 'В этом районе числятся учреждения. Сначала удалите их.');
      return;
    }
    const dist = districts.find(d => d.id === districtId);
    setDeleteConfirm({
      isOpen: true,
      type: 'district',
      id: districtId,
      title: lang === 'uz' ? "Tumanni o'chirish" : 'Удаление района',
      message: `"${dist?.name || ''}" ${lang === 'uz' ? "tumanini o'chirasizmi?" : 'удалить?'}`,
    });
  };

  // Смена пароля администратора
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', text: t.password_error_short });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: t.password_error_match });
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPassword);

      if (isFirebaseConfigured) {
        try {
          await setDoc(doc(db, 'settings', 'auth'), {
            adminPassword: newPassword,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (e) {
          console.warn('Firestore setDoc settings/auth error:', e);
        }

        if (auth.currentUser) {
          try {
            await updatePassword(auth.currentUser, newPassword);
          } catch (authErr) {
            console.warn('Firebase Auth updatePassword warning:', authErr);
          }
        }
      }

      setPasswordStatus({ type: 'success', text: t.password_success });
      setNewPassword('');
      setConfirmPassword('');
      showToast(lang === 'uz' ? 'Admin paroli yangilandi.' : 'Пароль администратора обновлен.');
    } catch (err: any) {
      console.error(err);
      setPasswordStatus({ type: 'error', text: err.message || 'Xatolik yuz berdi' });
    }
  };

  // Выход
  const handleLogout = async () => {
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    setUser(null);
    setIsGuest(false);
  };

  // Если не авторизован и не в гостевом режиме — отображаем экран входа
  if (!user && !isGuest) {
    return (
      <div className="relative">
        {/* Кнопка переключения языка на экране входа */}
        <div className="absolute top-5 right-5 z-50">
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-md"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? "🇺🇿 O'zbekcha" : '🇷🇺 Русский'}</span>
          </button>
        </div>

        <LoginForm
          lang={lang}
          onSuccess={(u) => {
            setUser(u);
            setIsGuest(false);
          }}
          onGuestMode={() => {
            setIsGuest(true);
          }}
        />
      </div>
    );
  }

  const isAdmin = Boolean(user);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Всплывающее уведомление (Toast) */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-sm border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Главная навигационная панель */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {t.app_title}
              </h1>
              <div className="flex items-center space-x-2 text-xs">
                {isAdmin ? (
                  <span className="inline-flex items-center text-emerald-600 font-semibold">
                    <Shield className="w-3.5 h-3.5 mr-1" />
                    {t.admin_mode} ({user?.email || 'admin'})
                  </span>
                ) : (
                  <span className="inline-flex items-center text-amber-600 font-semibold">
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    {t.guest_mode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Переключатель языка O'zbek / Русский */}
            <button
              onClick={toggleLanguage}
              title="Tilni almashtirish / Сменить язык"
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              <span>{lang === 'uz' ? "O'ZB" : 'РУС'}</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  <span>{t.exit_btn}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsGuest(false)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4 mr-1.5" />
                <span>{t.admin_login_btn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Вкладки для администратора */}
        {isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 flex space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('institutions')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'institutions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t.tab_institutions}</span>
            </button>
            <button
              onClick={() => setActiveTab('regions')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'regions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{t.tab_regions}</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{t.tab_settings}</span>
            </button>
          </div>
        )}
      </header>

      {/* Основной контент */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ============================================================== */}
        {/* ВКЛАДКА 1: УЧРЕЖДЕНИЯ */}
        {/* ============================================================== */}
        {activeTab === 'institutions' && (
          <div className="space-y-6">
            {/* Статистические плашки с раздельным учётом школ, детсадов и компьютерных классов */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {/* Всего объектов */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500">{t.stats_total_objects}</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
                <div className="text-[11px] text-slate-400 mt-1">
                  {stats.schoolsCount} {t.type_schools.toLowerCase()} / {stats.kindergartensCount} {t.type_kindergartens.toLowerCase()}
                </div>
              </div>

              {/* Школы: Учащиеся */}
              <div className="bg-white p-3.5 rounded-2xl border border-blue-200/80 shadow-xs bg-gradient-to-b from-blue-50/30 to-white">
                <span className="text-[11px] font-semibold text-blue-700 flex items-center">
                  <School className="w-3.5 h-3.5 mr-1" /> {t.stats_school_pupils}
                </span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {stats.schoolPupils.toLocaleString('uz-UZ')}
                </p>
                <div className="text-[11px] text-blue-600 mt-1 font-medium">
                  {stats.schoolsCount} ta maktabda
                </div>
              </div>

              {/* Школы: Учителя */}
              <div className="bg-white p-3.5 rounded-2xl border border-blue-200/80 shadow-xs bg-gradient-to-b from-blue-50/30 to-white">
                <span className="text-[11px] font-semibold text-blue-700 flex items-center">
                  <School className="w-3.5 h-3.5 mr-1" /> {t.stats_school_teachers}
                </span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {stats.schoolTeachers.toLocaleString('uz-UZ')}
                </p>
                <div className="text-[11px] text-blue-600 mt-1 font-medium">
                  {lang === 'uz' ? "O'qituvchilar tarkibi" : 'Педагогический состав'}
                </div>
              </div>

              {/* Детские сады: Воспитанники */}
              <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs bg-gradient-to-b from-emerald-50/30 to-white">
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center">
                  <Baby className="w-3.5 h-3.5 mr-1" /> {t.stats_kindergarten_kids}
                </span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {stats.kindergartenKids.toLocaleString('uz-UZ')}
                </p>
                <div className="text-[11px] text-emerald-600 mt-1 font-medium">
                  {stats.kindergartensCount} ta bog'chada
                </div>
              </div>

              {/* Детские сады: Воспитатели */}
              <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs bg-gradient-to-b from-emerald-50/30 to-white">
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center">
                  <Baby className="w-3.5 h-3.5 mr-1" /> {t.stats_kindergarten_educators}
                </span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {stats.kindergartenEducators.toLocaleString('uz-UZ')}
                </p>
                <div className="text-[11px] text-emerald-600 mt-1 font-medium">
                  {lang === 'uz' ? 'Tarbiyachi va pedagoglar' : 'Воспитатели и педагоги'}
                </div>
              </div>

              {/* Компьютерные классы (Количество классов) */}
              <div className="bg-white p-3.5 rounded-2xl border border-purple-200/80 shadow-xs bg-gradient-to-b from-purple-50/30 to-white">
                <span className="text-[11px] font-semibold text-purple-700 flex items-center">
                  <LayoutGrid className="w-3.5 h-3.5 mr-1" /> {t.stats_comp_classes}
                </span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {stats.totalComputerClasses}
                  <span className="text-xs font-medium text-slate-500 ml-1">
                    {lang === 'uz' ? 'sinf' : 'кл.'}
                  </span>
                </p>
                <div className="text-[11px] text-purple-600 mt-1 font-medium">
                  {t.stats_equipped_classes}
                </div>
              </div>

              {/* Компьютеры (Всего компьютеров) */}
              <div className="bg-white p-3.5 rounded-2xl border border-indigo-200/80 shadow-xs bg-gradient-to-b from-indigo-50/30 to-white">
                <span className="text-[11px] font-semibold text-indigo-700 flex items-center">
                  <Monitor className="w-3.5 h-3.5 mr-1" /> {t.stats_computers}
                </span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {stats.totalComputers.toLocaleString('uz-UZ')}
                  <span className="text-xs font-medium text-slate-500 ml-1">
                    {t.computers_short}
                  </span>
                </p>
                <div className="text-[11px] text-indigo-600 mt-1 font-medium">
                  {lang === 'uz' ? 'Alohida sinflar hisobida' : 'В компьютерных классах'}
                </div>
              </div>
            </div>

            {/* Специальный блок: Раздельная статистика количества компьютеров по годам (начиная с 2020 по 2027) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <Monitor className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-800">
                        {t.stats_computers_by_year_title}
                      </h3>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold text-[10px] rounded-full border border-indigo-100">
                        2020 — 2027
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.stats_computers_by_year_desc}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {selectedYearFilter && (
                    <button
                      onClick={() => setSelectedYearFilter(null)}
                      className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors font-semibold text-xs cursor-pointer shadow-2xs"
                      title={t.stats_clear_year_filter}
                    >
                      <span>{t.stats_filter_by_year}: <strong>{selectedYearFilter}</strong></span>
                      <X className="w-3.5 h-3.5 ml-1.5" />
                    </button>
                  )}
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200">
                    {t.stats_comp_classes}: <strong className="text-slate-900">{stats.totalComputerClasses}</strong>
                  </span>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100">
                    {t.stats_computers}: <strong className="text-indigo-900">{stats.totalComputers}</strong>
                  </span>
                </div>
              </div>

              {/* Сетка годов: 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {stats.computersByYear.map((item) => {
                  const isSelected = selectedYearFilter === item.year;
                  return (
                    <button
                      key={item.year}
                      type="button"
                      onClick={() => setSelectedYearFilter(isSelected ? null : item.year)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'ring-2 ring-indigo-500 bg-indigo-50/80 border-indigo-300 shadow-sm'
                          : item.computers > 0
                          ? 'bg-gradient-to-b from-indigo-50/30 to-white border-indigo-200/80 hover:border-indigo-400 hover:shadow-xs'
                          : 'bg-slate-50/60 border-slate-200/70 opacity-75 hover:opacity-100 hover:border-slate-300'
                      }`}
                      title={`${item.year}${lang === 'uz' ? '-yil' : ' год'}: ${item.computers} ${t.computers_short}, ${item.classes} ${t.comp_classes_short} (${item.percentage}%)`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border shadow-2xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-800 border-slate-200'
                        }`}>
                          {item.year}{lang === 'uz' ? '-y.' : ' г.'}
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-600">
                          {item.percentage}%
                        </span>
                      </div>

                      <p className="text-xl font-extrabold text-slate-900 mt-1">
                        {item.computers}
                        <span className="text-[11px] font-normal text-slate-500 ml-1">
                          {t.computers_short}
                        </span>
                      </p>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                        <span>{item.classes} {t.comp_classes_short}</span>
                      </div>

                      {/* Индикатор доли */}
                      <div className="w-full bg-slate-200/70 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSelected ? 'bg-indigo-700' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Блок фильтров */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-800">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span>{t.filters_title}</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Katak ko'rinishi / Сетка"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Jadval ko'rinishi / Таблица"
                    >
                      <TableIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setModalError(null);
                        setIsAddInstitutionOpen(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      <span>{t.btn_add_inst}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Селекторы каскадной фильтрации */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.region_label}</label>
                  <select
                    value={selectedRegionId}
                    onChange={(e) => {
                      setSelectedRegionId(e.target.value);
                      setSelectedDistrictId('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t.all_regions}</option>
                    {regions.map((reg) => (
                      <option key={reg.id} value={reg.id}>{reg.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.district_label}</label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">
                      {selectedRegionId ? t.all_districts : t.all_districts}
                    </option>
                    {filteredDistrictsForSelect.map((dist) => (
                      <option key={dist.id} value={dist.id}>{dist.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.type_label}</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">{t.all_types}</option>
                    <option value="school">{t.type_schools}</option>
                    <option value="kindergarten">{t.type_kindergartens}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {lang === 'uz' ? 'Qidiruv' : 'Поиск'}
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.search_placeholder}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Список учреждений */}
            {filteredInstitutions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <Building2 className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-base font-bold text-slate-800">{t.not_found_title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  {t.not_found_desc}
                </p>
                {selectedRegionId || selectedDistrictId || selectedType !== 'all' || searchQuery || selectedYearFilter ? (
                  <button
                    onClick={() => {
                      setSelectedRegionId('');
                      setSelectedDistrictId('');
                      setSelectedType('all');
                      setSearchQuery('');
                      setSelectedYearFilter(null);
                    }}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    {t.reset_filters}
                  </button>
                ) : null}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredInstitutions.map((item) => {
                  const isSchool = item.type === 'school';
                  const districtName = districtsMap[item.districtId] || (lang === 'uz' ? "Tuman ko'rsatilmagan" : 'Район не указан');
                  const isNew = item.id === highlightedId;
                  
                  // Расчет суммарного числа ПК
                  const totalComputers = item.computerClasses && item.computerClasses.length > 0
                    ? item.computerClasses.reduce((sum, c) => sum + (Number(c.computersCount) || 0), 0)
                    : (item.computersCount || 0);

                  const classesCount = item.computerClasses && item.computerClasses.length > 0
                    ? item.computerClasses.length
                    : (item.computerClassesCount || 0);

                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelectedInstitutionForView(item)}
                      className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col cursor-pointer relative ${
                        isNew
                          ? 'border-emerald-500 ring-2 ring-emerald-400/30 shadow-lg'
                          : 'border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md'
                      }`}
                    >
                      {/* Верхняя часть с фото */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={`Bosh kirish №${item.number}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <Building2 className="w-10 h-10 opacity-40 mb-1" />
                            <span className="text-xs">{t.photo_missing}</span>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs border ${
                              isSchool
                                ? 'bg-blue-600/90 text-white border-blue-400/40'
                                : 'bg-emerald-600/90 text-white border-emerald-400/40'
                            }`}
                          >
                            {isSchool ? <School className="w-3.5 h-3.5 mr-1" /> : <Baby className="w-3.5 h-3.5 mr-1" />}
                            {isSchool ? t.type_school : t.type_kindergarten}
                          </span>
                          {isNew && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                              <Sparkles className="w-3 h-3 mr-0.5" /> {t.new_badge}
                            </span>
                          )}
                        </div>

                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md">
                            № {item.number}
                          </span>
                        </div>
                      </div>

                      {/* Информация о карточке */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {isSchool ? t.type_school : t.type_kindergarten} № {item.number}
                            </h3>
                            {isAdmin && (
                              <button
                                onClick={(e) => confirmDeleteInstitution(item.id, e)}
                                title={t.btn_delete}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center text-xs text-slate-600 font-medium">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                              <span className="truncate">{districtName}</span>
                            </div>

                            {/* Адрес и кнопка Google Maps */}
                            <div className="flex items-start justify-between gap-1 pt-0.5">
                              <p className="text-xs text-slate-500 line-clamp-1 flex-1 pl-4.5">
                                {item.location || (lang === 'uz' ? 'Manzil kiritilmagan' : 'Адрес не указан')}
                              </p>
                              <button
                                onClick={(e) => openGoogleMap(item, e)}
                                title={t.open_map_btn}
                                className="inline-flex items-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md shrink-0 transition-colors cursor-pointer"
                              >
                                <Navigation className="w-3 h-3 mr-1" />
                                <span>Maps</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Числовые показатели с раздельным учетом */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className={`p-2 rounded-xl ${isSchool ? 'bg-blue-50/70 border border-blue-100' : 'bg-emerald-50/70 border border-emerald-100'}`}>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {isSchool ? t.students_school : t.students_kindergarten}
                              </div>
                              <div className="text-sm font-bold text-slate-900 mt-0.5">
                                {Number(item.studentsCount).toLocaleString('uz-UZ')}
                              </div>
                            </div>
                            <div className={`p-2 rounded-xl ${isSchool ? 'bg-blue-50/70 border border-blue-100' : 'bg-emerald-50/70 border border-emerald-100'}`}>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {isSchool ? t.teachers_school : t.teachers_kindergarten}
                              </div>
                              <div className="text-sm font-bold text-slate-900 mt-0.5">
                                {Number(item.teachersCount).toLocaleString('uz-UZ')}
                              </div>
                            </div>
                          </div>

                          {/* Компьютерные классы (по отдельности) */}
                          <div className="mt-2.5 bg-slate-50 p-2 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
                            <span className="flex items-center font-medium">
                              <Monitor className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                              <span>{totalComputers} {t.computers_short}</span>
                            </span>
                            <span className="text-slate-500">
                              {classesCount > 0 ? `${classesCount} ${t.comp_classes_short}` : '0 sinf'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Табличный вид */
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">{t.th_type_num}</th>
                        <th className="py-3 px-4">{t.th_district}</th>
                        <th className="py-3 px-4">{t.th_address}</th>
                        <th className="py-3 px-4 text-center">{t.th_students}</th>
                        <th className="py-3 px-4 text-center">{t.th_teachers}</th>
                        <th className="py-3 px-4 text-center">{t.th_computers}</th>
                        <th className="py-3 px-4 text-right">{t.th_actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInstitutions.map((item) => {
                        const isSchool = item.type === 'school';
                        const totalComp = item.computerClasses && item.computerClasses.length > 0
                          ? item.computerClasses.reduce((s, c) => s + (Number(c.computersCount) || 0), 0)
                          : (item.computersCount || 0);

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedInstitutionForView(item)}
                            className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  isSchool ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {isSchool ? t.type_school : t.type_kindergarten} № {item.number}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {districtsMap[item.districtId] || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              <div className="flex items-center space-x-2">
                                <span className="truncate max-w-xs">{item.location || '—'}</span>
                                <button
                                  onClick={(e) => openGoogleMap(item, e)}
                                  className="text-indigo-600 hover:text-indigo-800 p-1 shrink-0 cursor-pointer"
                                  title={t.open_map_btn}
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                              <div>{Number(item.studentsCount).toLocaleString('uz-UZ')}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                {isSchool ? t.students_school : t.students_kindergarten}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                              <div>{Number(item.teachersCount).toLocaleString('uz-UZ')}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                {isSchool ? t.teachers_school : t.teachers_kindergarten}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-600">
                              <div>{totalComp} {t.computers_short}</div>
                              <div className="text-[10px] text-slate-400">
                                {item.computerClasses?.length || item.computerClassesCount || 0} {t.comp_classes_short}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setSelectedInstitutionForView(item)}
                                  className="text-indigo-600 hover:text-indigo-800 p-1 cursor-pointer"
                                  title={t.details_btn}
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={(e) => confirmDeleteInstitution(item.id, e)}
                                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                    title={t.btn_delete}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* ВКЛАДКА 2: ОБЛАСТИ И РАЙОНЫ */}
        {/* ============================================================== */}
        {isAdmin && activeTab === 'regions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">{t.regions_title}</h2>
              </div>

              <form onSubmit={handleAddRegion} className="flex space-x-2">
                <input
                  type="text"
                  value={newRegionName}
                  onChange={(e) => setNewRegionName(e.target.value)}
                  placeholder={t.add_region_placeholder}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  {t.add_btn}
                </button>
              </form>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                {regions.map((reg) => {
                  const regDistrictsCount = districts.filter(d => d.regionId === reg.id).length;
                  return (
                    <div key={reg.id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm text-slate-800">{reg.name}</span>
                        <span className="text-xs text-slate-400 ml-2">({regDistrictsCount} {t.district_label.toLowerCase()})</span>
                      </div>
                      <button
                        onClick={() => promptDeleteRegion(reg.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title={t.btn_delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">{t.districts_title}</h2>
              </div>

              <form onSubmit={handleAddDistrict} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={newDistrictRegionId}
                    onChange={(e) => setNewDistrictRegionId(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">{t.select_region_required}</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    placeholder={t.add_district_placeholder}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {t.add_btn}
                </button>
              </form>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                {districts.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-slate-800">{d.name}</span>
                      <div className="text-xs text-indigo-600 font-medium">
                        {regionsMap[d.regionId] || '—'}
                      </div>
                    </div>
                    <button
                      onClick={() => promptDeleteDistrict(d.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title={t.btn_delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ВКЛАДКА 3: НАСТРОЙКИ СМЕНЫ ПАРОЛЯ */}
        {/* ============================================================== */}
        {isAdmin && activeTab === 'settings' && (
          <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{t.settings_title}</h2>
                <p className="text-xs text-slate-500">{t.settings_subtitle}</p>
              </div>
            </div>

            {passwordStatus && (
              <div
                className={`mb-6 p-4 rounded-xl text-xs sm:text-sm flex items-start space-x-2.5 ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {passwordStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                )}
                <span>{passwordStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.new_password_label}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.confirm_password_label}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t.update_password_btn}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* МОДАЛЬНОЕ ОКНО: ДОБАВЛЕНИЕ НОВОГО УЧРЕЖДЕНИЯ */}
      {/* ============================================================== */}
      {isAddInstitutionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddInstitutionOpen(false)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">{t.modal_add_title}</h3>
            <p className="text-xs text-slate-500 mb-5">{t.modal_add_subtitle}</p>

            {modalError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInstitution} className="space-y-4">
              {/* Тип и номер */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.type_label} *</label>
                  <select
                    value={newInst.type}
                    onChange={(e) => setNewInst({ ...newInst, type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="school">{t.type_school}</option>
                    <option value="kindergarten">{t.type_kindergarten}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.field_number}</label>
                  <input
                    type="text"
                    value={newInst.number}
                    onChange={(e) => setNewInst({ ...newInst, number: e.target.value })}
                    placeholder="Masalan: 42"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              {/* Каскадный выбор: Область -> Район */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.region_label} *</label>
                  <select
                    value={newInst.regionId}
                    onChange={(e) => {
                      const regId = e.target.value;
                      setNewInst({ ...newInst, regionId: regId, districtId: '' });
                      setIsQuickAddDistrictOpen(false);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    required
                  >
                    <option value="">-- {t.select_region_required} --</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">{t.district_label} *</label>
                    {newInst.regionId && (
                      <button
                        type="button"
                        onClick={() => setIsQuickAddDistrictOpen(!isQuickAddDistrictOpen)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                      >
                        {isQuickAddDistrictOpen ? (lang === 'uz' ? "Ro'yxatdan tanlash" : 'Выбрать из списка') : t.btn_add_district}
                      </button>
                    )}
                  </div>

                  {!isQuickAddDistrictOpen ? (
                    <select
                      value={newInst.districtId}
                      onChange={(e) => setNewInst({ ...newInst, districtId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      disabled={!newInst.regionId}
                      required
                    >
                      <option value="">
                        {!newInst.regionId
                          ? t.select_region_first
                          : districtsForNewInst.length === 0
                          ? (lang === 'uz' ? "Tumanlar yo'q (+ Tuman qo'shing)" : 'Нет районов (+ Создайте район)')
                          : `-- ${t.district_label} --`}
                      </option>
                      {districtsForNewInst.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        value={quickDistrictName}
                        onChange={(e) => setQuickDistrictName(e.target.value)}
                        placeholder={t.quick_district_name}
                        className="flex-1 px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddDistrict}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Адрес и Google Maps ссылка */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.field_location}</label>
                  <input
                    type="text"
                    value={newInst.location}
                    onChange={(e) => setNewInst({ ...newInst, location: e.target.value })}
                    placeholder="Amir Temur ko'chasi, 12-uy"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{t.field_google_maps}</span>
                    <span className="text-[10px] text-indigo-600 font-normal">https://maps.google.com/...</span>
                  </label>
                  <div className="relative">
                    <Navigation className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="url"
                      value={newInst.googleMapsUrl}
                      onChange={(e) => setNewInst({ ...newInst, googleMapsUrl: e.target.value })}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-indigo-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Загрузка фото главного входа */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.field_photo}
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {newInstImagePreview ? (
                    <div className="relative">
                      <img
                        src={newInstImagePreview}
                        alt="Preview"
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewInstImagePreview('');
                          setNewInstImageFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-dashed border-slate-300">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1.5 shrink-0"></span>
                      <span>{t.field_photo_hint}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Раздельный ввод контингента и педагогов */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {newInst.type === 'school' ? t.students_school : t.students_kindergarten}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newInst.studentsCount}
                    onChange={(e) => setNewInst({ ...newInst, studentsCount: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {newInst.type === 'school' ? t.teachers_school : t.teachers_kindergarten}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newInst.teachersCount}
                    onChange={(e) => setNewInst({ ...newInst, teachersCount: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* КОМПЬЮТЕРНЫЕ КЛАССЫ (ПО ОТДЕЛЬНОСТИ) */}
              <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">{t.classes_section_title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={addComputerClassRow}
                    className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-100/70 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>{t.btn_add_class}</span>
                  </button>
                </div>

                {newComputerClasses.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    {t.no_classes_yet}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {newComputerClasses.map((cls, idx) => (
                      <div key={cls.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex-1 w-full sm:w-auto">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            {idx + 1}-sinf / xona nomi
                          </label>
                          <input
                            type="text"
                            value={cls.name}
                            onChange={(e) => updateComputerClassRow(cls.id, 'name', e.target.value)}
                            placeholder={t.class_name_placeholder}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div className="w-full sm:w-28">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            {t.class_computers_count}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={cls.computersCount}
                            onChange={(e) => updateComputerClassRow(cls.id, 'computersCount', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div className="w-full sm:w-28">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            {t.class_year}
                          </label>
                          <input
                            type="number"
                            min="2000"
                            max="2035"
                            placeholder="2026"
                            value={cls.computersYear || ''}
                            onChange={(e) => updateComputerClassRow(cls.id, 'computersYear', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeComputerClassRow(cls.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer sm:mt-4"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="pt-1 text-right text-xs font-semibold text-indigo-900">
                      Jami: {newComputerClasses.reduce((s, c) => s + (Number(c.computersCount) || 0), 0)} kompyuter ({newComputerClasses.length} sinf)
                    </div>
                  </div>
                )}
              </div>

              {/* Паспортные данные */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.field_passport}</label>
                <textarea
                  rows={2}
                  value={newInst.passportData}
                  onChange={(e) => setNewInst({ ...newInst, passportData: e.target.value })}
                  placeholder="Rekvizitlar, bino tavsifi, ta'lim yo'nalishlari..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Кнопки действия */}
              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddInstitutionOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {t.btn_cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSavingInst}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSavingInst ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{t.btn_saving}</span>
                    </>
                  ) : (
                    <span>{t.btn_save}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* МОДАЛЬНОЕ ОКНО: ДЕТАЛЬНЫЙ ПРОСМОТР ПАСПОРТА */}
      {/* ============================================================== */}
      {selectedInstitutionForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInstitutionForView(null)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                  selectedInstitutionForView.type === 'school' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}
              >
                {selectedInstitutionForView.type === 'school' ? (
                  <School className="w-6 h-6" />
                ) : (
                  <Baby className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {selectedInstitutionForView.type === 'school' ? t.type_school : t.type_kindergarten}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  № {selectedInstitutionForView.number}
                </h3>
              </div>
            </div>

            {selectedInstitutionForView.imageUrl && (
              <div className="mb-5 rounded-2xl overflow-hidden h-48 bg-slate-100">
                <img
                  src={selectedInstitutionForView.imageUrl}
                  alt="Bosh kirish"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Локация и ссылка на Google Maps */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700">{t.district_label}: </span>
                      <span className="text-slate-600">
                        {districtsMap[selectedInstitutionForView.districtId] || '—'}
                      </span>
                      {selectedInstitutionForView.location && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedInstitutionForView.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => openGoogleMap(selectedInstitutionForView, e)}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5" />
                    <span>{t.open_map_btn}</span>
                  </button>
                </div>
              </div>

              {/* Метрики контингента */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="border border-slate-100 bg-slate-50/70 p-3 rounded-2xl">
                  <div className="text-xs text-slate-500 font-medium">
                    {selectedInstitutionForView.type === 'school' ? t.students_school : t.students_kindergarten}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {Number(selectedInstitutionForView.studentsCount).toLocaleString('uz-UZ')}
                  </div>
                </div>
                <div className="border border-slate-100 bg-slate-50/70 p-3 rounded-2xl">
                  <div className="text-xs text-slate-500 font-medium">
                    {selectedInstitutionForView.type === 'school' ? t.teachers_school : t.teachers_kindergarten}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {Number(selectedInstitutionForView.teachersCount).toLocaleString('uz-UZ')}
                  </div>
                </div>
              </div>

              {/* Детальный список компьютерных классов (по отдельности) */}
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="font-semibold text-slate-800 block mb-2.5 flex items-center">
                  <Monitor className="w-4 h-4 mr-1.5 text-indigo-600" />
                  <span>{t.passport_equip_title}</span>
                </span>

                {selectedInstitutionForView.computerClasses && selectedInstitutionForView.computerClasses.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInstitutionForView.computerClasses.map((cls, i) => (
                      <div key={cls.id || i} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-800 block">{cls.name || `${i + 1}-informatika xonasi`}</strong>
                          <span className="text-slate-400 text-[11px]">
                            {cls.computersYear ? `${cls.computersYear}-yil` : 'Yetkazilgan yili koʻrsatilmagan'}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100 text-xs">
                          {cls.computersCount} {t.computers_short}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1.5 flex justify-between text-xs font-semibold text-slate-700 px-1">
                      <span>Jami sinflar: {selectedInstitutionForView.computerClasses.length} ta</span>
                      <span>Jami kompyuterlar: {selectedInstitutionForView.computerClasses.reduce((s, c) => s + (Number(c.computersCount) || 0), 0)} ta</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Sinflar:</span>
                      <strong className="text-slate-800 text-sm">{selectedInstitutionForView.computerClassesCount || 0} ta</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Kompyuterlar:</span>
                      <strong className="text-slate-800 text-sm">{selectedInstitutionForView.computersCount || 0} ta</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Yili:</span>
                      <strong className="text-slate-800 text-sm">{selectedInstitutionForView.computersYear || '—'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Паспортные данные */}
              {selectedInstitutionForView.passportData && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    {t.field_passport}:
                  </span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedInstitutionForView.passportData}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedInstitutionForView(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {t.close_btn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* МОДАЛЬНОЕ ОКНО: GOOGLE MAPS XARITA */}
      {/* ============================================================== */}
      {googleMapModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setGoogleMapModal({ isOpen: false, title: '', locationText: '', url: '' })}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{googleMapModal.title}</h3>
                <p className="text-xs text-slate-500">{googleMapModal.locationText}</p>
              </div>
            </div>

            {/* Встроенная карта Google Maps */}
            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-80 relative">
              <iframe
                title="Google Maps"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(googleMapModal.locationText)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-400">Google Maps koordinatalari</span>
              <div className="flex items-center space-x-2">
                <a
                  href={googleMapModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>{t.map_open_external}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
                <button
                  onClick={() => setGoogleMapModal({ isOpen: false, title: '', locationText: '', url: '' })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t.close_btn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* МОДАЛЬНОЕ ОКНО: ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ */}
      {/* ============================================================== */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              {deleteConfirm.title}
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              {deleteConfirm.message}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, type: 'institution', title: '', message: '' })}
                className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                {t.btn_cancel}
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t.btn_delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
