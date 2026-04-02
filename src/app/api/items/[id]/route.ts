import { NextRequest, NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { getParkingLotItemDetail, updateParkingLotItem } from "@/lib/parking-lot";
import { updateItemInputSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return NextResponse.json(getParkingLotItemDetail(id));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = updateItemInputSchema.parse(await request.json());
    return NextResponse.json(updateParkingLotItem(id, payload));
  } catch (error) {
    return handleRouteError(error);
  }
}
