#PART 1 | Revenus et prix des maisons dans les communes belges | Régression, logarithmes, indicatrices
:resultat 1,61 | élasticité du prix au revenu, à région donnée
:intro
>> Les communes où les habitants gagnent plus ont-elles des maisons plus chères ? De combien ? Et cette relation est-elle la même en Flandre, en Wallonie et à Bruxelles ?

### Ce que tu vas faire

Tu construis d'abord toi-même la base de données, à partir de deux fichiers publics de Statbel qui ne se correspondent pas tout à fait. Puis tu estimes la relation entre le revenu par habitant et le prix médian des maisons, de plusieurs façons, en te demandant à chaque étape ce que le chiffre veut dire.

| Étape | Questions | L'idée à retenir |
|---|---|---|
| A. Construire et décrire | 1.1 à 1.5 | Avant d'estimer quoi que ce soit, savoir ce qu'est une ligne et ce que mesurent vraiment les variables. |
| B. Formes fonctionnelles | 1.6 à 1.8 | Un coefficient se lit en euros ou en pourcentage selon l'endroit où se trouve le logarithme. |
| C. Régions | 1.9 à 1.12 | Ajouter la région change l'élasticité : c'est le biais de variable omise, que tu vérifies au chiffre près. |
| D. Interaction | 1.13 | L'élasticité peut différer d'une région à l'autre. |
| E. Hétéroscédasticité | 1.14 | La précision des estimations dépend d'une hypothèse sur la dispersion des erreurs. |
| F. Contrôles et causalité | 1.15 à 1.18 | Un bon contrôle, un mauvais contrôle, et pourquoi rien de tout cela n'est un effet causal. |

### Les données

Deux fichiers de Statbel, l'office belge de statistique.

| Fichier | Une ligne = | Ce qu'on en tire |
|---|---|---|
| `vastgoed_2010_9999.txt` | un territoire × une période × un type de bien | nombre de ventes, prix médian, quartiles |
| `TF_PSNL_INC_TAX_MUNTY.txt` | une commune × une année de revenus | revenu total net imposable, nombre d'habitants |

Les deux se rejoignent par le [[code INS]] de la commune. La base finale compte **551 communes** : 281 flamandes, 251 wallonnes et 19 bruxelloises.

### Le résultat en une phrase

À région donnée, une commune dont le revenu par habitant est supérieur de 1 % a un prix médian supérieur d'environ **1,6 %**. À revenu égal, les maisons sont environ 18 % moins chères en Wallonie et 2,4 fois plus chères à Bruxelles qu'en Flandre. Ce sont des associations entre communes, pas l'effet d'une hausse de revenu.

{{w:nuage modele=unique titre="Le nuage qui résume toute la partie 1"}}

#SEC A | Construction et description de l'échantillon

#Q 1.1 | Construire la base : 565, 581, puis 551 communes
:intro
Cette question est la plus longue du travail, et celle qui fait le plus peur. Elle ne demande pourtant aucune statistique : seulement de comprendre **pourquoi deux fichiers qui décrivent le même pays ne comptent pas le même nombre de communes**, et de réparer cela proprement.

L'outil ci-dessous montre tout le problème d'un coup. Reviens-y à chaque sous-question.

{{w:fusion}}
:concepts donnees
##a | Compter les communes dans chaque fichier
:enonce
Combien de communes le fichier des ventes compte-t-il pour 2023 (ensemble des maisons, niveau communal, année entière) ? Combien de communes le fichier fiscal compte-t-il pour 2023 ?
:court
**565 communes** dans le fichier des ventes, **581** dans le fichier fiscal. L'écart de 16 est le premier signe que les deux fichiers ne découpent pas le pays de la même façon.
:zero
Le fichier des ventes est un grand tableau « empilé » : la même commune y apparaît des dizaines de fois, pour chaque année, chaque trimestre, chaque type de bien. Pour compter les communes, il faut d'abord ne garder que **les lignes qui nous intéressent**. Quatre filtres :

| Variable | Valeurs possibles | Ce qu'on garde | Pourquoi |
|---|---|---|---|
| `CD_YEAR` | 2010 à 2026 | `2023` | l'année étudiée |
| `CD_PERIOD` | `Q1` à `Q4` (trimestres), `S1`, `S2` (semestres), `Y` (année) | `"Y"` | l'année entière ; sinon les mêmes ventes seraient comptées plusieurs fois |
| `CD_niveau_refnis` | 1 Belgique, 2 régions, 3 provinces, 4 arrondissements, 5 communes | `5` | le niveau communal |
| `CD_TYPE_NL` | 4 types de biens | « toutes les maisons » | l'énoncé exclut les appartements |

Comment savoir que `Y` veut dire « année » et que `5` veut dire « commune » ? Par les métadonnées, et en regardant ce que contient chaque variable avec `table()`. Petit contrôle malin : en 2023, pour un type de bien donné, le niveau 1 compte 1 ligne (la Belgique), le niveau 2 en compte 3 (les régions), le niveau 3 en compte 10 (les provinces), le niveau 4 en compte 43 (les arrondissements) et le niveau 5 en compte 565. C'est bien l'emboîtement administratif belge.

Le fichier fiscal est plus simple : une ligne par commune et par année. Il suffit de garder `CD_YEAR == 2023`.

:::piege Le code INS se lit comme du texte
`colClasses = c(CD_REFNIS = "character")` oblige R à lire le code comme une chaîne de caractères. Sinon `01000` deviendrait le nombre `1000`, et la fusion entre les deux fichiers échouerait sans message d'erreur.
:::
:res
| Fichier | Filtre | Communes |
|---|---|--:|
| Ventes | 2023, année entière, niveau 5, toutes les maisons | **565** |
| Fiscal | revenus 2023 | **581** |
:code
```r
# Repérer les valeurs utiles avant de filtrer
table(immo_raw$CD_PERIOD)          # Q1..Q4, S1, S2, Y
table(immo_raw$CD_niveau_refnis)   # 1 à 5

ventes23 <- immo_raw %>%
  filter(CD_YEAR == 2023, CD_PERIOD == "Y", CD_niveau_refnis == 5)

maisons23 <- ventes23 %>%
  filter(CD_TYPE_NL == "Alle huizen met 2, 3, 4 of meer gevels (excl. appartementen)") %>%
  transmute(refnis = CD_REFNIS, commune = CD_REFNIS_FR,
            n_ventes = MS_TOTAL_TRANSACTIONS, prix = MS_P_50_median,
            p25 = MS_P_25, p75 = MS_P_75)

fisc23 <- fisc_raw %>% filter(CD_YEAR == 2023)

n_distinct(maisons23$refnis)          # 565
n_distinct(fisc23$CD_MUNTY_REFNIS)    # 581
```

- `filter()` garde les lignes qui vérifient **toutes** les conditions séparées par des virgules.
- `%>%` (le « pipe ») passe le résultat de gauche à la fonction de droite : « prends `immo_raw`, puis filtre ».
- `transmute()` crée de nouvelles colonnes et ne garde qu'elles : c'est ici qu'on donne aux variables les noms demandés par l'énoncé.
- `n_distinct()` compte les valeurs différentes.
:gpt
Filtre le type de bien sur l'intitulé **français** : `CD_TYPE_FR == "Toutes les maisons avec 2, 3, 4 ou plus de façades (excl. appartements)"`. Ajoute une phrase utile : additionner les trimestres à l'année, ou les sous-types de maisons à leur total, compterait plusieurs fois les mêmes ventes.
:claude
Filtre sur l'intitulé **néerlandais**, qui ne contient aucun accent, et justifie ce choix : une comparaison de chaînes avec « façades » peut échouer si l'encodage du fichier est mal lu. Donne le contrôle 1 / 3 / 10 / 43 / 565 pour vérifier le sens des niveaux.
:verdict
Mêmes chiffres. La seule différence est le libellé utilisé pour filtrer. Celui de Claude est plus prudent : le « ç » de « façades » est exactement le genre de caractère qu'un problème d'encodage abîme. La phrase de ChatGPT sur le double comptage mérite d'être reprise : elle montre que tu sais *pourquoi* tu filtres.
:opt mix | Filtrer sur le néerlandais et justifier chaque filtre
Je garde l'année 2023, la période annuelle `Y` (les trimestres et semestres recompteraient les mêmes ventes), le niveau communal 5 et la ligne « toutes les maisons ». Je filtre sur l'intitulé néerlandais, sans accent, pour ne pas dépendre de l'encodage. J'obtiens 565 communes dans les ventes et 581 dans le fichier fiscal.
:opt gpt | Filtrer sur l'intitulé français
Même sélection, avec le libellé français du type de bien. Plus lisible pour un lecteur francophone, mais sensible à l'encodage du fichier.
##b | Les communes présentes dans un seul fichier
:enonce
Établissez la liste des communes qui ne figurent que dans un seul des deux fichiers (fonction `anti_join()` du package dplyr). Combien y en a-t-il de chaque côté ? Que remarquez-vous dans leurs noms ?
:court
**13 communes** n'existent que dans le fichier des ventes, **29** que dans le fichier fiscal. Les noms des premières sont des assemblages des secondes (Nazareth-De Pinte, Merelbeke-Melle…) : ce sont des **fusions de communes**.
:zero
`anti_join(x, y)` renvoie les lignes de `x` qui n'ont **aucun correspondant** dans `y`. C'est l'outil qui repère les « orphelins » d'une fusion. On l'appelle deux fois, en inversant les tables.

