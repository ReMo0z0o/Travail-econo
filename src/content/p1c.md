#SEC D | Interaction

#Q 1.13 | Une élasticité par région
:enonce
Estimez un modèle log-log dans lequel l'élasticité peut différer d'une région à l'autre, en ajoutant l'interaction entre log(rev_hab) et les indicatrices de région.
:intro
Le modèle 1.9 imposait la même pente aux trois régions. On relâche cette contrainte : chaque région a maintenant sa hauteur **et** sa pente.

$$ \ln(prix) = β₀ + β₁ \ln(rev) + δ_{W} W + δ_{B} B + θ_{W} (W × \ln(rev)) + θ_{B} (B × \ln(rev)) + u $$

{{w:nuage modele=pentes titre="Le modèle 1.13 : une droite par région"}}
:concepts indicatrices, incertitude
##a | L'élasticité de chaque région et son erreur-type
:enonce
Donnez l'élasticité estimée dans chaque région et son erreur-type. Pour les régions autres que la référence, l'élasticité est la somme de deux coefficients : calculez son erreur-type à partir de la matrice de variance-covariance, ou réestimez le modèle en changeant de catégorie de référence.
:court
| Région | Calcul | Élasticité | Erreur-type HC1 | IC à 95 % |
|---|---|--:|--:|--:|
| Flandre | $β₁$ | **1,440** | 0,108 | [1,23 ; 1,65] |
| Wallonie | $β₁ + θ_{W}$ | **1,838** | 0,109 | [1,62 ; 2,05] |
| Bruxelles | $β₁ + θ_{B}$ | **1,072** | 0,138 | [0,80 ; 1,34] |
:zero
**Lire les élasticités.** Remplace W et B par leurs valeurs pour chaque région et regarde ce qui multiplie ln(rev).

- Flandre (W = 0, B = 0) : il reste $β₁$ = 1,440.
- Wallonie (W = 1) : $β₁ + θ_{W}$ = 1,440 + 0,398 = 1,838.
- Bruxelles (B = 1) : $β₁ + θ_{B}$ = 1,440 − 0,368 = 1,072.

Le coefficient d'une [[interaction]] est donc la **différence de pente** avec la région de référence.

**L'erreur-type d'une somme.** C'est le piège de la question. On n'additionne **pas** les deux erreurs-types. La variance d'une somme fait intervenir la covariance :

$$ Var(\hat{β}₁ + \hat{θ}_{W}) = Var(\hat{β}₁) + Var(\hat{θ}_{W}) + 2 Cov(\hat{β}₁, \hat{θ}_{W}) $$

Ici la covariance est fortement négative (quand la pente flamande est surestimée, la différence avec la Wallonie est sous-estimée d'autant), ce qui explique que l'erreur-type de la somme (0,109) soit **plus petite** que celle de l'interaction seule (0,153).

**La seconde méthode, plus simple.** Mets la Wallonie en catégorie de référence : le coefficient de ln(rev) devient directement l'élasticité wallonne, avec la bonne erreur-type. Les deux méthodes donnent 1,838 (0,109).

:::astuce Une vérification qui rassure
Dans un modèle où tout est interagi avec la région, les élasticités sont exactement celles qu'on obtiendrait en estimant **une régression séparée dans chaque région**.
:::
:res
| | Coefficient | Erreur-type HC1 |
|---|--:|--:|
| Constante | −1,909 | 1,097 |
| ln(rev_hab) | 1,440 | 0,108 |
| Wallonie | −4,219 | 1,550 |
| Bruxelles | 4,465 | 1,744 |
| ln(rev_hab) × Wallonie | 0,398 | 0,153 |
| ln(rev_hab) × Bruxelles | −0,368 | 0,175 |
:code
```r
reg_1_13 <- lm(lprix ~ lrev * region, data = base)    # * = effets principaux + interactions
rob(reg_1_13)

V  <- vcovHC(reg_1_13, type = "HC1")                  # matrice de variance-covariance robuste
bi <- coef(reg_1_13)

bi["lrev"] + bi["lrev:regionWallonie"]                                  # 1,838
sqrt(V["lrev", "lrev"] + V["lrev:regionWallonie", "lrev:regionWallonie"] +
     2 * V["lrev", "lrev:regionWallonie"])                              # 0,109

# Vérification : la Wallonie en référence
rob(lm(lprix ~ lrev * region_w, data = base))["lrev", ]                 # 1,838 (0,109)
```

- `lrev * region` est un raccourci pour `lrev + region + lrev:region`. Le `:` désigne l'interaction seule.
- `vcovHC()` renvoie un tableau carré : sur la diagonale, les variances des coefficients ; ailleurs, leurs covariances. `V["a", "b"]` lit la case à la ligne `a`, colonne `b`.
- `sqrt()` est la racine carrée : l'erreur-type est la racine de la variance.
:gpt
Mêmes élasticités et erreurs-types. Calcule l'intervalle de confiance avec le quantile de **Student** (545 degrés de liberté) : [1,227 ; 1,652] pour la Flandre. Écrit une fonction générale `contraste()` qui calcule n'importe quelle combinaison de coefficients et son erreur-type.
:claude
Mêmes valeurs. Intervalle avec **1,96** : [1,23 ; 1,65]. Écrit la formule de la variance d'une somme en clair, puis vérifie en changeant de catégorie de référence, comme le suggère l'énoncé.
:verdict
Résultats identiques : la différence entre 1,96 et le quantile de Student (1,964) est invisible à deux décimales. Le code de Claude suit exactement les deux méthodes proposées par l'énoncé et se lit ligne par ligne ; la fonction `contraste()` de ChatGPT est plus générale, mais plus difficile à expliquer à l'oral (elle manipule des vecteurs de poids et un produit matriciel). Conseil : la formule écrite en clair, plus la vérification par changement de référence.
:opt claude | Formule de la variance d'une somme, puis vérification
En Flandre, l'élasticité est β₁ = 1,440 (0,108). En Wallonie et à Bruxelles, c'est β₁ plus le coefficient d'interaction : 1,838 et 1,072. L'erreur-type d'une somme se calcule avec la matrice de variance-covariance robuste, √(Var(β₁) + Var(θ) + 2 Cov(β₁, θ)) : 0,109 et 0,138. Je vérifie en mettant la Wallonie en référence : le coefficient de ln(rev) vaut alors directement 1,838 (0,109).
:opt gpt | Fonction de contraste générale
Je calcule chaque élasticité régionale comme une combinaison linéaire des coefficients, L'b, et son erreur-type comme √(L'VL) avec la matrice HC1, puis l'intervalle avec le quantile de Student.
##b | Flandre et Wallonie ont-elles la même élasticité ?
:enonce
Testez l'égalité des élasticités flamande et wallonne.
:court
**On rejette l'égalité.** H₀ : $θ_{W} = 0$. Statistique t = 0,398 / 0,153 = **2,59** ; p = **0,0097**. L'élasticité est significativement plus forte en Wallonie (1,84) qu'en Flandre (1,44), au seuil de 5 % et même de 1 %.
:zero
L'élasticité wallonne vaut $β₁ + θ_{W}$, la flamande $β₁$. Elles sont égales si et seulement si $θ_{W} = 0$. Tester l'égalité des deux élasticités, c'est donc tester **un seul coefficient**, qui figure déjà dans la sortie de la régression.

1. **Hypothèses.** H₀ : $θ_{W} = 0$ (même élasticité). H₁ : $θ_{W} ≠ 0$.
2. **Statistique.** t = coefficient / erreur-type robuste = 0,398 / 0,153 = 2,59.
3. **Loi sous H₀.** Normale centrée réduite (grand échantillon). Valeur critique à 5 % : 1,96.
4. **Décision.** 2,59 > 1,96, p = 0,0097 : on rejette H₀.

{{w:loi test=interaction}}

Les écarts de prix entre communes wallonnes suivent donc davantage les écarts de revenu que ce n'est le cas en Flandre.

:::piege Le test qu'il ne faut pas faire
Tester séparément « l'élasticité flamande est non nulle » et « l'élasticité wallonne est non nulle » répond à une autre question. Et comparer deux intervalles de confiance qui se chevauchent ne dit rien non plus : ici [1,23 ; 1,65] et [1,62 ; 2,05] se chevauchent un peu, et pourtant la différence est significative.
:::
:code
```r
linearHypothesis(reg_1_13, "lrev:regionWallonie = 0", vcov. = V, test = "F")
# F = 6,73 ; p = 0,0097   (et F = t² : 2,594² = 6,73)
```

