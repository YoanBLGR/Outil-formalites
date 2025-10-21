# 🔍 AUDIT COMPLET DU TEMPLATE SARL - Article par Article

## Méthodologie

Cet audit vérifie **scrupuleusement** chaque article du template SARL (statuts-sarl-conforme-v1.json) :
- ✅ Les variables utilisées sont-elles collectées dans le formulaire ?
- ✅ Tous les variants sont-ils gérables via le formulaire ?
- ⚠️ Manques ou incohérences identifiés

---

## PRÉAMBULE

### Structure
```json
"preambule": {
  "variants": [
    {
      "condition": "true",
      "texte": "Les soussignés :\n\n{{listeAssocies}}..."
    }
  ]
}
```

### Variables requises
- `listeAssocies` : Liste formatée des associés

### ✅ Vérification Formulaire
- **Statut** : ✅ CONFORME
- **Source** : `template-engine.ts:587` - Généré automatiquement à partir de `statutsData.associes`
- **Note** : Le formulaire collecte les associés dans la section 0 (Préambule)

---

## ARTICLE 1 - Forme

### Structure
```json
{
  "numero": 1,
  "titre": "Forme",
  "contenu": "La Société est une société à responsabilité limitée...",
  "variables": [],
  "obligatoire": true
}
```

### Variables requises
- **AUCUNE** - Contenu fixe

### ✅ Vérification Formulaire
- **Statut** : ✅ CONFORME
- **Note** : Article fixe, pas de collecte nécessaire

---

## ARTICLE 2 - Objet

### Structure
```json
{
  "numero": 2,
  "titre": "Objet",
  "variants": [
    {
      "condition": "!raisonEtre",
      "contenu": "La Société a pour objet... {{objetSocial}}...",
      "variables": ["objetSocial"]
    },
    {
      "condition": "raisonEtre",
      "contenu": "...{{objetSocial}}...La Société a pour raison d'être {{raisonEtre}}.",
      "variables": ["objetSocial", "raisonEtre"]
    }
  ]
}
```

### Variables requises
- `objetSocial` (obligatoire)
- `raisonEtre` (optionnel - pour société à mission)

### ✅ Vérification Formulaire
- **Statut** : ✅ CONFORME
- **Collecte** : Section 1 (Identité de la société)
  - `objetSocial` : Champ texte obligatoire
  - `raisonEtre` : Champ texte optionnel
- **Source** : `RedactionStatuts.tsx` Section 1

---

## ARTICLE 3 - Dénomination sociale

### Structure
```json
{
  "variants": [
    {
      "condition": "!sigle",
      "contenu": "La Société a pour dénomination sociale {{denomination}}...",
      "variables": ["denomination"]
    },
    {
      "condition": "sigle",
      "contenu": "...{{denomination}}...{{sigle}}...",
      "variables": ["denomination", "sigle"]
    }
  ]
}
```

### Variables requises
- `denomination` (obligatoire)
- `sigle` (optionnel)

### ✅ Vérification Formulaire
- **Statut** : ✅ CONFORME
- **Collecte** : Section 1
  - `denomination` : Provient du dossier
  - `sigle` : Champ texte optionnel
- **Source** : Données du dossier + formulaire

---

## ARTICLE 4 - Siège social

### Structure
```json
{
  "contenu": "Le siège social de la Société est fixé {{siegeSocial}}...",
  "variables": ["siegeSocial"]
}
```

### Variables requises
- `siegeSocial` (obligatoire)

### ✅ Vérification Formulaire
- **Statut** : ✅ CONFORME
- **Collecte** : Provient du dossier (`dossierData.societe.siegeSocial`)

---


