import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json(null);
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
