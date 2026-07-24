# Channel adapter decision

Email and Zalo use closed transport adapter interfaces.

- Default: recording stubs (no network, CI-safe).
- Optional email seam: vendor-agnostic SMTP when `SMTP_HOST` and `SMTP_FROM` are present; no Resend/SendGrid/Mailgun SDK lock-in.
- Optional Zalo seam: Official Account mode when `ZALO_OA_ACCESS_TOKEN` is present.
- Live network submitters are injectable for tests/deployments; absent submitters record locally.

This avoids an irreversible paid email SaaS platform choice while still naming Zalo OA as the source-documented chat channel.
