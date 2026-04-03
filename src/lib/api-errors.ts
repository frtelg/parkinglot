import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { CommentNotFoundError, DeletedCommentError } from "./comments";
import { InvalidActiveItemOrderError, ItemNotFoundError } from "./items";

function getValidationMessage(error: ZodError) {
  const issue = error.issues[0];
  return issue?.message ?? "Invalid request";
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: getValidationMessage(error) }, { status: 400 });
  }

  if (error instanceof ItemNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof InvalidActiveItemOrderError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof CommentNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof DeletedCommentError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
