-- ============================================================================
--  QUIZ ÉVOLUTIF — 100 questions, 5 niveaux de 20 (difficulty 1 → 5)
--  Points = 10 × difficulty : Facile 10 · Moyenne 20 · Difficile 30 · Expert 40 · Impossible 50
--  À exécuter dans Supabase → SQL Editor. Remplace toutes les questions existantes.
--  La bonne réponse est saisie en 1re position, puis mélangée par le bloc final.
-- ============================================================================

-- Repart d'une base propre (supprime aussi les réponses de quiz liées)
delete from public.quiz_questions;

insert into public.quiz_questions (question, options, correct_index, difficulty) values
-- ── NIVEAU 1 · FACILE ───────────────────────────────────────────────────────
('Quel est le prénom de la Belle dans "La Belle et la Bête" ?', '["Belle","Aurore","Jasmine","Raiponce"]', 0, 1),
('Comment s''appelle le lionceau héros du "Roi Lion" ?', '["Simba","Mufasa","Scar","Nala"]', 0, 1),
('Quel animal est Dumbo ?', '["Un éléphant","Une souris","Un ours","Un cerf"]', 0, 1),
('Quel est le chien, meilleur ami de Mickey ?', '["Pluto","Dingo","Donald","Tic"]', 0, 1),
('Quel poisson cherche son fils Nemo ?', '["Marin","Dory","Bruce","Gill"]', 0, 1),
('Comment s''appelle la sœur d''Elsa dans "La Reine des Neiges" ?', '["Anna","Raiponce","Ariel","Mérida"]', 0, 1),
('Quel est le bonhomme de neige de "La Reine des Neiges" ?', '["Olaf","Sven","Kristoff","Hans"]', 0, 1),
('Quelle princesse perd une pantoufle de verre ?', '["Cendrillon","Blanche-Neige","Aurore","Belle"]', 0, 1),
('Combien de nains accompagnent Blanche-Neige ?', '["Sept","Cinq","Six","Huit"]', 0, 1),
('Quel jouet cowboy est le héros de "Toy Story" ?', '["Woody","Buzz","Rex","Hamm"]', 0, 1),
('Quel ranger dit "Vers l''infini et au-delà" ?', '["Buzz l''Éclair","Woody","Zurg","Rex"]', 0, 1),
('Quel petit singe accompagne Aladdin ?', '["Abu","Iago","Rajah","Jafar"]', 0, 1),
('Comment s''appelle le génie ami d''Aladdin ?', '["Génie","Jafar","Iago","Sultan"]', 0, 1),
('Quelle sirène rêve de vivre sur terre ?', '["Ariel","Ursula","Polochon","Sébastien"]', 0, 1),
('De quelle couleur est Stitch ?', '["Bleu","Vert","Rose","Orange"]', 0, 1),
('Quelle fée est l''amie de Peter Pan ?', '["Clochette","Wendy","Lily","Aurore"]', 0, 1),
('Qui est l''ennemi juré de Peter Pan ?', '["Capitaine Crochet","Mr Mouche","Mowgli","Baloo"]', 0, 1),
('Quel ours adore le miel ?', '["Winnie","Baloo","Petit Jean","Bernard"]', 0, 1),
('Quelle voiture rouge est l''héroïne de "Cars" ?', '["Flash McQueen","Martin","Sally","Doc"]', 0, 1),
('Quel éléphanteau aux grandes oreilles sait voler ?', '["Dumbo","Babar","Horton","Tantor"]', 0, 1),

-- ── NIVEAU 2 · MOYENNE ──────────────────────────────────────────────────────
('Quel crabe chante "Sous l''océan" ?', '["Sébastien","Polochon","Eustache","Triton"]', 0, 2),
('Comment s''appelle le père de Simba ?', '["Mufasa","Scar","Rafiki","Timon"]', 0, 2),
('Quel personnage de "Vice-Versa" représente la joie ?', '["Joie","Tristesse","Colère","Peur"]', 0, 2),
('Quel caméléon accompagne Raiponce ?', '["Pascal","Maximus","Pua","Meeko"]', 0, 2),
('Comment s''appelle le cheval de la garde dans "Raiponce" ?', '["Maximus","Philippe","Samson","Khan"]', 0, 2),
('Quelle guerrière chinoise prend la place de son père à l''armée ?', '["Mulan","Pocahontas","Jasmine","Tiana"]', 0, 2),
('Quel petit dragon accompagne Mulan ?', '["Mushu","Cri-Kee","Khan","Shan"]', 0, 2),
('Quel rat veut devenir cuisinier dans un film Pixar ?', '["Rémy","Émile","Django","Gusteau"]', 0, 2),
('Quel est le nom du robot nettoyeur dans le film Pixar éponyme ?', '["WALL-E","EVE","Auto","M-O"]', 0, 2),
('Quel demi-dieu accompagne Vaiana ?', '["Maui","Tamatoa","Chef Tui","Heihei"]', 0, 2),
('Quel coq un peu bête voyage avec Vaiana ?', '["Heihei","Pua","Tamatoa","Maui"]', 0, 2),
('Quelle reine écossaise préfère le tir à l''arc dans "Rebelle" ?', '["Mérida","Elsa","Anna","Mulan"]', 0, 2),
('Quelle panthère noire est l''amie de Mowgli ?', '["Bagheera","Shere Khan","Baloo","Kaa"]', 0, 2),
('Dans "Le Livre de la Jungle", qui est l''ours bon vivant ?', '["Baloo","Bagheera","Shere Khan","Kaa"]', 0, 2),
('Quel serpent hypnotiseur menace Mowgli ?', '["Kaa","Shere Khan","Baloo","Hathi"]', 0, 2),
('Quel tigre est le grand méchant du "Livre de la Jungle" ?', '["Shere Khan","Kaa","Baloo","Bagheera"]', 0, 2),
('Quelle dépanneuse est l''amie de Flash McQueen ?', '["Martin","Sally","Luigi","Guido"]', 0, 2),
('Qui est le meilleur ami de Sulli dans "Monstres & Cie" ?', '["Bob Razowski","Randall","Boo","Roz"]', 0, 2),
('Quelle petite fille s''attache à Sulli ?', '["Boo","Riley","Dot","Vanellope"]', 0, 2),
('Quelle famille possède des pouvoirs magiques dans "Encanto" ?', '["Madrigal","Pixar","Mendoza","Garcia"]', 0, 2),

