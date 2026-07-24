# Observability injection

Emit structured JSON logs with `task_id: TASK-REBUILD-010` for:

- `notification_created` / `notification_skipped` (preference or channel gate)
- `notification_marked_read`
- `user_notification_preferences_updated`
- `vendor_notification_preferences_updated`
- `user_channel_updated`

Fields may include `result`, `notification_id`, `event_type`, `user_id`, `vendor_id`, and `channel`. Never log session tokens, email addresses, request bodies, or payment secrets.
