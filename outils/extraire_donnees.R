# =============================================================================
# Extraction des données de l'atelier (src/data/*.json) à partir des 4 fichiers
# bruts du travail. Ce script ne sert qu'à alimenter les graphiques interactifs
# de l'application : il n'est PAS le script du travail.
#
# Usage :  Rscript outils/extraire_donnees.R <dossier_des_4_fichiers> <dossier_sortie>
# (session R en UTF-8 : sous Linux/Mac, lancer avec LANG=C.UTF-8)
# =============================================================================
suppressPackageStartupMessages({
  library(dplyr); library(haven); library(lmtest); library(sandwich)
  library(AER); library(jsonlite)
})
args <- commandArgs(trailingOnly = TRUE)
dossier <- args[1]; sortie <- args[2]
dir.create(sortie, recursive = TRUE, showWarnings = FALSE)
ecrire <- function(x, nom) writeLines(toJSON(x, auto_unbox = TRUE, digits = NA, na = "null"),
                                      file.path(sortie, nom), useBytes = TRUE)
rob <- function(m) coeftest(m, vcov = vcovHC(m, type = "HC1"))
ligne <- function(m, terme) { ct <- rob(m); list(b = unname(ct[terme, 1]), se = unname(ct[terme, 2])) }
titre <- function(x) {                       # "SAINT-JOSSE-TEN-NOODE" -> "Saint-Josse-Ten-Noode"
  x <- tolower(x)
  gsub("(^|[ '-])([[:alpha:]])", "\\1\\U\\2", x, perl = TRUE)
}

# ------------------------------- PARTIE 1 ------------------------------------
immo_raw <- read.delim(file.path(dossier, "vastgoed_2010_9999.txt"), sep = "|",
                       fileEncoding = "latin1", colClasses = c(CD_REFNIS = "character"))
fisc_raw <- read.delim(file.path(dossier, "TF_PSNL_INC_TAX_MUNTY.txt"), sep = "|",
                       fileEncoding = "UTF-8-BOM", colClasses = c(CD_MUNTY_REFNIS = "character"))
ventes23 <- immo_raw %>% filter(CD_YEAR == 2023, CD_PERIOD == "Y", CD_niveau_refnis == 5)
maisons23 <- ventes23 %>%
  filter(CD_TYPE_NL == "Alle huizen met 2, 3, 4 of meer gevels (excl. appartementen)") %>%
  transmute(refnis = CD_REFNIS, commune = CD_REFNIS_FR, n_ventes = MS_TOTAL_TRANSACTIONS,
            prix = MS_P_50_median, p25 = MS_P_25, p75 = MS_P_75)
apparts23 <- ventes23 %>% filter(CD_TYPE_NL == "Appartementen") %>%
  transmute(refnis = CD_REFNIS, n_app = MS_TOTAL_TRANSACTIONS)
fisc23 <- fisc_raw %>% filter(CD_YEAR == 2023) %>%
  transmute(code = CD_MUNTY_REFNIS, nom = TX_MUNTY_DESCR_FR,
            region = c("2000" = "F", "3000" = "W", "4000" = "B")[as.character(CD_RGN_REFNIS)],
            rev = MS_TOT_NET_TAXABLE_INC, pop = MS_TOT_RESIDENTS)

fusions <- list("11002" = c("11002","11007"), "23106" = c("23023","23024","23032"),
  "37021" = c("37012","37018"), "37022" = c("37007","37015"), "44086" = c("44012","44048"),
  "44087" = c("44034","44073"), "44088" = c("44040","44043"), "46029" = c("46014","44045"),
  "46030" = c("46003","46013","11056"), "71071" = c("71057","71069"), "71072" = c("71022","73040"),
  "73110" = c("73006","73032"), "73111" = c("73009","73083"), "82039" = c("82003","82005"))
cle <- data.frame(code = unlist(fusions, use.names = FALSE),
                  nouveau = rep(names(fusions), lengths(fusions)))
fisc_new <- fisc23 %>% left_join(cle, by = "code") %>%
  mutate(refnis = ifelse(is.na(nouveau), code, nouveau)) %>%
  group_by(refnis) %>%
  summarise(rev = sum(rev), pop = sum(pop), region = first(region), n_anc = n(),
            nom_fisc = first(nom), .groups = "drop") %>%
  mutate(rev_hab = rev / pop)
