// src/components/header_profile.jsx
import React, { useEffect, useRef, useState } from "react";
import { LogoutButton } from "../logout";
import { Profile } from "../profile";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { supabase } from "../../lib/supabase";

const API = "https://truequeapp-api-vercel.vercel.app";

export default function HeaderProfile() {
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  const [tieneNuevos, setTieneNuevos] = useState(false);
  const [open, setOpen] = useState(false);
  const [convs, setConvs] = useState([]);
  const [nameMap, setNameMap] = useState({}); // email -> nombre
  const popRef = useRef(null);

  // Helpers
  const humanizeEmail = (email = "") => {
    const local = email.split("@")[0] || "";
    return local
      .replace(/[._-]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const putNameInCache = (email, name) =>
    setNameMap(prev => (email ? { ...prev, [email]: name } : prev));

  const fetchNameByEmail = async (email) => {
    if (!email || nameMap[email]) return;
    try {
      const r = await fetch(`${API}/api/usuarios/find?email=${encodeURIComponent(email)}`);
      if (r.ok) {
        const u = await r.json();
        const name =
          u?.nombre_completo ||
          u?.nombre ||
          u?.display_name ||
          humanizeEmail(email);
        putNameInCache(email, name);
      } else {
        putNameInCache(email, humanizeEmail(email));
      }
    } catch {
      putNameInCache(email, humanizeEmail(email));
    }
  };

  const resolveNamesForConvs = async (list) => {
    const emails = new Set();
    for (const c of list) {
      const parts = c?.participants || [];
      const other = parts.find((e) => e !== user.email) || parts[0];
      if (other && !nameMap[other]) emails.add(other);
    }
    await Promise.all([...emails].map(fetchNameByEmail));
  };

  // 1) Cargar inbox (ultimas 5) cuando se abre el popover
  const loadInbox = async () => {
    if (!isAuthenticated || !user?.email) return;
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .contains("participants", [user.email])
      .order("last_message_at", { ascending: false })
      .limit(5);
    if (!error) {
      setConvs(data || []);
      // resolver nombres
      resolveNamesForConvs(data || []);
    }
  };

  // 2) Suscribirse a Realtime para encender el puntito si hay updates recientes
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;

    (async () => {
      const { data } = await supabase
        .from("conversations")
        .select("last_message_at")
        .contains("participants", [user.email])
        .order("last_message_at", { ascending: false })
        .limit(1);
      const ts = data?.[0]?.last_message_at ? new Date(data[0].last_message_at).getTime() : 0;
      if (ts && Date.now() - ts < 2 * 60 * 1000) setTieneNuevos(true);
    })();

    const sub = supabase
      .channel("conv_bell")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const parts = payload.new?.participants || [];
          if (!parts.includes(user.email)) return;
          const ts = payload.new?.last_message_at ? new Date(payload.new.last_message_at).getTime() : 0;
          if (ts && Date.now() - ts < 2 * 60 * 1000) setTieneNuevos(true);
          if (open) loadInbox();
        }
      )
      .subscribe();

    return () => { sub.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.email, open]);

  // 3) Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const togglePopover = async () => {
    if (!isAuthenticated) return;
    const next = !open;
    setOpen(next);
    if (next) {
      setTieneNuevos(false);
      await loadInbox();
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="h-12 w-36 flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
        </div>

        <div className="flex items-center gap-5">
          {/* Icono mensajes + Popover */}
          {isAuthenticated && (
            <div className="relative" ref={popRef}>
              <button
                onClick={togglePopover}
                className="relative p-1 rounded-md hover:bg-teal-50 transition-colors"
                title="Mis chats"
              >
                <MessageCircle className="w-6 h-6 text-teal-600 hover:text-teal-700" />
                {tieneNuevos && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-2">
                  <div className="px-2 py-1 text-sm font-semibold text-gray-700">Últimas conversaciones</div>

                  {convs.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-gray-500 text-center">
                      No tienes conversaciones aún.
                    </div>
                  ) : (
                    <ul className="max-h-80 overflow-auto">
                      {convs.map((c) => {
                        const parts = c.participants || [];
                        const otherEmail =
                          parts.find((e) => e !== user.email) || parts[0] || "";
                        const display = nameMap[otherEmail] || humanizeEmail(otherEmail) || "Usuario";

                        return (
                          <li
                            key={c.id}
                            onClick={() => {
                              setOpen(false);
                              navigate(`/chat/${c.id}`);
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-teal-50 cursor-pointer"
                          >
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(display || "U")}&background=0d9488&color=fff`}
                              alt={display || "Usuario"}
                              className="w-9 h-9 rounded-full border border-teal-100"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {display}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {c.last_message || "Sin mensajes aún"}
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {c.last_message_at
                                ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : ""}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="border-t mt-2 pt-2 px-2">
                    <button
                      onClick={() => { setOpen(false); navigate("/chats"); }}
                      className="w-full h-9 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
                    >
                      Ver todas
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Perfil / Login */}
          {isAuthenticated ? (
            <Link to="/perfil" className="flex items-center gap-2 cursor-pointer">
              <Profile />
            </Link>
          ) : (
            <Link to="/login" className="text-teal-600 font-medium hover:underline">Iniciar sesión</Link>
          )}

          {isAuthenticated && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
