/* ============================================================================
 * ФАЙЛ: src/integrations/supabase/client.ts — Единое подключение сайта к базе Supabase
 * ЗА ЧТО ОТВЕЧАЕТ: Создаёт одно подключение к базе и переиспользует его во всех частях сайта.
 *   Здесь же Supabase запоминает вход пользователя в браузере, поэтому после входа
 *   не нужно вводить пароль заново при каждом переходе между страницами.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Адрес и ключ из src/integrations/supabase/config.ts.
 * КАК ИЗМЕНИТЬ: Обычно менять не требуется. Чтобы использовать базу в своём коде,
 *   напишите `const supabase = getSupabaseClient();` — функция вернёт готовое подключение
 *   или null, если данные подключения ещё не вписаны.
 * ========================================================================= */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

let cached: SupabaseClient | null = null;

/* БЛОК: Получение подключения к базе (getSupabaseClient)
 * ЗА ЧТО ОТВЕЧАЕТ: Создаёт подключение при первом обращении и возвращает его дальше по сайту.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Конфигурация из config.ts.
 * КАК ИЗМЕНИТЬ: Ключ storageKey отвечает за имя папки с сохранённым входом в браузере —
 *   менять его не стоит, иначе придётся входить заново. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "stroikacalc:supabase-auth",
      },
    });
  }
  return cached;
}
