import { serialize } from "cookie";
import {NextRequest, NextResponse} from "next/server";

export const runtime = "edge"

export async function POST(request: NextRequest) {
  const data: { password: string } = await request.json();
  const password = data.password;
  const cookie = serialize(process.env.NEXT_PUBLIC_PASSWORD_COOKIE_NAME!, "true",
  {
    httpOnly: true,
      path: "/",
  });

  if (process.env.NEXT_PUBLIC_PAGE_PASSWORD !== password) {
    return new NextResponse("incorrect password", {
      status: 401,
    });
  }

  return new NextResponse("password correct", {
    status: 200,
    headers: {
      "Set-Cookie": cookie,
    },
  });
}
