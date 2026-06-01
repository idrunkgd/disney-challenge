-- ============================================================================
--  QUIZ ÉVOLUTIF — 100 questions, 5 niveaux de 20 (difficulty 1 → 5)
--  Public : enfants 5–11 ans. Max 2 questions par film, large variété de dessins animés.
--  Points = 10 × difficulty : Facile 10 · Moyenne 20 · Difficile 30 · Expert 40 · Impossible 50
--  À exécuter dans Supabase → SQL Editor. Remplace toutes les questions existantes.
--  Bonne réponse saisie en 1re position, puis mélangée par le bloc final.
-- ============================================================================

delete from public.quiz_questions;

insert into public.quiz_questions (question, options, correct_index, difficulty) values
-- ── NIVEAU 1 · FACILE ───────────────────────────────────────────────────────
('Dans "Le Roi Lion", quel est le lionceau héros ?', '["Simba","Mufasa","Scar","Nala"]', 0, 1),
('Dans "La Reine des Neiges", comment s''appelle la sœur d''Elsa ?', '["Anna","Raiponce","Mérida","Vaiana"]', 0, 1),
('Quelle jeune fille traverse l''océan en bateau pour sauver son île ?', '["Vaiana","Elsa","Raiponce","Mérida"]', 0, 1),
('Dans "Toy Story", quel jouet est un cowboy ?', '["Woody","Buzz","Rex","Jessie"]', 0, 1),
('Dans "Cars", quelle voiture rouge est l''héroïne ?', '["Flash McQueen","Martin","Sally","Doc"]', 0, 1),
('Quel petit poisson-clown se perd dans l''océan et que son papa recherche partout ?', '["Nemo","Dory","Marin","Bruce"]', 0, 1),
('Quel petit extraterrestre bleu devient l''ami d''une fillette hawaïenne ?', '["Stitch","Lilo","Jumba","Pleakley"]', 0, 1),
('Dans "Aladdin", quel personnage bleu exauce les vœux ?', '["Le Génie","Jafar","Iago","Abu"]', 0, 1),
('Dans "La Petite Sirène", comment s''appelle la sirène ?', '["Ariel","Ursula","Polochon","Sébastien"]', 0, 1),
('Quelle héroïne adore lire et vit dans un château avec des objets qui parlent ?', '["Belle","Aurore","Cendrillon","Jasmine"]', 0, 1),
('Quelle princesse est enfermée dans une tour avec de très longs cheveux magiques ?', '["Raiponce","Anna","Mérida","Vaiana"]', 0, 1),
('Quel éléphanteau aux grandes oreilles sait voler ?', '["Dumbo","Babar","Horton","Tantor"]', 0, 1),
('Dans "Le Livre de la Jungle", quel petit garçon vit avec les animaux ?', '["Mowgli","Tarzan","Peter","Aladdin"]', 0, 1),
('Dans "Encanto", comment s''appelle la famille magique ?', '["Madrigal","Mendoza","Garcia","Lopez"]', 0, 1),
('Quel ours adore par-dessus tout le miel ?', '["Winnie","Baloo","Petit Jean","Bernard"]', 0, 1),
('Dans "Monstres & Cie", comment s''appelle la petite fille ?', '["Bouh","Riley","Vanellope","Dot"]', 0, 1),
('Dans "Vice-Versa", quelle émotion est toute jaune et joyeuse ?', '["Joie","Tristesse","Colère","Peur"]', 0, 1),
('Dans "Ratatouille", quel petit rat veut devenir cuisinier ?', '["Rémy","Émile","Django","Gusteau"]', 0, 1),
('Quelle princesse perd une pantoufle de verre ?', '["Cendrillon","Aurore","Blanche-Neige","Belle"]', 0, 1),
('Quel chien fidèle est le compagnon de Mickey ?', '["Pluto","Dingo","Donald","Tic"]', 0, 1),

