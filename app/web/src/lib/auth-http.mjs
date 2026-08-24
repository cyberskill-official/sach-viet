import {
  getAuthStore,
  registerCustomer,
  requestPasswordReset,
  resetPassword,
  safeRedirect,
  serializeCookie,
  verifyEmail,
} from "./auth-core.mjs";

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

function jsonError(message, status) {
  return jsonResponse({ error: message }, status);
}

export async function handleRegister(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Invalid registration request.", 400);
  try {
    const store = await getAuthStore();
    const result = await registerCustomer(store, { email: body.email, password: body.password });
    return jsonResponse({ user: result.user }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    const status = message.includes("already exists") ? 409 : message.includes("Password") || message.includes("email") ? 400 : 400;
    return jsonResponse({ error: message }, status);
  }
}

export async function handleVerifyEmail(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || (await request.json().catch(() => null))?.token;
  try {
    const store = await getAuthStore();
    const result = await verifyEmail(store, token);
    return jsonResponse({ user: result.user }, 200);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Verification failed.", 400);
  }
}

export async function handleForgotPassword(request) {
  const body = await request.json().catch(() => null);
  const store = await getAuthStore();
  await requestPasswordReset(store, body?.email);
  return jsonResponse({ accepted: true }, 200);
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
    const headers = {};
    if (result.token && result.expiresAt) {
      headers["set-cookie"] = serializeCookie(result.token, result.expiresAt);
    }
    return jsonResponse({ user: result.user, redirectTo: safeRedirect(body.redirect) }, 200, headers);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Reset failed.", 400);
  }
}
