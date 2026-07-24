# Next.js architecture decision

On 2026-07-24, the operator selected a single full-stack Next.js application for the greenfield rebuild.

This replaces the preliminary Nuxt frontend and Laravel API direction. The application boundary is `app/web`; there is no separate `app/api` package in this foundation.

The decision does not authorize a deployment, push, credential change, access to the inherited system, or reuse of legacy application code.