Regarde les deux listes dans l'outil en haut de la page. Trois choses sautent aux yeux :

- côté ventes, des **noms composés** : Nazareth-De Pinte, Merelbeke-Melle, Tessenderlo-Ham, Bilzen-Hoeselt, Tongres-Borgloon, Beveren-Kruibeke-Zwijndrecht ;
- côté fiscal, **les morceaux** de ces noms : Nazareth, De Pinte, Merelbeke, Melle, Tessenderlo, Ham… ;
- certains noms sont **des deux côtés, avec des codes différents** : Wingene, Tielt, Lochristi, Lokeren, Hasselt, Bastogne. La nouvelle commune a gardé le nom de l'une des anciennes, mais a reçu un nouveau code.

Sur les 29 communes « fiscales », 27 sont flamandes et 2 wallonnes (Bastogne et Bertogne). Les deux listes décrivent donc les mêmes territoires, découpés différemment : 29 anciennes communes sont devenues 13 nouvelles.

:::astuce Le compte est-il bon ?
581 − 29 + 13 = 565. Les 16 communes d'écart de la question (a) sont bien 29 − 13.
:::
:code
```r
seulement_ventes <- anti_join(maisons23, fisc23, by = c("refnis" = "CD_MUNTY_REFNIS"))
seulement_fisc   <- anti_join(fisc23, maisons23, by = c("CD_MUNTY_REFNIS" = "refnis"))
nrow(seulement_ventes)   # 13
nrow(seulement_fisc)     # 29
```

`by = c("refnis" = "CD_MUNTY_REFNIS")` dit à R que la colonne `refnis` de la première table correspond à la colonne `CD_MUNTY_REFNIS` de la seconde. On en a besoin parce que la clé ne porte pas le même nom dans les deux fichiers.
:accord Mêmes listes et mêmes effectifs. Claude détaille davantage ce qu'on remarque dans les noms (noms composés, mêmes noms avec un autre code, 27 communes flamandes et 2 wallonnes) ; ChatGPT le dit en deux phrases. L'énoncé pose explicitement la question des noms : la version détaillée y répond mieux.
##c | D'où vient la différence ?
:enonce
La documentation de Statbel n'explique pas cette différence. Consultez la page de Statistiek Vlaanderen « Nieuwe NIS-codes voor gefuseerde gemeenten vanaf 1 januari 2025 ». Expliquez l'origine de la différence entre les deux fichiers, et pourquoi ils ne suivent pas le même découpage communal pour l'année 2023.
:court
28 communes flamandes ont fusionné en 13 le **1er janvier 2025**, et Bastogne a absorbé Bertogne le **2 décembre 2024**. Le fichier des ventes décrit toutes ses années, 2023 comprise, avec le **nouveau** découpage (565 communes) ; le fichier fiscal garde l'**ancien** (581 communes).
:zero
Une commune fusionnée reçoit en principe un nouveau code INS. La page de Statistiek Vlaanderen donne la table de correspondance entre anciens et nouveaux codes pour les fusions flamandes.

Reste la vraie question : pourquoi, **pour la même année 2023**, les deux fichiers n'utilisent-ils pas le même découpage ? Parce que chacun applique **un seul découpage à toute sa série**, mais pas le même. Les données elles-mêmes le montrent.

| Fichier | Ce qu'on observe | Ce que ça veut dire |
|---|---|---|
| Ventes | 565 communes **chaque année** de 2010 à 2025. Pajottegem a des ventes en 2010, alors qu'elle n'existe que depuis 2025. | Statbel a **recalculé tout l'historique** sur le découpage de 2025. |
| Fiscal | 581 communes **chaque année** de 2005 à 2023. | Le fichier utilise le découpage en vigueur avant les fusions. |

C'est cohérent : la série des ventes va jusqu'en 2026 et doit donc décrire les nouvelles communes ; les revenus de 2023, eux, ont été déclarés et imposés en 2024, quand les anciennes communes existaient encore.

En une phrase : **chaque fichier est cohérent avec lui-même, mais l'un décrit 2023 avec les communes de 2025, l'autre avec celles de 2023.**

