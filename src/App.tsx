import CourseConfig from "./features/course/CourseConfig";
import { DEFAULT_CONFIG, type CourseConfig as TCourseConfig } from "./app/config";
import { useLocalStorage } from "./lib/useLocalStorage";
import { useMemo } from "react";
import { generateClassDays } from "./lib/dates";

export default function App() {
  const [config, setConfig] = useLocalStorage<TCourseConfig>("ifcd0210_config", DEFAULT_CONFIG);
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

        {/* Aquí, en el Módulo 2, añadiremos:
            - Pase de lista (por día)
            - Resumen por unidad/total
            - Exportación CSV
        */}
      </main>
    </div>
  );
}
