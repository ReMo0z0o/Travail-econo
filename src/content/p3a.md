#PART 3 | Électrification au Burkina Faso | Différences-en-différences
:resultat +38 points | de localités visibles de nuit après l'arrivée du réseau
:intro
>> Raccorder un village au réseau électrique coûte cher, et très peu de ménages s'y branchent. Le réseau change-t-il quand même quelque chose pour la localité tout entière ?

### Le contexte

Au Burkina Faso, en 2014, seuls 4,7 % des ménages ruraux avaient l'électricité. Si l'on ne regarde que les ménages raccordés, l'extension du réseau paraît peu rentable. Mais une partie des bénéfices peut se situer **au niveau de la communauté** : éclairage public, écoles électrifiées, pompes à eau. Schmidt et Moradi (2026) mesurent ces effets sur un panel de localités raccordées entre 2008 et 2017. Tu répliques ici leur estimation la plus simple.

### L'idée de la double différence

Certaines localités ont été raccordées tôt (2008-2009), d'autres tard (2015-2017). On compare **l'évolution** des premières à celle des secondes entre 2003-2007 et 2010-2014.

$$ DD = (\bar{y}_{T, après} − \bar{y}_{T, avant}) − (\bar{y}_{C, après} − \bar{y}_{C, avant}) $$

La première différence retire ce qui distingue durablement les deux groupes. La seconde retire ce qui change pour tout le monde. Il reste ce qui change **seulement pour les localités raccordées, seulement après**.

{{w:did}}

### Les données

`elec_data.dta` : un panel annuel de localités du Burkina Faso.

| Variable | Ce qu'elle mesure |
|---|---|
| `electrific` | identifiant de la localité |
| `year` | année d'observation |
| `year_of_el` | année où la localité a été raccordée |
| `nl_extensive` | 1 si une lumière nocturne est détectée par satellite, 0 sinon |
| `nl_intensive_hat` | quantité de lumière, pour les localités éclairées au moins une fois |
| `nschool_elec` | nombre d'écoles primaires ayant l'électricité |
| `n_students_public` | nombre d'élèves des écoles primaires publiques |
| `region_num` | région administrative |

### Le chemin

| Étape | Questions | L'idée à retenir |
|---|---|---|
| A. Données et groupes | 3.1, 3.2 | Qui est traité, qui sert de comparaison, quelles années on garde, et pourquoi. |
| B. De la différence simple à la double | 3.3 à 3.5 | Chaque comparaison naïve a son biais ; la double différence retire les deux. |
| C. Tendances parallèles | 3.6 | L'hypothèse dont tout dépend, et ce qui peut la mettre en défaut. |
| D. Effets fixes et erreurs-types | 3.7, 3.8 | La même estimation écrite autrement, et sa vraie précision. |
| E. Conclusion | 3.9 | Plus de lumière ne veut pas dire plus d'activité économique. |

### Le résultat en une phrase

L'arrivée du réseau augmente de **38 points de pourcentage** la part des localités visibles de nuit (de 5 % à 44 %). L'effet estimé sur les écoles électrifiées est positif mais fragile, et rien n'apparaît sur le nombre d'élèves.

#SEC A | Données et groupes

#Q 3.1 | Décrire le panel
:enonce
Ne gardez que les années 2003 à 2014.
:concepts donnees, did
##a | Unité statistique et dimensions
:enonce
Quelle est l'unité statistique ? Combien de localités différentes contient l'échantillon, et sur combien d'années ?
:court
L'unité statistique est **une localité observée une année donnée**. L'échantillon contient **574 localités** suivies pendant **12 ans** (2003-2014), soit 6 888 observations. C'est un panel.
:zero
Dans les parties 1 et 2, chaque unité n'apparaissait qu'une fois. Ici la même localité revient **douze fois**, une fois par an. On distingue donc :

- le nombre de **lignes** : 6 888 ;
- le nombre de **localités** : 574 ;
- le nombre d'**années** : 12.

574 × 12 = 6 888 : chaque localité a bien une ligne par année. Mais avoir une ligne ne garantit pas que toutes les variables y soient renseignées : `nl_extensive` manque pour 16 à 18 localités selon l'année, et les deux variables scolaires s'arrêtent en 2012.

:::piege La confusion la plus fréquente à l'oral
« Combien d'observations ? » et « combien de localités ? » n'appellent pas la même réponse. Plus loin, la régression principale aura 2 866 observations pour 288 localités.
:::
:code
```r
elec <- read_dta(file.path(dossier, "elec_data.dta")) %>%
  filter(year >= 2003, year <= 2014)

nrow(elec)                      # 6 888 lignes
n_distinct(elec$electrific)     # 574 localités
n_distinct(elec$year)           # 12 années
```

`read_dta()` (package `haven`) lit un fichier au format Stata. `n_distinct()` compte les valeurs différentes d'une colonne.
:accord Mêmes réponses (une ligne = une localité pendant une année ; 574 localités × 12 années = 6 888 lignes). Les deux versions signalent que la présence d'une ligne ne garantit pas que chaque variable y soit renseignée.
##b | Les localités avant l'arrivée du réseau
:enonce
Produisez au plus trois statistiques descriptives utiles pour comprendre les caractéristiques des localités avant l'expansion du réseau (avant 2008), et commentez-les.
:court
Sur 2003-2007 : seulement **2,1 %** des observations localité-année ont une lumière détectée ; **0,33** école primaire électrifiée par localité en moyenne (médiane 0) ; **44 élèves** en moyenne dans le primaire public (médiane 40). Ce sont de petites localités rurales, presque toutes invisibles de nuit et presque sans électricité.
:zero
L'énoncé limite à trois statistiques : choisis-en une pour chaque résultat que tu étudieras ensuite.

