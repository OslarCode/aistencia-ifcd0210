import { useRef, useState } from "react";
import type { CourseConfig } from "../../app/config";
import type { Unit } from "../../app/units";
import type { Student } from "../../app/students";
import type { AttendanceState } from "../../app/attendance";
import { downloadJson, isBackupShape, makeBackup, type AppBackup } from "../../lib/backup";

type Props = {
  config: CourseConfig;
  units: Unit[];
  students: Student[];
  attendance: AttendanceState;
  selectedDate: string;

  // setters para restaurar
  setConfig: (c: CourseConfig) => void;
  setUnits: (u: Unit[]) => void;
  setStudents: (s: Student[]) => void;
  setAttendance: (a: AttendanceState) => void;
  setSelectedDate: (d: string) => void;
};

export default function BackupPanel({
  config,
  units,
  students,
  attendance,
  selectedDate,
  setConfig,
  setUnits,
  setStudents,
  setAttendance,
  setSelectedDate,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

  const onExport = () => {
    const backup = makeBackup({ config, units, students, attendance, selectedDate });
    downloadJson(backup, `backup_ifcd0210_${Date.now()}.json`);
    setStatus({ ok: true, msg: "Backup exportado correctamente." });
  };

  const onImportClick = () => fileRef.current?.click();

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as AppBackup;
      if (!isBackupShape(data)) {
        setStatus({ ok: false, msg: "El archivo no tiene el formato de backup esperado." });
        return;
      }

      // Confirmación explícita (sobrescribe TODO)
      const ok = confirm(
        "Esta acción reemplazará Configuración, Unidades, Alumnado, Asistencia y la fecha seleccionada.\n¿Quieres continuar?",
      );
      if (!ok) return;

      // Restaurar
      setConfig(data.payload.config);
      setUnits(data.payload.units);
      setStudents(data.payload.students);
      setAttendance(data.payload.attendance);
      setSelectedDate(data.payload.selectedDate);

      setStatus({ ok: true, msg: "Backup importado y restaurado correctamente." });
      e.target.value = ""; // limpia input
    } catch (err) {
      console.error(err);
      setStatus({ ok: false, msg: "No se pudo leer el archivo (¿JSON válido?)." });
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Backups (Exportar/Importar JSON)</h2>
          <p className="text-sm text-gray-600">
            Exporta un archivo <code>.json</code> con todos los datos. Importa para restaurar en
            este u otro navegador.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={onExport}>
            Exportar JSON
          </button>
          <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={onImportClick}>
            Importar JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportFile}
          />
        </div>
      </header>

      {status && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            status.ok
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {status.msg}
        </div>
      )}

      <ul className="mt-3 list-disc pl-5 text-xs text-gray-600">
        <li>
          El backup incluye: configuración, unidades, alumnado, asistencia y la fecha seleccionada.
        </li>
        <li>
          Al importar, se <strong>reemplaza todo</strong> el estado actual por el del backup.
        </li>
        <li>El archivo lleva cabecera de tipo y versión para validación básica.</li>
      </ul>
    </section>
  );
}
