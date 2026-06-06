# Landing Ptidej — Guide de déploiement Vercel

## Architecture finale
- `ptidej.fr` → cette landing Astro (nouveau repo GitHub)
- `ptidej.fr/app` → ton app React actuelle (repo existant, inchangé)

---

## Étape 1 — Créer le repo GitHub

1. Va sur github.com → New repository
2. Nom : `ptidej-landing`
3. Public, sans README
4. Clone en local et copie tous les fichiers livrés dedans
5. `git add . && git commit -m "init landing" && git push`

---

## Étape 2 — Déployer sur Vercel

1. Va sur vercel.com → New Project
2. Importe `ptidej-landing` depuis GitHub
3. Vercel détecte Astro automatiquement — ne change rien
4. **Variables d'environnement** (CRITIQUE — sans ça le formulaire ne marche pas) :

| Variable | Valeur |
|---|---|
| `BREVO_API_KEY` | `xkeysib-c518f8...` (ta clé Brevo) |
| `BREVO_LIST_ID` | L'ID de ta liste Brevo (voir ci-dessous) |

**Trouver ton BREVO_LIST_ID :**
- Brevo → Contacts → Listes → clique sur "Ptidej - Waitlist"
- L'ID est dans l'URL : `app.brevo.com/contact/list/edit/id/**123**`
- C'est ce nombre

5. Deploy → attends 2 minutes

---

## Étape 3 — Brancher le domaine ptidej.fr sur la landing

⚠️ Aujourd'hui `ptidej.fr` pointe sur ton app React. On va inverser :

### Dans Vercel (projet landing) :
1. Settings → Domains → Add `ptidej.fr` et `www.ptidej.fr`
2. Vercel te donne des enregistrements DNS à copier

### Dans ton gestionnaire de domaine (OVH, Gandi, etc.) :
- Mets à jour les enregistrements DNS avec ceux que Vercel indique
- Propagation : 5 à 30 minutes

### Déplacer l'app React sur `/app` :
Dans le projet Vercel de ton app React :
1. Settings → Domains → Change le domaine en `ptidej.fr/app`
   — OU —
   Ajoute `app.ptidej.fr` comme sous-domaine séparé (plus propre)

**Mon conseil : utilise `app.ptidej.fr`** pour l'app React, et garde `ptidej.fr` pour la landing. C'est plus propre et plus facile à gérer.

---

## Étape 4 — Créer la liste Brevo

1. Brevo → Contacts → Listes → Créer une liste
2. Nom : `Ptidej - Waitlist`
3. Note l'ID (dans l'URL après création)
4. Mets cet ID dans la variable `BREVO_LIST_ID` sur Vercel

---

## Vérifications après déploiement

- [ ] `ptidej.fr` affiche la landing
- [ ] Le formulaire email fonctionne (teste avec ton propre email)
- [ ] L'email apparaît dans Brevo → Contacts → Ptidej Waitlist
- [ ] `ptidej.fr/app` (ou `app.ptidej.fr`) affiche l'app React
- [ ] Google Search Console → soumettre `ptidej.fr`

---

## Notes importantes

- **Ne commit jamais ta clé Brevo** dans le code — elle est dans les variables Vercel uniquement
- La landing est en mode **SSR partiel** (l'API `/api/waitlist` est serveur, le reste est statique)
- Pour changer le contenu de la landing : modifie `src/pages/index.astro` et push → Vercel redéploie automatiquement
