import { redirect } from "next/navigation";

// The single-signal Pulse Card demo has been superseded by the Daily Pulse experience.
// Its PulseCard component lives on inside the Detailed Breakdown format.
export default function PulseCardDemoPage() {
  redirect("/daily");
}
