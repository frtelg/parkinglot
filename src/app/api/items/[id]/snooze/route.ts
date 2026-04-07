import { NextRequest, NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { snoozeParkingLotItem } from "@/lib/parking-lot";
import { snoozeItemInputSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = snoozeItemInputSchema.parse(await request.json());
    return NextResponse.json(snoozeParkingLotItem(id, payload));
  } catch (error) {
    return handleRouteError(error);
  }
}
