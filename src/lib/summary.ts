import type { AttendanceState } from "../app/attendance";
import type { Student } from "../app/students";
import type { CourseConfig } from "../app/config";
import type { Unit } from "../app/units";
import { mapUnitsToDays } from "./units";

export type UnitWithDays = Unit & { days: string[] };

export type UnitSummary = {
  pct: number; // porcentaje de asistencia (0..100)
  totalDays: number; // días lectivos de la unidad
  present: number; // P
  missedU: number; // A (no justificadas)
  missedJ: number; // J (justificadas)
  penalizedMissed: number; // A + (J si config.countJustifiedAgainstLimit)
};

export type StudentSummary = {
  student: Student;
  byUnit: Record<string, UnitSummary>; // unitId -> resumen
};

function summarizeForRange(
  dates: string[],
  attendance: AttendanceState,
  studentId: string,
  config: CourseConfig,
): UnitSummary {
  let present = 0;
  let a = 0;
  let j = 0;

  for (const day of dates) {
    const mark = attendance[studentId]?.[day] || "";
    if (mark === "P") present++;
    else if (mark === "A") a++;
    else if (mark === "J") j++;
  }

  const totalDays = dates.length;
  const penalizedMissed = a + (config.countJustifiedAgainstLimit ? j : 0);
  const attendedDays = totalDays - penalizedMissed;
  const pct = totalDays > 0 ? (attendedDays / totalDays) * 100 : 0;

  return { pct, totalDays, present, missedU: a, missedJ: j, penalizedMissed };
}

export function computeSummary(
  students: Student[],
  attendance: AttendanceState,
  units: Unit[],
  classDays: string[],
  config: CourseConfig,
) {
  // Unidades reales con días
  const unitsWithDays: UnitWithDays[] = mapUnitsToDays(units, classDays);

  // Pseudo-unidad TOTAL
  const totalUnit: UnitWithDays = {
    id: "__TOTAL__",
    code: "TOTAL",
    name: "TOTAL CURSO",
    start: config.start,
    end: config.end,
    requiredPct: config.requiredPct,
    days: classDays,
  };

  const allUnits: UnitWithDays[] = [totalUnit, ...unitsWithDays];

  const summaries: StudentSummary[] = students.map((student) => {
    const byUnit: Record<string, UnitSummary> = {};
    for (const u of allUnits) {
      const rec = summarizeForRange(u.days, attendance, student.id, config);
      byUnit[u.id] = rec;
    }
    return { student, byUnit };
  });

  return { summaries, units: allUnits };
}
