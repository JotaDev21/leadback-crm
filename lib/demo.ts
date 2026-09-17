import { Data, Category } from "./types";
export function createDemo(): Data {
  const ago = (hours: number) =>
    new Date(Date.now() - hours * 3600000).toISOString();
  const names = [
    "Mariana Costa",
    "João da Silva",
    "Camila Oliveira",
    "Rafael Santos",
    "Beatriz Lima",
    "Pedro Almeida",
    "Juliana Ferreira",
    "Lucas Martins",
    "Fernanda Rocha",
    "Bruno Carvalho",
    "Ana Ribeiro",
    "Gabriel Souza",
    "Isabela Mendes",
    "Diego Nunes",
    "Larissa Alves",
    "Thiago Pereira",
    "Carolina Dias",
    "Felipe Barbosa",
    "Amanda Teixeira",
    "Gustavo Castro",
  ];
  const company = {
    id: "demo",
    name: "Studio Forma",
    segment: "Arquitetura e interiores",
    business_start: "09:00",
    business_end: "18:00",
    average_ticket: 2500,
    agent_count: 3,
    whatsapp_connected: true,
  };
  const contacts = names.map((name, i) => ({
    id: `contact-${i}`,
    company_id: "demo",
    name,
    phone: `+55 11 9${String(87650000 + i * 1234).slice(0, 8)}`,
  }));
  const requests = [
    "Olá! Vocês fazem projetos para apartamentos pequenos? Acabei de pegar as chaves.",
    "Oi, queria um orçamento para reformar minha cozinha.",
    "Adorei o projeto que vi no Instagram! Queria algo assim para a minha sala.",
    "Bom dia! Consegue me mandar mais detalhes da consultoria?",
    "Oi! O orçamento inclui acompanhamento das compras?",
  ];
  const replies = [
    "Olá! Fazemos sim. A consultoria inclui uma reunião, estudo do ambiente e lista de compras.",
    "Claro! Preparei a proposta com o escopo completo e as etapas do projeto.",
    "Que bom saber! Podemos adaptar o projeto ao seu espaço e ao seu orçamento.",
  ];
  const final = [
    "Gostei muito! Consegue parcelar? Quero começar ainda este mês.",
    "Recebi a proposta. Vou conversar com meu marido e te retorno.",
    "Pode me confirmar a disponibilidade para a próxima semana?",
    "Obrigada pelas informações. Vou avaliar com calma.",
    "O valor ficou dentro do que eu esperava. Qual seria o próximo passo?",
  ];
  const messages = contacts.flatMap((c, i) =>
    [requests[i % 5], replies[i % 3], final[i % 5]].map((body, j) => ({
      id: `message-${i}-${j}`,
      company_id: "demo",
      contact_id: c.id,
      conversation_id: `conversation-${i}`,
      direction: (j === 1 ? "outbound" : "inbound") as "inbound" | "outbound",
      body,
      created_at: ago((i + 1) * 15 + 2 - j),
    })),
  );
  const cats: Category[] = [
    "hot_lead",
    "quote_sent",
    "awaiting_reply",
    "hot_lead",
    "forgotten",
    "quote_sent",
    "followup_pending",
    "old_customer",
    "awaiting_reply",
    "forgotten",
    "hot_lead",
    "quote_sent",
    "old_customer",
    "followup_pending",
    "hot_lead",
    "quote_sent",
  ];
  const values = [
    4800, 1500, 3200, 6500, 2400, 3800, 1800, 2900, 5200, 1600, 4200, 7500,
    2100, 3600, 5400, 2800,
  ];
  const opportunities = cats.map((category, i) => ({
    id: `opportunity-${i}`,
    company_id: "demo",
    contact_id: contacts[i].id,
    category,
    score: [96, 91, 87, 94, 62, 79, 74, 58, 85, 45, 92, 82, 65, 73, 89, 77][i],
    estimated_value: values[i],
    reason:
      category === "hot_lead"
        ? "Cliente demonstrou intenção de compra e perguntou sobre os próximos passos."
        : category === "awaiting_reply"
          ? "A última mensagem é do cliente e ainda não recebeu retorno da empresa."
          : category === "quote_sent"
            ? "A proposta foi recebida, mas a conversa ficou sem uma próxima etapa definida."
            : "A conversa está parada e há uma oportunidade de retomar o contato.",
    summary: `${contacts[i].name.split(" ")[0]} entrou em contato sobre um projeto de interiores. Demonstrou interesse na proposta e a conversa ainda pode avançar.`,
    intent:
      category === "hot_lead"
        ? "Iniciar o projeto neste mês"
        : "Avaliar a proposta de interiores",
    status: (i >= 12 ? "recovered" : "open") as "open" | "recovered",
    last_interaction: ago((i + 1) * 15),
    recovered_at: i >= 12 ? ago((i - 11) * 120) : null,
  }));
  const followups = contacts.slice(0, 8).map((c, i) => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(i / 3));
    date.setHours(10 + (i % 3) * 2, 30, 0, 0);
    if (date.getTime() < Date.now()) date.setHours(23, 30);
    return {
      id: `followup-${i}`,
      company_id: "demo",
      contact_id: c.id,
      message: `Oi, ${c.name.split(" ")[0]}! Tudo bem? Conseguiu avaliar a proposta? Se tiver alguma dúvida, estou por aqui.`,
      scheduled_at: date.toISOString(),
      status: "scheduled" as const,
    };
  });
  return {
    company,
    contacts,
    messages,
    opportunities,
    followups,
    rules: [24, 72, 168].map((n) => ({
      id: `rule-${n}`,
      company_id: "demo",
      delay_hours: n,
      enabled: n === 24,
    })),
  };
}
