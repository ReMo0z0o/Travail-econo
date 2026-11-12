#SEC C | Contrôles et doubles moindres carrés

#Q 2.7 | Variables de contrôle : MCO contre VI
:intro
On ajoute l'âge et l'origine de la mère aux deux estimations. La question porte moins sur les chiffres que sur une observation : les contrôles déplacent beaucoup les MCO et presque pas la VI. Comprendre pourquoi, c'est comprendre ce qu'est un instrument.
:concepts instruments, hypotheses
##a | Contrôle ou instrument ?
:enonce
Qu'est-ce qu'une variable de contrôle ? En quoi son rôle diffère-t-il de celui d'un instrument ?
:court
Une **variable de contrôle** est une variable qu'on ajoute à l'équation du résultat pour tenir constant un facteur qui influence le travail **et** qui est lié au nombre d'enfants. Un **instrument** n'a, lui, **aucun effet direct** sur le résultat : il est exclu de l'équation du travail et ne sert qu'à faire varier `morekids`.
:zero
| | Contrôle | Instrument |
|---|---|---|
| Figure dans l'équation de `work` ? | **Oui** : il a son propre effet sur le travail | **Non** : c'est la restriction d'exclusion |
| Figure dans la première étape ? | Oui | Oui |
| Son rôle | Neutraliser un facteur de confusion | Isoler une variation « propre » de `morekids` |
| Dans `ivreg(y ~ x + w \| z + w)` | des deux côtés de la barre | seulement à droite de la barre |

Un moyen simple de s'en souvenir : le contrôle répond à « **comparons des mères semblables** » ; l'instrument répond à « **trouvons un tirage au sort caché** ».
:accord Même distinction : le contrôle entre dans l'équation du travail et neutralise une différence observée ; l'instrument exclu fournit la variation de `morekids` et ne doit pas avoir d'effet propre.
##b | Ce que contrôle chaque variable
:enonce
Ajoutez `age`, `afam`, `hispanic` et `other` comme variables de contrôle, d'abord dans la régression MCO de la question 2.2, puis dans l'estimation par variables instrumentales de la question 2.6 (`samegender` reste le seul instrument). Pour chacune de ces variables, expliquez ce qu'elle contrôle : quelle différence entre mères neutralise-t-elle, et pourquoi cette différence pourrait-elle fausser la comparaison entre mères de deux enfants et mères de plus de deux enfants ?
:court
Avec les contrôles : MCO **−6,23** (0,086) ; VI **−5,82** (1,246). Chaque contrôle neutralise une différence liée à la fois au nombre d'enfants et au travail. L'**âge** : une mère plus âgée a eu plus de temps pour avoir un troisième enfant *et* travaille davantage. L'**origine** : en 1980, les mères afro-américaines et hispaniques ont plus souvent trois enfants, et les premières travaillent beaucoup plus.
:zero
Pour dire ce que neutralise un contrôle, il faut deux informations : **son lien avec `morekids`** et **son effet sur `work`**. Les deux se lisent dans les régressions.

| Contrôle | Effet sur la probabilité d'un 3ᵉ enfant | Effet sur les semaines travaillées | Ce qu'il neutralise |
|---|--:|--:|---|
| `age` | +1,5 point par année | +0,84 semaine par année | Une mère plus âgée a eu plus de temps pour avoir un 3ᵉ enfant, et ses enfants plus grands lui laissent plus de temps pour travailler. |
| `afam` | +10,0 points | +11,7 semaines | En 1980, les mères afro-américaines ont plus d'enfants et travaillent nettement plus. |
| `hispanic` | +15,1 points | +0,5 semaine | Les mères hispaniques ont bien plus souvent trois enfants, sans travailler beaucoup plus. |
| `other` | +2,7 points | +2,1 semaines | Même logique, plus faible. |

Applique la règle du signe à l'âge : effet positif sur le travail, lien positif avec `morekids` : biais **positif**. Sans ces contrôles, le groupe « plus de deux enfants » contient davantage de mères âgées et afro-américaines, qui travaillent plus pour d'autres raisons. La comparaison brute attribuait donc au troisième enfant une baisse **trop faible** : les MCO étaient tirés vers zéro. C'est l'inverse du biais envisagé à la question 2.2 (c), et c'est ce qui expliquait la surprise de la question 2.6.

:::piege Ce que ces coefficients ne disent pas
Les coefficients des indicatrices d'origine décrivent des écarts moyens entre groupes aux États-Unis en 1980, à âge et nombre d'enfants donnés. Ils ne disent rien de leurs causes.
:::
:res
| Effet de `morekids` | Sans contrôle | Avec contrôles |
|---|--:|--:|
| MCO | −5,387 (0,087) | −6,230 (0,086) |
| VI (`samegender`) | −6,314 (1,275) | −5,821 (1,246) |
:code
```r
reg_2_7_mco <- lm(work ~ morekids + age + afam + hispanic + other, data = fert)
reg_2_7_vi  <- ivreg(work ~ morekids + age + afam + hispanic + other |
                       samegender + age + afam + hispanic + other, data = fert)
rob(reg_2_7_mco); rob(reg_2_7_vi)

rob(lm(morekids ~ age + afam + hispanic + other, data = fert))     # lien des contrôles avec morekids
```

Dans `ivreg()`, les contrôles sont écrits **des deux côtés** de la barre : ils sont exogènes, ils servent donc à la fois de régresseurs et d'instruments pour eux-mêmes. Seul `morekids` est absent à droite, remplacé par `samegender`.
:gpt
Décrit chaque contrôle en termes généraux : l'âge capte le temps écoulé pour avoir un autre enfant, l'expérience et le stade de carrière ; les indicatrices d'origine, des différences moyennes de contexte socio-économique ou d'accès à l'emploi. Rappelle que ces coefficients n'ont pas d'interprétation biologique.
:claude
Donne pour chaque contrôle **deux chiffres** tirés des régressions : son lien avec la probabilité d'un troisième enfant et son effet sur les semaines travaillées. En déduit le sens du biais retiré (vers zéro).
:verdict
Mêmes estimations (−6,230 et −5,821). La question demande « quelle différence neutralise-t-elle, et pourquoi pourrait-elle fausser la comparaison » : la réponse la plus convaincante montre, chiffres à l'appui, que chaque contrôle est lié **à la fois** au nombre d'enfants et au travail. C'est ce que fait le tableau de Claude. La mise en garde de ChatGPT sur l'interprétation des indicatrices d'origine est à reprendre.
:opt claude | Deux chiffres par contrôle
Pour chaque contrôle, je donne son lien avec morekids et son effet sur work. L'âge : +1,5 point de probabilité d'un troisième enfant et +0,84 semaine de travail par année. Afro-américaine : +10 points et +11,7 semaines. Hispanique : +15 points et +0,5 semaine. Sans ces contrôles, le groupe des mères de plus de deux enfants compte davantage de mères âgées et afro-américaines, qui travaillent plus pour d'autres raisons : la comparaison brute sous-estimait la baisse due au troisième enfant.
:opt gpt | Description qualitative de chaque contrôle
L'âge neutralise le temps écoulé pour avoir un autre enfant et le stade de la carrière ; les indicatrices d'origine, des différences moyennes de contexte socio-économique et d'accès à l'emploi. Si ces caractéristiques sont liées à la fécondité et au travail, leur omission fausse la comparaison des MCO.
##c | Pourquoi les contrôles déplacent les MCO et pas la VI
:enonce
Comment les estimations de l'effet de `morekids` évoluent-elles ? Comment expliquez-vous que l'ajout des contrôles modifie peu l'estimation VI, alors qu'il modifie davantage l'estimation MCO ?
:court
Les MCO passent de −5,39 à **−6,23** (un déplacement de dix erreurs-types) ; la VI de −6,31 à **−5,82** (0,4 erreur-type). Les MCO utilisent toute la variation de `morekids`, fortement liée aux contrôles. La VI n'utilise que la variation due à `samegender`, qui n'est liée à **aucun** contrôle : pour elle, ce ne sont pas des facteurs de confusion.
:zero
| | Sans contrôle | Avec contrôles | Variation | En erreurs-types |
|---|--:|--:|--:|--:|
| MCO | −5,39 | −6,23 | −0,84 | environ 10 |
| VI `samegender` | −6,31 | −5,82 | +0,49 | environ 0,4 |

**Pour les MCO.** Les quatre contrôles prédisent très significativement un troisième enfant. Les omettre créait un biais de variable omise ; les ajouter le retire.

