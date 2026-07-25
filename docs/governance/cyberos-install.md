# CyberOS local install pin

`.cyberos/` is a gitignored local installation, so this repository does not vendor or claim ownership of the full CyberOS payload.

The expected install identity is tracked in `cyberos-install.json`, copied from the local install's generated `manifest.yaml`:

- CyberOS version `1.1.0`
- rules fingerprint `53a6198d0111b10104a11e899a02845e203e26668f396a0abe8f8b9cfa13bf9b`
- source commit `81cf3f0`

The local `cuo/gates/run-gates.sh` was hardened to reject shell syntax and execute a plain argv array. Its expected SHA-256 is also pinned because reinstalling or updating the ignored payload can overwrite that local repair.

Run:

```bash
node app/web/scripts/check-cyberos-install.mjs
```

A mismatch fails closed. Review a CyberOS update and its gate runner before updating the tracked pin; do not copy the complete `.cyberos` tree into Git. CI uses `--if-present` because clean GitHub runners do not contain the ignored local install.
