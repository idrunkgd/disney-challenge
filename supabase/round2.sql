-- ============================================================================
--  ROUND 2 : clôture des jeux + nouveau Quiz (Disney ancienne génération) + Pendu
--  TOUS LES POINTS SONT CONSERVÉS (aucune réponse / score supprimé).
--  Quiz & Pendu : on DÉSACTIVE l'ancien contenu et on insère le nouveau.
--  Image Mystère : tu gères la nouvelle image toi-même (admin).
--  À exécuter dans Supabase → SQL Editor.
-- ============================================================================

-- ── ÉTAT DES JEUX (ouvert / clôturé), pour pouvoir figer un jeu ──────────────
create table if not exists public.game_state (
  game    text primary key,           -- 'quiz' | 'mystery' | 'pendu'
  is_open boolean not null default true
);
alter table public.game_state enable row level security;
drop policy if exists "read_game_state" on public.game_state;
create policy "read_game_state" on public.game_state for select using (true);
insert into public.game_state (game, is_open) values ('quiz', true), ('mystery', true), ('pendu', true)
on conflict (game) do nothing;

-- ── Clôture de l'ancien contenu (les points restent acquis) ─────────────────
update public.quiz_questions set is_active = false;
update public.hangman_words set is_active = false;

-- ── NOUVEAU QUIZ : 100 questions, 50 films × 2, Disney ancienne génération ───
insert into public.quiz_questions (question, options, correct_index, difficulty) values
-- NIVEAU 1 · FACILE (films les plus connus)
('Quel est le lionceau héros du "Roi Lion" ?','["Simba","Mufasa","Scar","Timon"]',0,1),
('Quel petit garçon est élevé par les loups dans "Le Livre de la Jungle" ?','["Mowgli","Tarzan","Peter","Aladdin"]',0,1),
('Comment s''appelle la petite sirène ?','["Ariel","Ursula","Aurore","Jasmine"]',0,1),
('Quel personnage bleu exauce les vœux d''Aladdin ?','["Le Génie","Jafar","Iago","Abu"]',0,1),
('Quelle princesse perd une pantoufle de verre ?','["Cendrillon","Aurore","Blanche-Neige","Belle"]',0,1),
('Combien de nains hébergent Blanche-Neige ?','["Sept","Cinq","Six","Huit"]',0,1),
('Quel éléphanteau aux grandes oreilles sait voler ?','["Dumbo","Babar","Horton","Tantor"]',0,1),
('En quoi rêve de se transformer le pantin Pinocchio ?','["Un vrai petit garçon","Un oiseau","Un robot","Un chat"]',0,1),
('Quelle petite fée accompagne Peter Pan ?','["Clochette","Wendy","Lily","Aurore"]',0,1),
('Quels animaux sont les héros des "101 Dalmatiens" ?','["Des chiens","Des chats","Des lapins","Des renards"]',0,1),
('Quelle jeune femme part à l''armée à la place de son père ?','["Mulan","Pocahontas","Jasmine","Tiana"]',0,1),
('Dans le "Robin des Bois" de Disney, quel animal est Robin ?','["Un renard","Un ours","Un loup","Un lion"]',0,1),
('Quels animaux sont les "Aristochats" ?','["Des chats","Des chiens","Des lapins","Des souris"]',0,1),
('Quel animal est Bambi ?','["Un faon","Un lapin","Un renard","Un ourson"]',0,1),
('Que fait Belle plus que tout dans "La Belle et la Bête" ?','["Lire","Danser","Coudre","Cuisiner"]',0,1),
('Qu''adore manger Winnie l''ourson ?','["Le miel","Les carottes","Le chocolat","Les pommes"]',0,1),
('Hercule est le fils de quel grand dieu ?','["Zeus","Hadès","Poséidon","Apollon"]',0,1),
('Par quels animaux Tarzan est-il élevé ?','["Des gorilles","Des lions","Des loups","Des ours"]',0,1),
('Comment s''appelle la princesse de "La Belle au Bois Dormant" ?','["Aurore","Cendrillon","Blanche-Neige","Belle"]',0,1),
('Quelle princesse amérindienne rencontre John Smith ?','["Pocahontas","Mulan","Jasmine","Tiana"]',0,1),
-- NIVEAU 2 · MOYENNE (mêmes films, personnage secondaire)
('Quel phacochère chante "Hakuna Matata" avec Timon ?','["Pumbaa","Zazu","Rafiki","Nala"]',0,2),
('Quel ours bon vivant apprend la vie à Mowgli ?','["Baloo","Bagheera","Shere Khan","Kaa"]',0,2),
('Quel crabe musicien veille sur Ariel ?','["Sébastien","Polochon","Eustache","Triton"]',0,2),
('Quel perroquet bavard accompagne Jafar ?','["Iago","Abu","Zazu","Hugo"]',0,2),
('Comment s''appelle le chat méchant de la marâtre de Cendrillon ?','["Lucifer","Figaro","Berlioz","Oliver"]',0,2),
('Comment Blanche-Neige est-elle réveillée de son sommeil ?','["Par un baiser du prince","Par une potion","Par une chanson","Par la pluie"]',0,2),
('Quelle petite souris est l''amie de Dumbo ?','["Timothée","Jaq","Gus","Bernard"]',0,2),
('Quel grillon est la conscience de Pinocchio ?','["Jiminy Cricket","Cri-Kee","Timothée","Gus"]',0,2),
('Qui est le grand ennemi de Peter Pan ?','["Le Capitaine Crochet","Mr Mouche","Mowgli","Baloo"]',0,2),
('Quelle méchante veut voler les chiots dalmatiens ?','["Cruella d''Enfer","Ursula","Maléfique","Yzma"]',0,2),
('Quel petit dragon rouge aide Mulan ?','["Mushu","Cri-Kee","Khan","Shan"]',0,2),
('Quel animal est Petit Jean, l''ami de Robin des Bois ?','["Un ours","Un renard","Un loup","Un lion"]',0,2),
('Comment s''appelle la chatte blanche élégante des "Aristochats" ?','["Duchesse","Marie","Berlioz","Toulouse"]',0,2),
('Quel petit lapin est l''ami de Bambi ?','["Panpan","Fleur","Féline","Bambi"]',0,2),
('Quel objet est le chandelier dans "La Belle et la Bête" ?','["Lumière","Big Ben","Zip","Sultan"]',0,2),
('Quel petit cochon timide est l''ami de Winnie l''ourson ?','["Porcinet","Tigrou","Bourriquet","Coco Lapin"]',0,2),
('Quel cheval ailé est l''ami d''Hercule ?','["Pégase","Maximus","Samson","Khan"]',0,2),
('Quelle femelle gorille élève Tarzan comme son fils ?','["Kala","Terk","Kerchak","Tantor"]',0,2),
('Quelle méchante fée jette un sort à la princesse Aurore ?','["Maléfique","Cruella","Ursula","Yzma"]',0,2),
('Quel petit raton laveur suit Pocahontas partout ?','["Meeko","Flit","Percy","Pascal"]',0,2),
-- NIVEAU 3 · DIFFICILE (films un peu moins connus)
('Qui sonne les cloches dans "Le Bossu de Notre-Dame" ?','["Quasimodo","Frollo","Phoebus","Clopin"]',0,3),
('Quel est le numéro d''expérience de Stitch ?','["626","007","101","42"]',0,3),
('En quel animal le héros de "Frère des Ours" est-il transformé ?','["Un ours","Un loup","Un aigle","Un cerf"]',0,3),
('En quel animal l''empereur Kuzco est-il transformé ?','["Un lama","Un âne","Un chameau","Un cheval"]',0,3),
('Quelle cité engloutie part-on chercher dans "Atlantide" ?','["Atlantide","El Dorado","Agrabah","Narnia"]',0,3),
('Quel jeune garçon devient roi dans "Merlin l''Enchanteur" ?','["Arthur","Lancelot","Merlin","Archimède"]',0,3),
('De quelle race est la chienne Dame dans "La Belle et le Clochard" ?','["Cocker","Caniche","Berger","Labrador"]',0,3),
('Quels petits animaux sauveteurs sont Bernard et Bianca ?','["Des souris","Des lapins","Des écureuils","Des chats"]',0,3),
('Quel animal poursuit Alice au début d''"Alice au Pays des Merveilles" ?','["Le Lapin Blanc","Le Chat","Le Lièvre","Le Loir"]',0,3),
('Quelle est la profession de Mary Poppins ?','["Nounou","Institutrice","Cuisinière","Chanteuse"]',0,3),
('Dans quelle ville se déroule "La Princesse et la Grenouille" ?','["La Nouvelle-Orléans","New York","Paris","Agrabah"]',0,3),
('Quel jouet cowboy est le héros du tout premier "Toy Story" ?','["Woody","Buzz","Rex","Jessie"]',0,3),
('Quel grand monstre bleu à cornes est la vedette de "Monstres & Cie" ?','["Sulli","Bob Razowski","Randall","Boo"]',0,3),
('Quel petit poisson-clown se perd dans "Le Monde de Nemo" ?','["Nemo","Dory","Marin","Bruce"]',0,3),
('Quel rat veut devenir grand cuisinier dans "Ratatouille" ?','["Rémy","Émile","Django","Gusteau"]',0,3),
('Quel bébé aux multiples pouvoirs surprend dans "Les Indestructibles" ?','["Jack-Jack","Flèche","Violette","Bob"]',0,3),
('Quelle petite fourmi inventive est le héros de "1001 Pattes" ?','["Tilt","Atta","Heimlich","Le Borgne"]',0,3),
('Quel apprenti sorcier maladroit anime des balais dans "Fantasia" ?','["Mickey","Donald","Dingo","Pluto"]',0,3),
('Dans "Dingo et Max", de qui Max est-il le fils ?','["Dingo","Donald","Mickey","Pat Hibulaire"]',0,3),
('Quel animal est Rox, le héros de "Rox et Rouky" ?','["Un renardeau","Un chiot","Un ourson","Un louveteau"]',0,3),
-- NIVEAU 4 · EXPERT (2e question des films du niveau 3)
('Comment s''appelle la bohémienne du "Bossu de Notre-Dame" ?','["Esmeralda","Aurore","Jasmine","Belle"]',0,4),
('Sur quelle île vivent Lilo et Stitch ?','["Hawaï","Tahiti","La Jamaïque","La Corse"]',0,4),
('Comment s''appelle le petit ourson très bavard de "Frère des Ours" ?','["Koda","Kenai","Denahi","Sitka"]',0,4),
('Quel assistant tout musclé sert la sorcière Yzma dans "Kuzco" ?','["Kronk","Pacha","Bucky","Rudy"]',0,4),
('Quel jeune linguiste mène l''expédition dans "Atlantide, l''empire perdu" ?','["Milo","Kida","Rourke","Vinny"]',0,4),
('Quel hibou savant accompagne Merlin l''Enchanteur ?','["Archimède","Hugo","Iago","Hedwige"]',0,4),
('Comment s''appellent les deux chats siamois farceurs de "La Belle et le Clochard" ?','["Si et Am","Lucifer","Figaro","Berlioz"]',0,4),
('Comment s''appelle l''orpheline que sauvent Bernard et Bianca ?','["Penny","Boo","Wendy","Jenny"]',0,4),
('Quel chat farceur disparaît en laissant son sourire dans "Alice" ?','["Le Chat du Cheshire","Le Chapelier","Dinah","Le Loir"]',0,4),
('Quel joyeux ramoneur est l''ami de Mary Poppins ?','["Bert","Michael","George","Jane"]',0,4),
('Quel sorcier vaudou est le méchant de "La Princesse et la Grenouille" ?','["Le Dr Facilier","Hadès","Jafar","Yzma"]',0,4),
('Quel ranger de l''espace devient l''ami de Woody dans "Toy Story" ?','["Buzz l''Éclair","Zurg","Rex","Hamm"]',0,4),
('Quelle petite fille s''attache au monstre Sulli dans "Monstres & Cie" ?','["Bouh","Riley","Dot","Vanellope"]',0,4),
('Quel poisson bleu à la mémoire courte aide Marin dans "Le Monde de Nemo" ?','["Dory","Bruce","Gill","Nigel"]',0,4),
('Quel terrible critique gastronomique fait peur aux cuisiniers de "Ratatouille" ?','["Ego","Skinner","Linguini","Gusteau"]',0,4),
('Quel enfant des "Indestructibles" court à une vitesse incroyable ?','["Flèche","Violette","Jack-Jack","Bob"]',0,4),
('Quelle terrible sauterelle menace la fourmilière dans "1001 Pattes" ?','["Le Borgne","Tilt","Heimlich","Atta"]',0,4),
('Quel chanteur Max veut-il aller voir en concert dans "Dingo et Max" ?','["Powerline","Elvis","Roxanne","Pat"]',0,4),
('Quel animal est Rouky, l''ami de Rox dans "Rox et Rouky" ?','["Un chien","Un renard","Un loup","Un ours"]',0,4),
('Comment s''appelle le grand sorcier dont Mickey emprunte le chapeau magique dans "Fantasia" ?','["Yensid","Merlin","Jafar","Hadès"]',0,4),
-- NIVEAU 5 · IMPOSSIBLE (films rares / personnages très pointus)
('Quelle souris détective enquête dans "Basil, détective privé" ?','["Basil","Ratigan","Dawson","Fidget"]',0,5),
('Quel rat machiavélique est l''ennemi de Basil le détective ?','["Ratigan","Fidget","Dawson","Olivia"]',0,5),
('Quel chien malin de la rue aide le chaton dans "Oliver et Compagnie" ?','["Roublard (Dodger)","Tito","Francis","Rita"]',0,5),
('Quel animal est le petit Oliver dans "Oliver et Compagnie" ?','["Un chaton","Un chiot","Un renardeau","Un raton laveur"]',0,5),
('Quel jeune homme garde des cochons dans "Taram et le Chaudron Magique" ?','["Taram","Lancelot","Gurgi","Arthur"]',0,5),
('Comment s''appelle le terrible méchant de "Taram et le Chaudron Magique" ?','["Le Roi Cornu","Jafar","Hadès","Frollo"]',0,5),
('Quel jeune homme cherche une planète au trésor dans "La Planète au trésor" ?','["Jim Hawkins","John Silver","Milo","Aladar"]',0,5),
('Comment s''appelle le pirate cyborg de "La Planète au trésor" ?','["John Silver","Jim","B.E.N.","Amelia"]',0,5),
('Quel dinosaure est le héros du film "Dinosaure" (2000) ?','["Aladar","Littlefoot","Rex","Baby"]',0,5),
('Par quels animaux le dinosaure Aladar est-il élevé dans "Dinosaure" ?','["Des lémuriens","Des singes","Des oiseaux","Des loups"]',0,5),
('Quelles héroïnes mènent la danse dans "La Ferme se rebelle" ?','["Des vaches","Des poules","Des chèvres","Des brebis"]',0,5),
('Quel voleur de bétail yodleur est le méchant de "La Ferme se rebelle" ?','["Alameda Slim","Ratcliffe","Frollo","McLeach"]',0,5),
('Quel petit animal croit que le ciel lui tombe sur la tête dans "Chicken Little" ?','["Un poussin","Un canard","Un lapin","Un cochon"]',0,5),
('Quelle amie de Chicken Little est un "vilain petit canard" ?','["Abby","Penny","Boo","Dot"]',0,5),
('Quel jeune inventeur orphelin est le héros de "Bienvenue chez les Robinson" ?','["Lewis","Wilbur","Goob","Bowler"]',0,5),
('Quel méchant coiffé d''un chapeau melon poursuit Lewis dans "Bienvenue chez les Robinson" ?','["Le Chapeau Melon","Hadès","Le Roi Cornu","Ratigan"]',0,5),
('Quel immense aigle Cody protège-t-il dans "Bernard et Bianca au pays des kangourous" ?','["Marahute","Zazu","Hugo","Diablo"]',0,5),
('Quel braconnier est le méchant de "Bernard et Bianca au pays des kangourous" ?','["McLeach","Ratcliffe","Alameda Slim","Sykes"]',0,5),
('Quel chien star de la télévision est le héros de "Volt" ?','["Volt","Rex","Pluto","Rhino"]',0,5),
('Quel hamster dans une boule, fan absolu, accompagne "Volt" ?','["Rhino","Mitaine","Penny","Bolt"]',0,5);

