import { useMemo } from "react";
import type { Student } from "../../app/students";
import type { AttendanceState } from "../../app/attendance";
import type { CourseConfig } from "../../app/config";
import type { Unit } from "../../app/units";
import { computeSummary } from "../../lib/summary";

type Props = {
  students: Student[];
  attendance: AttendanceState;
  units: Unit[];
  classDays: string[];
  config: CourseConfig;
  hoursPerDay: number;
};

export default function SummaryPanel({
  students,
  attendance,
  units,
  classDays,
  config,
  hoursPerDay,
}: Props) {
  const { summaries, units: allUnits } = useMemo(
    () => computeSummary(students, attendance, units, classDays, config),
    [students, attendance, units, classDays, config],
  );

  const exportSummaryCSV = () => {
    const header = ["Alumno", ...allUnits.map((u) => `${u.name} %`)];
    const rows = summaries.map(({ student, byUnit }) => {
      const cols = [csv(student.name)];
      for (const u of allUnits) {
        const rec = byUnit[u.id];
        cols.push(rec ? rec.pct.toFixed(1) : "");
      }
      return cols.join(",");
    });
    const csvText = [header.join(","), ...rows].join("\n");
    download(csvText, `Resumen_asistencia_${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  const exportDetailCSV = () => {
    // Detalle por fecha -> alumno -> marca
    const dates = classDays;
    const header = ["Fecha", "Alumno", "Estado(P/A/J)"];
    const rows: string[] = [];
    for (const d of dates) {
      for (const s of students) {
        const st = attendance[s.id]?.[d] || "";
        rows.push([d, csv(s.name), st].join(","));
      }
    }
    const csvText = [header.join(","), ...rows].join("\n");
    download(csvText, `Detalle_asistencia_${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Resumen de asistencia</h2>
          <p className="text-sm text-gray-600">
            Regla: <strong>rojo</strong> si &lt; {config.requiredPct}% (o el % propio de la unidad).{" "}
            {config.countJustifiedAgainstLimit ? (
              <span>
                Las justificadas <strong>sí</strong> penalizan.
              </span>
            ) : (
              <span>
                Las justificadas <strong>no</strong> penalizan.
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={exportSummaryCSV}>
            Exportar resumen CSV
          </button>
          <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={exportDetailCSV}>
            Exportar detalle CSV
          </button>
        </div>
      </header>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 rounded-l-lg">Alumno</th>
              {allUnits.map((u) => (
                <th key={u.id} className="p-2 whitespace-nowrap">
                  {u.name}
                  <div className="text-xs font-normal text-gray-500">
                    {u.days.length} d · {u.days.length * hoursPerDay} h
                  </div>
                </th>
              ))}
              <th className="p-2 rounded-r-lg">Justificadas (total)</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(({ student, byUnit }) => {
              const totalJustified = countTotalJustified(student.id, attendance, classDays);
              return (
                <tr key={student.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">{student.name}</td>

                  {allUnits.map((u) => {
                    const rec = byUnit[u.id];
                    const threshold = u.requiredPct ?? config.requiredPct;
                    const isBelow = rec.pct < threshold;
                    const cellClass = rec.totalDays
                      ? isBelow
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-green-50 text-green-700 border border-green-300"
                      : "text-gray-500";
                    return (
                      <td key={u.id} className={`p-2 text-center rounded ${cellClass}`}>
                        {rec.totalDays ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold">{rec.pct.toFixed(1)}%</div>
                            <div className="text-xs opacity-80">
                              Faltas no just.: {rec.missedU} d
                            </div>
                            {rec.missedJ > 0 && (
                              <div className="text-xs opacity-80">Just.: {rec.missedJ} d</div>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}

                  <td className="p-2 text-center">{totalJustified} d</td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td className="p-3 text-sm text-gray-500" colSpan={allUnits.length + 2}>
                  No hay alumnos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Nota: El porcentaje se calcula sobre los <strong>días penalizados</strong>: A +{" "}
        {config.countJustifiedAgainstLimit ? "J" : "(J no penaliza)"}.
      </p>
    </section>
  );
}

// ------- helpers locales -------
function csv(s: string) {
  if (s == null) return "";
  const needs = /[",\n]/.test(String(s));
  return needs ? '"' + String(s).replace(/"/g, '""') + '"' : String(s);
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 400);
}

function countTotalJustified(studentId: string, attendance: AttendanceState, classDays: string[]) {
  let j = 0;
  for (const d of classDays) {
    const mark = attendance[studentId]?.[d];
    if (mark === "J") j++;
  }
  return j;
}
