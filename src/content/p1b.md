#SEC B | Formes fonctionnelles

#Q 1.6 | Quatre modèles, quatre façons de lire une pente
:enonce
Estimez par les MCO les quatre modèles suivants, en exprimant `prix` et `rev_hab` en milliers d'euros lorsqu'ils sont en niveau : niveau-niveau, log-log, log-niveau, niveau-log. Présentez-les dans un tableau unique (coefficients, erreurs-types, R², nombre d'observations). Interprétez le coefficient de pente de chaque modèle.
:intro
Les quatre modèles relient les deux mêmes variables. La seule chose qui change est **l'endroit où l'on met le logarithme**, et cela change complètement la lecture du coefficient. Si la leçon sur les logarithmes n'est pas fraîche, commence par elle.
:concepts log, mco, lire-r
## | Estimer et interpréter
:court
| Modèle | Pente (erreur-type HC1) | Lecture |
|---|--:|---|
| Niveau-niveau | 18,229 (1,666) | +1 000 € de revenu ↔ **+18 229 €** de prix |
| Log-log | 1,444 (0,149) | +1 % de revenu ↔ **+1,44 %** de prix (élasticité) |
| Log-niveau | 0,0642 (0,0051) | +1 000 € de revenu ↔ **+6,4 %** de prix |
| Niveau-log | 401,17 (45,97) | +1 % de revenu ↔ **+4 012 €** de prix |
:zero
**La règle, en deux lignes.**

- La variable **dépendante** est en log ? L'effet se lit **en pourcentage**. Sinon, dans l'unité de y (ici des milliers d'euros).
- Le **régresseur** est en log ? L'effet se lit « **pour une hausse de 1 %** de x ». Sinon, pour une hausse d'une unité (ici 1 000 €).

Applique-la mécaniquement aux quatre cas.

**Niveau-niveau (18,229).** Rien en log : unités contre unités. Une commune dont le revenu par habitant est supérieur de 1 000 € a, en moyenne, un prix médian supérieur de 18,229 milliers d'euros, soit 18 229 €.

**Log-log (1,444).** Tout en log : pourcentage contre pourcentage. Un revenu supérieur de 1 % va de pair avec un prix supérieur de 1,44 %. C'est une [[élasticité]]. Elle dépasse 1 : le prix augmente **plus que proportionnellement** au revenu.

**Log-niveau (0,0642).** Seul y est en log : pourcentage contre unité. On multiplie par 100 : 1 000 € de revenu en plus vont de pair avec un prix supérieur d'environ 6,4 %. C'est une [[semi-élasticité]]. Valeur exacte : 100 × (exp(0,0642) − 1) = 6,6 %.

**Niveau-log (401,17).** Seul x est en log : unité contre pourcentage. On **divise** par 100 : un revenu supérieur de 1 % va de pair avec un prix supérieur de 401,17 / 100 = 4,01 milliers d'euros, soit environ 4 000 €.

:::piege Le vocabulaire qui coûte des points
On compare des communes entre elles, la même année. Écris « va de pair avec », « est associé à », « une commune dont le revenu est plus élevé a… ». N'écris pas « une hausse du revenu fait monter le prix » : ce serait une affirmation causale, que la question 1.18 te demandera justement de refuser.
:::

**Pourquoi « en milliers d'euros » ?** Uniquement pour obtenir des coefficients lisibles. Diviser une variable par 1 000 multiplie ou divise son coefficient par 1 000, sans rien changer d'autre. Dans un logarithme, changer d'unité ne déplace que la constante : c'est pourquoi les logs peuvent être pris sur les montants en euros.
:res
| | Niveau-niveau | Log-log | Log-niveau | Niveau-log |
|---|--:|--:|--:|--:|
| Variable dépendante | prix (k€) | ln(prix) | ln(prix) | prix (k€) |
| Régresseur | rev_hab (k€) | ln(rev_hab) | rev_hab (k€) | ln(rev_hab) |
| **Pente** | **18,229** (1,666) | **1,444** (0,149) | **0,0642** (0,0051) | **401,17** (45,97) |
| Constante | −146,61 (41,70) | −2,026 (1,513) | 10,984 (0,131) | −3 751,0 (464,9) |
| R² | 0,341 | 0,367 | 0,403 | 0,297 |
| Observations | 551 | 551 | 551 | 551 |

Erreurs-types robustes HC1 entre parenthèses. Les quatre pentes sont très significatives (t entre 8,7 et 12,5). Source : Statbel, 2023.

{{w:formes}}
:code
```r
base <- base %>%
  mutate(prix_k = prix / 1000, rev_k = rev_hab / 1000,   # en milliers d'euros
         lprix = log(prix), lrev = log(rev_hab))          # logarithmes

reg_1_6_nn <- lm(prix_k ~ rev_k, data = base)   # niveau-niveau
reg_1_6_ll <- lm(lprix  ~ lrev,  data = base)   # log-log
reg_1_6_ln <- lm(lprix  ~ rev_k, data = base)   # log-niveau
reg_1_6_nl <- lm(prix_k ~ lrev,  data = base)   # niveau-log

rob <- function(m) coeftest(m, vcov = vcovHC(m, type = "HC1"))
rob(reg_1_6_ll)                    # coefficients et erreurs-types robustes
summary(reg_1_6_ll)$r.squared      # R²
nobs(reg_1_6_ll)                   # nombre d'observations
```

- `lm(y ~ x, data = base)` estime y sur x par les MCO, constante comprise.
- `rob()` est un raccourci défini une fois au début du script, pour ne pas réécrire soixante fois la même ligne. `coeftest()` vient du package `lmtest`, `vcovHC()` du package `sandwich`.
- On aurait pu écrire directement `lm(log(prix) ~ log(rev_hab))` : le résultat est le même.
:accord Les quatre régressions donnent exactement les mêmes coefficients, erreurs-types et R² dans les deux scripts. ChatGPT donne en plus, pour chaque pente, la valeur **exacte** à côté de l'approximation : 1,4475 % pour une hausse de 1 % en log-log, et 3 992 € (au lieu de 4 012 €) en niveau-log. C'est un raffinement : pour une variation de 1 %, l'approximation suffit.
:quiz
? Dans le modèle log-niveau, la pente vaut 0,0642 quand le revenu est en milliers d'euros. Cela signifie que :
- un revenu supérieur de 1 % est associé à un prix supérieur de 0,064 %
+ un revenu supérieur de 1 000 € est associé à un prix supérieur d'environ 6,4 %
- un revenu supérieur de 1 000 € est associé à un prix supérieur de 64 €
> y est en log (effet en pourcentage : on multiplie par 100), x est en niveau (pour une unité, soit 1 000 €).
? L'élasticité de 1,444 est supérieure à 1. Cela veut dire que :
- les prix sont plus élevés que les revenus
+ entre communes, le prix augmente plus que proportionnellement au revenu
- une hausse de revenu de 1 € fait monter le prix de 1,44 €
> Une élasticité relie deux pourcentages : +1 % de revenu, +1,44 % de prix.
:oral
? Pourquoi 1,44 % et pas 1,44 € ?
> Parce que le logarithme est des deux côtés : la pente relie une variation en pourcentage du revenu à une variation en pourcentage du prix. C'est une élasticité.
? Que se passe-t-il si tu exprimes le revenu en euros plutôt qu'en milliers d'euros ?
> Dans les modèles où le revenu est en niveau, la pente est divisée par 1 000. Dans ceux où il est en logarithme, seule la constante change. Rien d'autre ne bouge : ni les t, ni le R², ni les prédictions.

#Q 1.7 | Variations prédites : approximation ou valeur exacte ?
:enonce
Pour une commune dont le revenu par habitant est de 24 000 euros, calculez la variation du prix prédite par chacun des quatre modèles pour (a) une hausse du revenu de 1 000 euros. Faites de même pour (b) un passage de 20 000 à 30 000 euros. Pour les modèles dont la variable dépendante est en logarithme, donnez l'approximation usuelle et la variation exacte. Pourquoi l'écart entre approximation et variation exacte grandit-il de (a) à (b) ? Quel type de relation chacun des quatre modèles impose-t-il aux données ?
:intro
Cette question fait calculer la même chose de deux façons, pour montrer **quand la lecture rapide d'un coefficient en logarithme cesse d'être fiable**. L'outil de la question 1.6 refait tous ces calculs : règle le revenu de départ et d'arrivée.
:concepts log
## | Les deux cas et leur comparaison
:court
(a) De 24 000 à 25 000 € : les quatre modèles prédisent **+16 400 à +18 300 €**, soit +5,5 à +6,6 %, et l'approximation est presque exacte. (b) De 20 000 à 30 000 € : **+163 000 à +192 000 €**, et l'approximation se trompe lourdement (64 % au lieu de 90 % pour le log-niveau). L'approximation est une formule valable pour de **petites** variations ; son erreur croît comme le carré de la variation.
:zero
**Les formules.** Le revenu passe de $r₀$ à $r₁$ (en milliers d'euros).

| Modèle | Approximation usuelle | Variation exacte |
|---|---|---|
| Niveau-niveau | — | $Δprix = β₁ (r₁ − r₀)$ |
| Log-log | $%Δprix ≈ β₁ × %Δrev$ | $%Δprix = 100 × [(r₁ / r₀)^{β₁} − 1]$ |
| Log-niveau | $%Δprix ≈ 100 × β₁ (r₁ − r₀)$ | $%Δprix = 100 × [\exp(β₁ (r₁ − r₀)) − 1]$ |
| Niveau-log | — | $Δprix = β₁ × [\ln(r₁) − \ln(r₀)]$ |

Les modèles en niveau n'ont pas d'« approximation » : leur variable dépendante est en euros, le calcul est direct.

**Un exemple entièrement détaillé : le log-log, cas (b).** Le revenu augmente de 50 %.

- Approximation usuelle : 1,444 × 50 % = **72,2 %**.
- Calcul exact : le modèle dit $\ln(prix) = β₀ + 1,444 × \ln(rev)$. La variation de ln(prix) vaut donc 1,444 × ln(30 000 / 20 000) = 1,444 × 0,4055 = 0,5856. Pour revenir à un pourcentage : 100 × (exp(0,5856) − 1) = **79,6 %**.

**Pourquoi l'écart grandit-il ?** L'approximation repose sur deux raccourcis : $\exp(z) − 1 ≈ z$ et $\ln(1 + g) ≈ g$. Ils remplacent une courbe par sa tangente. Près du point de départ, la tangente colle à la courbe ; plus on s'éloigne, plus elle s'en écarte. L'erreur est de l'ordre de $z² / 2$ : elle croît comme le **carré** de la variation.

| | (a) | (b) |
|---|--:|--:|
| Variation du log-prix dans le log-niveau (z) | 0,064 | 0,642 |
| Erreur de l'approximation | 0,2 point | 25,8 points |

Une variation dix fois plus grande donne une erreur environ cent fois plus grande.

**Quel type de relation chaque modèle impose-t-il ?**

| Modèle | Ce qui est constant | Forme de la courbe prix-revenu |
|---|---|---|
| Niveau-niveau | l'effet **en euros** de 1 000 € de revenu (18 229 €) | une droite |
| Log-log | l'**élasticité** (1,44) | convexe : en euros, l'effet de 1 000 € grandit avec le revenu |
| Log-niveau | la **semi-élasticité** (+6,4 % par 1 000 €) | exponentielle, convexe elle aussi |
| Niveau-log | l'effet en euros de **1 %** de revenu (4 012 €) | concave : l'effet de 1 000 € diminue quand le revenu monte |

Le nuage de la question 1.5 s'incurve vers le haut : les modèles convexes (log-log, log-niveau) lui conviennent mieux que le modèle concave (niveau-log), qui a d'ailleurs le plus petit R².
:res
**(a) De 24 000 à 25 000 € (+1 000 €, soit +4,17 %)**

| Modèle | Prix prédit à 24 000 € | Variation en € | Approximation | Variation exacte |
|---|--:|--:|--:|--:|
| Niveau-niveau | 290 889 € | +18 229 € | — | +6,27 % |
| Log-log | 279 371 € | +16 967 € | +6,02 % | +6,07 % |
| Log-niveau | 275 281 € | +18 256 € | +6,42 % | +6,63 % |
| Niveau-log | 295 099 € | +16 377 € | — | +5,55 % |

**(b) De 20 000 à 30 000 € (+10 000 €, soit +50 %)**

| Modèle | Prix prédit à 20 000 € | Variation en € | Approximation | Variation exacte |
|---|--:|--:|--:|--:|
| Niveau-niveau | 217 973 € | +182 291 € | — | +83,6 % |
| Log-log | 214 695 € | +170 914 € | +72,2 % | +79,6 % |
| Log-niveau | 212 927 € | +191 739 € | +64,2 % | +90,0 % |
| Niveau-log | 221 957 € | +162 660 € | — | +73,3 % |

Pour exprimer en euros les modèles dont la variable dépendante est en log, on part du prix prédit $\exp(β₀ + β₁ x)$. Pour les modèles en niveau, le pourcentage rapporte la variation au prix prédit de départ.
:code
```r
b_ll <- coef(reg_1_6_ll)[2]              # la pente du log-log
r0 <- 20; r1 <- 30                       # en milliers d'euros

b_ll * (r1 - r0) / r0 * 100              # approximation : 72,2 %
100 * ((r1 / r0)^b_ll - 1)               # exacte : 79,6 %

b_ln <- coef(reg_1_6_ln)[2]              # la pente du log-niveau
100 * b_ln * (r1 - r0)                   # approximation : 64,2 %
100 * (exp(b_ln * (r1 - r0)) - 1)        # exacte : 90,0 %
```

`coef(m)` renvoie le vecteur des coefficients ; `[2]` prend le deuxième, la pente (le premier est la constante). `exp()` est l'exponentielle, l'opération inverse du logarithme.
:gpt
Mêmes variations en euros et mêmes variations exactes. Présente **deux** approximations pour les modèles en log : l'« approximation locale » (β × %Δrev, soit 6,02 % et 72,2 % en log-log) et « 100 Δln(P) », la variation du log-prix lue directement comme un pourcentage (5,90 % et 58,6 %). Explique l'écart par la courbure du logarithme et de l'exponentielle.
:claude
Une seule approximation par modèle, celle du cours : β₁ × %Δrev pour le log-log, 100 × β₁ × Δrev pour le log-niveau. Explique l'écart par un développement limité : l'erreur est d'ordre z²/2, donc cent fois plus grande pour une variation dix fois plus grande.
:verdict
Tous les chiffres communs sont identiques. La différence porte sur ce qu'on appelle « l'approximation usuelle ». Pour le log-log, celle des manuels est **β₁ × %Δrev** : c'est la lecture même de l'élasticité. La colonne supplémentaire de ChatGPT (58,6 %) est un autre raccourci, qui n'approche que le côté « prix » ; la donner en plus risque de brouiller la réponse, et tu devrais expliquer à l'oral d'où elle vient. L'explication de Claude (erreur en z²) est plus précise et répond directement au « pourquoi ». Conseil : une seule approximation par modèle, et l'argument du carré.
:opt claude | Une approximation par modèle, erreur en z²
Je donne pour le log-log l'approximation β₁ × %Δrev et pour le log-niveau 100 × β₁ × Δrev, puis la variation exacte. L'écart passe de 0,2 point en (a) à 26 points en (b) pour le log-niveau, parce que l'approximation remplace exp(z) − 1 par z : l'erreur est de l'ordre de z²/2 et croît comme le carré de la variation.
:opt gpt | Deux approximations pour les modèles en log
Je donne l'approximation locale (β × %Δrev) et la lecture directe de 100 × Δln(prix) comme un pourcentage, puis la variation exacte. Les trois s'écartent davantage sur un grand intervalle car le logarithme et l'exponentielle sont courbes.
:piege
Dans le cas (b), ne lis pas le coefficient du log-niveau « à la volée » : 0,0642 × 10 = 0,642 ne veut **pas** dire +64 %. La variation exacte est de +90 %. Dès que le produit dépasse 0,1 environ, passe à la formule avec l'exponentielle.
:quiz
? L'approximation « 100 × β » pour un coefficient en logarithme est fiable :
- toujours
+ pour les petites variations seulement
- pour les grandes variations seulement
> Elle remplace une courbe par sa tangente. L'erreur croît comme le carré de la variation.
? Quel modèle impose que 1 000 € de revenu en plus aient un effet en euros de plus en plus faible quand le revenu monte ?
- le log-log
- le niveau-niveau
+ le niveau-log
> Dans le niveau-log, l'effet est constant pour 1 % de revenu. Or 1 000 € représentent un pourcentage de plus en plus petit quand le revenu augmente : la relation est concave.
:oral
? Pourquoi l'approximation est-elle bonne en (a) et mauvaise en (b) ?
> Parce qu'elle remplace exp(z) − 1 par z, ce qui n'est juste que pour un petit z. En (a), z vaut 0,06 et l'erreur est de 0,2 point ; en (b), z vaut 0,64 et l'erreur atteint 26 points. L'erreur croît comme le carré de la variation.

#Q 1.8 | Peut-on choisir un modèle à son R² ?
:enonce
Un·e collègue retient le modèle log-log parce que son R² est plus élevé que celui du modèle niveau-niveau. Discutez cet argument. Quels critères utiliseriez-vous pour choisir, à la lumière des questions 1.4 à 1.7 ? Dans la suite, on retient le modèle log-log.
:concepts mco, log
## | L'argument et les bons critères
:court
**L'argument ne tient pas.** Le R² du log-log (0,367) est la part expliquée de la variance de **ln(prix)** ; celui du niveau-niveau (0,341), la part expliquée de la variance de **prix**. Ce sont deux variables différentes : les deux R² ne sont pas comparables. On choisit le log-log pour son **interprétation** (une élasticité), la **symétrie** de ln(prix) et la **forme du nuage**, pas pour son R².
:zero
Le [[R²]] est une proportion : « quelle part de la dispersion de y le modèle explique-t-il ? ». Changer y, c'est changer la dispersion à expliquer. Comparer 0,367 et 0,341 revient à comparer une note sur 20 et une note sur 100 sans regarder le barème.

**Les comparaisons qui, elles, sont valables.**

- **Même variable dépendante.** Sur ln(prix), le log-niveau (0,403) fait mieux que le log-log (0,367). Sur prix, le niveau-niveau (0,341) fait mieux que le niveau-log (0,297).
- **Même échelle.** On ramène les prédictions du log-log en euros, puis on calcule le carré de leur corrélation avec le prix observé : 0,357, contre 0,341 pour le niveau-niveau. Le log-log reste un peu meilleur, mais l'écart est faible.

**Les critères à utiliser**, avec ce que les questions précédentes ont montré.

1. **L'interprétation économique.** Un effet proportionnel (une élasticité) est plus plausible pour des prix et des revenus, et il ne dépend pas des unités. Le niveau-niveau prédirait d'ailleurs un prix **négatif** pour un revenu inférieur à 8 043 € (146,61 / 18,229).
2. **La distribution (question 1.4).** ln(prix) est symétrique, ce qui limite le poids des communes très chères.
3. **La forme du nuage (question 1.5).** En niveaux, relation convexe et dispersion croissante ; en logarithmes, bande plus régulière.
4. **La qualité d'ajustement**, mais seulement entre modèles comparables.

:::astuce Ce qu'il faut savoir répondre si on insiste
« Votre log-niveau a un R² plus élevé que votre log-log, pourquoi ne pas le prendre ? » Entre ces deux-là, la comparaison est légitime, et le log-niveau s'ajuste un peu mieux. On garde le log-log pour son interprétation en élasticité et parce que l'énoncé l'impose pour la suite ; l'écart de R² (0,403 contre 0,367) est modeste.
:::
:gpt
Les deux R² portent sur deux dispersions différentes ; avec ln(prix) à gauche, le log-niveau atteint d'ailleurs 0,403. Retient le log-log « pour son élasticité, le nuage de points et l'usage demandé dans la suite ». Propose, pour départager des modèles prédictifs, de comparer leurs **erreurs hors échantillon** sur une même échelle.
:claude
Même diagnostic, avec l'image de la note sur 20 et sur 100. **Recalcule** un R² du log-log sur l'échelle des prix (0,357 contre 0,341), signale le prix négatif prédit par le niveau-niveau sous 8 043 €, et liste quatre critères reliés aux questions 1.4 à 1.7.
:verdict
Même conclusion. Claude répond plus complètement à la seconde moitié de la question (« quels critères, à la lumière des questions 1.4 à 1.7 ») et chiffre la comparaison sur une même échelle, ce qui montre que tu sais **faire** une comparaison valable, pas seulement dire que l'autre ne l'est pas. L'idée de ChatGPT (erreur de prévision hors échantillon) est juste mais sort du cadre du cours.
:opt claude | Deux R² non comparables, puis quatre critères
L'argument ne tient pas : les deux R² mesurent la part expliquée de deux variables différentes, ln(prix) et prix. Ramené sur l'échelle des prix, le log-log explique 35,7 % de la variance contre 34,1 % pour le niveau-niveau : il reste un peu meilleur, mais ce n'est pas un argument décisif. Je choisis le log-log pour son interprétation (une élasticité, plus plausible qu'un effet constant en euros), pour la symétrie de ln(prix) et pour la forme du nuage, plus régulière en logarithmes.
:opt gpt | Deux R² non comparables, critère de prévision
Les deux R² portent sur des dispersions différentes et ne se comparent pas. Je retiens le log-log pour son élasticité et la forme du nuage. Pour départager des modèles sur leur qualité de prédiction, il faudrait comparer leurs erreurs sur une même échelle.
:code
```r
# R² du log-log recalculé sur l'échelle des prix
cor(base$prix_k, exp(fitted(reg_1_6_ll)) / 1000)^2    # 0,357
summary(reg_1_6_nn)$r.squared                         # 0,341
```

`fitted(m)` renvoie les valeurs ajustées, ici des ln(prix) prédits. `exp()` les ramène en euros. Le carré de la corrélation entre le prix observé et ce prix prédit est un R² comparable à celui du modèle en niveaux.
:quiz
? Lesquels de ces R² peut-on comparer directement ?
- log-log (0,367) et niveau-niveau (0,341)
+ log-log (0,367) et log-niveau (0,403)
- log-niveau (0,403) et niveau-log (0,297)
> Seuls les modèles qui ont la même variable dépendante, ici ln(prix), ont des R² comparables.
:oral
? Pourquoi avoir retenu le log-log si ce n'est pas pour son R² ?
> Pour son interprétation : la pente est une élasticité, un effet proportionnel plus crédible qu'un effet constant en euros entre une commune à 95 000 € et une à 840 000 €. S'y ajoutent la symétrie de ln(prix) et un nuage plus régulier en logarithmes.

#SEC C | Régions

#Q 1.9 | Ajouter la région : des droites parallèles
:enonce
Ajoutez au modèle log-log des indicatrices de région, avec la Flandre comme catégorie de référence.
:intro
Le nuage de la question 1.5 montrait trois paquets de couleurs. On donne maintenant à chaque région **sa propre hauteur**, tout en gardant une pente commune.

$$ \ln(prix_{i}) = β₀ + β₁ \ln(rev\_hab_{i}) + δ_{W} Wallonie_{i} + δ_{B} Bruxelles_{i} + u_{i} $$

{{w:nuage modele=paralleles titre="Le modèle 1.9 : trois droites parallèles"}}
:concepts indicatrices, log
##a | Interpréter les deux indicatrices
:enonce
Interprétez les coefficients des deux indicatrices.
:court
**Wallonie : −0,205.** À revenu par habitant égal, le prix médian d'une commune wallonne est inférieur de **18,5 %** à celui d'une commune flamande. **Bruxelles : +0,895.** À revenu égal, il est supérieur de **145 %**, soit 2,45 fois plus élevé.
:zero
Une commune flamande a `Wallonie = 0` et `Bruxelles = 0` : c'est la [[catégorie de référence]]. Écris l'équation pour chaque région.

| Région | Équation de sa droite | Hauteur |
|---|---|--:|
| Flandre | $\ln(prix) = β₀ + β₁ \ln(rev)$ | −3,614 |
| Wallonie | $\ln(prix) = (β₀ + δ_{W}) + β₁ \ln(rev)$ | −3,819 |
| Bruxelles | $\ln(prix) = (β₀ + δ_{B}) + β₁ \ln(rev)$ | −2,719 |

Même pente (1,608), hauteurs différentes : **trois droites parallèles**. Le coefficient d'une indicatrice est l'écart vertical entre la droite de cette région et celle de la Flandre.

**Passer du coefficient au pourcentage.** L'écart est mesuré en logarithmes. Pour une indicatrice, la variation n'est pas « petite » : on passe d'un coup de 0 à 1. Il faut donc la formule exacte :

$$ \text{écart en %} = 100 × (\exp(δ) − 1) $$

- Wallonie : 100 × (exp(−0,205) − 1) = **−18,5 %**. Ici l'approximation (−20,5 %) n'était pas loin.
- Bruxelles : 100 × (exp(0,895) − 1) = **+144,7 %**. L'approximation aurait donné +89,5 % : complètement faux.

Remarque au passage le R² : il passe de 0,367 à **0,757**. Les régions expliquent une grande partie des écarts de prix entre communes.
:res
| | Coefficient | Erreur-type HC1 | t |
|---|--:|--:|--:|
| Constante | −3,614 | 0,752 | −4,8 |
| ln(rev_hab) | 1,608 | 0,074 | 21,7 |
| Wallonie | −0,205 | 0,017 | −12,3 |
| Bruxelles | 0,895 | 0,055 | 16,4 |

R² = 0,757 ; 551 communes.
:code
```r
base$region <- factor(base$region, levels = c("Flandre", "Wallonie", "Bruxelles"))
reg_1_9 <- lm(lprix ~ lrev + region, data = base)
rob(reg_1_9)

100 * (exp(coef(reg_1_9)[c("regionWallonie", "regionBruxelles")]) - 1)   # -18,5 et +144,7
```

Quand un régresseur est un **facteur**, R crée tout seul une indicatrice par catégorie, sauf la première, qui sert de référence. L'ordre donné dans `levels = c(...)` décide donc de la référence : ici la Flandre. Les coefficients s'appellent `regionWallonie` et `regionBruxelles` (nom de la variable collé à celui de la catégorie).
:accord Mêmes coefficients, et la même formule exacte 100 × (exp(δ) − 1) : −18,53 % et +144,72 %. Les deux versions soulignent qu'on ne peut pas lire +0,895 comme « +89,5 % ».
##b | Pourquoi pas trois indicatrices et la constante ?
:enonce
Pourquoi ne peut-on pas inclure dans le modèle les trois indicatrices de région et la constante ?
:court
Parce que, pour chaque commune, Flandre + Wallonie + Bruxelles = 1, exactement comme la colonne de la constante. Les régresseurs seraient **parfaitement colinéaires** : les MCO n'auraient pas de solution unique. C'est le **piège des variables indicatrices**.
:zero
Trois régions, trois hauteurs à estimer. Avec la constante et trois indicatrices, on aurait **quatre** nombres pour décrire **trois** hauteurs : il y a un nombre de trop.

Concrètement, on pourrait ajouter n'importe quelle valeur $c$ à la constante et retrancher $c$ aux trois indicatrices sans changer une seule prédiction :

| | Constante | Flandre | Wallonie | Bruxelles | Hauteur Flandre | Hauteur Wallonie |
|---|--:|--:|--:|--:|--:|--:|
| Solution 1 | −3,614 | 0 | −0,205 | 0,895 | −3,614 | −3,819 |
| Solution 2 | 0 | −3,614 | −3,819 | −2,719 | −3,614 | −3,819 |
| Solution 3 | 10 | −13,614 | −13,819 | −12,719 | −3,614 | −3,819 |

Une infinité de jeux de coefficients donnent exactement le même modèle : les données ne peuvent pas choisir entre eux. Mathématiquement, la matrice $X'X$ n'est pas inversible ; l'hypothèse d'**absence de [[colinéarité parfaite]]** est violée.

R ne plante pas : il détecte le problème, retire une variable et affiche `NA` pour son coefficient.
:accord Même explication (la somme des trois indicatrices reproduit la constante, d'où une colinéarité parfaite). Claude ajoute l'illustration « ajouter c à la constante et le retrancher aux indicatrices », qui est la façon la plus simple de le faire comprendre à l'oral.
:quiz
? Le coefficient de l'indicatrice Bruxelles vaut 0,895. À revenu égal, par rapport à une commune flamande, le prix médian à Bruxelles est :
- supérieur de 89,5 %
- supérieur de 0,895 %
+ supérieur d'environ 145 %
> Pour une indicatrice dans un modèle en log, l'écart exact est 100 × (exp(0,895) − 1) = 144,7 %.
:oral
? Comment lis-tu un coefficient d'indicatrice dans un modèle dont la variable dépendante est en logarithme ?
> C'est un écart en logarithmes par rapport à la catégorie de référence, toutes choses égales par ailleurs. Je le convertis en pourcentage avec 100 × (exp(δ) − 1), parce que l'approximation 100 × δ n'est valable que pour un petit δ.

#Q 1.10 | Changer de référence à la main
:enonce
Sans réestimer le modèle, calculez à partir des coefficients de la question 1.9 la valeur de tous les coefficients (constante, élasticité, indicatrices) que vous obtiendriez avec la Wallonie comme catégorie de référence. Détaillez chaque calcul. Interprétez le coefficient de l'indicatrice Bruxelles.
:intro
Changer de catégorie de référence ne change pas le modèle : ce sont les mêmes trois droites, décrites depuis un autre point de vue. L'outil ci-dessous fait le calcul pour les trois références possibles.

{{w:reference}}
:concepts indicatrices
## | Les quatre calculs
:court
| Nouveau coefficient | Calcul | Valeur |
|---|---|--:|
| Constante | −3,614 + (−0,205) | **−3,819** |
| Élasticité | inchangée | **1,608** |
| Indicatrice Flandre | −(−0,205) | **+0,205** |
| Indicatrice Bruxelles | 0,895 − (−0,205) | **+1,100** |

À revenu égal, le prix médian d'une commune bruxelloise est **trois fois** celui d'une commune wallonne (+200 %).
:zero
Pars de la seule chose qui ne dépend pas de la référence : **la hauteur de chaque droite**.

| Région | Hauteur de sa droite |
|---|--:|
| Flandre | $β₀$ = −3,614 |
| Wallonie | $β₀ + δ_{W}$ = −3,614 − 0,205 = −3,819 |
| Bruxelles | $β₀ + δ_{B}$ = −3,614 + 0,895 = −2,719 |

Avec la Wallonie en référence, deux règles suffisent :

- la **nouvelle constante** est la hauteur de la droite de la **nouvelle référence** : −3,819 ;
- chaque **indicatrice** est la hauteur de sa région **moins** celle de la référence.

Donc : Flandre = −3,614 − (−3,819) = **+0,205** (le même écart qu'avant, signe inversé). Bruxelles = −2,719 − (−3,819) = **+1,100**.

L'**élasticité** ne bouge pas : les trois droites ont la même pente, quel que soit le point de vue.

**Interprétation de Bruxelles.** À revenu par habitant égal, le prix médian d'une commune bruxelloise dépasse celui d'une commune wallonne de 100 × (exp(1,100) − 1) = **+200 %** : il est trois fois plus élevé.

:::piege Deux erreurs fréquentes
- Écrire « +110 % » en lisant 1,100 directement. La valeur exacte est +200 %.
- Additionner les pourcentages (18,5 % + 144,7 %). Les écarts s'additionnent **en logarithmes** (0,205 + 0,895 = 1,100), pas en pourcentages.
:::
:accord Mêmes quatre valeurs (−3,8187 ; 1,6078 ; +0,2049 ; +1,0999) et même interprétation (+200,4 %, soit un rapport de 3,004). ChatGPT met lui aussi en garde contre la lecture « 110 % de plus ».
:quiz
? Avec Bruxelles comme catégorie de référence, que vaudrait le coefficient de l'indicatrice Wallonie ?
- +1,100
+ −1,100
- −0,205
> C'est la hauteur de la Wallonie moins celle de Bruxelles : −3,819 − (−2,719) = −1,100. Le même écart que Bruxelles par rapport à la Wallonie, signe inversé.
:oral
? Comment retrouves-tu les coefficients sans réestimer ?
> Chaque région a une hauteur de droite, qui ne dépend pas de la référence. La nouvelle constante est la hauteur de la nouvelle référence, et chaque indicatrice est la différence entre la hauteur de sa région et celle de la référence. La pente est commune, donc inchangée.

#Q 1.11 | Vérifier avec relevel()
:enonce
Réestimez le modèle avec la Wallonie comme catégorie de référence (fonction `relevel()`) et comparez aux valeurs calculées à la question 1.10. Qu'est-ce qui change, et qu'est-ce qui ne change pas ?
:concepts indicatrices
## | Ce qui change, ce qui ne change pas
:court
R redonne **exactement** les valeurs calculées à la main (−3,819 ; 1,608 ; +0,205 ; +1,100). **Changent** : la constante et les indicatrices (valeur, sens et erreur-type), donc les hypothèses testées. **Ne changent pas** : l'élasticité et son erreur-type, les valeurs ajustées, les résidus, le R² (0,757).
:zero
C'est le même modèle, écrit autrement. Tout ce qui décrit **l'ajustement** est identique ; tout ce qui décrit **un écart à la référence** est redéfini.

| | Ne change pas | Change |
|---|---|---|
| Coefficients | l'élasticité (1,608) | la constante, les indicatrices |
| Erreurs-types | celle de l'élasticité (0,074) | celles de la constante et des indicatrices |
| Ajustement | valeurs ajustées, résidus, R², nombre d'observations | — |
| Ce qu'on teste | — | Bruxelles **contre la Wallonie**, et non plus contre la Flandre |

Un détail qui montre que tu as compris : l'erreur-type de Bruxelles passe de 0,055 à 0,052. Ce n'est plus la même quantité. Avant, on mesurait l'écart Bruxelles-Flandre ($δ_{B}$) ; maintenant l'écart Bruxelles-Wallonie ($δ_{B} − δ_{W}$), dont la précision dépend de la covariance entre les deux estimateurs. L'écart Flandre-Wallonie, lui, garde la même erreur-type (0,017) : seul son signe s'inverse.
:res
| | Référence Flandre (1.9) | Référence Wallonie (1.11) |
|---|--:|--:|
| Constante | −3,614 (0,752) | −3,819 (0,743) |
| ln(rev_hab) | 1,608 (0,074) | 1,608 (0,074) |
| Wallonie | −0,205 (0,017) | — |
| Flandre | — | +0,205 (0,017) |
| Bruxelles | +0,895 (0,055) | +1,100 (0,052) |
| R² | 0,757 | 0,757 |
:code
```r
base$region_w <- relevel(base$region, ref = "Wallonie")
reg_1_11 <- lm(lprix ~ lrev + region_w, data = base)
rob(reg_1_11)

all.equal(fitted(reg_1_9), fitted(reg_1_11))    # TRUE : mêmes valeurs ajustées
```

`relevel()` déplace une catégorie en première position du facteur, donc en référence. `all.equal()` vérifie que deux objets sont égaux, à une erreur d'arrondi près : c'est la preuve que les deux écritures décrivent le même modèle.
:accord Mêmes coefficients et même liste de ce qui change et ne change pas. Les deux scripts vérifient par le code que les valeurs ajustées sont identiques ; ChatGPT vérifie en plus que les quatre valeurs calculées à la main coïncident avec les coefficients réestimés (`stopifnot(max(abs(calcules - coef(m11))) < 1e-9)`).
:oral
? Changer de catégorie de référence change-t-il les conclusions ?
> Non. Les prédictions, les résidus, le R² et l'élasticité sont identiques. Seule change la question que posent les indicatrices : un écart par rapport à la Wallonie au lieu d'un écart par rapport à la Flandre.

#Q 1.12 | Pourquoi l'élasticité change : le biais de variable omise
:intro
L'élasticité valait 1,444 sans les régions (question 1.6) et vaut 1,608 avec (question 1.9). Cette question explique pourquoi, puis te fait retrouver l'un des deux chiffres à partir de l'autre, **à la quatrième décimale**. C'est la démonstration la plus élégante du travail.

{{w:bvo}}
:concepts hypotheses, indicatrices
##a | Pourquoi deux élasticités différentes ?
:enonce
L'élasticité estimée à la question 1.9 diffère de celle du modèle log-log de la question 1.6. Pourquoi ces deux coefficients sont-ils différents ?
:court
Parce que le modèle 1.6 **omet la région**, qui influence le prix **et** est corrélée au revenu. Son élasticité (1,444) mélange deux choses : la relation entre prix et revenu **à l'intérieur** des régions, et les différences de prix et de revenu **entre** régions. C'est un [[biais de variable omise]].
:zero
Dans le modèle 1.6, tout ce qui n'est pas le revenu se retrouve dans le terme d'erreur, région comprise. Or la région remplit les deux conditions qui créent un biais :

1. elle **influence le prix** : à revenu égal, on paie moins cher en Wallonie et beaucoup plus cher à Bruxelles ;
2. elle est **liée au revenu** : les communes wallonnes et bruxelloises ont en moyenne des revenus plus faibles.

Le coefficient du revenu « ramasse » alors une partie de l'effet de la région. Le modèle 1.9 retire cet effet : son élasticité (1,608) compare des communes **d'une même région**.
:accord Même explication : la pente simple mélange les différences au sein des régions et les différences entre régions.
##b | Retrouver exactement 1,444
:enonce
Estimez la régression de l'indicatrice Wallonie sur log(rev_hab), puis celle de l'indicatrice Bruxelles sur log(rev_hab). À l'aide des coefficients de ces deux régressions et de ceux de la question 1.9, retrouvez exactement l'élasticité de la question 1.6. Détaillez le calcul.
:court
$$ 1,6078 + (−0,2049) × (−1,1457) + 0,8949 × (−0,4451) = 1,6078 + 0,2348 − 0,3983 = 1,4443 $$

C'est exactement l'élasticité de la question 1.6.
:zero
La formule du biais de variable omise, avec deux variables omises :

$$ \text{élasticité courte} = \text{élasticité longue} + δ_{W} × π_{W} + δ_{B} × π_{B} $$

Chaque variable omise ajoute un terme, qui est le produit de deux nombres :

- $δ$ : **son effet sur le prix** dans le modèle long (question 1.9) ;
- $π$ : **son lien avec le revenu**, c'est-à-dire la pente de la régression de l'indicatrice sur ln(rev_hab).

Les deux régressions « auxiliaires » donnent les $π$ :

| Régression | Pente sur ln(rev_hab) | Lecture |
|---|--:|---|
| Wallonie ~ ln(rev_hab) | $π_{W}$ = −1,1457 (0,169) | plus le revenu est élevé, moins la commune a de chances d'être wallonne |
| Bruxelles ~ ln(rev_hab) | $π_{B}$ = −0,4451 (0,107) | idem pour Bruxelles |

Le calcul, terme à terme :

| Terme | Calcul | Valeur |
|---|---|--:|
| Élasticité du modèle long (1.9) | $β₁$ | 1,6078 |
| Contribution de la Wallonie | (−0,2049) × (−1,1457) | +0,2348 |
| Contribution de Bruxelles | 0,8949 × (−0,4451) | −0,3983 |
| **Somme** | | **1,4443** |
| Élasticité du modèle court (1.6) | | 1,4443 |

:::cle « Exactement », pas « à peu près »
L'égalité est une propriété algébrique des MCO, vraie sur n'importe quel échantillon, pas une approximation statistique. C'est pour cela que l'énoncé écrit « retrouvez exactement ». Garde quatre décimales dans ton rapport pour le montrer.
:::
:code
```r
base <- base %>% mutate(wallonie  = as.numeric(region == "Wallonie"),
                        bruxelles = as.numeric(region == "Bruxelles"))
reg_1_12_w <- lm(wallonie  ~ lrev, data = base)     # pente π_W
reg_1_12_b <- lm(bruxelles ~ lrev, data = base)     # pente π_B

b <- coef(reg_1_9)
b["lrev"] + b["regionWallonie"]  * coef(reg_1_12_w)[2] +
            b["regionBruxelles"] * coef(reg_1_12_b)[2]      # 1,4443
coef(reg_1_6_ll)["lrev"]                                    # 1,4443
```

`as.numeric(region == "Wallonie")` fabrique l'indicatrice à la main : la comparaison renvoie `TRUE` ou `FALSE`, que `as.numeric()` transforme en 1 ou 0. On accède à un coefficient par son nom : `b["lrev"]`.
:accord Mêmes pentes auxiliaires (−1,1457 et −0,4451), mêmes contributions (+0,2348 et −0,3983) et même somme (1,4443). Les deux scripts vérifient l'égalité par le code ; ChatGPT l'impose même avec un `stopifnot()` qui arrêterait le script si elle était fausse.
##c | Le signe de chaque contribution
:enonce
Expliquez le signe de la contribution de chaque région, en vous aidant du graphique de la question 1.5.
:court
**Wallonie : (−) × (−) = +0,235.** Les communes wallonnes sont plus pauvres *et* moins chères à revenu égal : elles tirent le bas de la droite vers le bas, ce qui la rend plus pentue. **Bruxelles : (+) × (−) = −0,398.** Les communes bruxelloises sont plus pauvres *mais* beaucoup plus chères : elles relèvent le bas de la droite, ce qui l'aplatit. L'effet bruxellois l'emporte.
:zero
Le signe d'une contribution est le produit de deux signes : **effet de la région sur le prix** × **lien de la région avec le revenu**.

Regarde le nuage (modèle « Une seule droite ») en te demandant où se trouve chaque région.

- **Wallonie** : à gauche (revenus faibles) et sous la droite (prix bas). Une droite qui veut passer près de ces points doit descendre à gauche : elle devient **plus raide**. Omettre la Wallonie *gonfle* l'élasticité.
- **Bruxelles** : à gauche aussi, mais très au-dessus (prix élevés). Une droite attirée par ces points doit remonter à gauche : elle devient **plus plate**. Omettre Bruxelles *écrase* l'élasticité.

Les deux effets vont en sens contraire. Le bruxellois (−0,398) est plus fort que le wallon (+0,235) : au total, l'élasticité sans régions **sous-estime** de 0,163 celle qui vaut à l'intérieur des régions.

Vérifie-le avec l'outil en haut de la page : choisis « Sans Bruxelles », l'écart change de signe.
:accord Même lecture des deux signes et même conclusion (la contribution négative de Bruxelles domine).
##d | « 1.9 est la bonne, 1.6 est biaisée » ?
:enonce
Un·e collègue affirme que l'élasticité de la question 1.9 est « la bonne » et que celle de la question 1.6 est « biaisée ». Êtes-vous d'accord ?
:court
**Pas entièrement : tout dépend de la question posée.** Pour comparer des communes d'une même région, 1.9 est la bonne mesure, et 1.6 est biaisée de −0,16 *pour ce paramètre-là*. Pour décrire l'association sur l'ensemble de la Belgique, 1.6 répond correctement à cette autre question. Et **aucune des deux n'est un effet causal**.
:zero
« Biaisé » n'a de sens que par rapport à ce qu'on cherche à mesurer.

| Ce qu'on veut savoir | La bonne élasticité |
|---|---|
| « Si je prends deux communes **de la même région**, de combien leurs prix diffèrent-ils quand leurs revenus diffèrent de 1 % ? » | 1.9 (1,608) |
| « Si je ne connais **que le revenu** d'une commune belge, quel prix prédire ? » | 1.6 (1,444) |
| « Si le revenu des habitants **augmentait**, de combien le prix monterait-il ? » | Aucune des deux |

Le collègue a raison sur un point : 1.6 est une mauvaise estimation de la relation *à région donnée*. Il a tort de croire que 1.9 est « la » bonne : elle peut elle-même être biaisée par d'autres variables omises, à l'intérieur des régions cette fois (localisation, qualité des logements). Ajouter un contrôle retire **un** biais, pas tous les biais.
:accord Même position nuancée dans les deux versions : l'élasticité « juste » dépend du paramètre visé, et parler d'effet causal exigerait en plus l'exogénéité du revenu à l'intérieur des régions (question 1.18).
:quiz
? Une variable omise est liée négativement au revenu et a un effet positif sur le prix. L'omettre :
- gonfle le coefficient du revenu
+ réduit le coefficient du revenu
- ne change pas le coefficient du revenu
> Biais = (effet sur y) × (lien avec x) = (+) × (−) = négatif. C'est le cas de Bruxelles.
? Sans les communes bruxelloises, omettre la région :
- ne créerait aucun biais
- sous-estimerait toujours l'élasticité
+ surestimerait l'élasticité
> Il ne resterait que la contribution wallonne, positive : (−) × (−). L'outil le montre avec « Sans Bruxelles ».
:oral
? Pourquoi l'élasticité passe-t-elle de 1,44 à 1,61 quand tu ajoutes les régions ?
> Par biais de variable omise : la région influence le prix et est corrélée au revenu. La Wallonie, pauvre et bon marché, gonfle la pente de 0,23 ; Bruxelles, pauvre mais chère, l'écrase de 0,40. L'effet bruxellois domine, et la formule 1,608 + 0,235 − 0,398 redonne exactement 1,444.
? Alors 1,61 est-elle la vraie élasticité ?
> C'est la bonne mesure de l'association entre communes d'une même région. Mais ce n'est pas un effet causal : d'autres variables omises, comme la localisation, sont liées à la fois au revenu et au prix.
:retenir
- Omettre une variable crée un biais égal à (son effet sur y) × (son lien avec x).
- Wallonie : (−) × (−) = +0,235. Bruxelles : (+) × (−) = −0,398.
- 1,608 + 0,235 − 0,398 = 1,444, exactement.
- « Biaisé » se dit toujours par rapport à un paramètre précis.
