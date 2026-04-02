import { NextRequest, NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { unarchiveParkingLotItem } from "@/lib/parking-lot";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    return NextResponse.json(unarchiveParkingLotItem(id));
  } catch (error) {
    return handleRouteError(error);
  }
}
