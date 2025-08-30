export type Unit = {
  id: string;
  code: string; // ej. "MF0491_3 - UF1841"
  name: string; // etiqueta visible
  start: string; // YYYY-MM-DD (inclusive)
  end: string; // YYYY-MM-DD (inclusive)
  requiredPct?: number; // por defecto 75 (usa el de config si no viene)
};

export const DEFAULT_UNITS: Unit[] = [
  { id: "MF0491-UF1841", code: "UF1841", name: "MF0491_3 – UF1841", start: "", end: "" },
  { id: "MF0491-UF1842", code: "UF1842", name: "MF0491_3 – UF1842", start: "", end: "" },
  { id: "MF0491-UF1843", code: "UF1843", name: "MF0491_3 – UF1843", start: "", end: "" },
  { id: "MF0492-UF1844", code: "UF1844", name: "MF0492_3 – UF1844", start: "", end: "" },
  { id: "MF0492-UF1845", code: "UF1845", name: "MF0492_3 – UF1845", start: "", end: "" },
  { id: "MF0492-UF1846", code: "UF1846", name: "MF0492_3 – UF1846", start: "", end: "" },
  { id: "MF0493", code: "MF0493_3", name: "MF0493_3", start: "", end: "" },
];