**Pour la VI.** Rappelle-toi la question 2.3 (c) : les mères sont **identiques** en âge et en origine selon `samegender`. Si l'on régresse `samegender` sur les quatre contrôles, aucun coefficient n'est significatif. Or un contrôle ne corrige un biais que s'il est lié à la source de variation qu'on utilise. Ici il ne l'est pas : il n'y a rien à corriger. Le petit déplacement de la VI (0,49) n'est que du bruit d'échantillonnage.

C'est exactement ce qu'on attend d'un instrument « comme tiré au sort » : dans une expérience aléatoire, ajouter des contrôles ne change pas l'estimation, cela la rend seulement un peu plus précise (l'erreur-type passe de 1,275 à 1,246).

:::cle Ce que cette question démontre
La stabilité de la VI quand on ajoute des contrôles est un **argument en faveur de l'instrument**. La sensibilité des MCO est le signe qu'ils restent exposés à d'autres variables omises, celles qu'on n'observe pas.
:::

Remarque enfin l'ordre des estimations : avec les contrôles, les MCO (−6,23) sont **plus** négatifs que la VI (−5,82). C'est le sens prévu à la question 2.2 (c), et celui de l'article.
:code
```r
rob(lm(samegender ~ age + afam + hispanic + other, data = fert))    # aucun coefficient significatif
```
:accord Même explication : l'équilibre des caractéristiques selon l'instrument explique que les contrôles déplacent peu la VI au regard de son erreur-type. Claude va plus loin en retrouvant d'où vient le déplacement de 0,49 (le très léger déséquilibre d'âge et d'origine, divisé par la première étape) ; c'est un raffinement dont tu n'as pas besoin dans le rapport.
:quiz
? Pourquoi ajouter des contrôles change-t-il peu l'estimation par variables instrumentales ?
- Parce que les contrôles n'ont aucun effet sur le travail
+ Parce que l'instrument n'est corrélé à aucun des contrôles
- Parce que la VI est moins précise
> Un contrôle ne corrige un biais que s'il est lié à la variation utilisée. Les mères ont le même âge et la même origine selon samegender.
:oral
? Qu'est-ce qu'une variable de contrôle, par opposition à un instrument ?
> Un contrôle a son propre effet sur le résultat et figure dans l'équation : on l'ajoute pour comparer des mères semblables. Un instrument n'a pas d'effet direct sur le résultat : il est exclu de l'équation et ne sert qu'à faire varier le nombre d'enfants.

#Q 2.8 | Les doubles moindres carrés avec deux instruments
:enonce
Estimez par les doubles moindres carrés (2SLS) le modèle $work = β₀ + β₁ morekids + β₂ age + β₃ afam + β₄ hispanic + β₅ other + β₆ boy1st + u$ en utilisant `twoboys` et `twogirls` (question 2.5) comme instruments de `morekids`.
:intro
On passe d'un instrument à deux. La division de Wald ne suffit plus : il faut la méthode générale, les [[2SLS::doubles moindres carrés]].

**Le principe en deux étapes.**

1. **Première étape** : on régresse `morekids` sur les instruments et les contrôles, et on calcule sa valeur prédite. Cette prédiction ne contient que la variation de `morekids` expliquée par des variables exogènes.
2. **Seconde étape** : on régresse `work` sur cette prédiction et sur les contrôles.

`ivreg()` fait les deux étapes d'un coup et calcule les bonnes erreurs-types.
:concepts instruments
##a | Les rôles, la première étape et la force des instruments
:enonce
Dans cette estimation, quelle variable est endogène, lesquelles sont des instruments, lesquelles sont des contrôles ? Écrivez l'équation de la première étape, estimez-la et jugez de la force des instruments.
:court
**Endogène** : `morekids`. **Instruments** : `twoboys`, `twogirls`. **Contrôles** : `age`, `afam`, `hispanic`, `other`, `boy1st`. Dans la première étape, deux garçons ajoutent 5,9 points et deux filles 7,9 points à la probabilité d'un troisième enfant. Le F robuste des deux instruments vaut **657,9**, très au-dessus de 10 : les instruments sont **forts**.
:zero
L'équation de la première étape : le régresseur endogène, expliqué par **tous** les exogènes (instruments et contrôles).

$$ morekids = π₀ + π₁ twoboys + π₂ twogirls + π₃ age + π₄ afam + π₅ hispanic + π₆ other + π₇ boy1st + v $$

**La force des instruments.** On teste H₀ : $π₁ = π₂ = 0$, c'est-à-dire « les instruments n'expliquent rien une fois les contrôles pris en compte ». Il y a deux restrictions : c'est un test **F conjoint**, et non plus un simple t². Résultat : F = 657,9.

:::piege Sur quoi porte le F de première étape
Sur les **instruments seulement**, pas sur l'ensemble de la régression. Le F global affiché par `summary()` teste tous les régresseurs, contrôles compris : ce n'est pas le bon.
:::
:res
| Première étape | Coefficient | Erreur-type HC1 |
|---|--:|--:|
| twoboys | 0,0586 | 0,0026 |
| twogirls | 0,0785 | 0,0027 |
| boy1st | −0,0007 | 0,0027 |
| age | 0,0154 | 0,0003 |
| afam | 0,1004 | 0,0044 |
| hispanic | 0,1511 | 0,0041 |
| other | 0,0276 | 0,0046 |
:code
```r
reg_2_8_fs <- lm(morekids ~ twoboys + twogirls + age + afam + hispanic + other + boy1st,
                 data = fert)
rob(reg_2_8_fs)
linearHypothesis(reg_2_8_fs, c("twoboys = 0", "twogirls = 0"),
                 vcov. = vcovHC(reg_2_8_fs, type = "HC1"))      # F = 657,9

reg_2_8 <- ivreg(work ~ morekids + age + afam + hispanic + other + boy1st |
                   twoboys + twogirls + age + afam + hispanic + other + boy1st, data = fert)
rob(reg_2_8)
```

`linearHypothesis()` reçoit ici **deux** restrictions dans un vecteur `c(...)` : il les teste ensemble.
:accord Mêmes rôles, même première étape et même F robuste (657,89, avec 2 et 254 646 degrés de liberté).
##b | L'effet estimé et son évolution
:enonce
Comment l'effet estimé de `morekids` évolue-t-il par rapport aux questions 2.2, 2.6 et 2.7 ? Interprétez-le.
:court
**−5,46** (erreur-type 1,23 ; IC à 95 % : [−7,87 ; −3,05]). Un troisième enfant réduit le travail de la mère d'environ **5,5 semaines par an**, soit 29 % de la moyenne. C'est moins négatif que les MCO avec contrôles (−6,23), dans le sens prévu, et très proche de l'article (−5,40 et −5,16).
:zero
| Question | Méthode | Effet de `morekids` | Erreur-type HC1 |
|---|---|--:|--:|
| 2.2 | MCO, sans contrôle | −5,39 | 0,09 |
| 2.6 | VI `samegender`, sans contrôle | −6,31 | 1,27 |
| 2.7 | MCO + contrôles | −6,23 | 0,09 |
| 2.7 | VI `samegender` + contrôles | −5,82 | 1,25 |
| **2.8** | **2SLS `twoboys` + `twogirls` + contrôles** | **−5,46** | **1,23** |

Trois remarques.

- **Les estimations par instruments restent groupées** entre −5,5 et −6,3, toutes à l'intérieur des intervalles de confiance les unes des autres.
- **Les MCO avec contrôles (−6,23) sont plus négatifs que la 2SLS (−5,46)** : les MCO exagèrent un peu l'effet, comme l'article le conclut.
- **L'interprétation reste locale** : l'effet vaut pour les mères qui ont eu ce troisième enfant à cause de la composition de la fratrie (question 2.14).

Avec deux instruments, la 2SLS combine en réalité deux estimations (celle que donnerait `twoboys` seul et celle de `twogirls` seul), en donnant plus de poids à la plus précise. La question 2.10 les montre séparément.
:accord Même estimation (−5,463 ; IC [−7,87 ; −3,05]) et même comparaison avec l'article (−5,16 avec les instruments séparés).
##c | Pourquoi boy1st, et pourquoi pas trois instruments ?
:enonce
Pourquoi faut-il inclure `boy1st` parmi les contrôles ? Pourquoi ne peut-on pas utiliser `samegender`, `twoboys` et `twogirls` ensemble comme instruments ?
:court
**`boy1st`** : parce que `twoboys` ne peut valoir 1 que si l'aîné est un garçon, et `twogirls` que si c'est une fille. Sans ce contrôle, un effet propre du sexe du premier enfant serait attribué au troisième enfant. **Trois instruments** : impossible, car `samegender` = `twoboys` + `twogirls` pour chaque mère. Les trois sont parfaitement colinéaires.
:zero
**Pourquoi `boy1st`.** Les deux instruments sont, par construction, liés au sexe de l'aîné. Avec `boy1st` en contrôle, chaque instrument compare des familles **dont le premier enfant est du même sexe** :

- `twoboys` compare garçon-garçon à garçon-fille ;
- `twogirls` compare fille-fille à fille-garçon.

Dans chaque comparaison, la seule chose qui change est le sexe du **deuxième** enfant, tiré au sort. Sans `boy1st`, si le sexe de l'aîné avait un effet direct sur le travail de la mère (un père plus investi auprès d'un fils aîné, par exemple), cet effet passerait par les instruments et violerait l'exclusion.