| Statistique, 2003-2007 | Moyenne | Médiane | Ce qu'elle apprend |
|---|--:|--:|---|
| Lumière détectée (`nl_extensive`) | 2,1 % | 0 | Avant 2008, ces localités sont presque toutes invisibles de nuit. Seules 3,8 % sont détectées au moins une fois en cinq ans. |
| Écoles primaires électrifiées | 0,33 | 0 | La variable vaut 0 dans deux observations sur trois : la plupart des localités n'ont aucune école électrifiée. |
| Élèves du primaire public | 43,9 | 40 | Une quarantaine d'élèves : en général une seule petite école. |

Pourquoi c'est utile pour la suite : le niveau de départ de la lumière est **quasi nul**. Toute lumière détectée après le raccordement sera donc un changement net, facile à voir. Et un effet de +0,16 école électrifiée (question 3.5) se jugera par rapport à un niveau de départ de 0,33.

Un détail à garder en tête : quelques écoles ont déjà l'électricité **avant** l'arrivée du réseau. La source n'est pas connue (panneaux solaires ou groupes électrogènes, probablement).

:::verif Une curiosité de cette variable, à connaître avant la question 3.5
La moyenne de 0,33 cache une rupture. De 2003 à 2005, on compte 0,37 à 0,69 école électrifiée par localité ; en 2006, 0,06. La part des localités ayant au moins une école électrifiée passe de 54 % en 2005 à 6 % en 2006.

Une chute aussi brutale, la même année dans tout l'échantillon, ressemble à un changement dans la façon dont la variable est relevée plutôt qu'à une vraie disparition. Aucun des deux corrigés ne le signale. La question 3.5 montre ce que cela change pour l'estimation.
:::
:code
```r
avant <- elec %>% filter(year < 2008)
mean(avant$nl_extensive, na.rm = TRUE)         # 0,021
mean(avant$nschool_elec, na.rm = TRUE)         # 0,33
mean(avant$n_students_public, na.rm = TRUE)    # 43,9
median(avant$n_students_public, na.rm = TRUE)  # 40
```

`na.rm = TRUE` demande d'ignorer les valeurs manquantes ; sans cela, la moyenne d'une variable qui contient un seul `NA` vaut `NA`.
:accord Mêmes trois statistiques et mêmes valeurs (2,12 % ; 0,330 ; 43,87). Claude ajoute les médianes et la part des localités éclairées au moins une fois (3,8 %) ; ChatGPT donne le nombre d'observations renseignées pour chaque variable et rappelle que l'existence d'écoles électrifiées avant le réseau n'identifie pas la source de leur électricité.
:quiz
? L'échantillon de la question 3.1 contient 6 888 lignes. Combien de localités ?
- 6 888
+ 574
- 12
> 574 localités observées chacune 12 années : 574 × 12 = 6 888.
:oral
? Quelle est l'unité statistique de cette partie ?
> Une localité observée une année donnée. Les mêmes localités sont suivies chaque année : c'est un panel. Il faut toujours distinguer le nombre d'observations du nombre de localités.

#Q 3.2 | Groupe traité, groupe de comparaison, périodes
:intro
Toute double différence commence par quatre choix : qui est traité, qui sert de comparaison, quelle est la période « avant », quelle est la période « après ». Cette question te fait justifier chacun.
:concepts did, causalite
##a | Créer treated et post
:enonce
Créez une variable indicatrice de traitement, `treated`, valant 1 si une localité a été électrifiée en 2008 ou 2009, et 0 sinon. Créez également une variable indicatrice de période post-traitement, `post`, valant 1 si `year` > 2009, et 0 sinon.
:court
`treated` = 1 pour les localités raccordées en 2008 ou 2009 : elle ne change jamais pour une localité donnée. `post` = 1 pour les années 2010 et suivantes : elle ne dépend que de l'année.
:zero
Deux indicatrices de nature différente :

- `treated` décrit **la localité** : elle vaut la même chose sur ses douze lignes ;
- `post` décrit **l'année** : elle vaut la même chose pour toutes les localités une année donnée.

Leur produit `treated × post` vaut 1 uniquement pour une localité traitée, observée après. C'est lui qui portera l'effet.
:code
```r
elec <- elec %>%
  mutate(treated = as.numeric(year_of_el %in% c(2008, 2009)),
         post    = as.numeric(year > 2009))
```

`%in%` teste l'appartenance à une liste : l'année de raccordement est-elle 2008 ou 2009 ?
:accord Même construction.
##b | Combien de localités par groupe ?
:enonce
Ne gardez que les localités électrifiées en 2008 ou 2009 (groupe traité) et celles électrifiées entre 2015 et 2017 (groupe de comparaison), et supprimez les années 2008 et 2009. La période avant couvre donc 2003-2007 et la période après 2010-2014. Combien de localités compte chaque groupe ?
:court
**59 localités traitées** (raccordées en 2008-2009) et **238 localités de comparaison** (raccordées en 2015-2017). Soit 297 localités × 10 années = 2 970 lignes, dont 2 866 avec une valeur de `nl_extensive`.
:res
| Groupe | Année de raccordement | Localités | Lignes sur 10 ans | Lignes avec luminosité |
|---|---|--:|--:|--:|
| Traité (`treated` = 1) | 2008 ou 2009 | 59 | 590 | 580 |
| Comparaison (`treated` = 0) | 2015 à 2017 | 238 | 2 380 | 2 286 |
:code
```r
deux_groupes <- elec %>% filter(treated == 1 | year_of_el %in% 2015:2017)
did <- deux_groupes %>% filter(!(year %in% c(2008, 2009)))

did %>% distinct(electrific, treated) %>% count(treated)    # 238 et 59
nrow(did)                                                   # 2 970
```

