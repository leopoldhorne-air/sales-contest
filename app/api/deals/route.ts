import { NextResponse } from "next/server";
import { getDeals, saveDeals, getFirstCanvas, saveFirstCanvas } from "@/lib/store";
import type { Deal } from "@/lib/types";

export async function GET() {
  const [deals, firstCanvas] = await Promise.all([getDeals(), getFirstCanvas()]);
  return NextResponse.json({ deals, firstCanvas });
}

export async function POST(request: Request) {
  const deal: Deal = await request.json();
  const [deals, firstCanvas] = await Promise.all([getDeals(), getFirstCanvas()]);

  const newDeals = [...deals, deal];

  // Track first_canvas milestone
  if (deal.actions.includes("first_canvas") && !firstCanvas[deal.rep]) {
    firstCanvas[deal.rep] = true;
    await saveFirstCanvas(firstCanvas);
  }

  await saveDeals(newDeals);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id }: { id: string } = await request.json();
  const deals = await getDeals();
  await saveDeals(deals.filter((d) => d.id !== id));
  return NextResponse.json({ success: true });
}
