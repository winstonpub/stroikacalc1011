/* ============================================================================
 * ФАЙЛ: src/components/GableFields.tsx — Настройки типа фасада и фронтона (страница «Тест»)
 * ЗА ЧТО ОТВЕЧАЕТ:
 *   1) Для вариантов со стеной («Без фронтона», «С фронтоном», «С ломаным фронтоном») показывает только
 *      блок «Тип фасада» с пятью кнопками; поля высот, излома и смещения вершины живут в основном
 *      блоке размеров слева (см. TestSidingCalculator.tsx) в порядке:
 *      Длина фасада → Общая высота → Высота фасада → Высота фронтона → [Высота излома, Отступ излома] → Смещение вершины.
 *   2) Для отдельных фронтонов («Фронтон», «Ломаный фронтон») рисует поля формы кровли: ширину основания,
 *      высоту фронтона, а для ломаного — излом. Блоки «Пропорции» и «Скаты» убраны по запросу владельца.
 *   Экспортируемые ApexOffsetControl и BreakControls переиспользуются в обоих случаях.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Геометрия из src/data/testFacade.ts (getGableGeometry), пределы — BROKEN_GABLE_LIMITS.
 * КАК ИЗМЕНИТЬ: Подписи полей — ниже.
 * ========================================================================= */

import { useEffect, useId, useState } from "react";
import { House, Mountain, RectangleHorizontal, Triangle } from "lucide-react";
import {
  GABLE_TYPE_OPTIONS,
  boundedNumber,
  maxBrokenApexOffset,
  maxBrokenInset,
  type GableGeometry,
  type GableType,
} from "../data/testFacade";
import { cn } from "../utils/cn";

const GABLE_TYPE_ICONS: Record<GableType, typeof RectangleHorizontal> = {
  "none": RectangleHorizontal,
  "with-gable": House,
  "with-broken": Mountain,
  "gable": Triangle,
  "broken-gable": Mountain,
};

const fmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const fmt2 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m2 = (value: number) => fmt2.format(Math.round(value * 100) / 100);

function GableNumberField({ label, value, min, max, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const [text, setText] = useState(String(value).replace(".", ","));
  useEffect(() => setText(String(value).replace(".", ",")), [value]);

  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-[13px] font-bold text-graphite/70">{label}</label>
      <div className="flex shrink-0 items-baseline gap-1">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            const value = raw.trim() ? Number(raw.replace(",", ".")) : NaN;
            if (Number.isFinite(value) && value >= min && value <= max) onChange(value);
          }}
          onBlur={() => {
            const next = boundedNumber(text, value, min, max);
            onChange(next);
            setText(String(next).replace(".", ","));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="no-spin w-[110px] rounded-lg border border-transparent bg-smoke px-2 py-1 text-right text-[17px] font-extrabold tabular outline-none transition-colors focus:border-pro"
        />
        <span className="text-[13px] font-semibold text-graphite/50">м</span>
      </div>
    </div>
  );
}

