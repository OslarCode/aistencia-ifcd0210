import CourseConfig from "./features/course/CourseConfig";
import { DEFAULT_CONFIG, type CourseConfig as TCourseConfig } from "./app/config";
import { useLocalStorage } from "./lib/useLocalStorage";
import { useMemo } from "react";
import { generateClassDays } from "./lib/dates";

import UnitsConfig from "./features/units/UnitsConfig";
import { DEFAULT_UNITS, type Unit } from "./app/units";

export default function App() {
  const [config, setConfig] = useLocalStorage<TCourseConfig>("ifcd0210_config", DEFAULT_CONFIG);
  const [units, setUnits] = useLocalStorage<Unit[]>("ifcd0210_units", DEFAULT_UNITS);

  const classDays = useMemo(() => generateClassDays(config), [config]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-2xl font-bold">Asistencia IFCD0210</h1>
          <p className="text-sm text-gray-600">
            Murcia · L–V · {config.startTime}–{config.endTime} · {config.hoursPerDay}h/día ·{" "}
            {classDays.length} días ({classDays.length * config.hoursPerDay} h)
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <CourseConfig config={config} onChange={setConfig} />

        {/* NUEVO: gestión de unidades */}
        <UnitsConfig
          units={units}
          onChange={setUnits}
          classDays={classDays}
          hoursPerDay={config.hoursPerDay}
          requiredPct={config.requiredPct}
        />

        {/* Próximo módulo: Pase de lista y resumen por unidad */}
      </main>
    </div>
  );
}
