-- ============================================================================
--  DONNÉES DE DÉMONSTRATION — DASOLABS DISNEY CHALLENGE
--  À exécuter APRÈS schema.sql + policies.sql.
--  Les familles sont normalement créées via l'admin ; on en met 2 pour tester.
-- ============================================================================

-- ── 2 familles de démonstration (jeton QR fixe pour test) ───────────────────
insert into public.families (name, avatar, color, access_token) values
  ('Famille Mickey', '🐭', '#e11d48', 'demo-mickey-token'),
  ('Famille Stitch', '👽', '#0ea5e9', 'demo-stitch-token')
on conflict (access_token) do nothing;

-- ── MISSIONS ────────────────────────────────────────────────────────────────
insert into public.missions (title, description, category, points, requires_photo, icon, sort_order) values
  ('Photo devant le château',        'Toute l''équipe prend la pose devant le château emblématique.', 'photo', 20, true, '🏰', 1),
  ('Photo avec un personnage',       'Immortalisez une rencontre avec un personnage costumé.',        'photo', 25, true, '🤴', 2),
  ('Photo de toute la famille',      'Une photo où TOUS les membres de la famille apparaissent.',     'photo', 15, true, '👨‍👩‍👧‍👦', 3),
  ('La photo la plus drôle',         'Soyez créatifs : la photo la plus drôle de la journée !',       'photo', 20, true, '🤣', 4),
  ('Attraction à sensations',        'Affrontez une grande attraction à sensations fortes.',          'attraction', 30, true, '🎢', 5),
  ('Attraction historique',          'Faites une attraction emblématique et historique du parc.',     'attraction', 20, true, '🎠', 6),
  ('Attraction choisie par un enfant','Laissez un enfant choisir l''attraction et tentez-la.',         'attraction', 15, true, '🧒', 7),
  ('Trouver un Mickey caché',        'Repérez un "Hidden Mickey" dissimulé dans le décor.',           'exploration', 25, true, '🔍', 8),
  ('Trouver un objet futuriste',     'Photographiez un élément au design résolument futuriste.',      'exploration', 15, true, '🚀', 9),
  ('Détail architectural',           'Capturez un détail d''architecture surprenant ou caché.',       'exploration', 15, true, '🏛️', 10),
  ('Pause gourmande iconique',       'Partagez une gourmandise emblématique du parc en équipe.',      'photo', 10, true, '🍿', 11),
  ('Parade en folie',                'Filmez ou photographiez votre famille pendant une parade.',     'photo', 20, true, '🎉', 12)
on conflict do nothing;

-- ── BADGES (gamification) ───────────────────────────────────────────────────
insert into public.badges (code, name, icon, description, threshold) values
  ('explorer',      'Explorateur Disney',     '🏰', 'Compléter 3 missions exploration', 3),
  ('thrill_king',   'Roi des attractions',    '🎢', 'Valider toutes les missions attractions', 3),
  ('photographer',  'Photographe officiel',   '📸', 'Soumettre 5 photos validées', 5),
  ('visionary',     'Visionnaire Dasolabs',   '🚀', 'Créer son attraction du défi créativité', 1),
  ('quiz_master',   'Maître du Quiz',         '🧠', 'Obtenir 150 points au quiz', 150),
  ('spirit',        'Esprit d''équipe',       '💛', 'Recevoir un vote esprit d''équipe', 1)
on conflict (code) do nothing;