- `|` veut dire « ou » : on garde les traitées **ou** les localités raccordées en 2015-2017.
- `!` veut dire « non » : on retire les années 2008 et 2009.
- Pour compter des **localités** et non des lignes, on dédoublonne d'abord avec `distinct()`.
:accord Mêmes effectifs (59 et 238 localités ; 2 970 lignes dont 2 866 avec une mesure de lumière).
##c | Pourquoi supprimer 2008 et 2009 ?
:enonce
Pourquoi supprimer les années 2008 et 2009 ?
:court
Parce que ce sont les années où les localités traitées sont **en train d'être raccordées** : elles ne sont ni clairement « avant » ni clairement « après ». Les garder mélangerait des observations traitées et non traitées dans la même période, et tirerait l'estimation vers zéro.
:zero
Une localité raccordée en décembre 2008 n'a pas d'électricité pendant onze mois de cette année-là. Une localité raccordée en 2009 est encore non traitée en 2008. Et même une fois la ligne arrivée, les premiers branchements et l'éclairage public prennent du temps.

Si l'on classait 2008-2009 dans « après », on y compterait des observations sans électricité : l'effet moyen serait dilué. Si on les classait dans « avant », on y compterait des observations déjà électrifiées : le niveau de départ serait gonflé. Dans les deux cas, l'effet est **sous-estimé**.

En les retirant, on obtient une période avant propre (2003-2007) et une période après propre (2010-2014).
:accord Même raison : éviter de mélanger des expositions partielles ou de durée très différente dans les cellules avant et après.
##d | Le choix du groupe de comparaison
:enonce
Pourquoi ne pas utiliser comme groupe de comparaison les localités électrifiées entre 2010 et 2014 ? Pourquoi les auteurs n'utilisent-ils pas plutôt des localités jamais électrifiées ?
:court
**Pas celles de 2010-2014** : elles sont raccordées **pendant** la période « après ». Leur lumière augmente à cause de leur propre électrification ; le groupe de comparaison serait en partie traité et l'effet sous-estimé. **Pas celles jamais électrifiées** : elles diffèrent systématiquement (plus petites, plus isolées), donc leur évolution n'est pas un bon guide. Les localités raccordées en 2015-2017 ont passé la **même sélection** ; seul le calendrier les distingue.
:zero
Un bon groupe de comparaison doit remplir deux conditions.

1. **Ne pas être traité** pendant la période étudiée.
2. **Ressembler** au groupe traité, au point d'évoluer comme lui en l'absence de traitement.

| Candidat | Condition 1 | Condition 2 |
|---|---|---|
| Raccordées en 2010-2014 | **Non** : elles s'allument pendant la période « après » | oui |
| Jamais raccordées | oui | **Non** : l'État a choisi de ne pas les raccorder |
| Raccordées en 2015-2017 | oui : encore sans réseau jusqu'en 2014 | oui : retenues par le même programme |

Dans l'outil de la page de présentation, choisis « Électrifiées en 2010-2014 » comme groupe de comparaison : la double différence tombe de +38,0 à +20,7 points. Près de la moitié de l'effet a disparu, parce qu'on retranche la hausse de lumière de localités elles-mêmes électrifiées (+18,3 points, au lieu de +0,9 pour le groupe de l'énoncé).

**Sur les localités jamais raccordées.** L'État a choisi lesquelles raccorder : des pôles de développement, des localités plus grandes ou plus proches du réseau existant. Celles qu'il n'a jamais retenues sont probablement plus petites, plus isolées, plus pauvres. Rien ne dit qu'elles auraient évolué comme les localités traitées.

Les localités « pas encore traitées » sont un choix courant en double différence : elles ont le même profil que les traitées, puisqu'elles finiront par l'être.
:accord Même raisonnement dans les deux versions (les localités de 2010-2014 deviennent traitées pendant la période de comparaison ; les jamais raccordées diffèrent structurellement). ChatGPT ajoute une réserve juste : ce choix rend le groupe plus comparable, « sans garantir les tendances parallèles ».
:quiz
? Que se passerait-il si l'on utilisait les localités raccordées en 2010-2014 comme groupe de comparaison ?
- L'effet estimé serait surestimé
+ L'effet estimé serait sous-estimé
- L'effet estimé ne changerait pas
> Leur lumière augmente après 2010 à cause de leur propre raccordement. On retrancherait donc une partie de l'effet qu'on cherche à mesurer.
:oral
? Pourquoi ne pas prendre des localités jamais électrifiées comme témoins ?
> Parce qu'elles n'ont pas été retenues par le programme : elles sont sans doute plus petites et plus isolées, et rien ne garantit qu'elles auraient évolué comme les traitées. Les localités raccordées en 2015-2017 ont passé la même sélection ; seul le calendrier change.

#SEC B | De la différence simple à la double différence

