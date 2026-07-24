# Transport decision

Authenticated Server-Sent Events over Next.js route handlers is the greenfield live-notification transport.

Rejected for this task:

- Laravel Reverb — legacy PHP stack, not the active Next.js rebuild
- Pusher / paid push providers — owner credential and spend blockers
- Poll-only primary delivery — Task 10 already covers pull reads; source upgrades to live push for the bell
- Email / Zalo / SMS — deferred to TASK-REBUILD-019
