let articleEnCoursDeModification = null;
let imageArticleActuelle = null;


/* =====================================================
   BOUSDELA INVEST - JAVASCRIPT
   Gestion des interactions du site
===================================================== */



"use strict";

/* =====================================================
   1. STOCKAGE DES DONNÉES
===================================================== */

const STORAGE_KEYS = {
    articles: "bousdela_articles",
    profile: "bousdela_profile",
    settings: "bousdela_settings"
};

function lireStockage(cle, valeurDefaut) {
    try {
        const donnees = localStorage.getItem(cle);
        return donnees ? JSON.parse(donnees) : valeurDefaut;
    } catch (erreur) {
        console.error("Erreur de lecture :", erreur);
        return valeurDefaut;
    }
}

function enregistrerStockage(cle, donnees) {
    try {
        localStorage.setItem(cle, JSON.stringify(donnees));
        return true;
    } catch (erreur) {
        console.error("Erreur d'enregistrement :", erreur);
        alert("Impossible d'enregistrer les données.");
        return false;
    }
}

function obtenirArticles() {
    return lireStockage(STORAGE_KEYS.articles, []);
}

function formaterDate(date) {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(new Date(date));
}

function nomCategorie(categorie) {
    const categories = {
        forex: "Forex",
        crypto: "Crypto",
        actions: "Actions",
        "matieres-premieres": "Matières premières",
        macroeconomie: "Macroéconomie"
    };

    return categories[categorie] || categorie;
}

/* =====================================================
   2. INITIALISATION
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    initialiserNavigation();
    initialiserActualites();
    initialiserAdministration();
    initialiserArticle();
    initialiserProfil();
    initialiserAuthentification();
    initialiserParametres();
    protegerPageActualites();
    protegerAdministration();
    chargerArticlesAdministration();
    initialiserApercuImage();
});

/* =====================================================
   3. NAVIGATION ADMINISTRATION
===================================================== */

function initialiserNavigation() {

    const liens = document.querySelectorAll(
        ".admin-sidebar a[href^='#']"
    );

    liens.forEach(function (lien) {

        lien.addEventListener("click", function (event) {

            const cible = document.querySelector(
                lien.getAttribute("href")
            );

            if (!cible) return;

            event.preventDefault();

            cible.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            liens.forEach(function (autreLien) {
                autreLien.classList.remove("active");
            });

            lien.classList.add("active");

        });

    });

}

/* =====================================================
   4. RECHERCHE ET FILTRES DES ACTUALITÉS
===================================================== */

async function initialiserArticle() {
    const bloc = document.querySelector(".article-detail");
    if (!bloc) return;

    const parametres = new URLSearchParams(window.location.search);
    const id = parametres.get("id");

    if (!id) {
        bloc.textContent = "Aucun article sélectionné.";
        return;
    }

    const { data: article, error } = await supabaseClient
        .from("articles")
        .select("id, title, summary, content, image_url, source_url, category_id, published_at, created_at")
        .eq("id", id)
        .eq("status", "published")
        .single();

    if (error || !article) {
        console.error("Erreur de chargement :", error);
        bloc.textContent = "Impossible de charger cet article.";
        return;
    }

    const { data: categorie } = await supabaseClient
        .from("categories")
        .select("name")
        .eq("id", article.category_id)
        .single();

    const titre = bloc.querySelector(".article-header h1");
    const categorieElement = bloc.querySelector(".article-category");
    const date = bloc.querySelector(".article-header time");
    const resume = bloc.querySelector(".article-summary p");
    const corps = bloc.querySelector(".article-body");
    const image = bloc.querySelector(".article-cover");
    const sources = bloc.querySelector(".article-sources ul");

    if (titre) titre.textContent = article.title;
    if (categorieElement) categorieElement.textContent = categorie?.name || "Actualité";

    if (date) {
        date.textContent = new Date(
            article.published_at || article.created_at
        ).toLocaleDateString("fr-FR");
    }
      if (resume) {
    resume.textContent = article.summary || "Aucun résumé disponible.";
}

if (corps) {
    corps.innerHTML = "";

    const paragraphe = document.createElement("p");
    paragraphe.textContent = article.content || "Aucun contenu disponible.";

    corps.appendChild(paragraphe);
}
    
    if (image && article.image_url) {
        image.src = article.image_url;
        image.alt = article.title;
    }

    if (sources) {
        sources.innerHTML = "";

        if (article.source_url) {
            const lien = document.createElement("a");
            lien.href = article.source_url;
            lien.textContent = "Consulter la source";
            lien.target = "_blank";
            lien.rel = "noopener noreferrer";

            const element = document.createElement("li");
            element.appendChild(lien);
            sources.appendChild(element);
        }
    }
}
/* =====================================================
   5. AFFICHER LES ARTICLES PUBLIÉS
===================================================== */

