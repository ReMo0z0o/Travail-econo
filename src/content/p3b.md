#SEC C | Tendances parallèles

#Q 3.6 | L'hypothèse des tendances parallèles
:intro
La double différence ne mesure un effet causal que sous une hypothèse. Cette question te la fait énoncer (a), regarder ce que les données en disent (b, c), comprendre pourquoi elles ne peuvent pas la prouver (d), puis examiner deux menaces précises : le changement de satellite (e) et la lumière qui déborde chez les voisins (f).
:concepts did, causalite
##a | L'hypothèse en une phrase
:enonce
Quelle est l'hypothèse centrale de votre stratégie d'identification ? Énoncez-la en une phrase, appliquée aux localités et à la période étudiées.
:court
Ce sont les **tendances parallèles** : sans raccordement en 2008-2009, la part de localités éclairées aurait évolué de la même façon, entre 2003-2007 et 2010-2014, dans les 59 localités raccordées en 2008-2009 que dans les 238 localités raccordées en 2015-2017.
:zero
Trois choses à remarquer dans cette phrase.

1. **Elle parle d'évolutions, pas de niveaux.** Les deux groupes peuvent partir de niveaux différents (5,2 % contre 2,7 %) : la première différence s'en occupe. Ce qu'on exige, c'est qu'ils auraient **évolué** pareil.
2. **Elle parle d'un monde qui n'a pas existé.** « Sans raccordement, les traitées auraient… » : c'est un [[contrefactuel]]. On ne l'observera jamais, puisque ces localités ont été raccordées.
3. **Elle est appliquée.** L'énoncé demande les localités et la période : cite les deux groupes et les deux périodes. Une définition générale de manuel ne suffit pas.

En chiffres : on suppose que, sans le réseau, les traitées seraient passées de 5,2 % à 6,1 % (leur niveau de départ plus les 0,9 point du groupe de comparaison). Tout l'effet de 38 points repose là-dessus.

**Deux hypothèses d'accompagnement**, utiles à l'oral :

- **pas d'anticipation** : les localités ne changent pas avant d'être raccordées ;
- **pas de contamination** : le traitement des unes ne modifie pas le résultat des autres. C'est le sujet du point (f).
:accord Même phrase dans les deux versions, avec les deux groupes et les deux périodes. Claude ajoute l'absence d'anticipation.
##b | Le graphique des moyennes annuelles
:enonce
Représentez l'évolution des moyennes annuelles de `nl_extensive` des deux groupes de 2003 à 2014. Que suggère ce graphique au sujet de l'hypothèse ?
:court
Avant 2008, les deux courbes sont basses et presque plates : 3 à 7 % pour les traitées, 2 à 4 % pour le groupe de comparaison, sans divergence nette. C'est **compatible** avec des tendances parallèles. Après, les traitées montent à 15,5 % en 2010-2011 puis à 62-66 % en 2012-2014 ; le groupe de comparaison reste sous 6 %.
:zero
{{w:tendances}}

| Localités éclairées (%) | 2003 | 2004 | 2005 | 2006 | 2007 | 2008 | 2009 | 2010 | 2011 | 2012 | 2013 | 2014 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Traitées | 3,4 | 5,2 | 5,2 | 5,2 | 6,9 | 5,2 | 5,2 | 15,5 | 15,5 | 65,5 | 62,1 | 62,1 |
| Comparaison | 2,6 | 2,6 | 3,9 | 1,8 | 2,6 | 2,2 | 2,2 | 2,2 | 3,1 | 4,8 | 5,7 | 2,6 |

**Comment lire le graphique.** On regarde la période **avant** 2008 et on se demande : l'écart entre les deux courbes reste-t-il à peu près constant ?

- **Avant 2008.** L'écart varie entre 0,8 et 4,3 points. Il est un peu plus grand à la fin qu'au début, mais garde l'échelle en tête : 58 localités traitées ont des données de lumière, donc **une seule localité pèse 1,7 point**. Les traitées passent de 2 localités éclairées en 2003 à 4 en 2007. Deux localités de plus en quatre ans : rien qui ressemble à un décollage.
- **2008-2009** (zone grisée). Aucun saut visible pendant les années de raccordement : 5,2 %.
- **Après 2009.** Les traitées s'écartent nettement : 15,5 % en 2010-2011, puis 62 à 66 % à partir de 2012. Le groupe de comparaison ne dépasse pas 5,7 %.

Le saut de 2012 coïncide avec l'entrée du satellite VIIRS dans la série : c'est le sujet du point (e).

:::cle Le mot juste
Le graphique est **compatible** avec l'hypothèse, il la rend **plausible**. Il ne la « confirme » pas et ne la « prouve » pas : voir le point (d).
:::

Dans l'outil, change de variable : la même figure pour les écoles électrifiées et pour l'intensité lumineuse est moins rassurante. C'est une bonne raison de présenter `nl_extensive` comme ton résultat principal.
:code
```r
tab_3_6b <- deux_groupes %>%                          # 2003-2014, années 2008-2009 comprises
  group_by(year, groupe = ifelse(treated == 1, "Traitées", "Comparaison")) %>%
  summarise(moyenne = mean(nl_extensive, na.rm = TRUE), .groups = "drop")

ggplot(tab_3_6b, aes(x = year, y = moyenne, colour = groupe)) +
  annotate("rect", xmin = 2007.5, xmax = 2009.5, ymin = -Inf, ymax = Inf, alpha = 0.15) +
  geom_line() + geom_point() +
  scale_x_continuous(breaks = 2003:2014) +
  labs(x = "Année", y = "Part des localités éclairées", colour = NULL)
```

- On part de `deux_groupes`, qui contient encore 2008 et 2009 : l'énoncé demande le graphique de 2003 à 2014.
- `group_by(year, groupe)` puis `summarise()` : une moyenne par année et par groupe, soit 24 points.
- `annotate("rect", …)` dessine la zone grisée des années de raccordement.
:accord Même graphique (ChatGPT avec les graphiques de base de R, Claude avec ggplot2) et même lecture : séries basses et sans divergence nette avant 2008, écart massif ensuite. Claude parle d'un « écart à peu près stable de 2 à 3 points » avant 2008 : c'est arrondi, l'écart va de 0,8 à 4,3 points. Donne les chiffres exacts.
##c | La double différence placebo
:enonce
Sur la seule période 2003-2007, créez `post_fictif`, qui vaut 1 si `year` ≥ 2005 et 0 sinon, et estimez la double différence « placebo » de `nl_extensive` sur `treated`, `post_fictif` et leur interaction. Interprétez le coefficient d'interaction.
:court
L'interaction vaut **+0,013** (erreur-type 0,028 ; p = 0,64), soit 1,3 point. Entre 2003-2004 et 2005-2007, l'écart entre les deux groupes n'a pas changé de façon significative : on ne détecte aucun « effet » à une date où il ne s'est rien passé. C'est compatible avec des tendances parallèles avant le traitement.
:zero
**L'idée d'un [[placebo]].** En médecine, un placebo est un faux médicament : s'il « guérit », c'est que quelque chose cloche dans l'essai. Ici, on invente un **faux traitement** en 2005, à une date où aucune localité n'a été raccordée, et on applique exactement la même double différence, sur les seules années 2003-2007.

- Si la méthode est saine, on doit trouver **à peu près zéro**.
- Si on trouvait un « effet » significatif, cela voudrait dire que les deux groupes divergeaient déjà avant tout raccordement. Les tendances parallèles seraient alors douteuses.

| `nl_extensive` | 2003-2004 | 2005-2007 | Variation |
|---|--:|--:|--:|
| Traitées | 4,31 % | 5,75 % | +1,44 |
| Comparaison | 2,63 % | 2,78 % | +0,15 |
| Double différence placebo | | | **+1,29** |

{{w:loi test=placebo}}

t = 0,013 / 0,028 = 0,47, bien en dessous de 1,96 : on ne rejette pas H₀ « pas de différence d'évolution entre les groupes avant 2008 ». L'intervalle de confiance à 95 % va de **−4,1 à +6,7 points**.