#Q 3.3 | Deux comparaisons naïves
:enonce
Pour `nl_extensive`, estimez par régression : (a) la différence entre localités traitées et localités de comparaison sur la seule période 2010-2014 ; (b) la différence entre la période après et la période avant pour les seules localités traitées. Interprétez chacune. Peut-on y voir l'effet de l'expansion du réseau électrique ? Pour chacune, décrivez le biais possible.
:intro
Avant la double différence, l'énoncé te fait estimer les deux comparaisons qu'on ferait spontanément, pour comprendre ce qui cloche dans chacune. Reprends l'outil de la page de présentation de la partie et passe de ① à ② à ③.
:concepts did, indicatrices
##a | Traitées contre comparaison, après
:enonce
La différence entre localités traitées et localités de comparaison sur la seule période 2010-2014.
:court
**+0,405** (erreur-type 0,030). Sur 2010-2014, la part des observations où la localité est visible de nuit est de 44,1 % chez les traitées, contre 3,7 % dans le groupe de comparaison : **40,5 points** d'écart. Ce n'est pas l'effet pur du réseau : la comparaison inclut les différences qui existaient **déjà avant** entre les deux groupes. C'est un **biais de sélection**.
:zero
Avec une seule indicatrice comme régresseur, la pente est une différence de moyennes (c'est la leçon de la question 2.2).

**Le biais.** Les localités raccordées en premier n'ont pas été tirées au sort. Elles sont peut-être plus grandes, plus proches du réseau, déjà un peu plus lumineuses. Et de fait : avant 2008, elles étaient éclairées dans 5,2 % des cas, contre 2,7 % pour les autres. Cet écart de départ de 2,5 points se retrouve dans les 40,5 points et les gonfle.
:code
```r
reg_3_3a <- lm(nl_extensive ~ treated, data = filter(did, post == 1))
rob(reg_3_3a)
```

`filter(did, post == 1)` ne garde que les années 2010-2014.
:accord Même estimation (40,47 points ; erreur-type 2,97 points) et même biais : le niveau initial et la sélection des localités raccordées en premier.
##b | Après contre avant, chez les traitées
:enonce
La différence entre la période après et la période avant pour les seules localités traitées.
:court
**+0,390** (erreur-type 0,032). Chez les traitées, la part des observations éclairées passe de 5,2 % à 44,1 % : **+39,0 points**. Ce n'est pas non plus l'effet pur du réseau : la comparaison inclut **tout ce qui a changé avec le temps** pour toutes les localités. C'est un **biais de tendance**.
:zero
**Le biais.** Entre 2003-2007 et 2010-2014, beaucoup de choses ont changé au Burkina Faso, réseau ou pas : croissance démographique et économique, diffusion des lampes solaires, et surtout le passage à un satellite plus sensible (VIIRS). Tout cela peut augmenter la lumière détectée partout.

De fait, dans le groupe de comparaison, qui n'a pas reçu le réseau, la part éclairée a augmenté de 0,9 point sur la même période. Cette hausse « de fond » se retrouve dans les 39,0 points.

**Les deux biais sont petits ici** : 2,5 points pour le premier, 0,9 pour le second. Mais on ne le sait que grâce à la double différence, qui les mesure et les retire tous les deux.
:res
| Comparaison | Coefficient | Erreur-type HC1 | Ce qu'elle compare | Ce qu'elle contient en trop |
|---|--:|--:|---|---|
| (a) Traitées − comparaison, 2010-2014 | 0,405 | 0,030 | 44,1 % contre 3,7 % | l'écart initial entre groupes (2,5 points) |
| (b) Après − avant, traitées seulement | 0,390 | 0,032 | 44,1 % contre 5,2 % | la tendance commune (0,9 point) |
:code
```r
reg_3_3b <- lm(nl_extensive ~ post, data = filter(did, treated == 1))
rob(reg_3_3b)
```
:accord Même estimation (38,97 points ; erreur-type 3,20 points) et même biais : les évolutions communes, dont le changement de satellite. Claude chiffre les deux biais (2,5 et 0,9 points) à partir des quatre moyennes ; c'est ce qui prépare le mieux la question suivante.
:quiz
? La comparaison « après − avant » chez les seules localités traitées est biaisée parce que :
- les localités traitées diffèrent des autres
+ d'autres choses que le réseau ont changé entre les deux périodes
- l'échantillon est trop petit
> C'est un biais de tendance : croissance, lampes solaires, satellite plus sensible. Le groupe de comparaison sert justement à le mesurer.
:oral
? Pourquoi 38 points et pas 40,5 ?
> 40,5 points, c'est l'écart entre les deux groupes après. Mais ils différaient déjà de 2,5 points avant. La double différence retire cet écart de départ : 40,5 − 2,5 = 38,0.

#Q 3.4 | La double différence
:intro
On assemble les deux comparaisons en une seule : d'abord à la main, avec quatre moyennes, puis par une régression qui redonne exactement le même nombre.
:concepts did, indicatrices
##a | Quatre moyennes et une double soustraction
:enonce
Calculez les quatre moyennes de `nl_extensive` (groupe × période) et la double différence à partir de ces moyennes.
:court
| `nl_extensive` | Avant (2003-2007) | Après (2010-2014) | Variation |
|---|--:|--:|--:|
| Traitées | 0,0517 | 0,4414 | +0,3897 |
| Comparaison | 0,0272 | 0,0366 | +0,0095 |
| Écart | +0,0245 | +0,4047 | **+0,3802** |

Double différence : 0,3897 − 0,0095 = **0,3802**, soit **38,0 points de pourcentage**.
:zero
La [[double différence]] se lit dans les deux sens du tableau, et donne le même résultat.

- **Par lignes** : la variation des traitées moins celle du groupe de comparaison. 0,3897 − 0,0095 = 0,3802.
- **Par colonnes** : l'écart après moins l'écart avant. 0,4047 − 0,0245 = 0,3802.

**Le raisonnement contrefactuel.** Sans le réseau, qu'auraient fait les localités traitées ? On suppose qu'elles auraient suivi la même évolution que le groupe de comparaison : 5,17 % + 0,95 point = **6,1 %**. On observe 44,1 %. L'écart, 38,0 points, est l'effet attribué au réseau.

C'est la ligne en tirets de l'outil : la trajectoire que les traitées auraient suivie « si rien ne s'était passé ».
:code
```r
did %>%
  group_by(treated, post) %>%
  summarise(moyenne = mean(nl_extensive, na.rm = TRUE),
            n_obs = sum(!is.na(nl_extensive)), .groups = "drop")

moy <- function(t, p) mean(did$nl_extensive[did$treated == t & did$post == p], na.rm = TRUE)
(moy(1, 1) - moy(1, 0)) - (moy(0, 1) - moy(0, 0))      # 0,3802
```

`group_by(treated, post)` forme les quatre cases ; `summarise()` calcule la moyenne dans chacune. La petite fonction `moy(t, p)` renvoie la moyenne d'une case.
:accord Mêmes quatre moyennes et même double différence (0,380199). ChatGPT explicite le contrefactuel (6,12 % attendus sans réseau, 44,14 % observés), ce qui est la meilleure façon de présenter le résultat.
##b | La régression et ses quatre coefficients
:enonce
Estimez la régression de `nl_extensive` sur `treated`, `post` et leur interaction. Interprétez chacun des quatre coefficients à l'aide des moyennes calculées en (a).
:court
| Coefficient | Valeur | Ce qu'il est |
|---|--:|---|
| Constante $β₀$ | 0,0272 | moyenne du groupe de comparaison, avant |
| `treated` $β₁$ | 0,0245 | écart traitées − comparaison, avant |
| `post` $β₂$ | 0,0095 | variation du groupe de comparaison |
| `treated × post` $β₃$ | **0,3802** | **la double différence** |
:zero
$$ nl\_extensive = β₀ + β₁ treated + β₂ post + β₃ (treated × post) + u $$

Remplace `treated` et `post` par leurs valeurs dans chaque case, comme pour les indicatrices de région.

| Case | treated | post | Moyenne prédite |
|---|:-:|:-:|---|
| Comparaison, avant | 0 | 0 | $β₀$ = 0,0272 |
| Traitées, avant | 1 | 0 | $β₀ + β₁$ = 0,0517 |
| Comparaison, après | 0 | 1 | $β₀ + β₂$ = 0,0366 |
| Traitées, après | 1 | 1 | $β₀ + β₁ + β₂ + β₃$ = 0,4414 |

Quatre cases, quatre coefficients : le modèle reproduit **exactement** les quatre moyennes.

- $β₀$ : avant 2008, 2,7 % des observations du groupe de comparaison sont éclairées.
- $β₁$ : avant 2008, les traitées le sont 2,5 points plus souvent. L'écart n'est pas significatif à 5 % (p = 0,08) : les deux groupes sont proches au départ.
- $β₂$ : dans le groupe de comparaison, la part éclairée augmente de 0,9 point (p = 0,20). C'est la **tendance commune**.
- $β₃$ : le raccordement augmente de **38 points** la probabilité qu'une localité soit visible de nuit, en moyenne sur 2010-2014 (t = 11,6).

Pourquoi passer par une régression si quatre moyennes suffisent ? Parce qu'elle donne l'**erreur-type** de la double différence, et qu'elle se prête aux extensions (effets fixes, question 3.7).
:res
| | Coefficient | Erreur-type HC1 | p-valeur |
|---|--:|--:|--:|
| Constante | 0,0272 | 0,0048 | < 0,001 |
| treated | 0,0245 | 0,0139 | 0,077 |
| post | 0,0095 | 0,0074 | 0,199 |
| treated × post | 0,3802 | 0,0328 | < 0,001 |

2 866 observations.
:code
```r
reg_3_4 <- lm(nl_extensive ~ treated * post, data = did)
rob(reg_3_4)
nobs(reg_3_4)      # 2 866 : R a écarté les 104 lignes sans mesure de lumière
```

`treated * post` développe en `treated + post + treated:post`. Le coefficient d'interaction s'appelle `treated:post` dans la sortie.
:accord Mêmes coefficients et même lecture case par case.
##c | Comparer à l'article
:enonce
Comparez votre estimation à celle de la colonne « DiD : TWFE » du tableau 4 de l'article.
:court
Ton estimation : **0,380** (erreur-type groupée par localité : 0,044 à 0,047, voir la question 3.8). La valeur du tableau 4 est **à lire dans ta copie de l'article** : c'est le seul chiffre du travail que je n'ai pas pu vérifier. La comparaison doit porter sur trois points : le coefficient, l'erreur-type (groupée dans l'article), et les raisons d'un éventuel écart (période, échantillon, effets fixes).
:zero
:::verif Un point où les deux corrigés ne sont pas d'accord, et que tu dois trancher toi-même
- **ChatGPT** affirme que la colonne « DiD : TWFE » du tableau 4 donne **0,396 (erreur-type groupée 0,046)**, soit 1,6 point de plus que ton estimation.
- **Claude** dit ne pas avoir pu lire le tableau 4 de la version publiée (accès payant) et cite la version de travail de 2022, dont le tableau 7 (« Simple OLS DiD 2×2 ») donne **0,38 (0,05)** sur 297 localités, 59 traitées et 238 de comparaison.

L'article est derrière un accès payant et je n'ai pas pu lire le tableau non plus. J'ai en revanche essayé de **reproduire 0,396** avec le fichier fourni : avec une période « avant » commençant en 2002 et des effets fixes de localité et d'année, j'obtiens 0,380 avec une erreur-type groupée de 0,046. L'erreur-type coïncide avec celle que cite ChatGPT ; le coefficient, non. Aucune variante simple ne m'a donné 0,396.

Conclusion pratique : **ouvre l'article, lis la ligne « nightlight, extensive margin » de la colonne « DiD : TWFE », et recopie le coefficient, l'erreur-type et le nombre d'observations.** L'énoncé rend cette lecture obligatoire.
:::

**Comment rédiger la comparaison, quelle que soit la valeur lue.**

1. **Le coefficient.** S'il vaut entre 0,38 et 0,40, ton estimation est très proche : même ordre de grandeur, même signe, même conclusion.
2. **L'erreur-type.** Les auteurs groupent leurs erreurs-types par localité. Compare donc à ton erreur-type **groupée** (0,044 pour le modèle 2×2, 0,047 avec effets fixes), pas à ton erreur-type HC1 (0,033), plus petite.
3. **Les raisons d'un écart.** L'énoncé fait commencer la période en 2003 ; l'article peut utiliser une période ou un échantillon légèrement différents. La colonne « TWFE » utilise des effets fixes de localité et d'année, qui donnent pratiquement le même coefficient que l'interaction (question 3.7).
:gpt
Donne une valeur précise : 0,396 (erreur-type groupée 0,046), soit 39,6 points ; son estimation est inférieure de 1,58 point. Avance des explications : l'énoncé commence en 2003 alors que le tableau publié indiquerait une période avant commençant en 2002, et la spécification est un TWFE. Dit suivre les années et cohortes de l'énoncé « sans attribuer tout l'écart à une cause vérifiée ».
:claude
Reconnaît ne pas avoir pu lire le tableau 4 publié et renvoie à ta copie de l'article. Donne pour repère la version de travail de 2022 : 0,38 (0,05) sur le même échantillon de 297 localités. Explique que seules les erreurs-types devraient différer (groupées dans l'article).
:verdict
C'est la seule divergence **factuelle** entre les deux corrigés. ChatGPT donne un chiffre précis mais invérifiable ici, et que le fichier fourni ne permet pas de reproduire ; Claude est transparent sur ce qu'il n'a pas pu lire. Dans les deux cas, tu ne peux pas recopier la réponse : tu dois lire le tableau. La structure de la comparaison (coefficient, erreur-type groupée, raisons de l'écart) est la même quelle que soit la valeur.
:opt mix | À compléter après lecture du tableau 4
Mon estimation est de 0,380, avec une erreur-type groupée par localité de 0,044. La colonne « DiD : TWFE » du tableau 4 rapporte [valeur lue] ([erreur-type lue]). Les deux estimations sont [très proches / séparées de … point(s)]. Les auteurs utilisent des effets fixes de localité et d'année, qui donnent pratiquement le même coefficient que mon interaction (0,3800 contre 0,3802), et groupent leurs erreurs-types par localité ; un écart résiduel peut venir de la période ou de l'échantillon retenus.
:quiz
? Dans la régression de nl_extensive sur treated, post et treated × post, que mesure le coefficient de post ?
- L'effet du réseau électrique
+ L'évolution du groupe de comparaison entre les deux périodes
- L'écart entre les deux groupes après 2009
> Quand treated = 0, passer de post = 0 à post = 1 ajoute β₂ : c'est la variation des localités de comparaison, la tendance commune.
? Sans le réseau, et sous l'hypothèse de tendances parallèles, quelle part des localités traitées aurait été éclairée en 2010-2014 ?
- 5,2 %
+ 6,1 %
- 3,7 %
> Niveau de départ des traitées (5,17 %) plus l'évolution du groupe de comparaison (+0,95 point) = 6,1 %.
:oral
? Explique la double différence avec les quatre moyennes.
> Les traitées passent de 5,2 % à 44,1 %, soit +39,0 points. Le groupe de comparaison passe de 2,7 % à 3,7 %, soit +0,9 point. La double différence est 39,0 − 0,9 = 38,0 points : la hausse des traitées au-delà de ce qu'ont connu des localités semblables sans réseau.

