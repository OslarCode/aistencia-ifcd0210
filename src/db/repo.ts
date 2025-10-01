import { supabase } from "./supabase";
import type { CourseConfig } from "../app/config";
import type { Unit } from "../app/units";
import type { Student } from "../app/students";
import type { AttendanceState, AttendanceMark } from "../app/attendance";

const CONFIG_KEY = "course_config";

export async function loadConfig(): Promise<CourseConfig | null> {
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", CONFIG_KEY)
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}
export async function saveConfig(cfg: CourseConfig) {
  const { error } = await supabase
    .from("app_config")
    .upsert({ key: CONFIG_KEY, value: cfg }, { onConflict: "key" });
  if (error) throw error;
}

export async function loadUnits(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("id, code, name, start, end, required_pct")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    code: u.code ?? "",
    name: u.name,
    start: u.start ?? "",
    end: u.end ?? "",
    requiredPct: u.required_pct ?? undefined,
  }));
}
export async function upsertUnits(units: Unit[]) {
  const payload = units.map((u) => ({
    id: u.id,
    code: u.code || null,
    name: u.name,
    start: u.start || null,
    end: u.end || null,
    required_pct: u.requiredPct ?? null,
  }));
  const { error } = await supabase.from("units").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}
export async function deleteUnit(id: string) {
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw error;
}

export async function loadStudents(): Promise<Student[]> {
  const { data, error } = await supabase.from("students").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}
export async function upsertStudents(students: Student[]) {
  const { error } = await supabase.from("students").upsert(students, { onConflict: "id" });
  if (error) throw error;
}
export async function deleteStudent(id: string) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}

export async function loadAttendance(): Promise<AttendanceState> {
  const { data, error } = await supabase
    .from("attendance")
    .select("student_id, date, mark")
    .order("date");
  if (error) throw error;
  const map: AttendanceState = {};
  for (const row of data ?? []) {
    (map[row.student_id] ??= {})[row.date] = row.mark as AttendanceMark;
  }
  return map;
}
export async function setAttendanceMark(studentId: string, date: string, mark: AttendanceMark) {
  const { error } = await supabase
    .from("attendance")
    .upsert([{ student_id: studentId, date, mark }], { onConflict: "student_id, date" });
  if (error) throw error;
}
export async function clearAttendanceFor(date: string, studentIds: string[]) {
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("date", date)
    .in("student_id", studentIds);
  if (error) throw error;
}
