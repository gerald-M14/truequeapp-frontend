"use client"

import { useEffect, useState } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { useNavigate } from "react-router-dom"
import { User, Calendar, MapPin, FileText, Plus, RefreshCw, Edit2, Trash2, Save, Package } from "lucide-react"

const API = "https://truequeapp-api-vercel.vercel.app"

// Utilidad para limitar concurrencia al enriquecer
async function withLimit(items, limit, worker) {
  const out = []
  let i = 0
  async function run() {
    while (i < items.length) {
      const idx = i++
      out[idx] = await worker(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return out
}

export default function PerfilEditar() {
  const { user, isAuthenticated } = useAuth0()
  const [dbUser, setDbUser] = useState(null)
  const [provincias, setProvincias] = useState([])
  const [form, setForm] = useState({ fecha_nacimiento: "", descripcion: "", provincia_id: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  // Mis productos
  const [misProductos, setMisProductos] = useState([])
  const [loadingProductos, setLoadingProductos] = useState(false)
  const [productosMsg, setProductosMsg] = useState("")
  const navigate = useNavigate()

  // 1) Resolver usuario en BD por email + cargar provincias/detalles + mis productos
  useEffect(() => {
    ;(async () => {
      try {
        if (!isAuthenticated || !user?.email) return
        // usuario BD
        const r = await fetch(`${API}/api/usuarios/find?email=${encodeURIComponent(user.email)}`)
        if (!r.ok) throw new Error("No se encontró el usuario en BD")
        const u = await r.json()
        setDbUser(u)

        // provincias + detalles
        const [rp, rd] = await Promise.all([
          fetch(`${API}/api/provincias`),
          fetch(`${API}/api/usuarios/${u.id}/detalles`),
        ])
        const provs = rp.ok ? await rp.json() : []
        const det = rd.ok ? await rd.json() : {}
        setProvincias(provs)
        setForm({
          fecha_nacimiento: det.fecha_nacimiento ? det.fecha_nacimiento.substring(0, 10) : "",
          descripcion: det.descripcion || "",
          provincia_id: det.provincia_id || "",
        })

        // mis productos (endpoint dedicado)
        // mis productos (preferimos 'todas'; si algo falla, unimos activa+intercambiada)
        setLoadingProductos(true);
        setProductosMsg("");

        let mis = [];
        try {
          const rTodas = await fetch(`${API}/api/usuarios/${u.id}/productos?estado=todas`);
          if (rTodas.ok) {
            mis = await rTodas.json();
          } else {
            // fallback: unir activa + intercambiada
            const [rAct, rInt] = await Promise.all([
              fetch(`${API}/api/usuarios/${u.id}/productos?estado=activa`),
              fetch(`${API}/api/usuarios/${u.id}/productos?estado=intercambiada`)
            ]);
            const act = rAct.ok ? await rAct.json() : [];
            const inter = rInt.ok ? await rInt.json() : [];
            const map = new Map();
            [...act, ...inter].forEach(p => map.set(p.id_producto, p));
            mis = Array.from(map.values());
          }
        } catch (e) {
          console.warn('Error cargando productos (todas/merge):', e);
        }

        setMisProductos(Array.isArray(mis) ? mis : []);
        if (!mis || mis.length === 0) {
          setProductosMsg("No se encontraron productos por el endpoint dedicado. Probando plan B…");
        }

      } catch (e) {
        setMsg(e.message)
      } finally {
        setLoading(false)
        setLoadingProductos(false)
      }
    })()
  }, [isAuthenticated, user?.email])

  // 2) Plan B: si no hay productos por /usuarios/:id/productos, reconstruir desde el listado general + detalle
  useEffect(() => {
    if (!dbUser?.id) return
    if (misProductos.length > 0) return
    ;(async () => {
      try {
        setLoadingProductos(true)
        // listado general
        const rl = await fetch(`${API}/api/productos`)
        if (!rl.ok) throw new Error("No se pudo cargar listado general")
        const list = await rl.json()
        if (!Array.isArray(list) || list.length === 0) {
          setProductosMsg("No hay productos publicados en el listado general.")
          return
        }
        // enriquecer con detalle para obtener user_id y filtrar los del dueño
        const enriched = await withLimit(list, 4, async (p) => {
          try {
            const rd = await fetch(`${API}/api/productos/${p.id_producto}`)
            if (!rd.ok) return p
            const det = await rd.json()
            const prod = det?.producto || {}
            return {
              ...p,
              user_id: prod.user_id ?? p.user_id,
              categorias: prod.categorias ?? p.categorias,
              owner_email: prod.usuario_email || null,
              owner_name: prod.usuario_nombre || null,
            }
          } catch {
            return p
          }
        })

        const meId = dbUser?.id != null ? String(dbUser.id) : null
        const meEmail = (user?.email || "").trim().toLowerCase()
        const meName = (user?.name || "").trim().toLowerCase()

        const mine = enriched.filter((p) => {
          const pid = p.user_id != null ? String(p.user_id) : null
          const pmail = (p.owner_email || "").trim().toLowerCase()
          const pname = (p.owner_name || "").trim().toLowerCase()
          if (meId && pid && pid === meId) return true
          if (meEmail && pmail && meEmail === pmail) return true
          if (meName && pname && meName === pname) return true
          return false
        })

        setMisProductos(mine)
        if (mine.length === 0) {
          setProductosMsg("Plan B ejecutado pero no se hallaron productos que pertenezcan al usuario.")
        } else {
          setProductosMsg("")
        }
      } catch (e) {
        setProductosMsg(e.message || "Error en el plan B de productos")
      } finally {
        setLoadingProductos(false)
      }
    })()
  }, [dbUser?.id, misProductos.length])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!dbUser?.id) return
    try {
      setSaving(true)
      setMsg("")
      const r = await fetch(`${API}/api/usuarios/${dbUser.id}/detalles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_nacimiento: form.fecha_nacimiento || null,
          descripcion: form.descripcion || null,
          provincia_id: form.provincia_id || null,
        }),
      })
      if (!r.ok) throw new Error("No se pudo guardar")
      setMsg("Cambios guardados exitosamente")
    } catch (e) {
      setMsg(e.message || "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const onEditarProducto = (id_producto) => {
    navigate(`/producto/${id_producto}/editar`)
  }

  const onEliminarProducto = async (id_producto) => {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    try {
      const r = await fetch(`${API}/api/productos/${id_producto}`, {
        method: "DELETE",
        headers: { "x-user-email": user?.email || "" },
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.detail || json.error || "No se pudo eliminar el producto");

      // Quitar de la lista local siempre (real o soft)
      setMisProductos((list) => list.filter((p) => p.id_producto !== id_producto));

      if (json.softDeleted) {
        alert("El producto tenía referencias y se desactivó (soft-delete).");
      }
    } catch (e) {
      alert(e.message || "Error eliminando el producto");
    }
  };



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <User className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h2>
          <p className="text-slate-600">Inicia sesión para editar tu perfil.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando tu perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <span className="text-lg">←</span> Volver
      </button>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Editar Perfil</h1>
          <p className="text-slate-600">Administra tu información personal y tus productos publicados</p>
        </div>

        {/* FORM PERFIL */}
        <form
          onSubmit={onSave}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Información Personal</h2>
              <p className="text-sm text-slate-500">Actualiza tus datos de perfil</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 text-slate-400" />
                Nombre
              </label>
              <input
                disabled
                value={dbUser?.name || ""}
                className="w-full border border-slate-300 rounded-xl px-4 h-12 bg-slate-50 text-slate-600 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Se obtiene del login (Auth0)
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={onChange}
                  className="w-full border border-slate-300 rounded-xl px-4 h-12 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Provincia
                </label>
                <select
                  name="provincia_id"
                  value={form.provincia_id ?? ""}
                  onChange={onChange}
                  className="w-full border border-slate-300 rounded-xl px-4 h-12 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="">Seleccione...</option>
                  {provincias.map((p) => (
                    <option key={p.id_provincia} value={p.id_provincia}>
                      {p.nombre_provincia}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Descripción Personal
              </label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={onChange}
                rows={4}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                placeholder="Cuéntanos brevemente sobre ti..."
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Save className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
              {msg && (
                <span
                  className={`text-sm font-medium ${msg.includes("exitosamente") ? "text-emerald-600" : "text-slate-600"}`}
                >
                  {msg}
                </span>
              )}
            </div>
          </div>
        </form>

        {/* MIS PRODUCTOS */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Mis Productos</h2>
                <p className="text-sm text-slate-500">Administra tus publicaciones</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/publicar")}
                className="flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Publicar nuevo
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all duration-300"
                title="Recargar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* {dbUser && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Debug:</span> dbUser.id=<b>{dbUser.id}</b> · auth0 email=
                <b>{user?.email}</b> · nombre=<b>{user?.name}</b>
              </p>
            </div>
          )} */}

          {productosMsg && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">{productosMsg}</p>
            </div>
          )}

          {loadingProductos ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
              <p className="text-slate-600 font-medium">Cargando productos...</p>
            </div>
          ) : misProductos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-2">Aún no hay productos publicados</p>
              <p className="text-sm text-slate-500">Comienza publicando tu primer producto</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {misProductos.map((p) => (
                <article
                  key={p.id_producto}
                  className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={p.imagen_url || p.imagen_principal || "/placeholder.png"}
                      alt={p.titulo}
                      className="h-52 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png"
                      }}
                    />
                    {p.categorias && (
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-xs font-semibold text-slate-800 px-3 py-1.5 rounded-full shadow-lg">
                        {p.categorias}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1">{p.titulo}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600">
                      {p.estado_publicacion}
                    </span>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">{p.descripcion}</p>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onEditarProducto(p.id_producto)}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-medium px-4 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => onEliminarProducto(p.id_producto)}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-medium px-4 h-10 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
