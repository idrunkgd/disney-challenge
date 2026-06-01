-- ============================================================================
--  BINGO DISNEY + AGENT SECRET — 2 nouveaux jeux
--  Auto-validation (tap), points par difficulté, comptés au classement.
--  Bingo = partagé par famille. Agent Secret = 1 mission par joueur.
--  À exécuter dans Supabase → SQL Editor (après schema.sql).
-- ============================================================================

-- Sécurité : la vue de score référence mystery_guesses ; on garantit son existence
-- (no-op si mystery.sql a déjà été exécuté).
create table if not exists public.mystery_guesses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade unique,
  guess text not null default '',
  status submission_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ── BINGO ───────────────────────────────────────────────────────────────────
create table if not exists public.bingo_cards (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  category   text not null default 'Détails cachés',
  difficulty text not null default 'easy',   -- easy | medium | rare
  points     int  not null default 5,
  is_active  boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.bingo_cards enable row level security;
drop policy if exists "read_bingo_cards" on public.bingo_cards;
create policy "read_bingo_cards" on public.bingo_cards for select using (true);

create table if not exists public.bingo_completions (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  card_id    uuid not null references public.bingo_cards(id) on delete cascade,
  user_id    uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (family_id, card_id)
);
alter table public.bingo_completions enable row level security;
drop policy if exists "read_bingo_completions" on public.bingo_completions;
create policy "read_bingo_completions" on public.bingo_completions for select using (true);

-- ── AGENT SECRET ────────────────────────────────────────────────────────────
create table if not exists public.agent_missions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  difficulty  text not null default 'medium',  -- easy | medium | hard
  points      int  not null default 30,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.agent_missions enable row level security;
drop policy if exists "read_agent_missions" on public.agent_missions;
create policy "read_agent_missions" on public.agent_missions for select using (true);

create table if not exists public.agent_assignments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  family_id   uuid not null references public.families(id) on delete cascade,
  mission_id  uuid not null references public.agent_missions(id) on delete cascade,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
-- Historique : plusieurs missions par joueur (chaque mission faite reste comptée)
alter table public.agent_assignments drop constraint if exists agent_assignments_user_id_key;
alter table public.agent_assignments enable row level security;
drop policy if exists "read_agent_assignments" on public.agent_assignments;
create policy "read_agent_assignments" on public.agent_assignments for select using (true);

-- ── RPCs ─────────────────────────────────────────────────────────────────────
-- Cocher / décocher une case de bingo (partagé famille)
create or replace function public.set_bingo(p_family_id uuid, p_card_id uuid, p_user_id uuid, p_done boolean)
returns void language plpgsql security definer as $$
begin
  if p_done then
    insert into public.bingo_completions (family_id, card_id, user_id)
    values (p_family_id, p_card_id, p_user_id)
    on conflict (family_id, card_id) do nothing;
  else
    delete from public.bingo_completions where family_id = p_family_id and card_id = p_card_id;
  end if;
end; $$;

-- Attribuer (une fois) une mission secrète à un joueur — privilégie une mission non encore distribuée
-- Mission COURANTE du joueur = la dernière assignée. Crée la 1re automatiquement.
create or replace function public.assign_agent_mission(p_user_id uuid, p_family_id uuid)
returns table (assignment_id uuid, mission_id uuid, title text, description text, difficulty text, points int, done boolean)
language plpgsql security definer as $$
declare v_a public.agent_assignments; v_mid uuid;
begin
  select * into v_a from public.agent_assignments where user_id = p_user_id order by created_at desc limit 1;
  if v_a.id is null then
    select m.id into v_mid from public.agent_missions m
      where m.is_active and not exists (select 1 from public.agent_assignments a where a.mission_id = m.id)
      order by random() limit 1;
    if v_mid is null then
      select m.id into v_mid from public.agent_missions m where m.is_active order by random() limit 1;
    end if;
    insert into public.agent_assignments (user_id, family_id, mission_id)
      values (p_user_id, p_family_id, v_mid) returning * into v_a;
  end if;

  return query
    select v_a.id, m.id, m.title, m.description, m.difficulty, m.points, v_a.done
    from public.agent_missions m where m.id = v_a.mission_id;
end; $$;

-- Marquer la mission COURANTE (la plus récente) comme accomplie (ou annuler)
create or replace function public.complete_agent(p_user_id uuid, p_done boolean)
returns void language plpgsql security definer as $$
begin
  update public.agent_assignments set done = p_done
  where id = (select id from public.agent_assignments where user_id = p_user_id order by created_at desc limit 1);
end; $$;

-- ADMIN : attribuer une NOUVELLE mission à un joueur (privilégie une qu'il n'a jamais eue)
create or replace function public.admin_assign_agent(p_user_id uuid)
returns void language plpgsql security definer as $$
declare v_fam uuid; v_mid uuid;
begin
  select family_id into v_fam from public.users where id = p_user_id;
  select m.id into v_mid from public.agent_missions m
    where m.is_active and not exists (select 1 from public.agent_assignments a where a.user_id = p_user_id and a.mission_id = m.id)
    order by random() limit 1;
  if v_mid is null then
    select m.id into v_mid from public.agent_missions m where m.is_active order by random() limit 1;
  end if;
  insert into public.agent_assignments (user_id, family_id, mission_id) values (p_user_id, v_fam, v_mid);
end; $$;

-- ── Score Bingo 5×5 : 10 pts / case + 20 pts / ligne complète ────────────────
-- La grille = les 25 premières cases (sort_order 1..25). Lignes = 5 rangées,
-- 5 colonnes et 2 diagonales.
create or replace function public.bingo_family_points(p_family_id uuid)
returns int language plpgsql stable security definer as $$
declare done int[]; base int := 0; bonus int := 0; ln int[];
begin
  select coalesce(array_agg(b.sort_order), '{}') into done
  from public.bingo_completions c
  join public.bingo_cards b on b.id = c.card_id
  where c.family_id = p_family_id and b.sort_order between 1 and 25;

  base := coalesce(array_length(done, 1), 0) * 10;

  for ln in select l from (values
    (array[1,2,3,4,5]),(array[6,7,8,9,10]),(array[11,12,13,14,15]),(array[16,17,18,19,20]),(array[21,22,23,24,25]),
    (array[1,6,11,16,21]),(array[2,7,12,17,22]),(array[3,8,13,18,23]),(array[4,9,14,19,24]),(array[5,10,15,20,25]),
    (array[1,7,13,19,25]),(array[5,9,13,17,21])
  ) as t(l) loop
    if ln <@ done then bonus := bonus + 20; end if;
  end loop;

  return base + bonus;
end; $$;

-- ── Vue de classement : + bingo + agent secret ──────────────────────────────
drop view if exists public.family_scores;
create view public.family_scores as
select f.id as family_id, f.name, f.avatar, f.color,
  coalesce(ms.pts,0)  as mission_points,
  coalesce(sm.pts,0)  as secret_points,
  coalesce(qz.pts,0)  as quiz_points,
  coalesce(bt.pts,0)  as blind_points,
  coalesce(my.pts,0)  as mystery_points,
  coalesce(public.bingo_family_points(f.id),0) as bingo_points,
  coalesce(ag.pts,0)  as agent_points,
  coalesce(ms.pts,0)+coalesce(sm.pts,0)+coalesce(qz.pts,0)+coalesce(bt.pts,0)
    +coalesce(my.pts,0)+coalesce(public.bingo_family_points(f.id),0)+coalesce(ag.pts,0) as total_points,
  coalesce(ms.cnt,0)  as missions_completed
from public.families f
left join (select family_id, sum(points_awarded) pts, count(*) cnt from public.mission_submissions where status='approved' group by family_id) ms on ms.family_id=f.id
left join (select family_id, sum(points) pts from public.secret_missions where status='approved' group by family_id) sm on sm.family_id=f.id
left join (select family_id, sum(points_awarded) pts from public.quiz_answers group by family_id) qz on qz.family_id=f.id
left join (select family_id, sum(points_awarded) pts from public.blind_answers group by family_id) bt on bt.family_id=f.id
left join (select family_id, 500 as pts from public.mystery_guesses where status='approved') my on my.family_id=f.id
left join (select a.family_id, sum(m.points) pts from public.agent_assignments a join public.agent_missions m on m.id=a.mission_id where a.done group by a.family_id) ag on ag.family_id=f.id;
grant select on public.family_scores to anon, authenticated;

-- ── SEED : 100 cases de Bingo (easy=5 · medium=10 · rare=20) ─────────────────
delete from public.bingo_cards;
insert into public.bingo_cards (title, category, difficulty, points, sort_order) values
('Voir le château au loin','Décors','easy',5,1),
('Prendre une photo devant le château','Décors','easy',5,2),
('Faire une attraction à sensations fortes','Attractions','medium',10,3),
('Se faire éclabousser sur une attraction aquatique','Attractions','medium',10,4),
('Manger une glace','Nourriture','easy',5,5),
('Repérer un visiteur avec des oreilles de Mickey','Comportements','easy',5,6),
('Voir une poussette double','Comportements','easy',5,7),
('Trouver un Mickey caché','Détails cachés','medium',10,8),
('Voir une parade passer','Spectacles','easy',5,9),
('Entrer dans la grande boutique de Main Street','Boutiques','easy',5,10),
('Goûter un pop-corn sucré ou salé','Nourriture','easy',5,11),
('Voir un personnage de loin','Personnages','easy',5,12),
('Toucher le mur d''une attraction','Décors','easy',5,13),
('Faire une attraction dans le noir','Attractions','medium',10,14),
('Boire une boisson d''une couleur improbable','Nourriture','easy',5,15),
('Repérer un couple assorti (mêmes habits)','Comportements','medium',10,16),
('Trouver une fontaine','Décors','easy',5,17),
('Voir quelqu''un faire la sieste sur un banc','Comportements','medium',10,18),
('Essayer un chapeau rigolo en boutique','Boutiques','easy',5,19),
('Entendre une musique de film Disney','Spectacles','easy',5,20),
('Faire 3 attractions différentes en 1 heure','Attractions','medium',10,21),
('Photographier une statue du parc','Décors','medium',10,22),
('Voir 3 personnages différents dans la journée','Personnages','medium',10,23),
('Manger quelque chose en forme de Mickey','Nourriture','medium',10,24),
('Voir un enfant déguisé en prince ou princesse','Comportements','easy',5,25),
('Trouver une peluche plus grande qu''un enfant','Boutiques','medium',10,26),
('Filmer un moment de parade','Spectacles','medium',10,27),
('Repérer un détail amusant dans une file d''attente','Détails cachés','medium',10,28),
('Faire une attraction les bras en l''air','Attractions','medium',10,29),
('Trouver un décor du Far West','Décors','medium',10,30),
('Voir quelqu''un déguisé entièrement en personnage','Comportements','rare',20,31),
('Goûter une spécialité que tu n''as jamais mangée','Nourriture','medium',10,32),
('Repérer une horloge dans le parc','Décors','medium',10,33),
('Trouver un objet à plus de 50 € en boutique','Boutiques','medium',10,34),
('Voir un personnage rare (peu courant)','Personnages','rare',20,35),
('Manger un dessert à partager à plusieurs','Nourriture','easy',5,36),
('Repérer un visiteur avec un costume fait main','Comportements','rare',20,37),
('Trouver 3 Mickey cachés dans la journée','Détails cachés','rare',20,38),
('Faire la même attraction 2 fois de suite','Attractions','rare',20,39),
('Voir une cascade ou un plan d''eau','Décors','easy',5,40),
('Boire un chocolat chaud ou un café en terrasse','Nourriture','easy',5,41),
('Voir quelqu''un courir vers une attraction','Comportements','easy',5,42),
('Trouver une poignée de porte décorée','Détails cachés','medium',10,43),
('Assister à un mini-spectacle de rue','Spectacles','medium',10,44),
('Trouver un décor de pirates','Décors','medium',10,45),
('Repérer un ballon en forme de personnage','Comportements','easy',5,46),
('Entrer dans une boutique à thème (hors Main Street)','Boutiques','easy',5,47),
('Faire une attraction qui tourne sur elle-même','Attractions','easy',5,48),
('Photographier un détail d''architecture surprenant','Détails cachés','medium',10,49),
('Voir un groupe avec des t-shirts assortis','Comportements','medium',10,50),
('Manger des churros ou une gaufre','Nourriture','easy',5,51),
('Repérer un drapeau dans le parc','Décors','easy',5,52),
('Voir un visiteur porter son enfant sur les épaules','Comportements','easy',5,53),
('Trouver l''objet le plus cher d''une boutique','Boutiques','rare',20,54),
('Faire une attraction familiale tranquille','Attractions','easy',5,55),
('Repérer une plaque ou une inscription cachée','Détails cachés','rare',20,56),
('Voir un personnage saluer la foule','Personnages','medium',10,57),
('Goûter une boisson chaude originale','Nourriture','medium',10,58),
('Voir le spectacle nocturne / les drones','Spectacles','rare',20,59),
('Trouver un décor qui imite un autre pays','Décors','medium',10,60),
('Repérer quelqu''un avec un pin''s collector','Comportements','rare',20,61),
('Acheter ou repérer un porte-clés','Boutiques','easy',5,62),
('Faire un grand huit au premier rang','Attractions','rare',20,63),
('Voir un détail que personne du groupe n''avait remarqué','Détails cachés','rare',20,64),
('Manger un plat typiquement américain','Nourriture','medium',10,65),
('Repérer un lampadaire ou une lanterne décorée','Décors','easy',5,66),
('Voir quelqu''un prendre 10 photos du même endroit','Comportements','medium',10,67),
('Trouver un mug à l''effigie d''un film','Boutiques','easy',5,68),
('Entendre des applaudissements spontanés','Spectacles','medium',10,69),
('Repérer un easter egg dans un décor','Détails cachés','rare',20,70),
('Attendre dans une file de plus de 30 minutes','Attractions','medium',10,71),
('Voir une statue d''un personnage','Décors','easy',5,72),
('Repérer un visiteur déguisé avec un seul accessoire','Comportements','easy',5,73),
('Goûter une glace d''un parfum original','Nourriture','medium',10,74),
('Voir une vitrine animée en boutique','Boutiques','medium',10,75),
('Voir un artiste de rue ou un musicien','Spectacles','medium',10,76),
('Trouver une porte ou une fenêtre minuscule cachée','Détails cachés','rare',20,77),
('Monter dans un véhicule sur rails du parc','Attractions','easy',5,78),
('Photographier une jolie lumière ou un coucher de soleil','Décors','medium',10,79),
('Voir quelqu''un faire la queue déguisé','Comportements','rare',20,80),
('Manger un bonbon ou une sucette géante','Nourriture','easy',5,81),
('Trouver un présentoir entier d''une seule couleur','Boutiques','medium',10,82),
('Assister au final d''une parade','Spectacles','medium',10,83),
('Repérer un symbole répété dans un décor','Détails cachés','rare',20,84),
('Faire une attraction avec toute la famille','Attractions','medium',10,85),
('Trouver un banc avec une jolie vue','Décors','easy',5,86),
('Voir un visiteur dormir debout dans une file','Comportements','rare',20,87),
('Repérer un objet en édition limitée','Boutiques','rare',20,88),
('Reconnaître une chanson sans voir l''écran','Spectacles','medium',10,89),
('Trouver un visage caché dans la décoration','Détails cachés','rare',20,90),
('Faire une attraction avec une chute','Attractions','medium',10,91),
('Photographier une enseigne rétro','Décors','medium',10,92),
('Voir une famille entière avec des oreilles','Comportements','medium',10,93),
('Goûter une viennoiserie du parc','Nourriture','easy',5,94),
('Trouver une peluche d''un personnage méchant','Boutiques','medium',10,95),
('Voir des bulles ou des confettis pendant un show','Spectacles','medium',10,96),
('Repérer une date ou une année gravée quelque part','Détails cachés','rare',20,97),
('Réussir la photo de groupe la plus drôle de la journée','Comportements','easy',5,98),
('Boire dans un gobelet souvenir','Nourriture','medium',10,99),
('Voir le château illuminé à la tombée de la nuit','Décors','rare',20,100);

-- ── SEED : 100 missions Agent Secret (easy=10 · medium=30 · hard=50) ─────────
delete from public.agent_missions;
insert into public.agent_missions (title, description, difficulty, points) values
('Le mot magique','Faire dire le mot "magique" à un membre de ton équipe','easy',10),
('Trois selfies','Obtenir un selfie avec 3 personnes différentes du groupe','easy',10),
('Écho de Mickey','Faire dire "Mickey" à deux personnes de ton équipe','medium',30),
('Photographe de l''ombre','Prendre une photo discrète de chaque membre du groupe sans qu''ils s''en aperçoivent','hard',50),
('Le bâilleur','Provoquer un bâillement chez 3 personnes en bâillant toi-même','medium',30),
('Distributeur de compliments','Faire un vrai compliment à 5 personnes différentes dans la journée','easy',10),
('Le sondage discret','Demander à 3 personnes leur attraction préférée sans dire pourquoi','easy',10),
('Obsession bleue','Faire remarquer la couleur bleue 3 fois sans éveiller les soupçons','medium',30),
('Tournée de high-five','Réussir un high-five avec chaque membre de l''équipe','medium',30),
('Le surnom contagieux','Donner un surnom rigolo à un collègue et le faire reprendre par un autre','hard',50),
('Collectionneur de rires','Faire rire 4 personnes différentes du groupe','medium',30),
('Le statisticien','Compter combien de personnes du groupe portent du noir, et l''annoncer mine de rien','easy',10),
('Maître du selfie de groupe','Organiser une photo de groupe sans expliquer que c''est ta mission','medium',30),
('Le placeur de mots','Glisser le mot "banane" dans une conversation sans que personne ne réagisse','medium',30),
('Champion du "Tu as vu ?"','Dire "Tu as vu ça ?!" à 4 personnes en pointant quelque chose','easy',10),
('Le copieur','Imiter discrètement la posture de la personne en face de toi pendant 1 minute','medium',30),
('Détective des prénoms','Faire dire son prénom complet à 3 collègues','easy',10),
('Le météorologue','Parler de la météo à 3 personnes différentes','easy',10),
('Voleur de sourire','Faire sourire quelqu''un qui faisait la tête','medium',30),
('Le chef d''orchestre','Faire taper dans les mains au moins 2 personnes en même temps que toi','medium',30),
('Mission chapeau','Faire essayer un chapeau de boutique à un membre de l''équipe','medium',30),
('Le marathonien des câlins','Obtenir un câlin amical de 3 personnes','medium',30),
('L''espion gourmand','Goûter à la nourriture de 2 personnes différentes (avec leur accord)','easy',10),
('Le poète','Faire une rime avec le prénom d''un collègue à voix haute','medium',30),
('Maître du clin d''œil','Faire un clin d''œil à 5 membres du groupe sans te faire griller','medium',30),
('Le reporter','Interviewer un collègue sur sa journée comme un journaliste, 30 secondes','medium',30),
('Collectionneur d''accents','Parler avec un accent pendant une conversation entière sans que personne ne le relève','hard',50),
('Le guide touristique','Improviser une explication (inventée) sur un décor à 2 personnes','medium',30),
('Mission peluche','Faire prendre une peluche en photo à un collègue','easy',10),
('Le synchroniseur','Réussir à marcher au pas avec quelqu''un pendant 20 secondes','medium',30),
('L''annonceur','Annoncer l''heure à voix haute 3 fois dans la journée','easy',10),
('Le faux indécis','Faire semblant d''hésiter très longtemps devant un choix pour amuser le groupe','easy',10),
('Maître du toast','Lancer un "Santé !" suivi par au moins 3 personnes','medium',30),
('Le collectionneur de pouces','Obtenir un pouce levé de 4 personnes','easy',10),
('Mission selfie raté','Réussir le selfie de groupe le plus moche possible','medium',30),
('Le placeur d''expression','Faire dire "C''est magique !" à quelqu''un','medium',30),
('L''ombre fidèle','Suivre discrètement un membre du groupe pendant 2 minutes sans qu''il le remarque','hard',50),
('Le compteur de pas','Proposer un défi de qui marche le plus, à 2 personnes','easy',10),
('Maître des surnoms d''attractions','Inventer un surnom à une attraction et le faire utiliser par un autre','hard',50),
('Le distributeur d''eau','Proposer de l''eau à 3 personnes différentes','easy',10),
('Le fan n°1','Faire semblant d''être super fan d''un détail banal et convaincre quelqu''un','medium',30),
('Le photographe de pieds','Prendre en photo les chaussures de 4 personnes du groupe','medium',30),
('L''imitateur de personnage','Imiter la démarche d''un personnage Disney sans te faire repérer comme une mission','medium',30),
('Le collectionneur de "Wow"','Faire dire "Wow" à 3 personnes','easy',10),
('Mission point commun','Trouver un point commun surprenant avec 2 collègues','medium',30),
('Le maître du suspense','Commencer une histoire et t''arrêter au moment crucial, 2 fois','medium',30),
('Le compteur de poussettes','Annoncer combien de poussettes tu as croisées, mine de rien','easy',10),
('Le challenger','Proposer un pierre-feuille-ciseaux à 3 personnes','easy',10),
('Maître du "Regarde derrière toi"','Faire retourner 3 personnes en disant "Regarde !"','easy',10),
('Le parfumeur','Faire sentir un truc (glace, parfum de boutique) à 2 personnes','easy',10),
('L''organisateur secret','Décider d''une prochaine attraction sans que le groupe sache que ça vient de toi','hard',50),
('Le collectionneur de selfies déguisés','Prendre un selfie en faisant une grimace avec 3 personnes','medium',30),
('Le placeur de "Dasolabs"','Glisser le mot "Dasolabs" dans 3 conversations','medium',30),
('Le faux perdu','Faire semblant d''être perdu 10 secondes pour amuser le groupe','easy',10),
('Maître du "On se prend en photo ?"','Initier 3 photos différentes dans la journée','easy',10),
('Le collectionneur de high-five glissés','Réussir un "tope-là qui glisse" avec 2 personnes','medium',30),
('L''as du compliment d''attraction','Convaincre quelqu''un qu''une attraction banale est la meilleure','medium',30),
('Le silencieux','Rester sans parler pendant 3 minutes sans que personne ne le remarque','hard',50),
('Le sondeur de glaces','Demander à 3 personnes leur parfum de glace préféré','easy',10),
('Le maître du selfie miroir','Te prendre en photo dans un reflet (vitrine, eau)','easy',10),
('Le distributeur de surnoms d''équipe','Faire adopter un nom d''équipe rigolo au groupe','hard',50),
('Le collectionneur de "C''est trop bien"','Faire dire "C''est trop bien !" à 3 personnes','easy',10),
('L''imitateur de rire','Copier le rire de quelqu''un sans qu''il s''en rende compte','medium',30),
('Le maître du pari','Lancer un pari amical avec 2 personnes','medium',30),
('Le photographe de dos','Prendre 3 personnes en photo de dos sans qu''elles le sachent','medium',30),
('Le placeur de question piège','Poser une question absurde à 2 personnes très sérieusement','medium',30),
('Le collectionneur de pouces en l''air','Réussir une photo où tout le monde lève le pouce','easy',10),
('Le maître du "Chut"','Faire un "chut" mystérieux à 2 personnes sans raison','easy',10),
('Le compteur de ballons','Annoncer combien de ballons tu as vus dans la journée','easy',10),
('L''as de la pose héroïque','Faire prendre une pose de super-héros à un collègue','medium',30),
('Le collectionneur de "À l''aide"','Demander de l''aide pour un truc minuscule à 3 personnes','easy',10),
('Le maître du faux secret','Chuchoter un "secret" inventé et inoffensif à 2 personnes','medium',30),
('Le sondeur d''attractions','Faire voter le groupe pour la prochaine attraction','medium',30),
('Le collectionneur de selfies sérieux','Prendre un selfie ultra sérieux avec 3 personnes','medium',30),
('Le placeur de "incroyable"','Faire dire "incroyable" à 2 personnes','easy',10),
('Le maître du compte à rebours','Lancer un "3, 2, 1…" suivi par le groupe','medium',30),
('Le distributeur d''applaudissements','Déclencher des applaudissements à un moment inattendu','hard',50),
('Le collectionneur de grimaces','Réussir une photo de grimaces avec 4 personnes','medium',30),
('Le faux expert','Donner un faux conseil rigolo et le faire suivre par quelqu''un','hard',50),
('Le maître du "On y va ?"','Donner le signal du départ 3 fois sans que ce soit ton tour','easy',10),
('Le collectionneur de chapeaux','Faire porter un accessoire de boutique à 2 personnes','medium',30),
('Le sondeur de souvenirs','Demander à 3 personnes leur meilleur souvenir de la journée','easy',10),
('Le maître du selfie de loin','Réussir une photo de groupe à bout de bras','easy',10),
('Le placeur de "trop classe"','Faire dire "trop classe" à 2 personnes','easy',10),
('Le chronométreur','Annoncer combien de temps a duré une file d''attente','easy',10),
('Le collectionneur d''emojis vivants','Faire faire un cœur avec les mains à 3 personnes','medium',30),
('Le maître du "Souris !"','Faire sourire le groupe pour une photo sans dire que c''est ta mission','easy',10),
('Le distributeur de défis','Lancer un mini-défi à 2 personnes (qui saute le plus haut…)','medium',30),
('Le collectionneur de "Oh non"','Faire dire "Oh non !" à 2 personnes (gentiment)','easy',10),
('Le maître du selfie panoramique','Prendre une photo qui inclut tout le groupe et le château','hard',50),
('Le placeur de "légendaire"','Glisser le mot "légendaire" dans 2 conversations','medium',30),
('Le sondeur de peurs','Demander à 3 personnes de quelle attraction elles ont le plus peur','easy',10),
('Le maître du faux applaudissement','Applaudir tout seul jusqu''à ce que quelqu''un te suive','medium',30),
('Le collectionneur de poses','Faire prendre la même pose à 3 personnes sur une photo','medium',30),
('Le distributeur de bonne humeur','Dire "Quelle belle journée !" à 4 personnes','easy',10),
('Le maître du surnom de groupe','Trouver un nom de code à ton équipe et le faire dire 3 fois','hard',50),
('Le collectionneur de "Trop drôle"','Faire dire "Trop drôle" à 3 personnes','easy',10),
('Le placeur de "aventure"','Utiliser le mot "aventure" dans 3 phrases sans te faire repérer','medium',30),
('Le maître du final','Réunir tout le groupe pour une dernière photo en fin de journée','medium',30);
