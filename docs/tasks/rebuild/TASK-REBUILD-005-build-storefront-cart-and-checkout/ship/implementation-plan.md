# Implementation plan

1. Add a client-side cart persisted in browser storage.
2. Add SQLite orders and order items that snapshot server-validated offers.
3. Add Stripe-hosted checkout session creation from environment variables.
4. Verify signed Stripe completion events before changing payment state.
5. Add customer order reads, tests, verifier checks, and build evidence.