:::verif Une erreur de date dans les deux versions
ChatGPT et Claude écrivent tous deux que la fusion de Bastogne et Bertogne date du **1er décembre 2024**. La date d'effet est le **2 décembre 2024**, le lundi d'installation du nouveau conseil communal (décret wallon du 19 mai 2023 ; note du Registre national sur les fusions, [ibz.rrn.fgov.be](https://ibz.rrn.fgov.be/fileadmin/user_upload/fr/rn/circulaires/NOT_Fusion_General.pdf)). Corrige-la dans ton rapport.
:::
:gpt
Explication courte : les fusions flamandes prennent effet le 1er janvier 2025, celle de Bastogne en décembre 2024 ; la série de ventes a été exprimée sur le découpage récent, le fiscal garde celui de 2023. Cite une note de Statbel selon laquelle certaines séries historiques sont recalculées sur les nouvelles limites.
:claude
Même explication, mais **démontrée par les données** : 565 communes chaque année dans les ventes (Pajottegem a des ventes dès 2010), 581 chaque année dans le fiscal. Ajoute l'argument fiscal : les revenus 2023 sont imposés en 2024, avant les fusions.
:verdict
Même conclusion. La version de Claude est plus convaincante parce qu'elle **prouve** l'affirmation avec deux comptages que tu peux refaire en une ligne de R. J'ai vérifié les deux : 565 communes pour chaque année de 2010 à 2025 dans les ventes (et les premiers trimestres de 2026), 581 pour chaque année de 2005 à 2023 dans le fiscal. Les deux versions se trompent d'un jour sur Bastogne.
:opt claude | Explication démontrée par les données
Les deux fichiers appliquent chacun un seul découpage à toute leur série. Le fichier des ventes compte 565 communes pour chaque année depuis 2010 : Statbel a recalculé l'historique sur le découpage de 2025 (Pajottegem a des ventes en 2010 alors qu'elle n'existe que depuis 2025). Le fichier fiscal compte 581 communes chaque année : il garde l'ancien découpage, celui dans lequel les revenus de 2023 ont été imposés. Les fusions (28 communes flamandes devenues 13 au 1er janvier 2025, Bastogne et Bertogne au 2 décembre 2024) expliquent l'écart.
:opt gpt | Explication courte
Les fusions de communes (1er janvier 2025 en Flandre, décembre 2024 pour Bastogne) ont créé de nouveaux codes. La série des ventes a été recalculée sur le nouveau découpage, alors que la statistique fiscale de 2023 garde l'ancien.
:code
```r
# Le fichier des ventes utilise-t-il le même découpage chaque année ?
immo_raw %>%
  filter(CD_PERIOD == "Y", CD_niveau_refnis == 5,
         CD_TYPE_NL == "Alle huizen met 2, 3, 4 of meer gevels (excl. appartementen)") %>%
  group_by(CD_YEAR) %>% summarise(communes = n_distinct(CD_REFNIS))    # 565 partout

fisc_raw %>% group_by(CD_YEAR) %>%
  summarise(communes = n_distinct(CD_MUNTY_REFNIS))                     # 581 partout
```

Ces lignes ne sont dans aucun des deux scripts : ce sont les deux comptages qui prouvent l'explication. `group_by()` puis `summarise()` calcule une ligne par année.
##d | Le piège d'Anvers
:enonce
Comparez la liste de cette page avec vos listes de la question (b) : l'une des communes concernées n'apparaît pas parmi les communes du fichier des ventes absentes du fichier fiscal. Laquelle, et pourquoi ? Quelle erreur commettriez-vous pour cette commune en fusionnant simplement les deux fichiers par code INS ?
:court
**Anvers.** Elle a absorbé Borsbeek en **gardant son code 11002**. Ce code existe donc dans les deux fichiers, mais il ne désigne pas le même territoire. Une fusion directe associerait les ventes d'Anvers + Borsbeek au revenu et à la population de la seule ancienne Anvers, **sans aucun message d'erreur**.
:zero
La page de Statistiek Vlaanderen liste 14 opérations de fusion, mais ton `anti_join` côté ventes ne renvoie que 13 communes. Il en manque une : celle dont le code n'a pas changé.

Toutes les communes fusionnées ont reçu un nouveau code, **sauf Anvers**. Sélectionne-la dans l'outil en haut de la page : Borsbeek (11007) apparaît bien dans la liste « seulement fiscal », mais Anvers n'apparaît nulle part, puisque 11002 se retrouve des deux côtés.

| Fichier | Ce que désigne le code 11002 | Chiffres 2023 |
|---|---|---|
| Ventes | Anvers **+ Borsbeek** | 2 729 ventes, prix médian 339 000 € |
| Fiscal | Anvers **seule** | 544 759 habitants, 20 370 € par habitant |
| Fiscal, code 11007 | Borsbeek | 11 379 habitants, 22 597 € par habitant |

L'erreur chiffrée est petite : la population serait sous-estimée de 11 379 habitants (2 %) et le revenu par habitant vaudrait 20 370 € au lieu de 20 416 €. Mais c'est la pire sorte d'erreur : **silencieuse**. Pas de valeur manquante, pas d'avertissement, et Borsbeek disparaît de la base sans laisser de trace.

:::cle La leçon générale
Une fusion de tables par clé ne vérifie que les **codes**, jamais leur **signification**. Deux lignes peuvent se rejoindre parfaitement et parler de deux choses différentes.
:::
:gpt
Identifie Anvers et l'erreur (prix d'Anvers agrandie, revenu de la seule ancienne Anvers). Avance une raison pour le maintien du code : l'ajout de Borsbeek n'augmente la population que d'environ 2 %, « selon Statistiek Vlaanderen ».
:claude
Identifie Anvers, **chiffre** l'erreur (11 379 habitants, 20 370 € au lieu de 20 416 €) et insiste sur son caractère silencieux.
:verdict
Même réponse. Claude quantifie mieux l'erreur, ce que la question demande (« quelle erreur commettriez-vous ? »). La raison donnée par ChatGPT est plausible : une analyse d'impact fédérale d'avril 2024 évoque bien un changement limité à 2 % de la superficie et de la population. Je n'ai pas pu relire la page de Statistiek Vlaanderen pour confirmer qu'elle donne cette raison en ces termes : si tu veux la citer, vérifie-la sur la page.
##e | Reconstituer les communes fusionnées
:enonce
Reconstituez dans le fichier fiscal les communes issues des fusions, de façon à pouvoir les conserver dans votre base. Pourquoi cette reconstitution est-elle possible pour `rev_hab` ? Aurait-elle été possible dans l'autre sens, c'est-à-dire en répartissant entre les anciennes communes les données de ventes des nouvelles communes ?
:court
On **additionne** les revenus totaux et les habitants des anciennes communes, puis on **refait la division**. C'est possible parce que `rev_hab` est un rapport de deux totaux. Dans l'autre sens, c'est impossible : une médiane ne se découpe pas sans les prix de chaque vente.
:zero
Un total s'additionne. Le revenu total de la nouvelle commune est exactement la somme des revenus totaux des anciennes, et de même pour les habitants. Le revenu par habitant de la commune fusionnée est donc :

$$ rev\_hab_{fusion} = \frac{\text{somme des revenus totaux}}{\text{somme des habitants}} $$

Pour Anvers : (11 097,0 + 257,1 millions €) / (544 759 + 11 379) = **20 416 €**.

:::piege Ne fais pas la moyenne des revenus par habitant
La moyenne simple de 20 370 € et 22 597 € donnerait 21 484 €, comme si Borsbeek pesait autant qu'Anvers. Le rapport des sommes est une moyenne **pondérée par la population**, et c'est la seule correcte. L'outil en haut de la page montre l'écart pour chacune des 14 fusions.
:::

**Et dans l'autre sens ?** Il faudrait retrouver le prix médian de Nazareth seule à partir du prix médian de Nazareth-De Pinte. C'est impossible : la médiane dépend de **tous les prix individuels**, que le fichier ne contient pas. Même le nombre de ventes ne se répartit pas, puisqu'on ne sait pas dans quelle ancienne commune chaque vente a eu lieu.

:::cle La règle à retenir
On peut **agréger** des totaux d'un niveau fin vers un niveau plus large. On ne peut pas **désagréger** sans les données individuelles.
:::
:code
```r
# Table de passage : ancien code -> nouveau code (page de Statistiek Vlaanderen)
fusions <- data.frame(
  ancien  = c("11002", "11007", "23023", "23024", "23032" ),   # … 30 lignes en tout
  nouveau = c("11002", "11002", "23106", "23106", "23106" ))

fisc23_new <- fisc23 %>%
  left_join(fusions, by = c("CD_MUNTY_REFNIS" = "ancien")) %>%
  mutate(refnis = ifelse(is.na(nouveau), CD_MUNTY_REFNIS, nouveau)) %>%
  group_by(refnis) %>%
  summarise(rev_tot = sum(MS_TOT_NET_TAXABLE_INC),   # les totaux s'additionnent
            pop     = sum(MS_TOT_RESIDENTS),
            region  = first(region), .groups = "drop") %>%
  mutate(rev_hab = rev_tot / pop)                    # puis on refait le rapport

nrow(fisc23_new)                                         # 565
nrow(anti_join(maisons23, fisc23_new, by = "refnis"))    # 0 : plus aucun orphelin
```

1. `left_join()` colle à chaque commune fiscale son nouveau code, s'il y en a un. Les communes non concernées reçoivent `NA`.
2. `mutate(refnis = ifelse(...))` : si pas de nouveau code, on garde l'ancien.
3. `group_by(refnis)` regroupe les anciennes communes qui partagent le même nouveau code ; `summarise()` les additionne.
4. Les deux dernières lignes sont le **contrôle** : 565 communes, et plus aucun orphelin.
:accord Même méthode (table de passage, somme des totaux, puis rapport) et même raisonnement sur l'impossibilité de désagréger une médiane. ChatGPT ajoute dans son script un contrôle élégant : après regroupement, la population totale et le revenu total du pays doivent être inchangés (`stopifnot(sum(...) == sum(...))`). C'est une bonne idée à reprendre.
##f | Les 14 communes sans prix médian
:enonce
Certaines communes n'ont pas de prix médian. Combien ? Comparez leur nombre de ventes à celui des autres communes. Pourquoi, selon vous, Statbel ne publie-t-il pas de médiane pour ces communes ? Leur exclusion peut-elle affecter vos résultats ?
:court
**14 communes** n'ont pas de prix médian. Elles ont toutes **19 ventes ou moins**, contre 108 en médiane pour les autres. Statbel ne publie les médianes qu'à partir de 16 ventes au prix exploitable, pour des raisons de **fiabilité** et de **confidentialité**. Leur exclusion change peu les résultats (2,5 % des communes, 0,3 % de la population), mais ceux-ci ne valent que pour les communes où il se vend assez de maisons.
:zero
565 − 14 = **551** : c'est le nombre de contrôle donné par l'énoncé.

**Qui sont-elles ?** De très petites communes rurales : 10 wallonnes (Ouffet, Tinlot, Amblève, Baelen, Olne, Burg-Reuland, Martelange, Sainte-Ode, Daverdisse, Herbeumont) et 4 flamandes (Biévène, Messines, Horebeke, Herstappe). Herstappe, la plus petite commune du pays (76 habitants), n'a même aucun nombre de ventes renseigné.

**Pourquoi pas de médiane ?** Deux raisons, qui sont celles que donne la méthodologie de Statbel.

- **Fiabilité.** Une médiane calculée sur cinq ou dix ventes change énormément d'une année à l'autre, au gré des biens vendus. La question 1.3 le chiffre.
- **Confidentialité.** Avec cinq ventes, la médiane et les quartiles sont presque des prix individuels : on pourrait reconnaître une transaction.

Le seuil se voit dans les données :

| Ventes de maisons en 2023 | Communes sans médiane | Communes avec médiane |
|---|--:|--:|
| 15 ou moins | 6 | 0 |
| 16 | 1 | 0 |
| 17 à 19 | 6 | 4 |
| 20 ou plus | 0 | 547 |

Entre 17 et 19 ventes, certaines médianes sont publiées et d'autres non. L'explication : le seuil de 16 porte sur les ventes dont **le prix est exploitable**, et le fichier compte aussi des actes sans prix utilisable.

**L'exclusion fausse-t-elle les résultats ?** Peu en pratique. Sur le principe, c'est une sélection sur la **taille du marché**, pas directement sur le prix : elle ne biaise pas les estimations si la relation entre prix et revenu est la même dans ces communes qu'ailleurs. Mais on ne peut pas le vérifier, et nos résultats ne décrivent donc que les communes où il se vend au moins une quinzaine de maisons par an.
:res
| Groupe | Communes | Ventes (médiane) | Ventes (min – max) | Habitants (moyenne) | Revenu par habitant (moyenne) |
|---|--:|--:|--:|--:|--:|
| Avec prix médian | 551 | 108 | 17 – 2 729 | 21 282 | 24 288 € |
| Sans prix médian | 14 | 16 | 5 – 19 | 2 655 | 23 296 € |
:code
```r
base_565 <- maisons23 %>%
  inner_join(fisc23_new, by = "refnis") %>%    # garde les communes présentes des deux côtés
  left_join(apparts23, by = "refnis")          # ajoute n_app, NA s'il n'y en a pas

sum(is.na(base_565$prix))                      # 14
base <- base_565 %>% filter(!is.na(prix))      # la base d'analyse
nrow(base)                                     # 551
```

`is.na()` repère les valeurs manquantes ; `!` veut dire « non ». `filter(!is.na(prix))` garde donc les lignes où le prix **n'est pas** manquant.
:gpt
Donne la règle : Statbel publie les percentiles à partir de **16 transactions ayant un prix valable**, et un total de 19 ventes peut inclure des actes sans prix exploitable. Note que Herstappe n'a pas de nombre de ventes. Sur les conséquences : si ces communes sont plus rurales ou suivent une pente différente, le résultat se généralise moins bien aux 565.
:claude
Donne deux raisons, **fiabilité** et **confidentialité**, et retrouve le seuil en observant les données (aucune médiane sous 16 ventes, toutes à partir de 20, mélange entre les deux). Chiffre le poids de l'exclusion : 2,5 % des communes, 0,3 % de la population. Distingue sélection sur la taille du marché et sélection sur le prix.
:verdict
Les deux réponses se complètent, et la meilleure les combine. ChatGPT a la **règle documentée** ; Claude a les **deux raisons** et la discussion la plus complète du biais. J'ai recoupé : la fiche de métadonnées de l'IWEPS, qui reprend la méthodologie de Statbel, indique que les médianes ne sont publiées qu'à partir de 16 logements vendus, « pour atteindre une certaine représentativité et garantir la confidentialité », et que le nombre de transactions affiché peut dépasser ce seuil quand certains prix manquent. Les données confirment la règle (tableau ci-dessus).
:opt mix | La règle, les deux raisons, puis le biais
14 communes n'ont pas de prix médian ; toutes ont 19 ventes ou moins, contre 108 en médiane ailleurs. Statbel ne publie les médianes qu'à partir de 16 ventes au prix exploitable, pour deux raisons : une médiane sur si peu de ventes est trop instable, et elle révélerait presque des prix individuels. Leur exclusion pèse peu (2,5 % des communes, 0,3 % de la population). C'est une sélection sur la taille du marché, qui ne biaise les estimations que si la relation prix-revenu y est différente ; nos résultats valent pour les communes où il se vend assez de maisons.
:opt gpt | Mettre l'accent sur la règle de publication
Statbel publie les percentiles à partir de 16 transactions au prix valable. Les 14 communes concernées sont de petits marchés ; si elles sont plus rurales ou moins chères, les résultats sur 551 communes se généralisent moins bien aux 565.
:opt claude | Mettre l'accent sur les raisons et le poids de l'exclusion
Les 14 communes sans médiane sont de très petites communes rurales. Statbel ne publie pas leur médiane parce qu'elle serait peu fiable et presque individuelle. Elles ne représentent que 0,3 % de la population : leur exclusion change peu les estimations.
:quiz
? Pourquoi le fichier des ventes compte-t-il 565 communes en 2023, alors que les fusions n'ont eu lieu qu'en 2024-2025 ?
- Parce que les fusions ont été décidées dès 2023
+ Parce que Statbel a recalculé toute la série sur le découpage de 2025
- Parce que 16 communes n'ont eu aucune vente en 2023
> Le fichier compte 565 communes pour chaque année depuis 2010. Pajottegem y a des ventes en 2010 alors qu'elle n'existe que depuis 2025 : l'historique a été recalculé.
? Pour reconstituer le revenu par habitant d'une commune fusionnée, il faut :
- faire la moyenne des revenus par habitant des anciennes communes
+ additionner les revenus totaux, additionner les habitants, puis diviser
- prendre le revenu par habitant de la plus grande des anciennes communes
> Le rapport des sommes est une moyenne pondérée par la population. La moyenne simple donnerait le même poids à Borsbeek qu'à Anvers.
? Pourquoi Anvers est-elle un piège ?
- Elle n'a pas de prix médian
- Elle n'apparaît dans aucun des deux fichiers
+ Son code est le même dans les deux fichiers, mais ne désigne pas le même territoire
> Anvers a gardé le code 11002 en absorbant Borsbeek. La fusion des tables « réussit », mais avec le revenu et la population de l'ancienne Anvers.
:oral
? Pourquoi lis-tu le code INS comme du texte ?
> Pour garder les zéros initiaux (01000 pour la Belgique) et fusionner sur des chaînes strictement identiques. Lu comme un nombre, le code perd ses zéros et la fusion échoue sans prévenir.
? Explique en trente secondes pourquoi tu as 551 communes.
> Le fichier des ventes compte 565 communes, sur le découpage de 2025. Le fichier fiscal en compte 581, sur l'ancien découpage. Je reconstitue les 14 communes fusionnées dans le fichier fiscal en additionnant revenus et habitants, ce qui donne 565 communes des deux côtés. J'en retire 14 qui n'ont pas de prix médian, faute de ventes suffisantes : il en reste 551.
? Que fait `anti_join(x, y)` ?
> Il renvoie les lignes de x qui n'ont aucun correspondant dans y. Je l'utilise dans les deux sens pour repérer les communes présentes dans un seul fichier.
? Pourquoi ne peut-on pas répartir les ventes d'une nouvelle commune entre les anciennes ?
> Parce qu'une médiane dépend de tous les prix individuels, que le fichier ne donne pas. On peut additionner des totaux, pas découper une médiane.
:retenir
- 565 communes dans les ventes (découpage 2025), 581 dans le fiscal (ancien découpage), 13 et 29 orphelins.
- On agrège le fichier fiscal vers le nouveau découpage : somme des totaux, puis rapport.
- Anvers garde son code : le piège silencieux.
- 14 communes sans médiane (moins de 16 prix exploitables) : il reste 551 communes.

#Q 1.2 | Ce que mesurent vraiment prix et rev_hab
:intro
Avant d'estimer une relation entre deux variables, il faut se demander ce qu'elles mesurent **vraiment**. Aucune des deux ne mesure exactement ce qu'on voudrait. Ces limites reviendront à la question 1.18, quand il faudra dire pourquoi l'élasticité n'est pas un effet causal.
:concepts donnees
##a | Le prix médian mesure-t-il la valeur des maisons ?
:enonce
`prix` est le prix médian des maisons vendues en 2023 dans la commune. Est-ce une mesure de la valeur des maisons de la commune ? Donnez une raison pour laquelle les deux peuvent différer.
:court
**Non, pas exactement.** C'est la médiane des maisons **vendues en 2023**, pas celle de **toutes** les maisons de la commune. Les deux diffèrent dès que les maisons vendues une année donnée ne ressemblent pas au parc existant.
:zero
Imagine une commune de 5 000 maisons dont 80 se vendent en 2023. `prix` ne décrit que ces 80. Si ce sont surtout de petites maisons mitoyennes, ou des maisons à rénover vendues après une succession, leur prix médian sera plus bas que la valeur médiane des 5 000. C'est un **effet de composition** : l'échantillon des ventes n'est pas tiré au hasard dans le parc.

Deux autres raisons, si tu veux aller plus loin :

- **Qualité et taille.** Le prix médian mélange le prix « d'une maison donnée » et le type de maisons de la commune. Une commune de grandes villas a un prix médian élevé même si le mètre carré y est bon marché.
- **Hasard.** Avec peu de ventes, la médiane dépend des quelques biens vendus cette année-là (question 1.3).

L'énoncé ne demande qu'**une** raison. Donne la première, c'est la plus directe.
:gpt
Une raison : si les biens rénovés changent plus souvent de propriétaire, les ventes surreprésentent ces maisons par rapport au parc.
:claude
Trois raisons : composition des ventes (petites maisons, maisons à rénover), qualité et taille des biens, hasard quand il y a peu de ventes.
:verdict
Même idée de fond : les ventes ne sont pas un échantillon représentatif du parc. Les exemples vont en sens opposé (ChatGPT : des maisons rénovées, donc un prix médian trop haut ; Claude : des maisons à rénover, donc trop bas), et c'est justement ce qu'il faut comprendre : on ne sait pas dans quel sens va l'écart. Une seule raison suffit ; choisis celle que tu sais expliquer.
:opt claude | Composition des ventes
Non : `prix` est la médiane des maisons vendues en 2023, pas de toutes les maisons de la commune. Si les biens vendus cette année-là ne ressemblent pas au parc (davantage de petites maisons ou de maisons à rénover, par exemple), le prix médian des ventes s'écarte de la valeur médiane des maisons.
:opt gpt | Rotation plus forte de certains biens
Non : le prix médian partage en deux les ventes de l'année. Si certains biens, par exemple les maisons rénovées, changent plus souvent de propriétaire, ils sont surreprésentés parmi les ventes par rapport au parc.
##b | Pourquoi rev_hab mesure mal le revenu des ménages
:enonce
Donnez deux raisons pour lesquelles `rev_hab` peut mal mesurer le revenu des ménages d'une commune. L'une de ces raisons concerne particulièrement certaines communes bruxelloises : laquelle ?
:court
1. On divise par les **habitants**, enfants compris, pas par les ménages : à revenu de ménage égal, une commune de familles nombreuses a un `rev_hab` plus bas.
2. Le revenu **imposable** n'est pas tout le revenu. À Bruxelles, les **fonctionnaires européens et internationaux** ne paient pas l'impôt belge sur leur salaire : leurs revenus élevés manquent, alors qu'ils habitent et achètent dans ces communes.
:zero
`rev_hab` = revenu total net imposable de la commune ÷ nombre d'habitants. Regarde séparément le haut et le bas de la fraction.

**Le dénominateur.** On divise par tous les résidents, bébés compris. Deux communes où chaque ménage gagne 60 000 € : dans l'une les ménages comptent deux personnes (`rev_hab` = 30 000 €), dans l'autre quatre (`rev_hab` = 15 000 €). Le pouvoir d'achat immobilier des ménages est pourtant le même.

**Le numérateur.** Le revenu net imposable est ce qui figure dans la déclaration d'impôt. Il manque :

- les revenus non imposables (les allocations familiales, par exemple) ;
- la plupart des revenus du capital (intérêts, dividendes), taxés à la source et souvent non déclarés ;
- les loyers perçus, taxés sur le revenu cadastral, bien inférieur aux loyers réels ;
- et, pour Bruxelles, les salaires des fonctionnaires européens et internationaux, **exonérés de l'impôt belge**.

Ce dernier point se voit dans les données. Ixelles a le prix médian le plus élevé du pays (840 000 €) pour un revenu par habitant de 21 877 €, **sous la moyenne belge**. Les ménages qui y achètent des maisons sont en partie invisibles dans la statistique fiscale.

:::cle Pourquoi c'est important pour la suite
À Bruxelles, `rev_hab` sous-estime le revenu réel des acheteurs. Les communes bruxelloises se retrouvent donc à gauche du nuage (revenu apparent faible) et très haut (prix élevés) : c'est ce qui tire vers le bas l'élasticité du modèle sans régions (question 1.12).
:::
:accord Mêmes deux raisons (dénominateur en habitants, revenus absents de la statistique fiscale) et même réponse pour Bruxelles (les fonctionnaires internationaux). Claude ajoute l'exemple chiffré d'Ixelles et la liste des revenus manquants ; ChatGPT cite le glossaire de l'IBSA comme source pour le cas bruxellois.
:quiz
? Deux communes ont exactement les mêmes ménages, avec les mêmes revenus, mais dans l'une les ménages ont plus d'enfants. Son rev_hab sera :
- le même
+ plus faible
- plus élevé
> On divise par tous les habitants, enfants compris. Plus d'enfants, même revenu : un revenu par habitant plus bas.
:oral
? Pourquoi les communes bruxelloises ont-elles un revenu par habitant si bas pour des prix si élevés ?
> En partie parce que rev_hab y sous-estime le revenu des acheteurs : les fonctionnaires européens et internationaux ne paient pas l'impôt belge sur leur salaire, donc leurs revenus n'apparaissent pas dans la statistique fiscale, alors qu'ils achètent des maisons dans ces communes.

#Q 1.3 | Rouvroy et Charleroi : la précision d'une médiane
:intro
Deux communes au prix médian presque identique, mais l'une repose sur 17 ventes et l'autre sur 1 854. Cette question te fait mesurer ce que cela change, et prépare la question 1.14 sur l'hétéroscédasticité.
:concepts donnees, incertitude
##a | Comparer les deux communes
:enonce
Comparez les communes de Rouvroy et de Charleroi : nombre de ventes, prix médian, écart interquartile (p75 − p25) et écart interquartile rapporté au prix médian.
:court
Prix médians proches (158 500 € et 137 750 €), mais Rouvroy repose sur **109 fois moins de ventes** (17 contre 1 854), et ses prix sont bien plus dispersés : l'écart interquartile y **dépasse le prix médian** (rapport de 1,09, contre 0,65 à Charleroi).
:zero
L'[[écart interquartile]] p75 − p25 est la largeur de la « moitié centrale » des prix : un quart des maisons se vend moins cher que p25, un quart plus cher que p75. Le diviser par le prix médian permet de comparer la dispersion de deux communes qui n'ont pas le même niveau de prix.

À Rouvroy, la moitié centrale des ventes s'étale de 97 500 € à 269 500 € : presque du simple au triple. Dans une petite commune rurale, quelques biens très différents (une fermette, une maison à rénover, une villa récente) suffisent à écarter les quartiles.
:res
| Commune | Ventes | Prix médian | p25 | p75 | Écart interquartile | Écart / prix médian |
|---|--:|--:|--:|--:|--:|--:|
| Charleroi | 1 854 | 137 750 € | 95 000 € | 185 000 € | 90 000 € | 0,65 |
| Rouvroy | 17 | 158 500 € | 97 500 € | 269 500 € | 172 000 € | 1,09 |
:code
```r
tab_1_3 <- base %>%
  filter(commune %in% c("ROUVROY", "CHARLEROI")) %>%
  transmute(commune, n_ventes, prix, p25, p75,
            eiq         = p75 - p25,
            eiq_relatif = (p75 - p25) / prix,
            se_mediane  = 0.93 * (p75 - p25) / sqrt(n_ventes))
```

`%in%` teste l'appartenance à une liste : « la commune est-elle Rouvroy ou Charleroi ? ». Les noms sont en majuscules dans le fichier des ventes.
:accord Mêmes chiffres dans les deux versions.
##b | L'erreur-type de la médiane
:enonce
Pour une distribution normale, l'erreur-type de la médiane d'un échantillon de n observations vaut environ 0,93 × (p75 − p25)/√n. Calculez cette erreur-type approximative pour les deux communes et comparez-les.
:court
**Rouvroy : 38 796 €** (24,5 % du prix médian). **Charleroi : 1 944 €** (1,4 %). L'erreur-type est **20 fois plus grande** à Rouvroy.
:zero
L'[[erreur-type]] répond à la question : « si l'on avait observé d'autres ventes, tirées dans la même distribution de prix, de combien la médiane aurait-elle bougé ? ». L'outil ci-dessous le montre.

{{w:mediane}}

La formule dit deux choses simples :

$$ \text{erreur-type} ≈ 0,93 × \frac{p75 − p25}{\sqrt{n}} $$

- **plus les prix sont dispersés** (numérateur), moins la médiane est précise ;
- **plus il y a de ventes** (dénominateur), plus elle est précise, mais seulement comme $\sqrt{n}$ : il faut quatre fois plus de ventes pour doubler la précision.

Le calcul : Rouvroy, 0,93 × 172 000 / √17 = 38 796 €. Charleroi, 0,93 × 90 000 / √1 854 = 1 944 €.

D'où vient le facteur 20 ? Il se décompose : le nombre de ventes explique un facteur √(1 854 / 17) = 10,4 ; la dispersion plus forte explique le reste (172 000 / 90 000 = 1,9). Et 10,4 × 1,9 ≈ 20.

+++ D'où sort le 0,93 ?
Pour une loi normale d'écart-type σ, l'erreur-type de la médiane vaut environ 1,2533 × σ / √n. Or l'écart interquartile d'une loi normale vaut 1,349 × σ. En remplaçant σ par (écart interquartile) / 1,349, on obtient le facteur 1,2533 / 1,349 = 0,93. Tu n'as pas à le démontrer : l'énoncé donne la formule.
+++
:res
| Commune | Erreur-type | En % du prix médian | Intervalle à 95 % du prix médian |
|---|--:|--:|--:|
| Charleroi | 1 944 € | 1,4 % | 133 900 € – 141 600 € |
| Rouvroy | 38 796 € | 24,5 % | 82 500 € – 234 500 € |
:accord Mêmes valeurs. Claude ajoute l'intervalle de confiance et la décomposition du facteur 20 (10,4 × 1,9), qui rendent la comparaison parlante. ChatGPT se limite aux deux calculs.
##c | Conséquence pour la régression
:enonce
Le prix médian de Rouvroy est-il une mesure aussi fiable du prix d'une maison typique de la commune que celui de Charleroi ? Si `prix` est la variable dépendante d'une régression, quelle hypothèse du modèle linéaire cette différence de précision entre communes peut-elle remettre en cause ? Vous le vérifierez à la question 1.14.
:court
**Non** : la médiane de Rouvroy est bien moins fiable. Comme `prix` est la variable dépendante, cette imprécision entre dans le terme d'erreur, dont la variance dépend alors du nombre de ventes. C'est l'hypothèse d'**homoscédasticité** (variance constante des erreurs) qui est remise en cause.
:zero
Le raisonnement tient en trois étapes.

1. Le prix qu'on observe est le « vrai » prix typique de la commune, plus une erreur d'échantillonnage : $prix_{observé} = prix_{typique} + e$.
2. Dans la régression, cette erreur $e$ se retrouve dans le [[terme d'erreur]] $u$, avec tout le reste.
3. La variance de $e$ vaut environ (0,93 × écart interquartile)² / n : elle est **énorme à Rouvroy, minuscule à Charleroi**. La variance de $u$ n'est donc pas la même pour toutes les communes.

Une variance des erreurs qui change d'une observation à l'autre, c'est par définition de l'[[hétéroscédasticité]].

| | Ce que ça change |
|---|---|
| Les coefficients | **Rien** : une erreur de mesure sur y, sans lien avec x, ajoute du bruit mais pas de biais. |
| Les erreurs-types classiques | Elles deviennent **fausses**. D'où les erreurs-types robustes HC1 imposées par l'énoncé. |
| L'efficacité | Les MCO ne sont plus les plus précis. Des moindres carrés pondérés par le nombre de ventes le seraient davantage. |
:gpt
Constate que l'erreur-type est près de 20 fois plus élevée à Rouvroy et conclut que « ce bruit dans la variable expliquée peut rendre la variance de l'erreur différente selon la commune », sans nommer l'hypothèse.
:claude
Nomme l'hypothèse (homoscédasticité, théorème de Gauss-Markov), déroule le raisonnement (erreur d'échantillonnage dans y → dans u → variance dépendant de n) et précise ce que cela change et ne change pas.
:verdict
La question demande explicitement « quelle hypothèse du modèle linéaire ». Il faut écrire le mot **homoscédasticité**. La version de Claude y répond directement ; celle de ChatGPT décrit le phénomène sans le nommer.
:opt claude | Nommer l'hypothèse et dérouler le raisonnement
Non : l'erreur-type de la médiane vaut 24,5 % du prix à Rouvroy, contre 1,4 % à Charleroi. Le prix observé est le prix typique plus une erreur d'échantillonnage, qui entre dans le terme d'erreur de la régression. Comme la variance de cette erreur dépend du nombre de ventes, la variance du terme d'erreur n'est pas constante d'une commune à l'autre : l'hypothèse d'homoscédasticité est remise en cause. Les coefficients restent sans biais, mais les erreurs-types classiques ne sont plus valables.
:quiz
? Une commune a quatre fois plus de ventes qu'une autre, avec la même dispersion des prix. L'erreur-type de sa médiane est :
- quatre fois plus petite
+ deux fois plus petite
- la même
> L'erreur-type diminue comme 1/√n : √4 = 2.
? L'imprécision du prix médian dans les petites communes :
- biaise le coefficient du revenu
+ rend les erreurs-types classiques incorrectes, sans biaiser le coefficient
- n'a aucune conséquence
> Une erreur de mesure sur la variable dépendante, sans lien avec le régresseur, n'introduit pas de biais. Elle rend la variance des erreurs non constante.
:oral
? Quelle est la différence entre l'erreur-type de la médiane de Rouvroy et l'erreur-type de l'élasticité ?
> La première mesure l'imprécision d'un prix communal : de combien la médiane de Rouvroy aurait pu varier avec d'autres ventes. La seconde mesure l'incertitude sur la relation estimée entre revenu et prix sur l'ensemble des 551 communes.

#Q 1.4 | Décrire les données : tableaux, histogrammes, logarithmes
:intro
On regarde les données avant de les modéliser. Deux enseignements à repérer : Bruxelles est à la fois la région la plus chère et la plus pauvre, et le logarithme ne fait pas la même chose au prix et au revenu.
:concepts donnees, log
##a | Statistiques descriptives
:enonce
Présentez un tableau des statistiques descriptives (moyenne, médiane, écart-type, minimum, maximum) de `prix`, `rev_hab` et `n_ventes`, pour l'ensemble des communes et par région. Indiquez les communes qui ont les valeurs minimale et maximale de `prix` et de `rev_hab`.
:court
Prix médian moyen : **296 148 €** (Flandre 336 156 €, Wallonie 235 028 €, Bruxelles 511 876 €). Revenu par habitant moyen : **24 288 €** (Flandre 25 680 €, Wallonie 23 116 €, Bruxelles 19 199 €). Extrêmes : prix de 95 000 € à **Hastière** à 840 000 € à **Ixelles** ; revenu de 12 987 € à **Saint-Josse-ten-Noode** à 36 091 € à **Sint-Martens-Latem**.
:zero
Trois choses à commenter dans ce tableau.

- **L'ordre des régions.** La Flandre est plus riche et plus chère que la Wallonie. Bruxelles est à part : **la plus chère et la plus pauvre à la fois**. Une seule droite pour tout le pays aura du mal à décrire cela.
- **Les asymétries.** Pour le prix, la moyenne (296 148 €) dépasse la médiane (285 000 €) ; pour le nombre de ventes, l'écart est énorme (156 contre 108). Quelques très grandes valeurs tirent la moyenne vers le haut : Anvers compte 2 729 ventes.
- **Le revenu.** Moyenne et médiane presque égales (24 288 € et 24 269 €) : la distribution est déjà symétrique.

:::piege Une moyenne entre communes, pas entre maisons
Ces statistiques donnent le même poids à chaque commune : Rouvroy compte autant que Charleroi. 296 148 € est la moyenne des prix médians communaux, pas le prix moyen d'une maison en Belgique.
:::
:res
| Variable | Groupe | Communes | Moyenne | Médiane | Écart-type | Minimum | Maximum |
|---|---|--:|--:|--:|--:|--:|--:|
| Prix médian (€) | Belgique | 551 | 296 148 | 285 000 | 101 888 | 95 000 | 840 000 |
| | Flandre | 281 | 336 156 | 319 000 | 76 891 | 180 000 | 750 000 |
| | Wallonie | 251 | 235 028 | 225 000 | 73 493 | 95 000 | 632 000 |
| | Bruxelles | 19 | 511 876 | 479 000 | 154 953 | 337 500 | 840 000 |
| Revenu par habitant (€) | Belgique | 551 | 24 288 | 24 269 | 3 264 | 12 987 | 36 091 |
| | Flandre | 281 | 25 680 | 25 521 | 2 689 | 19 660 | 36 091 |
| | Wallonie | 251 | 23 116 | 22 628 | 2 934 | 15 317 | 34 116 |
| | Bruxelles | 19 | 19 199 | 18 429 | 4 089 | 12 987 | 26 354 |
| Nombre de ventes | Belgique | 551 | 156,5 | 108 | 216,1 | 17 | 2 729 |
| | Flandre | 281 | 195,1 | 137 | 250,9 | 18 | 2 729 |
| | Wallonie | 251 | 116,7 | 72 | 168,5 | 17 | 1 854 |
| | Bruxelles | 19 | 110,3 | 90 | 73,4 | 19 | 276 |

| Extrême | Commune | Région | Valeur |
|---|---|---|--:|
| Prix le plus bas | Hastière | Wallonie | 95 000 € |
| Prix le plus élevé | Ixelles | Bruxelles | 840 000 € |
| Revenu le plus bas | Saint-Josse-ten-Noode | Bruxelles | 12 987 € |
| Revenu le plus élevé | Sint-Martens-Latem | Flandre | 36 091 € |
:code
```r
stats_desc <- function(d, groupe) {
  bind_rows(lapply(c("prix", "rev_hab", "n_ventes"), function(v) {
    x <- d[[v]]
    data.frame(groupe = groupe, variable = v, n = length(x),
               moyenne = mean(x), mediane = median(x), ecart_type = sd(x),
               minimum = min(x), maximum = max(x))
  }))
}
tab_1_4 <- bind_rows(stats_desc(base, "Belgique"),
                     stats_desc(filter(base, region == "Flandre"), "Flandre"),
                     stats_desc(filter(base, region == "Wallonie"), "Wallonie"),
                     stats_desc(filter(base, region == "Bruxelles"), "Bruxelles"))

base %>% slice_min(prix, n = 1)    # la commune au prix le plus bas
base %>% slice_max(prix, n = 1)    # … et au prix le plus élevé
```

On écrit une petite fonction `stats_desc()` pour ne pas recopier quatre fois le même calcul. `lapply()` applique la fonction à chacune des trois variables, `bind_rows()` empile les résultats. `slice_min()` et `slice_max()` renvoient la ligne où une variable est minimale ou maximale.
:accord Tableaux identiques. ChatGPT donne en plus les communes extrêmes **dans chaque région** (par exemple Menin et Knokke-Heist pour le prix en Flandre, Farciennes et Lasne pour le revenu en Wallonie) et rappelle que chaque commune pèse autant. L'énoncé ne demande les extrêmes que pour l'ensemble.
##b | Histogrammes et coefficient d'asymétrie
:enonce
Représentez les histogrammes de `prix` et de `rev_hab`, puis ceux de leur logarithme, et calculez le coefficient d'asymétrie de ces quatre variables.
:court
Asymétrie : **1,34** pour `prix`, **−0,01** pour ln(prix), **0,01** pour `rev_hab`, **−0,59** pour ln(rev_hab).
:zero
Un histogramme découpe l'axe en tranches et compte les communes dans chaque tranche. Le [[coefficient d'asymétrie]] résume sa forme en un nombre :

