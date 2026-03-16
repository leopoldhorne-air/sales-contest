import { getDeals, getFirstCanvas, getTotalARR } from "@/lib/store";
import SalesContest from "@/components/SalesContest";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [deals, firstCanvas, arrSnapshot] = await Promise.all([getDeals(), getFirstCanvas(), getTotalARR()]);
  return (
    <SalesContest
      initialDeals={deals}
      initialFirstCanvas={firstCanvas}
      initialTotalARR={arrSnapshot.value}
      initialTotalARRUpdatedAt={arrSnapshot.updatedAt}
    />
  );
}