async function afficherArticlesDansActualites() {

    const grille = document.querySelector(".news-grid");

    if (!grille) return;

    grille.replaceChildren();

    try {

        // 1. Récupérer les catégories.
        const { data: categories, error: erreurCategories } =
            await supabaseClient
                .from("categories")
                .select("id, name, slug");

        if (erreurCategories) throw erreurCategories;

        // 2. Récupérer les articles publiés.
        const { data: articles, error: erreurArticles } =
            await supabaseClient
                .from("articles")
                .select("id, title, summary, image_url, category_id, published_at, created_at")
                .eq("status", "published")
                .order("published_at", { ascending: false });

        if (erreurArticles) throw erreurArticles;

// Récupérer la catégorie demandée dans l'URL.
const parametres = new URLSearchParams(window.location.search);
const categorieDemandee = parametres.get("categorie");

// Filtrer les articles selon la catégorie.
let articlesFiltres = articles;

if (categorieDemandee) {
    const categorieSelectionnee = categories.find(function(categorie) {
        return categorie.slug === categorieDemandee;
    });

    if (categorieSelectionnee) {
        articlesFiltres = articles.filter(function(article) {
            return article.category_id === categorieSelectionnee.id;
        });
    } else {
        articlesFiltres = [];
    }
}


        // 3. Afficher un message si aucun article n'existe.
        if (!articlesFiltres || articlesFiltres.length === 0) {

            const message = document.createElement("p");
            message.className = "no-results";
            message.textContent = "Aucune actualité publiée pour le moment.";

            grille.appendChild(message);
            return;
        }

        // 4. Construire les cartes.
         articlesFiltres.forEach(function (article) {

            const categorieArticle = categories.find(function (categorie) {
                return categorie.id === article.category_id;
            });

            const carte = document.createElement("article");
            carte.className = "news-card";
            carte.dataset.articleId = article.id;
            carte.dataset.category = categorieArticle
                ? categorieArticle.slug
                : "";

            // Image de couverture.
            if (article.image_url) {

                const image = document.createElement("img");
                image.src = article.image_url;
                image.alt = article.title;

                carte.appendChild(image);
            }

            const contenu = document.createElement("div");
            contenu.className = "card-content";

            const categorie = document.createElement("span");
            categorie.className = "category";
            categorie.textContent = categorieArticle
                ? categorieArticle.name
                : "Autre";

            const titre = document.createElement("h3");
            titre.textContent = article.title;

            const resume = document.createElement("p");
            resume.textContent = article.summary;

            const lien = document.createElement("a");
            lien.href = "article.html?id=" + encodeURIComponent(article.id);
            lien.className = "btn";
            lien.textContent = "Lire l'article";

            contenu.append(
                categorie,
                titre,
                resume,
                lien
            );

            carte.appendChild(contenu);
            grille.appendChild(carte);

        });

        // 5. Actualiser la recherche après le chargement.
        const recherche = document.getElementById("searchInput");

        if (recherche) {
            recherche.dispatchEvent(new Event("input"));
        }

    } catch (erreur) {

        console.error("Erreur de chargement des actualités :", erreur);

        const message = document.createElement("p");
        message.textContent =
            "Impossible de charger les actualités. Veuillez réessayer.";

        grille.appendChild(message);
    }
}

 
async function initialiserActualites() {
    const grille = document.querySelector(".news-grid");
    if (!grille) return;

    const boutons = document.querySelectorAll(
        ".categories a[data-filter]"
    );

    const recherche = document.getElementById("searchInput");

    const parametres = new URLSearchParams(window.location.search);
    let categorieActive = parametres.get("categorie") || "all";
    let rechercheActive = "";

    function appliquerFiltres() {
        const cartes = grille.querySelectorAll(".news-card");

        cartes.forEach(function(carte) {
            const categorie = carte.dataset.category || "";

            const titre = carte.querySelector("h3")?.textContent || "";
            const resume = carte.querySelector("p")?.textContent || "";

            const texte = (titre + " " + resume).toLowerCase();

            const correspondCategorie =
                categorieActive === "all" ||
                categorie === categorieActive;

            const correspondRecherche =
                texte.includes(rechercheActive);

            carte.style.display =
                correspondCategorie && correspondRecherche
                    ? ""
                    : "none";
        });

        boutons.forEach(function(bouton) {
            bouton.classList.toggle(
                "active",
                bouton.dataset.filter === categorieActive
            );
        });
    }

    // Recherche en temps réel.
    if (recherche) {
        recherche.addEventListener("input", function() {
            rechercheActive = recherche.value
                .trim()
                .toLowerCase();

            appliquerFiltres();
        });
    }

    // Filtrage par catégorie.
    boutons.forEach(function(bouton) {
        bouton.addEventListener("click", function(event) {
            event.preventDefault();

            categorieActive = bouton.dataset.filter;

            appliquerFiltres();
        });
    });

    // Charger les articles depuis Supabase.
    await afficherArticlesDansActualites();

    appliquerFiltres();
}

   

