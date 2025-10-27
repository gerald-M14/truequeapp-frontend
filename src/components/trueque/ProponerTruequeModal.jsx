// /src/components/trueque/ProponerTruequeModal.jsx
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const API = "https://truequeapp-api-vercel.vercel.app";

export default function ProponerTruequeModal({ productoObjetivo, onClose, onConfirm }) {
  const { user } = useAuth0();
  const [misProductos, setMisProductos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        // Reutiliza tu endpoint existente ✅
        const res = await fetch(`${API}/api/usuarios/${user.sub}/productos`);
        if (!res.ok) throw new Error("No se pudieron cargar tus productos");
        const json = await res.json();
        setMisProductos(json);
      } catch (err) {
        console.error("Error cargando productos del usuario:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Selecciona un producto para proponer el trueque
        </h2>

        {loading ? (
          <p className="text-gray-500">Cargando tus productos...</p>
        ) : misProductos.length === 0 ? (
          <p className="text-gray-500">No tienes productos activos para intercambiar.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {misProductos.map((p) => (
              <div
                key={p.id_producto}
                onClick={() => setSeleccionado(p)}
                className={`cursor-pointer border rounded-lg overflow-hidden transition ${
                  seleccionado?.id_producto === p.id_producto
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <img
                  src={p.imagen_url || "/placeholder.png"}
                  alt={p.titulo}
                  className="h-28 w-full object-cover"
                />
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{p.titulo}</p>
                  <p className="text-xs text-gray-500">${p.precio_estimado ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            disabled={!seleccionado}
            onClick={() => onConfirm(seleccionado)}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              seleccionado ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Intercambiar con este producto
          </button>
        </div>
      </div>
    </div>
  );
}
