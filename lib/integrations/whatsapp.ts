/** Server-side boundary. No access token is ever stored in the browser. */
export interface WhatsAppProvider {
  send(input: {
    companyId: string;
    contactId: string;
    text: string;
    idempotencyKey: string;
  }): Promise<{ providerId: string; sentAt: string }>;
  verifyWebhook(rawBody: string, signature: string): Promise<boolean>;
}
export class UnconfiguredWhatsAppProvider implements WhatsAppProvider {
  async send(): Promise<never> {
    throw new Error(
      "Configure um provedor oficial de WhatsApp antes de ativar os envios.",
    );
  }
  async verifyWebhook() {
    return false;
  }
}
/** Worker must re-check these guards immediately before dispatching a claimed job. */
export function maySendFollowup(
  job: { status: string; scheduled_at: string; created_at: string },
  latestInboundAt: string | null,
  now: Date,
) {
  return (
    job.status === "scheduled" &&
    new Date(job.scheduled_at) <= now &&
    (!latestInboundAt || new Date(latestInboundAt) < new Date(job.created_at))
  );
}