En pratique, le coefficient de `boy1st` est nul dans l'équation du travail (−0,01 semaine) : le contrôle est une précaution, qui ne change rien au résultat.

**Pourquoi pas trois instruments.** C'est le piège de la [[colinéarité parfaite]] de la question 1.9 (b), dans un autre décor. `samegender` est la somme exacte des deux autres : il n'apporte **aucune information nouvelle**, et la première étape ne peut pas estimer trois coefficients distincts.
:code
```r
all(fert$samegender == fert$twoboys + fert$twogirls)    # TRUE pour les 254 654 mères
```
:accord Même double réponse : `boy1st` absorbe un éventuel effet propre du sexe du premier enfant, et `samegender` = `twoboys` + `twogirls` rend les trois instruments colinéaires. Les deux scripts vérifient cette égalité ligne par ligne.
:quiz
? Dans ivreg(work ~ morekids + age | twoboys + twogirls + age), quelle variable est traitée comme endogène ?
+ morekids, parce qu'elle n'apparaît pas à droite de la barre
- age, parce qu'elle apparaît des deux côtés
- twoboys et twogirls
> Tout régresseur absent de la liste de droite est considéré comme endogène et instrumenté par les variables qui n'apparaissent qu'à droite.
:oral
? Pourquoi contrôles-tu boy1st ?
> Pour que twoboys et twogirls comparent des familles dont l'aîné est du même sexe. Sinon, un effet propre du sexe du premier enfant sur le travail de la mère serait attribué au troisième enfant.
? Que veut dire la barre dans ivreg(y ~ x + w | z + w) ?
> À gauche, l'équation du résultat. À droite, toutes les variables exogènes : les contrôles w, qui sont des deux côtés, et l'instrument z, seulement à droite. x, absent à droite, est le régresseur endogène.

#Q 2.9 | Pourquoi ces résultats ? Les mécanismes
:enonce
Proposez au moins deux mécanismes, économiques ou liés aux préférences des parents, qui pourraient expliquer vos résultats de la question 2.5. L'un d'eux pourrait-il aussi agir directement sur le travail de la mère ? Quelle condition de validité des instruments serait alors violée ?
:concepts instruments
## | Trois mécanismes, dont un gênant
:court
1. **La préférence pour la mixité** : les parents veulent un garçon et une fille, donc réessaient après deux enfants de même sexe. 2. **La préférence pour les garçons** : elle explique que l'effet soit plus fort après deux filles (+7,8 points) qu'après deux garçons (+5,8). 3. **Les économies d'échelle** : deux enfants de même sexe coûtent moins cher (chambre, vêtements), ce qui rend un troisième plus abordable. Ce troisième mécanisme peut agir **directement** sur le travail de la mère, et violerait alors la **restriction d'exclusion**.
:zero
La question 2.5 a montré deux faits : les deux compositions de même sexe augmentent la probabilité d'un troisième enfant, et l'effet est plus fort après deux filles. Chaque mécanisme doit expliquer l'un ou l'autre.

| Mécanisme | Type | Ce qu'il explique | Effet direct sur le travail ? |
|---|---|---|---|
| Préférence pour la mixité | préférences | les deux compositions de même sexe augmentent la probabilité | non |
| Préférence pour les garçons | préférences | l'asymétrie : +7,8 après deux filles, +5,8 après deux garçons | non, a priori |
| Économies d'échelle | économique | un 3ᵉ enfant est plus abordable après deux enfants de même sexe | **oui** |

**Le mécanisme gênant.** Si deux enfants de même sexe coûtent moins cher, la famille a aussi **moins besoin d'un second salaire**, troisième enfant ou pas. Le sexe des enfants influence alors le travail de la mère par un autre chemin que le nombre d'enfants. C'est précisément ce que la [[restriction d'exclusion]] interdit.