#Q 3.5 | Trois autres variables de résultat
:enonce
Estimez la régression de la question 3.4 (b) avec, comme variable dépendante, successivement `nl_intensive_hat`, `nschool_elec` et `n_students_public`.
:intro
La même double différence, appliquée à trois autres résultats. L'intérêt est dans la comparaison des trois, et dans une habitude à prendre : revenir aux quatre moyennes pour savoir **d'où vient** un coefficient.
:concepts did
##a | Les trois effets
:enonce
Interprétez l'effet estimé pour chacune de ces variables.
:court
**Intensité lumineuse** : +0,43 unité (p = 0,002). **Écoles électrifiées** : +0,16 école par localité par rapport à l'évolution du groupe de comparaison (p = 0,045), un résultat fragile. **Élèves** : −6,7, non significatif (p = 0,20) : aucun effet détectable sur le nombre d'élèves.
:zero
| Variable | Double différence | Erreur-type HC1 | p-valeur | Observations | Moyenne des traitées avant |
|---|--:|--:|--:|--:|--:|
| `nl_extensive` | 0,380 | 0,033 | < 0,001 | 2 866 | 0,052 |
| `nl_intensive_hat` | 0,429 | 0,140 | 0,002 | 1 390 | 0,088 |
| `nschool_elec` | 0,158 | 0,079 | 0,045 | 2 376 | 0,486 |
| `n_students_public` | −6,73 | 5,28 | 0,20 | 2 376 | 57,4 |