-- ── NIVEAU 3 · DIFFICILE ────────────────────────────────────────────────────
('Quel est le métier rêvé de Tiana dans "La Princesse et la Grenouille" ?', '["Restauratrice","Chanteuse","Couturière","Médecin"]', 0, 3),
('Quel est le pouvoir de Violette dans "Les Indestructibles" ?', '["Invisibilité","Super-force","Vitesse","Élasticité"]', 0, 3),
('Comment le vieil homme fait-il voler sa maison dans "Là-haut" ?', '["Avec des ballons","Avec un moteur","Avec des oiseaux","Avec un dirigeable"]', 0, 3),
('Quel personnage d''"Encanto" ne doit-on "pas mentionner" ?', '["Bruno","Pepa","Félix","Camilo"]', 0, 3),
('Quel cheval ailé accompagne Hercule ?', '["Pégase","Maximus","Samson","Khan"]', 0, 3),
('Qui entraîne Hercule à devenir un héros ?', '["Phil","Zeus","Hadès","Pégase"]', 0, 3),
('Quel est le numéro d''expérience de Stitch ?', '["626","007","101","42"]', 0, 3),
('Comment s''appelle le chat de Cendrillon ?', '["Lucifer","Figaro","Berlioz","Oliver"]', 0, 3),
('Quel oiseau est le majordome du roi Mufasa ?', '["Zazu","Rafiki","Timon","Pumbaa"]', 0, 3),
('Quel babouin sage présente Simba au début du "Roi Lion" ?', '["Rafiki","Zazu","Scar","Timon"]', 0, 3),
('Quelle princesse Disney est amérindienne ?', '["Pocahontas","Mulan","Jasmine","Tiana"]', 0, 3),
('Quel raton laveur accompagne Pocahontas ?', '["Meeko","Flit","Percy","Pascal"]', 0, 3),
('Qui est la méchante de "La Petite Sirène" ?', '["Ursula","Maléfique","Cruella","Yzma"]', 0, 3),
('Quelle méchante veut voler des dalmatiens ?', '["Cruella d''Enfer","Ursula","Maléfique","Yzma"]', 0, 3),
('Combien de dalmatiens donnent leur nom au film Disney ?', '["101","99","100","102"]', 0, 3),
('Quelle sorcière veut détrôner Kuzco dans "Kuzco, l''empereur mégalo" ?', '["Yzma","Ursula","Maléfique","Cruella"]', 0, 3),
('Quel est l''assistant balourd d''Yzma ?', '["Kronk","Pacha","Kuzco","Bucky"]', 0, 3),
('Quel jouet est le dinosaure vert peureux de "Toy Story" ?', '["Rex","Buzz","Woody","Zigzag"]', 0, 3),
('Quelle est la méchante de "La Belle au bois dormant" ?', '["Maléfique","Cruella","Ursula","Yzma"]', 0, 3),
('Dans "Vice-Versa", quelle émotion est toute rouge ?', '["Colère","Joie","Peur","Dégoût"]', 0, 3),

