"use client"

// /src/components/productos/ProductoDetalle.jsx
import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Heart, Flag, Star, Package, Calendar, CheckCircle2, Bookmark } from "lucide-react"
import { useAuth0 } from "@auth0/auth0-react"
import { supabase } from "../../lib/supabase"
import ProponerTruequeModal from "../trueque/ProponerTruequeModal"; 


const API = "https://truequeapp-api-vercel.vercel.app"

// util simple para estrellas
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

// Devuelve un solo nombre de categoría (o null) desde distintos formatos
function getCategoria(p, data) {
  if (!p && !data) return null
  if (p?.categoria_nombre) return p.categoria_nombre
  if (typeof p?.categorias === "string" && p.categorias.trim()) {
    const first = p.categorias.split(",")[0]?.trim()
    if (first) return first
  }
  if (Array.isArray(p?.categorias) && p.categorias.length) {
    const x = p.categorias[0]
    return typeof x === "string" ? x : x?.nombre || null
  }
  if (Array.isArray(data?.categorias) && data.categorias.length) {
    const x = data.categorias[0]
    return typeof x === "string" ? x : x?.nombre || null
  }
  if (Array.isArray(data?.producto_categorias) && data.producto_categorias.length) {
    const x = data.producto_categorias[0]
    return x?.categoria?.nombre || x?.nombre || null
  }
  return null
}

// crear o reutilizar conversación para trueque
async function proponerTrueque({ productId, ownerEmail, myUser, offerProductId }) {
  const { data: exists } = await supabase
    .from("conversations")
    .select("*")
    .eq("product_id", productId)
    .contains("participants", [myUser.email, ownerEmail])
    .maybeSingle();

  let convId;
  if (exists) {
    convId = exists.id;
    // si no tiene offer_product_id aún, lo actualizamos
    if (!exists.offer_product_id && offerProductId) {
      await supabase.from("conversations")
        .update({ offer_product_id: offerProductId })
        .eq("id", convId);
    }
  } else {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        product_id: productId,
        offer_product_id: offerProductId,            // ✅ guardamos el mío
        title: `Trueque por producto #${productId}`,
        participants: [myUser.email, ownerEmail],
        last_message: "¡Hola! Me interesa hacer un trueque por tu producto.",
        last_message_at: new Date().toISOString(),
        deal_state: "none",
        deal_confirmations: [],
      })
      .select()
      .single();
    if (error) throw error;
    convId = created.id;

    await supabase.from("messages").insert({
      conversation_id: convId,
      sender_email: myUser.email,
      sender_name: myUser.name,
      sender_avatar: myUser.picture,
      body: "¡Hola! Me interesa hacer un trueque por tu producto.",
    });
  }
  return convId;
}