Dans l'outil du point (b), le curseur « Placebo » déplace la date du faux traitement : essaie 2004, 2006 et 2007.
:res
| | Coefficient | Erreur-type HC1 | p-valeur |
|---|--:|--:|--:|
| Constante | 0,0263 | 0,0075 | < 0,001 |
| treated | 0,0168 | 0,0203 | 0,41 |
| post_fictif | 0,0015 | 0,0098 | 0,88 |
| treated × post_fictif | 0,0129 | 0,0277 | 0,64 |

1 430 observations (286 localités × 5 années).
:code
```r
placebo <- did %>%
  filter(year <= 2007) %>%
  mutate(post_fictif = as.numeric(year >= 2005))

reg_3_6c <- lm(nl_extensive ~ treated * post_fictif, data = placebo)
rob(reg_3_6c)
```
:accord Même estimation (+1,29 point ; erreur-type 2,77 points ; p = 0,64). ChatGPT donne l'intervalle de confiance (de −4,13 à +6,72 points), qui est le chiffre le plus utile pour le point (d).
##d | Ces vérifications sont-elles une preuve ?
:enonce
Les vérifications (b) et (c) permettent-elles de prouver l'hypothèse énoncée en (a) ? Pourquoi ?
:court
**Non.** L'hypothèse porte sur ce qu'auraient fait les traitées **après 2009 sans le réseau** : personne ne l'observe. Les vérifications (b) et (c) montrent seulement que les deux groupes évoluaient de façon semblable **avant** 2008. Cela rend l'hypothèse plausible, pas certaine. Et le placebo est imprécis : son intervalle va de −4 à +7 points.
:zero
Trois raisons, de la plus fondamentale à la plus technique.

**1. Le contrefactuel est inobservable.** Des tendances parallèles avant 2008 ne garantissent pas des tendances parallèles après. Exemple : si l'État a construit une route vers les localités traitées en même temps que la ligne électrique, les deux groupes divergent après 2009 pour une raison qui n'est pas l'électricité, et aucun test sur 2003-2007 ne peut le voir.

**2. Ne pas rejeter n'est pas prouver.** Le placebo ne détecte pas de divergence, mais avec une erreur-type de 2,8 points il ne peut pas exclure un écart de tendance de 5 points. C'est la même logique que pour le test de Hausman de la question 2.12 : un test peu puissant ne rejette presque jamais.

**3. Les niveaux de départ sont proches de zéro.** Une proportion ne peut pas descendre sous 0 %. Avec 2 à 7 % de localités éclairées, les deux courbes n'ont presque pas la place de diverger avant 2008, même si les localités sont très différentes. Et cinq années, c'est court.

**Ce qui rassure quand même.** Une différence de tendance qui existerait depuis longtemps creuserait l'écart **progressivement**. Or l'écart est stable jusqu'en 2009, puis s'ouvre brutalement, exactement après le raccordement. Et l'effet est de 38 points, sans commune mesure avec les fluctuations d'avant 2008. La fragilité porte sur la valeur exacte de l'effet, pas sur son existence.

:::cle La formule à retenir
Les tests avant traitement peuvent **mettre en doute** les tendances parallèles, jamais les **prouver**.
:::
:accord Même réponse : non, parce que le contrefactuel après 2009 est inobservable et que le test a une précision limitée. Claude ajoute l'exemple d'une route construite en même temps que la ligne et l'argument des niveaux proches de zéro.
##e | Le changement de satellite
:enonce
Le passage de la série DMSP à la série VIIRS, plus sensible, intervient pendant la période après. À quelle condition ce changement de satellite biaiserait-il votre estimation, et dans quel sens ?
:court
**À condition qu'il n'affecte pas les deux groupes de la même façon**, pour une raison autre que l'électrification. Un capteur plus sensible qui ajoute la même chose partout est retiré par la seconde différence, comme toute évolution commune. **Biais vers le haut** si VIIRS révèle plus de lumières sans rapport avec le réseau chez les traitées ; **vers le bas** s'il en révèle davantage dans le groupe de comparaison.
:zero
**Le raisonnement.** Le groupe de comparaison sert à mesurer tout ce qui change avec le temps, satellite compris. Appelle « bonus » ce que le nouveau capteur ajoute à la lumière détectée dans un groupe :

- hausse observée chez les traitées = effet du réseau + bonus des traitées ;
- hausse observée dans le groupe de comparaison = bonus du groupe de comparaison.

La double différence vaut donc : **effet du réseau + (bonus des traitées − bonus du groupe de comparaison)**. Si les deux bonus sont égaux, ils disparaissent. S'ils diffèrent, leur écart s'ajoute à l'effet.

| Si VIIRS révèle, en plus de DMSP… | La double différence est… |
|---|---|
| autant de faibles lumières dans les deux groupes | **non biaisée** : le bonus commun se retranche |
| plus de lumières chez les traitées (localités plus grandes, autres sources de lumière) | biaisée **vers le haut** |
| plus de lumières dans le groupe de comparaison (lampes solaires, groupes électrogènes) | biaisée **vers le bas** |

**Ce que disent tes données.** Regarde 2011 et 2012 sur le graphique du point (b).

| Localités éclairées | 2011 (DMSP) | 2012 (VIIRS dans la série) |
|---|--:|--:|
| Traitées | 15,5 % | 65,5 % |
| Comparaison | 3,1 % | 4,8 % |

Dans le groupe de comparaison, sans réseau, le nouveau capteur change peu de chose : moins de 2 points. Chez les traitées, la part éclairée est multipliée par quatre. On peut le mesurer en séparant la période après en deux :

| Période après | Double différence | Erreur-type HC1 |
|---|--:|--:|
| 2010-2011 (DMSP) | +10,4 points | 3,7 |
| 2012-2014 (VIIRS) | +56,4 points | 4,0 |

Le 38,0 de la question 3.4 est la moyenne des deux, pondérée par le nombre d'années : (2 × 10,4 + 3 × 56,4) / 5 = 38,0.

**Comment l'interpréter ?** Deux lectures, que ces données ne permettent pas de départager.

- Le capteur plus sensible voit enfin la faible lumière **apportée par le réseau** (éclairage public, quelques branchements), que DMSP manquait. Dans ce cas ce n'est pas un biais : c'est le même effet, mieux mesuré.
- Les raccordements montent en puissance avec le temps : il y a réellement plus de lumière en 2012 qu'en 2010.

Dans les deux cas, la conclusion est la même : **l'existence de l'effet est solide, sa valeur exacte dépend du capteur.** « 38 points » est une moyenne entre deux instruments de mesure.
:code
```r
did <- did %>%
  mutate(post_dmsp  = as.numeric(year %in% 2010:2011),
         post_viirs = as.numeric(year %in% 2012:2014))

reg_3_6e <- lm(nl_extensive ~ treated + post_dmsp + post_viirs +
                 treated:post_dmsp + treated:post_viirs, data = did)
rob(reg_3_6e)
```

