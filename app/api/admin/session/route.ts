import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminSession";

export async function GET() {
  return NextResponse.json({ isAdmin: await isAdminRequest() });
}
