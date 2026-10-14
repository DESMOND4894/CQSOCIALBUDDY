-- These legacy draft/queue tables have no callers in the current app and
-- have not received new rows since March 2026. Keep service-role maintenance
-- access while removing browser/API access.
BEGIN;

ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standalone_posts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.content_drafts, public.content_queue,
  public.standalone_posts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.content_drafts, public.content_queue,
  public.standalone_posts TO service_role;

COMMIT;
