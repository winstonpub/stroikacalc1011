/* ============================================================================
 * ФАЙЛ: src/components/admin/SiteAuditSection.tsx — Вкладка «ИИ» (кнопку убрали из админки, файл сейчас не подключён)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает аудит сайта простым языком: какие есть недочёты, чем каждый грозит,
 *   как исправить по шагам и что именно поменять. Фильтр по важности и статусу, поиск по тексту.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Справочник SITE_AUDIT из src/data/siteAudit.ts.
 * КАК ИЗМЕНИТЬ: Описания проблем правятся в src/data/siteAudit.ts; оформление карточек — здесь.
 * ========================================================================= */

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Filter, MapPin, Search, Sparkles, Wrench } from "lucide-react";
import {
  AUDIT_PRIORITY_META,
  SITE_AUDIT,
  countAudit,
  type AuditPriority,
  type AuditStatus,
} from "../../data/siteAudit";
import { cn } from "../../utils/cn";

type FilterId = "all" | AuditPriority | AuditStatus;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "critical", label: "Критично" },
  { id: "important", label: "Важно" },
  { id: "minor", label: "Желательно" },
  { id: "done", label: "Исправлено" },
];

export default function SiteAuditSection() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const counts = useMemo(() => countAudit(), []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = SITE_AUDIT.filter((item) => {
      if (filter === "all") return true;
      return item.priority === filter || item.status === filter;
    }).filter((item) => {
      if (!q) return true;
      return [item.title, item.problem, item.fix, item.where, item.category].some((t) =>
        t.toLowerCase().includes(q),
      );
    });

    const byCategory = new Map<string, typeof shown>();
    for (const item of shown) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return [...byCategory.entries()].map(([title, items]) => ({ title, items }));
  }, [query, filter]);

  return (
    <div className="space-y-4">
      {/* БЛОК: Введение и сводка | ЗА ЧТО ОТВЕЧАЕТ: Объясняет, что это за список и как им пользоваться */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_10px_rgba(20,25,27,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[14px] font-black text-graphite">
              <Sparkles size={18} strokeWidth={2.4} className="text-pro" />
              Разбор сайта: недочёты и что поменять
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite/60">
              Проверены настройки безопасности, подключение внешних сервисов, скорость загрузки,
              оформление для поисковиков и состояние кода. Для каждой проблемы указано: в чём дело,
              как исправить по шагам и где именно это менять. Закрыли задачу — пометьте её вручную
              в файле src/data/siteAudit.ts (status: &quot;done&quot;).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-smoke px-3 py-2 text-graphite">
              <div className="text-[20px] font-black leading-none tabular">{counts.total}</div>
              <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wider opacity-70">Всего</div>
            </div>
            <div className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
              <div className="text-[20px] font-black leading-none tabular">{counts.critical}</div>
              <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wider opacity-80">Критично</div>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
              <div className="text-[20px] font-black leading-none tabular">{counts.important}</div>
              <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wider opacity-80">Важно</div>
            </div>
            <div className="rounded-xl bg-sky-50 px-3 py-2 text-sky-700">
              <div className="text-[20px] font-black leading-none tabular">{counts.minor}</div>
              <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wider opacity-80">Желательно</div>
            </div>
          </div>
        </div>
      </div>

      {/* БЛОК: С чего начать | ЗА ЧТО ОТВЕЧАЕТ: Короткий чек-лист первых действий */}
      <div className="rounded-2xl border border-pro/40 bg-pro/[0.08] p-4">
        <div className="flex items-center gap-2 text-[13px] font-black text-graphite">
          <Wrench size={16} strokeWidth={2.4} />
          С чего начать — 4 шага
        </div>
        <ol className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            "Вписать адрес и ключ базы Supabase в src/integrations/supabase/config.ts.",
            "Выполнить supabase/schema.sql и создать свой аккаунт в Supabase.",
            "Сменить пароль записи в Google Apps Script и обновить его в админке.",
            "Отключить регистрацию новых пользователей в Supabase.",
          ].map((step, i) => (
            <li key={step} className="flex items-start gap-2 rounded-xl border border-line bg-white/80 px-3 py-2 text-[12.5px] leading-relaxed text-graphite/80">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-graphite text-[11px] font-black text-pro">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* БЛОК: Поиск и фильтр */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search size={14} strokeWidth={2.4} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по недочётам и рекомендациям"
            aria-label="Поиск по аудиту"
            className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-[13px] font-semibold outline-none transition-colors focus:border-pro"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-smoke p-1" role="group" aria-label="Фильтр аудита">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11.5px] font-extrabold transition-colors",
                filter === item.id
                  ? "bg-graphite text-white shadow-sm"
                  : "text-graphite/60 hover:bg-white hover:text-graphite",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* БЛОК: Проблемы по категориям | ЗА ЧТО ОТВЕЧАЕТ: Карточка на каждую проблему */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-[13px] font-semibold text-graphite/50">
          Ничего не найдено. Измените запрос или фильтр.
        </div>
      ) : (
        groups.map((group) => (
          <section
            key={group.title}
            className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_10px_rgba(20,25,27,0.03)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-smoke/60 px-4 py-3">
              <div className="flex items-center gap-2 text-[13.5px] font-black text-graphite">
                <Filter size={15} strokeWidth={2.4} className="text-graphite/45" />
                {group.title}
              </div>
              <span className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold tabular text-graphite/60">
                {group.items.length}
              </span>
            </div>
            <ul className="divide-y divide-line/70">
              {group.items.map((item) => {
                const meta = AUDIT_PRIORITY_META[item.priority];
                const done = item.status === "done";
                return (
                  <li key={item.id} className={cn("px-4 py-3.5", done && "bg-emerald-50/40")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider",
                          meta.className,
                        )}
                      >
                        <AlertTriangle size={11} strokeWidth={2.6} />
                        {meta.label}
                      </span>
                      {done && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-700">
                          <CheckCircle2 size={11} strokeWidth={2.6} />
                          Исправлено
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1.5 text-[13.5px] font-black leading-snug text-graphite">{item.title}</h3>

                    <p className="mt-1 text-[12.5px] leading-relaxed text-graphite/80">
                      <b className="text-graphite/90">В чём дело:</b> {item.problem}
                    </p>
                    <p className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2.5 py-2 text-[12.5px] leading-relaxed text-emerald-900">
                      <b>Как исправить:</b> {item.fix}
                    </p>
                    <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-relaxed text-graphite/55">
                      <MapPin size={13} strokeWidth={2.3} className="mt-0.5 shrink-0 text-graphite/40" />
                      <span>
                        <b className="text-graphite/70">Где менять:</b> {item.where}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
