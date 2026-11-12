# Atelier R : écrire ton propre script

>> Tu n'as pas besoin de savoir programmer. Une douzaine de fonctions suffisent pour tout le travail, et chacune fait une chose simple. Cette page te donne le squelette, les gestes, les pièges, et de quoi vérifier que ton code est juste.

## Ce que l'énoncé exige du script

| Exigence | Ce que ça veut dire en pratique |
|---|---|
| **Un seul script** | Un fichier `.R` qui reproduit tout ce qui figure dans le rapport : tableaux, graphiques, régressions, chiffres cités. |
| **Une première ligne imposée** | `dossier <- "C:/Users/.../donnees/"`. C'est la seule ligne que les assistantes modifieront. |
| **Exécution sans erreur** | Du début à la fin, sur un autre ordinateur que le tien. |
| **Fichiers intacts** | Les quatre fichiers gardent leur nom et ne sont jamais modifiés à la main : tout se fait dans le script. |
| **Packages** | Chargés au début avec `library()`. Aucun `install.packages()` actif. |
| **Erreurs-types** | Robustes HC1 partout, sauf indication contraire. |
| **Résultats enregistrés** | Proposé par l'énoncé : un dossier `resultats`, des noms `tab_1_4`, `fig_1_5`, `reg_1_6`. |

Et la consigne qui compte le plus pour l'oral : chaque membre du groupe doit pouvoir **expliquer le code**.

## Installer et préparer, une seule fois

