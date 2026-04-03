import { NextRequest, NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { reorderParkingLotActiveItems } from "@/lib/parking-lot";
import { reorderActiveItemsInputSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = reorderActiveItemsInputSchema.parse(await request.json());
    return NextResponse.json(reorderParkingLotActiveItems(payload));
  } catch (error) {
    return handleRouteError(error);
  }
}
