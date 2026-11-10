/* ============================================================================
 * ФАЙЛ: src/components/SpecSheet.tsx — Общий печатный лист «Спецификация материалов» (Грильято и Армстронг)
 * ЗА ЧТО ОТВЕЧАЕТ: Содержит единую разметку сметы — сетку параметров и таблицу позиций с итогом. Её использует кнопка «Печать» в калькуляторах «Грильято» и «Армстронг».
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Результат расчёта (calcGrilyato / calcArmstrong) и выбранные параметры передаются из вызывающего компонента.
 * КАК ИЗМЕНИТЬ: Подписи колонок, текст предупреждения о ценах и состав плашек параметров меняются здесь; правила печатного листа A4 — в src/index.css (@media print).
 * ========================================================================= */

import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";
import { fmt, fmt1, fmtPrice, type CalcInput, type CalcResult } from "../data/grilyato";
import { getArmstrongAngle, getArmstrongProfile, getArmstrongTile } from "../data/armstrong";
import ArticleCell from "./ArticleCell";
import { cn } from "../utils/cn";

export interface SpecParam {
  k: string;
  v: string;
}

export const GRILYATO_SPEC_TITLE = "Спецификация материалов Грильято";
export const ARMSTRONG_SPEC_TITLE = "Спецификация материалов Армстронг";

/* БЛОК: Плашки параметров над таблицей (grilyatoSpecParams, armstrongSpecParams)
 * ЗА ЧТО ОТВЕЧАЕТ: Формируют список из 8 карточек с исходными данными расчёта.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Введённые размеры помещения и результат расчёта.
 * КАК ИЗМЕНИТЬ: Поправьте подписи k и значения v в массивах ниже. */
export function grilyatoSpecParams(input: CalcInput, res: CalcResult): SpecParam[] {
  const colorLabel =
    res.color.name.toLowerCase() === res.color.ral.toLowerCase()
      ? res.color.name
      : `${res.color.name} · ${res.color.ral}`;
  return [
    { k: "Помещение", v: `${fmt1(input.length)} × ${fmt1(input.width)} м` },
    { k: "Площадь", v: `${fmt1(res.area)} м²` },
    { k: "Периметр", v: `${fmt1(res.perimeter)} м` },
    { k: "Ячейка", v: `${res.cell.label} мм` },
    { k: "Цвет", v: colorLabel },
    { k: "Подвес", v: res.hanger.name },
    { k: "Запас", v: `${input.sparePct}%` },
    { k: "Решётка 600×600", v: `${fmt1(res.reshetka)} шт` },
  ];
}

export function armstrongSpecParams(
  input: CalcInput,
  res: CalcResult,
  tileId: string,
  profileId: string,
  angleId: string,
): SpecParam[] {
  return [
    { k: "Помещение", v: `${fmt1(input.length)} × ${fmt1(input.width)} м` },
    { k: "Площадь", v: `${fmt1(res.area)} м²` },
    { k: "Периметр", v: `${fmt1(res.perimeter)} м` },
    { k: "Плита", v: getArmstrongTile(tileId).label },
    { k: "Профиль", v: getArmstrongProfile(profileId).label },
    { k: "Угол", v: getArmstrongAngle(angleId).label },
    { k: "Подвес", v: res.hanger.name },
    { k: "Запас", v: `${input.sparePct}%` },
  ];
}

/* БЛОК: Сетка параметров расчёта (SpecParams)
 * ЗА ЧТО ОТВЕЧАЕТ: Рисует карточки «Помещение», «Площадь», «Периметр» и т. д. над таблицей сметы.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Массив params из grilyatoSpecParams() или armstrongSpecParams().
 * КАК ИЗМЕНИТЬ: Внешний вид карточек меняется в классах ниже. */
export function SpecParams({ params }: { params: SpecParam[] }) {
  return (
    <div className="mb-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {params.map((p) => (
        <div key={p.k} className="bg-white px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-graphite/45">{p.k}</div>
          <div className="mt-0.5 text-[15px] font-extrabold tabular">{p.v}</div>
        </div>
      ))}
    </div>
  );
}

