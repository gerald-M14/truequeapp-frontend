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
    if (!user?.email) return;
    (async () => {
      try {
        setLoading(true);
        // resolver id por email
        const rUser = await fetch(`${API}/api/usuarios/find?email=${encodeURIComponent(user.email)}`);
        if (!rUser.ok) throw new Error("No se encontró el usuario en BD");
        const u = await rUser.json();

        // pedir solo activos (y reforzar filtro en front)
        const rProd = await fetch(`${API}/api/usuarios/${u.id}/productos?estado=activa`);
        const lista = rProd.ok ? await rProd.json() : [];
        const activos = Array.isArray(lista)
          ? lista.filter(p => (p.estado_publicacion || "").toLowerCase() === "activa")
          : [];
        setMisProductos(activos);
      } catch (e) {
        console.error(e);
        setMisProductos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email]);

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
                <img src={p.imagen_url || "/placeholder.png"} alt={p.titulo} className="h-28 w-full object-cover" />
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{p.titulo}</p>
                  <p className="text-xs text-gray-500">
                    {p.precio_estimado ? `$${Number(p.precio_estimado).toFixed(2)}` : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
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
