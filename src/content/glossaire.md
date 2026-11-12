#T Observation | observations
Une ligne du tableau de données : une commune, une mère, une localité observée une année donnée.
@voir b-donnees

#T Unité statistique | unite statistique
Ce que représente une ligne du tableau. Partie 1 : une commune en 2023. Partie 2 : une mère. Partie 3 : une localité une année donnée.
@voir b-donnees

#T Panel | donnees de panel
Données où les mêmes unités sont observées à plusieurs dates. Dans la partie 3, 574 localités suivies chaque année.
@voir q-3-1

#T Médiane | mediane, prix median
Valeur qui partage les observations en deux moitiés égales. Peu sensible aux valeurs extrêmes, contrairement à la moyenne.
@voir b-donnees

#T Écart interquartile | ecart interquartile, EIQ, quartile, quartiles
Différence entre le troisième quartile (p75) et le premier (p25). Mesure la dispersion de la moitié centrale des observations.
@voir q-1-3

#T Coefficient d'asymétrie | asymetrie, skewness
Mesure du déséquilibre entre les deux queues d'une distribution : nul si elle est symétrique, positif si la queue de droite est plus longue, négatif si c'est celle de gauche.
@voir q-1-4

#T Variable dépendante | variable dependante, variable expliquee
La variable qu'on cherche à expliquer, notée y, à gauche du `~` dans une formule R.
@voir b-mco

#T Régresseur | regresseur, variable explicative, regresseurs
Une variable placée à droite du `~`, qui sert à expliquer la variable dépendante.
@voir b-mco

#T MCO | moindres carres ordinaires, moindres carres, OLS
Moindres carrés ordinaires : méthode qui choisit la droite (ou le plan) rendant la somme des carrés des résidus la plus petite possible. Fonction `lm()` dans R.
@voir b-mco

#T Coefficient | coefficients, pente, coefficient de pente
Nombre estimé qui mesure de combien la variable dépendante change quand un régresseur augmente d'une unité, les autres régresseurs restant fixes.
@voir b-mco

#T Constante | intercept, ordonnee a l'origine
Valeur prédite de y quand tous les régresseurs valent zéro. Notée `(Intercept)` dans R. Souvent sans interprétation concrète.
@voir b-mco

#T Résidu | residu, residus
Écart entre la valeur observée et la valeur prédite par le modèle estimé. C'est l'estimation du terme d'erreur, observation par observation.
@voir b-mco

#T Terme d'erreur | terme d erreur, erreur, u
Tout ce qui fait varier y en dehors des régresseurs du modèle. On ne l'observe pas. Les hypothèses importantes portent sur lui.
@voir b-hypotheses

#T Valeur ajustée | valeurs ajustees, valeur predite, prediction
Valeur de y prédite par le modèle estimé pour une observation. Valeur observée = valeur ajustée + résidu.

#T R² | r2, r carre, coefficient de determination
Part de la variance de la variable dépendante expliquée par le modèle, entre 0 et 1. Ne se compare qu'entre modèles ayant la même variable dépendante.
@voir q-1-8

#T Erreur-type | erreur type, erreurs-types, standard error, ET
Mesure de l'imprécision d'une estimation : de combien elle varierait d'un échantillon à l'autre. Plus elle est petite, plus l'estimation est précise.
@voir b-incertitude

#T Statistique t | t, t value, statistique de test
Coefficient divisé par son erreur-type. Indique à combien d'erreurs-types de zéro se trouve l'estimation. Au-delà de 1,96 en valeur absolue : significatif à 5 %.
@voir b-incertitude

#T p-valeur | p valeur, p-value, valeur p
Probabilité d'obtenir une statistique au moins aussi extrême que celle observée si l'hypothèse nulle était vraie. Petite p-valeur : les données contredisent H₀.
@voir b-incertitude