**Chaque coefficient se lit dans l'unité de sa variable.**

- **Intensité** : parmi les localités éclairées au moins une fois, 0,43 unité de lumière en plus sur l'échelle des auteurs.
- **Écoles électrifiées** : +0,16 école par localité. Une moyenne peut être fractionnaire même si chaque localité compte un nombre entier d'écoles. Le résultat est tout juste significatif à 5 %.
- **Élèves** : −6,7 élèves, avec un intervalle de confiance qui va d'environ −17 à +4. On ne peut pas le distinguer de zéro.

« En plus » veut toujours dire : **par rapport à ce qu'aurait donné l'évolution du groupe de comparaison**. Ce n'est pas forcément une hausse observée, comme le montre le cas des écoles.

:::piege Points de pourcentage ou unités ?
Seule `nl_extensive` vaut 0 ou 1 : son coefficient, multiplié par 100, donne des points de pourcentage. Pour les écoles, 0,158 ne veut **pas** dire « +15,8 % » : c'est 0,158 école.
:::

**D'où vient le +0,158 ? Reviens aux quatre moyennes.**

| Écoles électrifiées par localité | Avant (2003-2007) | Après (2010-2012) | Variation |
|---|--:|--:|--:|
| Traitées | 0,486 | 0,500 | +0,014 |
| Comparaison | 0,298 | 0,153 | −0,145 |
| Double différence | | | **+0,158** |

