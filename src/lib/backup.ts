import type { CourseConfig } from "../app/config";
import type { Unit } from "../app/units";
import type { Student } from "../app/students";
import type { AttendanceState } from "../app/attendance";

export type AppBackup = {
  _type: "ifcd0210-backup";
  version: 1;
  timestamp: string; // ISO
  payload: {
    config: CourseConfig;
    units: Unit[];
    students: Student[];
    attendance: AttendanceState;
    selectedDate: string;
  };
};

export function makeBackup(params: AppBackup["payload"]): AppBackup {
  return {
    _type: "ifcd0210-backup",
    version: 1,
    timestamp: new Date().toISOString(),
    payload: params,
  };
}

export function isBackupShape(obj: any): obj is AppBackup {
  return (
    obj &&
    obj._type === "ifcd0210-backup" &&
    obj.version === 1 &&
    obj.payload &&
    typeof obj.payload === "object" &&
    typeof obj.timestamp === "string"
  );
}

export function downloadJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 400);
}