-- ── CATÉGORIES DE DISNEY AWARDS (à attribuer le soir via l'admin) ───────────
insert into public.awards (category, description) values
  ('Famille la plus drôle',                'Élue par les votes "photo la plus drôle".'),
  ('Famille la plus aventurière',          'Le plus d''attractions à sensations validées.'),
  ('Meilleure photo',                      'La photo coup de cœur de la journée.'),
  ('Meilleure mission',                    'La réalisation de mission la plus impressionnante.'),
  ('Enfant le plus courageux',             'Le petit aventurier de la journée.'),
  ('Plus grand enfant parmi les adultes',  'L''adulte qui a gardé son âme d''enfant.')
on conflict do nothing;

-- ── MISSIONS SECRÈTES de démo (assignées aux 2 familles) ────────────────────
insert into public.secret_missions (family_id, title, description, points)
select id, 'Faire rire un inconnu', 'Déclenchez le rire d''un parfait inconnu et capturez l''instant.', 50
from public.families where access_token = 'demo-mickey-token'
on conflict do nothing;

insert into public.secret_missions (family_id, title, description, points)
select id, 'La poussette rose', 'Obtenez une photo (avec accord) à côté d''une poussette rose.', 50
from public.families where access_token = 'demo-stitch-token'
on conflict do nothing;

-- ============================================================================
--  QUIZ — 50 questions (sélection aléatoire de 20 côté app)
--  options = tableau JSON ; correct_index = position (0-based) de la bonne réponse
-- ============================================================================
insert into public.quiz_questions (question, options, correct_index, difficulty) values
  ('Quel est le prénom de la Belle dans "La Belle et la Bête" ?', '["Belle","Aurore","Jasmine","Raiponce"]', 0, 1),
  ('Comment s''appelle le lionceau héros du "Roi Lion" ?', '["Simba","Mufasa","Scar","Nala"]', 0, 1),
  ('Quel animal est Dumbo ?', '["Un éléphant","Une souris","Un ours","Un cerf"]', 0, 1),
  ('Qui est le meilleur ami de Mickey, un chien ?', '["Pluto","Dingo","Donald","Tic"]', 0, 1),
  ('Quel poisson cherche son fils Nemo ?', '["Marin","Dory","Bruce","Gill"]', 0, 1),
  ('Dans "La Reine des Neiges", comment s''appelle la sœur d''Elsa ?', '["Anna","Raiponce","Ariel","Mérida"]', 0, 1),
  ('Quel est le nom du bonhomme de neige dans "La Reine des Neiges" ?', '["Olaf","Sven","Kristoff","Hans"]', 0, 1),
  ('Quelle princesse perd une pantoufle de verre ?', '["Cendrillon","Blanche-Neige","Aurore","Belle"]', 0, 1),
  ('Combien de nains accompagnent Blanche-Neige ?', '["Sept","Cinq","Six","Huit"]', 0, 1),
  ('Quel jouet cowboy est le héros de "Toy Story" ?', '["Woody","Buzz","Rex","Hamm"]', 0, 1),
  ('Quel ranger de l''espace dit "Vers l''infini et au-delà" ?', '["Buzz l''Éclair","Woody","Zurg","Rex"]', 0, 1),
  ('Quel est l''animal de compagnie d''Aladdin ?', '["Abu","Iago","Rajah","Jafar"]', 0, 1),
  ('Comment s''appelle le génie ami d''Aladdin ?', '["Génie","Jafar","Iago","Sultan"]', 0, 1),
  ('Quelle sirène rêve de vivre sur terre ?', '["Ariel","Ursula","Flounder","Sebastian"]', 0, 1),
  ('Quel crabe chante "Sous l''océan" ?', '["Sébastien","Polochon","Eustache","Triton"]', 0, 1),
  ('Dans "Le Roi Lion", qui chante "Hakuna Matata" avec Timon ?', '["Pumbaa","Zazu","Rafiki","Scar"]', 0, 1),
  ('Quel est le nom du père de Simba ?', '["Mufasa","Scar","Rafiki","Timon"]', 0, 2),
  ('Quel personnage de "Vice-Versa" représente la joie ?', '["Joie","Tristesse","Colère","Peur"]', 0, 2),
  ('Quelle est la couleur de Stitch ?', '["Bleu","Vert","Rose","Orange"]', 0, 1),
  ('Quel est le numéro d''expérience de Stitch ?', '["626","007","101","42"]', 0, 3),
  ('Dans "Raiponce", quel animal accompagne l''héroïne ?', '["Pascal le caméléon","Un cheval","Un lapin","Un oiseau"]', 0, 2),
  ('Comment s''appelle le cheval de la garde dans "Raiponce" ?', '["Maximus","Philippe","Samson","Khan"]', 0, 2),
  ('Quelle princesse vit dans la forêt avec trois fées ?', '["Aurore","Cendrillon","Belle","Mulan"]', 0, 2),
  ('Quel est le nom de la fée bricoleuse amie de Peter Pan ?', '["Clochette","Wendy","Lily","Aurore"]', 0, 1),
  ('Qui est l''ennemi juré de Peter Pan ?', '["Capitaine Crochet","Mr Smee","Le Croco","Tinker"]', 0, 1),
  ('Dans "Les Indestructibles", quel est le pouvoir de Violette ?', '["Invisibilité","Super-force","Vitesse","Élasticité"]', 0, 2),
  ('Quel rat veut devenir cuisinier dans un film Pixar ?', '["Rémy","Émile","Django","Gusteau"]', 0, 2),
  ('Dans "Là-haut", comment le vieil homme fait-il voler sa maison ?', '["Avec des ballons","Avec un moteur","Avec des oiseaux","Avec un dirigeable"]', 0, 2),
  ('Quel est le nom du robot nettoyeur dans le film Pixar éponyme ?', '["WALL-E","EVE","R2","Auto"]', 0, 2),
  ('Quelle guerrière chinoise prend la place de son père à l''armée ?', '["Mulan","Pocahontas","Jasmine","Tiana"]', 0, 2),
  ('Quel petit dragon accompagne Mulan ?', '["Mushu","Cri-Kee","Khan","Shan"]', 0, 2),
  ('Dans "La Princesse et la Grenouille", quel est le métier rêvé de Tiana ?', '["Restauratrice","Chanteuse","Couturière","Médecin"]', 0, 3),
  ('Quel ours partage le miel avec Petit Gourou et Tigrou ?', '["Winnie","Baloo","Petit Jean","Bernard"]', 0, 1),
  ('Quel tigre bondissant est l''ami de Winnie ?', '["Tigrou","Shere Khan","Rajah","Khan"]', 0, 1),
  ('Dans "Le Livre de la Jungle", qui est l''ours bon vivant ?', '["Baloo","Bagheera","Shere Khan","Kaa"]', 0, 2),
  ('Quel serpent hypnotiseur menace Mowgli ?', '["Kaa","Shere Khan","Baloo","Hathi"]', 0, 2),
  ('Quelle est la voiture rouge héroïne du film "Cars" ?', '["Flash McQueen","Martin","Sally","Doc"]', 0, 1),
  ('Quelle dépanneuse est l''amie de Flash McQueen ?', '["Martin","Sally","Luigi","Guido"]', 0, 2),
  ('Quel monstre bleu à cornes est l''ami de Bob Razowski ?', '["Sulli","Mike","Randall","Boo"]', 0, 2),
  ('Quelle petite fille s''attache à Sulli dans "Monstres & Cie" ?', '["Boo","Riley","Dot","Vanellope"]', 0, 2),
  ('Dans "Vaiana", quel demi-dieu accompagne l''héroïne ?', '["Maui","Tamatoa","Chef Tui","Heihei"]', 0, 2),
  ('Quel coq un peu bête voyage avec Vaiana ?', '["Heihei","Pua","Tamatoa","Maui"]', 0, 2),
  ('Quelle reine écossaise préfère le tir à l''arc dans "Rebelle" ?', '["Mérida","Elsa","Anna","Mulan"]', 0, 2),
  ('Quel est le nom de la panthère noire amie de Mowgli ?', '["Bagheera","Shere Khan","Baloo","Kaa"]', 0, 2),
  ('Dans "Hercule", qui entraîne le héros ?', '["Phil","Zeus","Hadès","Pégase"]', 0, 3),
  ('Quel cheval ailé accompagne Hercule ?', '["Pégase","Maximus","Samson","Khan"]', 0, 2),
  ('Quelle est la couleur de la robe de bal de Cendrillon ?', '["Bleue","Rose","Jaune","Rouge"]', 0, 2),
  ('Dans "Encanto", quelle famille possède des pouvoirs magiques ?', '["Madrigal","Pixar","Mendoza","Garcia"]', 0, 3),
  ('Quel personnage d''"Encanto" ne doit-on "pas mentionner" ?', '["Bruno","Pepa","Félix","Camilo"]', 0, 3),
  ('Quel est le nom de l''éléphanteau aux grandes oreilles qui sait voler ?', '["Dumbo","Babar","Horton","Tantor"]', 0, 1)
on conflict do nothing;