Dans les localités traitées, le nombre d'écoles électrifiées n'a presque pas bougé. La double différence est positive surtout parce qu'il a **baissé** dans le groupe de comparaison. Écrire « le nombre d'écoles électrifiées augmente de 0,16 » est donc un raccourci. La lecture exacte : les traitées ont 0,16 école électrifiée de plus que si elles avaient suivi l'évolution du groupe de comparaison.

:::verif Vérifié sur les données, absent des deux corrigés
La baisse du groupe de comparaison vient de la rupture de 2005-2006 signalée à la question 3.1 (b). Elle touche les deux groupes. Pour la voir, choisis « Écoles électrifiées » dans l'outil de la question 3.6 (b).

| Écoles électrifiées | 2003 | 2004 | 2005 | 2006 | 2007 | 2010 | 2011 | 2012 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Traitées | 0,78 | 0,95 | 0,48 | 0,05 | 0,17 | 0,47 | 0,47 | 0,56 |
| Comparaison | 0,40 | 0,64 | 0,34 | 0,04 | 0,07 | 0,12 | 0,16 | 0,18 |

La période « avant » mélange donc deux régimes de mesure. Trois conséquences, que j'ai vérifiées :

- le test placebo de la question 3.6 (c), appliqué aux écoles, **échoue** : −0,26 (p = 0,02). Pour cette variable, les deux groupes n'évoluent pas de la même façon avant 2008 ;
- avec les seules années 2006-2007 comme période avant, la double différence vaut **0,29** (erreur-type groupée 0,08) : presque le double, et nettement significative ;
- avec des erreurs-types groupées par localité (question 3.8), le 0,158 n'est plus significatif (erreur-type 0,117 ; p = 0,18).

Ce que tu peux en dire sans dépasser ce que l'énoncé demande : le signe est positif et cohérent avec l'article, mais la valeur de 0,158 est fragile. Je n'ai pas pu vérifier dans l'article la cause de la rupture.
:::

