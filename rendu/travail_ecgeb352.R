dossier <- "C:/Users/.../donnees/"     # seule ligne que nous modifierons
# =============================================================================
# ECGEB352 Économétrie — Travail de groupe 2026-2027
# Script unique : reproduit tous les tableaux, graphiques, régressions et
# chiffres du rapport, dans l'ordre des questions.
#  - Les 4 fichiers de données sont dans `dossier`, avec leur nom d'origine
#    et sans modification à la main.
#  - Les résultats sont enregistrés dans le dossier "resultats", créé dans le
#    répertoire de travail : tab_x_y.csv (tableaux), fig_x_y.png (graphiques),
#    reg_x_y.txt (régressions avec erreurs-types robustes HC1).
# =============================================================================

# Testé avec R 4.3.3. La session doit être en UTF-8 (R >= 4.2 sous Windows).
# Durée : environ une minute (la partie 2 porte sur 254 654 mères).

# ---- Packages (à installer une seule fois dans la console, jamais ici) -------
# install.packages(c("dplyr", "ggplot2", "lmtest", "sandwich", "car", "AER", "haven"))
library(dplyr)      # manipulation des données : filter, mutate, group_by, jointures
library(ggplot2)    # graphiques
library(lmtest)     # coeftest(), bptest()
library(sandwich)   # vcovHC() (erreurs-types HC1), vcovCL() (erreurs-types groupées)
library(car)        # linearHypothesis() : tests de restrictions linéaires
library(AER)        # ivreg() : variables instrumentales et doubles moindres carrés
library(haven)      # read_dta() : lecture du fichier Stata de la partie 3

# ---- Réglages communs ----------------------------------------------------------
dir.create("resultats", showWarnings = FALSE)
# Thème des graphiques : fond blanc (sinon les PNG ont un fond transparent)
theme_set(theme_minimal(base_size = 11) +
            theme(plot.background = element_rect(fill = "white", colour = NA)))
# Erreurs-types robustes à l'hétéroscédasticité (HC1), utilisées partout
rob <- function(m) coeftest(m, vcov = vcovHC(m, type = "HC1"))

# =============================================================================
# PARTIE 1 — Revenus et prix des maisons dans les communes belges (2023)
# =============================================================================

# -----------------------------------------------------------------------------
# Lecture des deux fichiers Statbel (commandes données par l'énoncé)
# -----------------------------------------------------------------------------
immo_raw <- read.delim(file.path(dossier, "vastgoed_2010_9999.txt"),
                       sep = "|", fileEncoding = "latin1",
                       colClasses = c(CD_REFNIS = "character"))
fisc_raw <- read.delim(file.path(dossier, "TF_PSNL_INC_TAX_MUNTY.txt"),
                       sep = "|", fileEncoding = "UTF-8-BOM",
                       colClasses = c(CD_MUNTY_REFNIS = "character"))

# Contrôle de lecture : 286 120 x 13 et 11 039 x 49 avec les fichiers téléchargés en novembre 2026.
# Si chaque table n'a qu'UNE ligne, la session R n'est pas en UTF-8 (installer R >= 4.2).
dim(immo_raw); dim(fisc_raw)

# Repérer les valeurs utiles (cf. métadonnées) :
table(immo_raw$CD_PERIOD)          # Q1..Q4 = trimestres, S1/S2 = semestres, Y = année entière
table(immo_raw$CD_niveau_refnis)   # 1 = Belgique, 2 = régions, 3 = provinces,
                                   # 4 = arrondissements, 5 = communes
table(immo_raw$CD_TYPE_NL)         # 4 types de biens

type_maisons <- "Alle huizen met 2, 3, 4 of meer gevels (excl. appartementen)"
type_apparts <- "Appartementen"

# Ventes 2023, année entière (Y), niveau communal (5)
ventes23 <- immo_raw %>%
  filter(CD_YEAR == 2023, CD_PERIOD == "Y", CD_niveau_refnis == 5)

maisons23 <- ventes23 %>%
  filter(CD_TYPE_NL == type_maisons) %>%
  transmute(refnis   = CD_REFNIS,
            commune  = CD_REFNIS_FR,
            n_ventes = MS_TOTAL_TRANSACTIONS,
            prix     = MS_P_50_median,
            p25      = MS_P_25,
            p75      = MS_P_75)

apparts23 <- ventes23 %>%
  filter(CD_TYPE_NL == type_apparts) %>%
  transmute(refnis = CD_REFNIS, n_app = MS_TOTAL_TRANSACTIONS)

# Fichier fiscal : année de revenus 2023
fisc23 <- fisc_raw %>%
  filter(CD_YEAR == 2023) %>%
  mutate(region = case_when(CD_RGN_REFNIS == 2000 ~ "Flandre",
                            CD_RGN_REFNIS == 3000 ~ "Wallonie",
                            CD_RGN_REFNIS == 4000 ~ "Bruxelles"))

# -----------------------------------------------------------------------------
# Question 1.1
# -----------------------------------------------------------------------------
# (a) Nombre de communes dans chaque fichier
n_communes_ventes <- n_distinct(maisons23$refnis)   # 565
n_communes_fisc   <- n_distinct(fisc23$CD_MUNTY_REFNIS)  # 581
tab_1_1a <- data.frame(fichier = c("Ventes (maisons, 2023, Y, niveau 5)",
                                   "Fiscal (revenus 2023)"),
                       n_communes = c(n_communes_ventes, n_communes_fisc))
write.csv(tab_1_1a, "resultats/tab_1_1a.csv", row.names = FALSE)

# (b) Communes présentes dans un seul des deux fichiers
seulement_ventes <- anti_join(maisons23, fisc23,
                              by = c("refnis" = "CD_MUNTY_REFNIS")) %>%
  select(refnis, commune, n_ventes, prix)
seulement_fisc <- anti_join(fisc23, maisons23,
                            by = c("CD_MUNTY_REFNIS" = "refnis")) %>%
  select(refnis = CD_MUNTY_REFNIS, commune = TX_MUNTY_DESCR_FR,
         commune_nl = TX_MUNTY_DESCR_NL, pop = MS_TOT_RESIDENTS, region)
nrow(seulement_ventes)   # 13
nrow(seulement_fisc)     # 29
write.csv(seulement_ventes, "resultats/tab_1_1b_ventes.csv", row.names = FALSE)
write.csv(seulement_fisc,   "resultats/tab_1_1b_fisc.csv",   row.names = FALSE)

# (c) Chaque fichier applique un seul découpage communal à toute sa série :
#     565 communes chaque année dans les ventes (découpage 2025, recalculé depuis 2010),
#     581 chaque année dans le fichier fiscal (découpage d'avant les fusions).
tab_1_1c_ventes <- immo_raw %>%
  filter(CD_PERIOD == "Y", CD_niveau_refnis == 5) %>%
  group_by(annee = CD_YEAR) %>% summarise(n_communes = n_distinct(CD_REFNIS))
tab_1_1c_fisc <- fisc_raw %>%
  group_by(annee = CD_YEAR) %>% summarise(n_communes = n_distinct(CD_MUNTY_REFNIS))
range(tab_1_1c_ventes$n_communes)   # 565 565
range(tab_1_1c_fisc$n_communes)     # 581 581
write.csv(tab_1_1c_ventes, "resultats/tab_1_1c_ventes.csv", row.names = FALSE)
write.csv(tab_1_1c_fisc,   "resultats/tab_1_1c_fisc.csv",   row.names = FALSE)

# (d) Le cas d'Anvers : même code 11002 dans les deux fichiers, mais pas le même territoire
tab_1_1d <- fisc23 %>%
  filter(CD_MUNTY_REFNIS %in% c("11002", "11007")) %>%
  transmute(refnis = CD_MUNTY_REFNIS, commune = TX_MUNTY_DESCR_NL,
            pop = MS_TOT_RESIDENTS,
            rev_hab = MS_TOT_NET_TAXABLE_INC / MS_TOT_RESIDENTS)
write.csv(tab_1_1d, "resultats/tab_1_1d.csv", row.names = FALSE)

# (e) Reconstitution des communes fusionnées dans le fichier fiscal
#     Table de passage ancien code -> nouveau code (page de Statistiek Vlaanderen)
fusions <- data.frame(
  ancien  = c("11002", "11007",                      # Antwerpen + Borsbeek
              "23023", "23024", "23032",             # Pajottegem
              "37012", "37018",                      # Wingene
              "37007", "37015",                      # Tielt
              "44012", "44048",                      # Nazareth-De Pinte
              "44034", "44073",                      # Lochristi
              "46014", "44045",                      # Lokeren
              "44040", "44043",                      # Merelbeke-Melle
              "46003", "46013", "11056",             # Beveren-Kruibeke-Zwijndrecht
              "73006", "73032",                      # Bilzen-Hoeselt
              "73009", "73083",                      # Tongeren-Borgloon
              "71069", "71057",                      # Tessenderlo-Ham
              "71022", "73040",                      # Hasselt
              "82003", "82005"),                     # Bastogne
  nouveau = c("11002", "11002",
              "23106", "23106", "23106",
              "37021", "37021",
              "37022", "37022",
              "44086", "44086",
              "44087", "44087",
              "46029", "46029",
              "44088", "44088",
              "46030", "46030", "46030",
              "73110", "73110",
              "73111", "73111",
              "71071", "71071",
              "71072", "71072",
              "82039", "82039"))

