export type Category =
  | "hot_lead"
  | "quote_sent"
  | "awaiting_reply"
  | "forgotten"
  | "old_customer"
  | "followup_pending";
export type Contact = {
  id: string;
  name: string;
  phone: string;
  company_id: string;
};
export type Message = {
  id: string;
  contact_id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  body: string;
  created_at: string;
  company_id: string;
};
export type Opportunity = {
  id: string;
  contact_id: string;
  company_id: string;
  category: Category;
  score: number;
  estimated_value: number;
  reason: string;
  summary: string;
  intent: string;
  status: "open" | "recovered" | "ignored";
  last_interaction: string;
  recovered_at?: string | null;
};
export type Followup = {
  id: string;
  company_id: string;
  contact_id: string;
  message: string;
  scheduled_at: string;
  status: "scheduled" | "sent" | "cancelled";
  sent_at?: string | null;
};
export type Company = {
  id: string;
  name: string;
  segment: string;
  business_start: string;
  business_end: string;
  average_ticket: number;
  agent_count: number;
  whatsapp_connected: boolean;
};
export type Rule = {
  id: string;
  company_id: string;
  delay_hours: number;
  enabled: boolean;
};
export type Data = {
  company: Company;
  contacts: Contact[];
  messages: Message[];
  opportunities: Opportunity[];
  followups: Followup[];
  rules: Rule[];
};
export const categories: Record<Category, string> = {
  hot_lead: "Lead quente",
  quote_sent: "Orçamento enviado",
  awaiting_reply: "Aguardando resposta",
  forgotten: "Lead esquecido",
  old_customer: "Cliente antigo",
  followup_pending: "Follow-up pendente",
};
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
export const relative = (s: string) => {
  const h = Math.max(
    0,
    Math.floor((Date.now() - new Date(s).getTime()) / 3600000),
  );
  return h < 1
    ? "Agora"
    : h < 24
      ? `Há ${h}h`
      : `Há ${Math.floor(h / 24)} dias`;
};
