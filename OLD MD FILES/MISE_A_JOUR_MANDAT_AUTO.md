# 🔄 Mise à jour automatique du Mandat CCI

## Fonctionnement

Le mandat CCI se met à jour **automatiquement** lors de la rédaction des statuts.

### Déclenchement de la mise à jour

La mise à jour automatique se déclenche dans les cas suivants :

1. **Sauvegarde automatique** : Après 3 secondes d'inactivité lors de la rédaction des statuts
2. **Sauvegarde manuelle** : Lorsque vous cliquez sur le bouton "Sauvegarder"

### Conditions pour la mise à jour

Le mandat sera rempli automatiquement **uniquement si** :
- ✅ Les informations du dirigeant sont renseignées dans les statuts
  - Pour une SARL/EURL : Le **gérant** doit être renseigné (nom et prénom)
  - Pour une SAS/SASU : Le **président** doit être renseigné (nom et prénom)

### Informations automatiquement remplies

Quand les conditions sont remplies, le système remplit automatiquement :

| Champ | Source | Exemple |
|-------|--------|---------|
| **Nom et prénom du dirigeant** | Gérant ou Président des statuts | "Jean DUPONT" |
| **Qualité** | Forme juridique | "Gérant" (SARL/EURL) ou "Président" (SAS/SASU) |
| **Dénomination** | Société du dossier | "MA SOCIÉTÉ SARL" |
| **Siège social** | Société du dossier | "123 Rue Example, 75001 Paris" |
| **Lieu de signature** | Extrait du siège | "Paris" |
| **Date de signature** | Date actuelle ou date des statuts | "14/10/2025" |

## Comment vérifier que ça fonctionne

### 1. Pendant la rédaction des statuts

- Remplissez les informations du dirigeant dans la section appropriée :
  - **SARL/EURL** → Section "Gérance" (Article 12)
  - **SAS/SASU** → Section "Présidence" (Article 13)
  
- Attendez 3 secondes ou cliquez sur "Sauvegarder"

- Dans la console du navigateur, vous verrez :
  ```
  ✓ Mandat CCI mis à jour automatiquement
  ```

### 2. Vérification dans le dossier

1. Retournez à la page de détail du dossier
2. Cliquez sur l'onglet "Documents"
3. Regardez la section "Mandat CCI"
4. La date de "Dernière mise à jour" doit être récente
5. Téléchargez le mandat en DOCX ou PDF pour voir le contenu rempli

## Mise à jour manuelle

Si vous souhaitez forcer une mise à jour du mandat :

1. Allez dans l'onglet "Documents" du dossier
2. Section "Mandat CCI"
3. Cliquez sur le bouton "Mettre à jour"

Ce bouton n'apparaît que si des statuts ont déjà été rédigés.

## Dépannage

### Le mandat ne se met pas à jour

**Vérifiez que :**

1. ✅ Le dirigeant est bien renseigné dans les statuts (nom ET prénom)
2. ✅ Vous avez attendu 3 secondes ou cliqué sur "Sauvegarder"
3. ✅ Vous êtes bien dans l'étape de rédaction qui contient les informations du dirigeant

**Pour SARL/EURL :**
- Section "Gérance" → Remplir "Nom du gérant" et "Prénom du gérant"

**Pour SAS/SASU :**
- Section "Présidence" → Remplir "Nom du président" et "Prénom du président"

### Le mandat est vide ou incomplet

Si le mandat reste avec des placeholders comme `[NOM ET PRÉNOM DU DIRIGEANT]` :
- Cela signifie que les informations du dirigeant ne sont pas encore renseignées
- Complétez la section correspondante dans les statuts
- Le mandat se mettra à jour automatiquement

## Workflow complet

```
1. Création du dossier
   └─> Template mandat vide créé automatiquement
       Contient : placeholders [NOM...], Gérant/Président par défaut

2. Rédaction des statuts
   └─> Remplir les informations du dirigeant
       └─> Sauvegarde automatique (3s) ou manuelle
           └─> Mandat mis à jour automatiquement ✓
               Contient : Nom réel, prénom, qualité, etc.

3. Consultation du dossier
   └─> Télécharger le mandat (DOCX ou PDF)
       └─> Document complet et prêt à signer
```

## Notes techniques

- Le mandat est stocké en **base64** dans la base de données
- La mise à jour ne se fait **que si les informations du dirigeant sont complètes**
- La sauvegarde automatique a un délai de **3 secondes** d'inactivité
- Le système détecte automatiquement la forme juridique pour définir "Gérant" ou "Président"

---

**Dernière mise à jour** : Octobre 2025  
**Statut** : ✅ Fonctionnel et testé