1. **Installe R (version 4.2 ou plus récente) et RStudio.** La version compte : voir le premier piège plus bas.
2. **Crée un dossier `donnees`** avec les quatre fichiers, sans les renommer et sans les ouvrir dans Excel (Excel peut modifier l'encodage et les codes des communes).
3. **Crée un projet RStudio** : *File > New Project > New Directory*. Le dossier du projet devient le répertoire de travail : c'est là que `resultats` sera créé.
4. **Installe les packages dans la console**, pas dans le script :

```r
install.packages(c("dplyr", "ggplot2", "lmtest", "sandwich", "car", "AER", "haven"))
```

5. **Exécute ligne par ligne** avec Ctrl + Entrée pour voir chaque résultat. Pour tout lancer d'un coup : Ctrl + Maj + Entrée.

## Le squelette du script

Ces lignes forment le début de ton script. Je les ai exécutées telles quelles sur tes fichiers.

```r
dossier <- "C:/Users/.../donnees/"     # seule ligne que les assistantes modifieront

# ---- Packages : chargés ici, jamais installés dans le script
library(dplyr)      # filter, mutate, group_by, summarise, jointures
library(ggplot2)    # graphiques
library(lmtest)     # coeftest(), bptest()
library(sandwich)   # vcovHC() : erreurs-types HC1 ; vcovCL() : erreurs-types groupées
library(car)        # linearHypothesis() : tests de restrictions
library(AER)        # ivreg() : variables instrumentales
library(haven)      # read_dta() : fichier Stata de la partie 3

# ---- Réglages communs
dir.create("resultats", showWarnings = FALSE)
rob <- function(m) coeftest(m, vcov = vcovHC(m, type = "HC1"))   # erreurs-types HC1

# ---- Lecture des quatre fichiers
immo_raw <- read.delim(file.path(dossier, "vastgoed_2010_9999.txt"),
                       sep = "|", fileEncoding = "latin1",
                       colClasses = c(CD_REFNIS = "character"))
fisc_raw <- read.delim(file.path(dossier, "TF_PSNL_INC_TAX_MUNTY.txt"),
                       sep = "|", fileEncoding = "UTF-8-BOM",
                       colClasses = c(CD_MUNTY_REFNIS = "character"))
load(file.path(dossier, "Fertility.RData"))                 # crée l'objet Fertility
elec_raw <- read_dta(file.path(dossier, "elec_data.dta"))

# ---- Premier contrôle
dim(immo_raw); dim(fisc_raw); dim(Fertility); dim(elec_raw)
```

:::verif Ce que tu dois voir après la dernière ligne
Avec tes fichiers : `286120 13`, puis `11039 49`, puis `254654 8`, puis `20090 8` (lignes, colonnes). Si les deux premières tables n'ont qu'**une** ligne, va directement au premier piège.
:::

**La fonction `rob()`.** L'énoncé demande des erreurs-types HC1 partout, avec `coeftest(m, vcov = vcovHC(m, type = "HC1"))`. Plutôt que de recopier cette ligne soixante fois, on lui donne un nom. `rob(m)` prend un modèle estimé et renvoie son tableau de coefficients avec erreurs-types robustes. C'est la seule fonction « maison » dont tu as vraiment besoin.

## Les fonctions qui font tout le travail

| Fonction | Package | Ce qu'elle fait | Première utilisation |
|---|---|---|---|
| `read.delim()` | base | lit un fichier texte dont les colonnes sont séparées par un caractère | [1.1](#q-1-1) |
| `filter()` | dplyr | garde les lignes qui vérifient une condition | [1.1](#q-1-1) |
| `mutate()` | dplyr | crée ou modifie une colonne | [1.1](#q-1-1) |
| `group_by()` puis `summarise()` | dplyr | calcule quelque chose par groupe | [1.4](#q-1-4) |
| `inner_join()`, `anti_join()` | dplyr | fusionne deux tables ; liste les lignes sans correspondance | [1.1](#q-1-1) |
| `lm()` | stats | régression par MCO | [1.6](#q-1-6) |
| `coeftest()` avec `vcovHC()` | lmtest, sandwich | tableau de coefficients avec erreurs-types HC1 | [1.6](#q-1-6) |
| `relevel()` | stats | change la catégorie de référence | [1.11](#q-1-11) |
| `linearHypothesis()` | car | teste une ou plusieurs restrictions sur les coefficients | [1.13](#q-1-13) |
| `bptest()` | lmtest | test de Breusch-Pagan | [1.14](#q-1-14) |
| `ivreg()` | AER | variables instrumentales et 2SLS | [2.6](#q-2-6) |
| `vcovCL()` | sandwich | erreurs-types groupées | [3.8](#q-3-8) |
| `ggplot()` puis `ggsave()` | ggplot2 | dessine un graphique ; l'enregistre | [1.4](#q-1-4) |

**L'enchaînement `%>%`.** Il se lit « puis ». `communes %>% filter(region == "Wallonie") %>% summarise(mean(prix))` : prends `communes`, **puis** garde la Wallonie, **puis** calcule la moyenne du prix. R propose aussi `|>`, qui fait la même chose. Choisis l'un des deux et garde-le.

## Écrire une formule

Toutes les régressions s'écrivent avec la même grammaire : la variable expliquée, un tilde, les variables explicatives.

| Tu écris | R comprend |
|---|---|
| `y ~ x1 + x2` | `y` expliqué par `x1` et `x2`, avec une constante |
| `log(y) ~ log(x)` | un modèle log-log, sans créer de colonnes |
| `y ~ x * region` | `x + region + x:region` : effets principaux et interaction |
| `y ~ x:region` | l'interaction seule |
| `y ~ factor(id)` | une indicatrice par valeur de `id` : des effets fixes |
| `y ~ x + w \| z + w` | dans `ivreg()` : `x` est endogène, `z` est l'instrument, `w` un contrôle écrit des deux côtés |

Une variable de type texte ou `factor` crée automatiquement une indicatrice par catégorie, sauf la première, qui sert de référence. Pour choisir la référence : `relevel(factor(region), ref = "Wallonie")`.

## Enregistrer chaque résultat

L'énoncé propose trois lignes types. Le nom reprend toujours le numéro de la question.

```r
# un tableau
write.csv(tab_1_4, "resultats/tab_1_4.csv", row.names = FALSE)

# un graphique ggplot2
ggsave("resultats/fig_1_5.png", fig_1_5, width = 7, height = 4.5)

# une régression, avec erreurs-types robustes
capture.output(rob(reg_1_6), file = "resultats/reg_1_6.txt")
```

Dans le rapport, chaque tableau et chaque graphique porte le numéro de la question, un titre, les unités et la source des données.

## Lire une sortie

La leçon [Lire une sortie de R](#b-lire-r) détaille chaque colonne. L'essentiel tient en une ligne :

```
             Estimate Std. Error t value  Pr(>|t|)
lrev         1.607820   0.074037 21.7165 < 2.2e-16 ***
```

`Estimate` est le coefficient, `Std. Error` son erreur-type, `t value` leur rapport, `Pr(>|t|)` la p-valeur. L'intervalle de confiance à 95 % : coefficient ± 1,96 × erreur-type.

:::piege Les erreurs-types affichées par défaut ne sont pas les bonnes
`summary(lm(...))` affiche les erreurs-types **classiques**, qui supposent l'homoscédasticité. Pour le modèle log-log de la question 1.6, elle annonce 0,081 là où l'erreur-type HC1 vaut 0,149 : presque moitié moins. N'utilise `summary()` que pour le R² : `summary(m)$r.squared`.
:::

## Les deux scripts côte à côte

Les deux scripts donnent les mêmes résultats. Ils ne sont pas écrits de la même façon, et la différence compte pour toi : c'est **ton** script que tu devras expliquer.

| | Script de ChatGPT | Script de Claude |
|---|---|---|
| Longueur | 526 lignes | 1 068 lignes |
| Commentaires | 41 lignes | 194 lignes |
| Lignes de plus de 100 caractères | 61 | 3 |
| Enchaînement | `\|>` | `%>%` |
| Packages | dplyr, haven, lmtest, sandwich, AER | les mêmes, plus ggplot2 et car |
| Graphiques | graphiques de base (`png()`, `plot()`) | ggplot2 et `ggsave()`, comme dans l'énoncé |
| Erreurs-types HC1 | une fonction maison `reg_table()` | `rob()`, la ligne de l'énoncé |
| Tests de restrictions | fonctions maison `contraste()` et `wald_F()` | `linearHypothesis()` |
| Nom des objets | courts : `m9`, `b`, `cf` | ceux de l'énoncé : `reg_1_9`, `tab_1_10` |
| Résultats | 83 fichiers dans le dossier des **données**, régressions en `.csv` | 85 fichiers dans `resultats`, régressions en `.txt` |
| Vérifications internes | 14 `stopifnot()` | aucune |

**La même question, deux écritures.** Voici la régression de la question 1.9.

```r
# ChatGPT
m9 <- lm(lprix ~ lrev+region, b)
sauver(reg_table(m9),"reg_1_9")
```

```r
# Claude
reg_1_9 <- lm(lprix ~ lrev + region, data = base)
rob(reg_1_9)
capture.output(rob(reg_1_9), summary(reg_1_9)$r.squared,
               file = "resultats/reg_1_9.txt")
```

La première est plus courte, mais il faut aller lire `sauver()` et `reg_table()` pour savoir ce qui se passe. La seconde se lit sans rien chercher.

### Ce qu'il faut prendre chez chacun

- **De Claude** : la structure. Une section par question, les noms d'objets de l'énoncé, `rob()`, des commentaires qui disent **pourquoi**. C'est le script le plus proche de ce que l'énoncé décrit, et le plus facile à expliquer.
- **De ChatGPT** : le réflexe de vérifier. Ses `stopifnot()` contrôlent par exemple que les coefficients recalculés à la main (1.10) sont identiques à ceux de `relevel()` (1.11). Fais ces vérifications toi aussi, dans la console.

### Deux points de vigilance sur le script de ChatGPT

- **Il s'arrête si une vérification échoue.** `stopifnot(nrow(b) == 551L)` interrompt tout le script si la base ne compte pas exactement 551 communes. Avec tes fichiers, toutes les vérifications passent. Mais si les assistantes utilisent un téléchargement plus récent des fichiers Statbel, un tel test peut arrêter l'exécution, alors que l'énoncé exige un script qui tourne jusqu'au bout.
- **Il écrit ses résultats dans le dossier des données** (`file.path(dossier, "resultats")`), pas dans un dossier `resultats` du répertoire de travail comme le propose l'énoncé.

## Dix pièges, dont plusieurs silencieux

Les pires erreurs sont celles qui ne produisent aucun message. Les quatre premières sont de ce type.

1. **La session R n'est pas en UTF-8.** Je l'ai reproduit : R ne lit alors qu'**une seule ligne** de chaque fichier Statbel, affiche un simple avertissement (`invalid input found on input connection`) et continue. Les deux scripts échouent ensuite, plus loin, avec un message sans rapport. Le remède sous Windows : R 4.2 ou plus récent, qui travaille en UTF-8. Sur un autre système, `Sys.getlocale()` doit mentionner UTF-8. Le contrôle dans tous les cas : `dim(immo_raw)` doit afficher 286 120 lignes.
2. **Le code INS lu comme un nombre.** Sans `colClasses = c(CD_REFNIS = "character")`, le code `01000` devient `1000` et les fusions de tables perdent des lignes.
3. **Les valeurs manquantes.** `lm()` retire sans prévenir les lignes incomplètes. Vérifie toujours `nobs(m)` : 551, 254 654, 2 866. Et `mean()` renvoie `NA` s'il y a une seule valeur manquante : ajoute `na.rm = TRUE`.
4. **Anvers.** La fusion des deux tables « réussit » alors que le code 11002 ne désigne pas le même territoire des deux côtés ([question 1.1](#q-1-1)).
5. **`summary()` au lieu de `rob()`.** Les coefficients sont justes, les erreurs-types ne sont pas celles demandées.
6. **La catégorie de référence.** C'est l'ordre des catégories qui la fixe. Si tes coefficients de région ont le mauvais signe, regarde `levels(base$region)`.
7. **Filtrer sur un texte accentué.** `"façades"` est exactement le genre de mot qu'un problème d'encodage abîme. Préfère le libellé néerlandais, sans accent, ou `startsWith()`.
8. **Une variable fixe avec des effets fixes.** Placée après eux, `treated` vaut `NA`. Placée avant, R affiche un nombre qui n'a aucun sens ([question 3.7](#q-3-7)).
9. **Les couleurs dans ggplot.** Mets `aes(colour = region)` dans `geom_point()`. Dans `ggplot()`, `geom_smooth()` tracerait une droite par région.
10. **`setwd()` et `install.packages()` dans le script.** Les deux le font planter sur un autre ordinateur. Aucun des deux ne doit rester actif dans la version remise.

La partie 2 porte sur 254 654 mères : elle peut prendre une minute. C'est normal.

## Valeurs de contrôle

Si tu retrouves ces nombres avec ton propre code, il est juste. Coche-les au fur et à mesure.

{{w:controles}}

Un écart à la quatrième décimale n'a pas d'importance. Un écart à la première signale une erreur d'échantillon : commence par vérifier `nobs(m)`.

## S'approprier le script

Un script que tu as seulement relu, tu ne sauras pas le défendre. Voici ce qui fait vraiment la différence, du plus simple au plus exigeant.

1. **Retape-le au lieu de le copier.** Partie par partie, en exécutant chaque ligne. C'est lent, et c'est le but : tu vois chaque résultat intermédiaire.
2. **Écris tes propres commentaires.** Avant chaque bloc, une phrase : ce qu'il calcule et pourquoi. Si tu n'arrives pas à l'écrire, tu ne sais pas encore l'expliquer.
3. **Fais tes propres choix là où l'énoncé en laisse.** Les quatre statistiques de la question 2.1, les trois de la question 3.1, le libellé des axes, le titre des tableaux, la catégorie de référence : rien n'oblige à reprendre ceux des corrigés.
4. **Supprime ce que tu ne sais pas justifier.** Une vérification supplémentaire, une fonction maison, une régression hors énoncé : si tu ne peux pas dire à quoi elle sert, elle te desservira à l'oral.
5. **Casse-le exprès.** Retire `colClasses`, remplace `rob()` par `summary()`, oublie `na.rm = TRUE`, et regarde ce qui change. C'est la meilleure façon de comprendre à quoi sert chaque ligne.
6. **Fais-le tourner ailleurs.** Sur l'ordinateur d'un autre membre du groupe, dans une session neuve, en ne changeant que la première ligne. C'est exactement ce que feront les assistantes.
7. **Explique-le à voix haute.** Prends un bloc au hasard et décris-le à quelqu'un du groupe sans lire les commentaires. Les [cartes d'oral](#oral) te donnent les questions probables.

:::cle Le test final
Pour chaque chiffre de ton rapport, tu dois pouvoir montrer la ligne du script qui le produit, et dire en une phrase ce qu'elle fait.
:::
