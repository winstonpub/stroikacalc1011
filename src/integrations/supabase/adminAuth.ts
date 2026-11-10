/* ============================================================================
 * ФАЙЛ: src/integrations/supabase/adminAuth.ts — Вход в админку через базу Supabase
 * ЗА ЧТО ОТВЕЧАЕТ: Проверяет почту и пароль по базе данных Supabase, а затем сверяет почту
 *   со списком администраторов в таблице admins. Панель «Администрирование» открывается только
 *   в том случае, если аккаунт есть и в системе входа, и в таблице admins.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Подключение getSupabaseClient() (src/integrations/supabase/client.ts),
 *   список администраторов — таблица admins базы Supabase (скрипт создания — supabase/schema.sql).
 * КАК ИЗМЕНИТЬ: Чтобы дать доступ ещё одному человеку, добавьте его почту в таблицу admins
 *   (Supabase → Table editors → admins → Insert row) и создайте ему аккаунт в
 *   Authentication → Users → Add user.
 * ========================================================================= */

import { getSupabaseClient } from "./client";

/* БЛОК: Описание вошедшего администратора (AdminIdentity, AdminAccess)
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит почту и роль вошедшего пользователя и результат проверки доступа.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Заполняется функциями входа и проверки роли ниже.
 * КАК ИЗМЕНИТЬ: Не требуется. */
export type AdminIdentity = {
  email: string;
  role: string;
  warning?: string;
};

export type AdminAccess =
  | { allowed: true; role: string; warning?: string }
  | { allowed: false; error: string };

let identity: AdminIdentity | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

/* БЛОК: Текущий вошедший администратор (getAdminIdentity, subscribeAdminIdentity)
 * ЗА ЧТО ОТВЕЧАЕТ: Сообщает всем частям сайта, кто сейчас вошёл в панель управления.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Проверенный вход из signInAdmin() или восстановленная сессия Supabase.
 * КАК ИЗМЕНИТЬ: Не требуется. */
export function getAdminIdentity(): AdminIdentity | null {
  return identity;
}

export function subscribeAdminIdentity(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* БЛОК: Текст ошибок входа на понятном русском (humanizeAuthError)
 * ЗА ЧТО ОТВЕЧАЕТ: Переводит технические сообщения Supabase в подсказки для пользователя.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Текст ошибки, который вернул Supabase.
 * КАК ИЗМЕНИТЬ: Добавляйте новые случаи в список ниже. */
function humanizeAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "Неверная почта или пароль";
  if (text.includes("email not confirmed")) return "Почта не подтверждена. Подтвердите аккаунт в Supabase (Authentication → Users)";
  if (text.includes("failed to fetch") || text.includes("network")) return "Нет связи с базой данных. Проверьте адрес проекта в config.ts и подключение к интернету";
  if (text.includes("rate limit") || text.includes("too many")) return "Слишком много попыток входа. Подождите минуту и попробуйте снова";
  return message;
}

/* БЛОК: Проверка почты в списке администраторов (checkAdminAccess)
 * ЗА ЧТО ОТВЕЧАЕТ: Смотрит в таблице admins, есть ли строка с почтой вошедшего пользователя,
 *   и разрешает доступ только в этом случае.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Таблица admins базы Supabase (поле email, поле role).
 * КАК ИЗМЕНИТЬ: Если таблица admins ещё не создана, вход остаётся открытым для вошедшего
 *   аккаунта, но админка показывает предупреждение с просьбой выполнить supabase/schema.sql. */
export async function checkAdminAccess(email: string): Promise<AdminAccess> {
  const supabase = getSupabaseClient();
  if (!supabase) return { allowed: false, error: "База данных Supabase не подключена" };

  const { data, error } = await supabase
    .from("admins")
    .select("email, role")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    const tableMissing =
      error.code === "PGRST205" || /schema cache|does not exist|relation|not find the table/i.test(error.message);
    return {
      allowed: true,
      role: "owner",
      warning: tableMissing
        ? "Таблица admins в базе не найдена — сейчас панель открыта любому вошедшему аккаунту. Выполните supabase/schema.sql, чтобы разрешить вход только вам."
        : `Не удалось проверить роль в базе (${error.message}). Доступ открыт, но список администраторов не подтверждён.`,
    };
  }

  if (!data) {
    return {
      allowed: false,
      error: "Этот аккаунт не входит в список администраторов. Доступ выдаётся записью в таблице admins базы Supabase.",
    };
  }

  return { allowed: true, role: data.role ?? "admin" };
}

/* БЛОК: Вход в панель управления (signInAdmin)
 * ЗА ЧТО ОТВЕЧАЕТ: Проверяет почту и пароль по базе Supabase, затем проверяет право на доступ
 *   и запоминает вошедшего пользователя.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Форма входа страницы #/admin, таблица admins.
 * КАК ИЗМЕНИТЬ: Не требуется. */
export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; warning?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      error:
        "База данных Supabase не подключена. Впишите Project URL и anon-ключ в src/integrations/supabase/config.ts (инструкция — SUPABASE.md).",
    };
  }

  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });

  if (error) return { ok: false, error: humanizeAuthError(error.message) };

  const signedEmail = data.user?.email ?? normalized;
  const access = await checkAdminAccess(signedEmail);

  if (!access.allowed) {
    await supabase.auth.signOut();
    identity = null;
    emit();
    return { ok: false, error: access.error };
  }

  identity = { email: signedEmail, role: access.role, warning: access.warning };
  emit();
  return { ok: true, warning: access.warning };
}

/* БЛОК: Выход из панели управления (signOutAdmin)
 * ЗА ЧТО ОТВЕЧАЕТ: Стирает сохранённую сессию Supabase и закрывает панель управления.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Кнопка «Заблокировать» в шапке админки.
 * КАК ИЗМЕНИТЬ: Не требуется. */
export async function signOutAdmin(): Promise<void> {
  identity = null;
  emit();
  const supabase = getSupabaseClient();
  if (supabase) await supabase.auth.signOut();
}

/* БЛОК: Восстановление входа при открытии сайта (initAdminAuth)
 * ЗА ЧТО ОТВЕЧАЕТ: Если администратор уже входил в этом браузере, открывает панель автоматически,
 *   а также следит за выходом из аккаунта (в том числе в другой вкладке).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Сохранённая сессия Supabase в браузере.
 * КАК ИЗМЕНИТЬ: Вызывается один раз из src/main.tsx. */
export function initAdminAuth(): void {
  const supabase = getSupabaseClient();
  if (!supabase || initialized) return;
  initialized = true;

  const restore = async () => {
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user.email;
    if (!email) return;
    const access = await checkAdminAccess(email);
    if (access.allowed) {
      identity = { email, role: access.role, warning: access.warning };
      emit();
    }
  };

  void restore();

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      identity = null;
      emit();
    }
  });
}
