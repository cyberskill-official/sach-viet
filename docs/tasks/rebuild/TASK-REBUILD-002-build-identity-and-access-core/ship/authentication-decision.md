# Authentication implementation decision

The rebuild uses email and password credentials in the single full-stack Next.js application. The user approved recommended defaults after selecting Next.js. SQLite is the local user and session store, and Node.js built-in cryptographic functions protect passwords and sign opaque session cookies.

The first administrator is created only when an authorized deployment supplies `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD_HASH`, and `AUTH_SESSION_SECRET`. This repository contains neither their values nor a live administrator. External identity providers, email delivery, and WordPress password migration remain outside this task.