#T Intervalle de confiance | IC, intervalle de confiance a 95
Plage de valeurs plausibles pour le vrai coefficient : estimation ± 1,96 × erreur-type pour un niveau de 95 %.
@voir b-incertitude

#T Hypothèse nulle | H0, hypothese nulle
L'affirmation qu'un test met à l'épreuve, par exemple « le coefficient vaut zéro ». On la rejette si les données la rendent trop peu plausible ; ne pas la rejeter ne la prouve pas.
@voir b-incertitude

#T Significatif | significativite, significatif a 5
Se dit d'un coefficient dont on rejette qu'il soit nul, à un seuil donné (5 % en général). Ne dit rien de l'importance pratique de l'effet.
@voir b-incertitude

#T Puissance d'un test | puissance
Capacité d'un test à rejeter H₀ quand elle est fausse. Un test peu puissant laisse passer des écarts réels : son non-rejet n'est pas une preuve.

#T Loi du khi-deux | khi-deux, khi2, chi-deux, chi2
Loi suivie sous H₀ par les statistiques de plusieurs tests du travail (Breusch-Pagan, Sargan). Dépend d'un nombre de degrés de liberté.
@voir q-1-14

#T Degrés de liberté | degres de liberte, ddl
Paramètre d'une loi de test. Pour un khi-deux : le nombre de restrictions testées. Pour Sargan : nombre d'instruments moins nombre de variables endogènes.

#T Logarithme | log, ln, logarithme naturel
Fonction qui transforme les multiplications en additions. Une différence de logarithmes est approximativement une variation en pourcentage. `log()` dans R.
@voir b-log

#T Élasticité | elasticite, elasticites
Variation en pourcentage de y associée à une variation de 1 % de x. C'est la pente d'un modèle log-log.
@voir q-1-6

#T Semi-élasticité | semi-elasticite
Variation en pourcentage de y associée à une hausse d'une unité de x. C'est 100 fois la pente d'un modèle log-niveau.
@voir q-1-6

#T Forme fonctionnelle | formes fonctionnelles
Choix de mettre ou non la variable dépendante et les régresseurs en logarithme (niveau-niveau, log-log, log-niveau, niveau-log). Chaque forme impose une relation différente.
@voir q-1-6

#T Indicatrice | indicatrices, variable indicatrice, dummy, variable muette, variable binaire
Variable qui vaut 1 si l'observation appartient à une catégorie, 0 sinon.
@voir b-indicatrices

#T Catégorie de référence | categorie de reference, reference
La catégorie pour laquelle on ne met pas d'indicatrice. Tous les coefficients d'indicatrices mesurent un écart par rapport à elle.
@voir q-1-9

#T Colinéarité parfaite | colinearite parfaite, colinearite, piege des variables indicatrices
Situation où un régresseur est une combinaison exacte des autres. Les MCO n'ont alors pas de solution unique, et R renvoie `NA` pour un coefficient.
@voir q-1-9

#T Interaction | interactions, terme d'interaction
Produit de deux régresseurs. Son coefficient mesure de combien l'effet de l'un change selon la valeur de l'autre (une pente différente par région, par exemple).
@voir q-1-13

#T Centrage | centrer, variable centree
Soustraire une constante à un régresseur pour déplacer son point zéro. Ne change pas les pentes, mais rend interprétables la constante et les indicatrices.
@voir q-1-13

#T Exogène | exogene, exogeneite, exogenes
Se dit d'un régresseur sans lien avec le terme d'erreur : $E(u \mid x) = 0$. Condition pour que son coefficient ne soit pas biaisé.
@voir b-hypotheses

#T Endogène | endogene, endogeneite
Se dit d'un régresseur corrélé au terme d'erreur. Son coefficient MCO est biaisé. Causes : variable omise, causalité inverse, erreur de mesure.
@voir q-2-2

#T Biais de variable omise | variable omise, biais de variable omise
Biais d'un coefficient quand on oublie une variable qui influence y et qui est corrélée au régresseur. Signe = (effet de la variable omise sur y) × (son lien avec le régresseur).
@voir q-1-12