La distinction est importante : les deux premiers mécanismes expliquent pourquoi l'instrument est **pertinent** sans menacer sa validité. Le troisième explique aussi la pertinence, mais menace la validité.
:gpt
Mêmes trois pistes : le souhait d'avoir les deux sexes, une préférence plus marquée pour au moins un garçon, et des coûts d'organisation ou d'équipement qui dépendent de la composition. Souligne que ce sont des hypothèses, et que si la composition change directement le temps parental, l'exclusion est violée.
:claude
Mêmes trois mécanismes, chacun relié au fait qu'il explique. Désigne les économies d'échelle comme celui qui peut agir directement sur le travail, et cite aussi l'implication des pères auprès des fils.
:verdict
Même réponse. La version de Claude relie plus explicitement chaque mécanisme à un résultat de la question 2.5 (la mixité pour l'existence de l'effet, la préférence pour les garçons pour l'asymétrie), ce qui structure bien la réponse. La précaution de ChatGPT (« ce sont des hypothèses ») est juste : on ne peut tester aucun de ces mécanismes avec ces données.
:opt claude | Trois mécanismes reliés aux résultats
La préférence pour la mixité explique que deux garçons comme deux filles augmentent la probabilité d'un troisième enfant. Une préférence pour les garçons explique que l'effet soit plus fort après deux filles. Les économies d'échelle (chambre, vêtements partagés) rendent un troisième enfant plus abordable ; mais elles réduisent aussi le besoin d'un second salaire, ce qui agirait directement sur le travail de la mère et violerait la restriction d'exclusion.
:quiz
? Lequel de ces mécanismes menacerait la validité des instruments ?
- Les parents veulent un garçon et une fille
- Les parents préfèrent les garçons
+ Deux enfants de même sexe coûtent moins cher à élever
> Les deux premiers expliquent seulement pourquoi les parents ont un troisième enfant. Le troisième change aussi le besoin de revenu du ménage, donc le travail de la mère, sans passer par le troisième enfant.

#SEC D | Tester les instruments et l'endogénéité

#Q 2.10 | Un instrument à la fois
:intro
Avec deux instruments, on peut estimer le même effet de deux façons. Si les deux instruments sont valides, les deux réponses devraient se ressembler. C'est l'idée, très simple, qui mène au test de la question 2.11.

{{w:foret jeu=p2instr}}
:concepts instruments, incertitude
##a | Deux estimations du même effet
:enonce
Estimez le modèle de la question 2.8 par variables instrumentales en n'utilisant que `twoboys` comme instrument, puis en n'utilisant que `twogirls`. Comparez les deux estimations de l'effet d'un troisième enfant.
:court
Avec `twoboys` seul : **−8,61** (erreur-type 2,02). Avec `twogirls` seul : **−3,61** (erreur-type 1,55). Les deux sont négatives, mais la première est plus de deux fois plus grande. L'estimation avec les deux instruments (−5,46) se trouve entre les deux.
:res
| Instrument | Effet d'un 3ᵉ enfant | Erreur-type HC1 | IC à 95 % |
|---|--:|--:|--:|
| `twoboys` seul | −8,61 | 2,02 | [−12,57 ; −4,65] |
| `twogirls` seul | −3,61 | 1,55 | [−6,65 ; −0,57] |
| Les deux (2.8) | −5,46 | 1,23 | [−7,87 ; −3,05] |
:code
```r
reg_2_10_boys  <- ivreg(work ~ morekids + age + afam + hispanic + other + boy1st |
                          twoboys  + age + afam + hispanic + other + boy1st, data = fert)
reg_2_10_girls <- ivreg(work ~ morekids + age + afam + hispanic + other + boy1st |
                          twogirls + age + afam + hispanic + other + boy1st, data = fert)
rob(reg_2_10_boys)["morekids", ]; rob(reg_2_10_girls)["morekids", ]
```

Seule la partie droite de la barre change : un seul instrument à la fois, avec les mêmes contrôles.
:accord Mêmes estimations (−8,608 et −3,612) sur les mêmes 254 654 mères.
##b | L'écart est-il important ?
:enonce
Si les deux instruments sont valides, que devraient estimer ces deux régressions ? Leur écart vous paraît-il important au regard de leurs erreurs-types ?
:court
Si les deux instruments sont valides **et** si l'effet est le même pour toutes les mères, les deux régressions estiment le **même paramètre** et ne devraient différer que par le hasard. L'écart vaut −5,0 semaines pour une erreur-type de 2,55, soit **z = −1,96** : exactement **à la limite** de la significativité à 5 %. Grand en valeur, à peine distinguable du hasard.
:zero
**Le calcul.** Les deux estimations reposent sur des familles différentes : `twoboys` exploite les familles dont l'aîné est un garçon, `twogirls` celles dont l'aînée est une fille. On peut les traiter comme à peu près indépendantes ; la variance de leur différence est alors la somme des deux variances.

$$ \text{erreur-type de l'écart} = \sqrt{2,02² + 1,55²} = 2,55 \qquad z = \frac{−8,61 − (−3,61)}{2,55} = −1,96 $$

{{w:loi test=ecart}}

**Comment interpréter un écart « à la limite » ?** Deux lectures possibles.

- **L'un des instruments n'est pas valide.** Par exemple, un effet direct sur le travail de la mère qui n'existerait qu'avec deux garçons.
- **Les deux sont valides, mais l'effet n'est pas le même pour toutes les mères.** Chaque instrument mesure l'effet chez ses propres « compliers » : les familles qui ont un troisième enfant à cause de deux garçons ne sont pas les mêmes que celles qui en ont un à cause de deux filles. Les deux nombres peuvent alors différer sans qu'aucun instrument soit fautif.

Les données ne permettent pas de trancher entre ces deux lectures.
:gpt
Calcule l'erreur-type de l'écart **en tenant compte de la covariance** entre les deux estimateurs, puisque les deux régressions utilisent les mêmes mères (fonctions d'influence, `estfun()` et `bread()`). Résultat : 2,548, z = −1,961, p = 0,0499.
:claude
Traite les deux estimations comme **à peu près indépendantes**, parce qu'elles exploitent deux groupes de familles distincts (aîné garçon, aînée fille) : √(2,02² + 1,55²) = 2,55, z = −1,96.
:verdict
Les deux méthodes donnent **le même nombre** (2,548 contre 2,548 : la covariance est pratiquement nulle), ce qui confirme que l'hypothèse d'indépendance de Claude est justifiée ici. Le calcul de ChatGPT est plus rigoureux, mais il repose sur une dizaine de lignes de code que tu aurais du mal à expliquer à l'oral. Conseil : la formule simple, avec la justification (deux groupes de familles distincts). Tu peux ajouter qu'un calcul tenant compte de la covariance donne le même résultat.
:opt claude | Formule simple, justifiée
Si les deux instruments sont valides et l'effet homogène, les deux régressions estiment le même paramètre. L'écart est de −5,0 semaines. Comme les deux estimations exploitent des familles différentes (aîné garçon ou fille), je les traite comme indépendantes : l'erreur-type de l'écart vaut √(2,02² + 1,55²) = 2,55 et z = −1,96, à la limite du seuil de 5 %. L'écart est grand en valeur, mais à peine distinguable du hasard.
:opt gpt | Covariance prise en compte
Les deux régressions utilisant les mêmes mères, je calcule l'erreur-type de l'écart en tenant compte de la covariance entre les deux estimateurs : 2,548, d'où z = −1,961 et p = 0,0499. L'écart est à la limite du seuil de 5 %.
:quiz
? Les deux instruments donnent −8,6 et −3,6. Cela prouve-t-il qu'un instrument est invalide ?
- Oui, deux instruments valides donnent toujours la même estimation
+ Non : l'écart est à la limite du hasard, et il peut aussi venir d'effets différents selon les mères
- Non, parce que les deux estimations sont négatives
> z = −1,96 : à peine au seuil de 5 %. Et si l'effet varie entre mères, chaque instrument mesure l'effet chez ses propres compliers.

#Q 2.11 | Le test de suridentification
:intro
Cette question transforme la comparaison de la question 2.10 en un test formel. Avec **plus d'instruments que de variables endogènes**, le modèle est dit [[suridentification::suridentifié]] : on a « un instrument de trop », et on peut s'en servir pour vérifier que les instruments se contredisent ou non.
:concepts instruments, incertitude
##a | Le test, étape par étape
:enonce
Votre modèle de la question 2.8 compte plus d'instruments que de variables endogènes. Comment pouvez-vous en tirer parti pour évaluer la validité des instruments ? Mettez cette vérification en œuvre étape par étape (hypothèses, statistique, loi sous l'hypothèse nulle, décision) et concluez.
:court
C'est le **test de suridentification** (test de Sargan, ou test J). H₀ : tous les instruments sont exogènes. Statistique : n × R² de la régression des résidus 2SLS sur tous les exogènes = **3,856**. Loi sous H₀ : khi-deux à 2 − 1 = **1** degré de liberté (valeur critique à 5 % : 3,84). p = **0,0496** : on **rejette H₀ à 5 %, de justesse**, mais pas à 1 %. Indice faible que les deux instruments ne racontent pas la même histoire.
:zero
**L'idée.** Si les instruments sont valides, ils ne sont pas liés au terme d'erreur. Les résidus de la 2SLS, qui estiment ce terme d'erreur, ne devraient donc pas pouvoir être « expliqués » par les instruments.

1. **Hypothèses.** H₀ : tous les instruments sont exogènes. H₁ : au moins un instrument ne l'est pas.
2. **Résidus.** On estime la 2SLS et on calcule ses résidus, $\hat{u} = work − X\hat{β}$, avec le **vrai** `morekids` (pas sa prédiction).
3. **Régression auxiliaire.** On régresse $\hat{u}$ sur tous les exogènes : les deux instruments et les cinq contrôles.
4. **Statistique.** $S = n × R²$ de cette régression = 254 654 × 0,00001514 = **3,856**. (Le manuel de Stock et Watson l'écrit $J = m × F$, où F teste les deux instruments dans cette régression : on obtient 3,856 aussi.)
5. **Loi sous H₀.** Khi-deux à $m − k$ degrés de liberté : nombre d'instruments (2) moins nombre de variables endogènes (1) = **1**.
6. **Décision.** Valeur critique à 5 % : 3,84. Or 3,856 > 3,84, et p = 0,0496 < 0,05 : on rejette H₀ à 5 %.

{{w:loi test=sargan}}

**Comment conclure quand p = 0,0496 ?** Avec honnêteté : on rejette au seuil de 5 %, mais de si peu que la conclusion basculerait avec un échantillon à peine différent. Ce n'est pas un verdict, c'est une **alerte**. Soit un instrument est invalide, soit l'effet diffère entre les mères concernées par chaque instrument (question 2.10 b).

:::piege Ne pas arrondir avant de décider
Si tu arrondis la p-valeur à 0,05, tu ne sais plus de quel côté du seuil elle se trouve. Écris 0,0496.
:::
:code
```r
fert$u_2sls <- resid(reg_2_8)                 # résidus 2SLS (avec le vrai morekids)
aux_2_11 <- lm(u_2sls ~ twoboys + twogirls + age + afam + hispanic + other + boy1st,
               data = fert)
sargan <- nrow(fert) * summary(aux_2_11)$r.squared     # 3,856
1 - pchisq(sargan, df = 1)                             # p = 0,0496
qchisq(0.95, df = 1)                                   # valeur critique : 3,84

summary(reg_2_8, diagnostics = TRUE)                   # même résultat, ligne "Sargan"
```

- `resid()` appliqué à un modèle `ivreg` renvoie les bons résidus, calculés avec le vrai `morekids`.
- `pchisq(x, df)` donne la probabilité qu'un khi-deux soit inférieur à `x` ; `1 − pchisq()` est donc la p-valeur.
- `summary(..., diagnostics = TRUE)` affiche d'un coup les trois diagnostics : force des instruments, Wu-Hausman (question 2.12) et Sargan.
:gpt
Met en œuvre le test **J de Hansen**, robuste à l'hétéroscédasticité : estimation par GMM en deux étapes, écrite avec des matrices (covariance des moments, pondération optimale, distance n g′S⁻¹g). J = 3,8557, p = 0,0496. Donne à titre de comparaison le Sargan classique (3,8558), en précisant qu'il suppose l'homoscédasticité.
:claude
Met en œuvre le test de **Sargan** par la régression auxiliaire (n × R² = 3,856) et la version J = m × F de Stock et Watson. Signale en une phrase que ce test suppose l'homoscédasticité et que la comparaison robuste de la question 2.10 donne la même conclusion.
:verdict
Les trois statistiques coïncident à la quatrième décimale (3,8558 pour Sargan, 3,8557 pour J = mF et pour le J de Hansen) : le choix ne change **rien** ici. Reste la question de ce que tu peux défendre. La version de Claude suit les étapes demandées par l'énoncé et tient en quatre lignes de code que tu peux expliquer une à une. Celle de ChatGPT est plus rigoureuse sur le papier (cohérente avec l'usage de HC1 partout), mais elle demande de maîtriser le GMM, qui dépasse très probablement le cours. Conseil : le test de Sargan par régression auxiliaire, en mentionnant qu'il suppose l'homoscédasticité et qu'une version robuste donne la même valeur.
:opt claude | Sargan par régression auxiliaire
H₀ : tous les instruments sont exogènes. Je régresse les résidus de la 2SLS sur les instruments et les contrôles ; n × R² = 3,856 suit sous H₀ un khi-deux à 2 − 1 = 1 degré de liberté. La valeur critique à 5 % est 3,84 et p = 0,0496 : je rejette H₀ à 5 %, de justesse, mais pas à 1 %. C'est un indice faible que les deux instruments ne donnent pas la même réponse, à lire avec prudence ; ce test suppose l'homoscédasticité, et sa version robuste donne la même valeur.
:opt gpt | J de Hansen robuste
Je calcule le test J de Hansen, robuste à l'hétéroscédasticité, par GMM en deux étapes : J = 3,856 avec un degré de liberté, p = 0,0496. On rejette tout juste à 5 %, pas à 1 %. Le Sargan classique donne la même valeur.
##b | Pourquoi impossible avec samegender seul ?
:enonce
Pourquoi cette vérification n'était-elle pas réalisable avec `samegender` comme seul instrument ?
:court
Avec un instrument pour une variable endogène, le modèle est **juste identifié** : m − k = 1 − 1 = **0** degré de liberté. L'estimateur choisit le coefficient de façon que les résidus soient exactement non corrélés à l'instrument : il ne reste rien à tester.
:zero
Un seul instrument donne **une seule** estimation de l'effet. On n'a aucune autre estimation à laquelle la comparer.

Techniquement, l'estimateur par variables instrumentales est construit pour que la covariance entre l'instrument et les résidus soit **exactement nulle**. La régression auxiliaire aurait donc un R² de 0 par construction, et la statistique vaudrait toujours 0.

:::cle La limite de fond
On ne peut **jamais** tester l'exogénéité d'un instrument sans supposer qu'un autre instrument est valide. Le test de suridentification ne vérifie pas que les instruments sont valides : il vérifie qu'ils sont **cohérents entre eux**.
:::
:accord Même réponse : une restriction pour un coefficient endogène, donc zéro restriction à tester.
##c | Ce que le test peut et ne peut pas détecter
:enonce
`twoboys` et `twogirls` exploitent-ils des sources de variation réellement distinctes ? Qu'en déduisez-vous sur ce que cette vérification peut détecter et ne peut pas détecter ?
:court
**Oui et non.** Ils portent sur deux groupes de familles distincts, mais ils exploitent **le même type** de variation : une fratrie de même sexe. Le test peut donc détecter une violation **propre à un seul** instrument, pas une violation **commune aux deux**. Un non-rejet ne prouverait jamais la validité des instruments.
:zero
- **Distinctes** : `twoboys` oppose garçon-garçon à garçon-fille parmi les familles dont l'aîné est un garçon ; `twogirls` oppose fille-fille à fille-garçon parmi les autres. Ce sont deux ensembles de familles disjoints.
- **Pas vraiment distinctes** : les deux reposent sur la même idée. Ils sont donc exposés aux **mêmes** violations. Les économies de chambre et de vêtements valent pour deux garçons comme pour deux filles.

| Situation | Les deux instruments donnent… | Le test… |
|---|---|---|
| Effet direct seulement avec deux garçons | des estimations différentes | peut le détecter |
| Effet direct identique pour les deux compositions | la **même** estimation, fausse | **ne voit rien** |

Si les deux instruments sont biaisés de la même façon, ils sont d'accord entre eux, et le test les déclare « cohérents ». C'est pourquoi il faut toujours défendre les instruments par un raisonnement, pas seulement par ce test.
:accord Même réponse : les deux instruments proviennent de la même composition familiale ; un canal direct commun leur échapperait. ChatGPT ajoute qu'un rejet n'identifie pas l'instrument fautif et peut aussi refléter des effets locaux différents.
:quiz
? Le test de Sargan donne p = 0,0496. Quelle conclusion est correcte ?
- Les instruments sont invalides
- Les instruments sont valides
+ On rejette à 5 % de justesse : indice faible d'incohérence, à interpréter avec prudence
> Le rejet est si marginal qu'il n'établit rien de solide ; il peut aussi refléter des effets différents selon les mères.
? Si le test de suridentification ne rejetait pas, pourrait-on conclure que les instruments sont valides ?
- Oui
+ Non : deux instruments biaisés de la même façon donnent des estimations concordantes
- Oui, à condition que la première étape soit forte
> Le test vérifie la cohérence entre instruments, pas leur validité. Une violation commune reste invisible.
:oral
? Que conclus-tu du test de Sargan ?
> Il vérifie que les deux instruments donnent la même réponse. Il rejette de justesse à 5 %, avec une p-valeur de 0,0496, mais pas à 1 %. C'est un indice faible : soit un instrument est invalide, soit l'effet diffère selon les mères. Et il ne peut de toute façon pas détecter une violation commune aux deux instruments.

#Q 2.12 | Les variables instrumentales étaient-elles nécessaires ?
:intro
Les MCO avec contrôles donnent −6,23 et la 2SLS −5,46. La différence est-elle réelle, ou n'est-elle que du bruit ? Si `morekids` est en fait exogène, les MCO sont justes **et** beaucoup plus précis : on aurait instrumenté pour rien.
:concepts instruments, incertitude
##a | Le test d'endogénéité et l'estimateur retenu
:enonce
Au vu de vos résultats, le recours aux variables instrumentales était-il réellement nécessaire ? Proposez une procédure permettant de le vérifier formellement, mettez-la en œuvre étape par étape pour le modèle de la question 2.8 et indiquez quel estimateur vous retenez.
:court
C'est le **test d'endogénéité de Hausman**. H₀ : `morekids` est exogène. On ajoute à la régression MCO le résidu de la première étape ; son coefficient vaut **−0,771** (erreur-type 1,232), t = **−0,63**, p = **0,53**. On **ne rejette pas** l'exogénéité : statistiquement, les MCO (−6,23) et la 2SLS (−5,46) ne se distinguent pas. Le choix de l'estimateur demande ensuite un jugement (voir les options ci-dessous).
:zero
**L'idée.** Si `morekids` est exogène, MCO et 2SLS estiment tous deux le vrai effet, et ne diffèrent que par le hasard. S'il est endogène, seule la 2SLS est juste et les deux s'écartent. Le test demande donc : **l'écart entre −6,23 et −5,46 est-il plus grand que ce que le hasard explique ?**

**La procédure (version « régression »).**

1. **Hypothèses.** H₀ : `morekids` est exogène, $Cov(morekids, u) = 0$. H₁ : il est endogène.
2. **Première étape.** On reprend la régression de `morekids` de la question 2.8 et on garde ses **résidus** $\hat{v}$ : la part de `morekids` que les instruments et les contrôles n'expliquent pas. C'est la partie « suspecte ».
3. **Régression augmentée.** On ajoute $\hat{v}$ à la régression MCO de `work`.
4. **Statistique.** Le t du coefficient de $\hat{v}$, avec erreur-type HC1. Sous H₀, il suit une loi normale.
5. **Résultat.** Coefficient −0,771, erreur-type 1,232, t = −0,63, p = 0,53.
6. **Décision.** On ne rejette pas H₀.

{{w:loi test=hausman}}

Remarque que −0,771 est exactement l'écart entre les deux estimations : −6,231 − (−5,463) = −0,77.

**Quel estimateur retenir ?** C'est ici que les deux corrigés divergent, et qu'il te faut choisir.

- **L'argument pour les MCO.** Le test ne rejette pas l'exogénéité. Sous H₀, les MCO sont justes et **14 fois plus précis** (erreur-type 0,09 contre 1,23).
- **Les arguments pour la 2SLS.** Le test est **peu puissant** : avec une erreur-type de 1,23, il ne détecterait qu'un écart d'au moins 2,4 semaines. Ne pas rejeter l'exogénéité ne la prouve pas. Et les MCO sont **sensibles aux contrôles** (−5,39 sans, −6,23 avec, −8,05 dans l'article, qui contrôle aussi l'âge à la première naissance), alors que la VI reste stable (−6,31, −5,82, −5,46).

Les deux positions se défendent. L'important est d'en choisir une, de la justifier, et de rester cohérent avec ta conclusion de la question 2.14 (d).
:code
```r
fert$v_hat <- resid(reg_2_8_fs)                 # résidus de la première étape
reg_2_12 <- lm(work ~ morekids + age + afam + hispanic + other + boy1st + v_hat, data = fert)
rob(reg_2_12)["v_hat", ]                        # -0,771 (1,232), t = -0,63, p = 0,53

summary(reg_2_8, diagnostics = TRUE)            # ligne "Wu-Hausman" : F = 0,39 = t², p = 0,53
```
:gpt
Même test, même résultat (−0,7711 ; t = −0,626 ; p = 0,5315). Conclusion : le test « ne fournit pas une raison statistique d'écarter les MCO au profit de la VI » ; pour une description ajustée, les MCO comparables sont plus précis ; pour l'analyse causale de l'article, on rapporte **séparément** la VI et ses hypothèses.
:claude
Même test, même résultat. Conclusion : « selon la logique du test », les MCO avec contrôles ; mais avec deux réserves sérieuses (faible puissance du test, sensibilité des MCO aux contrôles) qui le conduisent à retenir finalement la 2SLS à la question 2.14.
:verdict
Chiffres identiques. La divergence porte sur la réponse à « quel estimateur retenez-vous ? ». ChatGPT ne tranche pas vraiment : il présente les deux. Claude dit ce que le test conclut, puis explique pourquoi il s'en écarte. Les deux lectures sont défendables ; ce qui serait une erreur, c'est d'écrire « le test prouve que `morekids` est exogène ». Choisis la position que tu sauras défendre à l'oral, et aligne ta réponse à 2.14 (d) dessus.
:opt claude | Retenir la 2SLS, malgré le non-rejet
Le test de Hausman ne rejette pas l'exogénéité de morekids (t = −0,63, p = 0,53) : statistiquement, les MCO (−6,23) et la 2SLS (−5,46) ne se distinguent pas. Je retiens néanmoins la 2SLS, pour deux raisons : le test est peu puissant (il ne détecterait qu'un écart d'environ 2,4 semaines), et les MCO varient fortement selon les contrôles (de −5,4 à −8,1 dans l'article) alors que la VI reste stable. Le non-rejet ne prouve pas l'exogénéité.
:opt gpt | Retenir les MCO, comme le veut le test
Le test de Hausman ne rejette pas l'exogénéité de morekids (t = −0,63, p = 0,53). Sous cette hypothèse, les MCO sont convergents et bien plus précis : je retiens les MCO avec contrôles (−6,23 semaines, erreur-type 0,09), en signalant que la 2SLS donne un ordre de grandeur proche (−5,46).
:opt mix | Rapporter les deux, en disant ce que chacune mesure
Le test ne rejette pas l'exogénéité (p = 0,53) : rien n'oblige statistiquement à préférer la 2SLS. Je présente donc les deux estimations. Les MCO (−6,23) décrivent précisément l'écart entre mères à caractéristiques égales ; la 2SLS (−5,46) est la seule qui repose sur une variation due au hasard, au prix d'une forte imprécision.
##b | Sur quelle hypothèse repose la conclusion ?
:enonce
Sur quelle hypothèse repose votre conclusion ? Que vous apprend à ce sujet la question 2.11 ?
:court
Le test de Hausman suppose que **les instruments sont valides**. Il compare un estimateur juste sous H₀ seulement (les MCO) à un estimateur censé être toujours juste (la 2SLS). Or la question 2.11 jette un doute sur cette validité : le test de suridentification rejette, de justesse, à 5 %. La conclusion du test de Hausman est donc **fragile**.
:zero
Le test prend la 2SLS comme **étalon**. Si l'étalon est faussé, la comparaison ne veut plus rien dire : un écart nul entre MCO et 2SLS pourrait venir de deux estimateurs biaisés de la même façon.

| Test | Ce qu'il suppose | Ce qu'il conclut |
|---|---|---|
| Suridentification (2.11) | au moins un instrument valide | rejet de justesse à 5 % : les instruments ne sont peut-être pas cohérents |
| Hausman (2.12) | **tous** les instruments valides | non-rejet : MCO et 2SLS ne se distinguent pas |

Les deux tests ne répondent pas à la même question, et le second repose sur ce que le premier met en doute. S'ajoute un point plus subtil : si l'effet varie d'une mère à l'autre, MCO et 2SLS n'estiment de toute façon pas le même paramètre (la 2SLS mesure l'effet chez les « compliers »).

