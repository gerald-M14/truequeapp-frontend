"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import {
  ArrowLeft, Upload, ImageIcon, Package, FileText, DollarSign,
  CheckCircle2, AlertCircle, X, Info, Tag
} from "lucide-react"

const API = "https://truequeapp-api-vercel.vercel.app"
const CLOUD_NAME = "dytgr35it"
const UPLOAD_PRESET = "trueque_unsigned"

const MAX_TITLE = 120
const MAX_DESC  = 800

const SegBtn = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "px-3.5 h-10 rounded-full text-sm font-medium transition-all border",
      active
        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
    ].join(" ")}
  >
    {children}
  </button>
)

export default function Publicar() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth0()

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    estado_producto: "usado",
    condicion: "bueno",
    precio_estimado: "",
  })

  // --- categorías (muchos a muchos)
  const [allCats, setAllCats] = useState([])                    // {id_categoria, nombre}
  const [selectedCats, setSelectedCats] = useState([])          // [id_categoria, ...]
  const [catsLoading, setCatsLoading] = useState(true)
  const [catsErr, setCatsErr] = useState("")

  // imagen
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [msg, setMsg] = useState("")
  const [saving, setSaving] = useState(false)
  const dzRef = useRef(null)

  useEffect(() => {
    (async () => {
      try {
        setCatsLoading(true)
        const r = await fetch(`${API}/api/categorias`)
        if (!r.ok) throw new Error("No se pudo cargar categorías")
        const json = await r.json()
        setAllCats(Array.isArray(json) ? json : [])
      } catch (e) {
        setCatsErr(e.message || "Error al cargar categorías")
      } finally {
        setCatsLoading(false)
      }
    })()
  }, [])

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  // toggle de chips de categoría
  const toggleCat = (id) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // --- Drag & Drop (opcional)
  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    validateAndSetFile(f)
  }
  const validateAndSetFile = (f) => {
    if (!f.type.startsWith("image/")) return setMsg("El archivo debe ser una imagen.")
    if (f.size > 5 * 1024 * 1024) return setMsg("La imagen no debe superar 5MB.")
    setMsg("")
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }
  const onFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    validateAndSetFile(f)
  }
  const removeImage = () => {
    setFile(null)
    setPreview("")
    setMsg("")
    if (dzRef.current) dzRef.current.value = ""
  }

  const uploadImage = async (imageFile) => {
    const fd = new FormData()
    fd.append("file", imageFile)
    fd.append("upload_preset", UPLOAD_PRESET)
    fd.append("folder", "truequeapp/productos")

    const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: fd,
    })
    const json = await r.json()
    if (!r.ok || !json.secure_url) {
      throw new Error(json.error?.message || "Fallo subiendo la imagen")
    }
    return json.secure_url
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) return alert("Debes iniciar sesión para publicar")
    try {
      setSaving(true)
      setMsg("")

      let finalImageUrl = ""
      if (file) finalImageUrl = await uploadImage(file)

      // 1) Intento enviar categorías en el mismo POST (ideal)
      const body = {
        ...form,
        imagen_url: finalImageUrl,
        estado_publicacion: "activa",
        categories: selectedCats, // <-- si tu API lo soporta, ya llega al backend
      }

      const r = await fetch(`${API}/api/productos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify(body),
      })

      const json = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(json.error || "No se pudo crear el producto")

      // 2) Fallback: si tu API NO soporta 'categories' en el POST anterior,
      // intenta vincular aquí (requiere que tu backend exponga este endpoint).
      // Se asume que el POST devuelve { id_producto } o similar.
      const newId = json.id_producto || json.id || json.insertId
      if (newId && selectedCats.length > 0 && !json.categorias_vinculadas) {
        await fetch(`${API}/api/productos/${newId}/categorias`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-email": user?.email || "" },
          body: JSON.stringify({ categories: selectedCats }), // [id_categoria,...]
        })
        // No detenemos si falla, pero podrías manejar errores específicos aquí.
      }

      setMsg("Producto publicado ✅")
      setTimeout(() => navigate("/perfil/editar"), 900)
    } catch (e) {
      setMsg(e.message || "Error al publicar")
    } finally {
      setSaving(false)
    }
  }

  // --- UX helpers (progreso considera categorías)
  const filled = useMemo(() => {
    let ok = 0
    if (form.titulo.trim()) ok++
    if (form.descripcion.trim()) ok++
    if (form.estado_producto) ok++
    if (form.condicion) ok++
    if (form.precio_estimado) ok++
    if (preview) ok++
    if (selectedCats.length > 0) ok++ // categorías
    return ok
  }, [form, preview, selectedCats.length])

  // ahora son 7 “pasos”
  const progress = Math.min((filled / 7) * 100, 100)

  if (!isAuthenticated)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md text-center border border-emerald-100">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full grid place-items-center mx-auto mb-6">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso requerido</h2>
          <p className="text-slate-600">Inicia sesión para publicar productos y comenzar a intercambiar.</p>
        </div>
      </div>
    )

  return (
    <section className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/perfil/editar")}
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium mb-3 transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Volver a mi perfil
          </button>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Publicar nuevo producto</h1>
              <p className="text-slate-600">Completa los detalles para comenzar a intercambiar</p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500 mb-1">Progreso</p>
              <div className="w-40 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSave} className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            {/* Título */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Título del producto
                <span className={`ml-2 text-xs ${form.titulo.length > MAX_TITLE ? "text-rose-600" : "text-slate-400"}`}>
                  {form.titulo.length}/{MAX_TITLE}
                </span>
              </label>
              <input
                name="titulo"
                value={form.titulo}
                onChange={(e)=> { if (e.target.value.length <= MAX_TITLE) onChange(e) }}
                required
                placeholder="Ej: Bicicleta de montaña en excelente estado"
                className="w-full border-2 border-slate-200 rounded-xl px-4 h-12 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none"
              />
            </div>

            {/* Descripción */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Descripción
                <span className={`ml-2 text-xs ${form.descripcion.length > MAX_DESC ? "text-rose-600" : "text-slate-400"}`}>
                  {form.descripcion.length}/{MAX_DESC}
                </span>
              </label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={(e)=> { if (e.target.value.length <= MAX_DESC) onChange(e) }}
                rows={5}
                required
                placeholder="Describe tu producto, características, uso y lo que esperas recibir a cambio…"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none resize-none"
              />
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Evita compartir datos personales aquí.
              </p>
            </div>

            {/* Controles segmentados */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Estado
                </label>
                <div className="flex flex-wrap gap-2">
                  {["nueva","usado","reparacion"].map(v => (
                    <SegBtn key={v} active={form.estado_producto === v} onClick={()=> setForm(f=>({...f, estado_producto: v}))}>
                      {v === "nueva" ? "Nueva" : v === "usado" ? "Usado" : "Reparación"}
                    </SegBtn>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Condición
                </label>
                <div className="flex flex-wrap gap-2">
                  {["excelente","bueno","regular"].map(v => (
                    <SegBtn key={v} active={form.condicion === v} onClick={()=> setForm(f=>({...f, condicion: v}))}>
                      {v.charAt(0).toUpperCase()+v.slice(1)}
                    </SegBtn>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Precio estimado
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 select-none">$</div>
                  <input
                    name="precio_estimado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio_estimado}
                    onChange={onChange}
                    placeholder="0.00"
                    className="w-full border-2 border-slate-200 rounded-xl pl-7 pr-3 h-12 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Solo referencia; no es un precio de venta.</p>
              </div>
            </div>

            {/* Categorías (chips multi-select) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                Categorías
                <span className="ml-2 text-xs text-slate-500">
                  {selectedCats.length > 0 ? `${selectedCats.length} seleccionadas` : "Selecciona una o más"}
                </span>
              </label>

              {catsErr && (
                <p className="text-sm text-rose-600 mb-2">{catsErr}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {catsLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <span key={i} className="px-4 h-10 rounded-full bg-slate-100 border border-slate-200 animate-pulse" />
                    ))
                  : allCats.map((c) => {
                      const active = selectedCats.includes(c.id_categoria)
                      return (
                        <button
                          type="button"
                          key={c.id_categoria}
                          onClick={() => toggleCat(c.id_categoria)}
                          className={[
                            "px-4 h-10 rounded-full whitespace-nowrap border text-sm font-medium transition-all",
                            active
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/60",
                          ].join(" ")}
                        >
                          {c.nombre}
                        </button>
                      )
                    })}
              </div>

              {/* Ayuda */}
              <p className="mt-2 text-xs text-slate-500">
                Si falta alguna categoría, se puede crear desde el panel de administración.
              </p>
            </div>

            {/* Imagen Upload / Dropzone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Imagen principal
              </label>

              {!preview ? (
                <label
                  htmlFor="fileInput"
                  onDragOver={(e)=> e.preventDefault()}
                  onDrop={handleDrop}
                  className="block border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition"
                >
                  <input ref={dzRef} id="fileInput" type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full grid place-items-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-700 font-medium mb-1">Arrastra una imagen o haz clic para seleccionar</p>
                      <p className="text-sm text-slate-500">PNG, JPG, WEBP • hasta 5MB</p>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={preview}
                    alt="preview"
                    className="mx-auto h-72 w-full max-w-2xl rounded-xl object-cover shadow-lg"
                  />
                  <div className="absolute right-3 top-3 flex gap-2">
                    <label
                      htmlFor="fileInput"
                      className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-white/90 border border-slate-200 text-slate-700 backdrop-blur hover:bg-white cursor-pointer"
                      title="Cambiar imagen"
                    >
                      <Upload className="w-4 h-4" />
                      Cambiar
                    </label>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/90 border border-slate-200 hover:bg-white"
                      title="Quitar"
                    >
                      <X className="w-4 h-4 text-slate-700" />
                    </button>
                    <input ref={dzRef} id="fileInput" type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 md:px-8 py-5 border-t border-slate-200 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-h-[24px]">
              {msg && (
                <div className={`flex items-center gap-2 text-sm font-medium ${
                  msg.includes("✅") ? "text-emerald-700" : "text-rose-600"
                }`}>
                  {msg.includes("✅") ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  {msg}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">Completado</span>
                <div className="w-28 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publicando…
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Publicar producto
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
