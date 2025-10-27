// /src/pages/MisChats.jsx
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function MisChats() {
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { loginWithRedirect(); return; }
    (async () => {
      try {
        setLoading(true);
        const email = user.email;
        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .contains("participants", [email])    // tu correo está en el array
          .order("last_message_at", { ascending: false });
        if (error) throw error;
        setChats(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, loginWithRedirect, user?.email]);

  if (!isAuthenticated) return null;

  return (
    <section className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-teal-600" />
          Mis Conversaciones
        </h1>

        {loading ? (
          <p className="text-gray-500 text-center py-10">Cargando conversaciones...</p>
        ) : chats.length === 0 ? (
          <p className="text-gray-500 text-center py-10">Aún no tienes conversaciones activas.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map((c) => {
              const otro = (c.participants || []).find(e => e !== user.email) || (c.participants || [])[0];
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/chat/${c.id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-teal-50 rounded-xl cursor-pointer transition-all"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(otro || "U")}&background=0d9488&color=fff`}
                    alt={otro || "Usuario"}
                    className="w-12 h-12 rounded-full border-2 border-teal-100 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{otro || "Usuario"}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1">{c.last_message || "Sin mensajes aún"}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {c.last_message_at
                      ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