/* =====================================================
   6. ADMINISTRATION : CRÉER UN ARTICLE
===================================================== */



/* =====================================================
   7. TABLEAU DE BORD ADMINISTRATION
===================================================== */


async function initialiserAdministration() {
    const formulaire = document.getElementById("article-form");
    if (!formulaire) return;

    formulaire.addEventListener("submit", async function (event) {
        event.preventDefault();

        const bouton = formulaire.querySelector('button[type="submit"]');

        const titre = document.getElementById("article-title").value.trim();
        const categorie = document.getElementById("article-category").value;
        const resume = document.getElementById("article-summary").value.trim();
        const contenu = document.getElementById("article-content").value.trim();

        const champSource = document.getElementById("article-source");
        const source = champSource ? champSource.value.trim() : "";

        const champImage = document.getElementById("article-image");
        const fichierImage = champImage ? champImage.files[0] : null;

        if (!titre || !categorie || !resume || !contenu) {
            alert("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        if (source && !/^https?:\/\//i.test(source)) {
            alert("L'adresse de la source doit commencer par http:// ou https://");
            return;
        }

        if (typeof supabaseClient === "undefined") {
            alert("Supabase n'est pas initialisé.");
            return;
        }

        if (fichierImage) {
            const typesAutorises = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!typesAutorises.includes(fichierImage.type)) {
                alert("Format non autorisé. Utilisez JPG, PNG ou WEBP.");
                return;
            }

            if (fichierImage.size > 5 * 1024 * 1024) {
                alert("L'image ne doit pas dépasser 5 Mo.");
                return;
            }
        }

        try {
            bouton.disabled = true;
            bouton.textContent = "Enregistrement...";

            const { data: sessionData, error: sessionError } =
                await supabaseClient.auth.getSession();

            if (sessionError || !sessionData.session) {
                throw new Error("Vous devez être connecté.");
            }

            const utilisateur = sessionData.session.user;

            const { data: categorieData, error: categorieError } =
                await supabaseClient
                    .from("categories")
                    .select("id")
                    .eq("slug", categorie)
                    .single();

            if (categorieError || !categorieData) {
                throw new Error("Catégorie introuvable dans Supabase.");
            }

            const slug = titre
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

            // Conserver l'image existante si aucune nouvelle image n'est choisie.
            let imageUrl = imageArticleActuelle;

            // Télécharger une nouvelle image si nécessaire.
            if (fichierImage) {
                const extension = fichierImage.name
                    .split(".")
                    .pop()
                    .toLowerCase();

                const nomImage =
                    utilisateur.id + "/" + crypto.randomUUID() + "." + extension;

                const { error: uploadError } = await supabaseClient
                    .storage
                    .from("articles-images")
                    .upload(nomImage, fichierImage, {
                        contentType: fichierImage.type,
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                const { data: imageData } = supabaseClient
                    .storage
                    .from("articles-images")
                    .getPublicUrl(nomImage);

                imageUrl = imageData.publicUrl;
            }

            // Préparer les données de l'article.
            const donneesArticle = {
                title: titre,
                slug: slug + "-" + Date.now(),
                summary: resume,
                content: contenu,
                image_url: imageUrl,
                source_url: source || null,
                category_id: categorieData.id
            };

            if (articleEnCoursDeModification) {
                // MODIFIER un article existant.
                const { error } = await supabaseClient
                    .from("articles")
                    .update(donneesArticle)
                    .eq("id", articleEnCoursDeModification);

                if (error) throw error;

                alert("Article modifié avec succès !");

            } else {
                // CRÉER un nouvel article.
                const { error } = await supabaseClient
                    .from("articles")
                    .insert({
                        ...donneesArticle,
                        status: "published",
                        author_id: utilisateur.id,
                        published_at: new Date().toISOString()
                    });

                if (error) throw error;

                alert("Article et image enregistrés avec succès !");
            }

            // Réinitialiser le formulaire.
            formulaire.reset();

            articleEnCoursDeModification = null;
            imageArticleActuelle = null;

            const conteneurApercu =
                document.getElementById("image-preview-container");

            const apercu = document.getElementById("image-preview");

            if (conteneurApercu) {
                conteneurApercu.style.display = "none";
            }

            if (apercu) {
                apercu.src = "";
            }

            await chargerArticlesAdministration();

        } catch (erreur) {
            console.error("Erreur d'enregistrement :", erreur);
            alert("Erreur : " + erreur.message);

        } finally {
            bouton.disabled = false;

            bouton.textContent = articleEnCoursDeModification
                ? "Enregistrer les modifications"
                : "Publier l'article";
        }
    });
}

/* =====================================================
   8. PAGE DÉTAIL D'UN ARTICLE
===================================================== */

/* =====================================================
   9. PROFIL UTILISATEUR
===================================================== */

function initialiserProfil() {

    const profil = document.querySelector(".profile-container");

    if (!profil) return;

    const donnees = lireStockage(
        STORAGE_KEYS.profile,
        {
            nom: "Votre nom",
            email: "votre@email.com",
            dateInscription: "À renseigner",
            photo: ""
        }
    );

    const informations = profil.querySelectorAll(
        ".profile-info > div"
    );

    if (informations.length >= 3) {

        informations[0].querySelector("p").textContent = donnees.nom;
        informations[1].querySelector("p").textContent = donnees.email;

        informations[2].querySelector("p").textContent =
            donnees.dateInscription;

    }

    const avatar = profil.querySelector(".profile-avatar");

    if (avatar && donnees.photo) {
        avatar.src = donnees.photo;
    }

    const boutons = profil.querySelectorAll(
        ".profile-actions button"
    );

    // Modifier le profil.
    if (boutons[0]) {

        boutons[0].addEventListener("click", function () {

            const nouveauNom = prompt(
                "Entrez votre nom complet :",
                donnees.nom
            );

            if (nouveauNom === null) return;

            const nouvelEmail = prompt(
                "Entrez votre adresse e-mail :",
                donnees.email
            );

            if (nouvelEmail === null) return;

            const emailValide =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nouvelEmail.trim());

            if (!nouveauNom.trim() || !emailValide) {

                alert("Veuillez saisir un nom et un e-mail valides.");

                return;

            }

            donnees.nom = nouveauNom.trim();
            donnees.email = nouvelEmail.trim();

            if (
                enregistrerStockage(
                    STORAGE_KEYS.profile,
                    donnees
                )
            ) {
                location.reload();
            }

        });

    }

    // Changer la photo.
    if (boutons[1]) {

        const champPhoto = document.createElement("input");

        champPhoto.type = "file";
        champPhoto.accept = "image/*";
        champPhoto.hidden = true;

        profil.appendChild(champPhoto);

        boutons[1].addEventListener("click", function () {
            champPhoto.click();
        });

        champPhoto.addEventListener("change", function () {

            const fichier = champPhoto.files[0];

            if (!fichier) return;

            if (!fichier.type.startsWith("image/")) {

                alert("Veuillez sélectionner une image.");

                return;

            }

            const lecteur = new FileReader();

            lecteur.addEventListener("load", function () {

                donnees.photo = lecteur.result;

                if (
                    enregistrerStockage(
                        STORAGE_KEYS.profile,
                        donnees
                    )
                ) {
                    location.reload();
                }

            });

            lecteur.readAsDataURL(fichier);

        });

    }

}


/* =====================================================
   10. AUTHENTIFICATION GOOGLE AVEC SUPABASE
===================================================== */

function initialiserAuthentification() {

    if (typeof supabaseClient === "undefined") {
        console.error("Supabase n'est pas initialisé.");
        return;
    }

    // Boutons de connexion Google.
    const boutons = document.querySelectorAll(".google-btn");

    boutons.forEach(function (bouton) {

        bouton.addEventListener("click", async function () {

            bouton.disabled = true;

            const { error } = await supabaseClient.auth.signInWithOAuth({

                provider: "google",

                options: {
                    redirectTo: new URL(
                        "profil.html",
                        window.location.href
                    ).href,

                    queryParams: {
                        prompt: "select_account"
                    }
                }

            });

            if (error) {

                console.error("Erreur Google :", error.message);

                alert("Impossible de lancer la connexion Google.");

                bouton.disabled = false;

            }

        });

    });

    // Récupérer la session existante.
    supabaseClient.auth.getSession().then(function (resultat) {

        if (resultat.error) {
            console.error(resultat.error.message);
            return;
        }

        if (resultat.data.session) {
            afficherProfilGoogle(resultat.data.session.user);
        }

    });

    // Surveiller les changements de session.
    supabaseClient.auth.onAuthStateChange(function (evenement, session) {

        if (session) {
            afficherProfilGoogle(session.user);
        }

    });

    // Déconnexion.
    const boutonDeconnexion = document.querySelector(
        ".profile-actions a.btn-danger"
    );

    if (boutonDeconnexion) {

        boutonDeconnexion.addEventListener("click", async function (event) {

            event.preventDefault();

            const confirmation = confirm(
                "Voulez-vous vraiment vous déconnecter ?"
            );

            if (!confirmation) return;

            const { error } = await supabaseClient.auth.signOut();

            if (error) {

                console.error("Erreur de déconnexion :", error.message);

                alert("La déconnexion a échoué.");

                return;

            }

            window.location.replace("index.html");

        });

    }

}


/* =====================================================
   11. AFFICHER LES INFORMATIONS GOOGLE
===================================================== */

function afficherProfilGoogle(utilisateur) {

    const profil = document.querySelector(".profile-container");

    if (!profil || !utilisateur) return;

    const nom =
        utilisateur.user_metadata?.full_name ||
        utilisateur.user_metadata?.name ||
        "Utilisateur";

    const email = utilisateur.email || "";

    const photo =
        utilisateur.user_metadata?.avatar_url ||
        utilisateur.user_metadata?.picture ||
        "";

    const dateInscription = utilisateur.created_at
        ? formaterDate(utilisateur.created_at)
        : "Non disponible";

    const informations = profil.querySelectorAll(
        ".profile-info > div"
    );

    if (informations.length >= 3) {

        informations[0].querySelector("p").textContent = nom;

        informations[1].querySelector("p").textContent = email;

        informations[2].querySelector("p").textContent = dateInscription;

    }

    const avatar = profil.querySelector(".profile-avatar");

    if (avatar && photo) {
        avatar.src = photo;
    }

}


/* =====================================================
   12. PARAMÈTRES DU SITE
===================================================== */

function initialiserParametres() {

    const champNom = document.getElementById("site-name");

    const champSlogan = document.getElementById("site-description");

    if (!champNom || !champSlogan) return;

    const parametres = lireStockage(
        STORAGE_KEYS.settings,
        {
            nom: "BOUSDELA INVEST",
            slogan: "L'information qui éclaire vos décisions."
        }
    );

    champNom.value = parametres.nom;

    champSlogan.value = parametres.slogan;

    const section = document.getElementById("settings");

    const bouton = section
        ? section.querySelector("button")
        : null;

    if (!bouton) return;

    bouton.addEventListener("click", function () {

        const nouveauxParametres = {

            nom: champNom.value.trim(),

            slogan: champSlogan.value.trim()

        };

        if (
            !nouveauxParametres.nom ||
            !nouveauxParametres.slogan
        ) {

            alert("Veuillez remplir les deux champs.");

            return;

        }

        if (
            enregistrerStockage(
                STORAGE_KEYS.settings,
                nouveauxParametres
            )
        ) {

            alert("Paramètres enregistrés dans ce navigateur.");

        }

    });

}


/* =====================================================
   13. PROTECTION DE LA PAGE ACTUALITÉS
===================================================== */

async function protegerPageActualites() {

    const contenu = document.getElementById("contenu-protege");

    // Ne rien faire si nous ne sommes pas sur Actualités.
    if (!contenu) return;

    // Vérifier la disponibilité de Supabase.
    if (typeof supabaseClient === "undefined") {

        console.error("Supabase n'est pas initialisé.");

        window.location.replace("connexion.html");

        return;

    }

    // Récupérer la session.
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {

        console.error(
            "Erreur de vérification de la session :",
            error.message
        );

        window.location.replace("connexion.html");

        return;

    }

    // Rediriger si aucun utilisateur n'est connecté.
    if (!data.session) {

        window.location.replace("connexion.html");

        return;

    }

    // Afficher les actualités si l'utilisateur est connecté.
    contenu.hidden = false;

}
/* =====================================================
   14. PROTECTION DE L'ADMINISTRATION
===================================================== */

async function protegerAdministration() {

    const contenu = document.getElementById(
        "administration-protegee"
    );

    // Ne rien faire si nous ne sommes pas sur l'administration.
    if (!contenu) return;

    // Vérifier que Supabase est disponible.
    if (typeof supabaseClient === "undefined") {

        console.error("Supabase n'est pas initialisé.");

        window.location.replace("connexion.html");

        return;

    }

    // Vérifier la session de l'utilisateur.
    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error || !data.session) {

        window.location.replace("connexion.html");

        return;

    }

    // Récupérer l'identifiant de l'utilisateur.
    const utilisateur = data.session.user;

    // Vérifier son rôle dans la table profiles.
    const { data: profil, error: erreurProfil } =
        await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", utilisateur.id)
            .single();

    if (erreurProfil || !profil) {

        console.error("Impossible de vérifier le rôle.");

        alert("Accès refusé.");

        window.location.replace("index.html");

        return;

    }

    // Autoriser uniquement le super administrateur.
    if (profil.role !== "super_admin") {

        alert("Accès réservé au super administrateur.");

        window.location.replace("index.html");

        return;

    }

    // Afficher le tableau de bord.
    contenu.hidden = false;

    console.log("Accès administration autorisé.");

}

