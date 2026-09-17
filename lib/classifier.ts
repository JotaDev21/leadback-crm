import { Category, Message } from "./types";
export interface Classification {
  category: Category;
  score: number;
  estimated_value: number;
  reason: string;
  suggested_followup: string;
}
export interface IntelligenceProvider {
  analyze(
    messages: Message[],
    name: string,
    ticket: number,
  ): Promise<Classification>;
}
export const mockIntelligence: IntelligenceProvider = {
  async analyze(messages, name, ticket) {
    const sorted = [...messages].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );
    const incoming = sorted
      .filter((m) => m.direction === "inbound")
      .map((m) => m.body.toLowerCase())
      .join(" ");
    const last = sorted.at(-1);
    const age = last
      ? (Date.now() - new Date(last.created_at).getTime()) / 3600000
      : 0;
    const buying =
      /quero começar|próximo passo|parcelar|fechar|dentro do que/.test(
        incoming,
      );
    const quote = sorted.some(
      (m) =>
        m.direction === "outbound" &&
        /proposta|orçamento|r\$/.test(m.body.toLowerCase()),
    );
    const category: Category = buying
      ? "hot_lead"
      : last?.direction === "inbound"
        ? "awaiting_reply"
        : quote
          ? "quote_sent"
          : age > 168
            ? "forgotten"
            : "followup_pending";
    return {
      category,
      score: buying
        ? 91
        : category === "awaiting_reply"
          ? 85
          : quote
            ? 78
            : age > 168
              ? 45
              : 60,
      estimated_value: ticket,
      reason: buying
        ? "Cliente demonstrou intenção de compra e perguntou sobre contratação."
        : category === "awaiting_reply"
          ? "A última mensagem é do cliente e a empresa ainda não respondeu."
          : quote
            ? "Uma proposta foi enviada e ainda não recebeu retorno."
            : "A conversa pode ser retomada com uma mensagem de acompanhamento.",
      suggested_followup: `Oi, ${name.split(" ")[0]}! Tudo bem? ${quote ? "Conseguiu avaliar a proposta que te enviei?" : "Vamos retomar nossa conversa sobre o seu projeto?"} Se tiver alguma dúvida, estou por aqui.`,
    };
  },
};
export function cancelFutureFollowups<
  T extends { contact_id: string; status: string; scheduled_at: string },
>(rows: T[], contactId: string, receivedAt: string): T[] {
  return rows.map((f) =>
    f.contact_id === contactId &&
    f.status === "scheduled" &&
    f.scheduled_at >= receivedAt
      ? { ...f, status: "cancelled" }
      : f,
  );
}