#T Facteur de confusion | confusion, facteur cache
Variable qui agit à la fois sur la cause supposée et sur le résultat, et crée une association sans lien causal.
@voir b-causalite

#T Causalité inverse | causalite inverse
Situation où c'est y qui influence x, et non (seulement) l'inverse.
@voir q-1-18

#T Biais de sélection | selection, biais de selection
Biais qui apparaît quand les groupes comparés se sont formés selon des caractéristiques liées au résultat.
@voir q-2-2

#T Erreur de mesure | erreur de mesure
Écart entre la valeur observée d'une variable et sa vraie valeur. Sur y : ajoute du bruit. Sur x : tire le coefficient vers zéro.
@voir q-1-2

#T Biais d'atténuation | attenuation
Biais vers zéro d'un coefficient quand le régresseur est mesuré avec une erreur aléatoire.
@voir q-1-18

#T Homoscédasticité | homoscedasticite
Hypothèse selon laquelle la variance du terme d'erreur est la même pour toutes les observations.
@voir q-1-14

#T Hétéroscédasticité | heteroscedasticite
Situation où la variance du terme d'erreur dépend des observations. Les coefficients MCO restent sans biais, mais les erreurs-types classiques sont fausses.
@voir q-1-14

#T Erreurs-types robustes HC1 | HC1, erreurs-types robustes, robuste, robustes
Erreurs-types valables même en cas d'hétéroscédasticité. HC1 est la version de White multipliée par n/(n − k). Dans R : `vcovHC(m, type = "HC1")`.
@voir b-hypotheses

#T Test de Breusch-Pagan | breusch-pagan, BP
Test d'homoscédasticité : on régresse les résidus au carré sur des variables, et n × R² suit un khi-deux si la variance est constante.
@voir q-1-14

#T Moindres carrés pondérés | moindres carres ponderes, WLS
Variante des MCO qui donne plus de poids aux observations les plus précises. Plus efficace que les MCO en présence d'hétéroscédasticité de forme connue.

#T Variable de contrôle | controle, controles, variable de controle
Variable ajoutée au modèle pour tenir constant un facteur qui influence y et qui est lié au régresseur d'intérêt.
@voir q-2-7

#T Mauvais contrôle | mauvais controle, bad control
Variable qui est elle-même une conséquence du régresseur d'intérêt (ou de y). La contrôler fausse l'interprétation.
@voir q-1-16

#T Instrument | instruments, variable instrumentale, variables instrumentales, VI
Variable qui fait varier le régresseur endogène sans être liée au terme d'erreur. Permet d'isoler une variation « propre » du régresseur.
@voir q-2-3

#T Pertinence | condition de pertinence
Première condition d'un instrument : il doit réellement faire varier le régresseur endogène. Se vérifie avec la première étape.
@voir q-2-4

#T Restriction d'exclusion | exclusion, restriction d exclusion
Condition selon laquelle l'instrument n'agit sur le résultat que par l'intermédiaire du régresseur endogène. Ne se teste pas directement.
@voir q-2-3

#T Indépendance | independance de l'instrument
Condition selon laquelle l'instrument est « comme tiré au sort », sans lien avec les caractéristiques des individus.
@voir q-2-3

#T Monotonie | condition de monotonie
Hypothèse selon laquelle l'instrument pousse tout le monde dans le même sens (personne ne fait l'inverse). Nécessaire pour interpréter la VI comme un effet local.
@voir q-2-14

#T Première étape | premiere etape, first stage
Régression du régresseur endogène sur l'instrument (et les contrôles). Mesure la force de l'instrument.
@voir q-2-4

#T Forme réduite | forme reduite, reduced form
Régression directe du résultat sur l'instrument. Mesure l'effet total de l'instrument sur le résultat.
@voir q-2-6

#T Estimateur de Wald | wald
Avec un instrument binaire : forme réduite divisée par première étape.
@voir q-2-6