-- ── NIVEAU 2 · MOYENNE ──────────────────────────────────────────────────────
('Dans "Le Roi Lion", quel phacochère est l''ami de Timon ?', '["Pumbaa","Zazu","Rafiki","Nala"]', 0, 2),
('Dans "La Reine des Neiges", comment s''appelle le bonhomme de neige ?', '["Olaf","Sven","Kristoff","Hans"]', 0, 2),
('Dans "Toy Story", quel jouet est un ranger de l''espace ?', '["Buzz l''Éclair","Woody","Zurg","Rex"]', 0, 2),
('Dans "Vaiana", quel demi-dieu tatoué l''accompagne ?', '["Maui","Tamatoa","Heihei","Pua"]', 0, 2),
('Dans "Coco", quel garçon rêve de faire de la musique ?', '["Miguel","Hector","Ernesto","Dante"]', 0, 2),
('Dans "Zootopie", quelle lapine devient policière ?', '["Judy","Nick","Flash","Bogo"]', 0, 2),
('Dans "Les Nouveaux Héros", comment s''appelle le gros robot blanc tout gonflé ?', '["Baymax","Hiro","Tadashi","Fred"]', 0, 2),
('Dans "Rebelle", quelle princesse écossaise adore le tir à l''arc ?', '["Mérida","Elsa","Anna","Raiponce"]', 0, 2),
('Quelle guerrière chinoise part à l''armée à la place de son père ?', '["Mulan","Pocahontas","Jasmine","Tiana"]', 0, 2),
('Dans "La Princesse et la Grenouille", qui rêve d''ouvrir un restaurant ?', '["Tiana","Mulan","Jasmine","Pocahontas"]', 0, 2),
('Dans "Aladdin", quel perroquet accompagne Jafar ?', '["Iago","Abu","Zazu","Hugo"]', 0, 2),
('Dans "Le Monde de Nemo", quel poisson bleu oublie tout ?', '["Dory","Marin","Bruce","Gill"]', 0, 2),
('Dans "Cars", quelle dépanneuse rouillée est la meilleure amie de Flash ?', '["Martin","Sally","Luigi","Guido"]', 0, 2),
('Dans "Les Indestructibles", quel bébé a plein de super-pouvoirs ?', '["Jack-Jack","Flèche","Violette","Bob"]', 0, 2),
('Dans "Là-haut", qui fait voler sa maison avec des ballons ?', '["Carl","Russell","Kevin","Dug"]', 0, 2),
('Dans "Peter Pan", quelle petite fée est son amie ?', '["Clochette","Wendy","Lily","Aurore"]', 0, 2),
('Quel homme a été élevé par les gorilles au cœur de la jungle ?', '["Tarzan","Mowgli","Hercule","Aladdin"]', 0, 2),
('Combien de nains vivent avec Blanche-Neige ?', '["Sept","Cinq","Six","Huit"]', 0, 2),
('Dans "Hercule", quel cheval a des ailes ?', '["Pégase","Maximus","Samson","Khan"]', 0, 2),
('Dans "Pocahontas", quel petit raton laveur la suit partout ?', '["Meeko","Flit","Percy","Pascal"]', 0, 2),

-- ── NIVEAU 3 · DIFFICILE ────────────────────────────────────────────────────
('Dans "Raiponce", quel caméléon est son ami ?', '["Pascal","Maximus","Meeko","Flit"]', 0, 3),
('Dans "Encanto", quel membre de la famille ne doit-on "pas mentionner" ?', '["Bruno","Félix","Camilo","Antonio"]', 0, 3),
('Dans "Les Mondes de Ralph", quel grand costaud au grand cœur casse tout ?', '["Ralph","Felix","Calhoun","Sonic"]', 0, 3),
('Dans "Luca", le héros est en réalité un... ?', '["Monstre marin","Robot","Fantôme","Dragon"]', 0, 3),
('Dans "Alerte Rouge", en quel animal Mei se transforme-t-elle ?', '["Un panda roux","Un tigre","Un renard","Un chat"]', 0, 3),
('Dans "En Avant", comment s''appelle le jeune elfe héros ?', '["Ian","Barley","Wilden","Colt"]', 0, 3),
('Dans "Soul", quel est le métier de Joe ?', '["Musicien de jazz","Cuisinier","Pompier","Médecin"]', 0, 3),
('Quelle guerrière part chercher le dernier dragon pour sauver son royaume ?', '["Raya","Namaari","Sisu","Boun"]', 0, 3),
('Dans "Vice-Versa", quelle émotion est toute bleue ?', '["Tristesse","Joie","Colère","Peur"]', 0, 3),
('Dans "Monstres & Cie", quel petit monstre vert à un œil est l''ami de Sulli ?', '["Bob Razowski","Randall","Roz","Fungus"]', 0, 3),
('Dans "Ratatouille", quel critique culinaire fait très peur aux cuisiniers ?', '["Ego","Skinner","Linguini","Gusteau"]', 0, 3),
('Dans "La Belle et la Bête", quel objet est le chandelier ?', '["Lumière","Big Ben","Zip","Sultan"]', 0, 3),
('Dans "Hercule", qui entraîne le héros à devenir fort ?', '["Phil","Zeus","Hadès","Pégase"]', 0, 3),
('Dans "Le Livre de la Jungle", quelle panthère noire veille sur Mowgli ?', '["Bagheera","Baloo","Shere Khan","Kaa"]', 0, 3),
('Dans "Les 101 Dalmatiens", quelle méchante veut voler les chiots ?', '["Cruella d''Enfer","Ursula","Maléfique","Yzma"]', 0, 3),
('Dans "Kuzco", l''empereur est transformé en quel animal ?', '["Un lama","Un âne","Un chameau","Un cheval"]', 0, 3),
('Dans "Rox et Rouky", quel animal est Rox ?', '["Un renard","Un chien","Un ours","Un loup"]', 0, 3),
('Dans le "Robin des Bois" de Disney, quel animal est Robin ?', '["Un renard","Un ours","Un lion","Un loup"]', 0, 3),
('Dans "Frère des Ours", le héros est transformé en... ?', '["Un ours","Un loup","Un aigle","Un cerf"]', 0, 3),
('Dans "Volt", le héros est un chien star de... ?', '["La télévision","La radio","Cirque","L''école"]', 0, 3),

