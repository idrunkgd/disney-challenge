-- ============================================================================
--  RLS / Sécurité — DASOLABS DISNEY CHALLENGE
--  Modèle simple adapté à un événement privé d'une journée :
--   - Lecture publique (clé anon) sur le contenu de jeu (lecture seule côté client).
--   - Écritures sensibles (validation, scoring, login) passent par des RPC
--     "security definer" ou par les API routes (clé service_role).
--  À exécuter APRÈS schema.sql.
-- ============================================================================

alter table public.families             enable row level security;
alter table public.users                enable row level security;
alter table public.missions             enable row level security;
alter table public.mission_submissions  enable row level security;
alter table public.photos               enable row level security;
alter table public.quiz_questions       enable row level security;
alter table public.quiz_answers         enable row level security;
alter table public.blind_tracks         enable row level security;
alter table public.blind_answers        enable row level security;
alter table public.secret_missions      enable row level security;
alter table public.creative_attractions enable row level security;
alter table public.votes                enable row level security;
alter table public.awards               enable row level security;
alter table public.badges               enable row level security;
alter table public.family_badges        enable row level security;

-- Helper : (re)crée une policy proprement
-- Lecture publique sur le contenu de jeu
create policy "read_families"   on public.families   for select using (true);
create policy "read_users"      on public.users      for select using (true);
create policy "read_missions"   on public.missions   for select using (true);
create policy "read_subm"       on public.mission_submissions for select using (true);
create policy "read_photos"     on public.photos     for select using (true);
create policy "read_questions"  on public.quiz_questions for select using (true);
create policy "read_qanswers"   on public.quiz_answers for select using (true);
create policy "read_blind_t"    on public.blind_tracks for select using (true);
create policy "read_blind_a"    on public.blind_answers for select using (true);
create policy "read_secret"     on public.secret_missions for select using (true);
create policy "read_creative"   on public.creative_attractions for select using (true);
create policy "read_votes"      on public.votes      for select using (true);
create policy "read_awards"     on public.awards     for select using (true);
create policy "read_badges"     on public.badges     for select using (true);
create policy "read_fbadges"    on public.family_badges for select using (true);

-- Insertions autorisées côté client (clé anon) pour le flux participant :
--   photos (upload), votes, creative_attractions, mission_submissions, quiz via RPC.
create policy "insert_photos"   on public.photos     for insert with check (true);
create policy "insert_subm"     on public.mission_submissions for insert with check (true);
create policy "insert_votes"    on public.votes      for insert with check (true);
create policy "insert_creative" on public.creative_attractions for insert with check (true);
create policy "update_creative" on public.creative_attractions for update using (true) with check (true);
create policy "update_secret"   on public.secret_missions for update using (true) with check (true);

-- NB : toute opération d'administration (review_submission, gestion familles/missions/quiz,
--       attribution awards) est réalisée via les API routes serveur avec la clé service_role,
--       qui contourne la RLS. Les RPC login_with_token / answer_quiz / review_submission
--       sont en "security definer" et donc également exécutables avec la clé anon en sécurité.

-- ----------------------------------------------------------------------------
--  STORAGE : bucket "photos" public en lecture, insertion ouverte
--  (Créer le bucket "photos" dans Storage, public = true, puis ces policies.)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos_public_read"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "photos_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'photos');

-- Bucket "audio" pour les extraits du blind test
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

create policy "audio_public_read"
  on storage.objects for select
  using (bucket_id = 'audio');
