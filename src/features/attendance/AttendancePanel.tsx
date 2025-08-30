import { useMemo } from "react";
import type { AttendanceState, AttendanceMark } from "../../app/attendance";
import type { Student } from "../../app/students";

type Props = {
  classDays: string[]; // días lectivos (YYYY-MM-DD)
  students: Student[]; // lista de alumnos
  attendance: AttendanceState; // estado de asistencia
  setAttendance: (next: AttendanceState) => void;
  selectedDate: string; // día elegido (YYYY-MM-DD)
  setSelectedDate: (next: string) => void;
};

export default function AttendancePanel({
  classDays,
  students,
  attendance,
  setAttendance,
  selectedDate,
  setSelectedDate,
}: Props) {
  const idx = classDays.indexOf(selectedDate);
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < classDays.length - 1;

  const cycle = (v: AttendanceMark): AttendanceMark => {
    if (!v) return "P";
    if (v === "P") return "A";
    if (v === "A") return "J";
    return "";
  };

  const setMark = (sid: string, date: string, mark: AttendanceMark) => {
    setAttendance({
      ...attendance,
      [sid]: { ...(attendance[sid] || {}), [date]: mark },
    });
  };

  const markAllPresent = () => {
    const copy: AttendanceState = { ...attendance };
    for (const s of students) {
      copy[s.id] = { ...(copy[s.id] || {}), [selectedDate]: "P" };
    }
    setAttendance(copy);
  };

  const clearDay = () => {
    const copy: AttendanceState = { ...attendance };
    for (const s of students) {
      if (copy[s.id]) delete copy[s.id][selectedDate];
    }
    setAttendance(copy);
  };

  const stats = useMemo(() => {
    let p = 0,
      a = 0,
      j = 0,
      none = 0;
    for (const s of students) {
      const m = attendance[s.id]?.[selectedDate] ?? "";
      if (m === "P") p++;
      else if (m === "A") a++;
      else if (m === "J") j++;
      else none++;
    }
    return { p, a, j, none, total: students.length };
  }, [students, attendance, selectedDate]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pase de lista</h2>
          <p className="text-sm text-gray-600">
            Día lectivo seleccionado: <strong>{selectedDate || "—"}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            disabled={!canPrev}
            onClick={() => canPrev && setSelectedDate(classDays[idx - 1])}
            title="Día anterior"
          >
            ◀
          </button>

          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-sm"
          >
            {classDays.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            disabled={!canNext}
            onClick={() => canNext && setSelectedDate(classDays[idx + 1])}
            title="Día siguiente"
          >
            ▶
          </button>

          <button className="ml-2 rounded-lg border px-3 py-1.5" onClick={markAllPresent}>
            Marcar todos PRESENTE
          </button>
          <button className="rounded-lg border px-3 py-1.5" onClick={clearDay}>
            Borrar día
          </button>
        </div>
      </header>

      <div className="mb-3 text-sm text-gray-700">
        <span className="mr-3">P: {stats.p}</span>
        <span className="mr-3">A: {stats.a}</span>
        <span className="mr-3">J: {stats.j}</span>
        <span className="mr-3">—: {stats.none}</span>
        <span>Total: {stats.total}</span>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 rounded-l-lg">Alumno</th>
              <th className="p-2">Estado</th>
              <th className="p-2 rounded-r-lg">Ciclo rápido</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const mark = attendance[s.id]?.[selectedDate] ?? "";
              return (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">
                    <select
                      value={mark}
                      onChange={(e) => setMark(s.id, selectedDate, e.target.value as any)}
                      className="rounded-lg border px-2 py-1.5"
                    >
                      <option value="">—</option>
                      <option value="P">PRESENTE</option>
                      <option value="A">AUSENTE (No just.)</option>
                      <option value="J">AUSENTE (Just.)</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      className="rounded-lg border px-2 py-1"
                      onClick={() => setMark(s.id, selectedDate, cycle(mark))}
                    >
                      CICLAR (—→P→A→J→—)
                    </button>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td className="p-3 text-sm text-gray-500" colSpan={3}>
                  No hay alumnos. Añade alumnado en el panel “Alumnado”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Atajos: usa “Marcar todos PRESENTE” para acelerar; “Borrar día” limpia las marcas del día
        seleccionado. Puedes navegar con ◀ ▶ o seleccionar fecha en el desplegable.
      </p>
    </section>
  );
}