:::cle La leçon à emporter
Aucun test ne valide une stratégie d'identification à lui seul. Chacun repose sur des hypothèses que les données ne peuvent pas toutes vérifier.
:::
:accord Même réponse : le test suppose les instruments valides et le modèle correctement spécifié ; le rejet limite de la question 2.11 fragilise cette prémisse.
:quiz
? Le test de Hausman ne rejette pas H₀ (p = 0,53). Que peut-on affirmer ?
- morekids est exogène
+ Les données ne permettent pas de distinguer les MCO de la 2SLS
- Les instruments sont valides
> Un non-rejet n'est pas une preuve, surtout avec une erreur-type de 1,23. Et le test suppose la validité des instruments au lieu de la vérifier.
:oral
? Quelle est la différence entre le test de Sargan et le test de Hausman ?
> Ils n'ont pas la même hypothèse nulle. Sargan teste si les instruments sont cohérents entre eux, donc leur validité. Hausman teste si le régresseur est exogène, en supposant que les instruments sont valides. Ici, l'un rejette de justesse (p = 0,0496) et l'autre ne rejette pas (p = 0,53).

#SEC E | Marge extensive et conclusion

#Q 2.13 | Travailler ou non : la marge extensive
:intro
Les 5,5 semaines perdues viennent-elles de mères qui travaillent **un peu moins**, ou de mères qui **arrêtent complètement** ? La distribution à deux pics de la question 2.1 laissait deviner la réponse.
:concepts instruments
##a | Avoir travaillé au moins une semaine
:enonce
Créez `travaille`, qui vaut 1 si la mère a travaillé au moins une semaine en 1979 (`work` > 0), 0 sinon. Estimez le modèle de la question 2.8 avec `travaille` comme variable dépendante, par les MCO puis par les doubles moindres carrés (2SLS). Interprétez le coefficient de `morekids` et comparez-le à l'article.
:court
MCO : **−0,129** (0,002). 2SLS : **−0,119** (0,028). Selon la 2SLS, un troisième enfant réduit de **11,9 points de pourcentage** la probabilité que la mère ait travaillé (IC à 95 % : 6,4 à 17,4 points). Notre 2SLS est presque identique à celle de l'article (12,0 points) ; nos MCO (12,9 points) sont moins négatifs que les siens (16,7), parce que l'article contrôle aussi l'âge de la mère à la première naissance.
:zero
`travaille` vaut 0 ou 1 : c'est un [[modèle de probabilité linéaire]], et le coefficient se lit en **points de probabilité**. Pour situer l'ordre de grandeur, 57,2 % des mères de deux enfants ont travaillé en 1979 : une baisse de 12 points est considérable.

