import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  getAuthStore,
  registerCustomer,
  requestPasswordReset,
  resetPassword,
  safeRedirect,
  sessionCookieOptions,
  verifyEmail,
} from "./auth-core.mjs";

function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}

export async function handleRegister(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Invalid registration request.", 400);
  try {
    const store = await getAuthStore();
    const result = await registerCustomer(store, { email: body.email, password: body.password });
    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    const status = message.includes("already exists") ? 409 : message.includes("Password") || message.includes("email") ? 400 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function handleVerifyEmail(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || (await request.json().catch(() => null))?.token;
  try {
    const store = await getAuthStore();
    const result = await verifyEmail(store, token);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Verification failed.", 400);
  }
}

export async function handleForgotPassword(request) {
  const body = await request.json().catch(() => null);
  const store = await getAuthStore();
  await requestPasswordReset(store, body?.email);
  return NextResponse.json({ accepted: true });
}

export async function handleResetPassword(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Invalid reset request.", 400);
  try {
    const store = await getAuthStore();
    const result = await resetPassword(store, {
      token: body.token,
      password: body.password,
      sessionSecret: process.env.AUTH_SESSION_SECRET,
    });
    const response = NextResponse.json({ user: result.user, redirectTo: safeRedirect(body.redirect) });
    if (result.token && result.expiresAt) {
      response.cookies.set(COOKIE_NAME, result.token, sessionCookieOptions(result.expiresAt));
    }
    return response;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Reset failed.", 400);
  }
}
