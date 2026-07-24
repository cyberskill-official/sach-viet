# Observability injection

Structured events:

- `live_notification_published` on successful create fan-out
- `live_notification_stream_opened` with resume and replay counts
- `live_notification_stream_closed` with abort/cancel/fail reason
- `live_notification_stream_failed` on stream setup errors

Payloads omit session tokens, emails, request bodies, and payment secrets.
