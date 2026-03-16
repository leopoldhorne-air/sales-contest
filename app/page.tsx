import { getDeals, getFirstCanvas } from "@/lib/store";
import SalesContest from "@/components/SalesContest";

export default async function Home() {
  const [deals, firstCanvas] = await Promise.all([getDeals(), getFirstCanvas()]);
  return <SalesContest initialDeals={deals} initialFirstCanvas={firstCanvas} />;
}
