import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  (await cookies()).delete("ml_session");
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