-- ── Mélange des réponses (la bonne n'est plus toujours en 1re position) ──────
do $$
declare r record; correct_val text; shuffled jsonb; new_idx int;
begin
  for r in select id, options, correct_index from public.quiz_questions where is_active loop
    correct_val := r.options->>r.correct_index;
    select jsonb_agg(e order by random()) into shuffled from jsonb_array_elements(r.options) e;
    select pos - 1 into new_idx from jsonb_array_elements_text(shuffled) with ordinality as t(val, pos)
      where val = correct_val limit 1;
    update public.quiz_questions set options = shuffled, correct_index = new_idx where id = r.id;
  end loop;
end $$;

-- ── NOUVEAU PENDU : 30 mots Disney ancienne génération ──────────────────────
insert into public.hangman_words (answer, hint) values
('LE ROI LION','Film'),('LE LIVRE DE LA JUNGLE','Film'),('LA PETITE SIRENE','Film'),('ALADDIN','Film'),
('CENDRILLON','Film'),('BLANCHE-NEIGE','Film'),('DUMBO','Film'),('PINOCCHIO','Film'),
('PETER PAN','Film'),('LES ARISTOCHATS','Film'),('MULAN','Film'),('ROBIN DES BOIS','Film'),
('BAMBI','Film'),('LA BELLE ET LA BETE','Film'),('HERCULE','Film'),('TARZAN','Film'),
('POCAHONTAS','Film'),('LE BOSSU DE NOTRE-DAME','Film'),('ROX ET ROUKY','Film'),('LA BELLE AU BOIS DORMANT','Film'),
('SIMBA','Personnage'),('MOWGLI','Personnage'),('ARIEL','Personnage'),('BALOO','Personnage'),
('MUSHU','Personnage'),('QUASIMODO','Personnage'),('BAGHEERA','Personnage'),('SEBASTIEN','Personnage'),
('CRUELLA','Personnage'),('PUMBAA','Personnage');
