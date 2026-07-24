# Observability

Prepare emits JSON lifecycle events: `preview_release_prepare_started`, `preview_release_prepare_completed`, `preview_release_prepare_failed`, and CLI `prepare_preview_release_result`. Events carry outcome, target, credentials_present, and deployed=false. No secrets or token values are logged.
