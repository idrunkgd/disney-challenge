-- ============================================================================
--  DASOLABS DISNEY CHALLENGE — Schéma Supabase complet
--  À exécuter dans : Supabase Dashboard > SQL Editor (ordre : schema → policies → seed)
-- ============================================================================

-- Extensions utiles
create extension if not exists "pgcrypto";       -- gen_random_uuid()
create extension if not exists "uuid-ossp";

-- ============================================================================
--  TYPES ENUM
-- ============================================================================
do $$ begin
  create type mission_category as enum ('photo', 'attraction', 'exploration', 'secret', 'creativity');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vote_category as enum ('funniest_photo', 'best_attraction', 'team_spirit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('participant', 'admin');
exception when duplicate_object then null; end $$;

-- ============================================================================
--  TABLE : families
-- ============================================================================
create table if not exists public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  avatar      text not null default '🏰',        -- emoji ou clé d'avatar
  color       text not null default '#6366f1',    -- couleur d'équipe
  access_token text not null unique default encode(gen_random_bytes(16), 'hex'), -- jeton QR
  created_at  timestamptz not null default now()
);

-- ============================================================================
--  TABLE : users (participants rattachés à une famille)
--  Auth anonyme : un participant = un appareil rattaché à une famille via QR.
-- ============================================================================
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid references public.families(id) on delete cascade,
  display_name text not null default 'Participant',
  role        user_role not null default 'participant',
  device_id   text,                                -- identifiant d'appareil (localStorage)
  created_at  timestamptz not null default now()
);
create index if not exists idx_users_family on public.users(family_id);