Cette régression n'est pas demandée par l'énoncé. Si tu la gardes, tu dois savoir l'expliquer : elle remplace `post` par deux indicatrices de période, et l'interaction par deux interactions.
:gpt
Un changement de sensibilité « commun et additif » aux deux groupes se retranche. Si VIIRS révèle proportionnellement plus de lumières faibles chez les traitées, la double différence est biaisée vers le haut ; s'il en révèle davantage chez les témoins, vers le bas. Ajoute que les auteurs raccordent les deux séries grâce à leur chevauchement de 2012-2013.
:claude
Même condition et mêmes deux sens. Ajoute une vérification sur les données : la double différence vaut 0,104 sur 2010-2011 et 0,564 sur 2012-2014. En conclut que le changement de capteur « interagit avec le traitement lui-même » et qu'il faut lire avec prudence l'ampleur de l'effet, pas son existence.
:verdict
Même réponse à la question posée. La régression de Claude va au-delà de l'énoncé, mais elle est exacte (je l'ai refaite) et elle donne un argument concret pour l'oral : ton 38 est une moyenne de 10 et de 56. Tu n'es pas obligé de l'inclure ; une phrase sur le saut de 2012 suffit à montrer que tu as regardé tes données.
:opt gpt | La condition et les deux sens, sans plus
Le changement de satellite ne biaise l'estimation que s'il modifie la lumière détectée différemment dans les deux groupes : un gain de sensibilité commun est retiré par la seconde différence. Si VIIRS révèle davantage de lumières sans rapport avec le réseau dans les localités traitées, l'effet est surestimé ; s'il en révèle davantage dans les localités de comparaison, il est sous-estimé.
:opt mix | La condition, les deux sens, et ce que montrent les données
Le changement de satellite ne biaise l'estimation que s'il modifie la lumière détectée différemment dans les deux groupes : un gain de sensibilité commun est retiré par la seconde différence. Le biais va vers le haut si VIIRS révèle plus de lumières sans rapport avec le réseau chez les traitées, vers le bas dans le cas inverse. Dans nos données, la part de localités traitées éclairées passe de 15,5 % en 2011 à 65,5 % en 2012, année d'entrée de VIIRS, contre 3,1 % à 4,8 % dans le groupe de comparaison : l'ampleur de l'effet dépend donc du capteur, même si son existence ne fait pas de doute.
:opt claude | Avec la régression qui sépare les deux périodes
Le changement de satellite ne biaise l'estimation que s'il modifie la lumière détectée différemment dans les deux groupes, vers le haut si VIIRS révèle plus de lumières sans rapport avec le réseau chez les traitées, vers le bas dans le cas inverse. En séparant la période après, la double différence vaut 10,4 points sur 2010-2011 (DMSP) et 56,4 points sur 2012-2014 (VIIRS). Notre estimation de 38 points est la moyenne des deux : le capteur plus sensible détecte la faible lumière apportée par le réseau, que DMSP manquait. L'ampleur de l'effet est donc à lire avec prudence.
##f | La lumière qui déborde chez les voisins
:enonce
La lumière d'une localité électrifiée peut être captée par le satellite dans les localités voisines. Si certaines localités de comparaison sont proches de localités traitées, dans quel sens votre estimation serait-elle biaisée ?
:court
**Vers le bas** : l'effet serait sous-estimé. Si le satellite attribue à une localité de comparaison la lumière d'une voisine traitée, le groupe de comparaison « s'allume » après 2009 à cause du traitement. Sa hausse est gonflée, et comme on la retranche, la double différence est trop petite.
:zero
La double différence est une soustraction : **hausse des traitées − hausse du groupe de comparaison**.

Le débordement ajoute de la lumière au second terme. On retranche donc trop, et le résultat est trop petit. Exemple : si le débordement allumait 1 point de localités de comparaison en plus, on estimerait 37 points au lieu de 38.

**Le principe général.** Un groupe de comparaison ne doit pas être touché par le traitement des autres. Quand il l'est, on parle de **contamination** (ou d'effets de débordement). Ici, la contamination rapproche le groupe de comparaison du groupe traité : le biais va **vers zéro**.

**Pourquoi ce n'est pas grave pour la conclusion.** Un biais vers zéro rend l'estimation prudente : l'effet réel serait d'au moins 38 points. Et il est sans doute petit : le groupe de comparaison n'a gagné que 0,9 point au total entre les deux périodes, débordement compris.
:accord Même réponse : la hausse du groupe de comparaison est gonflée, on retranche trop, l'effet est sous-estimé. Claude ajoute que le problème est plus fort avec DMSP, connu pour étaler la lumière sur les pixels voisins.
:quiz
? L'hypothèse des tendances parallèles suppose que, sans le réseau :
- les deux groupes auraient eu le même niveau de lumière
+ les deux groupes auraient connu la même évolution
- la lumière n'aurait pas changé dans les localités traitées
> L'hypothèse porte sur les évolutions, pas sur les niveaux. Les groupes peuvent différer au départ (5,2 % contre 2,7 %).
? Le test placebo donne +0,013 (p = 0,64). Que peut-on en conclure ?
- Les tendances parallèles sont prouvées
+ On ne détecte pas de divergence entre les groupes avant le traitement
- L'électrification n'a pas d'effet
> Un non-rejet rend l'hypothèse plausible. Il ne dit rien de ce qui se serait passé après 2009 sans le réseau.
? Si la lumière des localités traitées déborde sur des localités de comparaison voisines, l'effet estimé est :
- surestimé
+ sous-estimé
- inchangé
> La hausse du groupe de comparaison est gonflée par le traitement des voisines ; comme on la retranche, la double différence est trop petite.
:oral
? Énonce l'hypothèse d'identification de ta double différence.
> Sans raccordement en 2008-2009, la part de localités éclairées aurait évolué de la même façon, entre 2003-2007 et 2010-2014, dans les 59 localités traitées que dans les 238 localités raccordées en 2015-2017. Ce sont les tendances parallèles.
? Ton graphique et ton placebo prouvent-ils cette hypothèse ?
> Non. Ils montrent que les deux groupes évoluaient de façon semblable avant 2008, ce qui rend l'hypothèse plausible. Mais elle porte sur ce qui se serait passé après 2009 sans le réseau, qu'on n'observe pas. Et le placebo est imprécis : son intervalle va de −4 à +7 points.
? Pourquoi la part de localités éclairées bondit-elle en 2012 ?
> C'est l'année où le satellite VIIRS, plus sensible, entre dans la série. Il détecte de faibles lumières que DMSP manquait. Dans le groupe de comparaison, sans réseau, il change peu de chose ; chez les traitées, la part éclairée passe de 15,5 % à 65,5 %. L'effet moyen de 38 points mélange donc deux instruments de mesure.
:retenir
- Les tendances parallèles portent sur un contrefactuel : on peut les rendre plausibles, pas les prouver.
- Un placebo cherche un effet là où il ne doit pas y en avoir. Trouver zéro est bon signe ; ce n'est pas une preuve.
- Un changement de mesure ne biaise la double différence que s'il touche les deux groupes différemment.
- Une contamination du groupe de comparaison biaise l'effet vers zéro.

#SEC D | Effets fixes et erreurs-types

#Q 3.7 | Les effets fixes
:intro
La même double différence, écrite autrement. Au lieu d'une indicatrice pour le groupe et d'une pour la période, on donne une constante à **chaque localité** et une à **chaque année**. C'est le modèle « TWFE » (*two-way fixed effects*, effets fixes doubles) de la colonne du tableau 4 de l'article.
:concepts did, indicatrices
##a | Estimer le modèle à effets fixes
:enonce
Créez `D` = `treated` × `post`. Estimez la régression de `nl_extensive` sur `D` avec des effets fixes de localité et des effets fixes d'année (`factor(electrific)` et `factor(year)`).
:court
Coefficient de `D` : **0,3800** (erreur-type HC1 0,0265), sur 2 866 observations. Pratiquement le même nombre qu'à la question 3.4.
:zero
$$ nl\_extensive_{it} = α_i + γ_t + β D_{it} + u_{it} $$

- $i$ désigne la localité, $t$ l'année.
- $α_i$ : une constante **par localité** (288 localités ont des données de lumière).
- $γ_t$ : une constante **par année** (10 années).
- $D_{it}$ vaut 1 pour une localité traitée observée après 2009, 0 sinon.
- $β$ est l'effet recherché.

**Comment R s'y prend.** `factor(electrific)` dit à R de traiter l'identifiant comme une **catégorie** et non comme un nombre. R crée alors une indicatrice par localité, exactement comme pour les régions de la question 1.11, mais avec 288 catégories au lieu de 3. Même chose pour `factor(year)`. La régression a 298 coefficients ; un seul nous intéresse.

{{w:effetsfixes}}

Dans l'outil, retire les effets fixes un par un : ce qui reste à la fin, c'est l'écart entre localités électrifiées et non électrifiées, après l'électrification. C'est la double différence.
:code
```r
did <- did %>% mutate(D = treated * post)

reg_3_7a <- lm(nl_extensive ~ D + factor(electrific) + factor(year), data = did)
rob(reg_3_7a)["D", ]        # n'afficher que la ligne de D
```