-- ── NIVEAU 4 · EXPERT ───────────────────────────────────────────────────────
('Dans "Lilo & Stitch", quel est le numéro d''expérience de Stitch ?', '["626","007","101","42"]', 0, 4),
('Dans "Coco", comment s''appelle le chien sans poils de Miguel ?', '["Dante","Pepita","Hector","Ernesto"]', 0, 4),
('Dans "Zootopie", quel renard rusé devient l''ami de Judy ?', '["Nick","Finnick","Flash","Bogo"]', 0, 4),
('Dans "Les Nouveaux Héros", comment s''appelle le garçon génie ?', '["Hiro","Tadashi","Fred","Wasabi"]', 0, 4),
('Dans "Mulan", comment s''appelle le petit dragon rouge ?', '["Mushu","Cri-Kee","Khan","Shan"]', 0, 4),
('Dans "La Princesse et la Grenouille", dans quelle ville vit Tiana ?', '["La Nouvelle-Orléans","New York","Paris","Agrabah"]', 0, 4),
('Dans "Les Indestructibles", quel enfant court super vite ?', '["Flèche","Violette","Jack-Jack","Bob"]', 0, 4),
('Dans "Là-haut", comment s''appelle le jeune explorateur joufflu ?', '["Russell","Carl","Dug","Kevin"]', 0, 4),
('Dans "Peter Pan", comment s''appelle le pays où l''on ne grandit jamais ?', '["Le Pays Imaginaire","Narnia","Atlantica","Agrabah"]', 0, 4),
('Dans "Pocahontas", comment s''appelle le colon dont elle tombe amoureuse ?', '["John Smith","Ratcliffe","Thomas","Kocoum"]', 0, 4),
('Dans "Les Mondes de Ralph", comment s''appelle la petite pilote de kart ?', '["Vanellope","Calhoun","Taffyta","Candlehead"]', 0, 4),
('Dans "Raya", comment s''appelle la dernière dragonne bleue ?', '["Sisu","Namaari","Tuk Tuk","Boun"]', 0, 4),
('Dans "Rebelle", en quel animal la maman de Mérida se transforme-t-elle ?', '["Un ours","Un loup","Un cerf","Un aigle"]', 0, 4),
('Avec quel objet empoisonné endort-on Blanche-Neige ?', '["Une pomme","Une poire","Un gâteau","Une fleur"]', 0, 4),
('Dans "Le Bossu de Notre-Dame", qui sonne les cloches de la cathédrale ?', '["Quasimodo","Frollo","Phoebus","Clopin"]', 0, 4),
('Dans ce film Disney, quelle cité engloutie sous l''océan part-on explorer ?', '["Atlantide","El Dorado","Agrabah","Narnia"]', 0, 4),
('Dans "Les Aristochats", comment s''appelle la chatte blanche élégante ?', '["Duchesse","Marie","Berlioz","Toulouse"]', 0, 4),
('Dans "Bernard et Bianca", les deux héros sont des... ?', '["Souris","Lapins","Écureuils","Chats"]', 0, 4),
('Dans "Dingo et Max", Max est le fils de... ?', '["Dingo","Donald","Mickey","Pat Hibulaire"]', 0, 4),
('Dans "Volt", comment s''appelle le hamster dans sa boule, grand fan de Volt ?', '["Rhino","Mitaine","Penny","Bolt"]', 0, 4),

