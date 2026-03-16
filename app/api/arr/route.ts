import { NextResponse } from "next/server";
import { setTotalARR, getTotalARR } from "@/lib/store";

export async function GET() {
  const { value, updatedAt } = await getTotalARR();
  return NextResponse.json({ totalARR: value, totalARRUpdatedAt: updatedAt });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Zapier sends aggregates concatenated e.g. "158195,27" (sum, count)
    // We only want the first value — the ARR sum
    const raw = String(body.totalARR ?? "0");
    const totalARR = parseInt(raw.split(",")[0].replace(/[^0-9]/g, ""), 10);

    if (isNaN(totalARR)) {
      return NextResponse.json(
        { error: "invalid_value", message: "totalARR could not be parsed as a number" },
        { status: 400 }
      );
    }

    await setTotalARR(totalARR);
    const now = new Date().toISOString();
    return NextResponse.json({ success: true, totalARR, updatedAt: now });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}