#T 2SLS | doubles moindres carres, 2sls, tsls
Doubles moindres carrés : on prédit le régresseur endogène à l'aide des instruments et des contrôles, puis on utilise cette prédiction dans l'équation d'intérêt. Fonction `ivreg()`.
@voir q-2-8

#T Instrument faible | instruments faibles
Instrument qui fait très peu varier le régresseur endogène. L'estimation devient imprécise et peu fiable. Repère usuel : F de première étape inférieur à 10.
@voir q-2-4

#T F de première étape | f de premiere etape, statistique F
Statistique qui teste que les coefficients des instruments sont nuls dans la première étape. Avec un seul instrument, F = t².
@voir q-2-4

#T Suridentification | suridentifie, test de sargan, sargan, test J, hansen
Situation où il y a plus d'instruments que de variables endogènes. On peut alors tester si les instruments donnent des réponses compatibles (test de Sargan ou test J).
@voir q-2-11

#T Test de Hausman | hausman, wu-hausman, test d'endogeneite
Test qui compare les MCO et la VI pour savoir si le régresseur est réellement endogène. Suppose que les instruments sont valides.
@voir q-2-12

#T LATE | effet local, effet local moyen du traitement
Effet moyen du traitement chez les « compliers » : c'est ce que mesure la VI quand l'effet diffère d'un individu à l'autre.
@voir q-2-14

#T Compliers | complier
Individus dont le traitement dépend de l'instrument : ici, les mères qui ont un troisième enfant parce que les deux premiers sont de même sexe, et pas sinon.
@voir q-2-14

#T Modèle de probabilité linéaire | probabilite lineaire
Régression linéaire dont la variable dépendante vaut 0 ou 1. Les coefficients se lisent en points de probabilité.
@voir q-2-4

#T Marge extensive | marge intensive, marges
Marge extensive : participer ou non (travailler ou pas, être éclairé ou pas). Marge intensive : combien, parmi ceux qui participent.
@voir q-2-13

#T Double différence | double difference, differences-en-differences, DiD, DD
Différence, entre le groupe traité et le groupe de comparaison, de leurs évolutions avant-après.
@voir q-3-4

#T Tendances parallèles | tendances paralleles
Hypothèse centrale de la double différence : sans traitement, les deux groupes auraient évolué de la même façon.
@voir q-3-6

#T Contrefactuel | contrefactuelle
Ce qui serait arrivé au groupe traité s'il n'avait pas été traité. On ne l'observe jamais ; toute la méthode consiste à l'approcher.
@voir q-3-6

#T Placebo | test placebo
Estimation refaite là où il ne devrait y avoir aucun effet (une fausse date de traitement, par exemple). Un « effet » placebo signale un problème.
@voir q-3-6

#T Effets fixes | effet fixe, effets fixes de localite, effets fixes d'annee
Une constante propre à chaque unité (localité) ou à chaque période (année). Absorbent tout ce qui ne varie pas dans le temps, ou tout ce qui est commun à une année.
@voir q-3-7

#T TWFE | two-way fixed effects, effets fixes doubles
Régression avec à la fois des effets fixes d'unité et des effets fixes de période.
@voir q-3-7

#T Erreurs-types groupées | erreurs-types groupees, cluster, clustered, groupees
Erreurs-types qui autorisent les erreurs d'un même groupe (une même localité) à être corrélées entre elles. Dans R : `vcovCL()`.
@voir q-3-8

#T Code INS | REFNIS, code refnis, code NIS
Code à cinq chiffres qui identifie chaque commune belge. C'est la clé qui permet de fusionner les deux fichiers de la partie 1.
@voir q-1-1

#T anti_join | anti-join, antijoin
Fonction de `dplyr` qui renvoie les lignes d'une table sans correspondant dans une autre. Sert à repérer les communes présentes dans un seul fichier.
@voir q-1-1
