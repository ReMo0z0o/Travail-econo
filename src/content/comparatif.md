# ChatGPT et Claude : deux corrigés, les mêmes chiffres

>> Les deux arrivent aux mêmes résultats. Ce qui les sépare, c'est la façon d'expliquer, la prudence, la profondeur, et quelques choix de méthode. Cette page fait le bilan, puis liste tous les points où tu as un choix à faire.

## Le verdict en une minute

:::cle Quatre constats
- **Sur les chiffres : égalité.** J'ai exécuté les deux scripts sur tes fichiers. Tous les résultats principaux coïncident : 551 communes, élasticités de 1,444 et 1,608, effet 2SLS de −5,46 semaines, double différence de 0,380.
- **Sur les réponses : 84 sous-questions sur 121 reçoivent la même réponse.** Les 37 autres diffèrent par la méthode, la profondeur ou la conclusion, presque jamais par le fond.
- **Aucun des deux n'est « le bon ».** ChatGPT est plus concis et plus prudent. Claude explique davantage et vérifie plus de choses dans les données. Les deux contiennent des erreurs ou des affirmations que je n'ai pas pu vérifier.
- **Le bon usage** : ne recopier ni l'un ni l'autre. Pour chaque divergence, choisis le raisonnement que tu sais défendre, puis réécris-le avec tes mots.
:::

Une précision honnête : cet atelier a lui-même été rédigé par Claude. J'ai jugé chaque point sur pièces, en refaisant les calculs, et chaque conseil est argumenté pour que tu puisses ne pas être d'accord.

## Deux façons de travailler

| | ChatGPT | Claude |
|---|---|---|
| Documents | un corrigé de 30 pages et un guide R de 13 pages | un guide de 52 pages (réponses, guide R, oral) et un dossier de résultats de référence |
| Script R | 526 lignes, 41 lignes de commentaires | 1 068 lignes, 194 lignes de commentaires |
| Plan d'une réponse | le résultat, puis sa lecture en deux ou trois phrases | la réponse courte, le raisonnement, les chiffres, le code |
| Ton | dense, technique, prudent | pas à pas, plus affirmatif |
| Ce qu'il ajoute volontiers | intervalles de confiance, références aux articles, mises en garde | vérifications sur les données, analyses supplémentaires, pièges de R |
| Risque principal | des outils qui dépassent le cours, difficiles à expliquer à l'oral | plus de matière que la question n'en demande |

## Ce que chacun fait de mieux

### ChatGPT

- **La prudence des formulations.** Il écrit qu'un groupe de comparaison est plus comparable « sans garantir les tendances parallèles » (3.2 d), que les effets fixes d'année « ne corrigent pas un changement de satellite qui affecterait différemment les groupes » (3.7 b), que 0,158 école n'est pas « +15,8 % » (3.5 a).
- **Les intervalles de confiance.** Il en donne presque partout. Celui du placebo (de −4,1 à +6,7 points) est le meilleur argument de la question 3.6 (d).
- **La concision.** Ses conclusions tiennent dans les trois phrases demandées (1.18 c, 2.14 d, 3.9 c).
- **Les règles documentées.** Pour les 14 communes sans prix médian, il cite la règle de Statbel (pas de médiane sous 16 ventes) au lieu de la deviner (1.1 f).
- **Les contrôles de son script.** 14 lignes `stopifnot()` vérifient que les résultats intermédiaires sont bien ceux attendus.

### Claude

- **L'explication.** Chaque réponse commence par l'essentiel, puis déroule le raisonnement. C'est le format le plus utile quand on part de zéro.
- **Les preuves par les données.** Deux comptages qui démontrent d'où vient l'écart entre 565 et 581 communes (1.1 c) ; la formule qui reconstitue exactement le biais de variable omise (1.12) ; 75 % contre 40 % de localités dans l'échantillon d'intensité (3.5 b) ; la corrélation de 0,66 entre résidus successifs (3.8 b).
- **Le respect de la question posée.** Quand l'énoncé demande « quelle hypothèse », il nomme l'homoscédasticité (1.3 c). Quand il demande un avis, il prend position puis nuance (1.5 b, 1.16, 2.14 d).
- **Les conventions de l'énoncé.** Dossier `resultats`, noms `tab_`, `fig_`, `reg_`, graphiques avec ggplot2, fonction `rob()` : son script ressemble à ce que les assistantes attendent.
- **La transparence.** Il dit clairement qu'il n'a pas pu lire le tableau 4 de l'article (3.4 c).

## Ce qui est faux, approximatif ou invérifiable