fisc23_new <- fisc23 %>%
  left_join(fusions, by = c("CD_MUNTY_REFNIS" = "ancien")) %>%
  mutate(refnis = ifelse(is.na(nouveau), CD_MUNTY_REFNIS, nouveau)) %>%
  group_by(refnis) %>%
  summarise(rev_tot     = sum(MS_TOT_NET_TAXABLE_INC),  # totaux : on peut les additionner
            pop         = sum(MS_TOT_RESIDENTS),
            region      = first(region),
            n_anciennes = n(),
            .groups = "drop") %>%
  mutate(rev_hab = rev_tot / pop)                     # puis on refait le rapport

nrow(fisc23_new)   # 565 : même découpage que le fichier des ventes
# Contrôle : plus aucune commune orpheline
nrow(anti_join(maisons23, fisc23_new, by = "refnis"))   # 0
nrow(anti_join(fisc23_new, maisons23, by = "refnis"))   # 0

tab_1_1e <- fisc23_new %>% filter(n_anciennes > 1) %>%
  left_join(select(maisons23, refnis, commune), by = "refnis") %>%
  select(refnis, commune, n_anciennes, pop, rev_hab)
write.csv(tab_1_1e, "resultats/tab_1_1e.csv", row.names = FALSE)

# Base complète (565 communes), puis base d'analyse (communes avec un prix médian)
base_565 <- maisons23 %>%
  inner_join(fisc23_new, by = "refnis") %>%
  left_join(apparts23, by = "refnis") %>%
  mutate(region = factor(region, levels = c("Flandre", "Wallonie", "Bruxelles")))

# (f) Communes sans prix médian
sans_prix <- base_565 %>% filter(is.na(prix))
nrow(sans_prix)   # 14
tab_1_1f <- base_565 %>%
  mutate(groupe = ifelse(is.na(prix), "sans prix médian", "avec prix médian")) %>%
  group_by(groupe) %>%
  summarise(n_communes      = n(),
            ventes_moyenne  = mean(n_ventes, na.rm = TRUE),
            ventes_mediane  = median(n_ventes, na.rm = TRUE),
            ventes_min      = min(n_ventes, na.rm = TRUE),
            ventes_max      = max(n_ventes, na.rm = TRUE),
            n_wallonie      = sum(region == "Wallonie"),
            pop_moyenne     = mean(pop),
            rev_hab_moyen   = mean(rev_hab),
            .groups = "drop")
write.csv(tab_1_1f, "resultats/tab_1_1f.csv", row.names = FALSE)
write.csv(select(sans_prix, refnis, commune, region, n_ventes, pop, rev_hab),
          "resultats/tab_1_1f_liste.csv", row.names = FALSE)

# Base d'analyse : 551 communes
base <- base_565 %>%
  filter(!is.na(prix)) %>%
  select(refnis, commune, region, n_ventes, prix, p25, p75, n_app, rev_hab, pop)
nrow(base)   # 551 (contrôle de l'énoncé)
table(base$region)

# -----------------------------------------------------------------------------
# Question 1.3 — Rouvroy et Charleroi
# -----------------------------------------------------------------------------
tab_1_3 <- base %>%
  filter(commune %in% c("ROUVROY", "CHARLEROI")) %>%
  transmute(commune, n_ventes, prix, p25, p75,
            eiq        = p75 - p25,                       # écart interquartile
            eiq_relatif = (p75 - p25) / prix,             # rapporté au prix médian
            se_mediane = 0.93 * (p75 - p25) / sqrt(n_ventes),
            se_relative = se_mediane / prix)
