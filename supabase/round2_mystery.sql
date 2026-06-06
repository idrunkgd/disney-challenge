-- ============================================================================
--  IMAGE MYSTÈRE MULTI-MANCHES
--  Les 500 pts des manches précédentes sont CONSERVÉS, et chaque famille peut
--  rejouer la nouvelle image (qui se découvre avec les bonnes réponses du
--  nouveau quiz). 500 pts par image trouvée (cumul possible).
--  À exécuter dans Supabase → SQL Editor (après round2.sql).
-- ============================================================================

-- 1) Lier chaque proposition à une image précise
alter table public.mystery_guesses add column if not exists image_id uuid references public.mystery_image(id) on delete cascade;

-- 2) Rattacher les propositions existantes à l'image actuelle (manche en cours)
update public.mystery_guesses g
set image_id = coalesce(
  (select id from public.mystery_image where is_active order by created_at desc limit 1),
  (select id from public.mystery_image order by created_at desc limit 1)
)
where g.image_id is null;

-- 3) Unicité : une proposition par famille ET par image (au lieu d'une par famille)
alter table public.mystery_guesses drop constraint if exists mystery_guesses_family_id_key;
create unique index if not exists mystery_guesses_family_image_uniq on public.mystery_guesses (family_id, image_id);

-- 4) La soumission cible l'image ACTIVE du moment
create or replace function public.submit_mystery_guess(p_family_id uuid, p_guess text)
returns public.mystery_guesses language plpgsql security definer as $$
declare v_img uuid; v_row public.mystery_guesses;
begin
  select id into v_img from public.mystery_image where is_active order by created_at desc limit 1;
  insert into public.mystery_guesses (family_id, guess, status, image_id)
  values (p_family_id, p_guess, 'pending', v_img)
  on conflict (family_id, image_id) do update set guess = excluded.guess, status = 'pending', created_at = now()
  returning * into v_row;
  return v_row;
end; $$;

-- 5) Classement : 500 pts PAR proposition validée (cumul des manches)
drop view if exists public.family_scores;
create view public.family_scores as
select f.id as family_id, f.name, f.avatar, f.color,
  coalesce(ms.pts,0) as mission_points,
  coalesce(qz.pts,0) as quiz_points, coalesce(bt.pts,0) as blind_points,
  coalesce(my.pts,0) as mystery_points,
  coalesce(public.bingo_family_points(f.id),0) as bingo_points,
  coalesce(hg.pts,0) as hangman_points,
  coalesce(ms.pts,0)+coalesce(qz.pts,0)+coalesce(bt.pts,0)
    +coalesce(my.pts,0)+coalesce(public.bingo_family_points(f.id),0)+coalesce(hg.pts,0) as total_points,
  coalesce(ms.cnt,0) as missions_completed
from public.families f
left join (select family_id, sum(points_awarded) pts, count(*) cnt from public.mission_submissions where status='approved' group by family_id) ms on ms.family_id=f.id
left join (select family_id, sum(points_awarded) pts from public.quiz_answers group by family_id) qz on qz.family_id=f.id
left join (select family_id, sum(points_awarded) pts from public.blind_answers group by family_id) bt on bt.family_id=f.id
left join (select family_id, count(*)*500 as pts from public.mystery_guesses where status='approved' group by family_id) my on my.family_id=f.id
left join (select s.family_id, sum(w.points) pts from public.hangman_solved s join public.hangman_words w on w.id=s.word_id group by s.family_id) hg on hg.family_id=f.id;
grant select on public.family_scores to anon, authenticated;
