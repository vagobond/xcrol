-- Restore the weekly digest schedule.
--
-- The digest's pg_cron job had been created by hand in the dashboard, so it
-- lived nowhere in the repo; at some point after 2026-08-03 (the last logged
-- send) it disappeared, and the digest silently stopped. Scheduling it in a
-- migration keeps it versioned and reviewable.
--
-- Same pattern as nightly-backup-0400-utc and heartbeat-check-weekly: the job
-- posts to the edge function with x-cron-secret read from the vault, and the
-- function rejects any call without it. Mondays 09:00 UTC, the time the
-- digest always went out (18:00 JST / 16:00 ICT).
--
-- Idempotent: drop any existing job of the same name first.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'weekly-digest-mon-0900-utc') then
    perform cron.unschedule('weekly-digest-mon-0900-utc');
  end if;
end $$;

select cron.schedule(
  'weekly-digest-mon-0900-utc',
  '0 9 * * 1',
  $job$
  select net.http_post(
    url := 'https://wmatvlxehyaufhjljtby.supabase.co/functions/v1/send-weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1)
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 300000
  );
  $job$
);
