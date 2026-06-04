-- ClearSteps Phase 6 optional AI metadata
-- Privacy rule: store safe AI processing metadata only.
-- Do not store raw prompts, OCR text, document text, AI responses,
-- uploaded files, names, addresses, account numbers, reference numbers,
-- payment details, or extracted personal information.

alter table public.document_sessions
  add column if not exists ai_used boolean,
  add column if not exists ai_status text
    check (ai_status in ('skipped', 'completed', 'fallback', 'failed')),
  add column if not exists ai_provider text,
  add column if not exists ai_model text,
  add column if not exists ai_duration_ms integer
    check (ai_duration_ms is null or ai_duration_ms >= 0),
  add column if not exists ai_error_code text;

create index if not exists idx_document_sessions_ai_status
  on public.document_sessions(ai_status);