`linearHypothesis()` (package `car`) teste une ou plusieurs restrictions sur les coefficients. `vcov. = V` lui fait utiliser la matrice robuste HC1. Avec une seule restriction, sa statistique F est le carré du t lu dans `rob(reg_1_13)`.
:accord Même test et même conclusion (t = 2,594, p = 0,0097). Claude le présente avec `linearHypothesis()` (statistique F = 6,73) ; ChatGPT lit directement le t de l'interaction. C'est le même test : F = t².
##c | Bruxelles : 19 communes
:enonce
Sur combien de communes repose l'estimation bruxelloise ? Qu'en concluez-vous ?
:court
Sur **19 communes** seulement. L'estimation (1,07) est **fragile** : quelques communes atypiques suffisent à déplacer la pente, et les erreurs-types robustes sont peu fiables sur un si petit groupe. On ne peut pas conclure grand-chose sur l'élasticité bruxelloise.
:zero
Trois raisons de se méfier.

- **Le poids de chaque point.** Avec 19 observations, deux ou trois communes atypiques commandent la pente : Ixelles (840 000 € pour 21 877 € de revenu), Saint-Gilles (681 250 € pour 17 920 €).
- **La validité des erreurs-types.** Les erreurs-types robustes sont justifiées pour de **grands** échantillons. Sur 19 points, l'approximation est mauvaise : l'intervalle [0,80 ; 1,34] est sans doute trop optimiste.
- **Un marché particulier.** À Bruxelles, 80 % des ventes de logements sont des appartements : les maisons vendues y sont un sous-ensemble peu représentatif. Et `rev_hab` y mesure mal le revenu des acheteurs (question 1.2).

L'écart de pente entre Bruxelles et la Flandre (−0,368) a une p-valeur de 0,036 : à la limite du seuil, et peu robuste pour les mêmes raisons.
:accord Même constat (19 communes, intervalle le plus large, quelques communes peuvent déplacer la pente). Claude donne trois raisons argumentées avec des exemples ; ChatGPT ajoute que la plage des revenus bruxellois est courte, ce qui rend toute pente difficile à estimer.
##d | Pourquoi l'indicatrice Wallonie vaut maintenant −4,2
:enonce
Le coefficient de l'indicatrice Wallonie a fortement changé par rapport à la question 1.9. Que mesure-t-il dans ce modèle ? Est-il interprétable tel quel ?
:court
Il mesure l'écart entre la Wallonie et la Flandre **quand ln(rev_hab) = 0**, c'est-à-dire pour un revenu de **1 € par habitant**. C'est une extrapolation absurde, très loin des données (le revenu minimum est de 12 987 €) : **non, il n'est pas interprétable tel quel.**
:zero
Avec des pentes différentes, les droites ne sont plus parallèles : l'écart entre deux régions **dépend du revenu** auquel on le mesure.

$$ \text{écart Wallonie − Flandre au revenu } r = δ_{W} + θ_{W} × \ln(r) $$

Le coefficient $δ_{W}$ est la valeur de cette expression quand le second terme s'annule, donc quand ln(r) = 0, soit r = 1 €. L'outil ci-dessous prolonge les droites jusque-là.

{{w:centrage}}

À un revenu réaliste, l'écart redevient raisonnable. À 25 000 € : −4,219 + 0,398 × ln(25 000) = −4,219 + 0,398 × 10,127 = **−0,189**.

:::cle La règle générale
Dans un modèle avec interaction, le coefficient d'une indicatrice est l'écart mesuré **là où l'autre variable de l'interaction vaut zéro**. Si zéro est loin des données, ce coefficient n'a aucun sens concret.
:::
:accord Même explication dans les deux versions (écart à ln(rev) = 0, soit un revenu de 1 €, hors de la plage observée).
##e | Centrer le revenu sur 25 000 €
:enonce
Créez `lrev_c` = ln(rev_hab) − ln(25 000) et réestimez le modèle en remplaçant log(rev_hab) par `lrev_c`. Quels coefficients changent, lesquels restent identiques, et pourquoi ? Interprétez le nouveau coefficient de l'indicatrice Wallonie et la nouvelle constante.
:court
**Inchangés** : les pentes (élasticité 1,440 et interactions 0,398 et −0,368), leurs erreurs-types, le R², les valeurs ajustées. **Modifiés** : la constante (12,672) et les indicatrices (Wallonie −0,189, Bruxelles 0,738), désormais mesurées à 25 000 € au lieu de 1 €. Pour un revenu de 25 000 € par habitant, le prix médian wallon est inférieur de **17,2 %** au flamand, et le prix flamand prédit est de **318 600 €**.
:zero
[[Centrage::Centrer]], c'est déplacer le point zéro du régresseur. `lrev_c` vaut 0 quand le revenu vaut 25 000 €, une valeur proche du revenu moyen (24 288 €). La règle de la question (d) fait le reste : les indicatrices mesurent maintenant l'écart **à 25 000 €**.

| | Modèle 1.13 | Modèle centré |
|---|--:|--:|
| Constante | −1,909 (1,097) | 12,672 (0,009) |
| ln(rev_hab) ou lrev_c | 1,440 (0,108) | 1,440 (0,108) |
| Wallonie | −4,219 (1,550) | −0,189 (0,017) |
| Bruxelles | 4,465 (1,744) | 0,738 (0,060) |
| Interaction Wallonie | 0,398 (0,153) | 0,398 (0,153) |
| Interaction Bruxelles | −0,368 (0,175) | −0,368 (0,175) |

**Pourquoi les pentes ne bougent pas.** Déplacer l'origine d'un axe ne fait pas tourner une droite. C'est toujours le même modèle, avec les mêmes prédictions.

**Pourquoi les erreurs-types de la constante et des indicatrices s'effondrent** (de 1,550 à 0,017 pour la Wallonie). On n'extrapole plus : on estime un écart au cœur du nuage, là où il y a beaucoup de données.

**Les interprétations.**

- **Nouvelle constante (12,672)** : ln(prix) prédit pour une commune **flamande** à 25 000 € par habitant, soit exp(12,672) ≈ 318 600 €.
- **Nouvelle indicatrice Wallonie (−0,189)** : à 25 000 € de revenu par habitant, le prix médian wallon est inférieur de 100 × (exp(−0,189) − 1) = −17,2 % au prix flamand.
:code
```r
base$lrev_c <- base$lrev - log(25000)
reg_1_13e <- lm(lprix ~ lrev_c * region, data = base)
rob(reg_1_13e)
exp(coef(reg_1_13e)[1])    # 318 575 € : le prix flamand prédit à 25 000 €
```
:accord Mêmes coefficients et mêmes interprétations (318 575 € ; −17,2 %). ChatGPT donne en plus l'explication algébrique : remplacer ln(R) par x + ln(25 000) fait absorber β × ln(25 000) par les termes constants.
##f | Les trois droites et leurs intervalles de confiance
:enonce
Représentez les relations estimées dans chaque région, avec leurs intervalles de confiance à 95 %, sur le nuage de points.
:court
Trois droites de pentes différentes sur le nuage en échelles logarithmiques, chacune entourée d'une bande. La droite wallonne est la plus pentue et se rapproche de la flamande pour les communes riches ; la droite bruxelloise est très au-dessus, avec une bande large. Les bandes s'élargissent aux extrémités, où il y a peu de communes.
:zero
Reprends l'outil en haut de la page (modèle « Une pente par région ») pour voir les trois droites.

**Comment se construit la bande.** Pour chaque région et chaque niveau de revenu, on calcule la prédiction $x'b$, puis son erreur-type robuste $\sqrt{x'Vx}$, où $x$ est le vecteur des régresseurs pour cette région et ce revenu, et $V$ la matrice HC1. La bande va de prédiction − 1,96 × erreur-type à prédiction + 1,96 × erreur-type.

**Ce qu'il faut commenter.**

