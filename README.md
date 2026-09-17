# LeadBack

MVP em Next.js App Router, React, TypeScript, Tailwind CSS e componentes no padrão shadcn/ui (Radix, CVA). Interface pt-BR, desktop-first e responsiva.

## Executar

Node.js 22+: `npm install`, `npm run dev`. Verificações: `npm test` e `npm run build`. O build gera `out/` para hospedagem estática. As rotas `/`, `/oportunidades/`, `/followups/`, `/analytics/`, `/configuracoes/`, `/login/` e `/onboarding/` são exportadas.

## Demonstração

Sem configuração Supabase, o produto abre em modo demonstrativo: 20 contatos, 60 mensagens, 16 oportunidades e 8 follow-ups. Todos os dados são fictícios. Alterações ficam em memória durante a sessão e não são persistidas. O modo é indicado na interface. Envios e conexão WhatsApp são simulações. A classificação é uma função mock determinística substituível por `IntelligenceProvider`. Nenhum segredo ou mensagem real é usado.

Fluxo: abra Oportunidades, selecione um lead, confira a conversa, gere/edite uma mensagem, agende um retorno. “Simular envio” registra a mensagem no histórico e cria uma sequência de retornos conforme as regras ativas, respeitando o expediente no fuso do navegador. “Simular resposta” adiciona uma mensagem recebida e cancela os agendamentos pendentes. “Marcar como recuperada” atualiza dashboard e analytics. Não existe disparador automático de mensagens reais ativo na demonstração.

## Supabase / PostgreSQL / Auth

1. Crie um projeto Supabase e aplique `supabase/migrations/001_initial.sql` uma vez em um banco novo.
2. Configure a confirmação de e-mail e as URLs autorizadas do projeto Auth.
3. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave pública, nunca service role).
4. Reinicie ou reconstrua o app. Login/cadastro passam a usar Supabase Auth; o cadastro cria automaticamente empresa, perfil, regras e registro de assinatura inativa. Contatos reais começam vazios. Dados demonstrativos não são importados no banco.
5. O frontend passa a ler/gravar a empresa do usuário autenticado. Políticas RLS isolam empresas e impedem que clientes alterem sua própria associação. Chaves compostas impedem referências cruzadas entre empresas. Somente proprietários editam empresa/regras.

Não foram fornecidas credenciais neste trabalho: banco remoto, envio de e-mail e RLS em um Supabase real ainda precisam de validação antes de uso com clientes. Não existe fluxo de convite de equipe no MVP.

## Fronteiras para as integrações

- `lib/classifier.ts`: contrato `IntelligenceProvider` e implementação mock. Uma função server-side pode implementar esse contrato para OpenAI ou outro modelo. Validar o JSON de saída, limitar tamanho de conversa e manter chaves no servidor.
- `lib/integrations/whatsapp.ts`: contrato de provedor e guarda de envio. O provedor não configurado sempre falha de forma explícita.
- Webhook futuro: validar assinatura sobre corpo bruto, resolver empresa por conexão verificada no servidor, deduplicar pelo `provider_id`, gravar mensagens/conversas com service role somente no servidor. O trigger SQL cancela follow-ups não enviados na mesma transação de uma resposta.
- Processador futuro: consultar jobs vencidos, obter lock/claim transacional, reler última resposta e status, respeitar janela comercial/fuso da empresa, aplicar idempotência e backoff, e atualizar `sent_at` somente após confirmação do provedor. A criação de sequências é simulada no frontend; o worker e a criação de sequências server-side ainda não estão ativados.
- WhatsApp Business: o adaptador real deve tratar mensagens modelo e regras aplicáveis ao tipo de envio. Nunca marcar conectado ou enviado antes da confirmação do provedor.
- Assinaturas: estrutura de dados preparada, sem gateway de pagamentos ou cobrança ativa.

## Organização

`app/`: rotas e tema. `components/`: telas, estado/repositório e UI acessível. `lib/`: domínio, dados demo e integrações. `supabase/migrations/`: esquema, segurança e triggers. `tests/`: volume/relacionamentos do mock, classificação e regras de cancelamento/dispatch.

Um WebMCP opcional de leitura (`list_opportunities`) é registrado quando o navegador oferece `document.modelContext`; navegadores comuns não precisam desse recurso.
