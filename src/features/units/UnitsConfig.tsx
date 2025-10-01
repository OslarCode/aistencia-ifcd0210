import { useMemo, useState } from "react";
import type { Unit } from "../../app/units";
import { mapUnitsToDays, uuid, validateUnit } from "../../lib/units";

type Props = {
  units: Unit[];
  onChange: (next: Unit[]) => void;
  onRemove?: (id: string) => void; // <-- NUEVO (App borra en BD)
  classDays: string[];
  hoursPerDay: number;
  requiredPct: number;
};

export default function UnitsConfig({
  units,
  onChange,
  onRemove,
  classDays,
  hoursPerDay,
  requiredPct,
}: Props) {
  const [filter, setFilter] = useState("");

  const computed = useMemo(() => mapUnitsToDays(units, classDays), [units, classDays]);

  const addUnit = () => {
    onChange([
      ...units,
      { id: uuid(), code: "UFxxxx", name: "Nueva unidad", start: "", end: "", requiredPct },
    ]);
  };

  const removeUnit = (id: string) => {
    // actualiza UI
    onChange(units.filter((u) => u.id !== id));
    // si hay callback remoto, borra en BD
    onRemove?.(id);
  };

  const update = (id: string, patch: Partial<Unit>) =>
    onChange(units.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const filtered = computed.filter(
    (u) =>
      u.name.toLowerCase().includes(filter.toLowerCase()) ||
      (u.code ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Unidades (MF/UF)</h2>
          <p className="text-sm text-gray-600">
            Define las fechas de cada unidad para calcular su asistencia independiente.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Filtrar unidades…"
            className="rounded-xl border px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="rounded-xl border px-3 py-2 text-sm" onClick={addUnit}>
            Añadir unidad
          </button>
        </div>
      </header>

      <div className="grid gap-3">
        <div className="grid grid-cols-12 gap-2 rounded-xl bg-gray-50 p-2 text-xs font-semibold">
          <div className="col-span-3">Unidad</div>
          <div className="col-span-2">Inicio</div>
          <div className="col-span-2">Fin</div>
          <div className="col-span-1">Requerido %</div>
          <div className="col-span-2 text-center">Días · Horas</div>
          <div className="col-span-2 text-center">Acciones</div>
        </div>

        {filtered.map((u) => {
          const { errors, days } = validateUnit(u, classDays);
          const hours = days.length * hoursPerDay;

          return (
            <div key={u.id} className="grid grid-cols-12 items-center gap-2 rounded-xl border p-2">
              <div className="col-span-3">
                <input
                  className="mb-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={u.name}
                  onChange={(e) => update(u.id, { name: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border px-3 py-2 text-xs text-gray-700"
                  value={u.code ?? ""}
                  onChange={(e) => update(u.id, { code: e.target.value })}
                  placeholder="Código (opcional)"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="date"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={u.start}
                  onChange={(e) => update(u.id, { start: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <input
                  type="date"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={u.end}
                  onChange={(e) => update(u.id, { end: e.target.value })}
                />
              </div>

              <div className="col-span-1">
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={u.requiredPct ?? requiredPct}
                  onChange={(e) =>
                    update(u.id, { requiredPct: Number(e.target.value || requiredPct) })
                  }
                />
              </div>

              <div className="col-span-2 text-center">
                <div
                  className={`inline-flex rounded-full border px-2 py-1 text-xs ${
                    days.length ? "" : "bg-red-50 border-red-300 text-red-700"
                  }`}
                >
                  {days.length} d · {hours} h
                </div>
                {errors.length > 0 && (
                  <div className="mt-1 text-[11px] text-red-600">{errors.join(" · ")}</div>
                )}
              </div>

              <div className="col-span-2 flex justify-center gap-2">
                <button
                  className="rounded-lg border px-2 py-1 text-sm"
                  onClick={() =>
                    update(u.id, {
                      start: "",
                      end: "",
                    })
                  }
                  title="Limpiar fechas"
                >
                  Limpiar
                </button>
                <button
                  className="rounded-lg border px-2 py-1 text-sm text-red-600"
                  onClick={() => removeUnit(u.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Tip: ajusta las fechas de cada unidad para que caigan en días lectivos (L–V, excluyendo
        festivos) y así el cálculo de asistencia por unidad sea correcto.
      </p>
    </section>
  );
}
