export type CourseConfig = {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  hoursPerDay: number; // p.ej. 5
  startTime: string; // "09:00"
  endTime: string; // "14:00"
  daysOfWeek: number[]; // 1..5 (L–V)
  requiredPct: number; // 75
  holidays: string[]; // ["2025-10-13", ...]
  countJustifiedAgainstLimit: boolean; // true/false
};

export const DEFAULT_CONFIG: CourseConfig = {
  start: "2025-09-16",
  end: "2026-01-29",
  hoursPerDay: 5,
  startTime: "09:00",
  endTime: "14:00",
  daysOfWeek: [1, 2, 3, 4, 5],
  requiredPct: 75,
  holidays: [
    "2025-10-13",
    "2025-12-08",
    "2025-12-24",
    "2025-12-25",
    "2025-12-26",
    "2025-12-31",
    "2026-01-01",
    "2026-01-02",
    "2026-01-06",
  ],
  countJustifiedAgainstLimit: false,
};
