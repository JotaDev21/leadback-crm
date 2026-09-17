"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Data } from "@/lib/types";
import { createDemo } from "@/lib/demo";
import { supabase } from "@/lib/supabase";
import { nextBusinessTime } from "@/lib/scheduling";
type Context = {
  data: Data;
  demo: boolean;
  ready: boolean;
  user: string | null;
  notice: string;
  notify: (s: string) => void;
  update: (
    table: keyof Pick<
      Data,
      "contacts" | "messages" | "opportunities" | "followups" | "rules"
    >,
    id: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  saveCompany: (patch: Record<string, unknown>) => Promise<void>;
  addFollowup: (
    contact_id: string,
    message: string,
    scheduled_at: string,
  ) => Promise<void>;
  receiveReply: (contact_id: string) => Promise<void>;
  sendDemo: (contact_id: string, message: string) => Promise<void>;
  reload: () => Promise<void>;
};
const Ctx = createContext<Context | null>(null);
export function Provider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(() => {
    const d = createDemo();
    return supabase
      ? {
          ...d,
          company: {
            ...d.company,
            id: "",
            name: "Minha empresa",
            whatsapp_connected: false,
          },
          contacts: [],
          messages: [],
          opportunities: [],
          followups: [],
          rules: [],
        }
      : d;
  });
  const [user, setUser] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, notify] = useState("");
  const demo = !supabase;
  const reload = useCallback(async () => {
    if (!supabase) {
      setReady(true);
      return;
    }
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    setUser(u?.email ?? null);
    if (!u) {
      setReady(true);
      return;
    }
    const { data: profile, error: pe } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", u.id)
      .single();
    if (pe) throw pe;
    const cid = profile.company_id;
    const tables = [
      "companies",
      "contacts",
      "messages",
      "opportunities",
      "followups",
      "automation_rules",
    ];
    const rows = await Promise.all(
      tables.map((t) =>
        supabase!
          .from(t)
          .select("*")
          .eq(t === "companies" ? "id" : "company_id", cid),
      ),
    );
    const error = rows.find((r) => r.error)?.error;
    if (error) throw error;
    setData({
      company: rows[0].data![0],
      contacts: rows[1].data!,
      messages: rows[2].data!,
      opportunities: rows[3].data!,
      followups: rows[4].data!,
      rules: rows[5].data!,
    });
    setReady(true);
  }, []);
  useEffect(() => {
    reload().catch((e) => {
      notify(`Não foi possível carregar sua empresa: ${e.message}`);
      setReady(true);
    });
    const sub = supabase?.auth.onAuthStateChange(() => {
      setTimeout(() => reload().catch((e) => notify(e.message)), 0);
    });
    return () => sub?.data.subscription.unsubscribe();
  }, [reload]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => notify(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  async function update(
    table: Parameters<Context["update"]>[0],
    id: string,
    patch: Record<string, unknown>,
  ) {
    if (supabase) {
      const { error } = await supabase
        .from(table === "rules" ? "automation_rules" : table)
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    }
    setData((d) => ({
      ...d,
      [table]: d[table].map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }
  async function saveCompany(patch: Record<string, unknown>) {
    if (
      patch.business_start &&
      patch.business_end &&
      String(patch.business_start) >= String(patch.business_end)
    )
      throw Error("O fim do expediente deve ser depois do início.");
    if (supabase) {
      const allowed = [
        "name",
        "segment",
        "business_start",
        "business_end",
        "average_ticket",
        "agent_count",
      ];
      const safe = Object.fromEntries(
        Object.entries(patch).filter(([key]) => allowed.includes(key)),
      );
      const { error } = await supabase
        .from("companies")
        .update(safe)
        .eq("id", data.company.id);
      if (error) throw error;
    }
    setData((d) => ({ ...d, company: { ...d.company, ...patch } }));
  }
  async function addFollowup(
    contact_id: string,
    message: string,
    scheduled_at: string,
  ) {
    if (!message.trim()) throw Error("Escreva uma mensagem.");
    if (new Date(scheduled_at).getTime() <= Date.now())
      throw Error("Escolha um horário no futuro.");
    const row = {
      id: crypto.randomUUID(),
      company_id: data.company.id,
      contact_id,
      message: message.trim(),
      scheduled_at,
      status: "scheduled" as const,
    };
    if (supabase) {
      const { error } = await supabase.from("followups").insert(row);
      if (error) throw error;
    }
    setData((d) => ({ ...d, followups: [...d.followups, row] }));
  }
  async function receiveReply(contact_id: string) {
    if (!demo)
      throw Error("Esta simulação está disponível apenas na demonstração.");
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      messages: [
        ...d.messages,
        {
          id: crypto.randomUUID(),
          company_id: d.company.id,
          contact_id,
          conversation_id: `conversation-${contact_id.split("-")[1]}`,
          direction: "inbound",
          body: "Oi! Obrigado pelo retorno. Podemos conversar sobre os próximos passos?",
          created_at: now,
        },
      ],
      followups: d.followups.map((f) =>
        f.contact_id === contact_id && f.status === "scheduled"
          ? { ...f, status: "cancelled" }
          : f,
      ),
    }));
    notify("Resposta recebida. Os follow-ups pendentes foram cancelados.");
  }
  async function sendDemo(contact_id: string, message: string) {
    if (!demo) throw Error("Configure o provedor de WhatsApp.");
    if (!data.company.whatsapp_connected)
      throw Error("Ative a conexão demonstrativa nas configurações.");
    const now = new Date();
    setData((d) => {
      const conversation_id =
        d.messages.find((m) => m.contact_id === contact_id)?.conversation_id ??
        crypto.randomUUID();
      const rows = d.rules
        .filter((r) => r.enabled)
        .map((r) => ({
          id: crypto.randomUUID(),
          company_id: d.company.id,
          contact_id,
          message,
          scheduled_at: nextBusinessTime(now, r.delay_hours, d.company),
          status: "scheduled" as const,
        }));
      return {
        ...d,
        messages: [
          ...d.messages,
          {
            id: crypto.randomUUID(),
            company_id: d.company.id,
            contact_id,
            conversation_id,
            direction: "outbound",
            body: message,
            created_at: now.toISOString(),
          },
        ],
        followups: [
          ...d.followups.map((f) =>
            f.contact_id === contact_id && f.status === "scheduled"
              ? { ...f, status: "cancelled" as const }
              : f,
          ),
          {
            id: crypto.randomUUID(),
            company_id: d.company.id,
            contact_id,
            message,
            scheduled_at: now.toISOString(),
            sent_at: now.toISOString(),
            status: "sent",
          },
          ...rows,
        ],
        opportunities: d.opportunities.map((o) =>
          o.contact_id === contact_id
            ? { ...o, last_interaction: now.toISOString() }
            : o,
        ),
      };
    });
  }
  return (
    <Ctx.Provider
      value={{
        data,
        demo,
        ready,
        user,
        notice,
        notify,
        update,
        saveCompany,
        addFollowup,
        receiveReply,
        sendDemo,
        reload,
      }}
    >
      {children}
      <div role="status" className={`toast ${notice ? "visible" : ""}`}>
        {notice}
      </div>
    </Ctx.Provider>
  );
}
export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw Error("Provider ausente");
  return c;
}