base565 <- maisons23 %>% inner_join(fisc_new, by = "refnis") %>% left_join(apparts23, by = "refnis") %>%
  mutate(nom = ifelse(n_anc == 1, nom_fisc, titre(commune)))
stopifnot(nrow(base565) == 565)
base <- base565 %>% filter(!is.na(prix))
stopifnot(nrow(base) == 551)

# Table des 14 fusions, avec le détail des anciennes communes
tab_fusions <- lapply(names(fusions), function(nv) {
  anc <- fisc23 %>% filter(code %in% fusions[[nv]]) %>% arrange(match(code, fusions[[nv]]))
  v <- base565 %>% filter(refnis == nv)
  list(code = nv, nom = v$nom, n_ventes = v$n_ventes, prix = v$prix,
       anciennes = lapply(seq_len(nrow(anc)), function(i)
         list(code = anc$code[i], nom = anc$nom[i], pop = anc$pop[i], rev = round(anc$rev[i]))))
})
seul_v <- anti_join(maisons23, fisc23, by = c("refnis" = "code"))
seul_f <- anti_join(fisc23, maisons23, by = c("code" = "refnis"))

communes <- list(
  colonnes = c("refnis", "nom", "region", "prix", "rev_hab", "n_ventes", "p25", "p75", "n_app", "pop"),
  lignes = lapply(seq_len(nrow(base)), function(i) with(base[i, ], list(
    refnis, nom, region, prix, round(rev_hab, 2), n_ventes, p25, p75, n_app, pop))),
  exclues = lapply(which(is.na(base565$prix)), function(i) with(base565[i, ], list(
    nom = nom, region = region, n_ventes = n_ventes, pop = pop, rev_hab = round(rev_hab)))),
  fusions = tab_fusions,
  seul_ventes = lapply(seq_len(nrow(seul_v)), function(i) list(code = seul_v$refnis[i], nom = titre(seul_v$commune[i]))),
  seul_fisc = lapply(seq_len(nrow(seul_f)), function(i) list(code = seul_f$code[i], nom = seul_f$nom[i], region = seul_f$region[i])),
  n_ventes_fichier = n_distinct(maisons23$refnis), n_fisc_fichier = n_distinct(fisc23$code))
ecrire(communes, "communes.json")

# Valeurs de référence de la partie 1 (pour tester les calculs JavaScript)
b <- base %>% mutate(lprix = log(prix), lrev = log(rev_hab), prix_k = prix / 1000, rev_k = rev_hab / 1000,
                     region = factor(c(F = "Flandre", W = "Wallonie", B = "Bruxelles")[region],
                                     levels = c("Flandre", "Wallonie", "Bruxelles")),
                     n_app0 = ifelse(is.na(n_app), 0, n_app), part_app = n_app0 / (n_app0 + n_ventes),
                     lpop = log(pop), lventes = log(n_ventes))
m_nn <- lm(prix_k ~ rev_k, b); m_ll <- lm(lprix ~ lrev, b)
m_ln <- lm(lprix ~ rev_k, b);  m_nl <- lm(prix_k ~ lrev, b)
m9 <- lm(lprix ~ lrev + region, b); m13 <- lm(lprix ~ lrev * region, b)
m15 <- lm(lprix ~ lrev + region + lpop + part_app, b)
coefs <- function(m) { ct <- rob(m); setNames(lapply(seq_len(nrow(ct)), function(i)
  list(b = unname(ct[i, 1]), se = unname(ct[i, 2]))), rownames(ct)) }
ref1 <- list(
  nn = c(coefs(m_nn), r2 = summary(m_nn)$r.squared), ll = c(coefs(m_ll), r2 = summary(m_ll)$r.squared),
  ln = c(coefs(m_ln), r2 = summary(m_ln)$r.squared), nl = c(coefs(m_nl), r2 = summary(m_nl)$r.squared),
  m9 = c(coefs(m9), r2 = summary(m9)$r.squared), m13 = c(coefs(m13), r2 = summary(m13)$r.squared),
  m15 = c(coefs(m15), r2 = summary(m15)$r.squared),
  se_classique = list(ll = unname(sqrt(diag(vcov(m_ll)))["lrev"]), m9 = unname(sqrt(diag(vcov(m9)))["lrev"])),
  bp = list(ll_reg = unname(bptest(m_ll)$statistic), ll_ventes = unname(bptest(m_ll, ~ lventes, data = b)$statistic),
            m9_reg = unname(bptest(m9)$statistic), m9_ventes = unname(bptest(m9, ~ lventes, data = b)$statistic)))

