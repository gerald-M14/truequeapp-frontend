"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"

const API = "https://truequeapp-api-vercel.vercel.app"

// estados a ocultar en el listado público
const HIDE_STATES = new Set(["intercambiada"]) // agrega "eliminada" si lo deseas

export default function ListaProductos({ categoria = "all" }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [dbUser, setDbUser] = useState(null)
  const [visibleCards, setVisibleCards] = useState([])
  const sectionRef = useRef(null)

  const { user, isAuthenticated, isLoading: authLoading } = useAuth0()
  const navigate = useNavigate()

  // ---- Animación: revelar cards al entrar al viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.dataset.index)
            setVisibleCards((prev) => [...new Set([...prev, index])])
          }
        })
      },
      { threshold: 0.1 },
    )
    const cards = sectionRef.current?.querySelectorAll("[data-index]")
    cards?.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [productos])

  // utils para comparación robusta
  const norm = (v) => (v ?? "").toString().trim().toLowerCase()
  const cleanPic = (url) => (url ?? "").split("?")[0]

  // ¿es mío este producto?
  const isMine = (p) => {
    const myId = dbUser?.id != null ? String(dbUser.id) : null
    const ownerId = p.user_id ?? p.id_usuario ?? p.usuario_id ?? null
    if (myId && ownerId != null && String(ownerId) === myId) return true

    const meName = norm(user?.name)
    const owName = norm(p?.usuario_nombre)
    if (meName && owName && meName === owName) return true

    const mePic = cleanPic(user?.picture)
    const owPic = cleanPic(p?.avatar_usuario)
    if (mePic && owPic && mePic === owPic) return true

    const meSub = norm(user?.sub)
    const owSub = norm(p?.auth0_user_id || p?.owner_sub || p?.usuario_sub)
    if (meSub && owSub && meSub === owSub) return true

    return false
  }

  // helper: ¿producto oculto por estado?
  const isOculto = (p) => HIDE_STATES.has(norm(p?.estado_publicacion))

  // 1) cargar listado
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const url =
          categoria === "all"
            ? `${API}/api/productos`
            : `${API}/api/productos?categoria=${encodeURIComponent(categoria)}`
        const r = await fetch(url)
        if (!r.ok) throw new Error("No se pudieron cargar productos")
        const json = await r.json()
        setProductos(Array.isArray(json) ? json : [])
      } catch (e) {
        setErr(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [categoria])

  // 2) resolver id del usuario en BD (si está autenticado)
  useEffect(() => {
    ;(async () => {
      if (!isAuthenticated || !user?.email) return setDbUser(null)
      try {
        const r = await fetch(`${API}/api/usuarios/find?email=${encodeURIComponent(user.email)}`)
        if (!r.ok) throw new Error("No se encontró el usuario en BD")
        const u = await r.json()
        setDbUser(u)
      } catch {
        setDbUser(null)
      }
    })()
  }, [isAuthenticated, user?.email])

  // 3) FILTRO FRONTEND — Opción A:
  //    ocultar míos + ocultar estado_publicacion en HIDE_STATES (ej. "intercambiada")
  const productosVisibles = useMemo(() => {
    return productos.filter((p) => !isMine(p) && !isOculto(p))
  }, [productos, dbUser?.id, user?.name, user?.picture, user?.sub])

  // ---- UI estados
  if (loading || authLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Explora productos</h2>
            <span className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold border border-teal-200">
              Cargando…
            </span>
          </div>
          <div className="h-1 w-16 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full"></div>
        </div>
        {/* Skeleton grid compacto */}
        <div className="grid xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-3">
              <div className="aspect-[4/3] rounded-xl bg-gray-100 animate-pulse" />
              <div className="mt-3 h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (err) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-red-50 border border-red-200 rounded-2xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Error al cargar</h3>
            <p className="text-red-700 text-sm">{err}</p>
          </div>
        </div>
      </div>
    )
  }

  if (productosVisibles.length === 0) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-gray-50 border border-gray-200 rounded-2xl text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Sin resultados en esta categoría</h3>
        <p className="text-gray-600 text-sm">Prueba con otra categoría o vuelve más tarde.</p>
      </div>
    )
  }

  // ---- GRID COMPACTO estilo marketplace
  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-4 py-10">
      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <span className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold border border-teal-200">
            {productosVisibles.length} items
          </span>
        </div>
        <div className="h-1 w-16 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full"></div>
      </div>

      {/* Cards compactos: 5 por fila en xl */}
      <div className="grid xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {productosVisibles.map((p, index) => {
          const isVisible = visibleCards.includes(index)
          const img = p.imagen_principal || p.imagen_url || "/placeholder.png"
          const price =
            p.precio_estimado != null && p.precio_estimado !== "" ? Number(p.precio_estimado) : null

          return (
            <article
              key={p.id_producto}
              data-index={index}
              onClick={() => navigate(`/producto/${p.id_producto}`)}
              className={[
                "group bg-white rounded-2xl border border-gray-200 hover:border-teal-200",
                "shadow-sm hover:shadow-lg transition-all duration-400 cursor-pointer overflow-hidden",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              ].join(" ")}
              style={{ transitionDelay: isVisible ? `${index * 40}ms` : "0ms" }}
            >
              {/* Imagen 4:3 */}
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                  <img
                    src={img}
                    alt={p.titulo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    onError={(e) => { e.currentTarget.src = "/placeholder.png" }}
                  />
                </div>

                {/* Badges */}
                {p.categorias && (
                  <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[11px] font-semibold bg-white/90 border border-gray-200 text-gray-800 backdrop-blur shadow-sm">
                    {p.categorias}
                  </span>
                )}
                {price !== null && (
                  <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white shadow">
                    ${price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-teal-700 transition-colors">
                  {p.titulo}
                </h3>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={
                        p.avatar_usuario ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(p.usuario_nombre || "U")}&background=0d9488&color=fff`
                      }
                      alt={p.usuario_nombre || "Usuario"}
                      className="w-6 h-6 rounded-full ring-1 ring-teal-100"
                    />
                    <span className="text-[12px] text-gray-600 truncate">
                      {p.usuario_nombre || "Usuario"}
                    </span>
                  </div>

                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    Ver
                    <svg className="w-4 h-4 text-teal-600 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
