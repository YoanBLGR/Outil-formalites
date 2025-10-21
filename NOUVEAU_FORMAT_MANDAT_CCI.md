# 📄 Nouveau format du Mandat CCI Oise

## Mise à jour effectuée

Le mandat CCI a été **complètement mis à jour** pour utiliser le formulaire officiel de la **CCI Oise** pour le Guichet Unique de l'INPI.

## Nouveau contenu du mandat

### En-tête
```
MANDAT
Pour la réalisation des formalités administratives d'entreprise auprès du Guichet Unique
```

### Sections principales

1. **Identification du mandant**
   - Nom et prénom du dirigeant
   - Domiciliation (adresse du dirigeant)
   - Qualité (Président ou Gérant)
   - Société (dénomination, siège, RCS)

2. **Mandataire**
   ```
   CCI Oise
   Pôle Démarches Entreprises
   N° Siret 130 022 718 00519
   18 rue d'ALLONNE
   60000 BEAUVAIS
   
   Représentée par Yoan BOULANGER
   ```

3. **Objet du mandat**
   - ☒ Création de l'entreprise (case cochée par défaut)
   - ☐ Modification de la situation
   - ☐ Cessation des activités

4. **Durée du mandat**
   - Prend effet à la signature
   - S'achève après accomplissement des missions

5. **Mentions RGPD**
   - Information sur la collecte des données
   - Droits sur les données personnelles
   - Politique de confidentialité

## Champs remplis automatiquement

| Champ | Source | Exemple |
|-------|--------|---------|
| **Nom et prénom** | Associé unique ou Dirigeant | "Jean DUPONT" |
| **Domiciliée à** | Adresse de l'associé unique ou dirigeant | "123 rue Example, 75001 Paris" |
| **Qualité** | Forme juridique | "Président" (SAS/SASU) ou "Gérant" (SARL/EURL) |
| **Dénomination** | Société du dossier | "JD CONSULTING" |
| **Siège social** | Société du dossier | "1 rue de la Paix, 75001 Paris" |
| **RCS de** | Ville extraite du siège | "Paris" |
| **Fait à** | Ville du siège | "Paris" |
| **Le** | Date actuelle | "14/10/2025" |

## Formats disponibles

### DOCX
- ✅ Compatible Word Windows
- ✅ Éditable
- ✅ Formatage professionnel
- ✅ Cases à cocher (☒ et ☐)
- ✅ Section RGPD en taille réduite (9pt)

### PDF
- ✅ Texte natif (pas de screenshot)
- ✅ Sélectionnable et copiable
- ✅ Cases à cocher Unicode
- ✅ Formatage identique au DOCX

## Test du nouveau format

### Étape 1 : Mise à jour du mandat existant

Pour un dossier existant :
1. Allez dans le dossier
2. Onglet "Documents"
3. Section "Mandat CCI"
4. Cliquez sur "Mettre à jour" (si visible)

### Étape 2 : Nouveau dossier

Pour tester complètement :
1. Créez un nouveau dossier
2. Remplissez les statuts avec les informations du dirigeant
3. **Important** : Remplissez aussi l'adresse dans la section "Associé unique"
4. Sauvegardez
5. Retournez au dossier → Documents
6. Téléchargez le mandat

### Étape 3 : Vérification

Le mandat téléchargé doit contenir :
- ✅ Vos nom et prénom (pas de placeholder)
- ✅ Votre adresse complète
- ✅ La qualité correcte (Président/Gérant)
- ✅ Les informations de la société
- ✅ "CCI Oise" et coordonnées complètes
- ✅ Cases à cocher visibles
- ✅ Section RGPD complète

## Différences avec l'ancien format

| Élément | Ancien | Nouveau |
|---------|--------|---------|
| **Titre** | "MANDAT (Personne morale)" | "MANDAT Pour la réalisation..." |
| **Mandataire** | "CCI" (générique) | "CCI Oise" (spécifique) avec adresse complète |
| **Représentant** | Non mentionné | "Yoan BOULANGER" |
| **Objet** | Liste simple | Cases à cocher ☒ ☐ |
| **RGPD** | Absent | Section complète avec mentions légales |
| **Adresse dirigeant** | Non demandée | Champ "Domiciliée à" |

## Notes importantes

### 1. Adresse du dirigeant

L'adresse doit être renseignée dans la section **"Associé unique"** des statuts. Si le dirigeant n'est pas l'associé unique, l'adresse peut être dans les données du président/gérant.

### 2. Cases à cocher

- ☒ = Case cochée (création d'entreprise - par défaut)
- ☐ = Case vide (modification, cessation)

Les cases utilisent des caractères Unicode qui s'affichent correctement en DOCX et PDF.

### 3. Section RGPD

La section RGPD est en taille réduite (9pt) pour être lisible mais discrète. Elle contient toutes les mentions légales obligatoires de la CCI Hauts de France.

## Compatibilité

- ✅ Word Windows (2013+)
- ✅ Word Mac
- ✅ LibreOffice
- ✅ Google Docs
- ✅ Lecteurs PDF (tous)

## Résolution de problèmes

### Le placeholder [ADRESSE DU DIRIGEANT] persiste

**Solution** : Remplissez l'adresse dans la section "Associé unique" (Section 0) des statuts.

### Le nom apparaît comme [NOM ET PRÉNOM DU DIRIGEANT]

**Solution** :
1. Vérifiez que le dirigeant est bien renseigné dans les statuts
2. Si c'est une SAS/SASU : Section "Présidence"
3. Si c'est une SARL/EURL : Section "Gérance"
4. Cochez "Le président/gérant est l'associé unique" si applicable

### Les cases à cocher n'apparaissent pas

**Solution** : Les caractères ☒ et ☐ nécessitent une police Unicode. Si problème :
- En DOCX : Changez la police en Arial ou Segoe UI
- En PDF : Le problème ne devrait pas se produire

---

**Statut** : ✅ Implémenté et testé  
**Date** : Octobre 2025  
**Format officiel** : CCI Oise - Guichet Unique INPI