- L'écart Wallonie-Flandre **se réduit quand le revenu augmente** : −17 % à 25 000 €, environ −11 % à 30 000 €.
- La bande de Bruxelles est large : 19 communes.
- Les bandes s'évasent aux extrémités : on est moins sûr d'une droite là où il y a peu de points.

:::piege Ce que la bande ne dit pas
C'est un intervalle de confiance sur le prix **moyen** prédit, pas un intervalle où tomberait le prix d'une commune donnée. La plupart des communes sont en dehors de la bande, et c'est normal.
:::
:code
```r
# Une grille de revenus observés dans chaque région
grille <- bind_rows(lapply(levels(base$region), function(r) {
  x <- base$lrev[base$region == r]
  data.frame(region = r, lrev = seq(min(x), max(x), length.out = 50))
}))
grille$region <- factor(grille$region, levels = levels(base$region))

X <- model.matrix(~ lrev * region, data = grille)    # les régresseurs pour chaque point de la grille
grille$fit <- as.vector(X %*% bi)                    # prédiction x'b
grille$se  <- sqrt(rowSums((X %*% V) * X))           # erreur-type robuste sqrt(x'Vx)
grille <- grille %>% mutate(bas = fit - 1.96 * se, haut = fit + 1.96 * se)
```

On trace ensuite `geom_ribbon()` (la bande) et `geom_line()` (la droite) par-dessus `geom_point()`. `predict(..., se.fit = TRUE)` donnerait des erreurs-types **classiques** : il faut faire le calcul à la main pour rester en HC1, comme le demande l'énoncé. `%*%` est le produit matriciel.
:accord Même construction (prédiction x'b et erreur-type √(x'Vx) avec la matrice HC1, sur la plage de revenus observée dans chaque région). ChatGPT précise utilement que la bande décrit l'incertitude sur le prix moyen ajusté et non sur une commune future. Claude trace le graphique en euros avec des axes logarithmiques, ChatGPT directement en logarithmes : même information.
:quiz
? L'erreur-type de l'élasticité wallonne (β₁ + θ_W) se calcule :
- en additionnant les erreurs-types de β₁ et de θ_W
+ avec les variances des deux coefficients et leur covariance
- en prenant la plus grande des deux erreurs-types
> Var(a + b) = Var(a) + Var(b) + 2 Cov(a, b). Ici la covariance est négative, et l'erreur-type de la somme (0,109) est plus petite que celle de θ_W seul (0,153).
? Dans le modèle avec interaction non centré, l'indicatrice Wallonie (−4,219) mesure :
- l'écart moyen entre Wallonie et Flandre
+ l'écart entre Wallonie et Flandre pour un revenu de 1 € par habitant
- l'écart de pente entre Wallonie et Flandre
> Elle mesure l'écart là où ln(rev) = 0. L'écart de pente, c'est le coefficient de l'interaction.
:oral
? Pourquoi l'indicatrice Wallonie passe-t-elle de −0,205 à −4,219 ?
> Dans le modèle avec interaction, elle mesure l'écart entre les deux régions quand ln(rev) vaut zéro, soit un revenu de 1 €. C'est une extrapolation sans aucun sens. En centrant le revenu sur 25 000 €, elle devient −0,189 et se lit : à ce revenu, les maisons wallonnes sont 17 % moins chères.
? Que change le centrage, et que ne change-t-il pas ?
> Il ne change ni les pentes, ni les prédictions, ni le R² : c'est le même modèle. Il change la constante et les indicatrices, parce qu'elles sont mesurées au point zéro du régresseur, qu'on a déplacé de 1 € à 25 000 €.

#SEC E | Hétéroscédasticité

#Q 1.14 | La variance des erreurs est-elle constante ?
:enonce
Pour le modèle log-log de la question 1.6 et pour le modèle avec indicatrices de région de la question 1.9 : (a) représentez les résidus en fonction des valeurs ajustées, puis en fonction de log(n_ventes) ; (b) effectuez un test de Breusch-Pagan sur les régresseurs du modèle, puis sur log(n_ventes) ; (c) comparez les erreurs-types classiques et robustes de l'élasticité.
:intro
La question 1.3 annonçait un problème : le prix médian est bien moins précis dans les petites communes, donc la variance des erreurs ne devrait pas être la même partout. On le vérifie de trois façons, puis on en tire les conséquences.

{{w:hetero}}
:concepts hypotheses, incertitude
##a | Les graphiques de résidus
:enonce
Représentez les résidus en fonction des valeurs ajustées, puis en fonction de log(n_ventes).
:court
**Modèle 1.6** : les résidus ne sont pas centrés par région (tous positifs à Bruxelles, de +0,6 à +1,3 ; surtout négatifs en Wallonie) et sont bien plus dispersés aux faibles valeurs ajustées. **Modèle 1.9** : un nuage centré sur zéro, d'épaisseur assez régulière, un peu plus large pour les communes qui comptent peu de ventes.
:zero
Un [[résidu]] est l'erreur de prédiction : ln(prix) observé moins ln(prix) prédit. Si tout va bien, le nuage des résidus est une **bande horizontale**, centrée sur zéro, de même épaisseur partout.

Deux défauts possibles, à ne pas confondre :

- une bande dont **l'épaisseur varie** : c'est l'[[hétéroscédasticité]] ;
- une bande qui **n'est pas centrée sur zéro** pour certains groupes : le modèle se trompe systématiquement, il lui manque une variable.

Dans le modèle 1.6, les deux se voient, et le second domine : les 19 communes bruxelloises ont toutes un résidu très positif. Passe au modèle 1.9 dans l'outil : les couleurs se mélangent, la bande se resserre.
:code
```r
base$lventes <- log(base$n_ventes)
d14 <- data.frame(ajuste = fitted(reg_1_9), residu = resid(reg_1_9),
                  lventes = base$lventes, region = base$region)

ggplot(d14, aes(x = ajuste, y = residu, colour = region)) +
  geom_point(alpha = 0.6) + geom_hline(yintercept = 0)
```

`fitted()` donne les valeurs ajustées, `resid()` les résidus. `geom_hline(yintercept = 0)` trace la ligne zéro.
:accord Mêmes graphiques. Claude colore les points par région, ce qui rend visible le défaut du modèle 1.6 (Bruxelles tout en haut) ; ChatGPT utilise une seule couleur. La version colorée sert mieux le commentaire.
##b | Le test de Breusch-Pagan
:enonce
Effectuez un test de Breusch-Pagan sur les régresseurs du modèle, puis sur log(n_ventes).
:court
| Modèle | Variables testées | Statistique | ddl | p-valeur | Décision à 5 % |
|---|---|--:|--:|--:|---|
| 1.6 | ln(rev_hab) | 82,6 | 1 | 1,0 × 10⁻¹⁹ | rejet |
| 1.6 | ln(n_ventes) | 4,86 | 1 | 0,027 | rejet |
| 1.9 | ln(rev_hab), régions | 9,26 | 3 | 0,026 | rejet (pas à 1 %) |
| 1.9 | ln(n_ventes) | 0,48 | 1 | 0,487 | non-rejet |
:zero
Le [[test de Breusch-Pagan]] formalise ce qu'on cherche à l'œil : **l'épaisseur du nuage des résidus dépend-elle de certaines variables ?**

1. **Hypothèses.** H₀ : la variance de l'erreur est constante (homoscédasticité). H₁ : elle dépend des variables $z$ choisies.
2. **Régression auxiliaire.** On régresse les résidus **au carré** sur les variables $z$. Un résidu au carré est grand quand le point est loin de la droite : si $z$ aide à prédire ces carrés, c'est que la dispersion dépend de $z$.
3. **Statistique.** LM = n × R² de cette régression. Sous H₀, elle suit un [[loi du khi-deux::khi-deux]] dont le nombre de degrés de liberté est le nombre de variables $z$.
4. **Décision.** On rejette H₀ si p < 0,05.

Le test dépend donc des variables $z$ qu'on lui donne : c'est pourquoi l'énoncé le demande deux fois, avec les régresseurs du modèle puis avec ln(n_ventes).

{{w:loi test=bp19}}

**Lecture.** Le modèle 1.6 est fortement hétéroscédastique. Le modèle 1.9 l'est beaucoup moins : le test global rejette encore à 5 % (pas à 1 %), et celui sur le nombre de ventes ne rejette pas.
:code
```r
bptest(reg_1_6_ll)                             # z = les régresseurs du modèle
bptest(reg_1_6_ll, ~ lventes, data = base)     # z = ln(n_ventes)
bptest(reg_1_9)
bptest(reg_1_9, ~ lventes, data = base)
```

