# Search backend decision

Decision: ship a **local Vietnamese-aware SearchBackend** as the platform default. Optionally resolve an env-gated Meilisearch HTTP seam when `MEILI_HOST` is present (injected submitter; no network in CI). Do **not** lock Algolia/Typesense Cloud/Elasticsearch Cloud or require CapRover Meilisearch for gates.

Rationale: tech-stack names Meilisearch as a trigger-gated self-host upgrade and lists timing/analyzer as open discussion. Greenfield CI must stay service-free. Standing orders forbid inventing paid SaaS lock-in. Local folding + light typo tolerance satisfies the storefront Vietnamese-diacritic need without an irreversible vendor choice.

Related on_hold left untouched: `TASK-SEARCH-001`.
