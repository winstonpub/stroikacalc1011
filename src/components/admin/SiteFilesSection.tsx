/* ============================================================================
 * ФАЙЛ: src/components/admin/SiteFilesSection.tsx — Вкладка «Файлы» (кнопку убрали из админки, файл сейчас не подключён)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает все файлы сайта по группам с пояснением, за что каждый отвечает и где
 *   используется. Файлы, которые ни на что не влияют, выделены отдельно с объяснением, почему они ещё лежат
 *   в проекте. Есть поиск по названию и описанию и фильтр: все / на сайте / служебные / не используются.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Справочник SITE_FILE_GROUPS из src/data/siteFiles.ts.
 * КАК ИЗМЕНИТЬ: Описания файлов правятся в src/data/siteFiles.ts; внешний вид карточек — здесь.
 * ========================================================================= */

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileCode2, Search, Wrench } from "lucide-react";
import { SITE_FILE_GROUPS, countSiteFiles, type SiteFileStatus } from "../../data/siteFiles";
import { cn } from "../../utils/cn";

type Filter = "all" | SiteFileStatus;

/* БЛОК: Подписи и цвета статусов (STATUS_META)
 * ЗА ЧТО ОТВЕЧАЕТ: Единое оформление плашек «На сайте», «Служебный», «Не используется».
 * КАК ИЗМЕНИТЬ: Тексты и цвета — в объекте ниже. */
const STATUS_META: Record<SiteFileStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  used: { label: "На сайте", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  service: { label: "Служебный", className: "border-sky-200 bg-sky-50 text-sky-700", icon: Wrench },
  unused: { label: "Не используется", className: "border-amber-300 bg-amber-50 text-amber-800", icon: AlertTriangle },
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "used", label: "На сайте" },
  { id: "service", label: "Служебные" },
  { id: "unused", label: "Не используются" },
];

export default function SiteFilesSection() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const counts = useMemo(() => countSiteFiles(), []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SITE_FILE_GROUPS.map((group) => ({
      ...group,
      files: group.files.filter((file) => {
        if (filter !== "all" && file.status !== filter) return false;
        if (!q) return true;
        return [file.path, file.purpose, file.usedBy ?? "", file.why ?? ""].some((text) => text.toLowerCase().includes(q));
      }),
    })).filter((group) => group.files.length > 0);
  }, [query, filter]);

  const unusedFiles = SITE_FILE_GROUPS.flatMap((group) => group.files.filter((file) => file.status === "unused"));

  return (
    <div className="space-y-4">
      {/* БЛОК: Сводка и подсказка | ЗА ЧТО ОТВЕЧАЕТ: Сколько файлов в проекте и что означают статусы */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_10px_rgba(20,25,27,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[14px] font-black text-graphite">
              <FileCode2 size={18} strokeWidth={2.4} className="text-pro" />
              Все файлы сайта
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite/60">
              Список составлен по коду сайта: для каждого файла указано, что он делает и где подключается.
              «На сайте» — файл работает на страницах. «Служебный» — нужен для сборки, публикации, проверок
              или инструкции, но на страницы не попадает. «Не используется» — ни на что не влияет.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Всего", value: counts.total, className: "bg-smoke text-graphite" },
              { label: "На сайте", value: counts.used, className: "bg-emerald-50 text-emerald-700" },
              { label: "Служебных", value: counts.service, className: "bg-sky-50 text-sky-700" },
              { label: "Не используются", value: counts.unused, className: "bg-amber-50 text-amber-800" },
            ].map((stat) => (
              <div key={stat.label} className={cn("rounded-xl px-3 py-2", stat.className)}>
                <div className="text-[20px] font-black leading-none tabular">{stat.value}</div>
                <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wider opacity-70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* БЛОК: Неиспользуемые файлы отдельной плашкой | ЗА ЧТО ОТВЕЧАЕТ: Сразу показывает, что можно удалить и почему файл ещё есть */}
      {unusedFiles.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-[13px] font-black text-amber-900">
            <AlertTriangle size={16} strokeWidth={2.4} />
            Файлы, которые ни на что не влияют: {unusedFiles.length}
          </div>
          <ul className="mt-2 space-y-2">
            {unusedFiles.map((file) => (
              <li key={file.path} className="rounded-xl border border-amber-200 bg-white/70 px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-950">
                <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[12px] font-bold">{file.path}</code>
                <span className="ml-1.5">— {file.purpose}</span>
                {file.why && <div className="mt-1 text-amber-900/80"><b>Почему ещё существует:</b> {file.why}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* БЛОК: Поиск и фильтр */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search size={14} strokeWidth={2.4} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию или описанию файла"
            aria-label="Поиск по файлам"
            className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-[13px] font-semibold outline-none transition-colors focus:border-pro"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-smoke p-1" role="group" aria-label="Фильтр файлов">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11.5px] font-extrabold transition-colors",
                filter === item.id ? "bg-graphite text-white shadow-sm" : "text-graphite/60 hover:bg-white hover:text-graphite",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* БЛОК: Группы файлов | ЗА ЧТО ОТВЕЧАЕТ: Карточка на каждый файл: путь, статус, назначение, где используется */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-[13px] font-semibold text-graphite/50">
          Ничего не найдено. Измените запрос или фильтр.
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_10px_rgba(20,25,27,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-smoke/60 px-4 py-3">
              <div>
                <div className="text-[13.5px] font-black text-graphite">{group.title}</div>
                <div className="text-[12px] font-medium text-graphite/55">{group.description}</div>
              </div>
              <span className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold tabular text-graphite/60">
                {group.files.length} {group.files.length === 1 ? "файл" : group.files.length < 5 ? "файла" : "файлов"}
              </span>
            </div>
            <ul className="divide-y divide-line/70">
              {group.files.map((file) => {
                const meta = STATUS_META[file.status];
                const Icon = meta.icon;
                return (
                  <li key={file.path} className={cn("px-4 py-3", file.status === "unused" && "bg-amber-50/40")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-smoke px-1.5 py-0.5 text-[12px] font-bold text-graphite">{file.path}</code>
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider", meta.className)}>
                        <Icon size={11} strokeWidth={2.6} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite/80">{file.purpose}</p>
                    {file.usedBy && (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-graphite/55">
                        <b className="text-graphite/70">Где используется:</b> {file.usedBy}
                      </p>
                    )}
                    {file.why && (
                      <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] leading-relaxed text-amber-900">
                        <b>Почему ещё существует:</b> {file.why}
                      </p>
                    )}
                    {file.warning && (
                      <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] leading-relaxed text-amber-900">
                        <b>Обратите внимание:</b> {file.warning}
                      </p>
                    )}
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
