import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import {
  createAuthorManuscriptRequest,
  createAuthorPortalStore,
  listAuthorManuscriptRequests,
} from "@/lib/author-portal-core.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const authorId = new URL(request.url).searchParams.get("authorId") || undefined;
    const store = createAuthorPortalStore();
    try {
      return NextResponse.json({
        manuscriptRequests: listAuthorManuscriptRequests(store, session.user, { authorId }),
      });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Manuscript requests are unavailable." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createAuthorPortalStore();
    try {
      return NextResponse.json(
        { manuscriptRequest: createAuthorManuscriptRequest(store, session.user, await request.json()) },
        { status: 201 },
      );
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Manuscript request could not be created." },
      { status: 403 },
    );
  }
}
