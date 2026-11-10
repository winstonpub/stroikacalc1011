/* ============================================================================
 * ФАЙЛ: src/utils/adminSession.ts — Признак входа в панель «Администрирование»
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит и сообщает всем частям сайта, что администратор вошёл в панель.
 *   Благодаря этому шапка сайта показывает кнопку «Администрирование» только владельцу сайта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Вход проверяется по базе данных Supabase
 *   (src/integrations/supabase/adminAuth.ts): почта, пароль и запись в таблице admins.
 * КАК ИЗМЕНИТЬ: Доступ выдаётся не паролем из кода, а аккаунтом в Supabase.
 *   Чтобы добавить администратора — создайте аккаунт в Supabase → Authentication → Users
 *   и добавьте его почту в таблицу admins (подробнее — SUPABASE.md).
 * ========================================================================= */

import {
  getAdminIdentity,
  initAdminAuth,
  signOutAdmin,
  subscribeAdminIdentity,
} from "../integrations/supabase/adminAuth";

/* БЛОК: Проверка текущего состояния сессии (isAdminUnlocked)
 * ЗА ЧТО ОТВЕЧАЕТ: Возвращает true, если в этом браузере администратор вошёл в панель управления.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из проверенной сессии Supabase (src/integrations/supabase/adminAuth.ts).
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export function isAdminUnlocked(): boolean {
  return getAdminIdentity() !== null;
}

/* БЛОК: Данные вошедшего администратора (getAdminSessionInfo)
 * ЗА ЧТО ОТВЕЧАЕТ: Возвращает почту и роль вошедшего пользователя для показа в шапке админки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Таблица admins базы Supabase.
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export function getAdminSessionInfo(): { email: string; role: string; warning?: string } | null {
  return getAdminIdentity();
}

/* БЛОК: Вход и выход из панели (unlockAdmin, lockAdmin)
 * ЗА ЧТО ОТВЕЧАЕТ: Фиксирует состояние входа и оповещает шапку сайта, чтобы кнопка
 *   «Администрирование» появилась или скрылась без перезагрузки страницы.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Вход выполняется на странице #/admin через signInAdmin(),
 *   выход — кнопкой «Заблокировать».
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export function unlockAdmin(): void {
  // Вход подтверждает Supabase; отдельная разблокировка не нужна.
}

export function lockAdmin(): void {
  void signOutAdmin();
}

/* БЛОК: Подписка на изменение состояния сессии (subscribeAdminSession)
 * ЗА ЧТО ОТВЕЧАЕТ: Позволяет шапке сайта мгновенно показать или скрыть кнопку «Администрирование».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: События входа и выхода из src/integrations/supabase/adminAuth.ts.
 * КАК ИЗМЕНИТЬ: Не требует изменений. */
export function subscribeAdminSession(listener: () => void): () => void {
  return subscribeAdminIdentity(listener);
}

/* БЛОК: Запуск проверки входа при открытии сайта (initAdminSession)
 * ЗА ЧТО ОТВЕЧАЕТ: Восстанавливает прежний вход администратора и следит за выходом из аккаунта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Сохранённая сессия Supabase в браузере.
 * КАК ИЗМЕНИТЬ: Вызывается один раз в src/main.tsx. */
export function initAdminSession(): void {
  initAdminAuth();
}