// badge de confianza
function TrustBadge({ nivel }) {
  const badges = {
    "Nuevo Usuario": { color: "bg-gray-100 text-gray-700 border-gray-200", emoji: "🌱" },
    "Usuario Confiable": { color: "bg-blue-100 text-blue-700 border-blue-200", emoji: "⭐" },
    "Usuario Verificado": { color: "bg-emerald-100 text-emerald-700 border-emerald-200", emoji: "✓" },
    "Usuario Elite": { color: "bg-purple-100 text-purple-700 border-purple-200", emoji: "👑" },
  }
  const badge = badges[nivel] || badges["Nuevo Usuario"]
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border ${badge.color} font-medium`}>
      <span>{badge.emoji}</span>
      {nivel}
    </span>
  )
}

export default function ProductoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth0()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [perfil, setPerfil] = useState(null)
  const [perfilLoading, setPerfilLoading] = useState(false)
  const [perfilErr, setPerfilErr] = useState("")
  const [saved, setSaved] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false);

  // --- NUEVO: conteo de trueques completados en Supabase para el dueño
  const [sbCount, setSbCount] = useState(null)
  const [sbLoading, setSbLoading] = useState(false)

  // cargar producto
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const r = await fetch(`${API}/api/productos/${id}`)
        if (!r.ok) throw new Error("No se pudo cargar el producto")
        const json = await r.json()
        setData(json)
      } catch (e) {
        setErr(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // dueño del producto (hook SIEMPRE antes de returns)
  const ownerId = useMemo(() => {
    const p = data?.producto
    return p?.user_id ?? p?.usuario_id ?? null
  }, [data])

  // cargar perfil del dueño
  useEffect(() => {
    if (!ownerId) return
    ;(async () => {
      try {
        setPerfilLoading(true)
        setPerfilErr("")
        const r = await fetch(`${API}/api/usuarios/${ownerId}/perfil`)
        if (!r.ok) throw new Error("No se pudo cargar el perfil del usuario")
        const json = await r.json()
        setPerfil(json)
        setPerfilErr("")
      } catch (e) {
        setPerfilErr(e.message)
      } finally {
        setPerfilLoading(false)
      }
    })()
  }, [ownerId])

  // --- NUEVO: email del dueño (desde producto o perfil) para contar en Supabase
  const ownerEmail = useMemo(() => {
    const p = data?.producto || {}
    const prof = perfil || {}
    return (
      p.usuario_email ||
      prof.email ||
      prof.usuario_email ||
      prof.user_email ||
      null
    )
  }, [data, perfil])

  // --- NUEVO: contar conversaciones completadas del dueño en Supabase
  useEffect(() => {
    if (!ownerEmail) { setSbCount(null); return }
    let cancelled = false
    ;(async () => {
      try {
        setSbLoading(true)
        const { count, error } = await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .contains("participants", [ownerEmail])
          .eq("deal_state", "completed")

        if (error) {
          console.warn("No se pudo contar trueques en Supabase (RLS?):", error.message)
          if (!cancelled) setSbCount(null)
        } else {
          if (!cancelled) setSbCount(count ?? 0)
        }
      } catch (e) {
        console.warn("Error contando trueques en Supabase:", e)
        if (!cancelled) setSbCount(null)
      } finally {
        if (!cancelled) setSbLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [ownerEmail])

  // -------- returns de estados --------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Error al cargar</h2>
          <p className="text-red-600">{err}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (!data?.producto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 mx-auto text-gray-400" />
          <p className="text-gray-600">Producto no encontrado</p>
        </div>
      </div>
    )
  }

  // --- desde aquí NO usamos más hooks (evita el error)
  const p = data.producto
  const categoria = getCategoria(p, data)

  const ratingProm = perfil?.rating_promedio != null ? Number.parseFloat(perfil.rating_promedio) : 0
  const ratingTexto = ratingProm ? `${ratingProm.toFixed(1)}` : "—"
  const apiTrueques = Number.isFinite(Number(perfil?.trueques_realizados))
    ? Number(perfil.trueques_realizados)
    : 0
  const shownTrueques = Math.max(apiTrueques, sbCount ?? 0)
  const nivelConf = perfil?.nivel_confianza || "Nuevo Usuario"
  const verificado = perfil?.verificado ? "Verificado" : null

  const publicado = p.fecha_publicacion
    ? new Intl.DateTimeFormat("es-ES", { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(p.fecha_publicacion)
      )
    : "—"

  const avatar =
    p.avatar_usuario ||
    perfil?.avatar_url ||
    (p.usuario_nombre
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(p.usuario_nombre)}&background=0d9488&color=fff`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil?.nombre_completo || "U")}&background=0d9488&color=fff`)

  const nombreUsuario = p.usuario_nombre || perfil?.nombre_completo || "Usuario"


  return (
    <section className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
              {categoria && (
                <span className="absolute z-10 top-6 left-6 bg-white/95 backdrop-blur-sm px-4 py-2 text-sm font-medium rounded-full border border-gray-200 shadow-lg">
                  {categoria}
                </span>
              )}

              {/* <button
                onClick={() => setSaved(!saved)}
                className="absolute z-10 top-6 right-6 p-3 bg-white/95 backdrop-blur-sm rounded-full border border-gray-200 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
              >
                <Bookmark
                  className={`w-5 h-5 transition-colors ${saved ? "fill-teal-600 text-teal-600" : "text-gray-600"}`}
                />
              </button> */}

              <div className="relative w-full bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-8 sm:p-12">
                <img
                  src={p.imagen_url || p.imagen_principal || "/placeholder.png"}
                  alt={p.titulo}
                  className="max-h-[70vh] w-auto object-contain rounded-2xl shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png"
                  }}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 space-y-6 shadow-xl border border-gray-100">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold leading-tight text-gray-900 text-balance">{p.titulo}</h1>
                <p className="text-gray-600 leading-relaxed text-pretty">{p.descripcion}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Publicado el {publicado}</span>
              </div>

              <div className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={avatar || "/placeholder.svg"}
                      alt={nombreUsuario}
                      className="w-16 h-16 rounded-full ring-4 ring-teal-100 shadow-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          nombreUsuario || "U"
                        )}&background=0d9488&color=fff`
                      }}
                    />
                    {verificado && (
                      <div className="absolute -bottom-1 -right-1 bg-teal-600 rounded-full p-1 ring-2 ring-white">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-lg text-gray-900 capitalize truncate">{nombreUsuario}</p>
                    </div>
                    {perfil?.miembro_desde && (
                      <p className="text-sm text-gray-500">Miembro desde {perfil.miembro_desde}</p>
                    )}
                    <div className="mt-2">
                      <TrustBadge nivel={nivelConf} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                    <p className="text-2xl font-bold text-teal-600">{sbLoading ? "…" : shownTrueques}</p>
                    <p className="text-xs text-gray-600 mt-1">Trueques</p>
                  </div>
                  {/* <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                    <p className="text-2xl font-bold text-amber-600">{ratingTexto}</p>
                    <p className="text-xs text-gray-600 mt-1">Rating</p>
                  </div> */}
                  <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">{perfil?.productos_activos ?? "—"}</p>
                    <p className="text-xs text-gray-600 mt-1">Productos</p>
                  </div>
                </div>

                <Link
                  to={`/usuario/${ownerId}`}
                  className="block w-full py-3 text-center text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-all duration-200 hover:shadow-md"
                >
                  Ver Perfil Completo
                </Link>

                {(perfilLoading || perfilErr) && (
                  <p className="text-xs text-center text-gray-500">
                    {perfilLoading ? "Cargando perfil..." : "Perfil no disponible"}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Detalles del Producto</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <dt className="text-xs text-gray-500 font-medium">Estado</dt>
                    <dd className="text-sm font-semibold text-gray-900 capitalize">{p.estado_producto || "—"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs text-gray-500 font-medium">Condición</dt>
                    <dd className="text-sm font-semibold text-gray-900">{p.condicion || "—"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs text-gray-500 font-medium">Valor Estimado</dt>
                    <dd className="text-sm font-semibold text-teal-600">
                      {p.precio_estimado ? `$${Number(p.precio_estimado).toFixed(2)}` : "—"}
                    </dd>
                  </div>
                  {/* <div className="space-y-1">
                    <dt className="text-xs text-gray-500 font-medium">Categoría</dt>
                    <dd className="text-sm font-semibold text-gray-900">{categoria || "—"}</dd>
                  </div> */}
                </dl>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setMostrarModal(true)} // ✅ abre el modal
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold"
                  >
                    Proponer Trueque
                  </button>
                </div>

                {/* ✅ Modal de selección de producto */}
                {mostrarModal && (
                  <ProponerTruequeModal
                    productoObjetivo={p}
                    onClose={() => setMostrarModal(false)}
                    onConfirm={async (miProductoSeleccionado) => {
                      const convId = await proponerTrueque({
                        productId: p.id_producto,
                        ownerEmail: ownerEmail || p.usuario_email,
                        myUser: user,
                        offerProductId: miProductoSeleccionado?.id_producto, // ✅ clave
                      });
                      setMostrarModal(false);
                      navigate(`/chat/${convId}`);
                    }}
                  />
                )}

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
