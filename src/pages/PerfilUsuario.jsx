"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Star, ShieldCheck, Package, TrendingUp, MapPin } from "lucide-react"
import { supabase } from "../lib/supabase"

const API = "https://truequeapp-api-vercel.vercel.app"

function StarRating({ value = 0, outOf = 5 }) {
  const full = Math.floor(value || 0)
  const half = (value || 0) % 1 >= 0.5
  const empty = outOf - full - (half ? 1 : 0)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
      {half && <Star className="w-4 h-4 fill-amber-400 text-amber-400 opacity-50" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="w-4 h-4 text-gray-300" />
      ))}
    </div>
  )
}

export default function PerfilUsuario() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [perfil, setPerfil] = useState(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  // Supabase count
  const [sbCount, setSbCount] = useState(null)
  const [sbLoading, setSbLoading] = useState(false)

  // 1) API: perfil + productos (+ detalles para email si falta)
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setErr("")

        const [rp, rprods] = await Promise.all([
          fetch(`${API}/api/usuarios/${id}/perfil`),
          fetch(`${API}/api/usuarios/${id}/productos`),
        ])
        if (!rp.ok) throw new Error("Perfil no disponible")
        const prof = await rp.json()

        const prods = rprods.ok ? await rprods.json() : []

        // si no trae email, intenta /detalles
        if (!prof?.email && !prof?.usuario_email) {
          try {
            const rd = await fetch(`${API}/api/usuarios/${id}/detalles`)
            if (rd.ok) {
              const det = await rd.json()
              prof.email = det?.email || det?.usuario_email || prof?.email
            }
          } catch {}
        }

        // último intento: desde productos (si hay)
        if (!prof?.email && !prof?.usuario_email && Array.isArray(prods) && prods.length) {
          const first = prods.find(Boolean) || {}
          prof.email =
            first.usuario_email ||
            first.owner_email ||
            first.user_email ||
            prof.email
        }

        setPerfil(prof)
        setProductos(Array.isArray(prods) ? prods : [])
      } catch (e) {
        setErr(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // 2) email a usar para contar en supabase
  const profileEmail = useMemo(() => {
    const p = perfil || {}
    return (
      p.email ||
      p.usuario_email ||
      p.user_email ||
      p.correo ||
      null
    )
  }, [perfil])

  // 3) contar conversaciones completadas en Supabase
  useEffect(() => {
    if (!profileEmail) { setSbCount(null); return }
    let cancelled = false
    ;(async () => {
      try {
        setSbLoading(true)
        const { count, error } = await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .contains("participants", [profileEmail])     // jsonb[] o text[] con emails
          .eq("deal_state", "completed")               // requiere que ya hayas marcado completed
        if (error) {
          console.warn("RLS/Consulta Supabase falló:", error.message)
          if (!cancelled) setSbCount(null)
        } else {
          if (!cancelled) setSbCount(count ?? 0)
        }
      } catch (e) {
        console.warn("Error contando en Supabase:", e)
        if (!cancelled) setSbCount(null)
      } finally {
        if (!cancelled) setSbLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [profileEmail])

  // valor mostrado: usa el mayor disponible
  const apiTrueques = Number.isFinite(Number(perfil?.trueques_realizados))
    ? Number(perfil.trueques_realizados)
    : 0
  const shownTrueques = Math.max(apiTrueques, sbCount ?? 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error al cargar</h2>
          <p className="text-red-600 mb-6">{err}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-slate-600">Perfil no encontrado.</p>
        </div>
      </div>
    )
  }

  const rating = perfil.rating_promedio ? Number.parseFloat(perfil.rating_promedio) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              <img
                src={
                  perfil.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil.nombre_completo || "U")}&background=0d9488&color=fff&size=128`
                }
                alt={perfil.nombre_completo}
                className="w-28 h-28 rounded-2xl ring-4 ring-teal-100 object-cover shadow-lg"
              />
              {perfil.verificado && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-800 truncate">{perfil.nombre_completo}</h1>
                {perfil.verificado && (
                  <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-200 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    Verificado
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-4">Miembro desde {perfil.miembro_desde}</p>

              <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 p-5 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Nivel de Confianza</p>
                  <div className="flex items-center gap-2">
                    <StarRating value={rating} />
                    <span className="text-sm font-medium text-slate-600">{rating ? rating.toFixed(1) : "—"}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium shadow-sm">
                  <TrendingUp className="w-3 h-3" />
                  {perfil.nivel_confianza || "Nuevo Usuario"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {sbLoading ? "…" : shownTrueques}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Trueques</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{rating ? rating.toFixed(1) : "—"}</p>
                  <p className="text-xs text-slate-600 font-medium">Rating</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="w-5 h-5 text-teal-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{perfil.productos_activos ?? "—"}</p>
                  <p className="text-xs text-slate-600 font-medium">Productos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Productos de {perfil.nombre_completo?.split(" ")[0]}</h2>
          <span className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            {productos.length} {productos.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {productos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-100">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Este usuario no tiene productos activos.</p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((prod) => (
              <li
                key={prod.id_producto}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 group"
              >
                <Link to={`/producto/${prod.id_producto}`} className="block">
                  <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={prod.imagen_url || "/placeholder.png"}
                      alt={prod.titulo}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png"
                      }}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-slate-800 truncate mb-1 group-hover:text-teal-600 transition-colors">
                      {prod.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {prod.categorias || "Sin categoría"}
                    </p>
                    <p className="text-lg font-bold text-teal-600">
                      {prod.precio_estimado ? `$${Number(prod.precio_estimado).toFixed(2)}` : "Precio a consultar"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