function initialiserApercuImage() {

    const champImage = document.getElementById("article-image");
    const conteneur = document.getElementById("image-preview-container");
    const apercu = document.getElementById("image-preview");

    if (!champImage || !conteneur || !apercu) return;

    let imagePrecedente = null;

    champImage.addEventListener("change", function () {

        const fichier = champImage.files[0];

        if (imagePrecedente) {
            URL.revokeObjectURL(imagePrecedente);
            imagePrecedente = null;
        }

        if (!fichier) {
            conteneur.style.display = "none";
            apercu.src = "";
            return;
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(fichier.type)) {
            alert("Format non autorisé. Utilisez JPG, PNG ou WEBP.");
            champImage.value = "";
            conteneur.style.display = "none";
            return;
        }

        if (fichier.size > 5 * 1024 * 1024) {
            alert("L'image ne doit pas dépasser 5 Mo.");
            champImage.value = "";
            conteneur.style.display = "none";
            return;
        }

        imagePrecedente = URL.createObjectURL(fichier);

        apercu.src = imagePrecedente;
        conteneur.style.display = "block";

    });

}

async function chargerArticlesAdministration() {

    const tableau = document.getElementById("articles-table-body");

    if (!tableau) return;

    tableau.innerHTML = `
        <tr>
            <td colspan="5">Chargement des articles...</td>
        </tr>
    `;

    try {

        const { data: articles, error } = await supabaseClient
            .from("articles")
            .select("id, title, status, published_at, created_at, category_id")
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!articles || articles.length === 0) {
            tableau.innerHTML = `
                <tr>
                    <td colspan="4">Aucun article pour le moment.</td>
                </tr>
            `;
            return;
        }

        const { data: categories, error: categoriesError } =
            await supabaseClient
                .from("categories")
                .select("id, name");

        if (categoriesError) throw categoriesError;

        tableau.innerHTML = "";

        articles.forEach(function(article) {

            const categorie = categories.find(function(element) {
                return element.id === article.category_id;
            });

            const ligne = document.createElement("tr");

            const celluleTitre = document.createElement("td");
            celluleTitre.textContent = article.title;

            const celluleCategorie = document.createElement("td");
            celluleCategorie.textContent = categorie
                ? categorie.name
                : "Non classé";

            const celluleStatut = document.createElement("td");
            celluleStatut.textContent = article.status;

            const celluleDate = document.createElement("td");
            celluleDate.textContent = new Date(
                article.published_at || article.created_at
            ).toLocaleDateString("fr-FR");
            // Colonne des actions
const celluleActions = document.createElement("td");

// Bouton Modifier
const boutonModifier = document.createElement("button");
boutonModifier.textContent = "Modifier";
boutonModifier.className = "btn-modifier";

boutonModifier.addEventListener("click", function() {
    modifierArticle(article.id);
});

// Bouton Supprimer
const boutonSupprimer = document.createElement("button");
boutonSupprimer.textContent = "Supprimer";
boutonSupprimer.className = "btn-supprimer";

boutonSupprimer.addEventListener("click", function() {
    supprimerArticle(article.id);
});

celluleActions.append(boutonModifier, boutonSupprimer);

           ligne.append(
    celluleTitre,
    celluleCategorie,
    celluleStatut,
    celluleDate,
    celluleActions
);
            tableau.appendChild(ligne);

        });

    } catch (erreur) {

        console.error("Erreur de chargement des articles :", erreur);

        tableau.innerHTML = `
            <tr>
                <td colspan="4">Erreur lors du chargement des articles.</td>
            </tr>
        `;

    }
}
async function supprimerArticle(id) {
    const confirmation = confirm(
        "Voulez-vous vraiment supprimer cet article ? Cette action est irréversible."
    );

    if (!confirmation) return;

    try {
        const { error } = await supabaseClient
            .from("articles")
            .delete()
            .eq("id", id);

        if (error) throw error;

        alert("Article supprimé avec succès !");

        // Actualiser le tableau
        await chargerArticlesAdministration();

    } catch (erreur) {
        console.error("Erreur de suppression :", erreur);
        alert("Impossible de supprimer cet article.");
    }
}

