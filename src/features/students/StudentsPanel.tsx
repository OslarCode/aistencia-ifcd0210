import { useState } from "react";
import type { Student } from "../../app/students";

type Props = {
  students: Student[];
  onChange: (next: Student[]) => void;
  onRemove?: (id: string) => void; // <-- NUEVO (App borra en BD)
};

export default function StudentsPanel({ students, onChange, onRemove }: Props) {
  const [bulk, setBulk] = useState("");

  const addBulk = () => {
    const lines = bulk
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!lines.length) return;
    const enriched = lines.map((name) => ({ id: crypto.randomUUID(), name }));
    onChange([...students, ...enriched]);
    setBulk("");
  };

  const remove = (id: string) => {
    // actualiza UI
    onChange(students.filter((s) => s.id !== id));
    // si hay callback remoto, borra en BD
    onRemove?.(id);
  };

  const emptyAll = () => {
    if (confirm("¿Vaciar lista de alumnos?")) {
      // si quieres borrar en BD todos a la vez, mejor manejarlo arriba en App
      onChange([]);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alumnado</h2>
        <span className="rounded-full border px-2 py-0.5 text-xs">{students.length} alumnos</span>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm">Añadir en bloque (un nombre por línea)</p>
          <textarea
            rows={6}
            className="w-full rounded-2xl border px-3 py-2"
            placeholder={"María García\nJuan Pérez\n…"}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button className="rounded-xl border px-3 py-2" onClick={addBulk}>
              Añadir
            </button>
            <button className="rounded-xl border px-3 py-2" onClick={emptyAll}>
              Vaciar
            </button>
          </div>
        </div>

        <div>
          <ul className="max-h-44 space-y-2 overflow-auto pr-1">
            {students.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-gray-100 px-3 py-2"
              >
                <span className="truncate">{s.name}</span>
                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => remove(s.id)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
