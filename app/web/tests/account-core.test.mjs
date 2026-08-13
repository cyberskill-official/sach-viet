import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  changeAccountPassword,
  createAccountStore,
  createAddress,
  deleteAddress,
  getAccount,
  listAddresses,
  updateAccount,
} from "../src/lib/account-core.mjs";
import { createAuthStore, hashPassword, verifyPassword } from "../src/lib/auth-core.mjs";

test("customers can update email/locale, change password, and store unused addresses", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-account-"));
  const dbPath = join(directory, "account.sqlite");
  const auth = await createAuthStore({ dbPath, log: () => {} });
  const store = await createAccountStore({ dbPath, log: () => {} });
  try {
    await auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
      .run("customer-a", "old@example.test", hashPassword("correct horse battery staple"), "customer", 1);
    const user = { id: "customer-a", role: "customer" };
    const account = await getAccount(store, user);
    assert.equal(account.email, "old@example.test");
    assert.equal(account.locale, "vi");

    const updated = await updateAccount(store, user, { email: "new@example.test", locale: "en" });
    assert.equal(updated.email, "new@example.test");
    assert.equal(updated.locale, "en");

    await changeAccountPassword(store, user, {
      currentPassword: "correct horse battery staple",
      password: "new horse battery staple",
    });
    const row = await auth.db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id);
    assert.equal(verifyPassword("new horse battery staple", row.password_hash), true);
    await assert.rejects(
      async () => await changeAccountPassword(store, user, { currentPassword: "wrong", password: "another password here" }),
      /incorrect/,
    );

    const address = await createAddress(store, user, { label: "Home", line1: "1 Book St", city: "Austin", country: "US" });
    const page = await listAddresses(store, user);
    assert.equal(page.items.length, 1);
    assert.equal(page.items[0].id, address.id);
    await deleteAddress(store, user, address.id);
    assert.equal((await listAddresses(store, user)).items.length, 0);
  } finally {
    await store.close();
    await auth.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
