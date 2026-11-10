import { ROOF_COLORS, ROOF_TYPES, type HouseDimensions } from "../data/house3D";
import { cn } from "../utils/cn";

export default function HouseRoofSelector({ dims, onChange }: {
  dims: HouseDimensions;
  onChange: (next: HouseDimensions) => void;
}) {
  return (
    <div className="grid gap-4 border-b border-line px-4 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:px-5">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-graphite/50">Тип кровли</legend>
        <div className="flex flex-wrap gap-1.5">
          {ROOF_TYPES.map((type) => (
            <button key={type.id} type="button" aria-pressed={dims.roofType === type.id}
              onClick={() => onChange({ ...dims, roofType: type.id })}
              className={cn("rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition-colors", dims.roofType === type.id
                ? "border-graphite bg-graphite text-white" : "border-line bg-white text-graphite/70 hover:border-graphite/50")}>
              {type.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-graphite/50">Цвет кровли</legend>
        <div className="flex flex-wrap gap-1.5">
          {ROOF_COLORS.map((item) => (
            <button key={item.id} type="button" aria-label={`Цвет кровли: ${item.label}`}
              aria-pressed={dims.roofColor === item.id}
              onClick={() => onChange({ ...dims, roofColor: item.id })}
              className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors", dims.roofColor === item.id
                ? "border-graphite bg-smoke text-graphite" : "border-line bg-white text-graphite/70 hover:border-graphite/50")}>
              <span className="h-4 w-4 shrink-0 rounded-full border border-graphite/20" style={{ backgroundColor: item.hex }} />
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}