-- Use Claude Haiku 5.5, the cheapest Claude model, for the daily rashifal and (later) Ask AI.
-- To switch to richer (and costlier) writing later, change these values to 'claude-sonnet-5-5' or 'claude-opus-5-5'.
update public.app_settings set value = '"claude-haiku-5-5"' where key in ('rashifal_model', 'chat_model');