- N'affiche pas `summary(reg_3_7a)` en entier : tu obtiendrais 298 lignes.
- `rob(...)["D", ]` extrait la ligne nommée `D` du tableau de résultats.
:accord Même régression et même résultat (0,380006 ; erreur-type HC1 0,0265).
##b | Ce que chaque effet fixe neutralise
:enonce
Expliquez, dans ce contexte précis, à quoi servent les effets fixes de localité et les effets fixes d'année : quelles différences chacun neutralise-t-il ?
:court
- Les **effets fixes de localité** neutralisent tout ce qui distingue durablement une localité des autres : sa taille, sa situation, sa distance au réseau, son niveau de lumière de départ.
- Les **effets fixes d'année** neutralisent tout ce qui touche toutes les localités la même année : conjoncture nationale, météo, et la part **commune** du changement de satellite.

Il ne reste, pour estimer l'effet, que l'évolution de chaque localité dans le temps au-delà des chocs communs : c'est l'idée de la double différence.
:zero
**Effets fixes de localité : chaque localité est comparée à elle-même.** À la question 3.4, `treated` donnait un niveau à chaque **groupe**. Ici, chaque **localité** a le sien. Une localité traitée qui a toujours été plus grande, plus proche d'une ville ou déjà un peu éclairée voit tout cela absorbé par sa constante $α_i$. Peu importe que ces caractéristiques soient observées ou non : il suffit qu'elles ne changent pas dans le temps.

**Effets fixes d'année : chaque année a son niveau.** À la question 3.4, `post` distinguait deux périodes. Ici, chaque année a sa constante $γ_t$. Tout ce qui frappe l'ensemble des localités une année donnée y passe : une bonne récolte, une crise, une année nuageuse, un capteur plus sensible.

**Ce qu'ils ne neutralisent pas.** Tout ce qui change dans le temps **différemment selon les localités** : une route construite en 2010 vers certaines localités traitées, ou un effet du satellite qui ne serait pas le même dans les deux groupes. Les effets fixes ne remplacent donc pas l'hypothèse de tendances parallèles : ils la supposent.