-- ============================================================================
--  TABLE : missions (catalogue des défis)
-- ============================================================================
create table if not exists public.missions (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  category     mission_category not null default 'photo',
  points       int not null default 10,
  requires_photo boolean not null default true,
  icon         text not null default '📸',
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- ============================================================================
--  TABLE : mission_submissions (preuves soumises par les familles)
-- ============================================================================
create table if not exists public.mission_submissions (
  id          uuid primary key default gen_random_uuid(),
  mission_id  uuid not null references public.missions(id) on delete cascade,
  family_id   uuid not null references public.families(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  photo_id    uuid,                                -- lien vers photos.id (set plus bas)
  status      submission_status not null default 'pending',
  points_awarded int not null default 0,
  comment     text,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (mission_id, family_id)                   -- une famille valide une mission une fois
);
create index if not exists idx_subm_family on public.mission_submissions(family_id);
create index if not exists idx_subm_status on public.mission_submissions(status);

-- ============================================================================
--  TABLE : photos (Supabase Storage : bucket "photos")
-- ============================================================================
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  mission_id  uuid references public.missions(id) on delete set null,
  storage_path text not null,                      -- chemin dans le bucket
  public_url  text not null,
  caption     text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_photos_family on public.photos(family_id);
create index if not exists idx_photos_mission on public.photos(mission_id);

-- Lien différé submissions.photo_id -> photos.id
alter table public.mission_submissions
  drop constraint if exists fk_subm_photo;
alter table public.mission_submissions
  add constraint fk_subm_photo foreign key (photo_id)
  references public.photos(id) on delete set null;

-- ============================================================================
--  TABLE : quiz_questions  &  quiz_answers
-- ============================================================================
create table if not exists public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  options     jsonb not null,                      -- ["A","B","C","D"]
  correct_index int not null,                      -- index 0-based de la bonne réponse
  difficulty  int not null default 1,              -- 1=facile .. 3=difficile
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Réponses enregistrées (1 ligne par question répondue par un participant)
create table if not exists public.quiz_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  family_id   uuid not null references public.families(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  chosen_index int not null,
  is_correct  boolean not null default false,
  points_awarded int not null default 0,
  created_at  timestamptz not null default now(),
  unique (question_id, family_id)        -- une famille répond à chaque question une seule fois
);
create index if not exists idx_qanswers_family on public.quiz_answers(family_id);

-- ============================================================================
--  TABLE : blind_tracks (extraits audio du Blind Test, uploadés par l'admin)
-- ============================================================================
create table if not exists public.blind_tracks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,                       -- bonne réponse / titre du morceau
  audio_url   text not null,                       -- URL publique (bucket "audio")
  options     jsonb not null default '[]',         -- choix proposés ["A","B","C","D"]
  correct_index int not null default 0,
  points      int not null default 20,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.blind_answers (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid not null references public.blind_tracks(id) on delete cascade,
  family_id   uuid not null references public.families(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  chosen_index int not null,
  is_correct  boolean not null default false,
  points_awarded int not null default 0,
  created_at  timestamptz not null default now(),
  unique (track_id, family_id)
);
create index if not exists idx_blind_family on public.blind_answers(family_id);

-- ============================================================================
--  TABLE : secret_missions (assignées aléatoirement à chaque famille)
-- ============================================================================
create table if not exists public.secret_missions (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  title       text not null,
  description text not null default '',
  points      int not null default 50,
  status      submission_status not null default 'pending',
  photo_id    uuid references public.photos(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_secret_family on public.secret_missions(family_id);

-- ============================================================================
--  TABLE : creative_attractions (défi créativité)
-- ============================================================================
create table if not exists public.creative_attractions (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade unique,
  name        text not null,
  description text not null default '',
  slogan      text not null default '',
  created_at  timestamptz not null default now()
);

-- ============================================================================
--  TABLE : votes (anonymes, par catégorie)
-- ============================================================================
create table if not exists public.votes (
  id          uuid primary key default gen_random_uuid(),
  category    vote_category not null,
  voter_user_id uuid references public.users(id) on delete set null,
  target_family_id uuid references public.families(id) on delete cascade,
  target_photo_id  uuid references public.photos(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (category, voter_user_id)                 -- 1 vote par catégorie par votant
);
create index if not exists idx_votes_category on public.votes(category);

-- ============================================================================
--  TABLE : awards (résultats Disney Awards de la soirée)
-- ============================================================================
create table if not exists public.awards (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,                       -- "Famille la plus drôle", etc.
  family_id   uuid references public.families(id) on delete set null,
  winner_name text,                                -- pour "enfant le plus courageux" etc.
  description text,
  announced   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================================
--  TABLE : badges (gamification) & family_badges
-- ============================================================================
create table if not exists public.badges (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  icon        text not null default '🏅',
  description text not null default '',
  threshold   int not null default 0               -- ex: nb de missions / points requis
);

create table if not exists public.family_badges (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  badge_id    uuid not null references public.badges(id) on delete cascade,
  earned_at   timestamptz not null default now(),
  unique (family_id, badge_id)
);

-- ============================================================================
--  VUE : leaderboard (score agrégé en temps réel)
--  = missions approuvées + missions secrètes approuvées + quiz
-- ============================================================================
create or replace view public.family_scores as
select
  f.id          as family_id,
  f.name,
  f.avatar,
  f.color,
  coalesce(ms.pts, 0)  as mission_points,
  coalesce(sm.pts, 0)  as secret_points,
  coalesce(qz.pts, 0)  as quiz_points,
  coalesce(bt.pts, 0)  as blind_points,
  coalesce(ms.pts, 0) + coalesce(sm.pts, 0) + coalesce(qz.pts, 0) + coalesce(bt.pts, 0) as total_points,
  coalesce(ms.cnt, 0)  as missions_completed
from public.families f
left join (
  select family_id, sum(points_awarded) pts, count(*) cnt
  from public.mission_submissions where status = 'approved' group by family_id
) ms on ms.family_id = f.id
left join (
  select family_id, sum(points) pts
  from public.secret_missions where status = 'approved' group by family_id
) sm on sm.family_id = f.id
left join (
  select family_id, sum(points_awarded) pts
  from public.quiz_answers group by family_id
) qz on qz.family_id = f.id
left join (
  select family_id, sum(points_awarded) pts
  from public.blind_answers group by family_id
) bt on bt.family_id = f.id;

-- ============================================================================
--  RPC : valider une soumission de mission (admin) → attribue les points
-- ============================================================================
create or replace function public.review_submission(
  p_submission_id uuid,
  p_approve boolean,
  p_comment text default null
) returns public.mission_submissions
language plpgsql
security definer
as $$
declare
  v_row public.mission_submissions;
  v_points int;
begin
  select m.points into v_points
  from public.mission_submissions s
  join public.missions m on m.id = s.mission_id
  where s.id = p_submission_id;

  update public.mission_submissions
  set status = case when p_approve then 'approved'::submission_status else 'rejected'::submission_status end,
      points_awarded = case when p_approve then v_points else 0 end,
      comment = p_comment,
      reviewed_at = now()
  where id = p_submission_id
  returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================================
--  RPC : connexion par jeton de famille (auth anonyme via QR)
--  Crée/récupère un user rattaché à la famille pour cet appareil.
-- ============================================================================
create or replace function public.login_with_token(
  p_token text,
  p_device_id text,
  p_display_name text default 'Participant'
) returns table (user_id uuid, family_id uuid, family_name text, family_avatar text, family_color text, role user_role)
language plpgsql
security definer
as $$
declare
  v_family public.families;
  v_user public.users;
begin
  select * into v_family from public.families f where f.access_token = p_token;
  if v_family.id is null then
    raise exception 'INVALID_TOKEN';
  end if;

  select * into v_user from public.users u
  where u.family_id = v_family.id and u.device_id = p_device_id limit 1;

  if v_user.id is null then
    insert into public.users (family_id, device_id, display_name)
    values (v_family.id, p_device_id, p_display_name)
    returning * into v_user;
  end if;

  return query select v_user.id, v_family.id, v_family.name, v_family.avatar, v_family.color, v_user.role;
end;
$$;

-- ============================================================================
--  RPC : enregistrer une réponse de quiz (idempotent par question/famille/user)
-- ============================================================================
create or replace function public.answer_quiz(
  p_question_id uuid,
  p_family_id uuid,
  p_user_id uuid,
  p_chosen_index int
) returns public.quiz_answers
language plpgsql
security definer
as $$
declare
  v_q public.quiz_questions;
  v_correct boolean;
  v_points int;
  v_row public.quiz_answers;
begin
  -- Déjà répondu par la famille ? On renvoie la réponse existante (pas de doublon, pas de points en plus).
  select * into v_row from public.quiz_answers
  where question_id = p_question_id and family_id = p_family_id limit 1;
  if v_row.id is not null then
    return v_row;
  end if;

  select * into v_q from public.quiz_questions where id = p_question_id;
  v_correct := (v_q.correct_index = p_chosen_index);
  v_points := case when v_correct then (10 * v_q.difficulty) else 0 end;

  insert into public.quiz_answers (question_id, family_id, user_id, chosen_index, is_correct, points_awarded)
  values (p_question_id, p_family_id, p_user_id, p_chosen_index, v_correct, v_points)
  on conflict (question_id, family_id) do nothing
  returning * into v_row;

  -- En cas de course (deux membres en même temps), on relit la ligne gagnante.
  if v_row.id is null then
    select * into v_row from public.quiz_answers
    where question_id = p_question_id and family_id = p_family_id limit 1;
  end if;

  return v_row;
end;
$$;

-- ============================================================================
--  RPC : enregistrer une réponse de blind test
-- ============================================================================
create or replace function public.answer_blind(
  p_track_id uuid,
  p_family_id uuid,
  p_user_id uuid,
  p_chosen_index int
) returns public.blind_answers
language plpgsql
security definer
as $$
declare
  v_t public.blind_tracks;
  v_correct boolean;
  v_row public.blind_answers;
begin
  select * into v_t from public.blind_tracks where id = p_track_id;
  v_correct := (v_t.correct_index = p_chosen_index);

  insert into public.blind_answers (track_id, family_id, user_id, chosen_index, is_correct, points_awarded)
  values (p_track_id, p_family_id, p_user_id, p_chosen_index, v_correct,
          case when v_correct then v_t.points else 0 end)
  returning * into v_row;

  return v_row;
end;
$$;

-- Accès lecture à la vue de classement pour les clients (clé anon)
grant select on public.family_scores to anon, authenticated;

-- Realtime : exposer les tables utiles
alter publication supabase_realtime add table public.mission_submissions;
alter publication supabase_realtime add table public.blind_answers;
alter publication supabase_realtime add table public.quiz_answers;
alter publication supabase_realtime add table public.secret_missions;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.awards;
alter publication supabase_realtime add table public.photos;
