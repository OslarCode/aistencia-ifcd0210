import { useMemo, useState } from "react";
import type { CourseConfig } from "../../app/config";
import { generateClassDays } from "../../lib/dates";

type Props = {
  config: CourseConfig;
  onChange: (next: CourseConfig) => void;
};

export default function CourseConfig({ config, onChange }: Props) {
  const [newHoliday, setNewHoliday] = useState("");

  const classDays = useMemo(() => generateClassDays(config), [config]);
  const totalHours = classDays.length * config.hoursPerDay;

  const update = <K extends keyof CourseConfig>(k: K, v: CourseConfig[K]) =>
    onChange({ ...config, [k]: v });

  const addHoliday = () => {
    if (!newHoliday) return;
    if (config.holidays.includes(newHoliday)) return;
    onChange({ ...config, holidays: [...config.holidays, newHoliday].sort() });
    setNewHoliday("");
  };
  const removeHoliday = (d: string) =>
    onChange({ ...config, holidays: config.holidays.filter((x) => x !== d) });

  const toggleDay = (dow: number) => {
    const set = new Set(config.daysOfWeek);
    set.has(dow) ? set.delete(dow) : set.add(dow);
    onChange({ ...config, daysOfWeek: Array.from(set).sort() });
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Configuración del curso</h2>
        <p className="text-sm text-gray-600">
          Periodo {config.start} → {config.end} · L–V {config.startTime}–{config.endTime} ·{" "}
          {config.hoursPerDay}h/día
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Fechas y horas */}
        <div className="space-y-3">
          <label className="block text-sm">
            Inicio
            <input
              type="date"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={config.start}
              onChange={(e) => update("start", e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Fin
            <input
              type="date"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={config.end}
              onChange={(e) => update("end", e.target.value)}
            />
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm">Horas/día</label>
            <input
              type="number"
              min={1}
              max={8}
              className="w-24 rounded-xl border px-3 py-2"
              value={config.hoursPerDay}
              onChange={(e) => update("hoursPerDay", Number(e.target.value || 5))}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Horario</label>
            <input
              type="time"
              className="rounded-xl border px-2 py-1"
              value={config.startTime}
              onChange={(e) => update("startTime", e.target.value)}
            />
            <span className="text-sm">—</span>
            <input
              type="time"
              className="rounded-xl border px-2 py-1"
              value={config.endTime}
              onChange={(e) => update("endTime", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="countJ"
              type="checkbox"
              className="h-4 w-4"
              checked={config.countJustifiedAgainstLimit}
              onChange={(e) => update("countJustifiedAgainstLimit", e.target.checked)}
            />
            <label htmlFor="countJ" className="text-sm">
              Contar justificadas contra el límite (25%)
            </label>
          </div>

          <div className="text-xs text-gray-600">
            Requisito: ≥ {config.requiredPct}% asistencia por unidad.
          </div>
        </div>

        {/* Días lectivos (L–V) */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Días de la semana</p>
          <div className="flex flex-wrap gap-2">
            {[
              { d: 1, lbl: "L" },
              { d: 2, lbl: "M" },
              { d: 3, lbl: "X" },
              { d: 4, lbl: "J" },
              { d: 5, lbl: "V" },
            ].map(({ d, lbl }) => {
              const active = config.daysOfWeek.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`w-10 rounded-lg border px-3 py-2 text-sm ${
                    active ? "bg-gray-900 text-white" : "bg-white"
                  }`}
                  title={["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][d]}
                >
                  {lbl}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Días lectivos calculados</span>
              <span className="rounded-full border px-2 py-0.5 text-xs">
                {classDays.length} días · {totalHours} h
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              (Excluye fines de semana y festivos configurados)
            </p>
          </div>
        </div>

        {/* Festivos */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Festivos</p>
          <div className="flex gap-2">
            <input
              type="date"
              className="rounded-xl border px-3 py-2"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
            />
            <button type="button" className="rounded-xl border px-3 py-2" onClick={addHoliday}>
              Añadir
            </button>
          </div>
          <ul className="flex max-h-40 flex-wrap gap-2 overflow-auto pr-1">
            {config.holidays.map((h) => (
              <li
                key={h}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm"
              >
                <span>{h}</span>
                <button
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => removeHoliday(h)}
                  title="Eliminar"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