tab_1_3
write.csv(tab_1_3, "resultats/tab_1_3.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 1.4 — Statistiques descriptives
# -----------------------------------------------------------------------------
stats_desc <- function(d, groupe) {
  bind_rows(lapply(c("prix", "rev_hab", "n_ventes"), function(v) {
    x <- d[[v]]
    data.frame(groupe = groupe, variable = v, n = length(x),
               moyenne = mean(x), mediane = median(x), ecart_type = sd(x),
               minimum = min(x), maximum = max(x))
  }))
}
tab_1_4 <- bind_rows(
  stats_desc(base, "Belgique"),
  stats_desc(filter(base, region == "Flandre"),   "Flandre"),
  stats_desc(filter(base, region == "Wallonie"),  "Wallonie"),
  stats_desc(filter(base, region == "Bruxelles"), "Bruxelles"))
tab_1_4
write.csv(tab_1_4, "resultats/tab_1_4.csv", row.names = FALSE)

# Communes extrêmes
tab_1_4_extremes <- bind_rows(
  base %>% slice_min(prix, n = 1)    %>% mutate(quoi = "prix minimum"),
  base %>% slice_max(prix, n = 1)    %>% mutate(quoi = "prix maximum"),
  base %>% slice_min(rev_hab, n = 1) %>% mutate(quoi = "rev_hab minimum"),
  base %>% slice_max(rev_hab, n = 1) %>% mutate(quoi = "rev_hab maximum")) %>%
  select(quoi, commune, region, prix, rev_hab, n_ventes)
tab_1_4_extremes
write.csv(tab_1_4_extremes, "resultats/tab_1_4_extremes.csv", row.names = FALSE)

# (b) Histogrammes et coefficients d'asymétrie
asymetrie <- function(x) {
  x <- x[!is.na(x)]
  m <- mean(x)
  mean((x - m)^3) / mean((x - m)^2)^1.5
}
tab_1_4b <- data.frame(
  variable  = c("prix", "rev_hab", "log(prix)", "log(rev_hab)"),
  asymetrie = c(asymetrie(base$prix), asymetrie(base$rev_hab),
                asymetrie(log(base$prix)), asymetrie(log(base$rev_hab))))
tab_1_4b
write.csv(tab_1_4b, "resultats/tab_1_4b.csv", row.names = FALSE)

histo <- function(x, titre, axe) {
  ggplot(data.frame(x = x), aes(x = x)) +
    geom_histogram(bins = 40, fill = "grey60", colour = "white") +
    labs(title = titre, x = axe, y = "Nombre de communes")
}
fig_1_4_prix    <- histo(base$prix / 1000, "Prix médian des maisons, 2023",
                         "Prix médian (milliers d'euros)")
fig_1_4_rev     <- histo(base$rev_hab / 1000, "Revenu net imposable par habitant, 2023",
                         "Revenu par habitant (milliers d'euros)")
fig_1_4_lprix   <- histo(log(base$prix), "Logarithme du prix médian", "ln(prix)")
fig_1_4_lrev    <- histo(log(base$rev_hab), "Logarithme du revenu par habitant",
                         "ln(rev_hab)")
ggsave("resultats/fig_1_4_prix.png",  fig_1_4_prix,  width = 7, height = 4.5)
ggsave("resultats/fig_1_4_rev.png",   fig_1_4_rev,   width = 7, height = 4.5)
ggsave("resultats/fig_1_4_lprix.png", fig_1_4_lprix, width = 7, height = 4.5)
ggsave("resultats/fig_1_4_lrev.png",  fig_1_4_lrev,  width = 7, height = 4.5)

# -----------------------------------------------------------------------------
# Variables utilisées dans les régressions
# -----------------------------------------------------------------------------
base <- base %>%
  mutate(prix_k = prix / 1000,        # prix en milliers d'euros
         rev_k  = rev_hab / 1000,     # revenu en milliers d'euros
         lprix  = log(prix),
         lrev   = log(rev_hab))

# -----------------------------------------------------------------------------
# Question 1.5 — Nuages de points
# -----------------------------------------------------------------------------
couleurs <- c(Flandre = "#E69F00", Wallonie = "#0072B2", Bruxelles = "#CC79A7")
fig_1_5_niveaux <- ggplot(base, aes(x = rev_k, y = prix_k)) +
  geom_point(aes(colour = region), alpha = 0.7) +
  geom_smooth(method = "lm", formula = y ~ x, se = FALSE, colour = "black") +
  scale_colour_manual(values = couleurs) +
  labs(title = "Prix médian des maisons et revenu par habitant, 2023",
       x = "Revenu net imposable par habitant (milliers d'euros)",
       y = "Prix médian (milliers d'euros)", colour = "Région",
       caption = "Source : Statbel. Droite des MCO estimée sur les 551 communes.")
fig_1_5_logs <- fig_1_5_niveaux +
  scale_x_log10() + scale_y_log10() +
  labs(title = "Même graphique, échelles logarithmiques")
ggsave("resultats/fig_1_5_niveaux.png", fig_1_5_niveaux, width = 7, height = 4.5)
ggsave("resultats/fig_1_5_logs.png",    fig_1_5_logs,    width = 7, height = 4.5)

# -----------------------------------------------------------------------------
# Question 1.6 — Quatre formes fonctionnelles
# -----------------------------------------------------------------------------
reg_1_6_nn <- lm(prix_k ~ rev_k, data = base)   # niveau-niveau
reg_1_6_ll <- lm(lprix  ~ lrev,  data = base)   # log-log
reg_1_6_ln <- lm(lprix  ~ rev_k, data = base)   # log-niveau
reg_1_6_nl <- lm(prix_k ~ lrev,  data = base)   # niveau-log

ligne_reg <- function(m, nom) {
  ct <- rob(m)
  data.frame(modele = nom,
             constante = ct[1, 1], se_constante = ct[1, 2],
             pente = ct[2, 1], se_pente = ct[2, 2], p_pente = ct[2, 4],
             R2 = summary(m)$r.squared, N = nobs(m))
}
tab_1_6 <- bind_rows(ligne_reg(reg_1_6_nn, "niveau-niveau"),
                     ligne_reg(reg_1_6_ll, "log-log"),
                     ligne_reg(reg_1_6_ln, "log-niveau"),
                     ligne_reg(reg_1_6_nl, "niveau-log"))
tab_1_6
write.csv(tab_1_6, "resultats/tab_1_6.csv", row.names = FALSE)
for (nom in c("nn", "ll", "ln", "nl")) {
  m <- get(paste0("reg_1_6_", nom))
  capture.output(rob(m), summary(m)$r.squared,
                 file = paste0("resultats/reg_1_6_", nom, ".txt"))
}

# -----------------------------------------------------------------------------
# Question 1.7 — Variations prédites
# -----------------------------------------------------------------------------
b_nn <- coef(reg_1_6_nn)[2]; b_ll <- coef(reg_1_6_ll)[2]
b_ln <- coef(reg_1_6_ln)[2]; b_nl <- coef(reg_1_6_nl)[2]

variations <- function(r0, r1) {           # r0, r1 en milliers d'euros
  dx_pct <- (r1 - r0) / r0 * 100           # variation du revenu en %
  # prix prédits au point de départ (pour exprimer chaque effet en € et en %)
  p0_nn <- coef(reg_1_6_nn)[1] + b_nn * r0
  p0_nl <- coef(reg_1_6_nl)[1] + b_nl * log(r0 * 1000)
  p0_ll <- exp(coef(reg_1_6_ll)[1] + b_ll * log(r0 * 1000)) / 1000
  p0_ln <- exp(coef(reg_1_6_ln)[1] + b_ln * r0) / 1000
  data.frame(
    modele = c("niveau-niveau", "log-log", "log-niveau", "niveau-log"),
    prix_depart_k = c(p0_nn, p0_ll, p0_ln, p0_nl),
    var_k_exacte = c(b_nn * (r1 - r0),
                     p0_ll * ((r1 / r0)^b_ll - 1),
                     p0_ln * (exp(b_ln * (r1 - r0)) - 1),
                     b_nl * log(r1 / r0)),
    var_pct_approx = c(NA,
                       b_ll * dx_pct,
                       100 * b_ln * (r1 - r0),
                       NA),
    var_pct_exacte = c(100 * b_nn * (r1 - r0) / p0_nn,
                       100 * ((r1 / r0)^b_ll - 1),
                       100 * (exp(b_ln * (r1 - r0)) - 1),
                       100 * b_nl * log(r1 / r0) / p0_nl))
}
tab_1_7a <- variations(24, 25)
tab_1_7b <- variations(20, 30)
tab_1_7a; tab_1_7b
write.csv(tab_1_7a, "resultats/tab_1_7a.csv", row.names = FALSE)
write.csv(tab_1_7b, "resultats/tab_1_7b.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 1.8 — Comparer les R² sur une même échelle
# -----------------------------------------------------------------------------
# R² du log-log recalculé sur l'échelle des prix (corrélation au carré entre prix
# observé et prix prédit exp(ŷ)), comparable au R² du modèle niveau-niveau
r2_ll_niveaux <- cor(base$prix_k, exp(fitted(reg_1_6_ll)) / 1000)^2
r2_nn_logs    <- cor(base$lprix, log(pmax(fitted(reg_1_6_nn), 1)))^2
tab_1_8 <- data.frame(
  mesure = c("R2 niveau-niveau (échelle des prix)",
             "R2 log-log recalculé sur l'échelle des prix",
             "R2 log-log (échelle des log)",
             "R2 niveau-niveau recalculé sur l'échelle des log"),
  valeur = c(summary(reg_1_6_nn)$r.squared, r2_ll_niveaux,
             summary(reg_1_6_ll)$r.squared, r2_nn_logs))
tab_1_8
write.csv(tab_1_8, "resultats/tab_1_8.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 1.9 — Indicatrices de région (Flandre = référence)
# -----------------------------------------------------------------------------
reg_1_9 <- lm(lprix ~ lrev + region, data = base)
rob(reg_1_9)
capture.output(rob(reg_1_9), summary(reg_1_9)$r.squared,
               file = "resultats/reg_1_9.txt")
# Écarts exacts en % : 100 * (exp(b) - 1)
100 * (exp(coef(reg_1_9)[c("regionWallonie", "regionBruxelles")]) - 1)

# -----------------------------------------------------------------------------
# Question 1.10 — Coefficients avec la Wallonie en référence, à la main
# -----------------------------------------------------------------------------
b <- coef(reg_1_9)
tab_1_10 <- data.frame(
  coefficient = c("constante", "élasticité", "Flandre", "Bruxelles"),
  calcul      = c("b0 + bW", "b1", "-bW", "bB - bW"),
  valeur      = c(b["(Intercept)"] + b["regionWallonie"],
                  b["lrev"],
                  -b["regionWallonie"],
                  b["regionBruxelles"] - b["regionWallonie"]))
tab_1_10
write.csv(tab_1_10, "resultats/tab_1_10.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 1.11 — Réestimation avec relevel()
# -----------------------------------------------------------------------------
base$region_w <- relevel(base$region, ref = "Wallonie")
reg_1_11 <- lm(lprix ~ lrev + region_w, data = base)
rob(reg_1_11)
capture.output(rob(reg_1_11), summary(reg_1_11)$r.squared,
               file = "resultats/reg_1_11.txt")
all.equal(fitted(reg_1_9), fitted(reg_1_11))   # mêmes valeurs ajustées

# -----------------------------------------------------------------------------
# Question 1.12 — Biais de variable omise
# -----------------------------------------------------------------------------
base <- base %>% mutate(wallonie  = as.numeric(region == "Wallonie"),
                        bruxelles = as.numeric(region == "Bruxelles"))
reg_1_12_w <- lm(wallonie  ~ lrev, data = base)
reg_1_12_b <- lm(bruxelles ~ lrev, data = base)
d_w <- coef(reg_1_12_w)[2]; d_b <- coef(reg_1_12_b)[2]
tab_1_12 <- data.frame(
  terme  = c("élasticité longue (1.9)", "bW x dW (Wallonie)",
             "bB x dB (Bruxelles)", "somme", "élasticité courte (1.6)"),
  valeur = c(b["lrev"], b["regionWallonie"] * d_w, b["regionBruxelles"] * d_b,
             b["lrev"] + b["regionWallonie"] * d_w + b["regionBruxelles"] * d_b,
             coef(reg_1_6_ll)["lrev"]))
tab_1_12
write.csv(tab_1_12, "resultats/tab_1_12.csv", row.names = FALSE)
capture.output(rob(reg_1_12_w), rob(reg_1_12_b), file = "resultats/reg_1_12.txt")

# -----------------------------------------------------------------------------
# Question 1.13 — Élasticités régionales (interaction)
# -----------------------------------------------------------------------------
reg_1_13 <- lm(lprix ~ lrev * region, data = base)
rob(reg_1_13)
capture.output(rob(reg_1_13), file = "resultats/reg_1_13.txt")
V <- vcovHC(reg_1_13, type = "HC1")
bi <- coef(reg_1_13)
se_somme <- function(a, c) sqrt(V[a, a] + V[c, c] + 2 * V[a, c])
tab_1_13a <- data.frame(
  region     = c("Flandre", "Wallonie", "Bruxelles"),
  elasticite = c(bi["lrev"], bi["lrev"] + bi["lrev:regionWallonie"],
                 bi["lrev"] + bi["lrev:regionBruxelles"]),
  se         = c(sqrt(V["lrev", "lrev"]),
                 se_somme("lrev", "lrev:regionWallonie"),
                 se_somme("lrev", "lrev:regionBruxelles")),
  n_communes = as.vector(table(base$region)))
tab_1_13a$ic_bas  <- tab_1_13a$elasticite - 1.96 * tab_1_13a$se
tab_1_13a$ic_haut <- tab_1_13a$elasticite + 1.96 * tab_1_13a$se
tab_1_13a
write.csv(tab_1_13a, "resultats/tab_1_13a.csv", row.names = FALSE)
# Vérification par changement de référence
reg_1_13_w <- lm(lprix ~ lrev * region_w, data = base)
rob(reg_1_13_w)["lrev", ]

# (b) Égalité des élasticités flamande et wallonne : H0 : coefficient d'interaction = 0
test_1_13b <- linearHypothesis(reg_1_13, "lrev:regionWallonie = 0",
                               vcov. = V, test = "F")
test_1_13b
capture.output(test_1_13b, file = "resultats/test_1_13b.txt")

# (e) Revenu centré en 25 000 euros
base$lrev_c <- base$lrev - log(25000)
reg_1_13e <- lm(lprix ~ lrev_c * region, data = base)
rob(reg_1_13e)
capture.output(rob(reg_1_13e), file = "resultats/reg_1_13e.txt")

# (f) Droites régionales et intervalles de confiance à 95 % (erreurs-types HC1)
grille <- bind_rows(lapply(levels(base$region), function(r) {
  x <- base$lrev[base$region == r]                 # revenus observés dans la région
  data.frame(region = r, lrev = seq(min(x), max(x), length.out = 50))
}))
grille$region <- factor(grille$region, levels = levels(base$region))
# Prédiction x'b et son erreur-type robuste sqrt(x' V x), avec V = matrice HC1
X <- model.matrix(~ lrev * region, data = grille)
grille$fit <- as.vector(X %*% bi)
grille$se  <- sqrt(rowSums((X %*% V) * X))
grille <- grille %>% mutate(bas = fit - 1.96 * se, haut = fit + 1.96 * se)
fig_1_13f <- ggplot() +
  geom_point(data = base, aes(x = exp(lrev) / 1000, y = exp(lprix) / 1000, colour = region),
             alpha = 0.5) +
  geom_ribbon(data = grille, aes(x = exp(lrev) / 1000, ymin = exp(bas) / 1000,
                                 ymax = exp(haut) / 1000, fill = region), alpha = 0.25) +
  geom_line(data = grille, aes(x = exp(lrev) / 1000, y = exp(fit) / 1000, colour = region),
            linewidth = 1) +
  scale_x_log10() + scale_y_log10() +
  scale_colour_manual(values = couleurs) + scale_fill_manual(values = couleurs) +
  labs(title = "Relation log-log estimée dans chaque région (IC à 95 %, HC1)",
       x = "Revenu par habitant (milliers d'euros, échelle log)",
       y = "Prix médian (milliers d'euros, échelle log)",
       colour = "Région", fill = "Région",
       caption = "Source : Statbel, 2023. Modèle de la question 1.13.")
ggsave("resultats/fig_1_13f.png", fig_1_13f, width = 7, height = 4.5)

# -----------------------------------------------------------------------------
# Question 1.14 — Hétéroscédasticité
# -----------------------------------------------------------------------------
base$lventes <- log(base$n_ventes)
diag_1_14 <- function(m, nom) {
  data.frame(modele = nom, ajuste = fitted(m), residu = resid(m),
             lventes = base$lventes, region = base$region)
}
d14 <- bind_rows(diag_1_14(reg_1_6_ll, "Q1.6 : log-log"),
                 diag_1_14(reg_1_9,    "Q1.9 : log-log + régions"))
fig_1_14_ajuste <- ggplot(d14, aes(x = ajuste, y = residu, colour = region)) +
  geom_point(alpha = 0.6) + geom_hline(yintercept = 0) +
  facet_wrap(~ modele) + scale_colour_manual(values = couleurs) +
  labs(title = "Résidus en fonction des valeurs ajustées",
       x = "Valeur ajustée de ln(prix)", y = "Résidu", colour = "Région")
fig_1_14_ventes <- ggplot(d14, aes(x = lventes, y = residu, colour = region)) +
  geom_point(alpha = 0.6) + geom_hline(yintercept = 0) +
  facet_wrap(~ modele) + scale_colour_manual(values = couleurs) +
  labs(title = "Résidus en fonction du nombre de ventes",
       x = "ln(nombre de ventes de maisons)", y = "Résidu", colour = "Région")
ggsave("resultats/fig_1_14_ajuste.png", fig_1_14_ajuste, width = 8, height = 4.5)
ggsave("resultats/fig_1_14_ventes.png", fig_1_14_ventes, width = 8, height = 4.5)

bp_16_reg  <- bptest(reg_1_6_ll)
bp_16_vent <- bptest(reg_1_6_ll, ~ lventes, data = base)
bp_19_reg  <- bptest(reg_1_9)
bp_19_vent <- bptest(reg_1_9, ~ lventes, data = base)
tab_1_14b <- data.frame(
  modele = c("1.6", "1.6", "1.9", "1.9"),
  variables_du_test = c("régresseurs du modèle", "log(n_ventes)",
                        "régresseurs du modèle", "log(n_ventes)"),
  BP = c(bp_16_reg$statistic, bp_16_vent$statistic, bp_19_reg$statistic, bp_19_vent$statistic),
  ddl = c(bp_16_reg$parameter, bp_16_vent$parameter, bp_19_reg$parameter, bp_19_vent$parameter),
  p_valeur = c(bp_16_reg$p.value, bp_16_vent$p.value, bp_19_reg$p.value, bp_19_vent$p.value))
tab_1_14b
write.csv(tab_1_14b, "resultats/tab_1_14b.csv", row.names = FALSE)

# (d) Dispersion des résidus selon le nombre de ventes
tab_1_14d <- base %>%
  mutate(res_16 = resid(reg_1_6_ll), res_19 = resid(reg_1_9),
         classe_ventes = cut(n_ventes, c(0, 30, 50, 100, 200, Inf), right = FALSE),
         se_mediane_rel = 0.93 * (p75 - p25) / prix / sqrt(n_ventes)) %>%
  group_by(classe_ventes) %>%
  summarise(n_communes = n(), sd_residus_1_6 = sd(res_16), sd_residus_1_9 = sd(res_19),
            se_mediane_relative_moy = mean(se_mediane_rel), .groups = "drop")
tab_1_14d
write.csv(tab_1_14d, "resultats/tab_1_14d.csv", row.names = FALSE)

se_classique <- function(m) sqrt(diag(vcov(m)))["lrev"]
se_robuste   <- function(m) sqrt(diag(vcovHC(m, type = "HC1")))["lrev"]
tab_1_14c <- data.frame(
  modele = c("1.6 log-log", "1.9 log-log + régions"),
  elasticite = c(coef(reg_1_6_ll)["lrev"], coef(reg_1_9)["lrev"]),
  se_classique = c(se_classique(reg_1_6_ll), se_classique(reg_1_9)),
  se_HC1 = c(se_robuste(reg_1_6_ll), se_robuste(reg_1_9)))
tab_1_14c$rapport <- tab_1_14c$se_HC1 / tab_1_14c$se_classique
tab_1_14c
write.csv(tab_1_14c, "resultats/tab_1_14c.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 1.15 — Contrôles
# -----------------------------------------------------------------------------
# (a) Valeurs manquantes de n_app : aucune vente d'appartement
sum(is.na(base$n_app))                         # 25
sort(base$n_app)[1:10]                         # la plus petite valeur est 1, jamais 0
sum(immo_raw$MS_TOTAL_TRANSACTIONS == 0, na.rm = TRUE)   # aucun 0 dans tout le fichier
base <- base %>%
  mutate(n_app    = ifelse(is.na(n_app), 0, n_app),
         part_app = n_app / (n_app + n_ventes),
         lpop     = log(pop))
# (b)
reg_1_15 <- lm(lprix ~ lrev + region + lpop + part_app, data = base)
rob(reg_1_15)
capture.output(rob(reg_1_15), summary(reg_1_15)$r.squared,
               file = "resultats/reg_1_15.txt")
summary(base$part_app)

# -----------------------------------------------------------------------------
# Question 1.17 — L'élasticité dans les quatre spécifications
# -----------------------------------------------------------------------------
ligne_elast <- function(m, nom) {
  ct <- rob(m)
  data.frame(specification = nom, elasticite = ct["lrev", 1], se = ct["lrev", 2])
}
tab_1_17 <- bind_rows(ligne_elast(reg_1_6_ll, "Q1.6 : sans contrôle"),
                      ligne_elast(reg_1_9,    "Q1.9 : + régions"),
                      ligne_elast(reg_1_13,   "Q1.13 : interaction (Flandre)"),
                      ligne_elast(reg_1_15,   "Q1.15 : + ln(pop) + part_app")) %>%
  mutate(ic_bas = elasticite - 1.96 * se, ic_haut = elasticite + 1.96 * se,
         specification = factor(specification, levels = rev(specification)))
tab_1_17
write.csv(tab_1_17, "resultats/tab_1_17.csv", row.names = FALSE)
fig_1_17 <- ggplot(tab_1_17, aes(x = elasticite, y = specification)) +
  geom_vline(xintercept = 1, linetype = "dashed", colour = "grey50") +
  geom_pointrange(aes(xmin = ic_bas, xmax = ic_haut)) +
  labs(title = "Élasticité du prix médian au revenu par habitant",
       subtitle = "Estimation et intervalle de confiance à 95 % (erreurs-types HC1)",
       x = "Élasticité estimée", y = NULL,
       caption = "Source : Statbel, 2023, 551 communes.")
ggsave("resultats/fig_1_17.png", fig_1_17, width = 7, height = 4.5)


# =============================================================================
# PARTIE 2 — Enfants et travail des mères : variables instrumentales
# =============================================================================
load(file.path(dossier, "Fertility.RData"))   # crée le data frame Fertility

# Facteurs yes/no et male/female -> indicatrices 0/1
fert <- Fertility %>%
  mutate(morekids   = as.numeric(morekids == "yes"),
         afam       = as.numeric(afam == "yes"),
         hispanic   = as.numeric(hispanic == "yes"),
         other      = as.numeric(other == "yes"),
         boy1st     = as.numeric(gender1 == "male"),
         samegender = as.numeric(gender1 == gender2),
         twoboys    = as.numeric(gender1 == "male"   & gender2 == "male"),
         twogirls   = as.numeric(gender1 == "female" & gender2 == "female"),
         travaille  = as.numeric(work > 0))

# -----------------------------------------------------------------------------
# Question 2.1 — Description
# -----------------------------------------------------------------------------
nrow(fert)   # 254 654 mères
tab_2_1 <- data.frame(
  statistique = c("Semaines travaillées en 1979 (moyenne)",
                  "Part des mères n'ayant pas travaillé (work = 0)",
                  "Part des mères ayant plus de deux enfants (morekids)",
                  "Part des mères dont les deux premiers enfants sont de même sexe"),
  valeur = c(mean(fert$work), mean(fert$work == 0),
             mean(fert$morekids), mean(fert$samegender)))
tab_2_1
write.csv(tab_2_1, "resultats/tab_2_1.csv", row.names = FALSE)
summary(fert$work)
mean(fert$work == 52)   # part des mères ayant travaillé toute l'année

fig_2_1 <- ggplot(fert, aes(x = work)) +
  geom_histogram(binwidth = 1, boundary = -0.5, fill = "grey55", colour = "white") +
  scale_y_continuous(labels = function(y) format(y, big.mark = " ", scientific = FALSE)) +
  labs(title = "Semaines travaillées en 1979 par les mères",
       x = "Nombre de semaines travaillées (0 à 52)", y = "Nombre de mères",
       caption = "Source : recensement américain de 1980 (Angrist et Evans, 1998), 254 654 mères.")
ggsave("resultats/fig_2_1.png", fig_2_1, width = 7, height = 4.5)

# -----------------------------------------------------------------------------
# Question 2.2 — MCO
# -----------------------------------------------------------------------------
reg_2_2 <- lm(work ~ morekids, data = fert)
rob(reg_2_2)
capture.output(rob(reg_2_2), file = "resultats/reg_2_2.txt")
# Le coefficient est la différence des moyennes entre les deux groupes :
fert %>% group_by(morekids) %>% summarise(work_moyen = mean(work), n = n())

# -----------------------------------------------------------------------------
# Question 2.3 (c) — Les mères se ressemblent-elles selon samegender ?
# -----------------------------------------------------------------------------
equilibre <- function(v) {
  m <- lm(as.formula(paste(v, "~ samegender")), data = fert)
  ct <- rob(m)
  data.frame(variable = v,
             moyenne_sexes_differents = coef(m)[1],
             moyenne_meme_sexe = coef(m)[1] + coef(m)[2],
             difference = ct[2, 1], se = ct[2, 2], p_valeur = ct[2, 4])
}
tab_2_3c <- bind_rows(lapply(c("age", "afam", "hispanic", "other"), equilibre))
tab_2_3c
write.csv(tab_2_3c, "resultats/tab_2_3c.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 2.4 — Première étape
# -----------------------------------------------------------------------------
reg_2_4 <- lm(morekids ~ samegender, data = fert)
rob(reg_2_4)
capture.output(rob(reg_2_4), file = "resultats/reg_2_4.txt")
F_2_4 <- rob(reg_2_4)["samegender", "t value"]^2   # F robuste = t^2 (un seul instrument)
F_2_4

# -----------------------------------------------------------------------------
# Question 2.5 — Les quatre compositions
# -----------------------------------------------------------------------------
tab_2_5a <- fert %>%
  mutate(composition = case_when(twoboys == 1 ~ "garçon-garçon",
                                 boy1st == 1 & twoboys == 0 ~ "garçon-fille",
                                 boy1st == 0 & twogirls == 0 ~ "fille-garçon",
                                 twogirls == 1 ~ "fille-fille")) %>%
  group_by(composition) %>%
  summarise(n = n(), p = mean(morekids), .groups = "drop") %>%
  mutate(se = sqrt(p * (1 - p) / n),
         ic_bas = p - 1.96 * se, ic_haut = p + 1.96 * se,
         composition = factor(composition, levels = c("garçon-garçon", "garçon-fille",
                                                      "fille-garçon", "fille-fille"))) %>%
  arrange(composition)
tab_2_5a
write.csv(tab_2_5a, "resultats/tab_2_5a.csv", row.names = FALSE)

fig_2_5 <- ggplot(tab_2_5a, aes(x = composition, y = 100 * p)) +
  geom_pointrange(aes(ymin = 100 * ic_bas, ymax = 100 * ic_haut)) +
  labs(title = "Part des mères ayant un troisième enfant selon le sexe des deux premiers",
       subtitle = "Proportion et intervalle de confiance à 95 %",
       x = "Sexe du premier puis du deuxième enfant",
       y = "Mères avec plus de deux enfants (%)",
       caption = "Source : recensement américain de 1980, 254 654 mères.")
ggsave("resultats/fig_2_5.png", fig_2_5, width = 7, height = 4.5)

reg_2_5 <- lm(morekids ~ twoboys + twogirls + boy1st, data = fert)
rob(reg_2_5)
capture.output(rob(reg_2_5), file = "resultats/reg_2_5.txt")
test_2_5 <- linearHypothesis(reg_2_5, "twoboys = twogirls",
                             vcov. = vcovHC(reg_2_5, type = "HC1"))
test_2_5
capture.output(test_2_5, file = "resultats/test_2_5.txt")

# -----------------------------------------------------------------------------
# Question 2.6 — Forme réduite et VI
# -----------------------------------------------------------------------------
reg_2_6a <- lm(work ~ samegender, data = fert)          # forme réduite
rob(reg_2_6a)
capture.output(rob(reg_2_6a), file = "resultats/reg_2_6a.txt")

reg_2_6b <- ivreg(work ~ morekids | samegender, data = fert)   # VI
rob(reg_2_6b)
capture.output(rob(reg_2_6b), file = "resultats/reg_2_6b.txt")

# (c) Estimateur de Wald : forme réduite / première étape
coef(reg_2_6a)["samegender"] / coef(reg_2_4)["samegender"]

# (d) Erreurs-types MCO et VI
c(se_MCO = rob(reg_2_2)["morekids", 2], se_VI = rob(reg_2_6b)["morekids", 2])
summary(reg_2_4)$r.squared   # part de la variance de morekids expliquée par l'instrument

# -----------------------------------------------------------------------------
# Question 2.7 — Variables de contrôle
# -----------------------------------------------------------------------------
reg_2_7_mco <- lm(work ~ morekids + age + afam + hispanic + other, data = fert)
reg_2_7_vi  <- ivreg(work ~ morekids + age + afam + hispanic + other |
                       samegender + age + afam + hispanic + other, data = fert)
rob(reg_2_7_mco); rob(reg_2_7_vi)
capture.output(rob(reg_2_7_mco), file = "resultats/reg_2_7_mco.txt")
capture.output(rob(reg_2_7_vi),  file = "resultats/reg_2_7_vi.txt")
# Pourquoi les contrôles déplacent les MCO : morekids est corrélé aux contrôles...
rob(lm(morekids ~ age + afam + hispanic + other, data = fert))
# ... mais pas samegender
rob(lm(samegender ~ age + afam + hispanic + other, data = fert))

# -----------------------------------------------------------------------------
# Question 2.8 — 2SLS avec twoboys et twogirls
# -----------------------------------------------------------------------------
reg_2_8_fs <- lm(morekids ~ twoboys + twogirls + age + afam + hispanic + other + boy1st,
                 data = fert)                                # première étape
rob(reg_2_8_fs)
capture.output(rob(reg_2_8_fs), file = "resultats/reg_2_8_fs.txt")
test_2_8_F <- linearHypothesis(reg_2_8_fs, c("twoboys = 0", "twogirls = 0"),
                               vcov. = vcovHC(reg_2_8_fs, type = "HC1"))
test_2_8_F    # F de première étape (robuste)

reg_2_8 <- ivreg(work ~ morekids + age + afam + hispanic + other + boy1st |
                   twoboys + twogirls + age + afam + hispanic + other + boy1st,
                 data = fert)
rob(reg_2_8)
capture.output(rob(reg_2_8), file = "resultats/reg_2_8.txt")
diag_2_8 <- summary(reg_2_8, vcov. = function(m) vcovHC(m, type = "HC1"),
                    diagnostics = TRUE)
diag_2_8$diagnostics
capture.output(diag_2_8, file = "resultats/reg_2_8_diagnostics.txt")

# Pourquoi on ne peut pas utiliser les trois instruments : samegender = twoboys + twogirls
all(fert$samegender == fert$twoboys + fert$twogirls)

# -----------------------------------------------------------------------------
# Question 2.10 — Un instrument à la fois
# -----------------------------------------------------------------------------
reg_2_10_boys <- ivreg(work ~ morekids + age + afam + hispanic + other + boy1st |
                         twoboys + age + afam + hispanic + other + boy1st, data = fert)
reg_2_10_girls <- ivreg(work ~ morekids + age + afam + hispanic + other + boy1st |
                          twogirls + age + afam + hispanic + other + boy1st, data = fert)
tab_2_10 <- data.frame(
  instrument = c("twoboys seul", "twogirls seul", "twoboys + twogirls (2.8)"),
  effet = c(rob(reg_2_10_boys)["morekids", 1], rob(reg_2_10_girls)["morekids", 1],
            rob(reg_2_8)["morekids", 1]),
  se = c(rob(reg_2_10_boys)["morekids", 2], rob(reg_2_10_girls)["morekids", 2],
         rob(reg_2_8)["morekids", 2]))
tab_2_10
write.csv(tab_2_10, "resultats/tab_2_10.csv", row.names = FALSE)
capture.output(rob(reg_2_10_boys), rob(reg_2_10_girls), file = "resultats/reg_2_10.txt")
# Écart entre les deux estimations, rapporté à son erreur-type
# (les deux estimations exploitent des sous-échantillons distincts : on les traite
#  comme indépendantes)
ecart <- tab_2_10$effet[1] - tab_2_10$effet[2]
se_ecart <- sqrt(tab_2_10$se[1]^2 + tab_2_10$se[2]^2)
c(ecart = ecart, se = se_ecart, z = ecart / se_ecart)

# -----------------------------------------------------------------------------
# Question 2.11 — Test de suridentification (Sargan), étape par étape
# -----------------------------------------------------------------------------
fert$u_2sls <- resid(reg_2_8)          # résidus 2SLS (calculés avec le vrai morekids)
aux_2_11 <- lm(u_2sls ~ twoboys + twogirls + age + afam + hispanic + other + boy1st,
               data = fert)
sargan <- nrow(fert) * summary(aux_2_11)$r.squared
p_sargan <- 1 - pchisq(sargan, df = 1)  # 2 instruments - 1 variable endogène = 1 ddl
c(sargan = sargan, p_valeur = p_sargan, seuil_5pct = qchisq(0.95, 1))
# Version J de Stock et Watson : m x F (F classique sur les instruments)
J_SW <- 2 * linearHypothesis(aux_2_11, c("twoboys = 0", "twogirls = 0"))$F[2]
J_SW
tab_2_11 <- data.frame(statistique = c("Sargan nR2", "J = m x F"),
                       valeur = c(sargan, J_SW),
                       p_valeur = c(p_sargan, 1 - pchisq(J_SW, 1)))
write.csv(tab_2_11, "resultats/tab_2_11.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 2.12 — Test d'endogénéité (Hausman, version régression)
# -----------------------------------------------------------------------------
fert$v_hat <- resid(reg_2_8_fs)        # résidus de la première étape
reg_2_12 <- lm(work ~ morekids + age + afam + hispanic + other + boy1st + v_hat,
               data = fert)
rob(reg_2_12)
capture.output(rob(reg_2_12), file = "resultats/reg_2_12.txt")
reg_2_12_mco <- lm(work ~ morekids + age + afam + hispanic + other + boy1st, data = fert)
tab_2_12 <- data.frame(
  estimateur = c("MCO (contrôles de 2.8)", "2SLS (2.8)"),
  effet = c(rob(reg_2_12_mco)["morekids", 1], rob(reg_2_8)["morekids", 1]),
  se = c(rob(reg_2_12_mco)["morekids", 2], rob(reg_2_8)["morekids", 2]))
tab_2_12
write.csv(tab_2_12, "resultats/tab_2_12.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 2.13 — Marge extensive : a travaillé au moins une semaine
# -----------------------------------------------------------------------------
reg_2_13_mco <- lm(travaille ~ morekids + age + afam + hispanic + other + boy1st,
                   data = fert)
reg_2_13_vi  <- ivreg(travaille ~ morekids + age + afam + hispanic + other + boy1st |
                        twoboys + twogirls + age + afam + hispanic + other + boy1st,
                      data = fert)
rob(reg_2_13_mco); rob(reg_2_13_vi)
capture.output(rob(reg_2_13_mco), rob(reg_2_13_vi), file = "resultats/reg_2_13.txt")

# (b) Semaines moyennes des mères de deux enfants qui ont travaillé
sem_travail <- mean(fert$work[fert$morekids == 0 & fert$work > 0])
effet_marge_ext <- coef(reg_2_13_vi)["morekids"] * sem_travail
part_ext <- effet_marge_ext / coef(reg_2_8)["morekids"]
tab_2_13b <- data.frame(
  element = c("Semaines moyennes (mères de 2 enfants, work > 0)",
              "Effet 2SLS sur travaille (2.13a)",
              "Semaines perdues par l'arrêt complet (produit)",
              "Effet 2SLS total sur work (2.8)",
              "Part due à l'arrêt complet"),
  valeur = c(sem_travail, coef(reg_2_13_vi)["morekids"], effet_marge_ext,
             coef(reg_2_8)["morekids"], part_ext))
tab_2_13b
write.csv(tab_2_13b, "resultats/tab_2_13b.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Tableau récapitulatif de la partie 2
# -----------------------------------------------------------------------------
ligne_mk <- function(m, nom, methode) {
  ct <- rob(m)
  data.frame(question = nom, methode = methode,
             effet = ct["morekids", 1], se = ct["morekids", 2], N = nobs(m))
}
tab_2_recap <- bind_rows(
  ligne_mk(reg_2_2,       "2.2",  "MCO sans contrôle"),
  ligne_mk(reg_2_6b,      "2.6",  "VI samegender"),
  ligne_mk(reg_2_7_mco,   "2.7",  "MCO + contrôles"),
  ligne_mk(reg_2_7_vi,    "2.7",  "VI samegender + contrôles"),
  ligne_mk(reg_2_8,       "2.8",  "2SLS twoboys + twogirls"),
  ligne_mk(reg_2_10_boys, "2.10", "VI twoboys seul"),
  ligne_mk(reg_2_10_girls,"2.10", "VI twogirls seul"))
tab_2_recap
write.csv(tab_2_recap, "resultats/tab_2_recap.csv", row.names = FALSE)


# =============================================================================
# PARTIE 3 — Électrification au Burkina Faso : double différence
# =============================================================================
elec_raw <- read_dta(file.path(dossier, "elec_data.dta"))

# -----------------------------------------------------------------------------
# Question 3.1 — Années 2003 à 2014
# -----------------------------------------------------------------------------
elec <- elec_raw %>% filter(year >= 2003, year <= 2014)
nrow(elec)                      # 6 888 lignes = localité x année
n_distinct(elec$electrific)     # 574 localités
n_distinct(elec$year)           # 12 années
table(elec$year_of_el) / 12     # nombre de localités par année d'électrification

# Disponibilité des variables par année
dispo_3_1 <- elec %>% group_by(year) %>%
  summarise(nl_extensive = sum(!is.na(nl_extensive)),
            nl_intensive_hat = sum(!is.na(nl_intensive_hat)),
            nschool_elec = sum(!is.na(nschool_elec)),
            n_students_public = sum(!is.na(n_students_public)))
dispo_3_1
write.csv(dispo_3_1, "resultats/tab_3_1_disponibilite.csv", row.names = FALSE)

# (b) Trois statistiques sur 2003-2007 (avant l'expansion du réseau)
avant <- elec %>% filter(year < 2008)
tab_3_1b <- data.frame(
  statistique = c("Part des observations localité-année avec lumière détectée (nl_extensive)",
                  "Nombre moyen d'écoles primaires électrifiées par localité",
                  "Nombre moyen d'élèves dans les écoles primaires publiques"),
  moyenne = c(mean(avant$nl_extensive, na.rm = TRUE),
              mean(avant$nschool_elec, na.rm = TRUE),
              mean(avant$n_students_public, na.rm = TRUE)),
  mediane = c(median(avant$nl_extensive, na.rm = TRUE),
              median(avant$nschool_elec, na.rm = TRUE),
              median(avant$n_students_public, na.rm = TRUE)))
tab_3_1b
write.csv(tab_3_1b, "resultats/tab_3_1b.csv", row.names = FALSE)
# Complément : part des localités éclairées au moins une fois en 2003-2007
avant %>% group_by(electrific) %>%
  summarise(deja = any(nl_extensive == 1, na.rm = TRUE)) %>%
  summarise(part = mean(deja))

# -----------------------------------------------------------------------------
# Question 3.2 — Groupes et périodes
# -----------------------------------------------------------------------------
elec <- elec %>%
  mutate(treated = as.numeric(year_of_el %in% c(2008, 2009)),
         post    = as.numeric(year > 2009))

# Les deux groupes, toutes années 2003-2014 (servira au graphique 3.6)
deux_groupes <- elec %>% filter(treated == 1 | year_of_el %in% 2015:2017)
# Échantillon de la double différence : sans 2008 et 2009
did <- deux_groupes %>% filter(!(year %in% c(2008, 2009)))

tab_3_2b <- did %>% distinct(electrific, treated) %>% count(treated)
tab_3_2b      # 59 localités traitées, 238 de comparaison
write.csv(tab_3_2b, "resultats/tab_3_2b.csv", row.names = FALSE)
nrow(did)     # 297 localités x 10 années = 2 970 lignes

# -----------------------------------------------------------------------------
# Question 3.3 — Deux différences simples
# -----------------------------------------------------------------------------
reg_3_3a <- lm(nl_extensive ~ treated, data = filter(did, post == 1))   # après : T vs C
reg_3_3b <- lm(nl_extensive ~ post,    data = filter(did, treated == 1)) # traitées : après vs avant
rob(reg_3_3a); rob(reg_3_3b)
capture.output(rob(reg_3_3a), file = "resultats/reg_3_3a.txt")
capture.output(rob(reg_3_3b), file = "resultats/reg_3_3b.txt")

# -----------------------------------------------------------------------------
# Question 3.4 — Double différence
# -----------------------------------------------------------------------------
tab_3_4a <- did %>%
  group_by(groupe = ifelse(treated == 1, "traité (2008-2009)", "comparaison (2015-2017)"),
           periode = ifelse(post == 1, "après (2010-2014)", "avant (2003-2007)")) %>%
  summarise(moyenne = mean(nl_extensive, na.rm = TRUE),
            n_obs = sum(!is.na(nl_extensive)), .groups = "drop")
tab_3_4a
write.csv(tab_3_4a, "resultats/tab_3_4a.csv", row.names = FALSE)
moy <- function(t, p) mean(did$nl_extensive[did$treated == t & did$post == p], na.rm = TRUE)
dd_moyennes <- (moy(1, 1) - moy(1, 0)) - (moy(0, 1) - moy(0, 0))
dd_moyennes

reg_3_4 <- lm(nl_extensive ~ treated * post, data = did)
rob(reg_3_4)
capture.output(rob(reg_3_4), file = "resultats/reg_3_4.txt")
nobs(reg_3_4)
sum(did$treated == 1 & did$post == 1 & !is.na(did$nl_extensive))  # observations traitées-après

# -----------------------------------------------------------------------------
# Question 3.5 — Autres variables dépendantes
# -----------------------------------------------------------------------------
reg_3_5_int <- lm(nl_intensive_hat  ~ treated * post, data = did)
reg_3_5_eco <- lm(nschool_elec      ~ treated * post, data = did)
reg_3_5_elv <- lm(n_students_public ~ treated * post, data = did)
ligne_did <- function(m, y) {
  ct <- rob(m)
  data.frame(variable = y, effet_DiD = ct["treated:post", 1], se_HC1 = ct["treated:post", 2],
             p_valeur = ct["treated:post", 4], N = nobs(m),
             n_localites = n_distinct(did$electrific[!is.na(did[[y]])]),
             moyenne_traites_avant = mean(did[[y]][did$treated == 1 & did$post == 0], na.rm = TRUE))
}
tab_3_5 <- bind_rows(ligne_did(reg_3_4,     "nl_extensive"),
                     ligne_did(reg_3_5_int, "nl_intensive_hat"),
                     ligne_did(reg_3_5_eco, "nschool_elec"),
                     ligne_did(reg_3_5_elv, "n_students_public"))
tab_3_5
write.csv(tab_3_5, "resultats/tab_3_5.csv", row.names = FALSE)
capture.output(rob(reg_3_5_int), rob(reg_3_5_eco), rob(reg_3_5_elv),
               file = "resultats/reg_3_5.txt")
# Années réellement disponibles pour les écoles
did %>% filter(!is.na(nschool_elec)) %>% distinct(year) %>% arrange(year)

# (a) D'où vient le +0,158 sur les écoles ? Les quatre moyennes, puis les moyennes annuelles :
#     stable chez les traitées, en baisse dans le groupe de comparaison (rupture 2005-2006).
tab_3_5_ecoles <- did %>%
  group_by(treated, post) %>%
  summarise(moyenne = mean(nschool_elec, na.rm = TRUE),
            n_obs = sum(!is.na(nschool_elec)), .groups = "drop")
tab_3_5_ecoles
write.csv(tab_3_5_ecoles, "resultats/tab_3_5_ecoles.csv", row.names = FALSE)
tab_3_5_ecoles_annee <- deux_groupes %>%
  filter(!is.na(nschool_elec)) %>%
  group_by(year, treated) %>%
  summarise(moyenne = mean(nschool_elec), part_au_moins_une = mean(nschool_elec > 0),
            .groups = "drop")
print(tab_3_5_ecoles_annee, n = 24)
write.csv(tab_3_5_ecoles_annee, "resultats/tab_3_5_ecoles_annee.csv", row.names = FALSE)

# (b) Qui figure dans l'échantillon de nl_intensive_hat ? 44 traitées sur 59, 95 sur 238
tab_3_5b <- did %>%
  group_by(electrific, treated) %>%
  summarise(dans_echantillon = any(!is.na(nl_intensive_hat)), .groups = "drop") %>%
  group_by(treated) %>%
  summarise(localites = n(), dans_echantillon = sum(dans_echantillon), .groups = "drop") %>%
  mutate(part = dans_echantillon / localites)
tab_3_5b
write.csv(tab_3_5b, "resultats/tab_3_5b.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 3.6 — Tendances parallèles
# -----------------------------------------------------------------------------
tab_3_6b <- deux_groupes %>%
  group_by(year, groupe = ifelse(treated == 1, "Traitées (électrifiées en 2008-2009)",
                                 "Comparaison (électrifiées en 2015-2017)")) %>%
  summarise(moyenne = mean(nl_extensive, na.rm = TRUE), .groups = "drop")
write.csv(tab_3_6b, "resultats/tab_3_6b.csv", row.names = FALSE)
fig_3_6 <- ggplot(tab_3_6b, aes(x = year, y = moyenne, colour = groupe)) +
  annotate("rect", xmin = 2007.5, xmax = 2009.5, ymin = -Inf, ymax = Inf,
           alpha = 0.15, fill = "grey50") +
  geom_line(linewidth = 1) + geom_point(size = 2) +
  scale_x_continuous(breaks = 2003:2014) +
  scale_colour_manual(values = c("grey45", "#0072B2")) +
  labs(title = "Part des localités dont la lumière est détectée par satellite",
       subtitle = "Zone grisée : années d'électrification du groupe traité (exclues de l'estimation)",
       x = NULL, y = "Moyenne de nl_extensive", colour = NULL,
       caption = "Source : Schmidt et Moradi (2026), localités du Burkina Faso.") +
  theme(legend.position = "bottom")
ggsave("resultats/fig_3_6.png", fig_3_6, width = 7, height = 4.5)

# (c) Placebo sur 2003-2007
placebo <- did %>% filter(year <= 2007) %>% mutate(post_fictif = as.numeric(year >= 2005))
reg_3_6c <- lm(nl_extensive ~ treated * post_fictif, data = placebo)
rob(reg_3_6c)
capture.output(rob(reg_3_6c), file = "resultats/reg_3_6c.txt")

# (e) Changement de satellite : DiD séparée pour les années DMSP (2010-2011)
#     et les années où VIIRS entre dans la série (2012-2014)
did <- did %>% mutate(post_dmsp  = as.numeric(year %in% 2010:2011),
                      post_viirs = as.numeric(year %in% 2012:2014))
reg_3_6e <- lm(nl_extensive ~ treated + post_dmsp + post_viirs +
                 treated:post_dmsp + treated:post_viirs, data = did)
rob(reg_3_6e)
capture.output(rob(reg_3_6e), file = "resultats/reg_3_6e.txt")

# -----------------------------------------------------------------------------
# Question 3.7 — Effets fixes
# -----------------------------------------------------------------------------
did <- did %>% mutate(D = treated * post)
reg_3_7a <- lm(nl_extensive ~ D + factor(electrific) + factor(year), data = did)
rob(reg_3_7a)["D", ]
capture.output(rob(reg_3_7a)["D", ], file = "resultats/reg_3_7a.txt")

# (d) treated est constant dans chaque localité : colinéaire avec les effets fixes.
#     Placé après les effets fixes, R ne peut pas l'estimer et renvoie NA.
coef(lm(nl_extensive ~ D + factor(electrific) + factor(year) + treated, data = did))["treated"]

# (c) Pourquoi une petite différence avec 3.4 ? Panel non équilibré :
did %>% group_by(electrific) %>% summarise(n_obs = sum(!is.na(nl_extensive))) %>% count(n_obs)
# Même comparaison sur les seules localités observées les 10 années (panel équilibré)
complets <- did %>% group_by(electrific) %>%
  filter(sum(!is.na(nl_extensive)) == 10) %>% ungroup()
c(interaction = coef(lm(nl_extensive ~ treated * post, data = complets))["treated:post"],
  TWFE = coef(lm(nl_extensive ~ D + factor(electrific) + factor(year), data = complets))["D"])

# (e) Effets fixes de région à la place des effets fixes de localité
reg_3_7e <- lm(nl_extensive ~ D + treated + factor(region_num) + factor(year), data = did)
rob(reg_3_7e)[c("D", "treated"), ]
capture.output(rob(reg_3_7e)[c("D", "treated"), ], file = "resultats/reg_3_7e.txt")
nobs(reg_3_7e)    # 2 866 : les 9 localités sans code de région n'ont pas non plus de mesure de lumière
# Sur le même échantillon (localités avec région), sans effets de région :
avec_region <- filter(did, !is.na(region_num))
coef(lm(nl_extensive ~ D + treated + factor(year), data = avec_region))["D"]

# (f) Ce qui se passe si l'on contrôle nschool_elec (à ne pas faire : c'est un résultat du traitement).
#     Le coefficient tombe à 0,262, mais surtout parce que 2013 et 2014 disparaissent :
#     sur les mêmes 2 290 observations, sans le contrôle, il vaut déjà 0,264.
reg_3_7f      <- lm(nl_extensive ~ treated * post + nschool_elec, data = did)
reg_3_7f_sans <- lm(nl_extensive ~ treated * post, data = filter(did, !is.na(nschool_elec)))
c(avec_controle = unname(coef(reg_3_7f)["treated:post"]),
  sans_controle_meme_echantillon = unname(coef(reg_3_7f_sans)["treated:post"]),
  N = nobs(reg_3_7f))

tab_3_7 <- data.frame(
  modele = c("3.4 : treated x post", "3.7a : EF localité + EF année",
             "3.7e : EF région + EF année + treated"),
  coef_D = c(coef(reg_3_4)["treated:post"], coef(reg_3_7a)["D"], coef(reg_3_7e)["D"]),
  se_HC1 = c(rob(reg_3_4)["treated:post", 2], rob(reg_3_7a)["D", 2], rob(reg_3_7e)["D", 2]),
  N = c(nobs(reg_3_4), nobs(reg_3_7a), nobs(reg_3_7e)))
tab_3_7
write.csv(tab_3_7, "resultats/tab_3_7.csv", row.names = FALSE)

# -----------------------------------------------------------------------------
# Question 3.8 — Erreurs-types groupées par localité
# -----------------------------------------------------------------------------
se_groupe <- function(m, terme) {
  sqrt(vcovCL(m, cluster = ~ electrific, type = "HC1")[terme, terme])
}
tab_3_8 <- data.frame(
  modele = c("3.4 (b) : treated x post", "3.7 (a) : effets fixes"),
  coefficient = c(coef(reg_3_4)["treated:post"], coef(reg_3_7a)["D"]),
  se_HC1 = c(rob(reg_3_4)["treated:post", 2], rob(reg_3_7a)["D", 2]),
  se_groupees = c(se_groupe(reg_3_4, "treated:post"), se_groupe(reg_3_7a, "D")))
tab_3_8$rapport <- tab_3_8$se_groupees / tab_3_8$se_HC1
tab_3_8$ic_bas  <- tab_3_8$coefficient - 1.96 * tab_3_8$se_groupees
tab_3_8$ic_haut <- tab_3_8$coefficient + 1.96 * tab_3_8$se_groupees
tab_3_8
write.csv(tab_3_8, "resultats/tab_3_8.csv", row.names = FALSE)
capture.output(coeftest(reg_3_4, vcov = vcovCL(reg_3_4, cluster = ~ electrific, type = "HC1")),
               file = "resultats/reg_3_8_did.txt")
# Corrélation des résidus d'une même localité d'une année à l'autre
did_res <- did %>% filter(!is.na(nl_extensive)) %>%
  mutate(res = resid(reg_3_4)) %>% arrange(electrific, year) %>%
  group_by(electrific) %>% mutate(res_prec = lag(res)) %>% ungroup()
cor(did_res$res, did_res$res_prec, use = "complete.obs")

# -----------------------------------------------------------------------------
# Compléments (hors énoncé) : à garder seulement si vous les citez dans le rapport
# -----------------------------------------------------------------------------
# Erreurs-types groupées pour les quatre variables de résultat de la question 3.5.
# L'effet sur les écoles n'est plus significatif (p = 0,18) ; pour l'intensité lumineuse,
# l'erreur-type groupée est plus petite que l'erreur-type HC1.
ligne_groupee <- function(m, y) {
  hc <- rob(m)["treated:post", ]
  cl <- coeftest(m, vcov = vcovCL(m, cluster = ~ electrific, type = "HC1"))["treated:post", ]
  data.frame(variable = y, effet_DiD = hc[1], se_HC1 = hc[2], p_HC1 = hc[4],
             se_groupee = cl[2], p_groupee = cl[4], N = nobs(m), row.names = NULL)
}
tab_3_8_quatre <- bind_rows(ligne_groupee(reg_3_4,     "nl_extensive"),
                            ligne_groupee(reg_3_5_int, "nl_intensive_hat"),
                            ligne_groupee(reg_3_5_eco, "nschool_elec"),
                            ligne_groupee(reg_3_5_elv, "n_students_public"))
tab_3_8_quatre
write.csv(tab_3_8_quatre, "resultats/tab_3_8_quatre.csv", row.names = FALSE)

# Grouper par année (10 groupes) ou par région (13 groupes) : trop peu de groupes pour conclure
c(par_annee  = sqrt(vcovCL(reg_3_4, cluster = ~ year,       type = "HC1")["treated:post", "treated:post"]),
  par_region = sqrt(vcovCL(reg_3_4, cluster = ~ region_num, type = "HC1")["treated:post", "treated:post"]))

# Écoles électrifiées : le placebo de la question 3.6 (c) échoue pour cette variable (-0,26),
# et la double différence vaut 0,29 si la période avant se limite à 2006-2007.
placebo_ecoles <- lm(nschool_elec ~ treated * post_fictif, data = placebo)
rob(placebo_ecoles)["treated:post_fictif", ]
did_ecoles_2006 <- lm(nschool_elec ~ treated * post, data = filter(did, year >= 2006))
coeftest(did_ecoles_2006,
         vcov = vcovCL(did_ecoles_2006, cluster = ~ electrific, type = "HC1"))["treated:post", ]

# Fin du script