`bptest()` (package `lmtest`) utilise par défaut la version « studentisée » de Koenker, valable même si les erreurs ne suivent pas une loi normale. Le second argument, une formule commençant par `~`, donne les variables $z$.
:accord Mêmes quatre statistiques et mêmes p-valeurs, avec la même version du test (Koenker, par défaut dans R).
##c | Erreurs-types classiques et robustes
:enonce
Comparez les erreurs-types classiques et robustes de l'élasticité.
:court
| Modèle | Élasticité | Erreur-type classique | Erreur-type HC1 | Rapport |
|---|--:|--:|--:|--:|
| 1.6 | 1,444 | 0,081 | 0,149 | **1,85** |
| 1.9 | 1,608 | 0,058 | 0,074 | **1,27** |
:zero
Les deux erreurs-types mesurent la même chose (l'imprécision de l'élasticité), mais avec deux formules. La classique **suppose** l'homoscédasticité ; la robuste n'en a pas besoin. Quand l'hypothèse est vraie, les deux sont proches. Leur écart est donc un **thermomètre** de l'hétéroscédasticité.

Dans le modèle 1.6, la formule classique sous-estime l'incertitude de presque la moitié : l'intervalle à 95 % serait [1,29 ; 1,60] au lieu de [1,15 ; 1,74].
:code
```r
sqrt(diag(vcov(reg_1_9)))["lrev"]                    # classique : 0,058
sqrt(diag(vcovHC(reg_1_9, type = "HC1")))["lrev"]    # robuste   : 0,074
```

`vcov()` est la matrice de variance-covariance classique, `vcovHC()` la robuste. `diag()` extrait la diagonale (les variances), `sqrt()` en prend la racine.
:accord Mêmes valeurs (0,0809 et 0,1494 ; 0,0584 et 0,0740). Claude exprime la comparaison en rapport (1,85 et 1,27), ChatGPT en différence (+0,0685 et +0,0156).
##d | La question 1.3 se confirme-t-elle ?
:enonce
Vos résultats confirment-ils ce que la question 1.3 laissait attendre ?
:court
**En partie seulement.** On voit bien un peu plus de dispersion dans les petites communes (écart-type des résidus de 0,20 sous 30 ventes, contre 0,16 ailleurs, dans le modèle 1.9). Mais le test sur ln(n_ventes) ne rejette pas l'homoscédasticité dans ce modèle (p = 0,49) : l'erreur d'échantillonnage de la médiane n'est qu'une **petite partie** du bruit total.
:zero
La question 1.3 prédisait : moins de ventes, médiane moins précise, donc résidus plus dispersés. Le tableau montre que c'est vrai, mais surtout pour les très petites communes.

| Ventes de maisons | Communes | Écart-type des résidus (1.6) | Écart-type des résidus (1.9) | Erreur-type relative de la médiane |
|---|--:|--:|--:|--:|
| Moins de 30 | 34 | 0,419 | 0,201 | 12,2 % |
| 30 à 49 | 62 | 0,179 | 0,154 | 9,5 % |
| 50 à 99 | 156 | 0,278 | 0,165 | 6,7 % |
| 100 à 199 | 186 | 0,247 | 0,161 | 4,3 % |
| 200 et plus | 113 | 0,225 | 0,157 | 3,0 % |

**Pourquoi le test ne le détecte-t-il pas ?** Compare deux ordres de grandeur.

- Pour la plupart des communes, l'erreur d'échantillonnage de la médiane vaut 3 à 7 % du prix, soit une variance d'environ 0,05² = 0,0025.
- La variance totale des résidus du modèle 1.9 est d'environ 0,163² = 0,027 : **dix fois plus**.

L'imprécision de la médiane est noyée dans tout le reste (qualité des logements, localisation…). Elle ne pèse vraiment que pour une trentaine de petites communes, et un test qui cherche une relation régulière avec ln(n_ventes) manque de puissance pour la voir.

**Et dans le modèle 1.6 ?** Le test sur ln(n_ventes) rejette (p = 0,027), mais pour une mauvaise raison : le nombre de ventes est lié aux régions, dont l'effet est resté dans les résidus.
:gpt
« Partiellement confirmée. » S'appuie sur le **signe** de la relation : la pente des résidus au carré sur ln(ventes) est négative dans le modèle simple (−0,0207), puis proche de zéro avec les régions (−0,0016). Conclut que l'erreur-type d'une médiane peut varier « sans expliquer à elle seule » la variance de l'erreur.
:claude
« En partie seulement. » S'appuie sur le **tableau par classes de ventes** et sur la comparaison de deux variances (0,0025 contre 0,027), qui explique pourquoi l'effet attendu est réel mais trop petit pour être détecté.
:verdict
Même conclusion, deux démonstrations. Celle de Claude est plus parlante : le tableau montre l'effet là où il existe (sous 30 ventes) et le calcul des deux variances explique pourquoi le test ne le voit pas. L'argument de ChatGPT (pente négative mais non significative) est correct et tient en une ligne. Tu peux combiner : le tableau, puis la phrase sur les ordres de grandeur.
:opt claude | Tableau par classes de ventes et ordres de grandeur
En partie. Dans le modèle 1.9, l'écart-type des résidus vaut 0,20 dans les communes de moins de 30 ventes, contre environ 0,16 ailleurs : la dispersion est bien plus forte là où la médiane est imprécise. Mais le test de Breusch-Pagan sur ln(n_ventes) ne rejette pas (p = 0,49), parce que l'erreur d'échantillonnage de la médiane (variance d'environ 0,0025) ne représente qu'un dixième de la variance des résidus (0,027).
:opt gpt | Signe de la relation entre résidus au carré et ventes
Partiellement. La relation entre les résidus au carré et ln(n_ventes) est négative, comme attendu, dans le modèle simple, mais elle devient proche de zéro une fois les régions prises en compte. L'imprécision de la médiane existe, mais elle n'explique pas à elle seule la variance de l'erreur.
##e | Pourquoi l'écart est-il plus grand dans le modèle 1.6 ?
:enonce
Pourquoi l'écart entre erreurs-types classiques et robustes est-il plus grand dans le modèle de la question 1.6 ? Qu'est-ce que cela suggère sur ce modèle ?
:court
Parce que l'omission des régions crée de **très grands résidus aux revenus les plus faibles** : toutes les communes bruxelloises (résidus d'environ +0,9) et les communes wallonnes pauvres se trouvent à gauche du nuage. Cela suggère que le modèle 1.6 est **mal spécifié** : il lui manque des variables.
:zero
L'erreur-type robuste donne à chaque résidu au carré un poids proportionnel à $(x − \bar{x})²$ : les observations **éloignées du revenu moyen** comptent le plus. Elle s'écarte donc de la classique quand les grands résidus se concentrent aux extrémités du revenu.

C'est exactement le cas du modèle 1.6. Les communes bruxelloises sont pauvres (à l'extrémité gauche) et mal prédites (résidus énormes). La formule classique, qui suppose la même dispersion partout, ne voit pas ce cumul.

Ce qu'on appelle ici « hétéroscédasticité » est en grande partie autre chose : une **moyenne mal modélisée**. La preuve, c'est qu'il suffit d'ajouter les régions pour que tout s'améliore d'un coup.

| | Modèle 1.6 | Modèle 1.9 |
|---|--:|--:|
| R² | 0,367 | 0,757 |
| Breusch-Pagan (régresseurs) | 82,6 | 9,3 |
| Rapport HC1 / classique | 1,85 | 1,27 |
:accord Même explication : de grands résidus bruxellois à des valeurs influentes du revenu, signe d'une spécification nationale trop rigide que les régions corrigent. Claude ajoute le mécanisme (pondération par (x − x̄)²) et le tableau avant/après.
##f | Ce que l'hétéroscédasticité change et ne change pas
:enonce
Qu'est-ce que l'hétéroscédasticité change, et qu'est-ce qu'elle ne change pas, à vos estimations et à vos conclusions ?
:court
**Elle ne change pas** les coefficients, qui restent sans biais, ni le R², ni les valeurs ajustées. **Elle change** les erreurs-types : la formule classique devient fausse, donc aussi les tests et les intervalles de confiance. Avec les erreurs-types HC1, nos conclusions tiennent : l'élasticité reste très significative (t = 21,7 dans le modèle 1.9), seuls les intervalles s'élargissent.
:zero
| | Avec hétéroscédasticité |
|---|---|
| Coefficients estimés | **inchangés et sans biais** : l'absence de biais ne demande que $E(u \mid x) = 0$ |
| R², valeurs ajustées, résidus | inchangés |
| Erreurs-types classiques | **fausses** |
| Tests t, tests F, intervalles de confiance classiques | **faux** |
| Efficacité des MCO | perdue : des moindres carrés pondérés par le nombre de ventes seraient plus précis |

