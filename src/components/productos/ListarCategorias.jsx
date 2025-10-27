import { useEffect, useMemo, useRef, useState } from "react";
import { Tag } from "lucide-react";

const API = "https://truequeapp-api-vercel.vercel.app";

export default function ListaCategorias({ value = "all", onChange }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [active, setActive] = useState(value);
  const scrollerRef = useRef(null);

  useEffect(() => setActive(value), [value]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`${API}/api/categorias`);
        if (!r.ok) throw new Error("No se pudo cargar categorías");
        const json = await r.json();
        setCats(Array.isArray(json) ? json : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const select = (val) => {
    setActive(val);
    onChange?.(val); // 'all' o id_categoria
  };

  // sombreado lateral cuando hay scroll
  const [shadowLeft, shadowRight] = useMemo(() => {
    const el = scrollerRef.current;
    if (!el) return [false, false];
    const canScrollLeft = el.scrollLeft > 0;
    const canScrollRight = el.scrollWidth - el.clientWidth - el.scrollLeft > 2;
    return [canScrollLeft, canScrollRight];
  }, [scrollerRef.current, cats, loading]);

  const onScroll = () => {
    // fuerza re-render para actualizar sombras
    const el = scrollerRef.current;
    if (!el) return;
    // usando un state ficticio no es necesario; forzamos con setCats(prev => [...prev])
    setCats((prev) => prev.slice());
  };

  const chip = (isActive) =>
    [
      "px-4 h-10 rounded-full whitespace-nowrap border text-sm font-medium transition-all",
      "flex items-center gap-2",
      isActive
        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/60",
    ].join(" ");

  const Skeleton = () => (
    <div className="animate-pulse">
      <div className="h-5 w-28 bg-slate-200 rounded-full" />
    </div>
  );

  if (err) {
    return (
      <section className="px-4">
        <div className="max-w-7xl mx-auto my-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {err}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pt-4">
      <div className="max-w-7xl mx-auto mb-3 flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-emerald-100 grid place-items-center">
          <Tag className="w-4 h-4 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Explora por categoría</h2>
          <div className="h-1 w-14 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full mt-1" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Sombras laterales para sugerir scroll */}
        {shadowLeft && (
          <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent" />
        )}
        {shadowRight && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent" />
        )}

        {/* barra de chips con scroll horizontal */}
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          role="tablist"
          aria-label="Categorías"
          className="flex gap-2 overflow-x-auto no-scrollbar py-2 pr-1"
        >
          {loading ? (
            <>
              <div className={chip(false)}><Skeleton /></div>
              <div className={chip(false)}><Skeleton /></div>
              <div className={chip(false)}><Skeleton /></div>
              <div className={chip(false)}><Skeleton /></div>
            </>
          ) : (
            <>
              <button
                role="tab"
                aria-selected={active === "all"}
                className={chip(active === "all")}
                onClick={() => select("all")}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Todos
              </button>

              {cats.map((c) => {
                const isActive = String(active) === String(c.id_categoria);
                const count = c.total ?? c.count ?? c.cantidad ?? null; // si traes el conteo
                return (
                  <button
                    key={c.id_categoria}
                    role="tab"
                    aria-selected={isActive}
                    className={chip(isActive)}
                    onClick={() => select(c.id_categoria)}
                    title={c.nombre}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full ${isActive ? "bg-white" : "bg-emerald-500/80"}`} />
                    <span className="truncate max-w-[140px]">{c.nombre}</span>
                    {count != null && (
                      <span
                        className={[
                          "ml-1 inline-flex items-center justify-center rounded-full text-[11px] px-2 py-0.5",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600 border border-slate-200",
                        ].join(" ")}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* subrayado del activo (decorativo) */}
        {!loading && (
          <div className="mt-3">
            <div className="h-px w-full bg-slate-200" />
          </div>
        )}
      </div>
    </section>
  );
}