-- ── NIVEAU 5 · IMPOSSIBLE ───────────────────────────────────────────────────
('Dans "La Petite Sirène", quel crabe chante "Sous l''océan" ?', '["Sébastien","Polochon","Eustache","Triton"]', 0, 5),
('Dans "Dumbo", comment s''appelle la petite souris, son amie ?', '["Timothée","Jaq","Gus","Bernard"]', 0, 5),
('Dans "Winnie l''ourson", comment s''appelle le petit cochon timide ?', '["Porcinet","Tigrou","Bourriquet","Coco Lapin"]', 0, 5),
('Dans "Cendrillon", comment s''appelle le chat méchant de la marâtre ?', '["Lucifer","Figaro","Berlioz","Oliver"]', 0, 5),
('Dans "Tarzan", quelle gorille élève Tarzan comme son fils ?', '["Kala","Terk","Kerchak","Tantor"]', 0, 5),
('Dans "Luca", comment s''appelle le meilleur ami monstre marin de Luca ?', '["Alberto","Giulia","Ercole","Massimo"]', 0, 5),
('Dans "Soul", quelle âme ne veut surtout pas aller vivre sur Terre ?', '["22","42","7","100"]', 0, 5),
('Dans "En Avant", les deux frères veulent revoir leur... ?', '["Papa","Maman","Grand-père","Oncle"]', 0, 5),
('Dans "Kuzco", comment s''appelle l''assistant tout musclé d''Yzma ?', '["Kronk","Pacha","Bucky","Rudy"]', 0, 5),
('Dans "Rox et Rouky", quel animal est Rouky ?', '["Un chien","Un renard","Un ours","Un loup"]', 0, 5),
('Dans le "Robin des Bois" de Disney, quel animal est Petit Jean ?', '["Un ours","Un renard","Un loup","Un lion"]', 0, 5),
('Dans "Frère des Ours", comment s''appelle le petit ourson très bavard ?', '["Koda","Kenai","Denahi","Sitka"]', 0, 5),
('Dans "Pinocchio", quel grillon sert de conscience au pantin ?', '["Jiminy Cricket","Cri-Kee","Timothée","Gus"]', 0, 5),
('Dans "Bambi", comment s''appelle le petit lapin, ami de Bambi ?', '["Panpan","Fleur","Féline","Bambi"]', 0, 5),
('Dans "La Belle au bois dormant", comment s''appelle la princesse ?', '["Aurore","Belle","Cendrillon","Jasmine"]', 0, 5),
('Dans "Oliver et Compagnie", Oliver est un petit... ?', '["Chaton","Chiot","Renardeau","Ourson"]', 0, 5),
('Dans "La Ferme se rebelle", les héroïnes sont des... ?', '["Vaches","Poules","Chèvres","Brebis"]', 0, 5),
('Dans "Wish", comment s''appelle la jeune héroïne ?', '["Asha","Raya","Mirabel","Vaiana"]', 0, 5),
('Dans "Alerte Rouge", comment s''appelle l''héroïne qui devient un panda roux ?', '["Mei","Ming","Miriam","Abby"]', 0, 5),
('Dans "Zootopie", comment s''appelle le paresseux très très lent du guichet ?', '["Flash","Nick","Finnick","Bogo"]', 0, 5);

-- ── Mélange des réponses (la bonne n'est plus toujours en 1re position) ──────
do $$
declare
  r record; correct_val text; shuffled jsonb; new_idx int;
begin
  for r in select id, options, correct_index from public.quiz_questions loop
    correct_val := r.options->>r.correct_index;
    select jsonb_agg(e order by random()) into shuffled
      from jsonb_array_elements(r.options) e;
    select pos - 1 into new_idx
      from jsonb_array_elements_text(shuffled) with ordinality as t(val, pos)
      where val = correct_val limit 1;
    update public.quiz_questions set options = shuffled, correct_index = new_idx where id = r.id;
  end loop;
end $$;
