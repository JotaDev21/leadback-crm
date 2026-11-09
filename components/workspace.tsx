"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDownLeft,
  LayoutDashboard,
  Users,
  Clock3,
  ChartNoAxesCombined,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Plus,
  MessageCircle,
  Sparkles,
  CalendarDays,
  Ellipsis,
  Check,
  CircleHelp,
  PanelLeftClose,
  TrendingUp,
  Flame,
  FileText,
  MessageSquare,
  MoreHorizontal,
  X,
  Send,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Zap,
  CheckCheck,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { useApp } from "./provider";
import {
  Category,
  Opportunity,
  categories,
  money,
  relative,
} from "@/lib/types";
import { mockIntelligence } from "@/lib/classifier";
import { supabase } from "@/lib/supabase";
const nav = [
  ["dashboard", "Visão geral", LayoutDashboard],
  ["oportunidades", "Oportunidades", Users],
  ["followups", "Follow-ups", Clock3],
  ["analytics", "Analytics", ChartNoAxesCombined],
] as const;
const url = (s: string) => (s === "dashboard" ? "/" : `/${s}/`);
const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  return <span className={`avatar avatar-${index % 5}`}>{initials(name)}</span>;
}
function Badge({ category }: { category: Category }) {
  return (
    <span className={`badge ${category}`}>
      <span />
      {categories[category]}
    </span>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Workspace({ section }: { section: string }) {
  const app = useApp();
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [help, setHelp] = useState(false);
  const [lead, setLead] = useState<Opportunity | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();
  useEffect(() => {
    if (
      app.ready &&
      !app.demo &&
      !app.user &&
      section !== "login" &&
      section !== "onboarding"
    )
      router.replace("/login/");
  }, [app.ready, app.demo, app.user, section, router]);
  useEffect(() => {
    type MC = {
      registerTool: (tool: unknown, options: unknown) => Promise<void> | void;
    };
    const mc = (document as unknown as { modelContext?: MC }).modelContext;
    if (!app.demo || !mc) return;
    const controller = new AbortController();
    Promise.resolve(
      mc.registerTool(
        {
          name: "list_opportunities",
          description: "Lista as oportunidades visíveis da empresa atual.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: (input: unknown) => {
            if (
              !input ||
              typeof input !== "object" ||
              Object.keys(input).length
            )
              throw Error("Use um objeto vazio.");
            return app.data.opportunities.map((o) => ({
              id: o.id,
              name: app.data.contacts.find((c) => c.id === o.contact_id)?.name,
              score: o.score,
              status: o.status,
            }));
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, [app.data, app.demo]);
  if (section === "login") return <Auth />;
  if (section === "onboarding") return <Onboarding />;
  if (!app.ready || (!app.demo && !app.user))
    return <div className="loading">Carregando seu espaço de trabalho…</div>;
  const active = app.data.opportunities.filter((o) => o.status === "open");
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "sidebar-open" : ""}`}>
        <Link href="/" className="brand">
          <span className="brand-mark">
            <ArrowUpRight size={23} />
          </span>
          leadback<span className="brand-dot">.</span>
        </Link>
        <button
          className="company-selector"
          onClick={() => router.push("/configuracoes/")}
        >
          <span className="company-icon">
            {initials(app.data.company.name)}
          </span>
          <span>
            <strong>{app.data.company.name}</strong>
            <small>Seu espaço de trabalho</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([key, label, Icon]) => (
            <Link
              key={key}
              href={url(key)}
              onClick={() => setMenu(false)}
              className={`nav-item ${section === key ? "active" : ""}`}
            >
              <Icon size={19} />
              <span>{label}</span>
              {key === "oportunidades" && (
                <span className="nav-count">{active.length}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="whatsapp-status">
            <MessageCircle size={19} />
            <div>
              <strong>WhatsApp</strong>
              <small>
                {app.demo
                  ? app.data.company.whatsapp_connected
                    ? "Conexão demonstrativa"
                    : "Desconectado"
                  : "Integração pendente"}
              </small>
            </div>
            <span
              className={`status-dot ${app.data.company.whatsapp_connected ? "" : "offline"}`}
            />
          </div>
          <Link
            href="/configuracoes/"
            className={`nav-item ${section === "configuracoes" ? "active" : ""}`}
          >
            <Settings size={19} />
            Configurações
          </Link>
          <button className="nav-item" onClick={() => setHelp(true)}>
            <CircleHelp size={19} />
            Precisa de ajuda?
            <ArrowUpRight size={15} />
          </button>
          <div className="profile">
            <Avatar name="Ana Martins" />
            <div>
              <strong>{app.user?.split("@")[0] ?? "Ana Martins"}</strong>
              <small>
                {app.demo ? "Workspace de demonstração" : "Minha conta"}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Abrir conta"
              onClick={() => router.push("/login/")}
            >
              <Ellipsis size={19} />
            </button>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-toggle"
              aria-label="Abrir menu"
              onClick={() => setMenu(!menu)}
            >
              <PanelLeftClose size={19} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {section === "configuracoes"
                ? "Configurações"
                : nav.find((n) => n[0] === section)?.[1]}
            </strong>
          </div>
          <div className="top-actions">
            <span className="demo-label">
              {app.demo ? "Modo demonstração" : "Workspace conectado"}
            </span>
            <button
              className="icon-button notification-button"
              aria-label="Notificações"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              <i />
            </button>
            <span className="top-divider" />
            <Avatar name="Ana Martins" />
          </div>
          {notifications && (
            <div className="notification-pop">
              <strong>Seu radar de oportunidades</strong>
              <p>
                {active.filter((o) => o.category === "awaiting_reply").length}{" "}
                clientes estão aguardando uma resposta.
              </p>
              <Link
                href="/oportunidades/"
                onClick={() => setNotifications(false)}
              >
                Ver oportunidades <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </header>
        <main>
          {section === "dashboard" ? (
            <Dashboard onLead={setLead} />
          ) : section === "oportunidades" ? (
            <Opportunities
              onLead={setLead}
              search={search}
              setSearch={setSearch}
            />
          ) : section === "followups" ? (
            <Followups />
          ) : section === "analytics" ? (
            <Analytics />
          ) : (
            <SettingsPage />
          )}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={14} />{" "}
              {app.demo
                ? "Dados fictícios. Alterações duram nesta sessão."
                : "Dados protegidos por empresa."}
            </span>
            <span>Feito para boas conversas virarem negócios.</span>
          </footer>
        </main>
      </div>
      <LeadDialog
        opportunity={
          lead
            ? (app.data.opportunities.find((o) => o.id === lead.id) ?? null)
            : null
        }
        onClose={() => setLead(null)}
      />
      <Dialog
        open={help}
        onOpenChange={setHelp}
        title="Cada conversa tem um próximo passo"
      >
        <p className="muted">
          Comece em Oportunidades, abra um contato e confira o histórico. Gere
          uma sugestão de mensagem, edite e agende o retorno.
        </p>
        <div className="notice-box">
          Na demonstração, nenhum WhatsApp é enviado. Use “Simular resposta” no
          detalhe do lead para testar o cancelamento dos follow-ups.
        </div>
        <Button
          onClick={() => {
            setHelp(false);
            router.push("/oportunidades/");
          }}
        >
          Explorar oportunidades <ArrowRight size={16} />
        </Button>
      </Dialog>
    </div>
  );
}
function Dashboard({ onLead }: { onLead: (o: Opportunity) => void }) {
  const { data } = useApp();
  const active = data.opportunities.filter((o) => o.status === "open");
  const pending = data.followups.filter((f) => f.status === "scheduled");
  const total = active.reduce((s, o) => s + o.estimated_value, 0);
  const [period, setPeriod] = useState("30");
  const metrics = [
    {
      label: "Leads quentes",
      value: active.filter((o) => o.category === "hot_lead").length,
      icon: Flame,
      foot: "Prontos para o próximo passo",
      tone: "green",
    },
    {
      label: "Orçamentos sem retorno",
      value: active.filter((o) => o.category === "quote_sent").length,
      icon: FileText,
      foot: "Uma conversa pode destravar",
      tone: "blue",
    },
    {
      label: "Aguardando resposta",
      value: active.filter((o) => o.category === "awaiting_reply").length,
      icon: MessageSquare,
      foot: "O próximo passo é seu",
      tone: "orange",
    },
    {
      label: "Leads esquecidos",
      value: active.filter((o) => o.category === "forgotten").length,
      icon: Clock3,
      foot: "Ainda dá tempo de retomar",
      tone: "purple",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="SEU RADAR COMERCIAL"
        title="Boas conversas merecem continuar."
        description="Veja o que está parado e transforme interesse em novas vendas."
      >
        <button className="period-select">
          <CalendarDays size={16} />
          <select
            aria-label="Período do dashboard"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="30">Últimos 30 dias</option>
            <option value="7">Últimos 7 dias</option>
          </select>
          <ChevronDown size={14} />
        </button>
      </PageHeading>
      <section className="opportunity-banner">
        <div className="banner-copy">
          <div className="banner-label">
            <Sparkles size={15} /> EXISTE POTENCIAL NAS SUAS CONVERSAS
          </div>
          <h2>
            Você pode estar deixando
            <br />
            <span>{money(total)}</span> em vendas paradas.
          </h2>
          <p>
            Identificamos {active.length} oportunidades no seu WhatsApp.
            <br />O próximo negócio pode estar em uma delas.
          </p>
          <Link className="btn banner-button" href="/oportunidades/">
            Explorar oportunidades <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="banner-right">
          <div className="potential-caption">
            VALOR ESTIMADO EM OPORTUNIDADES
          </div>
          <div className="potential-value">
            {money(total)}
            <ArrowUpRight size={31} />
          </div>
          <div className="potential-bar">
            {[4, 3, 2, 2, 1].map((v, i) => (
              <span key={i} style={{ flex: v }} />
            ))}
          </div>
          <div className="potential-legend">
            <span>
              <i /> {active.filter((o) => o.score >= 85).length} oportunidades
              com alto interesse
            </span>
            <span>Score ≥ 85</span>
          </div>
          <div className="banner-note">
            <span className="stacked-avatars">
              {data.contacts.slice(0, 3).map((c, i) => (
                <Avatar key={c.id} name={c.name} index={i} />
              ))}
            </span>
            <span>
              Pessoas que já conhecem sua empresa.
              <br />
              <strong>Retome de onde a conversa parou.</strong>
            </span>
          </div>
        </div>
      </section>
      <div className="stats-grid">
        {metrics.map((m) => (
          <Link href="/oportunidades/" key={m.label} className="stat-card">
            <div className="stat-top">
              <span>{m.label}</span>
              <span className={`stat-icon ${m.tone}`}>
                <m.icon size={17} />
              </span>
            </div>
            <div className="stat-value">
              {String(m.value).padStart(2, "0")}
              <ArrowUpRight size={18} />
            </div>
            <small>{m.foot}</small>
          </Link>
        ))}
      </div>
      <div className="dashboard-middle">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Conversas retomadas. Resultados reais.</h2>
              <p>Oportunidades recuperadas nos últimos {period} dias</p>
            </div>
            <span className="chart-key">
              <i /> Recuperadas
            </span>
          </div>
          <RecoveryChart days={Number(period)} />
        </section>
        <section className="panel agenda-panel">
          <div className="panel-heading">
            <h2>
              Próximos follow-ups{" "}
              <span className="count-pill">{pending.length}</span>
            </h2>
            <Link href="/followups/" aria-label="Ver todos os follow-ups">
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <p className="agenda-subtitle">Um bom retorno faz a diferença.</p>
          {pending.slice(0, 3).map((f, i) => {
            const c = data.contacts.find((c) => c.id === f.contact_id)!;
            return (
              <button
                className="agenda-item"
                key={f.id}
                onClick={() => {
                  const o = data.opportunities.find(
                    (o) => o.contact_id === c.id,
                  );
                  if (o) onLead(o);
                }}
              >
                <Avatar name={c.name} index={i} />
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {new Date(f.scheduled_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    ·{" "}
                    {new Date(f.scheduled_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </span>
                <span className="agenda-clock">
                  <Clock3 size={15} />
                </span>
              </button>
            );
          })}
          {!pending.length && (
            <p className="empty">Tudo em dia. Nenhum retorno pendente.</p>
          )}
          <Link href="/followups/" className="agenda-link">
            Abrir minha agenda <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              Vale a pena retomar <span className="tiny-tag">PRIORIDADE</span>
            </h2>
            <p>As oportunidades com maior chance de virar negócio.</p>
          </div>
          <Link className="text-link" href="/oportunidades/">
            Ver todas <ArrowRight size={15} />
          </Link>
        </div>
        <OpportunityTable
          rows={[...active].sort((a, b) => b.score - a.score).slice(0, 4)}
          onLead={onLead}
        />
      </section>
    </>
  );
}
function RecoveryChart({ days = 30 }: { days?: number }) {
  const { data } = useApp();
  const end = Date.now();
  const start = end - days * 86400000;
  const recovered = data.opportunities.filter(
    (o) =>
      o.status === "recovered" &&
      o.recovered_at &&
      new Date(o.recovered_at).getTime() >= start,
  );
  const bins = Array.from(
    { length: days },
    (_, i) =>
      recovered.filter(
        (o) =>
          new Date(o.recovered_at!).getTime() >= start + i * 86400000 &&
          new Date(o.recovered_at!).getTime() < start + (i + 1) * 86400000,
      ).length,
  );
  let sum = 0;
  const values = bins.map((v) => (sum += v));
  const max = Math.max(4, ...values);
  const points = values
    .map((v, i) => `${45 + (i / (days - 1)) * 650},${150 - (v / max) * 120}`)
    .join(" ");
  return (
    <div className="chart-wrap">
      <div className="chart-summary">
        <strong>{recovered.length}</strong>
        <span>
          oportunidades recuperadas{" "}
          <span className="green-text">
            {money(recovered.reduce((s, o) => s + o.estimated_value, 0))}
          </span>
        </span>
      </div>
      <svg
        viewBox="0 0 720 188"
        role="img"
        aria-label={`${recovered.length} oportunidades recuperadas nos últimos ${days} dias`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#188568" stopOpacity=".15" />
            <stop offset="100%" stopColor="#188568" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((n) => (
          <g key={n}>
            <line
              x1="45"
              x2="695"
              y1={150 - n * 40}
              y2={150 - n * 40}
              stroke="#edf0ee"
              strokeDasharray="4 5"
            />
            <text x="8" y={154 - n * 40} fill="#98a29c" fontSize="12">
              {Math.round((max * n) / 3)}
            </text>
          </g>
        ))}
        <polygon points={`45,150 ${points} 695,150`} fill="url(#chart-fill)" />
        <polyline
          points={points}
          fill="none"
          stroke="#258467"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {[0, 1, 2, 3, 4].map((n) => (
          <text
            key={n}
            x={45 + n * 162.5}
            y="180"
            textAnchor={n === 4 ? "end" : "start"}
            fill="#8b958e"
            fontSize="12"
          >
            {new Date(start + (n * (end - start)) / 4).toLocaleDateString(
              "pt-BR",
              { day: "2-digit", month: "short" },
            )}
          </text>
        ))}
      </svg>
    </div>
  );
}
function OpportunityTable({
  rows,
  onLead,
}: {
  rows: Opportunity[];
  onLead: (o: Opportunity) => void;
}) {
  const { data } = useApp();
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Contato</th>
            <th>Oportunidade</th>
            <th>Interesse</th>
            <th>Valor estimado</th>
            <th>Última interação</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((o, i) => {
            const c = data.contacts.find((c) => c.id === o.contact_id)!;
            return (
              <tr key={o.id} onClick={() => onLead(o)}>
                <td>
                  <button
                    className="contact-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLead(o);
                    }}
                  >
                    <Avatar name={c.name} index={i} />
                    <span>
                      <strong>{c.name}</strong>
                      <small>{c.phone}</small>
                    </span>
                  </button>
                </td>
                <td>
                  <Badge category={o.category} />
                </td>
                <td>
                  <div className="score">
                    <span className="score-track">
                      <i style={{ width: `${o.score}%` }} />
                    </span>
                    <strong>{o.score}</strong>
                  </div>
                </td>
                <td className="money-cell">{money(o.estimated_value)}</td>
                <td className="muted nowrap">{relative(o.last_interaction)}</td>
                <td>
                  <span className={`status-text ${o.status}`}>
                    {o.status === "open"
                      ? "Em aberto"
                      : o.status === "recovered"
                        ? "Recuperado"
                        : "Ignorado"}
                  </span>
                </td>
                <td>
                  <button
                    aria-label={`Ver ${c.name}`}
                    className="icon-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLead(o);
                    }}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (
        <div className="empty">
          <Search size={24} />
          <h3>Nenhuma oportunidade por aqui</h3>
          <p>Tente outro nome ou ajuste os filtros.</p>
        </div>
      )}
    </div>
  );
}
function Opportunities({
  onLead,
  search,
  setSearch,
}: {
  onLead: (o: Opportunity) => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  const { data } = useApp();
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("open");
  const [sort, setSort] = useState("score");
  const filtered = data.opportunities
    .filter((o) => {
      const c = data.contacts.find((c) => c.id === o.contact_id);
      return (
        (status === "all" || o.status === status) &&
        (category === "all" || o.category === category) &&
        `${c?.name} ${c?.phone}`.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) =>
      sort === "score"
        ? b.score - a.score
        : sort === "value"
          ? b.estimated_value - a.estimated_value
          : b.last_interaction.localeCompare(a.last_interaction),
    );
  return (
    <>
      <PageHeading
        eyebrow="OPORTUNIDADES"
        title="O próximo negócio já te conhece."
        description="Priorize quem demonstrou interesse. Retome a conversa certa."
      />
      <div className="opportunities-summary">
        <span>
          <Sparkles size={18} /> {filtered.length} oportunidades encontradas
        </span>
        <strong>
          {money(filtered.reduce((s, o) => s + o.estimated_value, 0))}{" "}
          <small>em potencial</small>
        </strong>
      </div>
      <section className="panel">
        <div className="filter-toolbar">
          <div className="tabs">
            {[
              ["open", "Em aberto"],
              ["recovered", "Recuperadas"],
              ["all", "Todas"],
            ].map(([v, t]) => (
              <button
                key={v}
                className={status === v ? "selected" : ""}
                onClick={() => setStatus(v)}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={17} />
            <input
              placeholder="Buscar nome ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="filter-row">
          <label>
            <SlidersHorizontal size={15} />
            <select
              aria-label="Filtrar categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">Todas as categorias</option>
              {Object.entries(categories).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ordenar por{" "}
            <select
              aria-label="Ordenar oportunidades"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="score">Maior interesse</option>
              <option value="value">Maior valor</option>
              <option value="recent">Mais recentes</option>
            </select>
          </label>
        </div>
        <OpportunityTable rows={filtered} onLead={onLead} />
        <div className="table-footer">
          {filtered.length} de {data.opportunities.length} oportunidades{" "}
          <span>Classificação demonstrativa · Revise antes de agir</span>
        </div>
      </section>
    </>
  );
}
function LeadDialog({
  opportunity: o,
  onClose,
}: {
  opportunity: Opportunity | null;
  onClose: () => void;
}) {
  const app = useApp();
  const [draft, setDraft] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setDraft("");
    setSchedule(false);
    setError("");
    setEditing(false);
    setDate("");
  }, [o?.id]);
  if (!o) return null;
  const c = app.data.contacts.find((c) => c.id === o.contact_id)!;
  const messages = app.data.messages
    .filter((m) => m.contact_id === c.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={!!o}
      onOpenChange={(v) => !v && onClose()}
      title="Detalhe da oportunidade"
    >
      <div className="lead-heading">
        <Avatar name={c.name} />
        <div>
          <h2>{c.name}</h2>
          <p>{c.phone}</p>
        </div>
        <Badge category={o.category} />
      </div>
      <div className="lead-grid">
        <div className="conversation">
          <div className="conversation-title">
            <MessageCircle size={17} /> Histórico da conversa{" "}
            <span>WhatsApp</span>
          </div>
          <div className="messages">
            {messages.map((m) => (
              <div className={`message ${m.direction}`} key={m.id}>
                <p>{m.body}</p>
                <small>
                  {new Date(m.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}{" "}
                  ·{" "}
                  {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {m.direction === "outbound" && <CheckCheck size={13} />}
                </small>
              </div>
            ))}
          </div>
          {app.demo && (
            <button
              className="text-link simulate"
              onClick={() => act(() => app.receiveReply(c.id))}
            >
              <RefreshCw size={14} /> Simular resposta do cliente
            </button>
          )}
        </div>
        <div className="lead-insight">
          <div className="insight-title">
            <Sparkles size={17} />
            <strong>Análise da oportunidade</strong>
            <span>Mock</span>
          </div>
          <div className="lead-numbers">
            <div>
              <span>Interesse</span>
              <strong>
                {o.score}
                <small>/100</small>
              </strong>
            </div>
            <div>
              <span>Valor estimado</span>
              <strong>{money(o.estimated_value)}</strong>
            </div>
          </div>
          <label>RESUMO</label>
          <p>{o.summary}</p>
          <label>INTENÇÃO DETECTADA</label>
          <p>{o.intent}</p>
          <label>POR QUE RETOMAR?</label>
          <p>{o.reason}</p>
          <div className="last-interaction">
            <Clock3 size={14} /> Última interação:{" "}
            {relative(messages.at(-1)?.created_at ?? o.last_interaction)}
          </div>
          <Button
            disabled={busy}
            onClick={() =>
              act(async () => {
                const result = await mockIntelligence.analyze(
                  messages,
                  c.name,
                  o.estimated_value,
                );
                setDraft(result.suggested_followup);
                setEditing(true);
              })
            }
          >
            <Sparkles size={16} />
            {draft ? "Gerar outra sugestão" : "Gerar follow-up"}
          </Button>
        </div>
      </div>
      {draft && (
        <div className="draft-box">
          <div className="draft-title">
            <strong>Um retorno com a sua voz</strong>
            <span>Sugestão demonstrativa · revise antes de enviar</span>
          </div>
          <textarea
            aria-label="Mensagem de follow-up"
            value={draft}
            readOnly={!editing}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
          />
          <div className="draft-actions">
            <Button variant="ghost" onClick={() => setEditing(!editing)}>
              {editing ? "Concluir edição" : "Editar"}
            </Button>
            <Button variant="outline" onClick={() => setSchedule(!schedule)}>
              <CalendarDays size={16} />
              Agendar
            </Button>
            <Button
              disabled={busy || !draft.trim()}
              onClick={() =>
                act(async () => {
                  if (!app.demo)
                    throw Error(
                      "Conecte um provedor oficial de WhatsApp antes de enviar.",
                    );
                  await app.sendDemo(c.id, draft);
                  app.notify(
                    "Envio simulado. A sequência ativa foi agendada, sem mensagens reais.",
                  );
                  setDraft("");
                })
              }
            >
              <Send size={16} />
              {app.demo ? "Simular envio" : "Enviar"}
            </Button>
          </div>
          {schedule && (
            <form
              className="schedule-form"
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  await app.addFollowup(
                    c.id,
                    draft,
                    new Date(date).toISOString(),
                  );
                  app.notify(
                    app.demo
                      ? "Follow-up agendado na demonstração."
                      : "Follow-up agendado.",
                  );
                  setSchedule(false);
                  setDraft("");
                });
              }}
            >
              <label>
                Data e horário
                <input
                  required
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <Button disabled={busy}>Confirmar agendamento</Button>
            </form>
          )}
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-bottom">
        <Button
          variant="ghost"
          disabled={busy || o.status === "ignored"}
          onClick={() =>
            act(async () => {
              await app.update("opportunities", o.id, { status: "ignored" });
              app.notify("Oportunidade ignorada.");
              onClose();
            })
          }
        >
          Ignorar oportunidade
        </Button>
        <Button
          variant="outline"
          disabled={busy || o.status === "recovered"}
          onClick={() =>
            act(async () => {
              await app.update("opportunities", o.id, {
                status: "recovered",
                recovered_at: new Date().toISOString(),
              });
              app.notify("Oportunidade marcada como recuperada.");
              onClose();
            })
          }
        >
          <Check size={16} />
          {o.status === "recovered" ? "Recuperada" : "Marcar como recuperada"}
        </Button>
      </div>
    </Dialog>
  );
}
function Followups() {
  const app = useApp();
  const [creating, setCreating] = useState(false);
  const [contact, setContact] = useState(app.data.contacts[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("scheduled");
  const [busy, setBusy] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const after = new Date(tomorrow);
  after.setDate(after.getDate() + 1);
  const week = new Date(today);
  week.setDate(week.getDate() + 7);
  const groups = [
    { name: "Atrasados", test: (s: string) => new Date(s) < today },
    {
      name: "Hoje",
      test: (s: string) => new Date(s) >= today && new Date(s) < tomorrow,
    },
    {
      name: "Amanhã",
      test: (s: string) => new Date(s) >= tomorrow && new Date(s) < after,
    },
    {
      name: "Esta semana",
      test: (s: string) => new Date(s) >= after && new Date(s) < week,
    },
    { name: "Mais adiante", test: (s: string) => new Date(s) >= week },
  ];
  return (
    <>
      <PageHeading
        eyebrow="FOLLOW-UPS"
        title="Presença no momento certo."
        description="Organize os próximos retornos sem deixar ninguém para trás."
      >
        <Button onClick={() => setCreating(true)}>
          <Plus size={17} /> Novo follow-up
        </Button>
      </PageHeading>
      <div className="notice-box">
        <ShieldCheck size={20} />
        <div>
          <strong>O cliente respondeu? A sequência para.</strong>
          <p>
            Os próximos follow-ups são cancelados automaticamente quando uma
            nova resposta chega.
          </p>
        </div>
      </div>
      <div className="followup-layout">
        <div>
          <div className="tabs followup-tabs">
            {[
              ["scheduled", "Agendados"],
              ["sent", "Enviados"],
              ["cancelled", "Cancelados"],
            ].map(([v, t]) => (
              <button
                key={v}
                className={tab === v ? "selected" : ""}
                onClick={() => setTab(v)}
              >
                {t}{" "}
                <span>
                  {app.data.followups.filter((f) => f.status === v).length}
                </span>
              </button>
            ))}
          </div>
          {groups.map((group) => {
            const rows = app.data.followups
              .filter((f) => f.status === tab && group.test(f.scheduled_at))
              .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
            if (!rows.length) return null;
            return (
              <section className="followup-group" key={group.name}>
                <h2>
                  {group.name}
                  <span>{rows.length}</span>
                </h2>
                {rows.map((f, i) => {
                  const c = app.data.contacts.find(
                    (c) => c.id === f.contact_id,
                  )!;
                  return (
                    <article className="panel followup-card" key={f.id}>
                      <div className="followup-card-top">
                        <Avatar name={c.name} index={i} />
                        <div>
                          <strong>{c.name}</strong>
                          <small>{c.phone}</small>
                        </div>
                        <span
                          className={`badge ${tab === "cancelled" ? "forgotten" : "followup_pending"}`}
                        >
                          {tab === "scheduled"
                            ? "Agendado"
                            : tab === "sent"
                              ? "Enviado"
                              : "Cancelado"}
                        </span>
                      </div>
                      <p>{f.message}</p>
                      <div className="followup-card-bottom">
                        <span>
                          <CalendarDays size={15} />
                          {new Date(f.scheduled_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {tab === "scheduled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                await app.update("followups", f.id, {
                                  status: "cancelled",
                                });
                                app.notify("Agendamento cancelado.");
                              } catch (e) {
                                app.notify((e as Error).message);
                              }
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            );
          })}
          {!app.data.followups.some((f) => f.status === tab) && (
            <div className="panel empty">
              <CheckCheck size={28} />
              <h3>
                Nenhum follow-up{" "}
                {tab === "sent"
                  ? "enviado"
                  : tab === "cancelled"
                    ? "cancelado"
                    : "agendado"}
              </h3>
              <p>Os retornos desta categoria aparecerão aqui.</p>
            </div>
          )}
        </div>
        <aside className="panel automation-panel">
          <span className="stat-icon green">
            <Zap size={19} />
          </span>
          <h2>O ritmo do seu retorno</h2>
          <p>Ative as etapas da sua sequência de acompanhamento.</p>
          {app.data.rules.map((r) => (
            <div className="rule-row" key={r.id}>
              <div>
                <strong>
                  Após{" "}
                  {r.delay_hours === 24
                    ? "24 horas"
                    : r.delay_hours / 24 + " dias"}
                </strong>
                <small>Sem resposta do cliente</small>
              </div>
              <button
                className={`switch ${r.enabled ? "on" : ""}`}
                role="switch"
                aria-checked={r.enabled}
                aria-label={`Follow-up após ${r.delay_hours} horas`}
                onClick={async () => {
                  try {
                    await app.update("rules", r.id, { enabled: !r.enabled });
                  } catch (e) {
                    app.notify((e as Error).message);
                  }
                }}
              >
                <span />
              </button>
            </div>
          ))}
          <div className="automation-note">
            <Clock3 size={15} />
            <span>
              Horário comercial
              <br />
              <strong>
                {app.data.company.business_start} às{" "}
                {app.data.company.business_end}
              </strong>
            </span>
          </div>
          <p className="small-note">
            {app.demo
              ? "Demonstração: os agendamentos não disparam mensagens reais."
              : "O envio automático depende da ativação do provedor de WhatsApp e do processador de agendamentos."}
          </p>
        </aside>
      </div>
      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="Agendar um novo retorno"
      >
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await app.addFollowup(
                contact,
                message,
                new Date(date).toISOString(),
              );
              setCreating(false);
              setMessage("");
              setDate("");
              app.notify("Follow-up agendado.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Cliente
            <select
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            >
              {app.data.contacts.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mensagem
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Oi! Tudo bem? Vamos retomar nossa conversa?"
            />
          </label>
          <label>
            Data e horário
            <input
              required
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <Button disabled={busy}>
            Agendar follow-up <ArrowRight size={16} />
          </Button>
        </form>
      </Dialog>
    </>
  );
}
function Analytics() {
  const { data } = useApp();
  const [days, setDays] = useState(30);
  const cutoff = Date.now() - days * 86400000;
  const recovered = data.opportunities.filter(
    (o) =>
      o.status === "recovered" &&
      o.recovered_at &&
      new Date(o.recovered_at).getTime() >= cutoff,
  );
  const sent = data.followups.filter(
    (f) =>
      f.status === "sent" &&
      f.sent_at &&
      new Date(f.sent_at).getTime() >= cutoff,
  );
  const replied = sent.filter((f) =>
    data.messages.some(
      (m) =>
        m.contact_id === f.contact_id &&
        m.direction === "inbound" &&
        m.created_at > f.sent_at!,
    ),
  );
  const generated = data.opportunities.filter(
    (o) => new Date(o.last_interaction).getTime() >= cutoff,
  );
  const metrics = [
    [
      "Leads recuperados",
      recovered.length,
      "Oportunidades marcadas como recuperadas",
    ],
    [
      "Taxa de resposta",
      sent.length
        ? Math.round((replied.length / sent.length) * 100) + "%"
        : "—",
      "Respostas após um follow-up enviado",
    ],
    [
      "Oportunidades geradas",
      generated.length,
      "Contatos com potencial identificado",
    ],
    [
      "Valor recuperado",
      money(recovered.reduce((s, o) => s + o.estimated_value, 0)),
      "Estimativa dos negócios recuperados",
    ],
    ["Follow-ups enviados", sent.length, "Envios registrados no período"],
    [
      "Conversões estimadas",
      generated.length
        ? Math.round(
            (recovered.filter((o) => generated.some((g) => g.id === o.id))
              .length /
              generated.length) *
              100,
          ) + "%"
        : "—",
      "Recuperadas entre oportunidades do período",
    ],
  ];
  return (
    <>
      <PageHeading
        eyebrow="ANALYTICS"
        title="Cada retorno conta."
        description="Acompanhe como suas conversas se transformam em resultados."
      >
        <label className="period-select">
          <CalendarDays size={16} />
          <select
            aria-label="Período dos resultados"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={30}>Últimos 30 dias</option>
            <option value={7}>Últimos 7 dias</option>
          </select>
        </label>
      </PageHeading>
      <div className="analytics-grid">
        {metrics.map(([label, value, note]) => (
          <article className="stat-card" key={label}>
            <div className="stat-top">
              {label}
              <TrendingUp size={17} />
            </div>
            <div className="stat-value">{value}</div>
            <small>{note}</small>
          </article>
        ))}
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Recuperação ao longo do tempo</h2>
            <p>Oportunidades acumuladas no período selecionado.</p>
          </div>
          <span className="chart-key">
            <i /> Recuperadas
          </span>
        </div>
        <RecoveryChart days={days} />
      </section>
      <section className="panel category-panel">
        <div className="panel-heading">
          <h2>Onde estão as oportunidades</h2>
        </div>
        {Object.entries(categories).map(([key, label]) => {
          const count = generated.filter((o) => o.category === key).length;
          return (
            <div className="category-bar" key={key}>
              <span>{label}</span>
              <div>
                <i
                  style={{
                    width: `${generated.length ? (count / generated.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <strong>{count}</strong>
            </div>
          );
        })}
      </section>
    </>
  );
}
function CompanyForm({ onDone }: { onDone?: () => void }) {
  const app = useApp();
  const [form, setForm] = useState(app.data.company);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="company-form form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await app.saveCompany(form);
          app.notify("Informações da empresa salvas.");
          onDone?.();
        } catch (e) {
          app.notify((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Nome da empresa
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label>
        Segmento
        <input
          required
          value={form.segment}
          onChange={(e) => setForm({ ...form, segment: e.target.value })}
        />
      </label>
      <div className="form-grid">
        <label>
          Início do expediente
          <input
            required
            type="time"
            value={form.business_start}
            onChange={(e) =>
              setForm({ ...form, business_start: e.target.value })
            }
          />
        </label>
        <label>
          Fim do expediente
          <input
            required
            type="time"
            value={form.business_end}
            onChange={(e) => setForm({ ...form, business_end: e.target.value })}
          />
        </label>
        <label>
          Ticket médio (R$)
          <input
            required
            type="number"
            min="0"
            value={form.average_ticket}
            onChange={(e) =>
              setForm({ ...form, average_ticket: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Quantidade de atendentes
          <input
            required
            type="number"
            min="1"
            value={form.agent_count}
            onChange={(e) =>
              setForm({ ...form, agent_count: Number(e.target.value) })
            }
          />
        </label>
      </div>
      <Button disabled={busy}>
        {onDone ? "Continuar" : "Salvar alterações"}
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}
function SettingsPage() {
  const app = useApp();
  const [tab, setTab] = useState("Empresa");
  const [working, setWorking] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="CONFIGURAÇÕES"
        title="Do seu jeito de trabalhar."
        description="Ajuste seu espaço, suas conexões e o ritmo dos retornos."
      />
      <div className="settings-layout">
        <nav className="settings-nav">
          {[
            "Empresa",
            "Usuários",
            "WhatsApp",
            "Horário comercial",
            "Automações",
            "IA",
            "Assinatura",
          ].map((t) => (
            <button
              key={t}
              className={tab === t ? "selected" : ""}
              onClick={() => setTab(t)}
            >
              {t}
              <ChevronRight size={15} />
            </button>
          ))}
        </nav>
        <section className="panel settings-panel">
          <h2>{tab}</h2>
          <p className="muted">
            {tab === "Empresa"
              ? "Informações que ajudam a entender o seu negócio."
              : tab === "Horário comercial"
                ? "Defina o melhor horário para conversar com seus clientes."
                : ""}
          </p>
          {tab === "Empresa" || tab === "Horário comercial" ? (
            <CompanyForm />
          ) : tab === "WhatsApp" ? (
            <>
              <div className="connection-card">
                <MessageCircle size={36} />
                <h3>
                  {app.demo && app.data.company.whatsapp_connected
                    ? "WhatsApp conectado na demonstração"
                    : "Conecte suas conversas"}
                </h3>
                <p>
                  {app.demo
                    ? "Explore o fluxo com conversas fictícias. Nenhuma mensagem é enviada para números reais."
                    : "A integração com WhatsApp Business ainda precisa ser configurada."}
                </p>
                <Button
                  disabled={working || !app.demo}
                  onClick={async () => {
                    setWorking(true);
                    try {
                      await app.saveCompany({
                        whatsapp_connected:
                          !app.data.company.whatsapp_connected,
                      });
                      app.notify(
                        app.data.company.whatsapp_connected
                          ? "Conexão demonstrativa removida."
                          : "Conexão demonstrativa ativada.",
                      );
                    } finally {
                      setWorking(false);
                    }
                  }}
                >
                  {app.data.company.whatsapp_connected
                    ? "Desconectar simulação"
                    : "Simular conexão"}
                </Button>
              </div>
            </>
          ) : tab === "Usuários" ? (
            <>
              <div className="user-row">
                <Avatar name="Ana Martins" />
                <span>
                  <strong>{app.user ?? "Ana Martins"}</strong>
                  <small>Responsável pelo espaço</small>
                </span>
                <span className="badge old_customer">Administrador</span>
              </div>
              <p className="small-note">
                O MVP mantém os usuários vinculados à empresa. Convites e
                permissões avançadas ficam para uma próxima etapa.
              </p>
            </>
          ) : tab === "Automações" ? (
            <>
              <p>
                Escolha intervalos de 24 horas, 3 dias ou 7 dias. Uma resposta
                do cliente interrompe os próximos retornos.
              </p>
              <Link href="/followups/" className="btn btn-primary">
                Configurar sequência <ArrowRight size={16} />
              </Link>
            </>
          ) : tab === "IA" ? (
            <>
              <div className="notice-box">
                <Sparkles size={22} />
                <div>
                  <strong>Classificação demonstrativa ativa</strong>
                  <p>
                    As sugestões usam regras de intenção de compra, orçamento e
                    ausência de resposta.
                  </p>
                </div>
              </div>
              <p className="muted">
                A integração com um modelo de IA poderá ser ativada no servidor.
                Nenhuma chave secreta fica no navegador.
              </p>
            </>
          ) : (
            <>
              <span className="badge old_customer">MVP · Demonstração</span>
              <h3>Espaço para experimentar</h3>
              <p className="muted">
                Nenhuma cobrança ativa. Planos e pagamentos ainda não estão
                disponíveis.
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}
function Auth() {
  const app = useApp();
  const router = useRouter();
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="auth-shell">
      <div className="auth-story">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <ArrowUpRight size={23} />
          </span>
          leadback.
        </Link>
        <div>
          <span className="eyebrow">MAIS CONVERSAS. NOVAS POSSIBILIDADES.</span>
          <h1>
            Seu próximo cliente
            <br />
            pode já estar
            <br />
            <em>no seu WhatsApp.</em>
          </h1>
          <p>
            Retome boas conversas.
            <br />
            Recupere oportunidades. Faça seu negócio crescer.
          </p>
        </div>
        <small>Um novo começo para cada conversa.</small>
      </div>
      <div className="auth-form">
        <div>
          <span className="eyebrow">BEM-VINDO AO LEADBACK</span>
          <h1>
            {signup
              ? "Seu próximo capítulo começa aqui."
              : "Bom ter você de volta."}
          </h1>
          <p className="muted">
            {signup
              ? "Crie sua conta e conheça suas oportunidades."
              : "Entre para continuar de onde parou."}
          </p>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (!supabase) {
                setError(
                  "O acesso por e-mail estará disponível após configurar o Supabase. Explore a demonstração abaixo.",
                );
                return;
              }
              setBusy(true);
              try {
                const result = signup
                  ? await supabase.auth.signUp({ email, password })
                  : await supabase.auth.signInWithPassword({ email, password });
                if (result.error) throw result.error;
                if (signup && !result.data.session) {
                  setError("Confira seu e-mail para confirmar o cadastro.");
                  return;
                }
                await app.reload();
                router.push(signup ? "/onboarding/" : "/");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              E-mail de trabalho
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                autoComplete="email"
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Pelo menos 8 caracteres"
                autoComplete={signup ? "new-password" : "current-password"}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button disabled={busy}>
              {busy ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-toggle">
            {signup ? "Já tem uma conta?" : "Primeira vez por aqui?"}{" "}
            <button
              onClick={() => {
                setSignup(!signup);
                setError("");
              }}
            >
              {signup ? "Entrar" : "Criar conta"}
            </button>
          </p>
          {app.demo && (
            <Link className="btn btn-outline demo-entry" href="/">
              Explorar demonstração <ArrowUpRight size={16} />
            </Link>
          )}
          {app.user && (
            <Button
              variant="ghost"
              onClick={async () => {
                await supabase?.auth.signOut();
                router.push("/login/");
              }}
            >
              <LogOut size={16} /> Sair da conta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
function Onboarding() {
  const [step, setStep] = useState(1);
  const app = useApp();
  const router = useRouter();
  return (
    <div className="onboarding">
      <Link href="/" className="brand">
        <span className="brand-mark">
          <ArrowUpRight size={22} />
        </span>
        leadback.
      </Link>
      <div className="onboarding-progress">
        <span className="active">1 · Sua empresa</span>
        <i />
        <span className={step === 2 ? "active" : ""}>2 · WhatsApp</span>
      </div>
      <section className="panel">
        <span className="eyebrow">VAMOS NOS CONHECER</span>
        <h1>
          {step === 1
            ? "Cada negócio tem seu jeito."
            : "Deixe as conversas chegarem."}
        </h1>
        <p className="muted">
          {step === 1
            ? "Conte um pouco sobre sua empresa para preparar seu espaço."
            : "Conecte seu WhatsApp para encontrar as próximas oportunidades."}
        </p>
        {step === 1 ? (
          <CompanyForm onDone={() => setStep(2)} />
        ) : (
          <div className="connection-card">
            <MessageCircle size={48} />
            <h3>Seu WhatsApp, com um novo olhar.</h3>
            <p>
              Experimente uma conexão simulada com 20 contatos e conversas
              demonstrativas. A integração real será configurada posteriormente.
            </p>
            <Button
              onClick={async () => {
                if (app.demo)
                  await app.saveCompany({ whatsapp_connected: true });
                router.push("/");
              }}
            >
              {app.demo ? "Simular conexão e começar" : "Ir para o dashboard"}
              <ArrowRight size={16} />
            </Button>
            <button className="text-link" onClick={() => router.push("/")}>
              Configurar depois
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
