/* ============================================================================
 * ФАЙЛ: src/integrations/supabase/config.ts — Адрес и ключ базы данных Supabase
 * ЗА ЧТО ОТВЕЧАЕТ: Хранит два «адреса» вашей базы данных: URL проекта и публичный (anon) ключ.
 *   Без них сайт работает как обычно, но вход в «Администрирование» остаётся закрытым.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Из строк ниже (можно вписать значения прямо сюда) либо из переменных
 *   окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY, если они заданы при сборке.
 * КАК ИЗМЕНИТЬ: В панели Supabase откройте Project Settings → API и скопируйте:
 *   1) Project URL → в SUPABASE_URL (строка вида https://abcdefgh.supabase.co);
 *   2) anon / public key → в SUPABASE_ANON_KEY (длинная строка, начинающаяся с eyJ).
 *   Подробная инструкция — в файле SUPABASE.md в корне проекта.
 *   Ключ anon публичный по замыслу Supabase: он не даёт доступа к данным без входа,
 *   потому что все таблицы защищены политиками RLS.
 * ========================================================================= */

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

/* БЛОК: Данные для подключения (SUPABASE_URL, SUPABASE_ANON_KEY)
 * ЗА ЧТО ОТВЕЧАЕТ: Единственное место, которое нужно заполнить, чтобы сайт связался с базой.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Project Settings → API в панели Supabase.
 * КАК ИЗМЕНИТЬ: Замените текст в кавычках на свои значения и сохраните файл, затем выполните сборку. */
export const SUPABASE_URL = (env.VITE_SUPABASE_URL ?? "").trim() || "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY ?? "").trim() || "YOUR-ANON-PUBLIC-KEY";

/* БЛОК: Проверка, заполнены ли данные подключения (isSupabaseConfigured)
 * ЗА ЧТО ОТВЕЧАЕТ: Говорит сайту, подключена ли база данных, или в конфиге всё ещё стоят заглушки.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Значения SUPABASE_URL и SUPABASE_ANON_KEY выше.
 * КАК ИЗМЕНИТЬ: Не требуется. Пока подключение не заполнено, страница входа показывает подсказку. */
export function isSupabaseConfigured(): boolean {
  const urlOk = /^https?:\/\/[^\s/]+\/?$/i.test(SUPABASE_URL) && !SUPABASE_URL.includes("YOUR-PROJECT");
  const keyOk = SUPABASE_ANON_KEY.length > 40 && !SUPABASE_ANON_KEY.startsWith("YOUR-");
  return urlOk && keyOk;
}

/* БЛОК: Короткое описание состояния подключения для админки (describeSupabaseConfig)
 * ЗА ЧТО ОТВЕЧАЕТ: Возвращает текст, который показывается в панели «База данных».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: isSupabaseConfigured() и SUPABASE_URL.
 * КАК ИЗМЕНИТЬ: Тексты сообщений меняются прямо в этом блоке. */
export function describeSupabaseConfig(): { configured: boolean; label: string; detail: string } {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      label: "База данных не подключена",
      detail:
        "Впишите Project URL и anon-ключ в src/integrations/supabase/config.ts — инструкция в файле SUPABASE.md.",
    };
  }
  return {
    configured: true,
    label: "Supabase подключён",
    detail: SUPABASE_URL.replace(/^https:\/\//, ""),
  };
}