| Source de différence | Exemple | Neutralisée par |
|---|---|---|
| Fixe dans le temps, propre à la localité | taille, situation géographique | effets fixes de localité |
| Variable dans le temps, commune à toutes | conjoncture, sensibilité du capteur | effets fixes d'année |
| Variable dans le temps **et** propre à certaines | route construite en 2010 | **rien** : c'est le risque qui reste |
:gpt
Les effets de localité absorbent les caractéristiques fixes (situation géographique, proximité historique d'une ville). Les effets d'année absorbent chaque année un choc commun, comme la conjoncture nationale. Précise : « ils ne corrigent pas un changement de satellite qui affecterait différemment les groupes ».
:claude
Effets de localité : taille, situation, distance au réseau, niveau de lumière de départ, statut de pôle de développement. Effets d'année : « calibrage et changement de satellite, couverture nuageuse, conjoncture nationale, politiques nationales ». Conclut que `D` n'est identifié que par l'évolution de chaque localité au-delà des chocs communs.
:verdict
Même explication, et la liste de Claude est plus concrète. Mais lue trop vite, elle contredit la question 3.6 (e) : les effets fixes d'année ne retirent le changement de satellite que pour sa part **commune** à toutes les localités. La précision de ChatGPT est indispensable. Combine les deux.
:opt mix | Les exemples de l'un, la réserve de l'autre
Les effets fixes de localité neutralisent tout ce qui distingue durablement les localités : taille, situation, distance au réseau, niveau de lumière de départ. Les effets fixes d'année neutralisent ce qui touche toutes les localités une même année : conjoncture nationale, couverture nuageuse, part commune du changement de satellite. Ils ne corrigent pas ce qui évolue différemment selon les groupes : l'hypothèse de tendances parallèles reste nécessaire.
##c | Le même coefficient qu'à la question 3.4 ?
:enonce
Comparez le coefficient de `D` à celui de l'interaction de la question 3.4. Sont-ils égaux ? Pourquoi ?
:court
**Presque** : 0,38001 contre 0,38020. Ils seraient strictement égaux dans un panel équilibré, où chaque localité est observée les dix années. Ici, deux localités ne sont observées que trois ans : les deux méthodes ne les pondèrent pas de la même façon, d'où un écart de 0,0002.
:zero
| Modèle | Coefficient | Erreur-type HC1 | Observations |
|---|--:|--:|--:|
| 3.4 : `treated`, `post`, interaction | 0,38020 | 0,0328 | 2 866 |
| 3.7 (a) : effets fixes de localité et d'année | 0,38001 | 0,0265 | 2 866 |
| 3.7 (e) : effets fixes de région et d'année, plus `treated` | 0,38040 | 0,0313 | 2 866 |

**Pourquoi ils sont égaux dans un panel équilibré.** Les effets fixes de localité contiennent toute l'information de `treated`, en plus fin : au lieu de « traitée ou non », ils disent « quelle localité ». Les effets fixes d'année contiennent celle de `post`, en plus fin. Mais `D` ne varie qu'entre **groupes** et entre **périodes**. Le détail supplémentaire (telle localité plutôt que telle autre du même groupe, 2011 plutôt que 2013) n'a aucun lien avec `D` : il ne change pas son coefficient.

**La vérification.** Sur les 286 localités observées les dix années (2 860 lignes), les trois modèles donnent **0,380006**, identique à la sixième décimale.

**Pourquoi un petit écart ici.** Sur les 297 localités, 9 n'ont aucune mesure de lumière et 2 n'en ont que pour 2012-2014. Ces deux-là comptent dans la moyenne « comparaison, après » de la question 3.4. Avec des effets fixes de localité, une localité jamais observée avant ne dit rien sur un changement avant-après : elle pèse autrement.

**Ce qui change vraiment : l'erreur-type.** Elle passe de 0,033 à 0,027, parce que 288 constantes expliquent beaucoup de variation et que le résidu rétrécit. Garde ce gain de précision en tête : la question 3.8 montre qu'il est trompeur.
:code
```r
complet <- did %>%
  group_by(electrific) %>%
  filter(sum(!is.na(nl_extensive)) == 10) %>%      # localités observées les 10 années
  ungroup()

coef(lm(nl_extensive ~ treated * post, data = complet))["treated:post"]                  # 0,380006
coef(lm(nl_extensive ~ D + factor(electrific) + factor(year), data = complet))["D"]      # 0,380006
```
:accord Même réponse et même vérification dans les deux versions : presque égaux, strictement égaux (0,380006) sur les 286 localités observées aux dix dates.
##d | Pourquoi treated ne peut pas figurer dans la régression
:enonce
Pourquoi `treated` ne peut-il pas figurer dans cette régression ?
:court
Parce que `treated` ne change jamais pour une localité donnée : c'est exactement la somme des indicatrices des localités traitées. Il est **parfaitement colinéaire** avec les effets fixes de localité. R ne peut pas séparer les deux et renvoie `NA`.
:zero
C'est le piège des variables indicatrices de la question 1.11, en plus grand. Là-bas, on ne pouvait pas mettre les trois régions **et** une constante, parce que Bruxelles + Flandre + Wallonie = 1 pour toutes les communes.

Ici : additionne les indicatrices des localités traitées. Tu obtiens une variable qui vaut 1 pour les traitées et 0 pour les autres, c'est-à-dire `treated`. La variable n'apporte **aucune information nouvelle** : chaque constante $α_i$ contient déjà le fait que la localité $i$ est traitée ou non.

De la même façon, `post` est la somme des indicatrices des années 2010 à 2014 : il est absorbé par les effets fixes d'année.

Plus généralement, **aucune caractéristique fixe dans le temps ne peut être estimée avec des effets fixes de localité**. C'est le prix à payer : on neutralise tout ce qui est fixe, donc on ne peut plus rien en dire.

:::piege L'ordre des variables dans la formule
Si tu écris `treated` **après** les effets fixes, R affiche `NA` : c'est le comportement attendu. Si tu l'écris **avant**, R supprime à la place l'indicatrice d'une localité et affiche pour `treated` un nombre (0,110) qui n'a aucun sens. Un coefficient affiché n'est pas forcément un coefficient interprétable.
:::
:code
```r
m <- lm(nl_extensive ~ D + factor(electrific) + factor(year) + treated, data = did)
coef(m)["treated"]        # NA : colinéarité parfaite
```
:accord Même explication : `treated` est une combinaison exacte des indicatrices de localité, comme `post` l'est des indicatrices d'année. Claude signale en plus le piège de l'ordre des variables (le 0,11 sans signification).
##e | Des effets fixes de région à la place
:enonce
Remplacez les effets fixes de localité par des effets fixes de région (`factor(region_num)`), en ajoutant `treated`, et réestimez. Le coefficient de `D` change-t-il ? Pourquoi ?
:court
**Pratiquement pas** : 0,3804 contre 0,3800. Pour que la double différence soit correcte, il suffit de tenir compte du **groupe** (`treated`) et du **temps** (effets fixes d'année). La région est une caractéristique fixe de plus, et la double différence retire déjà tout ce qui est fixe. Ce qui change, c'est l'erreur-type : 0,031 au lieu de 0,027.
:zero
**Pourquoi il faut remettre `treated`.** Sans effets fixes de localité, plus rien ne tient compte de l'écart de niveau entre les deux groupes. `treated` reprend ce rôle (son coefficient : 0,029, proche du 0,025 de la question 3.4). Si tu l'oublies, `D` monte à 0,405 : il absorbe l'écart de départ entre les groupes, et tu retombes sur la comparaison naïve de la question 3.3 (a).

**Pourquoi `D` ne bouge pas.** La région ne change pas dans le temps. Or `D` mesure un **changement** propre aux traitées. Une caractéristique fixe peut expliquer des niveaux, pas un changement : l'ajouter ou la retirer ne déplace pas `D`. Sur le panel équilibré, les trois modèles donnent d'ailleurs exactement 0,380006.

**Ce que cela t'apprend.** On peut tenir compte des différences fixes à plusieurs niveaux de finesse :

| Niveau | Nombre de constantes | Coefficient de D | Erreur-type HC1 |
|---|--:|--:|--:|
| Groupe (`treated`) | 2 | 0,3802 | 0,0328 |
| Région, plus `treated` | 13 | 0,3804 | 0,0313 |
| Localité | 288 | 0,3800 | 0,0265 |

Le coefficient est le même. Plus le niveau est fin, plus le modèle explique de variation, et plus l'erreur-type HC1 diminue.

Les 9 localités sans code de région sont aussi celles qui n'ont aucune mesure de lumière : l'échantillon reste de 2 866 observations.
:code
```r
reg_3_7e <- lm(nl_extensive ~ D + treated + factor(region_num) + factor(year), data = did)
rob(reg_3_7e)[c("D", "treated"), ]
```
:accord Même estimation (0,380404) et même explication. Claude insiste sur l'erreur-type (0,031 contre 0,027) ; ChatGPT sur le fait que l'écart minime disparaît sur le panel complet.
##f | Pourquoi ne pas contrôler nschool_elec
:enonce
Pourquoi ne faut-il pas ajouter `nschool_elec` comme variable de contrôle dans la régression de la luminosité ?
:court
Parce que `nschool_elec` est lui-même un **résultat** de l'électrification (question 3.5). C'est un [[mauvais contrôle]] : le contrôler retirerait de l'effet la part qui passe par les écoles, et ferait comparer des localités qui ne sont plus comparables.
:zero
Le réseau produit de la lumière par plusieurs chemins : éclairage public, ménages branchés, bâtiments publics, **écoles électrifiées**. Tu cherches l'effet **total** de l'arrivée du réseau.

**1. Tu bloquerais un chemin.** Contrôler `nschool_elec`, c'est demander : « à nombre d'écoles électrifiées égal, quel est l'effet du réseau sur la lumière ? ». La lumière qui passe par les écoles est exclue de la réponse. Ce n'est plus la question posée.

**2. Tu comparerais des localités différentes.** Une localité traitée et une localité de comparaison qui ont le même nombre d'écoles électrifiées ne se ressemblent pas : la seconde a obtenu ses écoles électrifiées **sans** réseau. C'est un biais de sélection.

**3. Tu perdrais deux années.** La variable n'existe pas pour 2013 et 2014 : l'échantillon tomberait de 2 866 à 2 290 observations.

:::verif Ce qui se passe si on essaie
Avec le contrôle, le coefficient de l'interaction tombe à 0,262. Mais ce n'est pas le contrôle qui le fait baisser : sur les mêmes 2 290 observations, **sans** le contrôle, il vaut déjà 0,264. La baisse vient de la perte de 2013 et 2014, deux des trois années où la lumière est la plus forte. Les raisons 1 et 2 sont des raisons de principe ; dans ces données, c'est la raison 3 qui pèse.
:::

**La règle générale**, déjà vue à la question 1.16 : on ne contrôle jamais une variable **postérieure au traitement et influencée par lui**.
:accord Même réponse : c'est une conséquence possible du traitement, la contrôler bloquerait un chemin causal et changerait la question posée. Claude ajoute la raison pratique (variable absente en 2013-2014).
:quiz
? Que neutralisent les effets fixes de localité ?
- Les chocs communs à toutes les localités une année donnée
+ Toutes les caractéristiques d'une localité qui ne changent pas dans le temps
- Les différences de tendance entre groupes
> Chaque localité reçoit sa propre constante, qui absorbe tout ce qui est fixe chez elle, observé ou non.
? Pourquoi R renvoie-t-il NA pour treated dans le modèle à effets fixes de localité ?
- Parce que treated a trop de valeurs manquantes
+ Parce que treated est la somme des indicatrices des localités traitées
- Parce que treated est corrélé avec le terme d'erreur
> C'est une colinéarité parfaite : treated n'apporte aucune information que les effets fixes ne contiennent déjà.
? Avec des effets fixes de région au lieu de localité, le coefficient de D :
+ ne change pratiquement pas, mais son erreur-type HC1 augmente
- double
- devient non significatif
> La région est fixe dans le temps, comme la localité. Seule la variance résiduelle change.
:oral
? Qu'est-ce qu'un modèle TWFE ?
> Une régression avec deux séries d'effets fixes : une constante par localité, qui neutralise tout ce qui est fixe dans le temps, et une constante par année, qui neutralise tout ce qui est commun à toutes les localités une année donnée. L'effet est estimé par l'évolution de chaque localité au-delà des chocs communs.
? Ton coefficient TWFE est-il égal à celui de la question 3.4 ?
> Presque : 0,3800 contre 0,3802. Ils seraient identiques dans un panel équilibré ; je l'ai vérifié sur les 286 localités observées dix ans, où les deux valent 0,380006. L'écart vient de deux localités observées seulement de 2012 à 2014.
? Pourquoi ne pas contrôler le nombre d'écoles électrifiées ?
> Parce que c'est une conséquence de l'électrification. Le contrôler bloquerait un des chemins par lesquels le réseau produit de la lumière : on n'estimerait plus l'effet total. On ne contrôle pas une variable influencée par le traitement.

#Q 3.8 | Les erreurs-types groupées
:intro
Jusqu'ici, les erreurs-types HC1 ont traité les 2 866 observations comme autant d'informations indépendantes. Or ce sont 288 localités observées dix fois. Cette question corrige l'incertitude, pas le coefficient.
:concepts incertitude, did
##a | HC1 contre erreurs-types groupées
:enonce
Estimez à nouveau les modèles des questions 3.4 (b) et 3.7 (a) avec des erreurs-types groupées par localité, et comparez-les aux erreurs-types robustes (HC1).
:court
| Modèle | Coefficient | HC1 | Groupée | Rapport | IC à 95 % (groupée) |
|---|--:|--:|--:|--:|--:|
| 3.4 (b) : `treated × post` | 0,380 | 0,033 | 0,044 | 1,35 | [0,29 ; 0,47] |
| 3.7 (a) : effets fixes | 0,380 | 0,027 | 0,047 | 1,76 | [0,29 ; 0,47] |

Les coefficients ne changent pas. Les erreurs-types augmentent de 35 % et de 76 %.
:zero
**Ce que « grouper » veut dire.** Les [[erreurs-types groupées]] (en anglais *clustered*) autorisent les erreurs d'une **même localité** à être corrélées entre elles d'une année à l'autre, de n'importe quelle façon. Elles supposent seulement que deux localités **différentes** sont indépendantes.

- HC1 : 2 866 informations indépendantes.
- Groupées : 288 blocs indépendants.

Seule l'incertitude change. Le coefficient, lui, est calculé de la même façon.

**Un détail qui compte.** Avec HC1, le modèle à effets fixes paraissait plus précis que le modèle simple (0,027 contre 0,033). Avec les erreurs-types groupées, les deux se rejoignent (0,047 et 0,044). Le gain de précision apparent des effets fixes était une illusion.

{{w:cluster}}
:code
```r
vc_groupee <- vcovCL(reg_3_4, cluster = ~ electrific, type = "HC1")
coeftest(reg_3_4, vcov = vc_groupee)

coeftest(reg_3_7a, vcov = vcovCL(reg_3_7a, cluster = ~ electrific, type = "HC1"))["D", ]
```

- `vcovCL()` (package `sandwich`) calcule la matrice de variance groupée ; `cluster = ~ electrific` désigne la variable qui définit les groupes.
- `coeftest()` refait le tableau de coefficients avec cette matrice. C'est la même mécanique que ta fonction `rob()`, avec `vcovCL` à la place de `vcovHC`.
:accord Mêmes erreurs-types (0,0442 et 0,0467). Pour l'intervalle de confiance, ChatGPT utilise le quantile de Student à 287 degrés de liberté (nombre de localités moins un) et obtient [0,293 ; 0,467] et [0,288 ; 0,472] ; Claude utilise 1,96 et arrondit à [0,29 ; 0,47]. À deux décimales, c'est identique.
##b | Pourquoi les erreurs d'une localité sont corrélées
:enonce
Expliquez avec vos mots pourquoi les termes d'erreur d'une même localité risquent d'être corrélés d'une année à l'autre dans cette application, et ce que cela implique pour les erreurs-types non groupées.
:court
Parce que ce que le modèle n'explique pas dans une localité **persiste** d'une année à l'autre : sa taille, son activité, un marché ou une route à proximité. Une localité plus lumineuse que prévu une année l'est en général aussi l'année suivante. Ses dix observations n'apportent donc pas dix informations indépendantes. Les erreurs-types non groupées font comme si, et sont **trop petites** : les tests rejettent trop souvent et les intervalles sont trop étroits.
:zero
**Une image.** Pèse dix fois la même personne : tu n'as pas dix personnes. Tu connais très bien **son** poids, mais tu ne connais pas mieux le poids moyen de la population. Dix années d'une même localité, c'est un peu pareil.

**Ce que contient le terme d'erreur d'une localité.** Tout ce qui influence sa lumière et n'est pas dans la régression : un marché hebdomadaire, un axe routier, la position exacte de la localité par rapport aux pixels du satellite. Ces facteurs ne changent pas d'une année à l'autre, ou très lentement.

**Dans tes données.** La corrélation entre le résidu d'une localité et son résidu de l'année précédente vaut **0,66**. Si les erreurs étaient indépendantes, elle serait proche de 0.

**Pourquoi c'est pire en double différence.** Le régresseur `D` est lui aussi « persistant » : il vaut 1 cinq années de suite dans chaque localité traitée. Quand le régresseur et l'erreur sont tous deux corrélés dans le temps, l'erreur-type naïve peut être très loin de la vérité. C'est un résultat classique (Bertrand, Duflo et Mullainathan, 2004), qui a fait des erreurs-types groupées la norme en double différence.

**Et avec les effets fixes ?** Ils retirent la partie **permanente** de l'erreur d'une localité, mais pas sa persistance d'une année à l'autre. Le rapport est même plus grand (1,76).

Dans l'outil du point (a), mets la corrélation à 0, puis à 0,66. Sans aucun effet réel, un test à 5 % fondé sur HC1 en « trouve » un dans environ 15 % des simulations : trois fois trop souvent.
:accord Même explication (des chocs persistants propres à la localité ; les lignes ne sont pas des informations indépendantes ; erreurs-types non groupées sous-estimées). Claude ajoute la corrélation des résidus mesurée dans les données (0,66) et la référence à Bertrand, Duflo et Mullainathan (2004).
##c | Pourquoi grouper par localité
:enonce
Pourquoi faut-il grouper au niveau de la localité, et non de l'année ou de la région ?
:court
Trois raisons : c'est le niveau où le **traitement est attribué** (on raccorde une localité) ; c'est le niveau où les **erreurs sont corrélées** (dans le temps, au sein d'une localité) ; et il y a **assez de groupes** (288). Par année, il n'y aurait que 10 groupes, et on ignorerait la corrélation dans le temps, qui est le vrai problème. Par région, 13 groupes : trop peu pour une erreur-type fiable.
:zero
| Grouper par… | Nombre de groupes | Corrélation autorisée | Problème |
|---|--:|---|---|
| **localité** | 288 | entre les années d'une même localité | aucun : c'est le bon niveau |
| année | 10 | entre les localités, une même année | ignore la persistance dans le temps ; trop peu de groupes |
| région | 13 | entre toutes les observations d'une région | trop peu de groupes |

**La règle pratique.** On groupe au niveau où le traitement est décidé. Ici, le réseau arrive dans une localité : toutes ses années « après » sont traitées ensemble.

**Pourquoi le nombre de groupes compte.** Une erreur-type groupée est calculée à partir de la dispersion **entre groupes**. Avec 288 localités, cette dispersion est bien mesurée. Avec 10 ou 13 groupes, elle est elle-même très imprécise, et les tests ne sont plus fiables. On cite souvent un minimum de 40 à 50 groupes.

**Et la région ?** En théorie, grouper par région serait plus prudent encore : cela autoriserait aussi des corrélations entre localités voisines. Mais avec 13 régions, le remède est pire que le mal.

:::verif Par curiosité
J'ai essayé : en groupant par année, l'erreur-type de l'interaction vaut 0,107 ; par région, 0,054. L'effet reste significatif dans tous les cas, mais ces deux valeurs reposent sur 10 et 13 groupes : ne les utilise pas pour conclure.
:::
:accord Même réponse : le traitement est attribué à la localité et ses mesures sont répétées ; grouper par année ne permettrait pas la corrélation dans le temps ; grouper par région laisserait trop peu de groupes (13).
##d | Le sens de l'écart et la conclusion
:enonce
Le sens de l'écart observé en (a) est-il celui que vous attendiez ? Que concluez-vous sur l'effet de l'expansion du réseau électrique ?
:court
**Oui.** Avec des erreurs positivement corrélées dans le temps au sein d'une localité, on attend des erreurs-types groupées plus grandes : elles le sont, de 35 % et de 76 %. L'effet reste très significatif : t = 0,380 / 0,044 = **8,6**. L'arrivée du réseau a augmenté de **38 points** la probabilité qu'une localité soit visible de nuit, avec un intervalle de confiance à 95 % de **29 à 47 points**.
:zero
**Le raisonnement en trois temps.**

1. **Ce qu'on attendait.** Corrélation positive (0,66), donc moins d'information qu'il n'y paraît, donc des erreurs-types groupées plus grandes.
2. **Ce qu'on observe.** 0,044 contre 0,033, et 0,047 contre 0,027. Conforme.
3. **Ce que ça change.** L'intervalle s'élargit, de [0,32 ; 0,44] à [0,29 ; 0,47]. La statistique t passe de 11,6 à 8,6. La conclusion ne change pas : l'effet est massif et très loin de zéro.

{{w:loi test=did}}

**La conclusion à écrire** doit rappeler sous quelle hypothèse elle vaut : *sous l'hypothèse de tendances parallèles*, l'arrivée du réseau a augmenté de 38 points (IC à 95 % : 29 à 47) la part de localités visibles de nuit.

:::verif Et pour les autres résultats ? Vérifié sur les données, absent des deux corrigés
L'énoncé ne demande les erreurs-types groupées que pour la luminosité. Voici ce qu'elles donnent pour les quatre variables de la question 3.5 :

| Variable | Double différence | HC1 | Groupée | p-valeur (groupée) |
|---|--:|--:|--:|--:|
| `nl_extensive` | 0,380 | 0,033 | 0,044 | < 0,001 |
| `nl_intensive_hat` | 0,429 | 0,140 | 0,097 | < 0,001 |
| `nschool_elec` | 0,158 | 0,079 | 0,117 | 0,18 |
| `n_students_public` | −6,73 | 5,28 | 5,00 | 0,18 |

Deux enseignements.

- **L'effet sur les écoles électrifiées n'est plus significatif** (p = 0,18 au lieu de 0,045). ChatGPT l'avait pressenti en parlant d'une inférence « sensible à la corrélation entre années ».
- **Grouper n'augmente pas toujours l'erreur-type** : pour l'intensité lumineuse, elle diminue. Quand une localité est durablement au-dessus ou en dessous des autres, cet écart permanent s'annule dans la comparaison après − avant. L'erreur-type groupée en tient compte ; HC1, non. Dans l'outil du point (a), pousse la corrélation à 0,95 pour voir l'ordre s'inverser.
:::
:accord Même réponse : le sens est celui attendu, l'effet reste très significatif (t = 8,6, et 8,1 avec effets fixes), intervalle de 29 à 47 points. ChatGPT rappelle les deux conditions de la lecture causale (tendances parallèles, pas de contamination entre groupes) : c'est la bonne façon de finir.
:quiz
? Quand on passe des erreurs-types HC1 aux erreurs-types groupées par localité, qu'est-ce qui change ?
- Le coefficient et son erreur-type
+ Seulement l'erreur-type
- Seulement le coefficient
> Grouper ne modifie que le calcul de l'incertitude. Le coefficient reste 0,380.
? Pourquoi ne pas grouper par région ?
- Parce que le traitement varie d'une région à l'autre
+ Parce qu'il n'y a que 13 régions, trop peu pour une erreur-type groupée fiable
- Parce que les régions n'ont pas d'effet sur la lumière
> Une erreur-type groupée repose sur la dispersion entre groupes : il en faut beaucoup.
? La corrélation des résidus d'une localité d'une année à l'autre vaut 0,66. Les erreurs-types HC1 de la double différence sont donc :
+ trop petites
- trop grandes
- correctes
> HC1 compte dix informations indépendantes par localité, alors qu'elles se répètent en partie.
:oral
? Pourquoi grouper les erreurs-types par localité ?
> Parce que les dix observations d'une localité ne sont pas indépendantes : ce que le modèle n'explique pas chez elle persiste d'une année à l'autre. Dans mes données, la corrélation des résidus d'une année à l'autre est de 0,66. Sans grouper, on surestime l'information disponible et les erreurs-types sont trop petites.
? Qu'est-ce que le groupement change à ta conclusion ?
> L'erreur-type passe de 0,033 à 0,044 et l'intervalle de confiance s'élargit, de 32-44 points à 29-47 points. L'effet reste très significatif, avec un t de 8,6. La conclusion ne change pas, mais sa précision est plus honnête.
:retenir
- Effets fixes de localité : tout ce qui est fixe dans le temps. Effets fixes d'année : tout ce qui est commun à tous une année donnée.
- Dans un panel équilibré, TWFE et double différence 2×2 donnent le même coefficient (0,380).
- On ne peut pas estimer l'effet d'une variable fixe dans le temps avec des effets fixes de localité, et on ne contrôle pas un résultat du traitement.
- En panel, on groupe les erreurs-types au niveau où le traitement est attribué : 0,044 au lieu de 0,033.

#SEC E | Conclusion

#Q 3.9 | Plus de lumière, plus d'activité économique ?
:enonce
L'arrivée du réseau augmente mécaniquement la lumière nocturne, par exemple par l'éclairage public, indépendamment de toute activité économique.
:intro
La lumière nocturne sert souvent de mesure indirecte de l'activité économique. Mais ici, le traitement **est** de l'électricité. Cette dernière question te demande de séparer ce que tes estimations montrent de ce qu'elles ne montrent pas.
:concepts causalite, did
##a | Ton résultat montre-t-il une hausse de l'activité économique ?
:enonce
Votre résultat de la question 3.4 montre-t-il une hausse de l'activité économique ?
:court
**Non.** Il montre que les localités raccordées deviennent visibles de nuit, pas qu'elles produisent davantage. Le réseau apporte de la lumière par lui-même : éclairage public, bâtiments publics, quelques ménages branchés. Et `nl_extensive` passe de 0 à 1 dès que quelques lampes dépassent le seuil de détection du satellite.
:zero
**Pourquoi la lumière mesure d'habitude l'activité.** Dans un pays où les statistiques locales sont rares, une zone qui s'éclaire est en général une zone où l'on construit, où l'on commerce, où les revenus montent. La lumière est un **indicateur indirect** : on ne s'intéresse pas à elle, mais à ce qu'elle révèle.

**Pourquoi ça ne marche plus ici.** Un indicateur indirect n'est fiable que si son lien avec ce qu'il mesure reste **stable**. Or l'électrification change ce lien : elle rend la lumière possible et bon marché, à activité inchangée. Un lampadaire devant la mairie allume le pixel sans qu'aucune entreprise ait produit davantage.

Une comparaison : le nombre de parapluies ouverts mesure bien la pluie, sauf le jour où la mairie en distribue gratuitement.

**Ce que le résultat montre vraiment.** Que le réseau **est utilisé** : il y a de la lumière là où il n'y en avait pas. C'est une condition nécessaire à des effets économiques, pas une preuve de ces effets.
:accord Même réponse : non. Une ampoule dans une rue peut rendre le village visible sans qu'aucune entreprise produise davantage (ChatGPT) ; la lumière n'est un bon indicateur que tant que sa relation avec l'activité est stable, et l'électrification casse précisément cette relation (Claude).
##b | Les autres résultats de l'article
:enonce
Quels autres résultats de l'article permettent d'en juger ?
:court
Ceux qui portent sur autre chose que la lumière. D'après l'énoncé et les deux corrigés : des effets positifs sur l'**approvisionnement en eau** (systèmes alimentés par le réseau) et sur l'**électrification des écoles**, **pas d'effet sur le nombre d'élèves**, et, du côté des ménages, davantage d'équipements et d'accès aux services financiers, y compris chez les ménages non raccordés. Ce sont des usages concrets et des services collectifs, pas une mesure directe de la production ou des revenus.
:zero
:::verif Cette réponse demande d'avoir lu l'article
L'énoncé rend obligatoire la lecture des sections 1 à 4 et du tableau 4. Je n'ai pas pu lire l'article (accès payant). Voici ce que je peux garantir.

- **Dit par l'énoncé** : effets positifs importants sur la luminosité, sur l'approvisionnement en eau et sur l'électrification des écoles ; pas d'effet sur le nombre d'élèves ; l'idée que les bénéfices passent par la communauté (éclairage public, écoles, pompes à eau, effets sur les ménages non raccordés).
- **Dit par les deux corrigés, à vérifier dans ta lecture** : équipement des ménages en appareils électriques, accès aux services financiers, absence de croissance démographique significative.

ChatGPT ajoute que, dans la colonne « DiD : TWFE » du tableau 4, les résultats sur l'eau et les écoles sont « plus imprécis » que dans les spécifications principales. C'est cohérent avec ce que tu trouves pour les écoles (question 3.8), mais je n'ai pas pu le contrôler.
:::

**Comment classer ces résultats.** Demande-toi, pour chacun, s'il parle d'activité économique.

| Résultat | Ce qu'il montre | Est-ce de l'activité économique ? |
|---|---|---|
| Lumière nocturne | le réseau est utilisé | pas directement |
| Systèmes d'eau alimentés par le réseau | un service collectif nouveau | non : un équipement |
| Écoles électrifiées, sans hausse du nombre d'élèves | un équipement amélioré | non |
| Appareils électriques et services financiers chez les ménages | un changement des conditions de vie | indirectement |
| Revenus, emploi, entreprises, production | ce qu'il faudrait observer | **oui, et c'est ce qui manque** |

**Tes propres résultats vont dans le même sens.** Question 3.5 : un effet estimé positif sur les écoles électrifiées, aucun sur le nombre d'élèves. Le réseau modifie les équipements ; il ne modifie pas, dans ces données, les comportements mesurés.
:gpt
Cite les infrastructures d'eau alimentées par le réseau et l'électrification des écoles « dans ses spécifications principales », en précisant que dans la seule colonne TWFE du tableau 4 ces deux résultats sont plus imprécis ; les équipements des ménages et l'accès aux services financiers ; pas de hausse robuste des inscriptions scolaires. Conclut que ces éléments montrent des usages concrets du réseau et ne mesurent pas directement la production.
:claude
Cite, au niveau des localités, les systèmes d'adduction d'eau alimentés par le réseau et les écoles électrifiées, sans hausse du nombre d'élèves ni croissance démographique significative ; au niveau des ménages, plus d'appareils électriques et une meilleure inclusion financière, y compris chez les ménages non raccordés ; et la marge intensive de la lumière. Ajoute ce qu'il faudrait pour conclure : revenus, consommation, emploi, création d'entreprises.
:verdict
Les deux listes se recoupent et concordent avec le résumé que donne l'énoncé. ChatGPT est plus prudent sur la précision des résultats ; Claude dit clairement ce qui manque pour parler d'activité économique. Aucune des deux ne remplace ta lecture : à l'oral, on peut te demander où tu as lu tel résultat. Complète la liste avec tes propres notes.
:opt mix | À ajuster après ta lecture de l'article
L'article rapporte aussi des effets sur l'approvisionnement en eau par des systèmes alimentés par le réseau et sur l'électrification des écoles, sans hausse du nombre d'élèves, ainsi que, pour les ménages, davantage d'appareils électriques et d'accès aux services financiers, y compris chez ceux qui ne sont pas raccordés. Ces résultats décrivent des équipements collectifs et des conditions de vie. Pour conclure à une hausse de l'activité économique, il faudrait des mesures directes : revenus, emploi, création d'entreprises.
##c | La conclusion en trois phrases
:enonce
Formulez en trois phrases au plus la conclusion que vos estimations permettent de tirer.
:court
Trois phrases, trois fonctions : **le résultat chiffré**, **l'hypothèse dont il dépend**, **ce qu'il ne montre pas**. Choisis ou adapte une des versions proposées plus bas.
:zero
Une bonne conclusion ne répète pas tous les chiffres. Elle dit ce qu'on a trouvé, à quelle condition c'est crédible, et où s'arrête ce qu'on peut affirmer.

| Phrase | Sa fonction | Ce qu'elle doit contenir |
|---|---|---|
| 1 | Le résultat | +38 points, intervalle de 29 à 47, par rapport à quel groupe |
| 2 | La condition | tendances parallèles ; ce qui les rend plausibles ; ce qui fragilise l'ampleur (satellite) |
| 3 | La limite | lumière et équipements ne sont pas l'activité économique |

**Trois erreurs à éviter.**

- Écrire « l'électrification augmente l'activité économique » : tes estimations ne le montrent pas.
- Donner l'erreur-type HC1 (0,033) comme mesure de précision : c'est l'erreur-type groupée (0,044) qui vaut.
- Écrire que le nombre d'écoles électrifiées « augmente significativement » : l'effet n'est plus significatif avec des erreurs-types groupées, et il vient surtout d'une baisse dans le groupe de comparaison (question 3.5).

L'énoncé dit « trois phrases au plus » : compte-les avant de rendre.
:gpt
« La double différence estime une hausse additionnelle d'environ 38 points de détection nocturne dans les localités raccordées tôt. On observe une amélioration de l'équipement scolaire, sans hausse discernable des effectifs du primaire public dans l'échantillon. L'interprétation causale dépend des tendances parallèles et la hausse de lumière ne quantifie pas, à elle seule, une hausse de l'activité économique. »
:claude
Trois phrases plus longues : +38 points (IC à 95 % avec erreurs groupées : 29 à 47 points) par rapport aux localités raccordées en 2015-2017, et hausse du nombre d'écoles électrifiées sans effet sur le nombre d'élèves ; le résultat repose sur les tendances parallèles, compatibles avec l'évolution avant 2008, et son ampleur dépend en partie du passage à VIIRS en 2012 ; le réseau apporte de la lumière et des équipements collectifs, ce qui ne suffit pas à établir une hausse de l'activité économique.
:verdict
Même fond. ChatGPT est plus court et plus lisible. Claude donne l'intervalle de confiance et mentionne le satellite, deux éléments qui montrent que tu as fait les questions 3.6 et 3.8. Les deux affirment sans réserve une amélioration de l'équipement scolaire : au vu des erreurs-types groupées (p = 0,18), j'ai nuancé ce point dans les trois versions ci-dessous. Le mieux reste d'écrire la tienne : c'est la conclusion qu'on te fera commenter à l'oral.
:opt gpt | Version courte
La double différence estime que l'arrivée du réseau a augmenté d'environ 38 points la part de localités visibles de nuit, par rapport aux localités raccordées plus tard. L'équipement scolaire semble s'améliorer, sans hausse discernable du nombre d'élèves. Cette lecture causale dépend de l'hypothèse de tendances parallèles, et la hausse de lumière ne mesure pas à elle seule une hausse de l'activité économique.
:opt claude | Version détaillée, avec intervalle et satellite
Le raccordement au réseau en 2008-2009 a augmenté de 38 points la part de localités visibles de nuit (intervalle de confiance à 95 % avec erreurs-types groupées : 29 à 47 points) par rapport aux localités raccordées en 2015-2017 ; l'effet estimé sur les écoles électrifiées est positif mais fragile, et rien n'apparaît sur le nombre d'élèves. Ce résultat repose sur l'hypothèse de tendances parallèles, compatible avec l'évolution des deux groupes avant 2008, et son ampleur dépend en partie du passage au satellite VIIRS en 2012. Il montre que le réseau apporte de la lumière et des équipements collectifs, mais ne suffit pas à établir une hausse de l'activité économique.
:opt mix | Version intermédiaire, qui commence par l'hypothèse
Sous l'hypothèse de tendances parallèles, que l'évolution des deux groupes avant 2008 rend plausible, l'arrivée du réseau a augmenté de 38 points (intervalle à 95 % : 29 à 47) la part de localités visibles de nuit. L'effet estimé sur les écoles électrifiées est positif mais imprécis, et aucun effet n'apparaît sur le nombre d'élèves. Ces résultats montrent que le réseau est utilisé et modifie les équipements collectifs ; ils ne permettent pas de conclure à une hausse de l'activité économique.
:quiz
? Pourquoi la hausse de la lumière nocturne ne prouve-t-elle pas ici une hausse de l'activité économique ?
- Parce que l'effet n'est pas significatif
+ Parce que le réseau produit de la lumière par lui-même, sans activité supplémentaire
- Parce que le satellite ne mesure pas la lumière des villages
> L'éclairage public suffit à rendre une localité visible. Le lien habituel entre lumière et activité est rompu par le traitement lui-même.
? Laquelle de ces phrases peut figurer dans ta conclusion ?
- L'électrification augmente l'activité économique des localités
- L'électrification n'a aucun effet sur les localités
+ L'électrification rend les localités visibles de nuit, sans effet détectable sur le nombre d'élèves
> C'est ce que montrent tes estimations, ni plus ni moins.
:oral
? En une phrase, que montre ta partie 3 ?
> Sous l'hypothèse de tendances parallèles, l'arrivée du réseau a augmenté de 38 points la part de localités visibles de nuit, avec un intervalle de 29 à 47 points ; cela montre que le réseau est utilisé, pas que l'activité économique a augmenté.
? Que faudrait-il pour conclure sur l'activité économique ?
> Des mesures directes : revenus ou consommation des ménages, emploi, nombre d'entreprises, production agricole. La lumière ne peut pas servir d'indicateur indirect ici, puisque le traitement est justement de l'électricité.
:retenir
- +38 points de localités visibles de nuit (IC à 95 % : 29 à 47), sous l'hypothèse de tendances parallèles.
- L'ampleur dépend du capteur : +10 points avec DMSP, +56 avec VIIRS.
- Effet positif mais fragile sur les écoles électrifiées, aucun sur le nombre d'élèves.
- La lumière prouve que le réseau est utilisé, pas que l'activité économique augmente.
