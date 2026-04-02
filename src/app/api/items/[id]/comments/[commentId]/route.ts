import { NextRequest, NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { deleteParkingLotComment, updateParkingLotComment } from "@/lib/parking-lot";
import { updateCommentInputSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string; commentId: string }>;
};

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, commentId } = await context.params;
    const payload = updateCommentInputSchema.parse(await request.json());

    return NextResponse.json(updateParkingLotComment(id, commentId, payload));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id, commentId } = await context.params;
    return NextResponse.json(deleteParkingLotComment(id, commentId));
  } catch (error) {
    return handleRouteError(error);
  }
}
