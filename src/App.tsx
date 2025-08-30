import CourseConfig from "./features/course/CourseConfig";
import { DEFAULT_CONFIG, type CourseConfig as TCourseConfig } from "./app/config";
import { useLocalStorage } from "./lib/useLocalStorage";
import { useEffect, useMemo } from "react";
import { generateClassDays } from "./lib/dates";

import UnitsConfig from "./features/units/UnitsConfig";
import { DEFAULT_UNITS, type Unit } from "./app/units";

import StudentsPanel from "./features/students/StudentsPanel";
import type { Student } from "./app/students";
import { DEFAULT_STUDENTS } from "./app/students";

import AttendancePanel from "./features/attendance/AttendancePanel";
import type { AttendanceState } from "./app/attendance";

export default function App() {
  // Config + Unidades (ya hechos)
  const [config, setConfig] = useLocalStorage<TCourseConfig>("ifcd0210_config", DEFAULT_CONFIG);
  const [units, setUnits] = useLocalStorage<Unit[]>("ifcd0210_units", DEFAULT_UNITS);
  const classDays = useMemo(() => generateClassDays(config), [config]);

  // Alumnado
  const [students, setStudents] = useLocalStorage<Student[]>("ifcd0210_students", DEFAULT_STUDENTS);

  // Asistencia
  const [attendance, setAttendance] = useLocalStorage<AttendanceState>("ifcd0210_attendance", {});

  // Día seleccionado (cae al primer día lectivo disponible)
  const [selectedDate, setSelectedDate] = useLocalStorage<string>(
    "ifcd0210_selectedDate",
    classDays[0] || "",
  );

  // Si cambia el calendario y la fecha seleccionada ya no existe, recoloca
  useEffect(() => {
    if (!classDays.length) return;
    if (!classDays.includes(selectedDate)) setSelectedDate(classDays[0]);
  }, [classDays, selectedDate, setSelectedDate]);

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

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <CourseConfig config={config} onChange={setConfig} />

        <UnitsConfig
          units={units}
          onChange={setUnits}
          classDays={classDays}
          hoursPerDay={config.hoursPerDay}
          requiredPct={config.requiredPct}
        />

        <StudentsPanel students={students} onChange={setStudents} />

        <AttendancePanel
          classDays={classDays}
          students={students}
          attendance={attendance}
          setAttendance={setAttendance}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </main>
    </div>
  );
}
