#PART 2 | Enfants et travail des mères | Variables instrumentales
:resultat −5,5 sem. | effet d'un troisième enfant sur le travail annuel de la mère (2SLS)
:intro
>> Les mères de trois enfants travaillent moins que les mères de deux enfants. Est-ce le troisième enfant qui les fait moins travailler, ou sont-ce d'autres femmes ?

### Le problème

Les mères de plus de deux enfants ont travaillé 5,4 semaines de moins en 1979 que les mères de deux enfants. Mais avoir un troisième enfant est un **choix**. Les femmes qui le font peuvent être aussi celles qui, de toute façon, auraient moins travaillé : parce qu'elles tiennent moins à leur carrière, ou que leur conjoint gagne bien sa vie. Comparer les deux groupes mélange l'effet de l'enfant et ces différences entre femmes.

### L'idée d'Angrist et Evans (1998)

Beaucoup de parents souhaitent un garçon **et** une fille. Ceux dont les deux premiers enfants sont de même sexe ont donc plus souvent un troisième enfant. Or le sexe d'un enfant est dû au hasard. On tient là une variable qui fait varier le nombre d'enfants **sans être un choix** : un [[instrument]].

{{w:dag schema=vi}}

### Les données

`Fertility.RData` : 254 654 femmes mariées de 21 à 35 ans, mères d'au moins deux enfants, au recensement américain de 1980.

| Variable | Ce qu'elle mesure |
|---|---|
| `work` | semaines travaillées par la mère en 1979 (0 à 52) |
| `morekids` | la mère a plus de deux enfants (yes / no) |
| `gender1`, `gender2` | sexe du premier et du deuxième enfant |
| `age` | âge de la mère au recensement |
| `afam`, `hispanic`, `other` | origine de la mère (yes / no) |

### Le chemin

| Étape | Questions | L'idée à retenir |
|---|---|---|
| A. Le problème | 2.1, 2.2 | Les MCO comparent deux groupes qui ne sont pas comparables. |
| B. L'instrument | 2.3 à 2.6 | Conditions de validité, première étape, forme réduite, et la division qui donne l'effet. |
| C. Contrôles et 2SLS | 2.7 à 2.9 | Ce que font les contrôles, et deux instruments au lieu d'un. |
| D. Tester | 2.10 à 2.12 | Les instruments sont-ils cohérents ? Fallait-il vraiment instrumenter ? |
| E. Conclure | 2.13, 2.14 | Arrêt du travail ou réduction, et pour quelles mères l'effet vaut. |

### Le résultat en une phrase

Un troisième enfant réduit le travail de la mère d'environ **5,5 semaines par an** (intervalle de confiance : 3 à 8 semaines), surtout parce que certaines mères cessent complètement de travailler. Ce chiffre vaut pour les mères qui ont eu ce troisième enfant *à cause* du sexe des deux premiers.

{{w:foret jeu=p2}}

#SEC A | Le problème : comparer n'est pas mesurer un effet

#Q 2.1 | Décrire l'échantillon
:enonce
Décrivez l'échantillon : unité statistique, nombre d'observations et au plus quatre statistiques descriptives utiles pour la suite, dont vous justifierez le choix. Représentez la distribution de `work` et commentez-la.
:concepts donnees
## | Unité, effectif, quatre statistiques et un histogramme
:court
**Unité statistique** : une femme mariée de 21 à 35 ans, mère d'au moins deux enfants, au recensement américain de 1980. **254 654 observations.** Quatre statistiques : 19,0 semaines travaillées en moyenne, 47,2 % des mères n'ont pas travaillé du tout, 38,1 % ont plus de deux enfants, 50,6 % ont deux premiers enfants de même sexe. La distribution de `work` a **deux pics**, à 0 et à 52 semaines.
:zero
**Avant tout : transformer les facteurs.** Dans le fichier, `morekids`, `afam`, `hispanic` et `other` valent `"yes"` ou `"no"`. Une régression a besoin de nombres : on les recode en 1 et 0.

**Quatre statistiques, chacune choisie pour une raison.** L'énoncé demande de **justifier** le choix : chaque chiffre doit servir à quelque chose plus loin.

| Statistique | Valeur | À quoi elle sert dans la suite |
|---|--:|---|
| Semaines travaillées, moyenne | 19,0 | L'échelle pour juger les effets : −5 semaines, c'est plus d'un quart de la moyenne. |
| Mères sans aucune semaine travaillée | 47,2 % | Près d'une mère sur deux est à zéro : l'effet peut passer par l'arrêt complet du travail (question 2.13). |
| Mères de plus de deux enfants | 38,1 % | La taille des deux groupes comparés : 96 912 et 157 742 mères. |
| Deux premiers enfants de même sexe | 50,6 % | L'instrument est réparti moitié-moitié, comme on l'attend si le sexe est dû au hasard. |