async function modifierArticle(id) {
    try {
        const { data: article, error } = await supabaseClient
            .from("articles")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;

        // Récupérer la catégorie de l'article.
        const { data: categorie, error: categorieError } =
            await supabaseClient
                .from("categories")
                .select("slug")
                .eq("id", article.category_id)
                .single();

        if (categorieError) throw categorieError;

        // Remplir le formulaire.
        document.getElementById("article-title").value = article.title;
        document.getElementById("article-category").value = categorie.slug;
        document.getElementById("article-summary").value = article.summary || "";
        document.getElementById("article-content").value = article.content || "";

        const champSource = document.getElementById("article-source");
        if (champSource) {
            champSource.value = article.source_url || "";
        }

        // Mémoriser l'article et son image actuelle.
        articleEnCoursDeModification = article.id;
        imageArticleActuelle = article.image_url || null;

        // Afficher l'image actuelle dans l'aperçu.
        const conteneurApercu =
            document.getElementById("image-preview-container");
        const apercu = document.getElementById("image-preview");

        if (article.image_url && conteneurApercu && apercu) {
            apercu.src = article.image_url;
            conteneurApercu.style.display = "block";
        }

        // Changer le texte du bouton.
        const formulaire = document.getElementById("article-form");
        const bouton = formulaire.querySelector('button[type="submit"]');

        bouton.textContent = "Enregistrer les modifications";

        // Descendre jusqu'au formulaire.
        formulaire.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (erreur) {
        console.error("Erreur de chargement de l'article :", erreur);
        alert("Impossible de charger cet article : " + erreur.message);
    }
}
