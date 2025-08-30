import { useState } from "react";

export default function App() {
  const [ready] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-2xl font-bold">Asistencia IFCD0210</h1>
          <p className="text-sm text-gray-600">Murcia · L–V · 09:00–14:00</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Estado</h2>
          <p className="text-sm text-gray-600">
            Proyecto inicial listo. A continuación iremos añadiendo: configuración del curso,
            alumnos, pase de lista y resumen por unidad.
          </p>
          {ready && <div className="mt-4 rounded-xl border p-4">✅ Listo para empezar</div>}
        </div>
      </main>
    </div>
  );
}