# ------------------------------- PARTIE 2 ------------------------------------
load(file.path(dossier, "Fertility.RData"))
f <- Fertility %>% mutate(mk = as.numeric(morekids == "yes"), afam = as.numeric(afam == "yes"),
  hispanic = as.numeric(hispanic == "yes"), other = as.numeric(other == "yes"),
  boy1st = as.numeric(gender1 == "male"), samegender = as.numeric(gender1 == gender2),
  twoboys = as.numeric(gender1 == "male" & gender2 == "male"),
  twogirls = as.numeric(gender1 == "female" & gender2 == "female"), travaille = as.numeric(work > 0))
cellules <- f %>% group_by(g1 = ifelse(gender1 == "male", "G", "F"), g2 = ifelse(gender2 == "male", "G", "F"), mk) %>%
  summarise(n = n(), sw = sum(work), sw2 = sum(work^2), nw = sum(work > 0), .groups = "drop")
dist <- lapply(0:1, function(k) as.vector(table(factor(f$work[f$mk == k], levels = 0:52))))
equilibre <- lapply(c("age", "afam", "hispanic", "other"), function(v) {
  m <- lm(as.formula(paste(v, "~ samegender")), f); ct <- rob(m)
  list(variable = v, diff0 = unname(coef(m)[1]), meme1 = unname(coef(m)[1] + coef(m)[2]),
       ecart = unname(ct[2, 1]), se = unname(ct[2, 2]), p = unname(ct[2, 4])) })
r22 <- lm(work ~ mk, f); r24 <- lm(mk ~ samegender, f); r25 <- lm(mk ~ twoboys + twogirls + boy1st, f)
r26a <- lm(work ~ samegender, f); r26b <- ivreg(work ~ mk | samegender, data = f)
r27m <- lm(work ~ mk + age + afam + hispanic + other, f)
r27v <- ivreg(work ~ mk + age + afam + hispanic + other | samegender + age + afam + hispanic + other, data = f)
fs28 <- lm(mk ~ twoboys + twogirls + age + afam + hispanic + other + boy1st, f)
r28 <- ivreg(work ~ mk + age + afam + hispanic + other + boy1st |
               twoboys + twogirls + age + afam + hispanic + other + boy1st, data = f)
r28m <- lm(work ~ mk + age + afam + hispanic + other + boy1st, f)
r210b <- ivreg(work ~ mk + age + afam + hispanic + other + boy1st | twoboys + age + afam + hispanic + other + boy1st, data = f)
r210g <- ivreg(work ~ mk + age + afam + hispanic + other + boy1st | twogirls + age + afam + hispanic + other + boy1st, data = f)
r213m <- lm(travaille ~ mk + age + afam + hispanic + other + boy1st, f)
r213v <- ivreg(travaille ~ mk + age + afam + hispanic + other + boy1st |
                 twoboys + twogirls + age + afam + hispanic + other + boy1st, data = f)
