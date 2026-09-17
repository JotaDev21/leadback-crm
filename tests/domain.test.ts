import test from "node:test";
import assert from "node:assert/strict";
import { createDemo } from "../lib/demo";
import { mockIntelligence, cancelFutureFollowups } from "../lib/classifier";
import { maySendFollowup } from "../lib/integrations/whatsapp";
test("dataset contains complete linked conversations and minimum requested volume", () => {
  const d = createDemo();
  assert.equal(d.contacts.length, 20);
  assert.ok(d.messages.length >= 50);
  assert.ok(d.opportunities.length >= 10);
  assert.ok(d.followups.length >= 8);
  for (const m of d.messages)
    assert.ok(d.contacts.some((c) => c.id === m.contact_id));
  for (const o of d.opportunities) {
    assert.ok(o.score >= 0 && o.score <= 100);
    assert.ok(d.contacts.some((c) => c.id === o.contact_id));
  }
});
test("classifier gives purchase intent priority", async () => {
  const d = createDemo();
  const result = await mockIntelligence.analyze(
    d.messages.filter((m) => m.contact_id === "contact-0"),
    "Mariana Costa",
    1500,
  );
  assert.equal(result.category, "hot_lead");
  assert.equal(result.score, 91);
  assert.match(result.suggested_followup, /Mariana/);
});
test("unanswered inbound messages need a company response", async () => {
  const result = await mockIntelligence.analyze(
    [
      {
        id: "m",
        contact_id: "c",
        company_id: "a",
        conversation_id: "v",
        direction: "inbound",
        body: "Pode me explicar como funciona?",
        created_at: new Date().toISOString(),
      },
    ],
    "João",
    500,
  );
  assert.equal(result.category, "awaiting_reply");
});
test("reply cancels future jobs of its contact without touching other contacts or sent jobs", () => {
  const jobs = [
    {
      contact_id: "a",
      status: "scheduled",
      scheduled_at: "2030-01-02T00:00:00Z",
    },
    {
      contact_id: "b",
      status: "scheduled",
      scheduled_at: "2030-01-02T00:00:00Z",
    },
    { contact_id: "a", status: "sent", scheduled_at: "2030-01-02T00:00:00Z" },
  ];
  const result = cancelFutureFollowups(jobs, "a", "2030-01-01T00:00:00Z");
  assert.deepEqual(
    result.map((x) => x.status),
    ["cancelled", "scheduled", "sent"],
  );
  assert.equal(jobs[0].status, "scheduled");
});
test("dispatch blocks cancelled, future, and replied jobs", () => {
  const job = {
    status: "scheduled",
    scheduled_at: "2030-01-02T00:00:00Z",
    created_at: "2030-01-01T00:00:00Z",
  };
  const now = new Date("2030-01-03T00:00:00Z");
  assert.equal(maySendFollowup(job, null, now), true);
  assert.equal(maySendFollowup(job, "2030-01-02T01:00:00Z", now), false);
  assert.equal(
    maySendFollowup({ ...job, status: "cancelled" }, null, now),
    false,
  );
  assert.equal(maySendFollowup(job, null, new Date("2029-01-01")), false);
});
