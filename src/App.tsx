import { useEffect, useMemo, useState } from "react";

import CourseConfig from "./features/course/CourseConfig";
import { DEFAULT_CONFIG, type CourseConfig as TCourseConfig } from "./app/config";
import { generateClassDays } from "./lib/dates";

import UnitsConfig from "./features/units/UnitsConfig";
import { DEFAULT_UNITS, type Unit } from "./app/units";

import StudentsPanel from "./features/students/StudentsPanel";
import type { Student } from "./app/students";
import { DEFAULT_STUDENTS } from "./app/students";

import AttendancePanel from "./features/attendance/AttendancePanel";
import type { AttendanceState, AttendanceMark } from "./app/attendance";

import SummaryPanel from "./features/summary/SummaryPanel";
import BackupPanel from "./features/backup/BackupPanel";
import ReportPanel from "./features/reports/ReportPanel";

// === NUEVO: capa de datos (Supabase) ===
import {
  loadConfig,
  saveConfig,
  loadUnits,
  upsertUnits,
  deleteUnit as deleteUnitDB,
  loadStudents,
  upsertStudents,
  deleteStudent as deleteStudentDB,
  loadAttendance,
  setAttendanceMark as setAttendanceMarkDB,
  clearAttendanceFor,
} from "./db/repo";

// pequeño helper de debounce
function debounce<T extends (...args: any[]) => void>(fn: T, ms = 400) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

export default function App() {
  // Estado base (ya no usamos useLocalStorage)
  const [config, setConfig] = useState<TCourseConfig>(DEFAULT_CONFIG);
  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [selectedDate, setSelectedDate] = useState<string>("");

  const classDays = useMemo(() => generateClassDays(config), [config]);

  // Carga inicial desde BD
  useEffect(() => {
    (async () => {
      const [cfg, us, ss, at] = await Promise.all([
        loadConfig(),
        loadUnits(),
        loadStudents(),
        loadAttendance(),
      ]);
      if (cfg) setConfig(cfg);
      if (us.length) setUnits(us);
      if (ss.length) setStudents(ss);
      setAttendance(at);
      const days = generateClassDays(cfg ?? DEFAULT_CONFIG);
      setSelectedDate(days[0] ?? "");
    })().catch((e) => console.error("Load error:", e));
  }, []);

  // Si cambia el calendario y la fecha seleccionada ya no existe, recolocar
  useEffect(() => {
    if (!classDays.length) return;
    if (!classDays.includes(selectedDate)) setSelectedDate(classDays[0]);
  }, [classDays, selectedDate]);

  // Persistencia: CONFIG (debounced)
  const persistConfig = useMemo(
    () =>
      debounce((next: TCourseConfig) => {
        saveConfig(next).catch((e) => console.error("saveConfig:", e));
      }, 400),
    [],
  );
  useEffect(() => {
    // guardar cada vez que cambie config (tras debounce)
    persistConfig(config);
  }, [config, persistConfig]);

  // Persistencia: UNITS (debounced)
  const persistUnits = useMemo(
    () =>
      debounce((list: Unit[]) => {
        upsertUnits(list).catch((e) => console.error("upsertUnits:", e));
      }, 400),
    [],
  );
  useEffect(() => {
    persistUnits(units);
  }, [units, persistUnits]);

  // Persistencia: STUDENTS (debounced)
  const persistStudents = useMemo(
    () =>
      debounce((list: Student[]) => {
        upsertStudents(list).catch((e) => console.error("upsertStudents:", e));
      }, 400),
    [],
  );
  useEffect(() => {
    persistStudents(students);
  }, [students, persistStudents]);

  // === Handlers remotos específicos ===

  // Unidades: eliminar (estado + BD)
  const handleRemoveUnit = async (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
    try {
      await deleteUnitDB(id);
    } catch (e) {
      console.error("deleteUnit:", e);
    }
  };

  // Alumnos: eliminar (estado + BD)
  const handleRemoveStudent = async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteStudentDB(id);
    } catch (e) {
      console.error("deleteStudent:", e);
    }
  };

  // Asistencia: marcar uno
  const setMarkRemote = async (sid: string, date: string, mark: AttendanceMark | "") => {
    setAttendance((prev) => ({
      ...prev,
      [sid]: { ...(prev[sid] || {}), [date]: mark as AttendanceMark },
    }));

    try {
      if (mark) {
        await setAttendanceMarkDB(sid, date, mark as AttendanceMark);
      } else {
        await clearAttendanceFor(date, [sid]);
      }
    } catch (e) {
      console.error("setAttendance:", e);
    }
  };

  // Asistencia: marcar todos presentes en el día
  const markAllPresentRemote = async (date: string) => {
    setAttendance((prev) => {
      const copy: AttendanceState = { ...prev };
      for (const s of students) {
        copy[s.id] = { ...(copy[s.id] || {}), [date]: "P" };
      }
      return copy;
    });
    try {
      await Promise.all(students.map((s) => setAttendanceMarkDB(s.id, date, "P")));
    } catch (e) {
      console.error("markAllPresent:", e);
    }
  };

  // Asistencia: borrar marcas del día
  const clearDayRemote = async (date: string) => {
    setAttendance((prev) => {
      const copy: AttendanceState = { ...prev };
      for (const s of students) {
        if (copy[s.id]) delete copy[s.id][date];
      }
      return copy;
    });
    try {
      await clearAttendanceFor(
        date,
        students.map((s) => s.id),
      );
    } catch (e) {
      console.error("clearDay:", e);
    }
  };

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
          onRemove={handleRemoveUnit} // <-- NUEVO: elimina en BD
          classDays={classDays}
          hoursPerDay={config.hoursPerDay}
          requiredPct={config.requiredPct}
        />

        <StudentsPanel
          students={students}
          onChange={setStudents}
          onRemove={handleRemoveStudent} // <-- NUEVO: elimina en BD
        />

        <AttendancePanel
          classDays={classDays}
          students={students}
          attendance={attendance}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onSetMark={setMarkRemote} // <-- NUEVO
          onMarkAllPresent={markAllPresentRemote} // <-- NUEVO
          onClearDay={clearDayRemote} // <-- NUEVO
        />

        <SummaryPanel
          students={students}
          attendance={attendance}
          units={units}
          classDays={classDays}
          config={config}
          hoursPerDay={config.hoursPerDay}
        />

        <BackupPanel
          config={config}
          units={units}
          students={students}
          attendance={attendance}
          selectedDate={selectedDate}
          setConfig={setConfig}
          setUnits={setUnits}
          setStudents={setStudents}
          setAttendance={setAttendance}
          setSelectedDate={setSelectedDate}
        />

        <ReportPanel
          config={config}
          units={units}
          students={students}
          attendance={attendance}
          classDays={classDays}
          hoursPerDay={config.hoursPerDay}
        />
      </main>
    </div>
  );
}