| | Nos estimations | Article (Angrist et Evans) |
|---|--:|--:|
| MCO | −0,129 (0,002) | −0,167 |
| 2SLS | −0,119 (0,028) | −0,120 |

**Pourquoi nos MCO diffèrent de ceux de l'article, et pas notre 2SLS ?** L'article contrôle l'âge à la première naissance, absent de notre fichier. À âge donné, une mère qui a commencé tôt a des enfants plus grands : elle travaille davantage **et** a plus souvent un troisième enfant. Omettre cette variable tire nos MCO vers zéro. La VI n'est pas touchée, puisque l'instrument est indépendant de l'âge à la première naissance.

C'est la leçon de la question 2.7, une troisième fois : **la VI est robuste au choix des contrôles, pas les MCO.**
:code
```r
reg_2_13_mco <- lm(travaille ~ morekids + age + afam + hispanic + other + boy1st, data = fert)
reg_2_13_vi  <- ivreg(travaille ~ morekids + age + afam + hispanic + other + boy1st |
                        twoboys + twogirls + age + afam + hispanic + other + boy1st, data = fert)
rob(reg_2_13_mco)["morekids", ]; rob(reg_2_13_vi)["morekids", ]
```

Même modèle qu'à la question 2.8 : seule la variable dépendante change.
:gpt
Mêmes estimations (−12,85 et −11,90 points). Compare à l'article en citant le tableau 7 : −16,7 points en MCO, −12,0 avec `samegender` et **−11,3 avec les deux instruments**. Explique l'écart des MCO par l'absence de l'âge à la première naissance.
:claude
Mêmes estimations. Compare aux deux chiffres donnés dans l'énoncé (16,7 et 12,0 points) et développe l'explication : l'âge à la première naissance tire les MCO vers zéro mais pas la VI.
:verdict
Résultats identiques. Pour la comparaison, l'énoncé ne donne que deux chiffres (16,7 et 12,0, ce dernier obtenu avec `samegender`). ChatGPT ajoute un troisième chiffre, −11,3, pour les deux instruments séparés : c'est en principe la bonne référence pour notre 2SLS à deux instruments, mais il ne figure pas dans l'énoncé et je n'ai pas pu le vérifier dans l'article. Ne le cite que si tu le retrouves dans ta copie (tableau 7).
:opt claude | Comparer aux deux chiffres de l'énoncé
Selon la 2SLS, un troisième enfant réduit de 11,9 points la probabilité que la mère ait travaillé en 1979 (IC à 95 % : 6,4 à 17,4), à rapprocher des 57 % de mères de deux enfants qui ont travaillé. C'est presque exactement le résultat de l'article (12,0 points). Nos MCO (12,9 points) sont moins négatifs que les siens (16,7) parce que nous ne pouvons pas contrôler l'âge à la première naissance ; la VI n'en est pas affectée.
:opt gpt | Comparer aux trois chiffres du tableau 7
La baisse est de 12,85 points en MCO et de 11,90 points en 2SLS. Le tableau 7 de l'article donne −16,7 points en MCO, −12,0 avec samegender et −11,3 avec les deux instruments. (À vérifier dans l'article avant de citer −11,3.)
##b | Quelle part vient de l'arrêt complet du travail ?
:enonce
Combien de semaines les mères de deux enfants qui ont travaillé en 1979 ont-elles travaillé en moyenne ? Combinez ce chiffre avec votre estimation 2SLS en (a) pour évaluer approximativement quelle part de l'effet sur les semaines travaillées (question 2.8) s'explique par des mères qui cessent complètement de travailler. Quelle hypothèse faites-vous dans ce calcul ?
:court
Les mères de deux enfants qui ont travaillé l'ont fait **36,8 semaines** en moyenne. Semaines perdues par l'arrêt complet : 0,119 × 36,8 = **4,38**. Rapportées à l'effet total de 5,46 semaines : environ **80 %**. Hypothèse : les mères qui arrêtent à cause du troisième enfant auraient sinon travaillé autant que la moyenne des mères actives de deux enfants.
:zero
L'effet total sur les semaines (−5,46) a deux composantes.

