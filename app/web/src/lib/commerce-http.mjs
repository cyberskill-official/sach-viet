import { COOKIE_NAME, getAuthStore, readSession } from "./auth-core.mjs";
import {
  assertPayPalSandboxMode,
  assertSandboxPaymentsOnly,
  assertStripeTestSecret,
  createCommerceStore,
  createPayPalCheckoutOrder,
  createPendingOrder,
  createSandboxStubCheckout,
  createStripeCheckoutSession,
  normalizeCheckoutProvider,
  quoteRetailCart,
  sandboxCheckoutStubEnabled,
} from "./commerce-core.mjs";
import { commerceMutationsDisabledMessage, commerceMutationsEnabled } from "./commerce-kill-switch.mjs";
import { isUniqueViolationError } from "./db.mjs";

function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}

function assertProviderConfigured(provider, environment = process.env) {
  if (provider === "paypal") {
    assertPayPalSandboxMode(environment);
    if (!environment.PAYPAL_CLIENT_ID || !environment.PAYPAL_CLIENT_SECRET || !environment.PAYPAL_RETURN_URL || !environment.PAYPAL_CANCEL_URL) {
      throw new Error("PayPal checkout is not configured.");
    }
    return;
  }
  if (!environment.STRIPE_SECRET_KEY || !environment.STRIPE_SUCCESS_URL || !environment.STRIPE_CANCEL_URL) {
    throw new Error("Stripe checkout is not configured.");
  }
  assertStripeTestSecret(environment.STRIPE_SECRET_KEY);
}

/**
 * POST /api/quote — server retail quote (USD, tax 0, shipping 0). Read-only; no auth required.
 */
export async function handleQuote(request) {
  const body = await request.json().catch(() => null);
  const store = await createCommerceStore();
  try {
    const quote = await quoteRetailCart(store, body?.items);
    return Response.json({ quote }, { status: 200 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Quote failed.", 400);
  } finally {
    await store.close();
  }
}

export async function handleCheckout(request, environment = process.env) {
  if (!commerceMutationsEnabled(environment)) {
    return jsonError(commerceMutationsDisabledMessage(), 503);
  }

  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  let session;
  try {
    session = await readSession(await getAuthStore(), token, environment.AUTH_SESSION_SECRET);
  } catch {
    return jsonError("Authentication is not configured.", 503);
  }
  if (!session) return jsonError("Unauthenticated.", 401);

  const body = await request.json().catch(() => null);
  let provider;
  try {
    const stubEnabled = sandboxCheckoutStubEnabled(environment);
    provider = normalizeCheckoutProvider(body?.provider, { allowStub: stubEnabled });
    if (provider === "stub") {
      assertSandboxPaymentsOnly(environment);
    } else {
      assertProviderConfigured(provider, environment);
    }
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Checkout is not configured.", 400);
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || null;
  const store = await createCommerceStore();
  try {
    if (idempotencyKey) {
      const existing = await store.db
        .prepare("SELECT response_json AS responseJson FROM checkout_idempotency WHERE key = ? AND user_id = ?")
        .get(idempotencyKey, session.user.id);
      if (existing?.responseJson) {
        return Response.json(JSON.parse(existing.responseJson), { status: 201 });
      }
    }

    const order = await createPendingOrder(store, session.user, body?.items);
    const checkout =
      provider === "stub"
        ? await createSandboxStubCheckout(store, order.id, environment)
        : provider === "paypal"
          ? await createPayPalCheckoutOrder(store, order.id, environment)
          : await createStripeCheckoutSession(store, order.id, environment);
    const payload = {
      order,
      checkout,
      quote: {
        currency: order.currency,
        subtotalUsd: order.subtotalUsd,
        taxUsd: order.taxUsd,
        shippingUsd: order.shippingUsd,
        totalUsd: order.totalUsd,
        reservationTtlMs: order.reservationTtlMs,
        policy: order.policy,
      },
    };
    if (idempotencyKey) {
      try {
        await store.db
          .prepare(
            "INSERT INTO checkout_idempotency (key, user_id, response_json, created_at) VALUES (?, ?, ?, ?)",
          )
          .run(idempotencyKey, session.user.id, JSON.stringify(payload), store.clock());
      } catch (error) {
        if (isUniqueViolationError(error)) {
          const raced = await store.db
            .prepare("SELECT response_json AS responseJson FROM checkout_idempotency WHERE key = ? AND user_id = ?")
            .get(idempotencyKey, session.user.id);
          if (raced?.responseJson) return Response.json(JSON.parse(raced.responseJson), { status: 201 });
        } else {
          throw error;
        }
      }
    }
    return Response.json(payload, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Checkout failed.", 400);
  } finally {
    await store.close();
  }
}
