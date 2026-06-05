-- ============================================================================
--  3 JEUX DE FILE D'ATTENTE : Pendu · Petit Bac · Tu préfères
--  À exécuter dans Supabase → SQL Editor (après schema.sql + games.sql).
--  Pendu & Petit Bac comptent au classement ; Tu préfères = juste pour le fun.
-- ============================================================================

-- ── PENDU ────────────────────────────────────────────────────────────────────
create table if not exists public.hangman_words (
  id uuid primary key default gen_random_uuid(),
  answer text not null,            -- titre/personnage à deviner (en MAJUSCULES)
  hint   text not null default 'Film',
  points int not null default 15,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.hangman_words enable row level security;
drop policy if exists "read_hangman_words" on public.hangman_words;
create policy "read_hangman_words" on public.hangman_words for select using (true);

create table if not exists public.hangman_solved (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  word_id   uuid not null references public.hangman_words(id) on delete cascade,
  user_id   uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (family_id, word_id)
);
alter table public.hangman_solved enable row level security;
drop policy if exists "read_hangman_solved" on public.hangman_solved;
create policy "read_hangman_solved" on public.hangman_solved for select using (true);

create or replace function public.solve_hangman(p_family_id uuid, p_word_id uuid, p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.hangman_solved (family_id, word_id, user_id)
  values (p_family_id, p_word_id, p_user_id)
  on conflict (family_id, word_id) do nothing;
end; $$;

-- ── PETIT BAC ────────────────────────────────────────────────────────────────
create table if not exists public.petitbac_rounds (
  id uuid primary key default gen_random_uuid(),
  letter text not null,
  categories jsonb not null default '["Un personnage Disney","Un film Disney","Une attraction","Un méchant Disney","Quelque chose à manger"]',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.petitbac_rounds enable row level security;
drop policy if exists "read_petitbac_rounds" on public.petitbac_rounds;
create policy "read_petitbac_rounds" on public.petitbac_rounds for select using (true);

create table if not exists public.petitbac_submissions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.petitbac_rounds(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  answers jsonb not null default '{}',
  status submission_status not null default 'pending',
  points int not null default 0,
  created_at timestamptz not null default now(),
  unique (round_id, family_id)
);
alter table public.petitbac_submissions enable row level security;
drop policy if exists "read_petitbac_sub" on public.petitbac_submissions;
create policy "read_petitbac_sub" on public.petitbac_submissions for select using (true);

-- Soumission d'une grille (toujours "pending", validation = admin)
create or replace function public.submit_petitbac(p_round_id uuid, p_family_id uuid, p_answers jsonb)
returns public.petitbac_submissions language plpgsql security definer as $$
declare v_row public.petitbac_submissions;
begin
  insert into public.petitbac_submissions (round_id, family_id, answers, status)
  values (p_round_id, p_family_id, p_answers, 'pending')
  on conflict (round_id, family_id) do update set answers = excluded.answers, status = 'pending', created_at = now()
  returning * into v_row;
  return v_row;
end; $$;

-- ── TU PRÉFÈRES (non scoré) ──────────────────────────────────────────────────
create table if not exists public.wyr_questions (
  id uuid primary key default gen_random_uuid(),
  option_a text not null,
  option_b text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.wyr_questions enable row level security;
drop policy if exists "read_wyr_q" on public.wyr_questions;
create policy "read_wyr_q" on public.wyr_questions for select using (true);

create table if not exists public.wyr_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  question_id uuid not null references public.wyr_questions(id) on delete cascade,
  choice text not null,            -- 'a' | 'b'
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);
alter table public.wyr_votes enable row level security;
drop policy if exists "read_wyr_v" on public.wyr_votes;
create policy "read_wyr_v" on public.wyr_votes for select using (true);
drop policy if exists "insert_wyr_v" on public.wyr_votes;
create policy "insert_wyr_v" on public.wyr_votes for insert with check (true);
drop policy if exists "update_wyr_v" on public.wyr_votes;
create policy "update_wyr_v" on public.wyr_votes for update using (true) with check (true);

-- ── Vue de classement : + pendu + petit bac ─────────────────────────────────
drop view if exists public.family_scores;
create view public.family_scores as
select f.id as family_id, f.name, f.avatar, f.color,
  coalesce(ms.pts,0) as mission_points, coalesce(sm.pts,0) as secret_points,
  coalesce(qz.pts,0) as quiz_points, coalesce(bt.pts,0) as blind_points,
  coalesce(my.pts,0) as mystery_points,
  coalesce(public.bingo_family_points(f.id),0) as bingo_points,
  coalesce(hg.pts,0) as hangman_points,
  coalesce(pb.pts,0) as petitbac_points,
  coalesce(ms.pts,0)+coalesce(sm.pts,0)+coalesce(qz.pts,0)+coalesce(bt.pts,0)
    +coalesce(my.pts,0)+coalesce(public.bingo_family_points(f.id),0)
    +coalesce(hg.pts,0)+coalesce(pb.pts,0) as total_points,
  coalesce(ms.cnt,0) as missions_completed
from public.families f
left join (select family_id, sum(points_awarded) pts, count(*) cnt from public.mission_submissions where status='approved' group by family_id) ms on ms.family_id=f.id
left join (select family_id, sum(points) pts from public.secret_missions where status='approved' group by family_id) sm on sm.family_id=f.id
left join (select family_id, sum(points_awarded) pts from public.quiz_answers group by family_id) qz on qz.family_id=f.id
left join (select family_id, sum(points_awarded) pts from public.blind_answers group by family_id) bt on bt.family_id=f.id
left join (select family_id, 500 as pts from public.mystery_guesses where status='approved') my on my.family_id=f.id
left join (select s.family_id, sum(w.points) pts from public.hangman_solved s join public.hangman_words w on w.id=s.word_id group by s.family_id) hg on hg.family_id=f.id
left join (select family_id, sum(points) pts from public.petitbac_submissions where status='approved' group by family_id) pb on pb.family_id=f.id;
grant select on public.family_scores to anon, authenticated;

-- ── SEED : mots du Pendu ─────────────────────────────────────────────────────
delete from public.hangman_words;
insert into public.hangman_words (answer, hint) values
('LE ROI LION','Film'),('LA REINE DES NEIGES','Film'),('VAIANA','Film'),('RAIPONCE','Film'),
('ALADDIN','Film'),('CENDRILLON','Film'),('MULAN','Film'),('HERCULE','Film'),('TARZAN','Film'),
('POCAHONTAS','Film'),('DUMBO','Film'),('BAMBI','Film'),('PINOCCHIO','Film'),('ENCANTO','Film'),
('COCO','Film'),('LUCA','Film'),('RATATOUILLE','Film'),('ZOOTOPIE','Film'),('REBELLE','Film'),
('LE LIVRE DE LA JUNGLE','Film'),('LA PETITE SIRENE','Film'),('LA BELLE ET LA BETE','Film'),
('PETER PAN','Film'),('LES INDESTRUCTIBLES','Film'),('MONSTRES ET CIE','Film'),
('MICKEY','Personnage'),('MINNIE','Personnage'),('DONALD','Personnage'),('SIMBA','Personnage'),
('STITCH','Personnage'),('OLAF','Personnage'),('WOODY','Personnage'),('ARIEL','Personnage'),
('JASMINE','Personnage'),('MUSHU','Personnage'),('BALOO','Personnage'),('MOWGLI','Personnage'),
('REMY','Personnage'),('MAUI','Personnage'),('BAYMAX','Personnage');

-- ── SEED : Tu préfères ───────────────────────────────────────────────────────
delete from public.wyr_questions;
insert into public.wyr_questions (option_a, option_b) values
('Voler avec Peter Pan','Nager avec Ariel'),
('Un festin cuisiné par Rémy','Un road trip avec Flash McQueen'),
('Avoir Stitch comme animal','Avoir Maximus comme cheval'),
('Glisser sur la neige avec Olaf','Surfer sur l''océan avec Vaiana'),
('Un vœu exaucé par le Génie','Avoir les pouvoirs d''Elsa'),
('Vivre dans le château de la Belle','Vivre dans la maison volante de Là-haut'),
('Chanter avec Simba','Danser avec Raiponce'),
('Être le meilleur ami de Buzz','Être le meilleur ami de Woody'),
('Un câlin de Baymax','Un high-five de Sulli'),
('Explorer la jungle avec Mowgli','Explorer l''océan avec Nemo'),
('Avoir la chevelure magique de Raiponce','Avoir la tenue givrée d''Elsa'),
('Combattre avec Mulan','Tirer à l''arc avec Mérida'),
('Avoir Pascal le caméléon','Avoir Meeko le raton laveur'),
('Affronter Scar','Affronter Ursula'),
('Une aventure avec Coco','Une aventure avec Luca'),
('Être invisible comme Violette','Courir super vite comme Flèche'),
('Avoir un dragon comme Mushu','Avoir un coq rigolo comme Heihei'),
('Habiter à Arendelle','Habiter à Agrabah'),
('Un selfie avec Mickey','Un selfie avec Stitch'),
('Piloter comme Flash McQueen','Voler comme Dumbo'),
('Une bataille de boules de neige avec Olaf','Une course de luge avec Kristoff'),
('Apprendre à nager avec Dory','Apprendre à voler avec Clochette'),
('Être courageux comme Hercule','Être malin comme Aladdin'),
('Un concert de Sébastien le crabe','Un show de Timon et Pumbaa'),
('Cuisiner avec Rémy','Coudre avec les souris de Cendrillon'),
('Manger comme Pumbaa (des insectes)','Manger comme Rémy (gastronomie)'),
('Un tour de tapis volant','Un tour en gondole à Agrabah'),
('Avoir le carrosse de Cendrillon','Avoir le bateau de Vaiana');

-- ── SEED : un round de Petit Bac actif (lettre M) ────────────────────────────
insert into public.petitbac_rounds (letter, is_active)
select 'M', true
where not exists (select 1 from public.petitbac_rounds);
