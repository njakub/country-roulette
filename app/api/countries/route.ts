import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

const KEY = (id: string) => `country-roulette:${id}`;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ countries: [] });

  const countries = (await redis.get<string[]>(KEY(id))) ?? [];
  return NextResponse.json({ countries });
}

export async function POST(req: NextRequest) {
  const { id, countries } = await req.json();
  if (!id) return NextResponse.json({ error: "No id" }, { status: 400 });

  await redis.set(KEY(id), countries);
  return NextResponse.json({ ok: true });
}