-- ── NIVEAU 4 · EXPERT ───────────────────────────────────────────────────────
('En quelle année est sorti "Blanche-Neige et les Sept Nains", premier long-métrage Disney ?', '["1937","1940","1928","1950"]', 0, 4),
('Quel court-métrage de 1928 lance Mickey en version sonore ?', '["Steamboat Willie","Fantasia","Le Roi Lion","Silly Symphony"]', 0, 4),
('Quel est le premier long-métrage des studios Pixar ?', '["Toy Story","1001 Pattes","Monstres & Cie","Le Monde de Nemo"]', 0, 4),
('En quelle année est sorti "Le Roi Lion" ?', '["1994","1991","1997","1989"]', 0, 4),
('De quelle espèce est le poisson bleu Dory ?', '["Poisson-chirurgien bleu","Poisson-clown","Poisson-globe","Hippocampe"]', 0, 4),
('De quelle espèce sont Nemo et son père Marin ?', '["Poisson-clown","Poisson-chirurgien","Mérou","Bar"]', 0, 4),
('Comment s''appelle le tigre de compagnie de Jasmine ?', '["Rajah","Shere Khan","Khan","Sahib"]', 0, 4),
('Quel perroquet accompagne Jafar dans "Aladdin" ?', '["Iago","Abu","Zazu","Hugo"]', 0, 4),
('Comment s''appelle le corbeau de Maléfique ?', '["Diablo","Iago","Hugo","Diaval"]', 0, 4),
('Comment s''appelle le chandelier dans "La Belle et la Bête" ?', '["Lumière","Big Ben","Zip","Sultan"]', 0, 4),
('Comment s''appelle la théière dans "La Belle et la Bête" ?', '["Mrs Samovar","Lumière","Big Ben","Plumette"]', 0, 4),
('Comment s''appelle la petite tasse, fils de Mrs Samovar ?', '["Zip","Big Ben","Lumière","Sultan"]', 0, 4),
('En quelle année est sortie "La Reine des Neiges" ?', '["2013","2010","2015","2009"]', 0, 4),
('Quel est le nom du royaume d''Elsa et Anna ?', '["Arendelle","Corona","Agrabah","DunBroch"]', 0, 4),
('Dans quel royaume se déroule "Raiponce" ?', '["Corona","Arendelle","Agrabah","DunBroch"]', 0, 4),
('Dans quelle ville se déroule "Aladdin" ?', '["Agrabah","Corona","Arendelle","Atlantica"]', 0, 4),
('Comment s''appelle le royaume sous-marin d''Ariel ?', '["Atlantica","Agrabah","Corona","Arendelle"]', 0, 4),
('Comment s''appelle le clan de Mérida dans "Rebelle" ?', '["DunBroch","Arendelle","Corona","Agrabah"]', 0, 4),
('Comment s''appellent les deux souris amies de Cendrillon ?', '["Jaq et Gus","Bernard et Bianca","Tic et Tac","Pim et Pam"]', 0, 4),
('Comment s''appelle le héros lama malgré lui dans "Kuzco" ?', '["Kuzco","Pacha","Kronk","Bucky"]', 0, 4),

-- ── NIVEAU 5 · IMPOSSIBLE ───────────────────────────────────────────────────
('En quelle année est sorti "Pinocchio" ?', '["1940","1937","1942","1950"]', 0, 5),
('En quelle année est sorti "Bambi" ?', '["1942","1940","1937","1951"]', 0, 5),
('En quelle année est sorti "Cendrillon" ?', '["1950","1948","1953","1955"]', 0, 5),
('En quelle année est sortie "La Belle au bois dormant" ?', '["1959","1955","1961","1963"]', 0, 5),
('En quelle année est sorti "Le Livre de la Jungle" ?', '["1967","1965","1970","1963"]', 0, 5),
('En quelle année est sortie "La Petite Sirène" ?', '["1989","1985","1991","1992"]', 0, 5),
('En quelle année est sorti "Aladdin" ?', '["1992","1990","1994","1989"]', 0, 5),
('En quelle année est sorti "Toy Story" ?', '["1995","1993","1997","1999"]', 0, 5),
('Comment s''appelle le poisson rouge de Pinocchio ?', '["Cléo","Figaro","Gédéon","Jiminy"]', 0, 5),
('Comment s''appelle le chat de Geppetto dans "Pinocchio" ?', '["Figaro","Cléo","Gédéon","Lucifer"]', 0, 5),
('Quel grillon sert de conscience à Pinocchio ?', '["Jiminy Cricket","Cri-Kee","Timothée","Gus"]', 0, 5),
('Comment s''appelle la baleine géante de "Pinocchio" ?', '["Monstro","Willie","Bruce","Crush"]', 0, 5),
('Comment s''appelle la souris amie de Dumbo ?', '["Timothée","Jaq","Gus","Bernard"]', 0, 5),
('Comment s''appelle le lapin ami de Bambi ?', '["Panpan","Fleur","Féline","Bambi"]', 0, 5),
('Comment s''appelle la mouffette amie de Bambi ?', '["Fleur","Panpan","Féline","Bambi"]', 0, 5),
('Comment s''appelle l''amoureuse de Bambi ?', '["Féline","Fleur","Maman","Panpan"]', 0, 5),
('Quel criquet porte-bonheur accompagne Mulan ?', '["Cri-Kee","Mushu","Khan","Shan"]', 0, 5),
('Comment s''appelle le cheval de Mulan ?', '["Khan","Maximus","Philippe","Samson"]', 0, 5),
('Comment s''appelle la tortue cool de "Le Monde de Nemo" ?', '["Crush","Squirt","Bruce","Nigel"]', 0, 5),
('Comment s''appelle le pélican ami de Marin et Dory ?', '["Nigel","Marin","Bruce","Gill"]', 0, 5);

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