Les variables scolaires ne sont disponibles que jusqu'en 2012 : pour elles, la période « après » se réduit à 2010-2012.
:code
```r
reg_3_5_int <- lm(nl_intensive_hat  ~ treated * post, data = did)
reg_3_5_eco <- lm(nschool_elec      ~ treated * post, data = did)
reg_3_5_elv <- lm(n_students_public ~ treated * post, data = did)
rob(reg_3_5_eco)["treated:post", ]
nobs(reg_3_5_int); nobs(reg_3_5_eco)     # 1 390 et 2 376 : pas les mêmes échantillons
```
:gpt
Mêmes estimations. Écrit que « le nombre d'écoles électrifiées augmente de 0,158 école par localité en moyenne », rappelle qu'une moyenne peut être fractionnaire et que 0,158 n'est pas « +15,8 % ». Note que p = 0,0447 est proche du seuil et que « l'inférence en panel est sensible à la corrélation entre années ».
:claude
Mêmes estimations. Rapporte l'effet à la moyenne initiale des traitées : +0,16 école, « un tiers de plus » que 0,49.
:verdict
Mêmes chiffres, et les deux mises en garde de ChatGPT sont justes (l'unité ; la fragilité du p = 0,045). Mais les deux corrigés écrivent que le nombre d'écoles électrifiées **augmente**, alors qu'il est stable chez les traitées (0,486 puis 0,500) et qu'il baisse dans le groupe de comparaison (0,298 puis 0,153). « Un tiers de plus que la moyenne initiale » décrit donc mal ce qui s'est passé. Aucun ne signale la rupture de 2005-2006, ni que l'effet n'est plus significatif avec des erreurs-types groupées. Formule l'effet comme un écart par rapport au groupe de comparaison, et dis qu'il est fragile.
:opt gpt | Lecture directe, dans l'unité de chaque variable
L'arrivée du réseau augmente l'intensité lumineuse de 0,43 unité parmi les localités éclairées au moins une fois (p = 0,002) et le nombre d'écoles électrifiées de 0,158 école par localité (p = 0,045, proche du seuil de 5 %). L'effet estimé sur le nombre d'élèves, −6,7, n'est pas significatif (p = 0,20).
:opt mix | Lecture par rapport au groupe de comparaison, avec les réserves
Par rapport à l'évolution du groupe de comparaison, les localités raccordées gagnent 0,43 unité d'intensité lumineuse (p = 0,002) et 0,158 école électrifiée (p = 0,045). Ce second effet est fragile : le nombre d'écoles électrifiées est stable chez les traitées (0,49 puis 0,50) et baisse dans le groupe de comparaison (0,30 puis 0,15), et il n'est plus significatif avec des erreurs-types groupées par localité (p = 0,18). L'effet sur le nombre d'élèves (−6,7) ne se distingue pas de zéro (p = 0,20).
##b | Pourquoi moins d'observations pour nl_intensive_hat ?
:enonce
Pourquoi l'échantillon est-il plus petit pour `nl_intensive_hat`, et qu'est-ce que cela change à l'interprétation ?
:court
Parce que la variable n'est définie que pour les localités **éclairées au moins une fois** : 139 localités sur 297. Or y figurer dépend du traitement lui-même : 75 % des traitées y sont (44 sur 59), contre 40 % des localités de comparaison (95 sur 238). C'est une **sélection sur un résultat** : l'estimation ne vaut que pour ces localités, et les deux groupes n'y sont plus comparables.
:zero
1 390 observations = 139 localités × 10 années.

**Le problème.** L'électrification fait entrer dans l'échantillon des localités qui, sans elle, seraient restées invisibles et donc absentes. Parmi les localités de comparaison, seules celles qui s'éclairent **sans réseau** y figurent : des localités particulières, sans doute plus grandes ou plus actives. On compare donc des traitées « ordinaires » à des témoins « exceptionnels ».

**Ce que cela change.**

- L'estimation décrit les localités éclairées à un moment donné, pas une localité moyenne. Elle ne se généralise pas aux localités toujours sombres.
- Elle mélange deux choses : le passage de l'obscurité à la lumière, et la hausse d'intensité des localités déjà éclairées. Même dans cet échantillon, plus de huit observations sur dix sont des années **sans** lumière.

:::note Un détail de codage, utile pour la question 3.6 (e)
Une année sans lumière vaut −0,214 jusqu'en 2011 et 0 à partir de 2012, quand le satellite VIIRS entre dans la série. Le « zéro » de l'échelle change donc avec le capteur, pour toutes les localités.
:::

La règle générale est la même que pour le « mauvais contrôle » de la question 1.16 : **on ne sélectionne pas un échantillon sur une variable que le traitement influence**.
:gpt
La marge intensive n'est définie que pour les localités éclairées au moins une fois : 1 390 lignes, 139 localités. L'estimation décrit leur quantité de lumière « conditionnellement à cette sélection » ; le traitement pouvant modifier la probabilité d'appartenir à ce groupe, l'amplitude ne se généralise pas mécaniquement aux localités toujours sombres.
:claude
Même explication, **chiffrée** : 44 traitées sur 59 (75 %) contre 95 localités de comparaison sur 238 (40 %). Nomme le problème (« sélection sur un résultat ») et précise que l'estimation mélange passage à la lumière et hausse d'intensité.
:verdict
Même diagnostic. Les deux proportions de Claude (75 % contre 40 %) rendent le problème évident en une ligne : elles montrent que le traitement modifie bel et bien la composition de l'échantillon. Reprends-les.
:opt claude | Sélection sur un résultat, avec les deux proportions
La variable n'existe que pour les localités éclairées au moins une fois, soit 139 localités sur 297. Or 75 % des traitées y figurent (44 sur 59) contre 40 % des localités de comparaison (95 sur 238) : le traitement fait entrer des localités dans l'échantillon. C'est une sélection sur un résultat. L'estimation ne vaut que pour les localités éclairées à un moment donné, et les deux groupes n'y sont plus comparables.
##c | Ce que les élèves apprennent sur les écoles
:enonce
Que vous apprend le résultat obtenu pour `n_students_public` sur l'interprétation du résultat obtenu pour `nschool_elec` ?
:court
Que l'effet sur les écoles électrifiées ne s'accompagne d'aucune hausse du nombre d'élèves : il concerne des **écoles existantes** qui ont l'électricité, pas de nouvelles écoles ni un afflux d'élèves. C'est un changement d'**équipement**, pas une expansion de la scolarisation.
:zero
Deux histoires pouvaient expliquer « plus d'écoles électrifiées ».

- **Histoire 1 : plus d'écoles.** Le réseau attire des familles, on ouvre des classes, et mécaniquement davantage d'écoles sont électrifiées. Dans ce cas, le nombre d'élèves augmenterait.
- **Histoire 2 : les mêmes écoles, mieux équipées.** Les écoles déjà là sont raccordées. Le nombre d'élèves ne bouge pas.

Le nombre d'élèves n'augmente pas : c'est l'histoire 2. Et l'électrification des écoles n'a pas (encore) attiré davantage d'élèves, du moins jusqu'en 2012.

C'est un bon exemple d'utilisation d'un résultat « nul » : il ne mesure pas un effet, mais il permet d'écarter une interprétation.
:accord Même conclusion : une école existante peut gagner l'électricité à effectif constant ; la progression de l'équipement ne suffit pas à inférer une hausse des inscriptions.
:quiz
? Le coefficient de la double différence pour nschool_elec vaut 0,158. Cela signifie :
- une hausse de 15,8 % du nombre d'écoles électrifiées
- une hausse de 15,8 points de pourcentage
+ 0,158 école électrifiée de plus par localité, par rapport à l'évolution du groupe de comparaison
> nschool_elec est un nombre d'écoles, pas une indicatrice : le coefficient se lit dans cette unité.
? Chez les traitées, le nombre moyen d'écoles électrifiées passe de 0,486 à 0,500. D'où vient alors la double différence de +0,158 ?
- D'une erreur de calcul
+ De la baisse dans le groupe de comparaison (0,298 puis 0,153)
- Du changement de satellite
> (0,500 − 0,486) − (0,153 − 0,298) = 0,014 + 0,145. La double différence compare les traitées à ce qu'elles auraient fait en suivant le groupe de comparaison, qui baisse.
:oral
? Le nombre d'écoles électrifiées a-t-il augmenté dans les localités raccordées ?
> Presque pas : 0,49 avant, 0,50 après. La double différence de +0,16 vient surtout de la baisse observée dans le groupe de comparaison, de 0,30 à 0,15. C'est un effet par rapport au contrefactuel, pas une hausse observée, et il est fragile : il n'est plus significatif avec des erreurs-types groupées.
? Pourquoi la régression sur nl_intensive_hat a-t-elle deux fois moins d'observations ?
> Parce que la variable n'est définie que pour les localités éclairées au moins une fois : 139 sur 297. Et le traitement modifie cette appartenance, puisque 75 % des traitées y figurent contre 40 % des autres. C'est une sélection sur un résultat, qui limite la portée de l'estimation.