$$ \text{asymétrie} = \frac{\frac{1}{n} \sum (x_{i} − \bar{x})^{3}}{\left[\frac{1}{n} \sum (x_{i} − \bar{x})^{2}\right]^{3/2}} $$

Pas besoin de retenir la formule, seulement sa lecture : les écarts à la moyenne sont mis **au cube**, ce qui garde leur signe et donne beaucoup de poids aux valeurs éloignées.

- **0** : distribution symétrique ;
- **positif** : la queue de droite est plus longue (quelques très grandes valeurs) ;
- **négatif** : la queue de gauche est plus longue.

{{w:histos}}
:code
```r
asymetrie <- function(x) {
  m <- mean(x)
  mean((x - m)^3) / mean((x - m)^2)^1.5
}
asymetrie(base$prix)            #  1,338
asymetrie(log(base$prix))       # -0,007
asymetrie(base$rev_hab)         #  0,012
asymetrie(log(base$rev_hab))    # -0,594

ggplot(base, aes(x = prix / 1000)) +
  geom_histogram(bins = 40, fill = "grey60", colour = "white") +
  labs(x = "Prix médian (milliers d'euros)", y = "Nombre de communes")
```

R n'a pas de fonction d'asymétrie de base : on l'écrit en deux lignes. `log()` est le logarithme naturel.
:accord Mêmes quatre valeurs (1,338 ; −0,007 ; 0,012 ; −0,594), calculées avec la même formule. Seule la présentation diffère : Claude trace quatre graphiques séparés avec `ggplot2`, ChatGPT une seule figure à quatre panneaux avec les graphiques de base de R.
##c | Ce que fait le logarithme à chaque variable
:enonce
Pour laquelle des deux variables la transformation logarithmique rend-elle la distribution plus symétrique ? Que fait-elle à la distribution de l'autre ?
:court
Le logarithme rend le **prix** symétrique (asymétrie de 1,34 à −0,01). Il rend au contraire le **revenu**, déjà symétrique, **asymétrique vers la gauche** (de 0,01 à −0,59).
:zero
Le logarithme **comprime les grandes valeurs et étire les petites**. Ce qu'il produit dépend donc de la forme de départ.