/* Окно ввода расстояния от края до вершины — того же размера, что кнопка «По центру» (как у окон и дверей) */
function ApexSideInput({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const [text, setText] = useState(m2(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(m2(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw.replace(",", "."));
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onCommit(clamped);
      return clamped;
    }
    return null;
  };

  return (
    <span className="flex items-center gap-1">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        aria-label={`${label} до вершины, метры`}
        title="Метры от края до вершины"
        onFocus={() => setFocused(true)}
        onChange={(event) => {
          setText(event.target.value);
          commit(event.target.value);
        }}
        onBlur={() => {
          setFocused(false);
          const committed = commit(text);
          setText(m2(committed ?? value));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className="no-spin w-[72px] rounded-lg border border-line bg-white px-2.5 py-1 text-right text-[11px] font-bold tabular text-graphite outline-none transition-colors focus:border-pro"
      />
      <span>м</span>
    </span>
  );
}

/* Бегунок в едином стиле: жёлтая заливка, подписи по краям и необязательная кнопка сброса в центр */
function SliderRow({ label, value, min, max, fill, leftHint, rightHint, centerLabel, onCenter, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  fill: number;
  leftHint: string;
  rightHint: string;
  centerLabel?: string;
  onCenter?: () => void;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={`${fmt.format(value)} м`}
        min={min}
        max={max}
        step="0.005"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="pro-range"
        style={{ "--fill": `${Math.max(0, Math.min(100, fill))}%` } as React.CSSProperties}
      />
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-graphite/50">
        <span className="tabular">{leftHint}</span>
        {centerLabel && onCenter && (
          <button
            type="button"
            onClick={onCenter}
            disabled={Math.abs(value - (min + max) / 2) < 0.005}
            className="rounded-lg border border-line px-2.5 py-1 text-graphite transition-colors hover:bg-smoke disabled:opacity-40"
          >
            {centerLabel}
          </button>
        )}
        <span className="tabular">{rightHint}</span>
      </div>
    </div>
  );
}

/* БЛОК: Смещение вершины (ApexOffsetControl)
 * ЗА ЧТО ОТВЕЧАЕТ: Бегунок положения вершины относительно центра с окнами «Слева/Справа» и кнопкой «По центру».
 *   Переиспользуется: в основном блоке размеров для режимов со стеной и внутри панели для отдельных фронтонов.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: geometry из src/data/testFacade.ts; onOffset пишет метры смещения.
 * КАК ИЗМЕНИТЬ: Окна ввода подписей краёв — ApexSideInput выше. */
export function ApexOffsetControl({ geometry, onOffset }: {
  geometry: GableGeometry;
  onOffset: (value: number) => void;
}) {
  const { width, apexX, apexOffset, breakInset } = geometry;
  const broken = geometry.shape === "broken";
  const apexLimit = broken ? maxBrokenApexOffset(width, breakInset) : width / 2;

  return (
    <div data-testid="apex-control">
      <div className="mb-1 text-[13px] font-bold text-graphite/70" data-field-caption>
        Смещение вершины
      </div>
      <input
        type="range"
        aria-label="Положение вершины относительно центра"
        aria-valuetext={`${fmt.format(apexOffset)} м`}
        min={-apexLimit}
        max={apexLimit}
        step="0.005"
        value={apexOffset}
        onChange={(event) => onOffset(Number(event.target.value))}
        className="pro-range"
        style={{
          "--fill": `${Math.max(0, Math.min(100, apexLimit > 0 ? ((apexOffset + apexLimit) / (2 * apexLimit)) * 100 : 50))}%`,
        } as React.CSSProperties}
      />
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-[11px] font-semibold text-graphite/50">
        <ApexSideInput
          label="Слева"
          value={apexX}
          min={width / 2 - apexLimit}
          max={width / 2 + apexLimit}
          onCommit={(leftMeters) => onOffset(leftMeters - width / 2)}
        />
        <button
          type="button"
          onClick={() => onOffset(0)}
          disabled={Math.abs(apexOffset) < 0.005}
          className="rounded-lg border border-line px-2.5 py-1 text-graphite transition-colors hover:bg-smoke disabled:opacity-40"
        >
          По центру
        </button>
        <ApexSideInput
          label="Справа"
          value={width - apexX}
          min={width / 2 - apexLimit}
          max={width / 2 + apexLimit}
          onCommit={(rightMeters) => onOffset(width / 2 - rightMeters)}
        />
      </div>
    </div>
  );
}

/* БЛОК: Поля излома ломаного фронтона (BreakControls)
 * ЗА ЧТО ОТВЕЧАЕТ: «Высота излома» и «Отступ излома» — числовое поле + бегунок для каждого.
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: geometry; пределы — maxBrokenInset и высота фронтона минус 0,05 м.
 * КАК ИЗМЕНИТЬ: Подсказки по краям ползунков — в leftHint/rightHint ниже. */
export function BreakControls({ geometry, onBreakHeight, onBreakInset }: {
  geometry: GableGeometry;
  onBreakHeight: (value: number) => void;
  onBreakInset: (value: number) => void;
}) {
  const { width, gableHeight, breakHeight, breakInset } = geometry;
  const insetMax = maxBrokenInset(width);
  const breakHeightMax = Math.max(0.05, Math.round((gableHeight - 0.05) * 100) / 100);

  return (
    <div className="space-y-4" data-testid="break-controls">
      <div>
        <GableNumberField
          label="Высота излома"
          value={breakHeight}
          min={0.05}
          max={breakHeightMax}
          onChange={onBreakHeight}
        />
        <SliderRow
          label="Высота излома фронтона"
          value={breakHeight}
          min={0.05}
          max={breakHeightMax}
          fill={(breakHeight / Math.max(breakHeightMax, 1e-6)) * 100}
          leftHint="Ниже: 0,05 м"
          rightHint={`Выше: ${fmt.format(breakHeightMax)} м`}
          onChange={onBreakHeight}
        />
      </div>
      <div>
        <GableNumberField
          label="Отступ излома"
          value={breakInset}
          min={0.05}
          max={insetMax}
          onChange={onBreakInset}
        />
        <SliderRow
          label="Отступ излома от края"
          value={breakInset}
          min={0.05}
          max={insetMax}
          fill={(breakInset / Math.max(insetMax, 1e-6)) * 100}
          leftHint="Круче: 0,05 м"
          rightHint={`Положе: ${fmt.format(insetMax)} м`}
          onChange={onBreakInset}
        />
      </div>
    </div>
  );
}

/* БЛОК: Тип фасада (GableTypeSwitch)
 * ЗА ЧТО ОТВЕЧАЕТ: Пять кнопок с значками. «Без фронтона», «С фронтоном», «С ломаным фронтоном» — стена с разным верхом;
 *   «Фронтон» и «Ломаный фронтон» — только фронтон без стены (переключают режим калькулятора).
 * ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Текущее значение value из getGableType() (src/data/testFacade.ts).
 * КАК ИЗМЕНИТЬ: Подписи — в GABLE_TYPE_OPTIONS; значки — в GABLE_TYPE_ICONS выше. */
function GableTypeSwitch({ value, onChange }: { value: GableType; onChange: (type: GableType) => void }) {
  const button = (option: { id: GableType; label: string }) => {
    const Icon = GABLE_TYPE_ICONS[option.id];
    return (
      <button
        key={option.id}
        type="button"
        aria-pressed={value === option.id}
        onClick={() => onChange(option.id)}
        className={cn(
          "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-extrabold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pro",
          value === option.id
            ? "bg-graphite text-white shadow-sm"
            : "text-graphite/60 hover:bg-white hover:text-graphite",
        )}
      >
        <Icon
          size={13}
          strokeWidth={2.4}
          className={cn("shrink-0", value === option.id ? "text-pro" : "text-graphite/45")}
        />
        <span>{option.label}</span>
      </button>
    );
  };
  return (
    <div className="space-y-1 rounded-xl bg-smoke p-1" role="group" aria-label="Тип фронтона">
      <div className="grid grid-cols-3 gap-1">{GABLE_TYPE_OPTIONS.slice(0, 3).map(button)}</div>
      <div className="grid grid-cols-2 gap-1 border-t border-line/70 pt-1">{GABLE_TYPE_OPTIONS.slice(3).map(button)}</div>
    </div>
  );
}

export default function GableFields({ geometry, gableType, onGableType, onWidth, onHeight, onOffset, onBreakHeight, onBreakInset }: {
  geometry: GableGeometry | null;
  gableType: GableType;
  onGableType: (type: GableType) => void;
  onWidth: (value: number) => void;
  onHeight: (value: number) => void;
  onOffset: (value: number) => void;
  onBreakHeight: (value: number) => void;
  onBreakInset: (value: number) => void;
}) {
  const standalone =
    geometry !== null && (geometry.mode === "gable" || geometry.mode === "broken-gable");

  /* Режимы со стеной: в этой панели остаётся только переключатель «Тип фасада»,
     а общая высота, высота фронтона, излом и смещение вершины показаны в блоке размеров. */
  if (!standalone) {
    return (
      <fieldset className="space-y-3" aria-label="Тип фасада">
        <legend className="mb-3 text-[12px] font-extrabold uppercase tracking-wider text-graphite/50">
          Тип фасада
        </legend>
        <GableTypeSwitch value={gableType} onChange={onGableType} />
      </fieldset>
    );
  }

  if (!geometry) return null;

  const broken = geometry.shape === "broken";
  const { width, gableHeight } = geometry;

  return (
    <fieldset className="space-y-4" aria-label="Тип фасада">
      <legend className="mb-3 text-[12px] font-extrabold uppercase tracking-wider text-graphite/50">
        Тип фасада
      </legend>

      {/* Тот же переключатель типа: из отдельного фронтона можно вернуться к стене или ломаному.
          Кнопки «Фронтон» и «Ломаный фронтон» остаются с прежними подписями. */}
      <GableTypeSwitch value={gableType} onChange={onGableType} />

      {/* Разделительная линия и заголовок «Размеры» — как у режимов со стеной */}
      <div className="border-t border-line pt-4">
        <div className="mb-3 text-[12px] font-extrabold uppercase tracking-wider text-graphite/50">Размеры</div>
        <div className="space-y-4">
          <GableNumberField label="Ширина основания" value={width} min={0.5} max={100} onChange={onWidth} />
      <GableNumberField
        label="Высота фронтона"
        value={gableHeight}
        min={0.1}
        max={20}
        onChange={(value) => onHeight(value)}
      />
      {/* Блоки «Пропорции» и «Скаты» убраны: излом задаётся только полями ниже */}
      {broken && (
        <BreakControls
          geometry={geometry}
          onBreakHeight={onBreakHeight}
          onBreakInset={onBreakInset}
        />
      )}

          <ApexOffsetControl geometry={geometry} onOffset={onOffset} />
        </div>
      </div>

      {/* Разделительная линия под «Смещение вершины» и заголовок «Проёмы» — как у режимов со стеной */}
      <div className="border-t border-line pt-4">
        <div className="text-[12px] font-extrabold uppercase tracking-wider text-graphite/50">Проёмы</div>
      </div>
    </fieldset>
  );
}