/* БЛОК: Таблица спецификации с артикулами, ценами и итогом (SpecTable)
 * ЗА ЧТО ОТВЕЧАЕТ: Показывает все позиции сметы, предупреждение об отсутствующих ценах и строку «Итого материалы» с ценой за 1 м².
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Массив res.rows из calcGrilyato() / calcArmstrong().
 * КАК ИЗМЕНИТЬ: Наименования и нормы расхода — в src/data/grilyato.ts и src/data/armstrong.ts, цены — в Google-таблице. */
export function SpecTable({ res, armstrong }: { res: CalcResult; armstrong: boolean }) {
  const missingCount = res.rows.filter((r) => r.missing).length;

  return (
    <div className="spec-print-table overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_20px_rgba(20,25,27,0.04)]">
      {missingCount > 0 && (
        <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-[12.5px] font-semibold text-red-800 lg:px-5">
          <TriangleAlert size={14} strokeWidth={2.5} />
          {armstrong
            ? `Для ${missingCount} поз. нет цены — их стоимость не включена в итог.`
            : `Для ${missingCount} поз. нет цены в таблице — итог может быть неполным.`}
        </div>
      )}

      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13.5px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-graphite/45">
              <th className="whitespace-nowrap px-4 py-2.5 font-bold lg:px-5">Артикул</th>
              <th className="px-3 py-2.5 font-bold">Наименование</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-bold">Кол-во</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-bold">Цена, ₽</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-bold lg:px-5">Сумма, ₽</th>
            </tr>
          </thead>
          <tbody>
            {res.rows.map((r, i) => (
              <tr key={r.key} className={cn("border-b border-line/70", i % 2 === 1 && "bg-smoke/60")}>
                <td className="whitespace-nowrap px-4 py-3 font-bold tabular lg:px-5">
                  <ArticleCell art={r.art} url={r.url} />
                </td>
                <td className="px-3 py-3 font-semibold text-graphite/90">{r.name}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular">
                  {fmt.format(r.qty)} <span className="font-semibold text-graphite/40">{r.unit}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular text-graphite/70">
                  {r.missing ? <span className="font-bold text-red-600">нет цены</span> : fmtPrice(r.price)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold tabular lg:px-5">
                  {armstrong && r.missing ? <span className="text-red-600">нет цены</span> : fmtPrice(r.sum)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-graphite text-white">
              <td className="px-4 py-3.5 lg:px-5" colSpan={3}>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[12px] font-extrabold uppercase tracking-widest">
                    Итого материалы
                  </span>
                  {res.area > 0 && (
                    <span className="mr-5 whitespace-nowrap text-[12.5px] font-bold tabular text-white/60">
                      {`${fmt.format(Math.round(res.perM2))}\u00A0₽/м²`}
                    </span>
                  )}
                </div>
              </td>
              <td
                colSpan={2}
                className="whitespace-nowrap px-4 py-3.5 text-right text-[40px] font-black leading-none text-pro tabular lg:px-5"
              >
                {fmt.format(res.total)} <span className="text-[24px]">₽</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* БЛОК: Скрытый печатный лист внутри страницы калькулятора (SpecPrintPortal)
 * ЗА ЧТО ОТВЕЧАЕТ: Содержит ту же смету, что и страница «Спецификация материалов», но на экране скрыт. При нажатии «Печать» в калькуляторе он становится единственным видимым элементом листа A4 (см. printSpecificationOverlay в src/utils/pagePrint.ts).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Текущий расчёт калькулятора — всегда совпадает с тем, что введено на странице.
 * КАК ИЗМЕНИТЬ: Заголовок листа задаётся в пропе title (константы GRILYATO_SPEC_TITLE / ARMSTRONG_SPEC_TITLE выше). */
export function SpecPrintPortal({
  title,
  params,
  res,
  armstrong,
}: {
  title: string;
  params: SpecParam[];
  res: CalcResult;
  armstrong: boolean;
}) {
  return createPortal(
    <div className="spec-print-portal" aria-hidden="true">
      <section className="spec-print-page bg-smoke py-12 lg:py-16">
        <div className="spec-print-area mx-auto max-w-[1100px] px-4 lg:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-black leading-[1.02] tracking-[-0.01em] lg:text-[46px]">{title}</h1>
            </div>
          </div>
          <SpecParams params={params} />
          <SpecTable res={res} armstrong={armstrong} />
        </div>
      </section>
    </div>,
    document.body,
  );
}