- **Prix** : une longue queue à droite (Ixelles, Knokke, la périphérie riche). Le logarithme la ramène vers le centre : la distribution devient symétrique.
- **Revenu** : déjà symétrique. Le logarithme étire le bas de la distribution et écarte vers la gauche les quelques communes très pauvres (Saint-Josse, Molenbeek) : il **crée** une queue à gauche.

Change de variable et d'échelle dans l'outil de la question (b) pour le voir.

:::cle La leçon
Le logarithme n'est pas un remède universel qui « normalise » les données. Il corrige une asymétrie à droite ; sur une variable symétrique, il en crée une à gauche.
:::
:accord Même réponse dans les deux versions.
##d | Une autre raison de passer en logarithme
:enonce
La forme de la distribution est-elle la seule raison de transformer une variable en logarithme dans une régression ? Donnez une autre raison.
:court
**Non.** La raison principale est l'**interprétation** : en logarithme, un coefficient mesure un effet **en pourcentage** (une élasticité), ce qui est plus plausible pour des prix et des revenus qu'un effet constant en euros.
:zero
Un modèle en niveaux suppose que 1 000 € de revenu en plus ajoutent **le même nombre d'euros** au prix à Hastière (95 000 €) et à Ixelles (840 000 €). Un modèle en logarithmes suppose qu'ils ajoutent **le même pourcentage**. La seconde hypothèse est bien plus crédible.

