"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Account = { id: string; email: string; role: string; locale: string; createdAt: number };
type Address = { id: string; label: string; line1: string; line2?: string | null; city: string; region?: string | null; postalCode?: string | null; country: string };

function apiMessage(body: Record<string, unknown>, fallback: string) {
  const error = body.error;
  if (error && typeof error === "object" && error !== null && "message" in error) return String((error as { message: string }).message);
  if (typeof error === "string") return error;
  return fallback;
}

async function readJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.location.assign("/login?redirect=/account");
    throw new Error("Unauthenticated.");
  }
  if (!response.ok) throw new Error(apiMessage(body, `Request failed (${response.status}).`));
  return body;
}

export function AccountPanel() {
  const [account, setAccount] = useState<Account | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [email, setEmail] = useState("");
  const [locale, setLocale] = useState("vi");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [accountBody, addressBody] = await Promise.all([
        readJson("/api/account"),
        readJson("/api/account/addresses"),
      ]);
      if (!accountBody.account) throw new Error("Account is unavailable.");
      setAccount(accountBody.account);
      setEmail(accountBody.account.email);
      setLocale(accountBody.account.locale || "vi");
      setAddresses(Array.isArray(addressBody.items) ? addressBody.items : []);
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") {
        setError(reason.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("profile");
    setError("");
    setNotice("");
    try {
      const body = await readJson("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      setAccount(body.account);
      setNotice("Đã lưu hồ sơ.");
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setBusy("");
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("password");
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await readJson("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(data.get("currentPassword") || ""),
          password: String(data.get("password") || ""),
        }),
      });
      form.reset();
      setNotice("Đã đổi mật khẩu.");
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setBusy("");
    }
  }

  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("address");
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const body = await readJson("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: String(data.get("label") || ""),
          line1: String(data.get("line1") || ""),
          line2: String(data.get("line2") || "") || undefined,
          city: String(data.get("city") || ""),
          region: String(data.get("region") || "") || undefined,
          postalCode: String(data.get("postalCode") || "") || undefined,
          country: String(data.get("country") || "US"),
        }),
      });
      form.reset();
      if (body.address) setAddresses((current) => [body.address, ...current]);
      setNotice("Đã lưu địa chỉ. Địa chỉ chưa dùng khi báo giá.");
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setBusy("");
    }
  }

  async function removeAddress(id: string) {
    setBusy(id);
    setError("");
    try {
      await readJson(`/api/account/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
      setAddresses((current) => current.filter((item) => item.id !== id));
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <Link className="text-sm text-accent-strong hover:underline" href="/">← Về cửa hàng</Link>
      <p className="cs-eyebrow mt-8 text-accent-strong">Tài khoản</p>
      <h1 className="mt-2 text-4xl font-extrabold">Hồ sơ và địa chỉ</h1>
      <p className="mt-2 text-sm text-muted">
        Địa chỉ được lưu nhưng chưa dùng khi báo giá hoặc thanh toán (interim: không ship, thuế = 0).
        Đổi trả tự phục vụ: deferred (DEC-RET) — dùng hỗ trợ nếu cần.
      </p>
      {loading ? <div className="cs-skeleton mt-8 h-40 rounded-2xl" /> : null}
      {error ? <p className="cs-alert cs-alert--danger mt-8" role="alert">{error}</p> : null}
      {notice ? <p className="cs-alert mt-8" role="status">{notice}</p> : null}

      {account ? (
        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <form className="cs-surface-standard grid gap-3 rounded-2xl p-6" onSubmit={(event) => { void saveProfile(event); }}>
            <h2 className="text-xl font-bold">Hồ sơ</h2>
            <label className="grid gap-2 text-sm">Email<input required type="email" className="cs-field__control" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="grid gap-2 text-sm">Ngôn ngữ
              <select aria-label="Locale" className="cs-field__control" value={locale} onChange={(event) => setLocale(event.target.value)}>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </label>
            <p className="text-sm text-muted">Vai trò: {account.role}</p>
            <button className="cs-button" disabled={busy === "profile"} type="submit">Lưu hồ sơ</button>
          </form>
          <form className="cs-surface-standard grid gap-3 rounded-2xl p-6" onSubmit={(event) => { void changePassword(event); }}>
            <h2 className="text-xl font-bold">Đổi mật khẩu</h2>
            <label className="grid gap-2 text-sm">Mật khẩu hiện tại<input required type="password" name="currentPassword" className="cs-field__control" autoComplete="current-password" /></label>
            <label className="grid gap-2 text-sm">Mật khẩu mới<input required type="password" name="password" className="cs-field__control" autoComplete="new-password" minLength={8} /></label>
            <button className="cs-button cs-button--secondary" disabled={busy === "password"} type="submit">Đổi mật khẩu</button>
          </form>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Địa chỉ đã lưu</h2>
        <form className="cs-surface-standard mt-4 grid gap-3 rounded-2xl p-6" onSubmit={(event) => { void addAddress(event); }}>
          <label className="grid gap-2 text-sm">Nhãn<input required name="label" className="cs-field__control" placeholder="Nhà" /></label>
          <label className="grid gap-2 text-sm">Địa chỉ<input required name="line1" className="cs-field__control" /></label>
          <label className="grid gap-2 text-sm">Dòng 2<input name="line2" className="cs-field__control" /></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2 text-sm">Thành phố<input required name="city" className="cs-field__control" /></label>
            <label className="grid gap-2 text-sm">Tỉnh / vùng<input name="region" className="cs-field__control" /></label>
            <label className="grid gap-2 text-sm">Mã bưu chính<input name="postalCode" className="cs-field__control" /></label>
          </div>
          <label className="grid gap-2 text-sm">Quốc gia<input name="country" className="cs-field__control" defaultValue="US" /></label>
          <button className="cs-button" disabled={busy === "address"} type="submit">Lưu địa chỉ</button>
        </form>
        <ul className="mt-4 grid gap-2">
          {addresses.map((address) => (
            <li key={address.id} className="cs-surface-standard flex flex-wrap items-start justify-between gap-3 rounded-xl p-4">
              <div>
                <strong>{address.label}</strong>
                <p className="mt-1 text-sm text-muted">{address.line1}{address.line2 ? `, ${address.line2}` : ""} · {address.city}</p>
              </div>
              <button className="cs-button cs-button--secondary" disabled={busy === address.id} type="button" onClick={() => { void removeAddress(address.id); }}>Xóa</button>
            </li>
          ))}
        </ul>
        {!loading && addresses.length === 0 ? <p className="mt-3 text-muted">Chưa có địa chỉ.</p> : null}
      </section>
    </main>
  );
}