| Point | Qui | Ce qu'il en est |
|---|---|---|
| Date de la fusion Bastogne-Bertogne (1.1 c) | les deux | Ils écrivent le 1er décembre 2024. La date d'effet est le **2 décembre 2024**. |
| Valeur de la colonne « DiD : TWFE » du tableau 4 (3.4 c) | ChatGPT : 0,396 (0,046). Claude : non lu. | **Invérifiable ici.** Le fichier fourni ne permet pas de retrouver 0,396. À lire dans l'article. |
| −11,3 points, tableau 7 d'Angrist et Evans (2.13 a) | ChatGPT | Hors énoncé et non vérifié. Ne le cite que si tu le retrouves. |
| Raison du maintien du code INS d'Anvers (1.1 d) | ChatGPT | Plausible (une fusion qui change la population de 2 %), mais je n'ai pas pu confirmer la source citée. |
| « Le nombre d'écoles électrifiées augmente » (3.5 a) | les deux | Il est stable chez les traitées (0,49 puis 0,50) et baisse dans le groupe de comparaison (0,30 puis 0,15). |
| « Écart stable de 2 à 3 points » avant 2008 (3.6 b) | Claude | L'écart va de 0,8 à 4,3 points. |
| Autres résultats de l'article (3.9 b) | les deux | Concordants entre eux et avec l'énoncé, mais je n'ai pas pu lire l'article. |

## Ce que ni l'un ni l'autre n'a vu

Ces points viennent de mes propres vérifications sur tes fichiers. Tu n'es pas obligé de les utiliser, mais ils peuvent faire la différence à l'oral.

- **La série des écoles électrifiées change de régime entre 2005 et 2006** : dans tout l'échantillon, la part des localités ayant au moins une école électrifiée passe de 54 % à 6 %. La période « avant » mélange donc deux mesures ([question 3.5](#q-3-5)).
- **Le coefficient de 0,158 sur les écoles vient surtout d'une baisse du groupe de comparaison**, pas d'une hausse chez les traitées. Avec des erreurs-types groupées, il n'est plus significatif (p = 0,18) ([question 3.8](#q-3-8)).
- **Grouper les erreurs-types ne les augmente pas toujours** : pour l'intensité lumineuse, elles diminuent (0,097 contre 0,140).
- **L'échelle d'intensité lumineuse change de zéro en 2012** : une année sans lumière vaut −0,214 jusqu'en 2011, puis 0.
- **Contrôler `nschool_elec` fait baisser l'effet à 0,26, mais à cause des deux années perdues**, pas du contrôle lui-même ([question 3.7](#q-3-7)).
- **Les deux scripts s'arrêtent dès la lecture des fichiers si la session R n'est pas en UTF-8.** Voir l'[atelier R](#atelier).

## Six décisions à prendre une fois pour tout le rapport

Beaucoup de divergences se ramènent à la même poignée de choix. Tranche-les une fois, et applique ta règle partout.

### 1. Des fonctions que tu sais expliquer, ou des outils plus généraux ?

ChatGPT écrit ses propres fonctions (`contraste()`, `wald_F()`), calcule une covariance là où une hypothèse d'indépendance suffit (2.10 b), utilise un intervalle de Wilson (2.5 a) et un test J de Hansen par GMM (2.11). Ces choix sont rigoureux, et ils donnent **les mêmes nombres** que les versions simples. Mais à l'oral, on te demandera d'expliquer ton code ligne par ligne.

**Conseil** : la méthode la plus simple qui donne le bon résultat. Tu peux ajouter une phrase du type « un calcul plus complet donne le même chiffre ».

### 2. Jusqu'où aller au-delà de l'énoncé ?

Claude ajoute une régression qui sépare les périodes DMSP et VIIRS (3.6 e). ChatGPT ajoute un test de sensibilité sur le codage des valeurs manquantes (1.15 a) et un chiffre supplémentaire de l'article (2.13 a).

**Conseil** : garde un ajout s'il remplit trois conditions. Il **sert la réponse** à la question posée, tu **sais l'expliquer**, et il est **vérifié**. Sinon, garde-le pour l'oral.

### 3. Trancher, ou présenter les deux lectures ?

Plusieurs questions demandent un avis : « vous paraît-elle », « quel estimateur retenez-vous », « que concluez-vous ». ChatGPT a tendance à juxtaposer ; Claude à choisir puis nuancer.

**Conseil** : une position, sa raison, puis sa limite. Et de la cohérence : ta réponse à la question 2.12 doit annoncer celle de 2.14 (d).

### 4. Intervalles de confiance : 1,96 ou la loi de Student ?

ChatGPT utilise le quantile de la loi de Student (1,964 ou 1,968 selon l'échantillon) ; Claude utilise 1,96. À deux décimales, les intervalles sont identiques (1.13 a, 3.8 a).

**Conseil** : choisis l'un, dis-le une fois, et garde-le dans tout le rapport.

### 5. Citer les articles

Trois endroits demandent une comparaison avec un article : 2.6 et 2.13 (Angrist et Evans), 3.4 (c) et 3.9 (b) (Schmidt et Moradi).

**Conseil** : ne cite que des chiffres que tu as lus toi-même, avec le numéro du tableau. C'est le seul point où aucun des deux corrigés ne peut te remplacer.

### 6. Le style du script

`%>%` ou `|>`, ggplot2 ou graphiques de base, fichiers `.txt` ou `.csv` : les deux scripts font des choix opposés. L'[atelier R](#atelier) les compare et t'aide à écrire le tien.

## Tous les points de divergence

Chaque ligne renvoie à la sous-question, avec le conseil correspondant. Tes choix, une fois cochés, apparaissent ici et dans [Mon rapport](#choix).

{{w:divergences}}