**La distribution de `work`.** Elle ne ressemble pas du tout à une cloche. Un pic à **0** (47,2 % des mères), un second à **52** (18,5 %, l'année entière), et entre les deux des valeurs éparpillées avec de petits pics aux chiffres ronds (40, 48, 50). La moyenne (19,0) est très éloignée de la médiane (5).

Ce que cela implique : une régression sur `work` mélange deux décisions différentes, **travailler ou non** (la [[marge extensive]]) et **combien de semaines** (la marge intensive). La question 2.13 les séparera.

:::piege Le piège de `as.numeric()` sur un facteur
`as.numeric(morekids)` appliqué directement au facteur renvoie ses codes internes, **1 et 2**, pas 0 et 1. Il faut écrire `as.numeric(morekids == "yes")` : la comparaison donne vrai ou faux, que `as.numeric()` transforme en 1 ou 0.
:::
:code
```r
load(file.path(dossier, "Fertility.RData"))      # crée le data frame Fertility

fert <- Fertility %>%
  mutate(morekids   = as.numeric(morekids == "yes"),       # facteur yes/no -> 1/0
         afam       = as.numeric(afam == "yes"),
         hispanic   = as.numeric(hispanic == "yes"),
         other      = as.numeric(other == "yes"),
         boy1st     = as.numeric(gender1 == "male"),
         samegender = as.numeric(gender1 == gender2),
         twoboys    = as.numeric(gender1 == "male"   & gender2 == "male"),
         twogirls   = as.numeric(gender1 == "female" & gender2 == "female"),
         travaille  = as.numeric(work > 0))

nrow(fert)                 # 254 654
mean(fert$work)            # 19,0
mean(fert$work == 0)       # 0,472
mean(fert$morekids)        # 0,381
mean(fert$samegender)      # 0,506

ggplot(fert, aes(x = work)) +
  geom_histogram(binwidth = 1, boundary = -0.5, fill = "grey55", colour = "white")
```

- `load()` charge un fichier `.RData` et recrée les objets qu'il contient.
- La moyenne d'une variable 0/1 est une **proportion** : `mean(fert$morekids)` donne la part des mères de plus de deux enfants.
- `&` veut dire « et ». On crée dès maintenant toutes les variables des questions suivantes.
- `binwidth = 1` : une barre par nombre de semaines.
:gpt
Quatre statistiques : part des mères de plus de deux enfants (38,06 %), semaines travaillées en moyenne (19,02), part ayant travaillé au moins une semaine (52,82 %), part ayant travaillé 52 semaines (18,54 %). Rappelle l'idée de l'article : on ne voit jamais ce que ferait la *même* mère avec une autre taille de famille.
:claude
Quatre statistiques : semaines moyennes (19,0), part à zéro (47,2 %), part de plus de deux enfants (38,1 %), part de même sexe (50,6 %). Chacune est reliée à une question ultérieure. Commente la bimodalité, la médiane (5) et les deux marges.
:verdict
Trois statistiques sont communes (moyenne, zéros, part de `morekids` : « 52,8 % ont travaillé » et « 47,2 % n'ont pas travaillé » disent la même chose). La quatrième diffère : ChatGPT choisit la part à 52 semaines, Claude la part de `samegender`. L'énoncé demande des statistiques **utiles pour la suite** : la répartition de l'instrument l'est davantage, puisqu'elle prépare les questions 2.3 à 2.6. Le pic à 52 semaines trouve naturellement sa place dans le commentaire de l'histogramme.
:opt claude | Moyenne, zéros, morekids, samegender
L'unité est une femme mariée de 21 à 35 ans, mère d'au moins deux enfants, au recensement américain de 1980 ; l'échantillon en compte 254 654. Je retiens : la moyenne de work (19,0 semaines), qui donne l'échelle des effets ; la part des mères à zéro (47,2 %), qui annonce le rôle de l'arrêt complet du travail ; la part de morekids (38,1 %), qui donne la taille des groupes comparés ; et la part de samegender (50,6 %), conforme à un sexe dû au hasard. La distribution de work a deux pics, à 0 et à 52 semaines.
:opt gpt | Moyenne, morekids, participation, année complète
Je retiens la part de mères de plus de deux enfants (38,1 %), la moyenne des semaines travaillées (19,0), la part ayant travaillé au moins une semaine (52,8 %) et la part ayant travaillé toute l'année (18,5 %). Les deux dernières décrivent les deux pics de la distribution.
:quiz
? La moyenne de la variable morekids (codée 0/1) vaut 0,381. Cela signifie que :
- les mères ont en moyenne 0,381 enfant de plus
+ 38,1 % des mères ont plus de deux enfants
- 38,1 % des mères travaillent
> La moyenne d'une variable qui vaut 0 ou 1 est la proportion de 1.
:oral
? Pourquoi la moyenne de work décrit-elle mal la mère « typique » ?
> Parce que la distribution a deux pics : près de la moitié des mères sont à 0 semaine, près d'une sur cinq à 52. Très peu de mères travaillent 19 semaines. La médiane n'est que de 5.

#Q 2.2 | La régression par les MCO et son biais
:enonce
Estimez par les MCO le modèle $work_{i} = β₀ + β₁ morekids_{i} + u_{i}$.
:intro
C'est la comparaison la plus simple possible : les mères de plus de deux enfants contre les mères de deux enfants. La question te fait dire, pas à pas, pourquoi elle ne mesure pas un effet.
:concepts indicatrices, hypotheses, causalite
##a | Interpréter le coefficient
:enonce
Que vous apprend le coefficient estimé de `morekids` ? Interprétez-le.
:court
**−5,39** (erreur-type 0,087). Les mères de plus de deux enfants ont travaillé en moyenne **5,4 semaines de moins** en 1979 que les mères de deux enfants : 15,7 semaines contre 21,1, soit 26 % de moins.
:zero
Avec un seul régresseur qui vaut 0 ou 1, la régression ne fait que **comparer deux moyennes**.

| Coefficient | Ce qu'il est | Valeur |
|---|---|--:|
| Constante $β₀$ | moyenne de `work` quand `morekids` = 0 (mères de deux enfants) | 21,07 |
| Pente $β₁$ | écart entre les deux moyennes | −5,39 |
| $β₀ + β₁$ | moyenne de `work` quand `morekids` = 1 | 15,68 |

L'estimation est extrêmement précise (t = −62) : avec 254 654 observations, presque tout est estimé avec précision. **Précis ne veut pas dire juste** : c'est tout l'enjeu des questions suivantes.
:res
| | Coefficient | Erreur-type HC1 | t |
|---|--:|--:|--:|
| Constante | 21,068 | 0,056 | 375,8 |
| morekids | −5,387 | 0,087 | −61,8 |
:code
```r
reg_2_2 <- lm(work ~ morekids, data = fert)
rob(reg_2_2)

fert %>% group_by(morekids) %>% summarise(work_moyen = mean(work), n = n())
#  morekids  work_moyen       n
#         0        21,1  157742
#         1        15,7   96912
```

La seconde commande vérifie que la pente est bien la différence des deux moyennes : 15,68 − 21,07 = −5,39.
:accord Même coefficient et même lecture (différence de deux moyennes : 15,681 − 21,068 = −5,387).
##b | Est-ce l'effet d'un troisième enfant ?
:enonce
Peut-on y voir l'effet d'un troisième enfant sur le travail de la mère ?
:court
**Non.** On compare des femmes qui ont **choisi** d'avoir un troisième enfant à des femmes qui ne l'ont pas fait. Ces deux groupes diffèrent par bien d'autres choses que le nombre d'enfants, et ces différences jouent aussi sur le travail.
:zero
Pour que −5,39 soit un effet causal, il faudrait que les deux groupes soient identiques en tout, sauf le troisième enfant. Formellement : $E(u \mid morekids) = 0$, c'est-à-dire que tout ce qui influence le travail en dehors du nombre d'enfants soit réparti de la même façon dans les deux groupes.

Rien ne le garantit. Personne n'a tiré au sort qui aurait un troisième enfant.
:accord Même réponse : la taille de la famille résulte d'un choix, et l'exogénéité de `morekids` n'a rien d'évident.
##c | Dans quelle direction ?
:enonce
Si non, dans quelle direction l'estimation risque-t-elle de s'écarter de l'effet réel, et pourquoi ? Appuyez votre raisonnement sur une variable précise contenue dans le terme d'erreur.
:court
Prenons le **niveau d'études** de la mère. Les femmes plus diplômées travaillent davantage (effet positif sur `work`) et ont moins souvent un troisième enfant (lien négatif avec `morekids`). Le biais est (+) × (−) = **négatif** : le coefficient des MCO serait **trop négatif**, il exagérerait la baisse du travail due à un enfant.
:zero
La question impose une méthode : nommer **une** variable du terme d'erreur, puis appliquer la règle du signe.

$$ \text{biais} = (\text{effet de la variable omise sur } work) × (\text{son lien avec } morekids) $$

| Variable omise | Effet sur `work` | Lien avec `morekids` | Biais |
|---|---|---|---|
| Niveau d'études | + (les diplômées travaillent plus) | − (elles ont moins souvent un 3ᵉ enfant) | **négatif** |
| Attachement à la carrière | + | − | **négatif** |
| Revenu du conjoint | − (moins besoin d'un second salaire) | + (un enfant de plus est plus abordable) | **négatif** |

Dans les trois cas, les MCO attribuent au troisième enfant une baisse du travail qui vient en réalité du type de femmes qui ont trois enfants. Le vrai effet serait **moins négatif** que −5,39.

:::astuce La nuance qui te servira aux questions 2.6 et 2.7
D'autres variables omises jouent en sens **inverse**. L'âge, par exemple : les mères plus âgées ont plus souvent trois enfants (lien +) et travaillent davantage, leurs enfants étant plus grands (effet +). Biais positif. Le sens du biais **total** n'est donc pas garanti, et tu verras que le résultat de la question 2.6 surprend.
:::
:gpt
Variable : une **forte préférence pour la carrière**, qui augmente les semaines de travail et diminue la probabilité d'un enfant supplémentaire. La pente est tirée vers le bas, « potentiellement trop négative ». Ajoute que d'autres déterminants peuvent agir en sens opposé : le signe total est une question empirique.
:claude
Variable : le **niveau d'études** de la mère. Même raisonnement de signe, écrit avec Cov(morekids, u) < 0. Cite aussi le revenu du conjoint (même sens) et l'âge (sens inverse).
:verdict
Même direction, même logique. La consigne demande « une variable **précise** » : le niveau d'études est plus concret et mesurable qu'une « préférence pour la carrière », et l'article en parle. Les deux versions ont raison de signaler que d'autres variables jouent en sens inverse : c'est ce qui prépare la surprise de la question 2.6.
:opt claude | Le niveau d'études
Prenons le niveau d'études de la mère, contenu dans le terme d'erreur. Les femmes plus diplômées travaillent davantage (effet positif sur work) et ont moins souvent un troisième enfant (lien négatif avec morekids). Le biais est donc négatif : les MCO exagèrent la baisse du travail due à un troisième enfant. D'autres variables omises, comme l'âge, jouent en sens inverse ; le sens du biais total n'est pas certain.
:opt gpt | La préférence pour la carrière
Supposons qu'une forte préférence pour la carrière augmente les semaines travaillées et diminue la probabilité d'un enfant supplémentaire. Cette variable omise est liée positivement à work et négativement à morekids : la pente est tirée vers le bas, donc potentiellement trop négative. D'autres déterminants peuvent agir en sens opposé.
##d | Le nom du mécanisme
:enonce
D'un point de vue théorique, comment nomme-t-on le mécanisme qui engendre un tel écart par rapport à l'effet réel ? Quelle est sa source ici ?
:court
C'est un **biais d'endogénéité** : le régresseur `morekids` est corrélé au terme d'erreur, ce qui viole l'hypothèse d'exogénéité $E(u \mid X) = 0$. Sa source, ici : un **biais de variable omise** (ou de sélection). La décision d'avoir un troisième enfant est prise en fonction de préférences et de contraintes non observées qui influencent aussi le travail.
:zero
Deux niveaux de réponse, que la question sépare.

- **Le mécanisme général** : l'[[endogène::endogénéité]]. Un régresseur est endogène quand il est corrélé au terme d'erreur ; l'estimateur des MCO est alors biaisé, quelle que soit la taille de l'échantillon.
- **Sa source ici** : des **variables omises**. Les femmes se « sélectionnent » elles-mêmes dans le groupe des familles nombreuses, selon des caractéristiques qu'on n'observe pas.

Une autre source est possible, la **[[causalité inverse]]** : une femme qui ne travaille pas pour d'autres raisons supporte un coût plus faible pour un enfant de plus. Le travail influencerait alors la fécondité, et non l'inverse.

Les trois sources classiques d'endogénéité, à connaître : variable omise, causalité inverse (ou simultanéité), erreur de mesure du régresseur.
:accord Même réponse, avec un ordre des mots différent : Claude nomme d'abord l'endogénéité puis sa source (variable omise, sélection, et un risque de causalité inverse) ; ChatGPT nomme le biais de variable omise, « source d'endogénéité par sélection ». Mets les deux mots dans ta réponse : endogénéité pour le mécanisme, variable omise pour la source.
:quiz
? Une variable omise augmente le travail de la mère et réduit la probabilité d'un troisième enfant. Le coefficient MCO de morekids est alors :
+ trop négatif
- pas assez négatif
- sans biais
> Biais = (+) × (−) = négatif. Les MCO exagèrent la baisse du travail.
? Le coefficient −5,39 a un t de −62. Cela prouve que :
- l'effet causal d'un troisième enfant est de −5,39 semaines
+ l'écart entre les deux groupes n'est pas dû au hasard de l'échantillonnage
- les MCO ne sont pas biaisés
> La précision porte sur l'écart observé entre les deux groupes. Elle ne dit rien de ce qui cause cet écart.
:oral
? Pourquoi les MCO sont-ils biaisés ici ?
> Parce qu'avoir un troisième enfant est un choix, lié à des facteurs non observés qui jouent aussi sur le travail, comme le niveau d'études ou le revenu du conjoint. morekids est corrélé au terme d'erreur : c'est un biais d'endogénéité, dont la source est une variable omise.

#SEC B | L'instrument : le sexe des deux premiers enfants

#Q 2.3 | Un instrument valide ?
:enonce
Construisez `samegender`, qui vaut 1 si les deux premiers enfants sont du même sexe, 0 sinon. On propose de l'utiliser comme instrument de `morekids`.
:intro
Un instrument est une variable qui fait varier le régresseur endogène « de l'extérieur ». Cette question pose les deux conditions qu'il doit remplir. Retiens surtout laquelle se vérifie dans les données et laquelle ne se vérifie pas.

{{w:dag}}
:concepts instruments, causalite
##a | Les conditions de validité
:enonce
Quelles conditions une variable doit-elle remplir pour être un instrument valide de `morekids` ? Énoncez-les formellement et en mots.
:court
| Condition | Formellement | En mots |
|---|---|---|
| **Pertinence** | $Cov(Z, morekids) ≠ 0$ | Le sexe des deux premiers enfants doit réellement modifier la probabilité d'un troisième enfant. |
| **Exogénéité** | $Cov(Z, u) = 0$ | Il ne doit être lié à rien de ce qui, dans le terme d'erreur, détermine le travail de la mère. |
:zero
Le modèle est $work = β₀ + β₁ morekids + u$ et l'instrument $Z$ = `samegender`.

**La pertinence** est la condition « facile » : elle porte sur deux variables observées, donc elle **se teste** (question 2.4).

**L'exogénéité** est la condition « difficile » : elle porte sur $u$, qu'on n'observe pas. Elle **ne se teste pas directement**. Elle regroupe deux idées, qu'il faut savoir séparer à l'oral.

- **L'indépendance** : $Z$ est « comme tiré au sort », sans lien avec les caractéristiques des mères. C'est plausible : le sexe d'un enfant est dû au hasard.
- **La [[restriction d'exclusion]]** : $Z$ n'agit sur le travail de la mère **que par le troisième enfant**, sans effet direct. C'est le point fragile.

Change de schéma dans l'outil en haut de la page pour voir ce que chaque violation ajouterait.

Une troisième hypothèse, la **monotonie**, servira à la question 2.14 : personne ne fait l'inverse (avoir un troisième enfant avec une fratrie mixte, mais pas avec deux enfants de même sexe).
:gpt
Trois conditions, écrites conditionnellement aux contrôles X : pertinence, **indépendance** et **exclusion**, les deux dernières justifiant ensemble E[u | Z, X] = E[u | X]. Ajoute, « pour une lecture locale avec effets hétérogènes », la monotonie et l'absence d'interférence.
:claude
Deux conditions, celles du cours : pertinence et **exogénéité**, puis explique que l'exogénéité recouvre l'indépendance et l'exclusion. Mentionne la monotonie pour plus tard.
:verdict
C'est la même théorie, découpée différemment. La version à deux conditions correspond à la présentation habituelle d'un cours d'économétrie (pertinence, exogénéité) et suffit pour la question. Celle de ChatGPT est plus complète, mais elle anticipe la question 2.14 et introduit « l'absence d'interférence », que tu devrais pouvoir expliquer à l'oral. Conseil : deux conditions formelles, et la décomposition de l'exogénéité en une phrase.
:opt claude | Pertinence et exogénéité
Un instrument Z doit remplir deux conditions. Pertinence, Cov(Z, morekids) ≠ 0 : le sexe des deux premiers enfants doit modifier la probabilité d'un troisième enfant. Exogénéité, Cov(Z, u) = 0 : il ne doit être lié à aucun déterminant non observé du travail de la mère. Cette seconde condition suppose que Z soit comme tiré au sort (indépendance) et qu'il n'agisse sur le travail que par le troisième enfant (exclusion).
:opt gpt | Pertinence, indépendance, exclusion
Trois conditions : la pertinence (Z modifie morekids), l'indépendance (Z est sans lien avec les déterminants du travail et de la fécondité) et l'exclusion (Z n'agit sur le travail que par morekids). Pour une interprétation locale, on ajoute la monotonie.
##b | Un mécanisme qui violerait l'exclusion
:enonce
Donnez un exemple concret de mécanisme par lequel le sexe des deux premiers enfants pourrait modifier le nombre de semaines travaillées par la mère sans passer par la naissance d'un troisième enfant. Quelle condition serait alors violée ?
:court
Deux enfants de même sexe peuvent partager une chambre, des vêtements et des jouets : les élever **coûte moins cher**, le ménage a moins besoin d'un second revenu, et la mère peut travailler moins, **même sans troisième enfant**. L'instrument aurait alors un effet direct sur le travail : c'est la **restriction d'exclusion** (donc l'exogénéité) qui serait violée.
:zero
On cherche une flèche qui va **directement** de $Z$ à $Y$, sans passer par $X$. Deux exemples classiques.

- **Les économies d'échelle** : chambre, vêtements et jouets partagés entre enfants de même sexe. Le budget du ménage est moins serré.
- **Le partage des tâches** : un père peut s'investir davantage auprès de ses fils. Dans une famille de deux garçons, la mère aurait alors plus de temps pour travailler. C'est l'exemple que cite l'article.

Dans les deux cas, cet effet direct de $Z$ se retrouve dans $u$ : $Cov(Z, u) ≠ 0$. Choisis l'outil « Exclusion violée » dans le schéma pour le voir.

:::cle Ce qu'il faut bien distinguer
L'instrument peut être parfaitement aléatoire (indépendance respectée) **et** violer l'exclusion. Le hasard garantit que les mères se ressemblent au départ ; il ne garantit pas que le sexe des enfants n'a pas d'autre conséquence.
:::
:gpt
Exemple : deux garçons conduisent le père à s'occuper davantage des enfants, donc la mère peut travailler davantage à nombre d'enfants fixé. Effet direct de Z, exclusion violée « même si la composition des sexes est aléatoire ».
:claude
Exemple principal : chambre, vêtements et jouets partagés rendent les enfants moins coûteux, d'où un moindre besoin d'un second revenu. Cite aussi l'exemple du père, repris de l'article.
:verdict
Deux bons exemples, et la même condition violée. Celui de ChatGPT (le père) est celui du contexte de l'énoncé : sûr, mais attendu. Celui de Claude (les économies de coût) est un mécanisme *économique*, que tu pourras réutiliser tel quel à la question 2.9. Un seul exemple est demandé.
:opt claude | Les économies de coût
Deux enfants de même sexe peuvent partager chambre, vêtements et jouets : ils coûtent moins cher, le ménage a moins besoin d'un second revenu et la mère peut travailler moins, même sans troisième enfant. L'instrument agit alors directement sur le travail : la restriction d'exclusion, donc l'exogénéité, est violée.
:opt gpt | L'implication du père
Si un père s'occupe davantage de ses enfants quand ce sont des garçons, la mère de deux garçons peut travailler davantage à nombre d'enfants donné. Le sexe des enfants a alors un effet direct sur le travail, ce qui viole l'exclusion, même si le sexe est aléatoire.
##c | Les mères se ressemblent-elles selon samegender ?
:enonce
Comparez l'âge et l'origine des mères selon la valeur de `samegender`. Que vous apprend cette comparaison, et que ne peut-elle pas vous apprendre ?
:court
Les deux groupes sont **quasi identiques** : 30,40 et 30,38 ans, mêmes proportions d'origines, et aucune différence n'est significative malgré 254 654 observations. C'est ce qu'on attend si le sexe des enfants est dû au hasard : cela soutient l'**indépendance**. Mais la comparaison ne dit **rien** des caractéristiques non observées, ni surtout de la **restriction d'exclusion**.
:zero
Si l'instrument est « comme tiré au sort », les deux groupes qu'il forme doivent se ressembler sur tout ce qui a été fixé avant. C'est le même principe que la vérification d'un tirage au sort dans un essai clinique.

| Caractéristique | Sexes différents | Même sexe | Différence | Erreur-type | p-valeur |
|---|--:|--:|--:|--:|--:|
| Âge (années) | 30,404 | 30,383 | −0,021 | 0,013 | 0,11 |
| Afro-américaine | 5,23 % | 5,11 % | −0,12 pt | 0,09 pt | 0,16 |
| Hispanique | 7,43 % | 7,42 % | −0,01 pt | 0,10 pt | 0,92 |
| Autre origine | 5,66 % | 5,60 % | −0,06 pt | 0,09 pt | 0,51 |

L'écart d'âge est de 0,021 an : **une semaine**. Avec un échantillon aussi grand, la moindre différence réelle serait détectée ; aucune ne l'est.

**Ce que la comparaison ne peut pas apprendre.**

- L'équilibre sur les caractéristiques **non observées** (préférences, ambition). On ne teste que ce qu'on observe, même si le hasard rend cet équilibre probable.
- **Rien sur l'exclusion.** Un effet direct du sexe des enfants sur le travail (question b) ne créerait aucune différence d'âge ou d'origine entre les mères. Les deux groupes peuvent être parfaitement comparables au départ et l'instrument quand même invalide.
:code
```r
rob(lm(age ~ samegender, data = fert))     # idem pour afam, hispanic, other
```

Régresser une caractéristique sur `samegender` compare sa moyenne entre les deux groupes : la constante est la moyenne du groupe « sexes différents », la pente est l'écart, avec son erreur-type robuste et sa p-valeur.
:accord Même tableau et même double conclusion (équilibre compatible avec le hasard ; aucune information sur les inobservables ni sur l'exclusion). ChatGPT rappelle que l'article trouve le même équilibre pour l'âge à la première naissance et les études, variables absentes du fichier.
:quiz
? Laquelle des conditions de validité d'un instrument peut-on vérifier directement dans les données ?
+ la pertinence
- l'exogénéité
- la restriction d'exclusion
> La pertinence relie deux variables observées. L'exogénéité et l'exclusion portent sur le terme d'erreur, qu'on n'observe pas.
? Les mères des deux groupes ont le même âge et la même origine. Cela montre que :
- l'instrument respecte la restriction d'exclusion
+ l'hypothèse d'un sexe dû au hasard est crédible
- l'instrument est fort
> L'équilibre soutient l'indépendance. Il ne dit rien d'un éventuel effet direct du sexe des enfants sur le travail.
:oral
? Quelles sont les conditions d'un bon instrument, et laquelle peux-tu tester ?
> La pertinence : l'instrument fait varier le nombre d'enfants, ce qui se teste avec la première étape. L'exogénéité : il n'est lié à rien d'autre qui influence le travail et n'agit que par le troisième enfant. Elle ne se teste pas directement, elle se défend par des arguments.

#Q 2.4 | La première étape
:enonce
Estimez la régression de `morekids` sur `samegender`.
:intro
La [[première étape]] vérifie la condition de pertinence : l'instrument fait-il vraiment varier le nombre d'enfants ?
:concepts instruments, incertitude
##a | Le lien entre samegender et le troisième enfant
:enonce
Que dit-elle du lien entre `samegender` et la décision d'avoir un troisième enfant ? Interprétez le coefficient.
:court
**+0,0675** (erreur-type 0,0019). Les mères dont les deux premiers enfants sont de même sexe ont une probabilité d'avoir un troisième enfant supérieure de **6,75 points de pourcentage** : 41,4 % contre 34,6 %. Ce sont exactement les chiffres de l'article.
:zero
`morekids` vaut 0 ou 1. Une régression linéaire sur une telle variable s'appelle un [[modèle de probabilité linéaire]] : ses coefficients se lisent en **points de probabilité**.

- Constante : 0,3464. Parmi les mères dont les deux premiers enfants sont de sexes différents, 34,6 % ont un troisième enfant.
- Pente : 0,0675. Avec deux enfants de même sexe, la part monte à 34,6 + 6,75 = 41,4 %.

:::piege Points de pourcentage ou pourcents ?
+6,75 **points** (de 34,6 % à 41,4 %), et non +6,75 **%**. En pourcentage relatif, la hausse est de 6,75 / 34,6 ≈ 19 %.
:::
:res
| | Coefficient | Erreur-type HC1 | t |
|---|--:|--:|--:|
| Constante | 0,3464 | 0,0013 | 258,3 |
| samegender | 0,0675 | 0,0019 | 35,2 |
:code
```r
reg_2_4 <- lm(morekids ~ samegender, data = fert)
rob(reg_2_4)
```
:accord Même coefficient et même lecture (34,64 % et 41,40 %, écart de 6,75 points).
##b | Le lien est-il suffisant ?
:enonce
Quel indicateur permet de juger si ce lien est suffisant ? Que conclut-il ?
:court
La **statistique F de la première étape**, qui teste que le coefficient de l'instrument est nul. Avec un seul instrument, F = t² = 35,2² = **1 238**. La règle usuelle demande F > 10 : l'instrument est **très fort**.
:zero
Un instrument qui ne déplace presque pas `morekids` est un [[instrument faible]] : l'estimation par variables instrumentales devient alors très imprécise et peut même être biaisée. On mesure la force de l'instrument avec la statistique F du test « les coefficients des instruments sont tous nuls » dans la première étape.

Le repère habituel (Staiger et Stock) : **F supérieur à 10**. Ici 1 238 : aucun souci.

Remarque intéressante : l'instrument est très fort *statistiquement*, alors qu'il n'explique presque rien de `morekids` (R² de la première étape : 0,48 %). Ce n'est pas contradictoire. Avec 254 654 observations, un écart de 6,75 points est mesuré avec une précision extrême. La question 2.6 (d) montrera ce que ce petit R² coûte.
:code
```r
rob(reg_2_4)["samegender", "t value"]^2      # F robuste = t² = 1 238
summary(reg_2_4)$r.squared                    # 0,0048
```
:accord Même indicateur et même valeur (F = 1 238,2). ChatGPT rappelle que le seuil de 10 n'est qu'un repère usuel.
##c | Ce que cette étape vérifie
:enonce
Parmi les conditions de la question 2.3, laquelle cette étape permet-elle de vérifier ? Laquelle ne permet-elle pas de vérifier ?
:court
Elle vérifie la **pertinence**. Elle ne peut pas vérifier l'**exogénéité** (indépendance et exclusion), qui porte sur le lien entre l'instrument et le terme d'erreur, non observé.
:zero
La première étape relie $Z$ à $X$ : deux variables qu'on a sous les yeux. L'exogénéité relie $Z$ à $u$ : on ne peut pas régresser quoi que ce soit sur une variable invisible. Elle se défend par le raisonnement (le sexe est dû au hasard) et par des indices indirects (l'équilibre de la question 2.3 c).

Une première étape très forte ne dit donc **rien** de la validité de l'instrument. Un instrument peut être très fort et parfaitement invalide.
:accord Même réponse.
:quiz
? La statistique F de la première étape vaut 1 238. On peut en conclure que :
- l'instrument est valide
+ l'instrument n'est pas faible
- l'instrument explique l'essentiel des naissances de troisièmes enfants
> F mesure la force de l'instrument (pertinence), pas sa validité. Et son R² n'est que de 0,5 %.
:oral
? Une première étape très forte valide-t-elle l'instrument ?
> Non. Elle établit seulement la pertinence. L'exogénéité ne se teste pas ainsi : si le sexe des enfants agit directement sur le travail de la mère, l'instrument est invalide même avec un F de 1 238.

#Q 2.5 | Les quatre compositions de la fratrie
:enonce
Construisez `boy1st` (binaire égale à 1 si le premier enfant est un garçon), `twoboys` (= 1 si les deux premiers enfants sont des garçons) et `twogirls` (= 1 si ce sont deux filles).
:intro
`samegender` mettait dans le même panier « deux garçons » et « deux filles ». On les sépare, ce qui donnera deux instruments au lieu d'un à partir de la question 2.8.
:concepts indicatrices, incertitude
##a | Les quatre proportions et leurs intervalles
:enonce
Calculez la proportion de mères ayant plus de deux enfants pour chacune des quatre compositions possibles des deux premiers enfants (garçon-garçon, garçon-fille, fille-garçon, fille-fille) et représentez ces proportions avec un intervalle de confiance à 95 %.
:court
| Composition | Mères | Plus de deux enfants | IC à 95 % |
|---|--:|--:|--:|
| Garçon-garçon | 67 799 | **40,4 %** | [40,1 ; 40,8] |
| Garçon-fille | 63 185 | **34,6 %** | [34,3 ; 35,0] |
| Fille-garçon | 62 724 | **34,7 %** | [34,3 ; 35,0] |
| Fille-fille | 60 946 | **42,5 %** | [42,1 ; 42,9] |
:zero
{{w:compo}}

**L'intervalle de confiance d'une proportion.** Pour une proportion $p$ estimée sur $n$ mères :

$$ p ± 1,96 × \sqrt{\frac{p (1 − p)}{n}} $$

Exemple pour garçon-garçon : 0,4042 ± 1,96 × √(0,4042 × 0,5958 / 67 799) = 0,4042 ± 0,0037.

Les intervalles sont minuscules (moins d'un demi-point de chaque côté) : chaque groupe compte plus de 60 000 mères.
:code
```r
tab_2_5a <- fert %>%
  mutate(composition = case_when(twoboys == 1 ~ "garçon-garçon",
                                 boy1st == 1 & twoboys == 0 ~ "garçon-fille",
                                 boy1st == 0 & twogirls == 0 ~ "fille-garçon",
                                 twogirls == 1 ~ "fille-fille")) %>%
  group_by(composition) %>%
  summarise(n = n(), p = mean(morekids), .groups = "drop") %>%
  mutate(se = sqrt(p * (1 - p) / n),
         ic_bas = p - 1.96 * se, ic_haut = p + 1.96 * se)

ggplot(tab_2_5a, aes(x = composition, y = 100 * p)) +
  geom_pointrange(aes(ymin = 100 * ic_bas, ymax = 100 * ic_haut))
```

`case_when()` est un « si… sinon si… » : il donne à chaque mère l'étiquette de la première condition vraie.
:gpt
Mêmes proportions. Calcule les intervalles avec la formule de **Wilson**, plus exacte pour les proportions proches de 0 ou de 1 : [40,05 ; 40,79] pour garçon-garçon.
:claude
Mêmes proportions. Calcule les intervalles avec la formule **usuelle** p ± 1,96 √(p(1 − p)/n) : [40,1 ; 40,8].
:verdict
Les deux méthodes donnent les mêmes intervalles à la deuxième décimale près : avec plus de 60 000 mères par groupe et des proportions proches de 40 %, la formule usuelle est tout à fait suffisante. Elle est aussi celle que tu peux écrire et expliquer en une ligne. Wilson n'apporte rien ici et t'obligerait à justifier une formule plus compliquée.
:opt claude | Formule usuelle
Je calcule chaque intervalle avec p ± 1,96 × √(p(1 − p)/n). Les quatre intervalles ont une demi-largeur inférieure à 0,4 point : chaque groupe compte plus de 60 000 mères.
:opt gpt | Intervalle de Wilson
Je calcule des intervalles binomiaux de Wilson à 95 %. Ils coïncident ici avec la formule usuelle, la taille des groupes étant très grande.
##b | La régression et le test
:enonce
Estimez la régression de `morekids` sur `twoboys`, `twogirls` et `boy1st`. Testez l'égalité des coefficients de `twoboys` et de `twogirls`. Le sexe du premier enfant a-t-il un effet propre sur la probabilité d'avoir un troisième enfant ?
:court
Deux garçons : **+5,8 points** ; deux filles : **+7,8 points**. On **rejette** l'égalité des deux coefficients (F = 28,0 ; p = 1,2 × 10⁻⁷) : l'effet est plus fort après deux filles. Le sexe du premier enfant, à lui seul, n'a **aucun effet** : −0,02 point, p = 0,93.
:zero
Quatre groupes, une constante et trois indicatrices : le modèle est **saturé**, il reproduit exactement les quatre proportions de la question (a). Chaque coefficient est une différence entre deux groupes. Pour le voir, écris ce que valent les trois indicatrices pour chaque composition.

| Composition | twoboys | twogirls | boy1st | Probabilité prédite |
|---|:-:|:-:|:-:|---|
| Fille-garçon | 0 | 0 | 0 | constante |
| Garçon-fille | 0 | 0 | 1 | constante + boy1st |
| Garçon-garçon | 1 | 0 | 1 | constante + boy1st + twoboys |
| Fille-fille | 0 | 1 | 0 | constante + twogirls |

| Coefficient | Ce qu'il compare | Valeur | Erreur-type HC1 |
|---|---|--:|--:|
| Constante | P(fille-garçon) | 0,3465 | 0,0019 |
| boy1st | P(garçon-fille) − P(fille-garçon) | −0,0002 | 0,0027 |
| twoboys | P(garçon-garçon) − P(garçon-fille) | 0,0579 | 0,0027 |
| twogirls | P(fille-fille) − P(fille-garçon) | 0,0782 | 0,0028 |

**Le test d'égalité.** H₀ : coefficient de `twoboys` = coefficient de `twogirls`. L'écart vaut −0,0203 (erreur-type 0,0038), soit t = −5,29 et F = t² = 28,0. p = 1,2 × 10⁻⁷ : on rejette.

**Le sexe du premier enfant.** Le coefficient de `boy1st` compare les deux compositions **mixtes**, qui ne diffèrent que par l'ordre. Il est nul. Ce qui compte, c'est la composition de la paire, pas le sexe de l'aîné.
:code
```r
reg_2_5 <- lm(morekids ~ twoboys + twogirls + boy1st, data = fert)
rob(reg_2_5)
linearHypothesis(reg_2_5, "twoboys = twogirls", vcov. = vcovHC(reg_2_5, type = "HC1"))
```

`linearHypothesis()` accepte une restriction écrite en toutes lettres, avec les noms des coefficients.
:accord Mêmes coefficients et même test (écart de −2,03 points ; t = −5,29, soit F = 28,0 ; p = 1,2 × 10⁻⁷). Les deux versions concluent que `boy1st` n'a pas d'effet propre (p = 0,93).
##c | Ce que la question 2.4 ne montrait pas
:enonce
Que montrent ce graphique et cette régression que la régression de la question 2.4 ne montre pas ?
:court
Trois choses. L'effet existe **pour les deux** compositions de même sexe, ce qui soutient l'explication par la préférence pour la mixité. Il est **asymétrique** : plus fort après deux filles (+7,8 points) qu'après deux garçons (+5,8), ce qui suggère en plus une préférence pour les garçons. Et le sexe du premier enfant, **à lui seul**, ne change rien.
:zero
`samegender` donnait un seul chiffre moyen (+6,75 points). En le décomposant, on apprend que cette moyenne cache deux effets de tailles différentes, et que les deux ordres mixtes sont équivalents.

Cela a deux conséquences pratiques : on dispose de **deux instruments** (`twoboys` et `twogirls`) au lieu d'un, et il faudra contrôler `boy1st` quand on les utilisera (question 2.8 c).
:accord Même réponse : l'agrégat `samegender` cachait l'asymétrie de la réponse et la quasi-égalité des deux ordres mixtes.
:quiz
? Dans la régression de morekids sur twoboys, twogirls et boy1st, que représente la constante ?
- la proportion moyenne de mères ayant un troisième enfant
+ la proportion de mères ayant un troisième enfant quand le premier enfant est une fille et le second un garçon
- la proportion dans les familles mixtes
> La constante est la prédiction quand les trois indicatrices valent 0 : pas deux garçons, pas deux filles, aîné non garçon, donc fille-garçon.
:oral
? Pourquoi dis-tu que le sexe du premier enfant n'a pas d'effet propre ?
> Parce que le coefficient de boy1st compare garçon-fille à fille-garçon, deux fratries mixtes qui ne diffèrent que par l'ordre. Il vaut −0,02 point avec une p-valeur de 0,93. C'est la composition de la paire qui compte.

#Q 2.6 | Forme réduite et variables instrumentales
:intro
Tout est prêt pour l'estimation par variables instrumentales. Elle se résume à **une division**, que l'outil ci-dessous te fait refaire.

{{w:wald}}
:concepts instruments
##a | La forme réduite
:enonce
Estimez la régression de `work` sur `samegender` (forme réduite) et interprétez le coefficient.
:court
**−0,426** (erreur-type 0,087). Les mères dont les deux premiers enfants sont de même sexe ont travaillé **0,43 semaine de moins** en 1979 (18,81 contre 19,23). Comme le sexe des enfants est dû au hasard, c'est l'effet causal d'avoir deux enfants de même sexe sur le travail.
:zero
La [[forme réduite]] saute l'intermédiaire : elle relie directement l'instrument $Z$ au résultat $Y$.

0,43 semaine, c'est trois jours par an : très peu. C'est normal. Avoir deux enfants de même sexe ne change la décision d'avoir un troisième enfant que pour une petite partie des familles (6,75 %). L'effet sur **l'ensemble** des mères est donc dilué.

Si la restriction d'exclusion est vraie, toute cette différence de travail passe par le troisième enfant. C'est ce qui permet le calcul de la question (c).
:res
| | Coefficient | Erreur-type HC1 | t |
|---|--:|--:|--:|
| Constante | 19,234 | 0,062 | 311,4 |
| samegender | −0,426 | 0,087 | −4,9 |
:code
```r
reg_2_6a <- lm(work ~ samegender, data = fert)
rob(reg_2_6a)
```
:accord Même coefficient (−0,4263, soit 18,8075 − 19,2339).
##b | L'estimation par variables instrumentales
:enonce
Estimez le modèle de la question 2.2 par variables instrumentales, avec `samegender` comme instrument de `morekids`. Interprétez le coefficient de `morekids` et confrontez-le à l'estimation MCO de la question 2.2. La différence va-t-elle dans le sens que vous aviez prévu ?
:court
**−6,31** (erreur-type 1,275 ; IC à 95 % : [−8,81 ; −3,82]). Un troisième enfant réduit le travail de la mère d'environ 6,3 semaines par an. **Non, ce n'est pas le sens prévu** : on attendait des MCO plus négatifs que la VI, c'est l'inverse (−5,39 contre −6,31). Mais l'écart (0,93) est petit par rapport à l'erreur-type de la VI (1,27) : il n'est pas significatif.
:zero
**Interprétation.** Pour les mères dont le troisième enfant est dû à la composition de la fratrie, cet enfant réduit le travail de 6,3 semaines par an.

**La confrontation avec les MCO.** À la question 2.2 (c), on prévoyait que les MCO **exagéraient** l'effet. La VI, censée corriger ce biais, devrait donc être moins négative. Elle est plus négative. Sois honnête dans ton rapport : la prédiction ne se vérifie pas ici. Deux explications.

| | MCO (2.2) | VI (2.6) |
|---|--:|--:|
| morekids | −5,387 (0,087) | −6,314 (1,275) |
| IC à 95 % | [−5,56 ; −5,22] | [−8,81 ; −3,82] |

1. **L'écart n'est pas significatif.** L'intervalle de la VI contient largement −5,39. On ne peut pas affirmer que les deux estimations diffèrent.
2. **Les MCO sans contrôle subissent des biais de sens opposés.** L'âge et l'origine les tirent vers zéro (voir l'astuce de la question 2.2 c). Une fois ces contrôles ajoutés, à la question 2.7, les MCO deviennent **plus** négatifs que la VI, comme prévu et comme dans l'article.
:code
```r
reg_2_6b <- ivreg(work ~ morekids | samegender, data = fert)
rob(reg_2_6b)
```

`ivreg()` vient du package `AER`. La formule se lit en deux parties, séparées par une barre verticale : à gauche l'équation qu'on veut estimer, à droite la liste des instruments.
:accord Même estimation (−6,314 ; erreur-type 1,275) et même constat : la VI sans contrôle est *plus* négative que les MCO simples, à l'inverse de la prédiction. Claude donne les deux nuances ci-dessus ; ChatGPT note plus brièvement que l'omission d'autres variables et les effets locaux peuvent jouer.
##c | Le rapport de deux coefficients
:enonce
Montrez que l'estimation obtenue en (b) est égale au rapport de deux coefficients que vous avez déjà estimés. Expliquez pourquoi.
:court
$$ \hat{β}_{VI} = \frac{\text{forme réduite}}{\text{première étape}} = \frac{−0,4263}{0,06753} = −6,314 $$

C'est l'[[estimateur de Wald]] : l'effet de l'instrument sur le travail, divisé par son effet sur le nombre d'enfants.
:zero
**L'intuition.** Les mères « même sexe » travaillent 0,43 semaine de moins et ont 0,0675 troisième enfant de plus par mère. Si toute la différence de travail vient de ces enfants supplémentaires, chacun « coûte » 0,43 / 0,0675 = 6,3 semaines.

**La démonstration.** Avec un seul instrument et sans contrôle, l'estimateur par variables instrumentales s'écrit :

$$ \hat{β}_{VI} = \frac{Cov(Z, Y)}{Cov(Z, X)} $$

Divise le haut et le bas par $Var(Z)$ :

$$ \hat{β}_{VI} = \frac{Cov(Z, Y) / Var(Z)}{Cov(Z, X) / Var(Z)} = \frac{\text{pente de Y sur Z}}{\text{pente de X sur Z}} $$

Le numérateur est la pente de la forme réduite (question a), le dénominateur celle de la première étape (question 2.4).
:code
```r
coef(reg_2_6a)["samegender"] / coef(reg_2_4)["samegender"]    # -6,314
coef(reg_2_6b)["morekids"]                                    # -6,314
```
:accord Même rapport (−0,426333 / 0,067525 = −6,314) et même explication. Le guide de ChatGPT propose une image utile : sur 100 mères de chaque groupe, la composition identique est associée à 6,75 familles de plus au-dessus de deux enfants ; Wald rapporte la baisse totale de travail à ce changement.
##d | Pourquoi une erreur-type quinze fois plus grande ?
:enonce
Pourquoi l'erreur-type de l'estimation par variables instrumentales est-elle beaucoup plus grande que celle des MCO ?
:court
Parce que la VI n'utilise que la part des variations de `morekids` **provoquée par l'instrument**, et que cette part est minuscule : 0,48 % de sa variance. L'erreur-type est multipliée par environ $1 / \sqrt{0,0048}$ ≈ 14 ; on observe 1,275 / 0,087 = **14,6**.
:zero
Les MCO utilisent **toutes** les différences de nombre d'enfants entre mères, bonnes et mauvaises. La VI n'en garde qu'une petite fraction, celle qui vient du sexe des deux premiers enfants : la seule dont on est sûr qu'elle n'est pas un choix. Moins d'information utilisée, moins de précision.

Une approximation à connaître :

$$ Var(\hat{β}_{VI}) ≈ \frac{Var(\hat{β}_{MCO})}{ρ²_{XZ}} $$

où $ρ²_{XZ}$ est le carré de la corrélation entre `morekids` et `samegender`, c'est-à-dire le R² de la première étape (0,0048).

**Autre façon de le voir**, avec la division de Wald : on divise par 0,0675, un nombre petit. Toute imprécision sur le numérateur (la forme réduite) est multipliée par 1 / 0,0675 ≈ 15.

:::cle Le compromis à retenir
On échange du **biais** contre de l'**imprécision**. Les MCO donnent une réponse très précise à une mauvaise question ; la VI donne une réponse imprécise à la bonne.
:::
:accord Même explication (la VI n'utilise que la variation de `morekids` prévisible par l'instrument). Claude la chiffre avec le R² de première étape (facteur 14, contre 14,6 observé).
:quiz
? Si la première étape valait 0,02 au lieu de 0,0675, avec la même forme réduite, l'estimation VI serait :
- plus proche de zéro
+ plus de trois fois plus grande en valeur absolue
- inchangée
> −0,426 / 0,02 = −21,3. Plus la première étape est faible, plus on divise par un petit nombre.
? L'intervalle de confiance de la VI ([−8,81 ; −3,82]) contient l'estimation MCO (−5,39). On en déduit que :
- les MCO sont sans biais
+ on ne peut pas affirmer que les deux estimations diffèrent
- la VI est biaisée
> L'écart est petit par rapport à l'imprécision de la VI. Cela ne prouve pas que les MCO soient justes.
:oral
? Comment obtiens-tu −6,31 semaines ?
> Je compare les mères selon le sexe de leurs deux premiers enfants. Celles dont les enfants sont de même sexe travaillent 0,43 semaine de moins et ont 6,75 points de plus de chances d'avoir un troisième enfant. Le rapport, −0,426 / 0,0675, donne −6,3 semaines par enfant supplémentaire, à condition que le sexe des enfants n'agisse sur le travail que par le troisième enfant.
? Pourquoi l'erreur-type de la VI est-elle si grande ?
> Parce qu'elle n'utilise que la variation du nombre d'enfants due au sexe des deux premiers, soit 0,5 % de sa variance. On gagne en crédibilité ce qu'on perd en précision.
:retenir
- Première étape : +6,75 points de probabilité d'un 3ᵉ enfant (F = 1 238).
- Forme réduite : −0,43 semaine.
- VI = forme réduite / première étape = −6,31 semaines.
- Erreur-type 15 fois plus grande que celle des MCO : le prix de la crédibilité.
