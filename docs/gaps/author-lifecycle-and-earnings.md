# Author lifecycle and earnings gap

## Result

The current checkout cannot safely add an author manuscript lifecycle or earnings view. The handoff documents manuscript submission, `PublishingRequest`, `PublishingRequestLog` stage history, and mocked author dashboard stages and earnings. The active royalty policy proposal has no owner-accepted financial rule. This checkout has no `app/` source tree, author scope relation, request-log query or view path, stage taxonomy, earned-fact contract, authorization source, test suite, synthetic fixture, or approved non-production route.

## Evidence

- `docs/03-portals.md:56-58` documents manuscript submission, request list and detail pages, a log trail, and mocked stages and earnings.
- `docs/05-data-model.md:49-52` documents `PublishingRequest` and its `PublishingRequestLog` stage history.
- `docs/07-status-roadmap.md:25,32` states that author dashboard work is blocked on the royalty and earnings decision.
- `docs/royalty/royalty-policy-proposal-v0.1.md:5-6,25-38` records a proposal with unresolved financial rules and no activation.
- `docs/README.md:21-23` prohibits local application execution and committed secrets.

## Recorded gaps

| Required boundary | Current state | Safe next action |
| --- | --- | --- |
| Author source and request-log path | No `app/` source tree, author request controller, query, detail view, or log renderer is present. | Obtain authorized source read access before naming a display target. |
| Author authorization and request ownership | The handoff does not establish the query scope, ownership policy, or authorization rule that isolates one author's request history. | Obtain source-confirmed authorization and ownership behavior before rendering history. |
| Lifecycle stage taxonomy and transition rules | A request-log stage history is documented, but no stage labels, transitions, actors, rights, or mutation rules are established. | Obtain source-confirmed lifecycle rules before displaying a named stage or creating a transition. |
| Earned-fact and royalty-policy contract | The royalty proposal has no owner-accepted financial rule, and no source relates an author, request, sale, order item, contract, or earned fact. | Obtain an owner-accepted policy and source-confirmed earned-fact contract before displaying financial data. |
| Test entry points and safe fixture | No package manifest, test configuration, synthetic author, request, log, or earnings fixture convention is present. | Obtain source-confirmed test commands and an approved non-production fixture contract. |
| Approved non-production verification route | The task must not run locally or use a live author or administrative session, and no preview route or owner-approved test access is available. | Obtain an approved non-production route before recording an author-view result. |

## Scope outcome

No author view, request-log view, stage, transition, right, earnings fact, calculation, payout, payment instruction, authorization behavior, credential, administrative session, or application behavior was changed, and no result was claimed. This record does not invent a stage, transition, role rule, ownership policy, endpoint, query, test command, fixture, account, credential, preview result, financial rule, or payment behavior. It does not use production data, a live author or administrative session, a local application session, or credentials in task artefacts.
