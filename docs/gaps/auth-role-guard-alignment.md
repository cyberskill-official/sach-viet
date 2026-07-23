# Authorization role-guard alignment gap

## Result

The current checkout cannot safely implement or verify the documented `super_admin` to `admin` alias. The handoff documents a single-role model, states that `super_admin` should be treated as admin, lists frontend and API guard families, and requires preservation of the Sanctum and httpOnly-cookie authentication flow. This checkout has no `app/` source tree, role helper, frontend middleware, API route middleware, policy source, test suite, synthetic role fixture, security-review evidence, or approved non-production verification route.

## Evidence

- `docs/04-roles-permissions.md:5,26-29` documents the single-role model and says to treat `super_admin` as admin.
- `docs/04-roles-permissions.md:31-62` documents frontend and API guard families and their current role lists.
- `docs/04-roles-permissions.md:66-80` documents the Sanctum bearer-token, httpOnly-cookie proxy, login throttle, HMAC internal API, and sensitive-mutation audit boundaries.
- `docs/06-tech-stack.md:24-27` advises retaining the Nuxt and Laravel split and the single-role authorization model.
- `docs/README.md:21-23` prohibits local application execution and committed secrets.

## Recorded gaps

| Required boundary | Current state | Safe next action |
| --- | --- | --- |
| Guard implementation and role-helper paths | No `app/` source tree, frontend middleware, API route file, role helper, policy, or guard test is present. | Obtain authorized source read access before naming a code target. |
| Frontend guard behavior | The handoff lists frontend guard roles and redirects but does not provide implementation, guard order, login-route bypass logic, or denial behavior source. | Obtain source-confirmed frontend guard behavior before changing a role list. |
| API guard behavior | The handoff lists API route role middleware but does not provide route registration, middleware expansion, policy interaction, or denial response source. | Obtain source-confirmed API guard behavior before changing authorization. |
| Alias and security-conflict semantics | Documentation says to treat `super_admin` as admin, but no source establishes whether an implementation gives the role distinct security or business semantics. | Obtain source-confirmed role semantics and record a security review before applying any alias. |
| Test entry points and safe role fixture | No package manifest, test configuration, PHPUnit configuration, synthetic role fixture, or guard-test convention is present. | Obtain source-confirmed test commands and an approved non-production fixture contract. |
| Approved non-production verification route | The task must not run locally or use a live administrative session, and no preview route or owner-approved test access is available. | Obtain an approved non-production route before recording an authorization result. |

## Scope outcome

No authorization code, guard, role assignment, policy, redirect, token behavior, cookie behavior, login behavior, public-route behavior, credential, administrative session, or application behavior was changed, and no security review or regression result was claimed. This record does not invent a role helper, guard order, endpoint, middleware behavior, denial response, test command, fixture, account, credential, preview result, or security approval. It does not use production data, a live administrative session, a local application session, or credentials in task artefacts.