- **La marge extensive** : des mères passent de « travaille » à « ne travaille plus ». Chacune perd toutes ses semaines.
- **La marge intensive** : des mères continuent de travailler, mais moins de semaines.

Le calcul de la première :

| Étape | Valeur |
|---|--:|
| Semaines moyennes des mères de deux enfants qui ont travaillé | 36,8 |
| Effet 2SLS sur la probabilité de travailler | −0,119 |
| Semaines perdues par l'arrêt complet : 0,119 × 36,8 | −4,38 |
| Effet 2SLS total sur les semaines (question 2.8) | −5,46 |
| **Part due à l'arrêt complet : 4,38 / 5,46** | **80 %** |

Lecture : sur 100 mères « poussées » vers un troisième enfant, environ 12 cessent de travailler. Si chacune travaillait 36,8 semaines, cela fait 4,4 semaines perdues par mère en moyenne, sur les 5,5 au total. Les 20 % restants viennent de mères qui continuent à travailler, mais moins.

**L'hypothèse, et pourquoi elle est discutable.** On suppose que les mères qui arrêtent auraient travaillé 36,8 semaines, comme la mère active moyenne. Or ce sont justement les mères « à la marge », sans doute **moins attachées au travail** que la moyenne : elles auraient probablement travaillé moins. Si c'est le cas, 80 % **surestime** la part de l'arrêt complet : c'est plutôt une borne haute.
:code
```r
sem_travail <- mean(fert$work[fert$morekids == 0 & fert$work > 0])       # 36,8
coef(reg_2_13_vi)["morekids"] * sem_travail                              # -4,38
coef(reg_2_13_vi)["morekids"] * sem_travail / coef(reg_2_8)["morekids"]  # 0,80
```

`fert$work[condition]` ne garde que les valeurs de `work` pour les mères qui vérifient la condition : deux enfants **et** au moins une semaine travaillée.
:accord Même calcul (36,829 semaines ; −4,381 ; 80,2 %) et même hypothèse. Claude précise le sens probable de l'erreur (une borne haute, les mères marginales étant moins attachées au travail) ; ChatGPT parle d'un « ordre de grandeur de la marge extensive ».
:quiz
? Le coefficient 2SLS de morekids sur travaille vaut −0,119. Cela signifie :
- une baisse de 0,119 % de la probabilité de travailler
+ une baisse de 11,9 points de pourcentage de la probabilité de travailler
- une baisse de 11,9 semaines travaillées
> La variable dépendante vaut 0 ou 1 : le coefficient se lit en points de probabilité.
:oral
? Comment arrives-tu à 80 % ?
> Je multiplie la baisse de la probabilité de travailler, 0,119, par le nombre de semaines des mères actives de deux enfants, 36,8 : cela donne 4,4 semaines perdues par l'arrêt complet, sur un effet total de 5,5. Je suppose que les mères qui arrêtent auraient travaillé autant que la moyenne des actives, ce qui est sans doute optimiste : 80 % est une borne haute.

#Q 2.14 | Conclure : un effet causal, pour qui ?
:intro
La dernière question rassemble tout. Elle demande ce qu'il faut croire pour lire −5,46 comme un effet causal, ce qui plaide pour et contre, et à qui ce chiffre s'applique.

{{w:compliers}}
:concepts instruments, causalite
##a | Les conditions d'une interprétation causale
:enonce
Rappelez les conditions sous lesquelles votre estimation de la question 2.8 mesure l'effet causal d'un troisième enfant sur le travail de la mère.
:court
1. **Pertinence** : `twoboys` et `twogirls` modifient la probabilité d'un troisième enfant. 2. **Indépendance** : la composition de la fratrie est comme tirée au sort. 3. **Exclusion** : elle n'agit sur le travail de la mère que par le troisième enfant. 4. **Monotonie** : aucune famille ne fait l'inverse (un troisième enfant avec une fratrie mixte, mais pas avec deux enfants de même sexe).
:zero
Les trois premières sont celles de la question 2.3 : la pertinence, et les deux moitiés de l'exogénéité. La quatrième est nouvelle.

**La [[monotonie]].** L'instrument doit pousser **tout le monde dans le même sens**, ou ne rien changer. Elle permet d'interpréter l'estimation comme un effet moyen chez les « compliers » (question c). Sans elle, les familles qui réagissent à l'envers brouilleraient la division de Wald.
:accord Mêmes quatre conditions. ChatGPT en ajoute une cinquième, technique : l'absence d'interférence (le travail d'une mère ne dépend pas de la composition de la fratrie d'une autre famille) et un traitement bien défini (« plus de deux » inclut quatre enfants ou davantage).
##b | Pour et contre, condition par condition
:enonce
Pour chacune, rassemblez les éléments qui plaident pour et contre, en vous appuyant sur vos résultats et sur les éléments de l'article présentés au début de cette partie.
:court
La **pertinence** est établie (F = 658). L'**indépendance** est très plausible (le sexe est dû au hasard, les mères se ressemblent, la VI ne bouge pas avec les contrôles). L'**exclusion** est le point faible (économies de coût, implication du père, test de Sargan à p = 0,0496), même si l'article ne trouve qu'un écart de 2 % en tenant compte du sexe de chaque enfant. La **monotonie** est plausible.
:zero
| Condition | Pour | Contre |
|---|---|---|
| **Pertinence** | F de première étape = 658 ; +5,8 et +7,8 points pour deux garçons et deux filles ; mêmes ordres de grandeur que l'article (34,6 % et 41,4 %). | Rien de sérieux. L'instrument explique peu de variance (0,5 %), mais il est fort vu la taille de l'échantillon. |
| **Indépendance** | Le sexe à la naissance est dû au hasard ; âge et origine équilibrés (2.3 c) ; la VI bouge à peine avec les contrôles (2.7 c) ; l'article trouve aussi le même âge à la première naissance et les mêmes études. | L'échantillon ne garde que des femmes **mariées**. Si le sexe des enfants influence le divorce, les mères encore mariées sont sélectionnées selon la composition de la fratrie. |
| **Exclusion** | L'article : tenir compte du sexe de chaque enfant ne change les résultats que de 2 % au plus ; pratiquement aucun effet sur le travail des pères ; `boy1st` n'a aucun effet propre (−0,01 semaine). | Économies de chambre et de vêtements, implication du père auprès des garçons (2.3 b, 2.9) ; le test de Sargan rejette à 5 % (p = 0,0496) ; les deux instruments donnent −8,6 et −3,6 semaines. |
| **Monotonie** | La préférence pour la mixité pousse toujours dans le même sens ; les deux premières étapes sont positives. | Quelques parents qui voudraient deux enfants du même sexe pourraient faire l'inverse ; ce cas semble rare, et une moyenne positive ne l'exclut pas. |