aux <- lm(resid(r28) ~ twoboys + twogirls + age + afam + hispanic + other + boy1st, f)
f$v_hat <- resid(fs28)
haus <- lm(work ~ mk + age + afam + hispanic + other + boy1st + v_hat, f)
mk_ctrl <- lm(mk ~ age + afam + hispanic + other, f)
sg_ctrl <- lm(samegender ~ age + afam + hispanic + other, f)
fert <- list(
  n = nrow(f), cellules = cellules, dist = dist, equilibre = equilibre,
  moy = list(work = mean(f$work), zero = mean(f$work == 0), plein = mean(f$work == 52), mk = mean(f$mk),
             samegender = mean(f$samegender), mediane = median(f$work),
             sem_actives_2enf = mean(f$work[f$mk == 0 & f$work > 0]), part_actives_2enf = mean(f$work[f$mk == 0] > 0)),
  est = list(
    list(id = "mco22", q = "2.2", nom = "MCO, sans contrôle", b = ligne(r22, "mk")$b, se = ligne(r22, "mk")$se, type = "mco"),
    list(id = "vi26", q = "2.6", nom = "VI samegender, sans contrôle", b = ligne(r26b, "mk")$b, se = ligne(r26b, "mk")$se, type = "vi"),
    list(id = "mco27", q = "2.7", nom = "MCO + contrôles", b = ligne(r27m, "mk")$b, se = ligne(r27m, "mk")$se, type = "mco"),
    list(id = "vi27", q = "2.7", nom = "VI samegender + contrôles", b = ligne(r27v, "mk")$b, se = ligne(r27v, "mk")$se, type = "vi"),
    list(id = "tsls28", q = "2.8", nom = "2SLS twoboys + twogirls", b = ligne(r28, "mk")$b, se = ligne(r28, "mk")$se, type = "vi"),
    list(id = "vi210b", q = "2.10", nom = "VI twoboys seul", b = ligne(r210b, "mk")$b, se = ligne(r210b, "mk")$se, type = "vi"),
    list(id = "vi210g", q = "2.10", nom = "VI twogirls seul", b = ligne(r210g, "mk")$b, se = ligne(r210g, "mk")$se, type = "vi")),
  ref = list(
    mco22 = coefs(r22), fs24 = coefs(r24), r25 = coefs(r25), rf26 = coefs(r26a), fs28 = coefs(fs28),
    mco27 = coefs(r27m), tsls28 = coefs(r28), mco28 = coefs(r28m),
    travaille_mco = ligne(r213m, "mk"), travaille_2sls = ligne(r213v, "mk"),
    sargan = nrow(f) * summary(aux)$r.squared, hausman = ligne(haus, "v_hat"),
    r2_fs24 = summary(r24)$r.squared, mk_ctrl = coefs(mk_ctrl), sg_ctrl = coefs(sg_ctrl)))
ecrire(fert, "fert.json")

# ------------------------------- PARTIE 3 ------------------------------------
e <- read_dta(file.path(dossier, "elec_data.dta")) %>% filter(year >= 2003, year <= 2014) %>%
  mutate(across(c(electrific, year, year_of_el, region_num), as.numeric)) %>% arrange(electrific, year)
loc <- e %>% group_by(electrific) %>%
  summarise(an = first(year_of_el), reg = first(region_num),
            nl = paste0(ifelse(is.na(nl_extensive), "-", as.character(nl_extensive)), collapse = ""), .groups = "drop")
stopifnot(all(nchar(loc$nl) == 12), nrow(loc) == 574)
d <- e %>% filter(year_of_el %in% c(2008, 2009, 2015, 2016, 2017)) %>%
  mutate(treated = as.numeric(year_of_el %in% c(2008, 2009)), post = as.numeric(year > 2009), D = treated * post)
series <- d %>% group_by(treated, year) %>%
  summarise(nl_extensive = mean(nl_extensive, na.rm = TRUE), nl_intensive_hat = mean(nl_intensive_hat, na.rm = TRUE),
            nschool_elec = mean(nschool_elec, na.rm = TRUE), n_students_public = mean(n_students_public, na.rm = TRUE),
            .groups = "drop")
did <- d %>% filter(!year %in% c(2008, 2009))
m34 <- lm(nl_extensive ~ treated * post, did)
m37 <- lm(nl_extensive ~ D + factor(electrific) + factor(year), did)
cl <- function(m, t) unname(sqrt(vcovCL(m, cluster = ~ electrific, type = "HC1")[t, t]))
autres <- lapply(c("nl_extensive", "nl_intensive_hat", "nschool_elec", "n_students_public"), function(v) {
  m <- lm(as.formula(paste(v, "~ treated * post")), did); ct <- rob(m)
  list(variable = v, b = unname(ct["treated:post", 1]), se = unname(ct["treated:post", 2]),
       p = unname(ct["treated:post", 4]), n = nobs(m), cl = cl(m, "treated:post"),
       cellules = unname(c(coef(m)[1], coef(m)[1] + coef(m)[3], coef(m)[1] + coef(m)[2], sum(coef(m))))) })
elec <- list(annees = 2003:2014,
  loc = lapply(seq_len(nrow(loc)), function(i) list(loc$an[i], loc$reg[i], loc$nl[i])),
  series = series, autres = autres,
  ref = list(m34 = coefs(m34), cl34 = cl(m34, "treated:post"), twfe = ligne(m37, "D"), cl_twfe = cl(m37, "D")))
ecrire(elec, "elec.json")

ecrire(list(p1 = ref1), "ref.json")
cat("OK :", paste(list.files(sortie), collapse = ", "), "\n")
