import type { CourseConfig } from "../app/config";

export const toDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};
export const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

export function generateClassDays(config: CourseConfig): string[] {
  const start = toDate(config.start);
  const end = toDate(config.end);
  const allowed = new Set(config.daysOfWeek); // 1..5
  const holidaySet = new Set(config.holidays);
  const out: string[] = [];

  for (let d = start; d <= end; d = addDays(d, 1)) {
    const dow = d.getDay(); // 0=Dom..6=Sáb
    const isWeekend = dow === 0 || dow === 6;
    const isAllowed = allowed.has(dow);
    const ds = fmt(d);
    if (!isWeekend && isAllowed && !holidaySet.has(ds)) out.push(ds);
  }
  return out;
}