Pour chaque ligne, tu dois pouvoir citer **un résultat à toi** et **un élément de l'article**. C'est ce que demande l'énoncé.
:accord Même tableau sur le fond. ChatGPT formule la colonne « contre » comme « la limite de ce que l'on peut vérifier », ce qui est une bonne façon de le dire : la force statistique ne renseigne pas sur une voie directe ; l'équilibre ne porte que sur quelques variables ; une première étape positive en moyenne n'exclut pas des réponses inverses.
##c | Pour quelles mères ?
:enonce
Pour quelles mères l'effet est-il estimé ? Peut-on l'étendre à toutes les mères, ou à d'autres pays et d'autres époques ?
:court
Pour les **« compliers »** : les mères qui ont eu un troisième enfant *parce que* les deux premiers étaient de même sexe, et qui ne l'auraient pas eu sinon (environ 7 % des mères). C'est un **effet local** ([[LATE]]). On ne peut l'étendre à toutes les mères que par hypothèse, et à d'autres pays ou époques qu'avec prudence.
:zero
L'outil en haut de la page montre les trois groupes.

- Les **« always-takers »** auraient eu un troisième enfant de toute façon : l'instrument ne change rien pour elles.
- Les **« never-takers »** n'en auraient eu en aucun cas : idem.
- Les **« compliers »** sont les seules dont le comportement change avec l'instrument. La VI ne « voit » que celles-là.

**Peut-on généraliser ?**

- **À toutes les mères** : pas sans hypothèse supplémentaire. Les mères qui veulent de toute façon une grande famille sont sans doute moins attachées au marché du travail ; l'effet peut être différent pour elles. L'article trouve d'ailleurs un effet plus faible chez les plus diplômées et chez celles dont le mari gagne le plus.
- **À d'autres pays ou époques** : avec prudence. Ce sont des mères américaines **mariées**, de 21 à 35 ans, en 1979, dans un pays où une mère sur deux ne travaillait pas, sans congé parental généralisé et avec peu de garde d'enfants subventionnée. En Belgique aujourd'hui, l'effet pourrait être plus faible, ou passer davantage par une réduction du temps de travail que par l'arrêt complet.
- **À d'autres naissances** : c'est l'effet d'un **troisième** enfant, pas d'un premier ou d'un deuxième.
:accord Même réponse (effet local chez les mères dont la décision réagit aux instruments ; pas de généralisation automatique à toutes les mères, aux femmes non mariées ou à la Belgique actuelle). ChatGPT précise qu'avec deux instruments la 2SLS combine les marges induites par les deux compositions.
##d | L'estimation retenue et la conclusion
:enonce
Quelle estimation retenez-vous, et que concluez-vous, en trois phrases au plus ?
:court
Je retiens l'estimation **2SLS** : un troisième enfant réduit le travail de la mère d'environ **5,5 semaines par an** (IC à 95 % : 3 à 8 semaines) et sa probabilité de travailler de 12 points, l'essentiel de l'effet venant de mères qui cessent complètement de travailler. Les MCO donnent un ordre de grandeur proche (−6,2 semaines), mais seule la VI repose sur une variation due au hasard, et elle reste stable quand on ajoute des contrôles. Cette conclusion vaut pour les mères américaines de 1980 qui ont eu un troisième enfant à cause du sexe des deux premiers, et le test de suridentification, à la limite du seuil, invite à la lire comme un ordre de grandeur.
:zero
Même plan que pour la conclusion de la partie 1 : **le résultat chiffré**, **ce qui le rend crédible**, **ses limites**.

Vérifie la cohérence avec ta réponse à la question 2.12 (a). Si tu y as retenu les MCO, ta conclusion doit commencer par −6,2 semaines et dire que la 2SLS confirme l'ordre de grandeur. Si tu y as retenu la 2SLS, garde la version ci-dessus.

**Pourquoi la 2SLS, alors que le test de Hausman ne rejetait pas ?** Parce que ce test, peu puissant, ne prouve pas l'exogénéité, et que les MCO varient de −5,4 à −8,1 selon les contrôles alors que la VI ne bouge presque pas. Suivre strictement le test et retenir les MCO se défend aussi : l'essentiel est de justifier ton choix et d'en donner les limites.
:gpt
Retient −5,46 semaines (IC −7,87 à −3,05) « comme estimation VI de référence pour les familles dont la décision réagit aux instruments » ; mentionne la baisse de participation de 11,90 points ; conclut que la tension du test J et le non-rejet du test d'endogénéité invitent à présenter les MCO ajustés (−6,23) **en parallèle** et à rester prudent sur l'interprétation causale.
:claude
Retient la 2SLS (−5,5 semaines, IC 3 à 8), en donne la raison (variation due au hasard, stabilité aux contrôles), ajoute la part de l'arrêt complet du travail, et borne la portée (mères américaines de 1980, compliers, test de suridentification à la limite).
:verdict
Les deux retiennent le même chiffre de référence, −5,46. Claude assume plus nettement le choix et donne sa raison ; ChatGPT insiste davantage sur la présentation parallèle des MCO. Pour un rapport, une conclusion qui **tranche puis nuance** est préférable à une conclusion qui juxtapose. Assure-toi seulement de ne pas dépasser trois phrases.
:opt claude | 2SLS, avec ses raisons et ses limites
Je retiens l'estimation 2SLS : un troisième enfant réduit le travail de la mère d'environ 5,5 semaines par an (IC à 95 % : 3 à 8 semaines) et sa probabilité de travailler de 12 points, l'essentiel venant de mères qui cessent complètement de travailler. Les MCO donnent un ordre de grandeur proche (−6,2 semaines), mais seule la VI repose sur une variation due au hasard et reste stable quand on ajoute des contrôles. Cette conclusion vaut pour les mères américaines de 1980 qui ont eu un troisième enfant à cause du sexe des deux premiers, et le test de suridentification, à la limite du seuil, invite à la lire comme un ordre de grandeur.
:opt gpt | 2SLS de référence, MCO en parallèle
Je retiens −5,46 semaines (IC à 95 % : −7,87 à −3,05) comme estimation de référence pour les familles dont la décision réagit aux instruments, sous les hypothèses de validité. La baisse de la probabilité de travailler atteint 11,9 points. Le rejet limite du test de suridentification et le non-rejet du test d'endogénéité invitent à présenter aussi les MCO ajustés (−6,23) et à rester prudent sur l'interprétation causale.
:quiz
? Pour quelles mères l'estimation par variables instrumentales mesure-t-elle un effet ?
- Toutes les mères de l'échantillon
- Les mères qui ont trois enfants
+ Les mères qui ont un troisième enfant parce que leurs deux premiers sont de même sexe
> Ce sont les compliers. L'effet est local : il ne dit rien des mères qui auraient eu un troisième enfant de toute façon, ni de celles qui n'en auraient jamais eu.
:oral
? Qui sont les compliers ?
> Les mères qui ont eu un troisième enfant parce que les deux premiers étaient de même sexe, et qui ne l'auraient pas eu avec un garçon et une fille. Elles représentent environ 7 % de l'échantillon. La VI mesure l'effet pour elles seulement.
? Si tu devais résumer la partie 2 en une phrase ?
> Un troisième enfant réduit le travail de la mère d'environ cinq semaines et demie par an, surtout par l'arrêt complet du travail ; ce chiffre repose sur l'hypothèse que le sexe des deux premiers enfants n'agit sur le travail que par le troisième enfant, et ne vaut que pour les mères dont la décision dépend de ce sexe.
:retenir
- Quatre conditions : pertinence (testée), indépendance (plausible), exclusion (le point faible), monotonie.
- L'effet est local : il vaut pour les compliers, environ 7 % des mères.
- 2SLS : −5,5 semaines et −12 points de probabilité de travailler ; environ 80 % de l'effet passe par l'arrêt complet.
- Sargan rejette de justesse (p = 0,0496), Hausman ne rejette pas (p = 0,53) : aucun des deux n'est une preuve.
