const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1512, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3000");
  await page.getByText("Boas conversas merecem continuar.").waitFor();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  await page.getByRole("link", { name: "Explorar oportunidades" }).click();
  await page.getByPlaceholder("Buscar nome ou telefone").fill("Mariana");
  await page.getByRole("button", { name: /Mariana Costa.*55/ }).click();
  await page
    .getByRole("button", { name: "Gerar follow-up", exact: true })
    .click();
  assert.match(
    await page.getByLabel("Mensagem de follow-up").inputValue(),
    /Mariana/,
  );
  await page.getByRole("button", { name: "Agendar", exact: true }).click();
  const future = new Date(Date.now() + 86400000 * 3);
  future.setMinutes(future.getMinutes() - future.getTimezoneOffset());
  await page
    .locator("input[type=datetime-local]")
    .fill(future.toISOString().slice(0, 16));
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await page.getByText("Follow-up agendado na demonstração.").waitFor();
  await page.getByRole('button',{name:'Gerar follow-up',exact:true}).click();
  await page.getByRole('button',{name:'Simular envio',exact:true}).click();
  await page.getByText('Envio simulado. A sequência ativa foi agendada, sem mensagens reais.').waitFor();
  await page
    .getByRole("button", { name: "Simular resposta do cliente" })
    .click();
  await page
    .getByText("Resposta recebida. Os follow-ups pendentes foram cancelados.")
    .waitFor();
  await page.screenshot({ path: "test-results/lead.png", fullPage: true });
  await page.getByRole("button", { name: "Marcar como recuperada" }).click();
  await page.getByRole("button", { name: "Recuperadas", exact: true }).click();
  await page.getByRole("button", { name: /Mariana Costa.*55/ }).waitFor();
  await page.getByRole("link", { name: "Follow-ups", exact: true }).click();
  await page.getByRole("button", { name: /Cancelados/ }).click();
  await page.getByText("Mariana Costa").first().waitFor();
  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await page.getByText("Cada retorno conta.").waitFor();
  await page.getByRole("link", { name: "Configurações", exact: true }).click();
  await page.getByLabel("Nome da empresa").fill("Forma Studio");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page.getByText("Informações da empresa salvas.").waitFor();
  await page.goto("http://127.0.0.1:3000/login/");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByText("Seu próximo capítulo começa aqui.").waitFor();
  await page.goto("http://127.0.0.1:3000/onboarding/");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Simular conexão e começar" }).click();
  await page.getByText("Boas conversas merecem continuar.").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .getByRole("link", { name: /Oportunidades/ })
    .first()
    .click();
  await page.getByText("O próximo negócio já te conhece.").waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  const supported = await page.evaluate(() => !!document.modelContext);
  console.log(
    JSON.stringify({
      browserErrors: errors,
      webmcp: supported ? "supported" : "unavailable",
      flows:
        "dashboard, filter, generate, schedule, reply cancellation, recover, follow-ups, analytics, settings, auth, onboarding, mobile passed",
    }),
  );
  assert.deepEqual(errors, []);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
