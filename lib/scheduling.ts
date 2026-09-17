import { Company } from "./types";
/** Demo scheduler uses the browser's local timezone. Production worker needs an explicit company timezone. */
export function nextBusinessTime(
  base: Date,
  delayHours: number,
  company: Pick<Company, "business_start" | "business_end">,
) {
  const date = new Date(base.getTime() + delayHours * 3600000);
  const [oh, om] = company.business_start.split(":").map(Number);
  const [ch, cm] = company.business_end.split(":").map(Number);
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes < oh * 60 + om) date.setHours(oh, om, 0, 0);
  else if (minutes >= ch * 60 + cm) {
    date.setDate(date.getDate() + 1);
    date.setHours(oh, om, 0, 0);
  }
  return date.toISOString();
}
