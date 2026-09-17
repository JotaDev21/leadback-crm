import { Workspace } from "@/components/workspace";
export function generateStaticParams() {
  return [
    "oportunidades",
    "followups",
    "analytics",
    "configuracoes",
    "login",
    "onboarding",
  ].map((section) => ({ section }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  return <Workspace section={(await params).section} />;
}
