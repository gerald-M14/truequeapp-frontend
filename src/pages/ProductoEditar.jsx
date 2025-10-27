// /src/pages/ProductoEditar.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const API = "https://truequeapp-api-vercel.vercel.app";

// Cloudinary (unsigned)
const CLOUD_NAME = "dytgr35it";
const UPLOAD_PRESET = "trueque_unsigned";

const estadoBadge = (estado = "") => {
  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium";
  const map = {
    activa: "bg-green-100 text-green-700",
    pausada: "bg-amber-100 text-amber-700",
    eliminada: "bg-red-100 text-red-700",
    intercambiada: "bg-indigo-100 text-indigo-700",
  };
  return `${base} ${map[estado] || "bg-slate-100 text-slate-700"}`;
};


export default function ProductoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth0();

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    estado_producto: "usado",
    condicion: "bueno",
    precio_estimado: "",
    imagen_url: "",             // aquí guardamos la URL final (secure_url)
    estado_publicacion: "activa",
  });

  const [file, setFile] = useState(null);     // archivo local elegido
  const [preview, setPreview] = useState(""); // preview de imagen
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`${API}/api/productos/${id}`);
        if (!r.ok) throw new Error("No se pudo cargar el producto");
        const { producto } = await r.json();
        const img = producto?.imagen_principal || "";
        setForm({
          titulo: producto?.titulo || "",
          descripcion: producto?.descripcion || "",
          estado_producto: producto?.estado_producto || "usado",
          condicion: producto?.condicion || "bueno",
          precio_estimado: producto?.precio_estimado ?? "",
          imagen_url: img,
          estado_publicacion: producto?.estado_publicacion || "activa",
        });
        setPreview(img || "");
      } catch (e) {
        setMsg(e.message || "Error cargando producto");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setMsg("El archivo debe ser una imagen.");
      e.target.value = "";
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setMsg("La imagen no debe superar 5MB.");
      e.target.value = "";
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // Sube imagen a Cloudinary y retorna secure_url
  const uploadImage = async (imageFile) => {
    const fd = new FormData();
    fd.append("file", imageFile);
    fd.append("upload_preset", UPLOAD_PRESET);
    // Opcional para organizar en carpeta:
    // fd.append("folder", "truequeapp/productos");

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const r = await fetch(url, { method: "POST", body: fd });
    const json = await r.json();

    if (!r.ok || !json.secure_url) {
      throw new Error(json.error?.message || "Fallo subiendo la imagen");
    }
    return json.secure_url;
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg("");

      let finalImageUrl = form.imagen_url;

      // Si el usuario seleccionó un archivo, primero súbelo
      if (file) {
        finalImageUrl = await uploadImage(file);
      }

      const r = await fetch(`${API}/api/productos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "", // validación de dueño en backend
        },
        body: JSON.stringify({ ...form, imagen_url: finalImageUrl }),
      });

      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || "No se pudo guardar");

      setMsg("Producto actualizado ✅");
      setTimeout(() => navigate("/perfil/editar"), 600);
    } catch (e) {
      setMsg(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return <div className="p-6">Inicia sesión.</div>;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
      </div>
    );

  return (
    <section className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Editar producto</h1>
        <Link to="/perfil/editar" className="text-teal-700 hover:underline">
          ← Volver
        </Link>
      </div>

      <form onSubmit={onSave} className="bg-white border rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Título</label>
          <input
            name="titulo"
            value={form.titulo}
            onChange={onChange}
            className="w-full border rounded-lg px-3 h-10"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={onChange}
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Estado del producto</label>
            <select
              name="estado_producto"
              value={form.estado_producto}
              onChange={onChange}
              className="w-full border rounded-lg px-3 h-10 bg-white"
            >
              <option value="nueva">nueva</option>
              <option value="usado">usado</option>
              <option value="reparacion">reparacion</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Condición</label>
            <select
              name="condicion"
              value={form.condicion}
              onChange={onChange}
              className="w-full border rounded-lg px-3 h-10 bg-white"
            >
              <option value="excelente">excelente</option>
              <option value="bueno">bueno</option>
              <option value="regular">regular</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Precio estimado</label>
            <input
              name="precio_estimado"
              type="number"
              step="0.01"
              value={form.precio_estimado}
              onChange={onChange}
              className="w-full border rounded-lg px-3 h-10"
            />
          </div>
        </div>

        {/* Subida de imagen */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Imagen principal</label>

          <div
            className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={onFileChange}
            />
            {!preview ? (
              <p className="text-gray-500">
                Arrastra y suelta una imagen aquí o{" "}
                <span className="text-teal-700 underline">haz clic para seleccionar</span>
              </p>
            ) : (
              <img src={preview} alt="preview" className="mx-auto h-40 rounded-lg object-cover" />
            )}
          </div>

          {/* Campo opcional por si alguien quiere pegar una URL directa */}
          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">
              (Opcional) Pegar URL de imagen
            </label>
            <input
              name="imagen_url"
              value={form.imagen_url}
              onChange={(e) => {
                setForm((f) => ({ ...f, imagen_url: e.target.value }));
                if (!file) setPreview(e.target.value || "");
              }}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 h-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Estado de publicación</label>
          <select
            name="estado_publicacion"
            value={form.estado_publicacion ?? ""}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-xl px-4 h-12 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
          >
            <option value="">Seleccione...</option>
            <option value="activa">Activa</option>
            <option value="pausada">Pausada</option>
            <option value="intercambiada">Intercambiada</option>
            {/* <option value="eliminada">Eliminada</option> */}
          </select>
        </div>


        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          {msg && <span className="text-sm text-gray-600">{msg}</span>}
        </div>
      </form>
    </section>
  );
}
