// /src/pages/ChatRoom.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { supabase } from "../lib/supabase";

export default function ChatRoom() {
  const { id } = useParams(); // conversation id
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();

  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingDeal, setUpdatingDeal] = useState(false);
  const bottomRef = useRef(null);

  // cargar conversación + mensajes + realtime
  useEffect(() => {
    if (!isAuthenticated) { loginWithRedirect(); return; }
    let sub;

    (async () => {
      // conversación
      const { data: convRow } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setConv(convRow || null);

      // mensajes iniciales
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      setMsgs(data || []);

      // realtime mensajes
      sub = supabase
        .channel(`messages_conv_${id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
          (payload) => setMsgs((m) => [...m, payload.new])
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${id}` },
          (payload) => setConv(payload.new)
        )
        .subscribe();
    })();

    return () => { sub && sub.unsubscribe(); };
  }, [id, isAuthenticated, loginWithRedirect]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    try {
      setSending(true);
      await supabase.from("messages").insert({
        conversation_id: Number(id),
        sender_email: user.email,
        sender_name: user.name,
        sender_avatar: user.picture,
        body
      });
      await supabase
        .from("conversations")
        .update({ last_message: body, last_message_at: new Date().toISOString() })
        .eq("id", id);
      setText("");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // util
  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const otherEmail = useMemo(() => {
    const arr = Array.isArray(conv?.participants) ? conv.participants : [];
    return arr.find((e) => e !== user?.email) || null;
  }, [conv?.participants, user?.email]);

  const myConfirmed = useMemo(() => {
    const list = conv?.deal_confirmations || [];
    return !!user?.email && list.includes(user.email);
  }, [conv?.deal_confirmations, user?.email]);

  const confirmationsCount = conv?.deal_confirmations?.length || 0;
  const dealState = conv?.deal_state || "none"; // 'none' | 'pending' | 'completed'

  // agrupar por día (como tenías)
  const byDay = useMemo(() => {
    const groups = {};
    for (const m of msgs) {
      const d = new Date(m.created_at);
      const key = d.toDateString();
      (groups[key] ||= []).push(m);
    }
    return groups;
  }, [msgs]);

  // confirmar / deshacer confirmación
  const toggleDealConfirmation = async () => {
    if (!conv || updatingDeal) return;
    try {
      setUpdatingDeal(true);

      const current = Array.isArray(conv.deal_confirmations) ? conv.deal_confirmations : [];
      const next = new Set(current);
      if (myConfirmed) next.delete(user.email);
      else next.add(user.email);

      const arr = Array.from(next);
      const nextState =
        arr.length === 0 ? "none" :
        arr.length === 1 ? "pending" :
        "completed";

      const payload = {
        deal_confirmations: arr,
        deal_state: nextState,
        deal_completed_at: nextState === "completed" ? new Date().toISOString() : null
      };

      const { data: updated, error } = await supabase
        .from("conversations")
        .update(payload)
        .eq("id", conv.id)
        .select()
        .single();
      if (error) throw error;
      setConv(updated);

      // mensaje de sistema
      const systemText =
        nextState === "completed"
          ? "✅ Trueque marcado como COMPLETADO por ambas partes."
          : myConfirmed
            ? "❎ Has retirado tu confirmación de trueque."
            : "⏳ Confirmación registrada. Esperando a la otra parte.";
      await supabase.from("messages").insert({
        conversation_id: Number(id),
        sender_email: "system@truequeapp",
        sender_name: "Sistema",
        sender_avatar: "",
        body: systemText
      });

      // opcional: actualizar last_message
      await supabase
        .from("conversations")
        .update({ last_message: systemText, last_message_at: new Date().toISOString() })
        .eq("id", id);

    } finally {
      setUpdatingDeal(false);
    }
  };

  // UI
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-emerald-100 backdrop-blur bg-white/70">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-200/60 grid place-items-center">
            <svg className="h-5 w-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-slate-800">Mensajes</h1>
            <p className="text-xs text-slate-500">
              TruequeApp • Conversación #{id}
              {otherEmail ? ` • con ${otherEmail}` : ""}
            </p>
          </div>

          {/* Estado del trueque */}
          {conv && (
            <div className="flex items-center gap-2">
              <span className={[
                "text-xs px-2.5 py-1 rounded-full border",
                dealState === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                dealState === "pending"   ? "bg-amber-50 text-amber-700 border-amber-200" :
                                             "bg-slate-50 text-slate-600 border-slate-200"
              ].join(" ")}>
                {dealState === "completed" ? "Trueque completado" :
                 dealState === "pending"   ? `Confirmado (${confirmationsCount}/2)` :
                                             "Sin confirmar"}
              </span>

              <button
                onClick={toggleDealConfirmation}
                disabled={updatingDeal || dealState === "completed"}
                className={[
                  "h-9 px-3 rounded-lg text-sm font-medium transition",
                  dealState === "completed"
                    ? "bg-emerald-600 text-white opacity-90 cursor-not-allowed"
                    : myConfirmed
                      ? "bg-white text-amber-700 border border-amber-300 hover:bg-amber-50"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                ].join(" ")}
                title={
                  dealState === "completed"
                    ? "Ambas partes confirmaron"
                    : myConfirmed
                      ? "Quitar mi confirmación"
                      : "Marcar trueque realizado"
                }
              >
                {dealState === "completed"
                  ? "Completado ✅"
                  : myConfirmed
                    ? "Quitar confirmación"
                    : "Trueque realizado"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Chat body */}
      <main className="mx-auto max-w-4xl px-4">
        <div className="mt-4 mb-36 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-[62vh] md:h-[68vh] overflow-y-auto p-4 md:p-6">
            {Object.keys(byDay).length === 0 && (
              <div className="h-full grid place-items-center text-center text-slate-500">
                <div>
                  <p className="text-sm">Aún no hay mensajes.</p>
                  <p className="text-xs">Escribe algo abajo para iniciar el chat.</p>
                </div>
              </div>
            )}

            {Object.entries(byDay).map(([day, list]) => (
              <div key={day}>
                {/* Day separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {day}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {list.map((m) => {
                  const mine = m.sender_email === user.email;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} mb-3`}>
                      {!mine && (
                        <img
                          src={m.sender_avatar || "/avatar.png"}
                          alt={m.sender_name || m.sender_email}
                          className="h-8 w-8 rounded-full mr-2 mt-5 shadow-sm"
                        />
                      )}

                      <div className={`max-w-[78%] md:max-w-[70%]`}>
                        {!mine && (
                          <div className="text-xs text-slate-500 mb-1">{m.sender_name || m.sender_email}</div>
                        )}
                        <div
                          className={[
                            "rounded-2xl shadow-sm px-4 py-2 text-[15px] leading-relaxed",
                            mine
                              ? "bg-emerald-600 text-white rounded-br-md"
                              : "bg-slate-100 text-slate-800 rounded-bl-md"
                          ].join(" ")}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <div
                            className={`mt-1 text-[10px] ${
                              mine ? "text-emerald-100/90" : "text-slate-500"
                            }`}
                          >
                            {formatTime(m.created_at)}
                          </div>
                        </div>
                      </div>

                      {mine && (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="h-8 w-8 rounded-full ml-2 mt-5 ring-2 ring-emerald-100"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      {/* Composer */}
      <div className="fixed inset-x-0 bottom-0 bg-white/90 backdrop-blur border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 focus-within:bg-white shadow-sm">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Escribe un mensaje… (Enter para enviar • Shift+Enter salto de línea)"
                className="w-full resize-none bg-transparent px-4 py-3 outline-none text-[15px] placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="inline-flex items-center gap-2 h-12 px-5 rounded-xl
                         bg-emerald-600 text-white shadow-sm
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-emerald-700 transition"
              title="Enviar"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M22 2L11 13" />
                <path strokeWidth="2" d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
