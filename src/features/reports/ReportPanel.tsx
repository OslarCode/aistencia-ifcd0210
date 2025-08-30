import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { CourseConfig } from "../../app/config";
import type { Unit } from "../../app/units";
import type { Student } from "../../app/students";
import type { AttendanceState } from "../../app/attendance";

import { computeSummary } from "../../lib/summary";
import { drawHeader, drawFooter } from "../../lib/pdf";

type Props = {
  config: CourseConfig;
  units: Unit[];
  students: Student[];
  attendance: AttendanceState;
  classDays: string[];
  hoursPerDay: number;
};

export default function ReportPanel({
  config,
  units,
  students,
  attendance,
  classDays,
  hoursPerDay,
}: Props) {
  const { summaries, units: allUnits } = useMemo(
    () => computeSummary(students, attendance, units, classDays, config),
    [students, attendance, units, classDays, config],
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id ?? "");

  const exportResumenGlobal = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    drawHeader(
      doc,
      "Informe de asistencia – IFCD0210",
      `Periodo ${config.start} → ${config.end} · ${classDays.length} días · ${classDays.length * hoursPerDay} h`,
    );

    // Tabla Resumen (por alumno x unidades + TOTAL)
    const head = [
      [
        "Alumno",
        ...allUnits.map(
          (u) => `${u.name}\n(${u.days.length} d · ${u.days.length * hoursPerDay} h)`,
        ),
        "Justificadas (total)",
      ],
    ];

    const body = summaries.map(({ student, byUnit }) => {
      const totalJust = countTotalJustified(student.id, attendance, classDays);
      const row = [student.name];
      for (const u of allUnits) {
        const rec = byUnit[u.id];
        row.push(
          rec.totalDays
            ? `${rec.pct.toFixed(1)}%  |  A:${rec.missedU}${rec.missedJ ? `  J:${rec.missedJ}` : ""}`
            : "—",
        );
      }
      row.push(`${totalJust} d`);
      return row;
    });

    autoTable(doc, {
      head,
      body,
      startY: 34,
      styles: { fontSize: 9, cellPadding: 2, valign: "middle" },
      headStyles: { fillColor: [240, 240, 240], textColor: 20 },
      didParseCell: (data) => {
        // Colorear celdas según umbral (excepto columnas Alumno y Justificadas)
        if (
          data.section === "body" &&
          data.column.index > 0 &&
          data.column.index <= allUnits.length
        ) {
          const unit = allUnits[data.column.index - 1];
          const text = String(data.cell.raw || "");
          const match = text.match(/^([\d.]+)%/);
          const pct = match ? Number(match[1]) : NaN;
          const threshold = unit.requiredPct ?? config.requiredPct;
          if (!isNaN(pct)) {
            if (pct < threshold) {
              data.cell.styles.fillColor = [255, 230, 230];
              data.cell.styles.textColor = [180, 0, 0];
              data.cell.styles.lineColor = [255, 150, 150];
            } else {
              data.cell.styles.fillColor = [232, 245, 233];
              data.cell.styles.textColor = [0, 120, 0];
              data.cell.styles.lineColor = [150, 200, 150];
            }
          } else {
            data.cell.styles.textColor = [120, 120, 120];
          }
        }
      },
    });

    // Leyenda / notas
    const y = (doc as any).lastAutoTable?.finalY ?? 34;
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(
      `Regla: rojo si < ${config.requiredPct}% (o el % propio de la unidad). ` +
        (config.countJustifiedAgainstLimit
          ? "Las justificadas SÍ penalizan el porcentaje."
          : "Las justificadas NO penalizan el porcentaje."),
      14,
      y + 8,
    );

    drawFooter(doc);
    doc.save(`Resumen_IFCD0210_${Date.now()}.pdf`);
  };

  const exportPorAlumno = () => {
    if (!selectedStudentId) return;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    drawHeader(
      doc,
      `Informe individual – ${student.name}`,
      `Periodo ${config.start} → ${config.end} · ${classDays.length} días · ${classDays.length * hoursPerDay} h`,
    );

    // Resumen por unidad (incluye TOTAL)
    const { byUnit } = summaries.find((s) => s.student.id === student.id)!;

    autoTable(doc, {
      startY: 34,
      head: [["Unidad", "% asistencia", "Días", "P", "A (no just.)", "J (just.)"]],
      body: allUnits.map((u) => {
        const rec = byUnit[u.id];
        return [
          `${u.name} (${u.days.length} d · ${u.days.length * hoursPerDay} h)`,
          rec.totalDays ? `${rec.pct.toFixed(1)}%` : "—",
          String(rec.totalDays),
          String(rec.present),
          String(rec.missedU),
          String(rec.missedJ),
        ];
      }),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: 20 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          // Colorear % por debajo del umbral
          const unit = allUnits[data.row.index];
          const txt = String(data.cell.raw || "");
          const m = txt.match(/^([\d.]+)%/);
          const pct = m ? Number(m[1]) : NaN;
          const threshold = unit.requiredPct ?? config.requiredPct;
          if (!isNaN(pct)) {
            if (pct < threshold) {
              data.cell.styles.fillColor = [255, 230, 230];
              data.cell.styles.textColor = [180, 0, 0];
              data.cell.styles.lineColor = [255, 150, 150];
            } else {
              data.cell.styles.fillColor = [232, 245, 233];
              data.cell.styles.textColor = [0, 120, 0];
              data.cell.styles.lineColor = [150, 200, 150];
            }
          }
        }
      },
    });

    // Detalle cronológico (opcional: todas las marcas P/A/J por fecha)
    const startY = (doc as any).lastAutoTable?.finalY ?? 34;
    const daily = classDays.map((d) => {
      const mark = attendance[student.id]?.[d] || "";
      return [d, markLabel(mark)];
    });

    autoTable(doc, {
      startY: startY + 8,
      head: [["Fecha", "Estado"]],
      body: daily,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [245, 245, 245], textColor: 20 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const val = String(data.cell.raw || "");
          if (val.startsWith("AUSENTE (No just.)")) {
            data.cell.styles.textColor = [180, 0, 0];
          } else if (val.startsWith("AUSENTE (Just.)")) {
            data.cell.styles.textColor = [120, 120, 120];
          } else if (val.startsWith("PRESENTE")) {
            data.cell.styles.textColor = [0, 120, 0];
          }
        }
      },
    });

    doc.setFontSize(9);
    doc.setTextColor(80);
    const y = (doc as any).lastAutoTable?.finalY ?? 34;
    doc.text(
      config.countJustifiedAgainstLimit
        ? "Nota: Las ausencias justificadas penalizan el % de asistencia."
        : "Nota: Las ausencias justificadas NO penalizan el % de asistencia.",
      14,
      y + 8,
    );

    drawFooter(doc);
    const safeName = student.name.replace(/[^\w\s-]+/g, "_").replace(/\s+/g, "_");
    doc.save(`Informe_${safeName}_${Date.now()}.pdf`);
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reportes finales (PDF)</h2>
          <p className="text-sm text-gray-600">
            Genera PDFs oficiales con el resumen global y reportes individuales por alumno.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={exportResumenGlobal}>
            Exportar PDF · Resumen global
          </button>

          <select
            className="rounded-lg border px-2 py-1.5 text-sm"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm"
            onClick={exportPorAlumno}
            disabled={!selectedStudentId}
          >
            Exportar PDF · Alumno
          </button>
        </div>
      </header>

      <ul className="list-disc pl-5 text-xs text-gray-600">
        <li>
          El resumen global marca en <strong>rojo</strong> las unidades por debajo del % requerido.
        </li>
        <li>El informe individual incluye resumen por unidad y detalle por fecha (P/A/J).</li>
        <li>Formato A4, tipografía Helvetica. Descarga directa en el navegador.</li>
      </ul>
    </section>
  );
}

// ------- helpers locales -------
function markLabel(mark: string) {
  if (mark === "P") return "PRESENTE";
  if (mark === "A") return "AUSENTE (No just.)";
  if (mark === "J") return "AUSENTE (Just.)";
  return "—";
}

function countTotalJustified(studentId: string, attendance: AttendanceState, classDays: string[]) {
  let j = 0;
  for (const d of classDays) if (attendance[studentId]?.[d] === "J") j++;
  return j;
}
