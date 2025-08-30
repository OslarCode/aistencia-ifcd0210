import { fmt, toDate } from "./dates";
import type { Unit } from "../app/units";

/** Devuelve las unidades con su lista de días lectivos (intersección con classDays) */
export function mapUnitsToDays(units: Unit[], classDays: string[]) {
  const result = units.map((u) => {
    if (!u.start || !u.end) return { ...u, days: [] as string[] };
    const s = toDate(u.start);
    const e = toDate(u.end);
    const days = classDays.filter((d) => {
      const dd = toDate(d);
      return dd >= s && dd <= e;
    });
    return { ...u, days };
  });
  return result as Array<Unit & { days: string[] }>;
}

/** Validaciones rápidas de una unidad respecto al calendario lectivo */
export function validateUnit(u: Unit, classDays: string[]) {
  const errors: string[] = [];
  if (!u.start || !u.end) {
    errors.push("Faltan fechas de inicio/fin");
    return { errors, days: [] as string[] };
  }
  const s = toDate(u.start);
  const e = toDate(u.end);
  if (e < s) errors.push("Fin anterior al inicio");

  const allSet = new Set(classDays);
  const days: string[] = [];
  for (let d = s; d <= e; d.setDate(d.getDate() + 1)) {
    const key = fmt(d);
    if (allSet.has(key)) days.push(key);
  }
  if (days.length === 0) errors.push("Rango sin días lectivos (revisa festivos/fines de semana)");

  return { errors, days };
}

/** Pequeño helper para IDs robustos en navegador/Node */
export function uuid() {
  // @ts-ignore
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `u_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