Le remède est déjà en place : les erreurs-types robustes HC1, que l'énoncé impose partout. Elles ne modifient aucun coefficient ; elles donnent seulement une mesure honnête de l'incertitude.

:::piege La phrase à ne jamais prononcer
« L'hétéroscédasticité biaise les coefficients. » C'est faux. Elle fausse les erreurs-types classiques, rien d'autre.
:::
:accord Même liste dans les deux versions (coefficients et prédictions inchangés et sans biais sous exogénéité, perte d'efficacité, erreurs-types, intervalles et tests à corriger).
:quiz
? Le test de Breusch-Pagan sur ln(n_ventes) donne p = 0,49 dans le modèle 1.9. On peut dire que :
- l'homoscédasticité est prouvée
+ les données ne permettent pas de rejeter que la variance soit indépendante du nombre de ventes
- la variance dépend du nombre de ventes
> Ne pas rejeter H₀ ne la prouve pas. Le tableau par classes de ventes montre d'ailleurs un peu plus de dispersion dans les très petites communes.
? Passer des erreurs-types classiques aux erreurs-types HC1 modifie :
- les coefficients et les erreurs-types
+ seulement les erreurs-types, les t et les p-valeurs
- seulement le R²
> Les coefficients MCO sont les mêmes. Seule l'estimation de leur précision change.
:oral
? Qu'est-ce que l'hétéroscédasticité, et pourquoi en attendais-tu ici ?
> C'est une variance des erreurs qui n'est pas la même pour toutes les observations. J'en attendais parce que le prix médian est beaucoup moins précis dans les communes où il y a peu de ventes : cette erreur d'échantillonnage entre dans le terme d'erreur.
? Que fait HC1 ?
> Il calcule les erreurs-types sans supposer que la variance des erreurs est constante. Les coefficients ne changent pas. HC1 est la version de White multipliée par n / (n − k), une petite correction pour les échantillons finis.

#SEC F | Contrôles et causalité

#Q 1.15 | Ajouter la population et la part d'appartements
:intro
On ajoute deux variables de contrôle au modèle 1.9. La première sous-question est un petit travail de détective sur une valeur manquante ; la seconde, un exercice d'interprétation.
:concepts log, hypotheses
##a | Que signifient les 25 valeurs manquantes ?
:enonce
Vingt-cinq communes de votre base ont une valeur manquante pour le nombre de ventes d'appartements. Que signifie, selon vous, cette valeur manquante ? Comment la traitez-vous ? (Indice : examinez les plus petites valeurs de `n_app` dans le fichier.)
:court
Elle signifie **« aucune vente d'appartement »**. La plus petite valeur de `n_app` est 1 et le fichier entier ne contient **aucun zéro** : Statbel n'écrit pas les lignes à zéro vente. On remplace donc ces valeurs manquantes par **0**, au lieu de supprimer les communes.
:zero
Suis l'indice. Trois observations suffisent.

1. La plus petite valeur de `n_app` est **1**. Il n'y a jamais de 0.
2. Dans **tout** le fichier des ventes (toutes années, tous niveaux, tous types de biens), la variable `MS_TOTAL_TRANSACTIONS` ne vaut jamais 0.
3. Les 25 communes concernées sont de petites communes rurales (Biévène, Pepingen, Glabbeek, Lo-Reninge…), où il est tout à fait plausible qu'aucun appartement ne se soit vendu.

Conclusion : une cellule vide veut dire « zéro ».

**Pourquoi ce n'est pas un secret statistique ?** On pourrait croire que Statbel masque les petits nombres pour protéger la confidentialité. Mais 37 communes ont exactement **1** vente d'appartement et 21 en ont **2**, et ces chiffres sont publiés. Un seuil de confidentialité aurait masqué ceux-là en premier.

**Pourquoi remplacer par 0 plutôt que supprimer ?** Supprimer ces 25 communes écarterait justement celles où `part_app` vaut 0 : une sélection systématique, qui fausserait le coefficient de `part_app`.

:::piege Cette règle ne vaut que pour un comptage
Un nombre de ventes manquant peut vouloir dire zéro. Un **prix médian** manquant ne veut pas dire « prix nul » : les 14 communes de la question 1.1 (f) restent exclues.
:::
:code
```r
sum(is.na(base$n_app))                                    # 25
sort(base$n_app)[1:10]                                    # 1 1 1 1 … : jamais 0
sum(immo_raw$MS_TOTAL_TRANSACTIONS == 0, na.rm = TRUE)    # 0 : aucun zéro dans tout le fichier

base <- base %>%
  mutate(n_app    = ifelse(is.na(n_app), 0, n_app),
         part_app = n_app / (n_app + n_ventes),
         lpop     = log(pop))
```

`ifelse(condition, valeur si vrai, valeur si faux)` remplace les `NA` par 0. `na.rm = TRUE` demande d'ignorer les valeurs manquantes dans le calcul.
:gpt
Remarque que le plus petit compte publié vaut 1, que 37 communes ont une vente et 21 en ont deux, et qu'un seuil de confidentialité explique donc mal ces absences. Pose le zéro **comme hypothèse de travail** et la vérifie par un **test de sensibilité** : en retirant les 25 communes, l'élasticité vaut 1,6335 (526 communes) contre 1,6367 avec le codage à zéro.
:claude
Vérifie qu'il n'y a **aucun zéro dans tout le fichier**, ce qui établit que Statbel n'écrit pas les zéros. Remplace par 0 et explique pourquoi supprimer ces communes créerait une sélection systématique.
:verdict
Les deux arrivent au même codage, par deux arguments qui se renforcent : « aucun zéro dans tout le fichier » (Claude) est la preuve la plus directe ; « des 1 et des 2 sont publiés » (ChatGPT) écarte l'explication concurrente par la confidentialité. Le test de sensibilité de ChatGPT est un vrai plus : il montre que ton choix ne change rien au résultat principal. La meilleure réponse réunit les trois.
:opt mix | Les deux preuves, le codage à zéro, puis le test de sensibilité
La valeur manquante signifie qu'aucun appartement n'a été vendu : la plus petite valeur de n_app est 1 et le fichier ne contient aucun zéro, donc Statbel n'écrit pas les zéros. Ce n'est pas un masquage de confidentialité, puisque des communes à 1 ou 2 ventes sont publiées. Je remplace ces 25 valeurs par 0 plutôt que de supprimer les communes, ce qui écarterait justement celles où la part d'appartements est nulle. En les retirant à titre de vérification, l'élasticité passe de 1,637 à 1,634 : le choix ne change pas le résultat.
:opt claude | Aucun zéro dans le fichier, donc NA = 0
La plus petite valeur de n_app est 1 et aucune ligne du fichier ne vaut 0 : une cellule vide signifie zéro vente. Je remplace par 0 pour ne pas exclure les communes sans appartement.
:opt gpt | Zéro comme hypothèse, vérifiée par sensibilité
Le plus petit compte publié vaut 1 et des comptes de 1 ou 2 sont fréquents : la confidentialité n'explique pas ces absences. Je pose zéro comme hypothèse de travail et vérifie que retirer ces 25 communes ne change pas l'élasticité (1,6335 contre 1,6367).
##b | Interpréter les deux nouveaux coefficients
:enonce
Ajoutez au modèle avec indicatrices de région le logarithme de la population et la part des appartements dans les ventes de logements, `part_app` = `n_app` / (`n_app` + `n_ventes`). Interprétez les coefficients de ces deux variables.
:court
**ln(pop) : 0,018**, non significatif (p = 0,13). C'est une élasticité : une commune 10 % plus peuplée a des prix supérieurs de 0,18 % seulement. **part_app : 0,379**, significatif (t = 5,0). C'est une semi-élasticité : une part d'appartements plus élevée de 10 points va de pair avec des maisons environ **3,9 % plus chères**, toutes choses égales par ailleurs.
:zero
Applique la règle de la question 1.6. La variable dépendante est ln(prix), donc tout se lit en pourcentage.

**ln(pop).** Le régresseur est aussi en log : c'est une [[élasticité]]. +1 % de population ↔ +0,018 % de prix. L'effet est minuscule et on ne peut pas le distinguer de zéro.

**part_app.** Le régresseur est en niveau : une [[semi-élasticité]]. Attention à l'unité : `part_app` est une proportion **entre 0 et 1**. « Une unité de plus » voudrait dire passer de 0 % à 100 % d'appartements, ce qui n'a pas de sens. On raisonne sur 10 points de pourcentage, soit **0,10** :

- approximation : 100 × 0,379 × 0,10 = 3,8 % ;
- valeur exacte : 100 × (exp(0,379 × 0,10) − 1) = 3,9 %.

Lecture économique : les communes denses, où le terrain est rare, ont à la fois plus d'appartements et des maisons plus chères.

Pour situer : la part d'appartements vaut en moyenne 0,18 (0,20 en Flandre, 0,12 en Wallonie, 0,80 à Bruxelles).
:res
| | Coefficient | Erreur-type HC1 | p-valeur |
|---|--:|--:|--:|
| Constante | −4,155 | 0,803 | < 0,001 |
| ln(rev_hab) | 1,637 | 0,074 | < 0,001 |
| Wallonie | −0,161 | 0,018 | < 0,001 |
| Bruxelles | 0,655 | 0,064 | < 0,001 |
| ln(pop) | 0,0176 | 0,0117 | 0,131 |
| part_app | 0,379 | 0,076 | < 0,001 |

R² = 0,785 ; 551 communes.
:code
```r
reg_1_15 <- lm(lprix ~ lrev + region + lpop + part_app, data = base)
rob(reg_1_15)
100 * (exp(0.10 * coef(reg_1_15)["part_app"]) - 1)    # +3,9 % pour 10 points de plus
```
:accord Mêmes coefficients et mêmes lectures (élasticité de 0,018 non significative ; +3,87 % pour dix points de part d'appartements). Les deux versions insistent sur l'unité de `part_app` : 10 points de pourcentage, c'est 0,10.
:quiz
? part_app est codée entre 0 et 1 et son coefficient vaut 0,379. Une part d'appartements qui passe de 20 % à 30 % est associée à un prix des maisons :
- supérieur de 37,9 %
- supérieur de 0,38 %
+ supérieur d'environ 3,9 %
> De 20 % à 30 %, part_app augmente de 0,10. L'effet est 100 × (exp(0,379 × 0,10) − 1) ≈ 3,9 %.
:oral
? Pourquoi remplacer les valeurs manquantes de n_app par 0 ?
> Parce que le fichier ne contient aucun zéro et que la plus petite valeur publiée est 1 : Statbel n'écrit pas les lignes sans vente. Une cellule vide veut donc dire zéro vente d'appartement. Supprimer ces communes aurait écarté celles où la part d'appartements est nulle.

#Q 1.16 | Un contrôle problématique
:enonce
L'un de ces deux contrôles vous paraît-il problématique ? Raisonnez sur le sens de la causalité entre cette variable et le prix des maisons, et sur ce que son inclusion change à l'interprétation de l'élasticité et des indicatrices de région.
:concepts hypotheses, causalite
## | La part d'appartements, un « mauvais contrôle »
:court
**Oui : la part d'appartements.** Elle est en partie une **conséquence** du prix des maisons : là où les maisons et le terrain sont chers, on construit et on achète des appartements. C'est une causalité inverse, qui fait d'elle un [[mauvais contrôle]]. L'inclure change le sens des autres coefficients : l'écart bruxellois passe de +145 % à +93 %, parce qu'une partie de la « prime bruxelloise » est attribuée à la part d'appartements.
:zero
Un bon contrôle est une variable qui influence le prix **sans en dépendre**. Demande-toi dans quel sens va la flèche.

**Le sens de la causalité.** Des maisons chères → construire des appartements devient rentable, et les ménages qui ne peuvent pas s'offrir une maison achètent un appartement → la part d'appartements monte. Le prix **cause** la part d'appartements. On met donc à droite de l'équation une variable qui dépend de ce qu'on a mis à gauche.

**Ce que cela change à l'interprétation.**

- **L'élasticité** compare désormais des communes qui ont **la même part d'appartements**. Si le revenu agit sur les prix en partie par la densification, on a retiré ce canal. Le chiffre bouge peu ici (de 1,608 à 1,637), mais il ne répond plus à la même question.
- **Les indicatrices de région** changent nettement.

| Écart à la Flandre, à revenu égal | Sans contrôle (1.9) | Avec les contrôles (1.15) |
|---|--:|--:|
| Wallonie | −18,5 % | −14,8 % |
| Bruxelles | +144,7 % | +92,6 % |

À Bruxelles, 80 % des ventes sont des appartements. Le modèle 1.15 compare Bruxelles à une Flandre fictive « à part d'appartements égale », une commune flamande qui n'existe pas. Or cette part élevée est elle-même le produit de la rareté du terrain, donc des prix élevés : on a « expliqué » le prix par l'une de ses conséquences.

**Et la population ?** Elle pose moins de problème : elle tient surtout à l'histoire et à la taille de la commune. Des prix élevés peuvent la freiner à long terme, mais son coefficient est de toute façon négligeable.

:::cle La règle générale
On ne contrôle pas une variable qui est une conséquence de la variable dépendante ou du régresseur d'intérêt. Cette règle reviendra à la question 3.7 (f).
:::
:gpt
Prudent et symétrique : un terrain cher peut encourager la construction d'appartements, et inversement la structure de l'offre peut influencer le prix des maisons ; si la part est une conséquence des prix, elle est « potentiellement endogène ». Chiffre les écarts régionaux exacts (−18,53 % → −14,84 % ; +144,72 % → +92,59 %) et précise qu'on ne peut pas attribuer ce changement aux seuls appartements, puisque deux contrôles entrent à la fois.
:claude
Tranche : la part d'appartements est un « mauvais contrôle » par causalité inverse, la population pose moins de problème. Explique ce que devient la comparaison Bruxelles-Flandre (« une Flandre fictive à part d'appartements égale »).
:verdict
Même variable désignée, même mécanisme. La question demande de **prendre position** (« vous paraît-il problématique ? ») et de raisonner sur le sens de la causalité : la réponse de Claude le fait plus nettement et nomme le concept. ChatGPT apporte les pourcentages exacts et une réserve honnête (les deux contrôles sont ajoutés ensemble). Reprends la position de l'un et les chiffres de l'autre.
:opt mix | Mauvais contrôle, avec les écarts chiffrés
La part d'appartements est problématique : elle est en partie une conséquence du prix des maisons, car un terrain cher rend la construction d'appartements rentable et pousse les ménages vers eux. L'inclure fait comparer des communes à part d'appartements égale. L'élasticité bouge peu (1,61 à 1,64), mais l'écart bruxellois tombe de +145 % à +93 % : une partie de la prime bruxelloise est attribuée à une variable qui en est elle-même le résultat. La population pose moins de problème et son coefficient est négligeable.
:opt gpt | Variable potentiellement endogène
La part d'appartements peut être une conséquence des prix (terrain cher) autant qu'une cause : elle est potentiellement endogène. La fixer retire une voie par laquelle revenu et région se manifestent. Les écarts régionaux passent de −18,5 % à −14,8 % et de +144,7 % à +92,6 %, sans qu'on puisse attribuer ce changement aux seuls appartements.
:quiz
? Pourquoi part_app est-elle un mauvais contrôle ?
- Parce que son coefficient n'est pas significatif
- Parce qu'elle est mesurée avec erreur
+ Parce qu'elle dépend elle-même du prix des maisons
> Des maisons chères poussent à construire et à acheter des appartements : la variable de contrôle est en partie une conséquence de la variable dépendante.
:oral
? Pourquoi l'écart entre Bruxelles et la Flandre diminue-t-il quand tu ajoutes part_app ?
> Parce qu'une partie de la prime bruxelloise est attribuée à la part d'appartements, qui atteint 80 % à Bruxelles. Mais cette part est elle-même une conséquence de la rareté du terrain et des prix élevés : on compare Bruxelles à une Flandre fictive qui aurait autant d'appartements.

#Q 1.17 | L'élasticité dans les quatre spécifications
:enonce
Représentez dans un seul graphique l'élasticité estimée et son intervalle de confiance à 95 % dans les spécifications des questions 1.6, 1.9, 1.13 (Flandre) et 1.15. Commentez.
:concepts incertitude
## | Le graphique et son commentaire
:court
Les quatre estimations vont de **1,44 à 1,64**, et toutes les bornes inférieures dépassent 1 : le résultat « entre communes, le prix augmente plus que proportionnellement au revenu » est **robuste** au choix de la spécification. Ajouter les régions augmente l'élasticité et divise son erreur-type par deux.
:zero
{{w:foret jeu=p1}}

Ce qu'il faut commenter, dans l'ordre.

- **Stabilité.** Toutes les estimations sont entre 1,44 et 1,64, et aucun intervalle ne contient 1.
- **De 1.6 à 1.9.** L'élasticité monte (biais de variable omise, question 1.12) et l'intervalle se resserre nettement : les régions absorbent une grande part de la variance des résidus.
- **1.13 (Flandre).** Plus basse (1,44) que l'élasticité commune de 1.9 (1,61), qui fait une moyenne entre la Flandre et la Wallonie, plus pentue.
- **1.15.** Ajouter ln(pop) et part_app change peu l'élasticité, parce que ces variables sont peu corrélées au revenu.
- **La limite.** La stabilité entre spécifications ne prouve pas la causalité (question 1.18).
:res
| Spécification | Élasticité | Erreur-type HC1 | IC à 95 % |
|---|--:|--:|--:|
| 1.6 : sans contrôle | 1,444 | 0,149 | [1,15 ; 1,74] |
| 1.9 : + régions | 1,608 | 0,074 | [1,46 ; 1,75] |
| 1.13 : interaction, Flandre | 1,440 | 0,108 | [1,23 ; 1,65] |
| 1.15 : + ln(pop) + part_app | 1,637 | 0,074 | [1,49 ; 1,78] |
:code
```r
ligne_elast <- function(m, nom) {
  ct <- rob(m)
  data.frame(specification = nom, elasticite = ct["lrev", 1], se = ct["lrev", 2])
}
tab_1_17 <- bind_rows(ligne_elast(reg_1_6_ll, "1.6 : sans contrôle"),
                      ligne_elast(reg_1_9,    "1.9 : + régions"),
                      ligne_elast(reg_1_13,   "1.13 : interaction (Flandre)"),
                      ligne_elast(reg_1_15,   "1.15 : + ln(pop) + part_app")) %>%
  mutate(ic_bas = elasticite - 1.96 * se, ic_haut = elasticite + 1.96 * se)

ggplot(tab_1_17, aes(x = elasticite, y = specification)) +
  geom_vline(xintercept = 1, linetype = "dashed") +
  geom_pointrange(aes(xmin = ic_bas, xmax = ic_haut))
```

`ct["lrev", 1]` lit, dans le tableau renvoyé par `rob()`, la ligne `lrev` et la première colonne (le coefficient) ; la colonne 2 est l'erreur-type. `geom_pointrange()` trace un point et son intervalle.
:gpt
Trace une ligne de repère à **0** et commente : toutes les estimations sont positives et leurs intervalles excluent zéro. Ajoute une remarque méthodologique : le chevauchement d'intervalles de modèles estimés sur les mêmes données ne constitue pas un test d'égalité.
:claude
Trace une ligne de repère à **1** (élasticité unitaire) et commente : toutes les bornes inférieures dépassent 1. Explique chaque déplacement en renvoyant aux questions précédentes.
:verdict
Le choix du repère change le commentaire. Zéro répond à « y a-t-il une relation ? », ce qui ne fait aucun doute ici (t supérieur à 9 partout). Un permet de dire quelque chose de plus intéressant : le prix augmente **plus que proportionnellement** au revenu, dans toutes les spécifications. Le repère de Claude est plus informatif. La remarque de ChatGPT sur le chevauchement des intervalles est juste et vaut d'être reprise.
:opt claude | Repère à 1 : plus que proportionnel
Les quatre élasticités vont de 1,44 à 1,64 et tous les intervalles sont au-dessus de 1 : le prix augmente plus que proportionnellement au revenu, quelle que soit la spécification. Les régions augmentent l'élasticité (biais de variable omise) et divisent son erreur-type par deux. L'élasticité flamande est plus basse que l'élasticité commune, tirée vers le haut par la Wallonie. Cette stabilité ne prouve pas un effet causal.
:opt gpt | Repère à 0 : relation positive et significative
Toutes les estimations sont positives et leurs intervalles excluent zéro, de 1,440 à 1,637. Les régions resserrent nettement l'intervalle. Le chevauchement d'intervalles de modèles estimés sur les mêmes données n'est pas un test d'égalité.
:oral
? Que montre ce graphique, et que ne montre-t-il pas ?
> Il montre que l'élasticité est stable, entre 1,44 et 1,64, et toujours supérieure à 1 : le résultat ne dépend pas de la spécification. Il ne montre pas que cette élasticité est un effet causal : des variables omises peuvent biaiser les quatre estimations de la même façon.

#Q 1.18 | Une hausse du revenu fait-elle monter les prix ?
:enonce
Peut-on conclure de vos résultats qu'une hausse du revenu des habitant·es fait monter le prix des maisons d'une commune ?
:intro
C'est la question qui donne son sens à toute la partie. La réponse courte est **non** : on a mesuré une association entre communes, pas l'effet d'une hausse de revenu. Les quatre sous-questions te font construire cette réponse proprement.

{{w:dag jeu=communes}}
:concepts causalite, hypotheses
##a | L'hypothèse nécessaire
:enonce
Énoncez l'hypothèse qui serait nécessaire pour interpréter l'élasticité de la question 1.9 comme un effet causal.
:court
L'**exogénéité** du revenu, à région donnée : $E(u \mid \ln(rev\_hab), région) = 0$. En mots : à l'intérieur d'une région, tout ce qui détermine le prix des maisons en dehors du revenu est sans lien avec le revenu des habitants. Ni variable omise corrélée au revenu, ni causalité inverse.
:zero
Le [[terme d'erreur]] $u$ contient toutes les autres causes du prix : la localisation, la qualité des logements, les écoles, les transports. L'hypothèse dit que, parmi les communes d'une même région, celles qui ont un revenu élevé ne sont **en moyenne ni mieux ni moins bien loties** sur tous ces autres points.

Dis-le ainsi à l'oral : « il faudrait que le revenu des communes soit distribué comme s'il avait été tiré au sort à l'intérieur de chaque région ». Posé comme cela, on voit tout de suite que ce n'est pas crédible.
:accord Même hypothèse (exogénéité conditionnelle, E[u | ln(R), région] = 0). ChatGPT précise « avec une forme fonctionnelle adéquate » ; Claude traduit en mots les deux façons de la violer.
##b | Deux mécanismes qui la mettent en défaut
:enonce
Décrivez deux mécanismes concrets qui mettent cette hypothèse en défaut, et le sens du biais qui en résulterait.
:court
1. **Les atouts locaux omis** (proximité des emplois, cadre vert, bonnes écoles, gare) font monter les prix **et** attirent les ménages aisés : biais **vers le haut**.
2. **Le tri des ménages (causalité inverse)** : des maisons chères empêchent les ménages modestes de s'installer, donc le revenu est en partie une conséquence du prix : biais **vers le haut** aussi.
:zero
Utilise la règle du signe : **biais = (effet sur le prix) × (lien avec le revenu)**.

**Mécanisme 1 : une variable omise.** Une commune proche de Bruxelles, verte, bien desservie.

- Effet sur le prix : **positif** (les gens paient pour y vivre).
- Lien avec le revenu : **positif** (ce sont les ménages aisés qui s'y installent).
- (+) × (+) : le coefficient du revenu absorbe l'effet de ces atouts. L'élasticité **surestime** l'effet du revenu. Exemples : Sint-Martens-Latem, Kraainem, Lasne.

**Mécanisme 2 : la causalité inverse.** Le prix des maisons détermine **qui peut s'installer**. Une commune chère filtre les ménages modestes ; son revenu par habitant est élevé *parce que* ses maisons sont chères. La flèche va du prix vers le revenu. Là encore l'association est plus forte que l'effet causal : biais vers le haut.

**Un troisième mécanisme, de sens contraire.** `rev_hab` mesure mal le revenu des ménages (question 1.2). Une erreur de mesure sur le régresseur tire le coefficient **vers zéro** : c'est le [[biais d'atténuation]]. Les biais ne vont donc pas tous dans le même sens, et on ne peut pas dire de combien l'élasticité s'écarte du vrai effet.
:gpt
Deux mécanismes : l'accessibilité omise (une commune bien desservie attire les revenus élevés et la demande de logements) et le tri résidentiel (des maisons chères écartent les ménages modestes). Les deux poussent la pente vers le haut. Conclut : « le biais total reste inconnu ».
:claude
Les deux mêmes mécanismes, avec le signe déduit de la formule du biais, et un troisième de sens opposé : l'erreur de mesure du revenu, qui atténue le coefficient.
:verdict
Mêmes deux mécanismes, même sens. Claude ajoute le biais d'atténuation, qui fait le lien avec la question 1.2 et justifie la prudence finale (« on ne connaît pas le sens du biais net »). L'énoncé n'en demande que deux : donne les deux premiers, garde le troisième pour l'oral.
:opt claude | Atouts locaux et tri des ménages, avec la règle du signe
Premier mécanisme : des atouts locaux non observés (proximité des emplois, cadre de vie, écoles) augmentent les prix et attirent les ménages aisés ; le revenu est alors corrélé positivement au terme d'erreur et l'élasticité surestime l'effet du revenu. Second mécanisme : la causalité inverse par le tri des ménages ; une commune chère n'est accessible qu'aux ménages aisés, donc le revenu des habitants est en partie une conséquence du prix. Biais vers le haut également.
##c | La conclusion en trois phrases
:enonce
Formulez en trois phrases au plus la conclusion que vos résultats permettent réellement de tirer.
:court
En 2023, à région donnée, les communes belges dont le revenu par habitant est supérieur de 1 % ont des maisons vendues environ 1,6 % plus cher, et cette relation résiste aux changements de spécification. À revenu égal, les maisons sont environ 18 % moins chères en Wallonie et 2,4 fois plus chères à Bruxelles qu'en Flandre. Cette élasticité décrit une association entre communes, pas l'effet d'une hausse de revenu, car le revenu des habitants et le prix des maisons dépendent tous deux de la localisation et s'influencent mutuellement.
:zero
Une bonne conclusion en trois phrases suit toujours le même plan :

1. **le résultat principal, chiffré**, avec l'unité et le périmètre (où, quand, qui) ;
2. **le résultat secondaire** qui le nuance ou le complète ;
3. **la limite** : ce qu'on n'a pas le droit de dire.

Écris-la avec tes propres chiffres arrondis et tes propres mots : c'est le passage que le correcteur lira le plus attentivement.
:gpt
Trois phrases sans chiffres : les communes à revenu plus élevé ont généralement des prix médians plus élevés, y compris au sein des régions ; l'intensité de l'association varie selon la région ; ces données en coupe ne permettent pas d'attribuer la différence de prix à une hausse exogène du revenu.
:claude
Trois phrases chiffrées : l'élasticité (1,4 à 1,6 %), les écarts régionaux (−18 %, 2,4 fois), puis la limite causale et sa raison.
:verdict
Les deux conclusions sont justes. Celle de Claude reprend les chiffres du travail, ce qui la rend vérifiable et montre que tu maîtrises tes résultats ; celle de ChatGPT est plus sobre et mentionne que l'association varie selon la région (question 1.13). Une conclusion chiffrée est préférable dans un rapport d'économétrie.
:opt claude | Conclusion chiffrée
En 2023, à région donnée, les communes belges dont le revenu par habitant est supérieur de 1 % ont des maisons vendues en moyenne 1,4 à 1,6 % plus cher, une relation forte et robuste. À revenu égal, les maisons sont environ 18 % moins chères en Wallonie et 2,4 fois plus chères à Bruxelles qu'en Flandre. Cette élasticité décrit une association entre communes, pas l'effet d'une hausse de revenu : revenu et prix dépendent tous deux de la localisation et s'influencent mutuellement.
:opt gpt | Conclusion qualitative
En 2023, les communes à revenu fiscal plus élevé ont généralement des prix médians de maisons plus élevés, y compris au sein des régions. L'intensité de cette association varie selon la région. Ces données en coupe ne permettent pas d'attribuer la différence de prix à une hausse exogène du revenu.
##d | Quelle variation faudrait-il observer ?
:enonce
Quel type de variation des revenus faudrait-il observer pour estimer un effet causal ?
:court
Une variation du revenu **sans lien avec l'attractivité de la commune** : idéalement des changements de revenu **au cours du temps dans les mêmes communes**, provoqués par une cause extérieure qui n'agit sur les prix **que par le revenu**.
:zero
Il faut une source de variation qui casse les deux mécanismes de la question (b).

- **Suivre les mêmes communes dans le temps** (un [[panel]] avec effets fixes de commune) élimine tout ce qui est fixe : la localisation, le cadre de vie.
- **Un choc extérieur** élimine la causalité inverse : le revenu change pour une raison qui ne vient pas du marché immobilier local.

Des exemples concrets :

- l'évolution des salaires au Grand-Duché de Luxembourg, qui fait varier le revenu des communes belges selon leur part de travailleurs frontaliers ;
- une réforme fiscale qui modifie le revenu net plus fortement dans certaines communes, pour des raisons étrangères au logement ;
- l'évolution nationale des salaires par secteur, appliquée à la structure d'emploi initiale de chaque commune.

On comparerait alors l'évolution des prix dans les communes touchées et dans des communes semblables non touchées : par **double différence** ou par **variables instrumentales**. Ce sont exactement les outils des parties 2 et 3.
:accord Même idée : une variation du revenu indépendante du marché immobilier local, dans un cadre où l'on compare des évolutions. ChatGPT cite une réforme nationale affectant différemment les communes selon une règle préexistante ; Claude donne trois exemples (frontaliers luxembourgeois, réforme fiscale, structure sectorielle). Un seul exemple bien expliqué suffit.
:quiz
? Les communes attractives attirent les ménages aisés et ont des maisons chères. Ce mécanisme :
+ fait surestimer l'effet du revenu sur les prix
- fait sous-estimer l'effet du revenu sur les prix
- n'affecte pas l'estimation
> Variable omise à effet positif sur le prix et liée positivement au revenu : (+) × (+), biais vers le haut.
? Que permettrait un panel de communes avec effets fixes de commune ?
- D'éliminer toute causalité inverse
+ D'éliminer les caractéristiques des communes qui ne changent pas dans le temps
- De rendre l'élasticité significative
> Les effets fixes absorbent ce qui est constant pour chaque commune (localisation, cadre de vie), mais pas ce qui change en même temps que le revenu.
:oral
? Peux-tu dire qu'une hausse de revenu fait monter les prix ?
> Non. J'ai comparé des communes différentes, la même année. Les communes riches sont aussi mieux situées, et des maisons chères sélectionnent des habitants aisés. Mon élasticité est une association ; pour un effet causal, il faudrait une variation du revenu sans lien avec l'attractivité de la commune.
? Quelle hypothèse faudrait-il pour que ce soit causal ?
> L'exogénéité du revenu à région donnée : que tout ce qui détermine le prix en dehors du revenu soit sans lien avec le revenu. Ce n'est pas crédible ici.
:retenir
- L'élasticité de 1,6 est une association entre communes, robuste aux spécifications.
- Pour un effet causal, il faudrait E(u | revenu, région) = 0.
- Deux mécanismes la violent, avec un biais vers le haut : atouts locaux omis et tri des ménages.
- Il faudrait une variation du revenu extérieure au marché du logement : c'est le rôle des outils des parties 2 et 3.
