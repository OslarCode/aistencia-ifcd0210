export type AttendanceMark = "" | "P" | "A" | "J";
// Estructura: { [studentId]: { [YYYY-MM-DD]: "P" | "A" | "J" } }
export type AttendanceState = Record<string, Record<string, AttendanceMark>>;
