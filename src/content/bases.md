# Les bases, depuis zéro

>> Dix leçons courtes, dans l'ordre, pour comprendre tout le vocabulaire du travail sans aucun prérequis. Chaque leçon s'appuie sur les vraies données du travail.

:::cle Comment lire ces leçons
Ne cherche pas à tout mémoriser. À la fin de chaque leçon, vérifie seulement que tu sais répondre à la question posée dans l'encadré « Tu dois savoir dire ». Tu reviendras ici depuis les questions du travail, par les liens « À revoir avant ».
:::

#L donnees | Données, variables, moyenne et médiane | 6 min
>> Avant toute régression, il faut savoir ce qu'est une ligne du tableau. C'est la première chose qu'on te demandera à l'oral, et c'est la source de beaucoup d'erreurs.

### Une ligne, une colonne

Un jeu de données est un tableau. Chaque **ligne** est une [[observation]] : une commune, une mère, une localité observée une année donnée. Ce que représente une ligne s'appelle l'[[unité statistique]]. Chaque **colonne** est une **variable** : une caractéristique mesurée pour chaque observation (le prix médian, le revenu par habitant, le nombre d'enfants).

| Partie | Une ligne = | Nombre de lignes | Exemples de variables |
|---|---|--:|---|
| 1 | une commune belge en 2023 | 551 | `prix`, `rev_hab`, `region` |
| 2 | une mère américaine au recensement de 1980 | 254 654 | `work`, `morekids`, `age` |
| 3 | une localité burkinabè, une année donnée | 2 970 | `nl_extensive`, `year`, `treated` |

Dans la partie 3, la même localité revient sur plusieurs lignes, une par année : on appelle cela un [[panel]]. Compter les lignes et compter les localités ne donne donc pas le même nombre (2 970 lignes, 297 localités).

### Résumer une variable

- La **moyenne** additionne toutes les valeurs et divise par leur nombre. Elle est tirée par les valeurs extrêmes.
- La **[[médiane]]** est la valeur du milieu quand on range les observations par ordre croissant : la moitié est en dessous, la moitié au-dessus. Elle résiste aux valeurs extrêmes.
- Les **quartiles** coupent les observations en quatre : le premier quartile (p25) laisse un quart des valeurs sous lui, le troisième (p75) trois quarts. L'[[écart interquartile]] p75 − p25 mesure la dispersion de la moitié centrale.
- L'**écart-type** mesure la dispersion autour de la moyenne, dans l'unité de la variable.

:::ex Dans le travail
Le prix médian communal vaut en moyenne 296 148 €, mais sa médiane est de 285 000 €. La moyenne est plus haute parce que quelques communes très chères (Ixelles, 840 000 €) la tirent vers le haut. Pour le nombre de ventes, l'écart est énorme : moyenne 156, médiane 108, à cause d'Anvers (2 729 ventes).
:::

:::piege Deux médianes à ne pas confondre
Dans la partie 1, la variable `prix` est déjà une médiane : celle des maisons vendues dans la commune. Quand on calcule ensuite « la médiane de `prix` », on prend la médiane, entre communes, de ces médianes communales. Ce n'est pas le prix médian d'une maison en Belgique : une petite commune pèse autant qu'Anvers.
:::

:::cle Tu dois savoir dire
Pour chaque partie : que représente une ligne ? Combien y en a-t-il ? Quelle est la différence entre une moyenne et une médiane ?
:::

#L causalite | Corrélation n'est pas causalité | 7 min
>> C'est l'idée la plus importante du travail. Les trois parties tournent autour d'elle.

### Deux phrases qui ne veulent pas dire la même chose

- « Les communes où les habitants sont plus riches ont des maisons plus chères. » C'est une **association** (ou corrélation) : deux choses varient ensemble.
- « Si le revenu des habitants d'une commune augmentait, le prix des maisons monterait. » C'est une affirmation **causale** : on prétend savoir ce qui se passerait si on changeait une chose en laissant tout le reste identique.

Les données montrent directement la première. La seconde demande une hypothèse supplémentaire, qu'il faut énoncer et défendre.

### Trois raisons pour lesquelles une association n'est pas un effet

1. **Un facteur caché agit sur les deux.** Une commune proche de Bruxelles, verte et bien desservie attire des ménages aisés *et* a des maisons chères. Le revenu et le prix montent ensemble sans que l'un cause l'autre. C'est un [[facteur de confusion]], et le biais qu'il crée s'appelle le [[biais de variable omise]].
2. **La causalité va dans l'autre sens.** Des maisons chères empêchent les ménages modestes de s'installer : c'est le prix qui « choisit » le revenu des habitants. On parle de [[causalité inverse]].
3. **Les groupes comparés se sont formés eux-mêmes.** Les mères de trois enfants ne ressemblent pas aux mères de deux enfants : elles ont choisi d'en avoir un de plus. C'est un [[biais de sélection]].

{{w:dag jeu=generique titre="Le schéma du facteur caché"}}

### Les trois parties du travail, relues avec cette idée

| Partie | Ce qu'on voudrait savoir | Le facteur caché | La parade |
|---|---|---|---|
| 1 | L'effet du revenu sur les prix | Localisation, cadre de vie, emplois | Aucune : on conclut à une association (question 1.18). |
| 2 | L'effet d'un 3ᵉ enfant sur le travail de la mère | Préférences, carrière, revenu du conjoint | Un **instrument** : le sexe des deux premiers enfants, dû au hasard. |
| 3 | L'effet du réseau électrique sur une localité | Taille, proximité du réseau | La **double différence** : comparer des évolutions, pas des niveaux. |

:::cle Tu dois savoir dire
Pourquoi comparer deux groupes ne suffit pas à mesurer un effet, avec un exemple concret pour chaque partie.
:::

#L mco | La régression : une droite au milieu d'un nuage | 10 min
>> La régression linéaire résume la relation entre deux variables par une droite. Presque tout le travail en découle.

### L'idée

On dispose, pour chaque commune, de son revenu par habitant (x) et de son prix médian (y). On cherche la droite qui passe « au mieux » au milieu du nuage de points :

$$ y_{i} = β₀ + β₁ x_{i} + u_{i} $$

- $y$ est la [[variable dépendante]] (ce qu'on explique), $x$ le [[régresseur]] (ce qui explique).
- $β₁$ est la **pente** : de combien y change, en moyenne, quand x augmente d'une unité.
- $β₀$ est la **constante** : la valeur de y prédite quand x vaut zéro. Elle n'a souvent aucun sens concret (une commune au revenu nul n'existe pas).
- $u$ est le [[terme d'erreur]] : tout ce qui fait varier y en dehors de x.

### « Au mieux », c'est-à-dire ?

Pour chaque commune, la droite fait une erreur de prédiction, le [[résidu]] : prix observé moins prix prédit. La méthode des **moindres carrés ordinaires** ([[MCO]]) choisit la droite qui rend la **somme des carrés des résidus** la plus petite possible. On met les résidus au carré pour que les erreurs positives et négatives ne se compensent pas, et pour pénaliser davantage les grosses erreurs.

{{w:mco}}

Les valeurs estimées se notent avec un chapeau : $\hat{β}₁$ est la pente calculée sur *tes* données, alors que $β₁$ est la vraie pente, inconnue.

### Le R²

Le [[R²]] est la part de la dispersion de y que la droite « explique ». Il va de 0 (la droite n'explique rien) à 1 (tous les points sont sur la droite). Deux mises en garde qui reviennent dans le travail :

- un R² élevé ne prouve aucun effet causal ;
- on ne compare des R² qu'entre modèles qui expliquent **la même variable dépendante** (question 1.8).

### Plusieurs régresseurs

On peut ajouter d'autres variables : $y = β₀ + β₁ x₁ + β₂ x₂ + u$. Chaque coefficient se lit alors « **toutes choses égales par ailleurs** » : $β₁$ est l'effet de x₁ quand x₂ ne change pas. Dans R, tout cela s'écrit `lm(y ~ x1 + x2, data = base)`.

:::cle Tu dois savoir dire
Ce qu'est un résidu, ce que minimisent les MCO, et comment se lit une pente avec ses unités.
:::

#L incertitude | Erreur-type, intervalle de confiance et test | 12 min
>> Une estimation n'est jamais « le » vrai nombre. Cette leçon explique comment on mesure le doute, et comment on lit toutes les sorties de R.

### Pourquoi une estimation est incertaine

Tes 551 communes, tes 254 654 mères sont un échantillon parmi d'autres possibles. Avec d'autres observations, tu aurais obtenu une pente un peu différente. L'[[erreur-type]] mesure de combien l'estimation bougerait d'un échantillon à l'autre.

{{w:echantillon}}

Deux choses à retenir de cet outil :

- l'erreur-type **diminue quand le nombre d'observations augmente**, comme $1/\sqrt{n}$ : quatre fois plus de données, deux fois plus de précision ;
- R calcule l'erreur-type à partir d'**un seul** échantillon, grâce à une formule. Cette formule repose sur des hypothèses, et c'est pour cela qu'il existe plusieurs erreurs-types (classiques, robustes, groupées) : voir la leçon 7.

### L'intervalle de confiance

On entoure l'estimation d'une marge : **estimation ± 1,96 × erreur-type**. C'est l'[[intervalle de confiance]] à 95 %. Lecture correcte : la méthode qui construit ces intervalles attrape la vraie valeur 95 fois sur 100.

Exemple : élasticité 1,608, erreur-type 0,074. Intervalle : 1,608 ± 1,96 × 0,074 = [1,46 ; 1,75].

### Le test d'hypothèse, toujours en quatre étapes

L'énoncé demande plusieurs fois de dérouler un test « étape par étape ». Le plan est toujours le même.

1. **Hypothèses.** L'[[hypothèse nulle]] H₀ est l'affirmation qu'on met à l'épreuve (souvent « le coefficient vaut zéro », c'est-à-dire « pas d'effet »). H₁ est son contraire.
2. **Statistique.** Un nombre calculé sur les données. Pour un coefficient : $t = \frac{\hat{β}}{\text{erreur-type}}$, c'est-à-dire « à combien d'erreurs-types de zéro se trouve l'estimation ».
3. **Loi sous H₀.** Ce que vaudrait cette statistique par pur hasard si H₀ était vraie : une loi normale pour un t, une loi du khi-deux pour certains tests (Breusch-Pagan, Sargan).
4. **Décision.** Si la statistique tombe là où le hasard l'envoie rarement (au-delà de 1,96 en valeur absolue pour un t au seuil de 5 %), on **rejette** H₀.

La [[p-valeur]] résume les étapes 3 et 4 : c'est la probabilité d'obtenir une statistique au moins aussi extrême si H₀ était vraie. **p < 0,05 : on rejette H₀ au seuil de 5 %**, et on dit que le coefficient est « significatif ».

{{w:loi test=interaction}}

:::piege Trois erreurs classiques à l'oral
- **Ne pas rejeter H₀ ne prouve pas H₀.** Un test peut manquer de puissance : il ne voit pas un écart qui existe.
- **Significatif ne veut pas dire important.** Avec 254 654 mères, un écart minuscule devient significatif.
- **La p-valeur n'est pas la probabilité que H₀ soit vraie.**
:::

:::cle Tu dois savoir dire
Ce que mesure une erreur-type, comment on construit un intervalle à 95 %, et les quatre étapes d'un test.
:::

#L log | Logarithmes, pourcentages et élasticités | 10 min
>> Le logarithme transforme des écarts en pourcentages. C'est pour cela que la partie 1 l'utilise partout.

### Ce que fait le logarithme

Le logarithme naturel, noté ln (dans R : `log()`), a une propriété qui suffit à tout comprendre : **il transforme les multiplications en additions**.

$$ \ln(a × b) = \ln(a) + \ln(b) \quad \text{donc} \quad \ln(1,10 × x) − \ln(x) = \ln(1,10) ≈ 0,095 $$

Augmenter une valeur de 10 % ajoute toujours à peu près 0,095 à son logarithme, que l'on parte de 100 000 € ou de 800 000 €. En logarithme, **un même écart représente un même pourcentage**.

D'où l'approximation à connaître par cœur : pour une petite variation, **100 × (différence de logarithmes) ≈ variation en pourcentage**.

{{w:logpct}}

### Les quatre formes d'une régression

Selon qu'on met y, x, les deux ou aucun des deux en logarithme, la pente ne se lit pas de la même façon. C'est toute la question 1.6.

| Modèle | Équation | Lecture de β₁ |
|---|---|---|
| Niveau-niveau | $y = β₀ + β₁ x$ | x augmente d'**une unité** → y change de β₁ **unités** |
| Log-log | $\ln(y) = β₀ + β₁ \ln(x)$ | x augmente de **1 %** → y change de β₁ **%** : c'est une [[élasticité]] |
| Log-niveau | $\ln(y) = β₀ + β₁ x$ | x augmente d'**une unité** → y change d'environ 100 × β₁ **%** : une [[semi-élasticité]] |
| Niveau-log | $y = β₀ + β₁ \ln(x)$ | x augmente de **1 %** → y change de β₁ / 100 **unités** |

:::astuce La règle pour ne jamais se tromper
Regarde de quel côté se trouve le logarithme. Un **y en log** donne un effet **en pourcentage**. Un **x en log** se lit « pour une hausse de **1 %** de x ».
:::

### Quand l'approximation ne suffit plus

L'approximation « 100 × Δln ≈ % » ne vaut que pour les petites variations. Pour un grand écart, ou pour le coefficient d'une variable indicatrice, on utilise la formule exacte :

$$ \text{variation exacte en %} = 100 × (\exp(δ) − 1) $$

Exemple du travail : le coefficient de l'indicatrice Bruxelles vaut 0,895. L'approximation donnerait +89,5 % ; la valeur exacte est 100 × (exp(0,895) − 1) = **+144,7 %**.

:::cle Tu dois savoir dire
Pourquoi une différence de logarithmes est un pourcentage, comment lire une élasticité, et quand il faut passer à la formule exacte.
:::

#L indicatrices | Variables indicatrices et interactions | 8 min
>> Comment faire entrer une information qualitative (la région, le sexe d'un enfant, « traité ou non ») dans une régression.

### Une variable qui vaut 0 ou 1

Une [[indicatrice]] (ou variable muette, *dummy*) vaut 1 si l'observation appartient à une catégorie, 0 sinon : `Wallonie` vaut 1 pour une commune wallonne, 0 pour les autres.

Avec une **seule indicatrice** comme régresseur, la régression ne fait que comparer deux moyennes :

$$ y = β₀ + β₁ D + u \quad → \quad β₀ = \text{moyenne du groupe } D = 0, \quad β₁ = \text{écart entre les deux moyennes} $$

Retiens-le : c'est exactement la question 2.2, et la base de la double différence.

### La catégorie de référence

Pour trois régions, on ne met que **deux** indicatrices. La région laissée de côté (la Flandre, dans le travail) est la [[catégorie de référence]] : chaque coefficient mesure un écart **par rapport à elle**. Mettre les trois indicatrices *et* la constante est impossible : leur somme vaut toujours 1, comme la constante. C'est le piège de la [[colinéarité parfaite]] (question 1.9 b).

Géométriquement, des indicatrices ajoutées à un modèle donnent des **droites parallèles** : même pente, hauteurs différentes.

### L'interaction : des pentes différentes

Pour autoriser une pente propre à chaque région, on multiplie le régresseur par l'indicatrice. Ce produit s'appelle une [[interaction]] :

$$ \ln(prix) = β₀ + β₁ \ln(rev) + δ W + θ (W × \ln(rev)) + u $$

- en Flandre (W = 0), la pente est $β₁$ ;
- en Wallonie (W = 1), la pente est $β₁ + θ$.

Le coefficient $θ$ est donc la **différence de pente** entre les deux régions. Tester « les deux pentes sont égales » revient à tester $θ = 0$.

{{w:nuage modele=pentes titre="Essaie : droites parallèles, puis une pente par région"}}

:::cle Tu dois savoir dire
Ce que mesure le coefficient d'une indicatrice, pourquoi on en omet une, et ce que mesure le coefficient d'une interaction.
:::

#L hypotheses | Quand peut-on faire confiance aux MCO ? | 10 min
>> Deux hypothèses à distinguer absolument : l'une concerne la justesse du coefficient, l'autre seulement sa précision annoncée.

### L'exogénéité : le coefficient est-il juste ?

Pour que $\hat{β}₁$ mesure bien l'effet de x sur y, il faut que tout ce qui se trouve dans le terme d'erreur soit sans lien avec x :

$$ E(u \mid x) = 0 $$

En mots : parmi les observations qui ont le même x, les autres causes de y ne sont en moyenne ni favorables ni défavorables. On dit que x est [[exogène]]. Si un facteur caché influence y *et* est corrélé à x, l'hypothèse tombe : x est [[endogène]], et le coefficient est **biaisé**.

### Le biais de variable omise, avec son signe

Si on oublie une variable z, le coefficient de x absorbe une partie de son effet :

$$ \text{biais} = (\text{effet de z sur y}) × (\text{lien entre z et x}) $$

Il suffit de connaître les deux signes pour connaître le sens du biais.

| Effet de z sur y | Lien entre z et x | Biais |
|---|---|---|
| + | + | vers le haut |
| − | − | vers le haut |
| + | − | vers le bas |
| − | + | vers le bas |

Le travail te fait vérifier cette formule au chiffre près à la question 1.12, et l'utiliser pour raisonner aux questions 2.2 et 1.18.

### L'homoscédasticité : l'erreur-type est-elle juste ?

La formule « classique » de l'erreur-type suppose que la dispersion des erreurs est **la même pour toutes les observations** : c'est l'[[homoscédasticité]]. Si elle varie (par exemple, des erreurs plus dispersées dans les petites communes), on parle d'[[hétéroscédasticité]].

:::cle La distinction à ne jamais rater
- **Endogénéité** : le **coefficient** est faux. C'est grave et aucune option de R ne le corrige.
- **Hétéroscédasticité** : le coefficient reste juste, seules les **erreurs-types classiques** sont fausses. On les remplace par des erreurs-types **robustes**.
:::

### Les erreurs-types robustes HC1

L'énoncé impose partout les erreurs-types « robustes à l'hétéroscédasticité (HC1) ». Elles restent valables que la dispersion soit constante ou non. Dans R :

```r
coeftest(m, vcov = vcovHC(m, type = "HC1"))
```

Les coefficients sont **identiques** à ceux de `summary(m)` ; seules les colonnes erreur-type, t et p-valeur changent.

:::piege À l'oral
Ne dis jamais « l'hétéroscédasticité biaise les coefficients ». Elle fausse les erreurs-types classiques, donc les tests et les intervalles. Rien d'autre.
:::

:::cle Tu dois savoir dire
La différence entre un problème de biais et un problème d'erreur-type, et le signe d'un biais de variable omise.
:::

#L instruments | Variables instrumentales : l'idée | 9 min
>> Que faire quand la variable qui nous intéresse est endogène ? Trouver quelque chose qui la fait varier « par hasard ».

### Le problème

On veut l'effet d'un troisième enfant (X) sur le travail de la mère (Y). Mais avoir un troisième enfant est un **choix**, lié aux préférences, à la carrière, au revenu du conjoint : autant de facteurs cachés qui jouent aussi sur le travail. Les MCO sont biaisés.

### La solution

On cherche une variable Z, l'[[instrument]], qui remplit deux conditions.

1. **Pertinence.** Z fait réellement varier X. Ici : les parents de deux enfants de même sexe ont plus souvent un troisième enfant (41,4 % contre 34,6 %). Cette condition **se vérifie** dans les données.
2. **Exogénéité.** Z n'est lié à aucun facteur caché, et n'agit sur Y **que par l'intermédiaire de X**. Ici : le sexe d'un enfant est dû au hasard, et il ne devrait pas changer le travail de la mère autrement que par le nombre d'enfants. Cette condition **ne se vérifie pas** directement : elle se défend par des arguments.

{{w:dag schema=vi}}

### Le calcul, en une division

Si Z ne touche Y qu'à travers X, alors :

$$ \text{effet de X sur Y} = \frac{\text{effet de Z sur Y}}{\text{effet de Z sur X}} = \frac{\text{forme réduite}}{\text{première étape}} $$

Dans le travail : −0,426 semaine / 0,0675 = **−6,3 semaines** par enfant supplémentaire. C'est l'[[estimateur de Wald]]. Les doubles moindres carrés ([[2SLS]]) généralisent cette idée quand il y a des variables de contrôle ou plusieurs instruments.

### Le prix à payer

La VI n'utilise que la petite part des variations de X provoquée par Z. Elle est donc **beaucoup moins précise** que les MCO : dans le travail, l'erreur-type est quinze fois plus grande. On échange du biais contre de l'imprécision.

{{w:simiv}}

:::cle Tu dois savoir dire
Les deux conditions d'un bon instrument, laquelle se teste, et pourquoi l'estimation par VI est moins précise.
:::

#L did | Double différence, effets fixes et erreurs groupées | 9 min
>> Quand on suit les mêmes unités dans le temps, on peut comparer des évolutions plutôt que des niveaux.

### Deux comparaisons naïves, deux biais

Des localités reçoivent l'électricité en 2008-2009 (les « traitées »), d'autres seulement en 2015-2017 (le « groupe de comparaison »).

- **Comparer les deux groupes après** mélange l'effet du réseau avec tout ce qui les distinguait déjà avant.
- **Comparer les traitées avant et après** mélange l'effet du réseau avec tout ce qui a changé pour tout le monde entre-temps.

### La double différence

On fait les deux soustractions à la fois :

$$ DD = (\bar{y}_{T, après} − \bar{y}_{T, avant}) − (\bar{y}_{C, après} − \bar{y}_{C, avant}) $$

La première différence retire ce qui distingue durablement les groupes ; la seconde retire ce qui change pour tout le monde. Il reste ce qui change **seulement pour les traitées, seulement après**.

{{w:did}}

### L'hypothèse qui porte tout : les tendances parallèles

La double différence mesure un effet causal **si**, sans électricité, les traitées auraient évolué comme le groupe de comparaison. C'est l'hypothèse des [[tendances parallèles]]. Elle porte sur une situation qu'on n'observe jamais (le [[contrefactuel]]) : on peut la rendre plausible, jamais la prouver.

### Les effets fixes

Un [[effets fixes::effet fixe]] de localité est une constante propre à chaque localité : il absorbe tout ce qui ne change pas dans le temps pour elle (sa taille, sa situation). Un effet fixe d'année absorbe tout ce qui touche toutes les localités la même année. Avec les deux, il ne reste que la variation de la double différence.

{{w:effetsfixes}}

### Les erreurs-types groupées

Dix observations de la même localité ne sont pas dix informations indépendantes : ce qui rend une localité plus lumineuse que prévu une année a de bonnes chances de persister l'année suivante. Les [[erreurs-types groupées]] (*clustered*) en tiennent compte ; sans elles, on surestime la précision.

:::cle Tu dois savoir dire
Ce que retire chacune des deux différences, l'hypothèse des tendances parallèles, et pourquoi on groupe les erreurs-types par localité.
:::

#L lire-r | Lire une sortie de R | 6 min
>> Toutes les régressions du travail se lisent de la même façon. Autant apprendre le format une fois.

### Une ligne de `coeftest()`

```txt
                 Estimate Std. Error  t value  Pr(>|t|)
(Intercept)     -3.613805   0.752053  -4.8053 1.999e-06 ***
lrev             1.607820   0.074037  21.7165 < 2.2e-16 ***
regionWallonie  -0.204929   0.016638 -12.3170 < 2.2e-16 ***
regionBruxelles  0.894930   0.054719  16.3551 < 2.2e-16 ***
```

| Colonne | Ce que c'est | Sur la ligne `lrev` |
|---|---|---|
| `Estimate` | le coefficient estimé | 1,608 : l'élasticité |
| `Std. Error` | son erreur-type (ici robuste HC1) | 0,074 |
| `t value` | Estimate / Std. Error | 21,7 : très loin de zéro |
| `Pr(>\|t\|)` | la p-valeur du test « coefficient = 0 » | < 2,2 × 10⁻¹⁶ : pratiquement nulle |

- `(Intercept)` est la constante.
- `regionWallonie` est l'indicatrice créée automatiquement par R à partir du facteur `region` : le nom de la variable collé au nom de la catégorie.
- Les étoiles résument la p-valeur : `***` < 0,001, `**` < 0,01, `*` < 0,05.
- `1.999e-06` se lit 1,999 × 10⁻⁶, soit 0,000002.

:::astuce Trois réflexes
- L'intervalle de confiance à 95 % n'est pas affiché : c'est Estimate ± 1,96 × Std. Error.
- Le R² n'est pas dans `coeftest()` : `summary(m)$r.squared`.
- Vérifie toujours le nombre d'observations avec `nobs(m)` : R supprime sans prévenir les lignes qui ont une valeur manquante.
:::

:::piege `summary()` n'est pas `coeftest()`
`summary(lm(...))` affiche les erreurs-types **classiques**. L'énoncé demande les robustes : les coefficients sont les mêmes, mais pas les erreurs-types, ni les t, ni les p-valeurs. Tous les chiffres du rapport doivent venir de `coeftest(m, vcov = vcovHC(m, type = "HC1"))`.
:::

:::cle Tu dois savoir dire
Lire à voix haute n'importe quelle ligne d'une sortie : le coefficient et son unité, son erreur-type, s'il est significatif, et son intervalle de confiance.
:::
