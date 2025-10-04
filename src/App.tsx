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

// === Capa de datos (Supabase) ===
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

// --- helpers ---
function debounce<T extends (...args: any[]) => void>(fn: T, ms = 400) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}
const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export default function App() {
  // Estado base
  const [config, setConfig] = useState<TCourseConfig>(DEFAULT_CONFIG);
  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Flag de hidratación: evita persistir antes de cargar BD
  const [hydrated, setHydrated] = useState(false);

  const classDays = useMemo(() => generateClassDays(config), [config]);

  // Carga inicial + normalización de IDs a UUID (si vienen "MF0491-UF1841", "s-1", etc.)
  useEffect(() => {
    (async () => {
      const [cfg, us, ss, at] = await Promise.all([
        loadConfig(),
        loadUnits(),
        loadStudents(),
        loadAttendance(),
      ]);

      if (cfg) setConfig(cfg);

      // --- UNITS ---
      const baseUnits = (us?.length ? us : DEFAULT_UNITS) as Unit[];
      let unitsChanged = false;
      const fixedUnits = baseUnits.map((u) => {
        if (!u.id || !isUuid(u.id)) {
          unitsChanged = true;
          return { ...u, id: crypto.randomUUID() };
        }
        return u;
      });
      setUnits(fixedUnits);
      if (unitsChanged) {
        // guardamos una vez para consolidar IDs y que las fechas ya queden asociadas
        await upsertUnits(fixedUnits);
      }

      // --- STUDENTS ---
      const baseStudents = (ss?.length ? ss : DEFAULT_STUDENTS) as Student[];
      let studentsChanged = false;
      const fixedStudents = baseStudents.map((s) => {
        if (!s.id || !isUuid(s.id)) {
          studentsChanged = true;
          return { ...s, id: crypto.randomUUID() };
        }
        return s;
      });
      setStudents(fixedStudents);
      if (studentsChanged) {
        await upsertStudents(fixedStudents);
      }

      // --- ATTENDANCE ---
      setAttendance(at);

      // Selecciona primer día lectivo disponible
      const days = generateClassDays(cfg ?? DEFAULT_CONFIG);
      setSelectedDate(days[0] ?? "");

      setHydrated(true);
    })().catch((e) => console.error("Load error:", e));
  }, []);

  // Recoloca fecha seleccionada si ya no existe
  useEffect(() => {
    if (!classDays.length) return;
    if (!classDays.includes(selectedDate)) setSelectedDate(classDays[0]);
  }, [classDays, selectedDate]);

  // Persistencia (solo cuando hydrated === true)
  const persistConfig = useMemo(
    () =>
      debounce((next: TCourseConfig) => {
        if (!hydrated) return;
        saveConfig(next).catch((e) => console.error("saveConfig:", e));
      }, 400),
    [hydrated],
  );
  useEffect(() => {
    persistConfig(config);
  }, [config, persistConfig]);

  const persistUnitsDebounced = useMemo(
    () =>
      debounce((list: Unit[]) => {
        if (!hydrated) return;
        upsertUnits(list).catch((e) => console.error("upsertUnits:", e));
      }, 400),
    [hydrated],
  );
  useEffect(() => {
    persistUnitsDebounced(units);
  }, [units, persistUnitsDebounced]);

  const persistStudentsDebounced = useMemo(
    () =>
      debounce((list: Student[]) => {
        if (!hydrated) return;
        upsertStudents(list).catch((e) => console.error("upsertStudents:", e));
      }, 400),
    [hydrated],
  );
  useEffect(() => {
    persistStudentsDebounced(students);
  }, [students, persistStudentsDebounced]);

  // === Handlers remotos específicos ===
  const handleRemoveUnit = async (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
    try {
      await deleteUnitDB(id);
    } catch (e) {
      console.error("deleteUnit:", e);
    }
  };

  const handleRemoveStudent = async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteStudentDB(id);
    } catch (e) {
      console.error("deleteStudent:", e);
    }
  };

  const setMarkRemote = async (sid: string, date: string, mark: AttendanceMark | "") => {
    setAttendance((prev) => ({
      ...prev,
      [sid]: { ...(prev[sid] || {}), [date]: mark as AttendanceMark },
    }));
    try {
      if (mark) await setAttendanceMarkDB(sid, date, mark as AttendanceMark);
      else await clearAttendanceFor(date, [sid]);
    } catch (e) {
      console.error("setAttendance:", e);
    }
  };

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
          onRemove={handleRemoveUnit}
          classDays={classDays}
          hoursPerDay={config.hoursPerDay}
          requiredPct={config.requiredPct}
        />

        <StudentsPanel students={students} onChange={setStudents} onRemove={handleRemoveStudent} />

        <AttendancePanel
          classDays={classDays}
          students={students}
          attendance={attendance}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onSetMark={setMarkRemote}
          onMarkAllPresent={markAllPresentRemote}
          onClearDay={clearDayRemote}
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