Autres raisons valables, si on t'en demande davantage :

- un modèle multiplicatif $prix = A × rev^{β}$ devient linéaire en logarithmes : $\ln(prix) = \ln(A) + β \ln(rev)$ ;
- la dispersion augmente souvent avec le niveau : en logarithmes, l'hétéroscédasticité et le poids des valeurs extrêmes diminuent ;
- le coefficient ne dépend plus des unités (euros ou milliers d'euros).

:::astuce Une précision qui fait bonne impression
La régression linéaire **n'exige pas** que les variables soient normalement distribuées. La symétrie d'un histogramme n'est donc jamais, à elle seule, une raison suffisante de transformer une variable.
:::
:gpt
La forme fonctionnelle traduit une **hypothèse économique** : en log-log, une même hausse relative du revenu est associée à une même variation relative du prix. Ajoute que la régression ne requiert pas que le revenu soit normalement distribué.
:claude
L'**interprétation en pourcentage** (élasticité, semi-élasticité), avec l'exemple Hastière-Ixelles, puis trois autres raisons : modèle multiplicatif, hétéroscédasticité, indépendance des unités.
:verdict
C'est la même raison, dite de deux façons : passer en logarithme, c'est supposer des effets proportionnels. Claude donne plus de raisons (une seule est demandée) ; ChatGPT ajoute la remarque sur la normalité, juste et utile à l'oral.
:opt mix | L'interprétation en pourcentage
Non. La raison principale est l'interprétation : en logarithmes, le coefficient mesure un effet relatif (une élasticité), plus plausible pour des prix et des revenus qu'un effet constant en euros. Une hausse de revenu ne peut pas ajouter le même montant au prix à Hastière et à Ixelles, mais elle peut ajouter le même pourcentage. La régression n'exige d'ailleurs pas que les variables soient normalement distribuées.
:quiz
? Le coefficient d'asymétrie du nombre de ventes est fortement positif. Cela signifie que :
- la plupart des communes ont beaucoup de ventes
+ quelques communes ont beaucoup plus de ventes que les autres
- la moyenne est inférieure à la médiane
> Une asymétrie positive indique une longue queue à droite : quelques très grandes valeurs (Anvers, Charleroi…), qui tirent la moyenne au-dessus de la médiane.
:oral
? Pourquoi mettre le prix en logarithme ?
> Surtout pour l'interprétation : le coefficient mesure alors un effet en pourcentage, plus crédible qu'un effet constant en euros entre Hastière et Ixelles. Accessoirement, le logarithme rend la distribution du prix symétrique et réduit le poids des communes très chères.

#Q 1.5 | Le nuage de points
:enonce
Représentez `prix` en fonction de `rev_hab`, avec une couleur par région et la droite des MCO estimée sur l'ensemble des communes, d'abord en niveaux, puis avec des échelles logarithmiques.
:intro
Un graphique vaut ici tous les tableaux : on y voit d'un coup la relation positive, les trois régions, et le problème que posera Bruxelles. Utilise l'outil pour reproduire les deux graphiques demandés (échelles « Niveaux » puis « Logarithmiques », modèle « Une seule droite »).

{{w:nuage modele=unique echelle=niveaux}}
:concepts mco, log
##a | Que représente un point ?
:enonce
Que représente un point ?
:court
**Une commune en 2023.** En abscisse, son revenu net imposable par habitant ; en ordonnée, le prix médian des maisons qui y ont été vendues. La couleur indique sa région.
:zero
C'est la question de l'[[unité statistique]], posée autrement. Réponds toujours par : une observation = quoi, quand, et que lit-on sur chaque axe.
:accord Même réponse.
##b | Niveaux ou logarithmes ?
:enonce
La relation vous paraît-elle plus proche d'une droite en niveaux ou en logarithmes ?
:court
**Un peu plus proche d'une droite en logarithmes** : en niveaux, le nuage s'incurve vers le haut et s'élargit quand le revenu augmente ; en logarithmes, la dispersion est plus régulière. Mais la différence est modeste : le grand écart à la droite vient des régions, pas de la forme de la courbe.
:zero
Deux indices à chercher à l'œil.

- **La courbure.** En niveaux, les points flamands et wallons dessinent une courbe qui monte de plus en plus vite. Une droite ne suit pas bien une courbe.
- **L'éventail.** En niveaux, le nuage est étroit à gauche et large à droite : la dispersion des prix augmente avec le revenu. En logarithmes, la bande a une épaisseur plus régulière.

Sois honnête dans ta réponse : la différence n'est pas spectaculaire. Ce qui frappe surtout, dans les deux graphiques, ce sont les trois paquets de couleurs.
:gpt
Prudent : à l'intérieur des régions, les bandes de points sont assez rectilignes en logarithmes et les prix extrêmes pèsent moins ; mais la superposition des trois groupes « empêche de trancher nettement » à l'œil.
:claude
Tranche un peu plus : « un peu plus proche d'une droite en logarithmes », en donnant les deux indices (courbure, élargissement), tout en précisant que la différence reste modeste.
:verdict
Les deux disent la même chose avec un degré d'assurance différent. La question demande ton impression (« vous paraît-elle ») : il faut **prendre position** et la justifier par ce qu'on voit, puis nuancer. La formulation de Claude fait les deux.
:opt claude | Prendre position, puis nuancer
Un peu plus proche d'une droite en logarithmes. En niveaux, le nuage s'incurve vers le haut et s'élargit quand le revenu augmente ; en logarithmes, la dispersion est plus régulière. La différence reste modeste : l'essentiel de l'écart à la droite vient des régions, pas de la forme fonctionnelle.
:opt gpt | Insister sur la difficulté de trancher
En logarithmes, les bandes de points sont assez rectilignes à l'intérieur de chaque région et les prix extrêmes pèsent moins. La superposition des trois régions empêche toutefois de trancher nettement à l'œil pour une droite nationale.
##c | Les régions par rapport à la droite
:enonce
Comment les communes de chaque région se situent-elles par rapport à la droite ?
:court
**Bruxelles** : les 19 communes sont toutes très au-dessus, à gauche du graphique (revenus faibles, prix élevés). **Wallonie** : la plupart sont en dessous. **Flandre** : la majorité est au-dessus.
:zero
Être au-dessus de la droite, c'est avoir un prix **plus élevé que ce que le revenu laisse prévoir**. La droite commune est donc un compromis entre trois nuages différents : elle passe trop bas pour Bruxelles et la Flandre, trop haut pour la Wallonie.

C'est le point de départ de toute la suite : les questions 1.9 à 1.13 corrigent ce défaut en donnant à chaque région sa propre droite.
:res
| Région | Communes | Au-dessus de la droite en niveaux | Au-dessus de la droite en log-log |
|---|--:|--:|--:|
| Flandre | 281 | 55,9 % | 66,9 % |
| Wallonie | 251 | 13,9 % | 17,9 % |
| Bruxelles | 19 | 100 % | 100 % |
:accord Même constat. ChatGPT le **chiffre** avec le tableau ci-dessus (part des communes dont le résidu est positif), ce qui est plus solide qu'une impression visuelle. Le calcul tient en une ligne : `mean(resid(modele) > 0)` par région.
##d | Ce que le graphique ne montre pas
:enonce
Citez deux informations utiles que ce graphique ne permet pas de voir.
:court
1. **La précision de chaque point** : Rouvroy (17 ventes) pèse autant à l'œil que Charleroi (1 854 ventes).
2. **Les autres déterminants du prix** : taille et qualité des maisons, distance aux emplois, part d'appartements. Le graphique montre une corrélation, pas l'effet du revenu « toutes choses égales par ailleurs ».
:zero
Coche « Taille des points = nombre de ventes » dans l'outil : tu vois alors ce que le graphique de base cache. Les gros points sont fiables, les petits beaucoup moins.

On pourrait citer aussi la population des communes (Anvers et une commune de 2 000 habitants valent un point chacune) et l'évolution dans le temps (une seule année).
:gpt
Deux informations : le **nombre de ventes** derrière chaque médiane et la **dispersion des prix** à l'intérieur de la commune.
:claude
Deux informations : la **précision** de chaque point (nombre de ventes et dispersion), et les **autres déterminants** du prix. Mentionne aussi la taille des communes et la dimension temporelle.
:verdict
Les deux informations de ChatGPT sont en réalité deux faces de la même idée (la précision de la médiane, question 1.3). Celles de Claude sont de nature différente : l'une concerne la **qualité de la mesure**, l'autre l'**interprétation** de la relation. Elles couvrent mieux la question et préparent les questions 1.14 et 1.18.
:opt claude | Précision des points et variables absentes
Le graphique ne montre pas la précision de chaque point : une commune de 17 ventes pèse autant qu'une commune de 1 854 ventes. Il ne montre pas non plus les autres déterminants du prix (taille des maisons, localisation, part d'appartements) : on voit une corrélation, pas l'effet du revenu à caractéristiques égales.
:opt gpt | Nombre de ventes et dispersion des prix
Le graphique ne montre ni le nombre de ventes derrière chaque médiane, ni la dispersion des prix de vente à l'intérieur de chaque commune. Un point à Rouvroy et un point à Charleroi ont la même taille malgré des précisions très différentes.
:code
```r
couleurs <- c(Flandre = "#E69F00", Wallonie = "#0072B2", Bruxelles = "#CC79A7")

fig_1_5_niveaux <- ggplot(base, aes(x = rev_k, y = prix_k)) +
  geom_point(aes(colour = region), alpha = 0.7) +                  # couleur par région
  geom_smooth(method = "lm", formula = y ~ x, se = FALSE, colour = "black") +
  scale_colour_manual(values = couleurs) +
  labs(x = "Revenu net imposable par habitant (milliers d'euros)",
       y = "Prix médian (milliers d'euros)", colour = "Région")

fig_1_5_logs <- fig_1_5_niveaux + scale_x_log10() + scale_y_log10()
```

:::piege Où placer `colour = region`
Il est dans `geom_point()`, pas dans `ggplot()`. Placé dans `ggplot()`, il s'appliquerait aussi à `geom_smooth()`, qui tracerait alors **une droite par région**. L'énoncé demande une seule droite, estimée sur l'ensemble des communes.
:::

Avec `scale_x_log10()` et `scale_y_log10()`, `geom_smooth()` estime la droite sur les logarithmes : c'est exactement le modèle log-log de la question 1.6. ChatGPT obtient le même résultat avec les graphiques de base de R (`plot()` puis `abline()`), en traçant directement ln(prix) contre ln(revenu).
:quiz
? Une commune située au-dessus de la droite des MCO :
- a un revenu supérieur à la moyenne
+ a un prix plus élevé que ce que son revenu laisse prévoir
- a un prix supérieur à la moyenne
> La droite donne le prix prédit à partir du revenu. Être au-dessus, c'est avoir un résidu positif.
:oral
? Pourquoi une seule droite ne convient-elle pas à ce nuage ?
> Parce qu'elle fait un compromis entre trois nuages : toutes les communes bruxelloises sont au-dessus, la plupart des wallonnes en dessous. Les erreurs de prédiction ne sont pas dues au hasard, elles dépendent de la région.
