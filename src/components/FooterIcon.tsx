/* ============================================================================
 * ФАЙЛ: src/components/FooterIcon.tsx — Набор значков для строк магазина в подвале
 * ЗА ЧТО ОТВЕЧАЕТ: Связывает текстовый код значка ("pin", "clock", "phone" и т.д.) с векторной иконкой Lucide и её русской подписью для кнопок выбора в админке и отображения в подвале сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Список допустимых ключей FooterIconKey задан в src/data/siteSettings.ts, сами иконки — из пакета lucide-react.
 * КАК ИЗМЕНИТЬ: Чтобы добавить новую иконку, импортируйте её из "lucide-react", добавьте ключ в FOOTER_ICON_KEYS в src/data/siteSettings.ts и пропишите соответствие в словарях FOOTER_ICONS и FOOTER_ICON_TITLES ниже.
 * ========================================================================= */

import { Clock, CreditCard, Globe, Mail, MapPin, Phone, Store, Truck } from "lucide-react";
import type { FooterIconKey } from "../data/siteSettings";

/* БЛОК: Словари соответствия ключей иконкам и их названиям (FOOTER_ICONS, FOOTER_ICON_TITLES)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит 8 готовых пиктограмм (Адрес, Часы работы, Телефон, Почта, Доставка, Магазин, Сайт, Оплата) и подсказки при наведении в админке.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Библиотека иконок lucide-react.
 * КАК ИЗМЕНИТЬ: Поменяйте текст в FOOTER_ICON_TITLES, чтобы изменить всплывающую подсказку кнопки выбора значка в админке. */
export const FOOTER_ICONS: Record<FooterIconKey, typeof MapPin> = {
  pin: MapPin,
  clock: Clock,
  phone: Phone,
  mail: Mail,
  truck: Truck,
  store: Store,
  globe: Globe,
  card: CreditCard,
};

export const FOOTER_ICON_TITLES: Record<FooterIconKey, string> = {
  pin: "Адрес",
  clock: "Часы работы",
  phone: "Телефон",
  mail: "Почта",
  truck: "Доставка",
  store: "Магазин",
  globe: "Сайт",
  card: "Оплата",
};

/* БЛОК: Компонент вывода значка строки подвала (FooterIcon)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует выбранную иконку нужного размера рядом с текстом в подвале сайта и в редакторе админки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Находит компонент иконки по имени name в словаре FOOTER_ICONS (если ключ неизвестен — ставит MapPin).
 * КАК ИЗМЕНИТЬ: Размер значка по умолчанию задаётся в size = 15. */
export function FooterIcon({
  name,
  size = 15,
  className,
  strokeWidth = 2.3,
}: {
  name: FooterIconKey;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = FOOTER_ICONS[name] ?? MapPin;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
