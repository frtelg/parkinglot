import { NextRequest, NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { createParkingLotItem, listParkingLotItems } from "@/lib/parking-lot";
import { createItemInputSchema, itemViewSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const view = itemViewSchema.parse(request.nextUrl.searchParams.get("view") ?? "active");
    return NextResponse.json(listParkingLotItems(view));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = createItemInputSchema.parse(await request.json());
    return NextResponse.json(createParkingLotItem(payload), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
