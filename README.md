# LeadBack CRM

Protótipo de um painel comercial para acompanhar conversas e organizar retornos. A demo permite percorrer o fluxo de uma oportunidade, desde a leitura da conversa até o registro de uma recuperação.

[Abrir a demonstração no navegador](https://jotadev21-portfolio.comettitan7.chatgpt.site/demos/leadback/)

## Como testar a demo

1. Abra **Oportunidades** e selecione Mariana Costa.
2. Leia a conversa, gere um follow-up, edite o texto e agende um retorno.
3. Use **Simular envio** para registrar uma mensagem e criar uma sequência de retornos.
4. Use **Simular resposta do cliente** para cancelar os retornos pendentes.
5. Marque a oportunidade como recuperada e confira o resultado na lista **Recuperadas**.

Os contatos e as conversas são fictícios. A demo guarda as mudanças em memória. A conexão com WhatsApp e os envios são simulados. A sugestão de texto e a classificação seguem regras locais, sem chamadas a um modelo de IA. O modo de demonstração oferece uma ferramenta de leitura WebMCP em navegadores compatíveis para listar as oportunidades fictícias.

## Rode localmente

Com Node.js 22 ou superior e npm, execute os comandos na raiz do projeto.

```sh
npm ci
npm run dev
```

Abra `http://127.0.0.1:3000`. O modo de demonstração funciona sem configurar variáveis de ambiente.

```sh
npm test
npm run build
```

Os testes cobrem os dados de demonstração, a classificação e as regras de follow-up. O build gera o site estático em `out/`.

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `app/` | Rotas, estilos e layout da aplicação Next.js. |
| `components/` | Telas em React, componentes de interface e estado da aplicação. |
| `lib/` | Tipos TypeScript, dados fictícios, regras de classificação e agendamento, e interface do provedor de WhatsApp. |
| `supabase/migrations/` | Esquema PostgreSQL, políticas de acesso por empresa e gatilho para cancelar retornos após uma resposta. |
| `tests/` | Testes de domínio e roteiro de navegação da demo. |

## Ambiente de teste com Supabase

Para explorar cadastro, login e persistência, crie um projeto de teste no Supabase e aplique `supabase/migrations/001_initial.sql` em um banco vazio. Configure as URLs autorizadas e a confirmação de e-mail no Supabase Auth. Copie `.env.example` para `.env.local`, informe a URL do projeto e a chave pública `anon`, depois reinicie o aplicativo. Mantenha chaves privilegiadas fora do frontend. O cadastro cria uma empresa com dados inicialmente vazios.

O projeto inclui a estrutura para isolar dados por empresa. A configuração do banco e as políticas de acesso precisam ser validadas com contas de empresas diferentes antes de receber dados reais. A integração com WhatsApp Business, o processamento automático de envios e a cobrança permanecem pendentes.
