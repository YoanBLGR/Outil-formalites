# Formalyse - Application de Gestion de Dossiers Juridiques

Application moderne de gestion de dossiers pour le service "Pack Rédaction d'actes" de la CCI.

## 🚀 Fonctionnalités

### ✅ Implémentées

#### 1. **Dashboard**
- Vue d'ensemble avec statistiques
- Dossiers récents
- Compteurs : Total, Nouveaux, En cours, Clôturés

#### 2. **Création de Dossier (Wizard)**
- **Étape 1** : Informations client (civilité, nom, prénom, email, téléphone)
- **Étape 2** : Informations société (forme juridique, dénomination, siège, capital, objet social)
- **Étape 3** : Récapitulatif avant validation
- Génération automatique du numéro de dossier : `DOS-YYYY-NNN-DenominationSociale`

#### 3. **Liste des Dossiers**
- **Vue Kanban** : Colonnes par statut avec drag-to-change
- **Vue Liste** : Vue tabulaire détaillée
- Filtres et recherche (interface prête)
- 10 statuts de workflow :
  - Nouveau
  - Devis envoyé
  - Projet de statuts
  - Attente dépôt capital
  - Dépôt validé
  - Préparation RDV
  - Statuts signés
  - Formalité saisie
  - En suivi
  - Clôturé

#### 4. **Détail du Dossier**
- **Onglet Informations** :
  - Consultation/Modification des données client et société
  - Édition en ligne
- **Onglet Checklist** :
  - Checklist intelligente adaptée à la forme juridique
  - 16-17 tâches selon EURL/SARL/SASU/SAS
  - Suivi de progression avec pourcentage
  - Tâche spécifique SAS/SASU : "Liste des souscripteurs"
- **Onglet Documents** :
  - Interface prête pour upload
  - Liste des documents avec types prédéfinis
- **Onglet Historique** :
  - Timeline des événements
  - Horodatage complet

#### 5. **Checklists Intelligentes**
Types de documents gérés :
- CNI
- Déclaration de non condamnation
- Justificatif d'occupation du siège
- Autorisation de domiciliation
- Statuts
- Liste des souscripteurs (SAS/SASU uniquement)
- Attestation de dépôt des fonds
- Attestation de parution de l'annonce légale
- Mandat
- Projet de statuts
- Devis

### 🎨 Design & UX

- **Interface moderne** : Design épuré avec shadcn/ui
- **Responsive** : Compatible desktop et tablette
- **Navigation intuitive** : Sidebar avec routes principales
- **Feedback visuel** : Badges de statut colorés, progress bars
- **Thème** : Light mode par défaut (Dark mode préparé)

## 🛠️ Stack Technique

- **Framework** : React 18 + TypeScript
- **Build** : Vite
- **Routing** : React Router v6
- **UI** : shadcn/ui + Tailwind CSS v3
- **Base de données** : RxDB + IndexedDB (stockage local)
- **État** : React Context + RxDB (réactif)
- **Dates** : date-fns
- **Icônes** : Lucide React

## 📦 Installation

```bash
cd formalyse-app
npm install
```

## 🚀 Lancement

### Mode Développement
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`

### Build Production
```bash
npm run build
npm run preview
```

## 📁 Structure du Projet

```
src/
├── components/
│   ├── ui/              # Composants UI de base (Button, Card, Input, etc.)
│   ├── layout/          # Layout (Sidebar, Header)
│   ├── workflow/        # Composants workflow (StatusBadge)
│   └── ...
├── pages/
│   ├── Dashboard.tsx    # Page d'accueil
│   ├── DossierCreate.tsx # Wizard création
│   ├── DossierList.tsx   # Liste/Kanban
│   └── DossierDetail.tsx # Détail avec tabs
├── db/
│   ├── database.ts      # Configuration RxDB
│   └── schema.ts        # Schémas de données
├── types/
│   └── index.ts         # Types TypeScript
├── utils/
│   └── checklist-templates.ts # Templates checklists
└── lib/
    └── utils.ts         # Utilitaires
```

## 🗄️ Stockage des Données

- **Stockage local** : IndexedDB via RxDB
- **Persistance** : Toutes les données restent dans le navigateur
- **Réactivité** : Mise à jour automatique de l'UI lors de changements
- **Pas de backend requis** : Application 100% locale

## 📋 Workflow des Statuts

1. **NOUVEAU** → Premier contact client
2. **DEVIS_ENVOYE** → Devis envoyé au client
3. **PROJET_STATUTS** → Rédaction du projet de statuts
4. **ATTENTE_DEPOT** → Client dépose le capital à la banque
5. **DEPOT_VALIDE** → Attestation de dépôt reçue
6. **PREP_RDV** → Préparation du rendez-vous de signature
7. **RDV_SIGNE** → Statuts signés par le client
8. **FORMALITE_SAISIE** → Formalité saisie sur le Guichet Unique
9. **SUIVI** → Suivi du dossier au greffe
10. **CLOTURE** → Dossier terminé

## 🔜 Améliorations Futures Possibles

### Priorité Moyenne
- Upload de documents fonctionnel avec prévisualisation PDF
- Recherche et filtres avancés
- Export de données (PDF, Excel)
- Templates de documents (statuts, annonce légale)
- Notifications/rappels pour échéances

### Priorité Basse
- Dark mode complet
- Multi-utilisateurs avec authentification
- Synchronisation cloud optionnelle
- Statistiques avancées
- Import/Export de dossiers

## 💡 Utilisation

### Créer un Nouveau Dossier
1. Cliquer sur "Nouveau dossier" dans la sidebar
2. Remplir les informations client (étape 1)
3. Remplir les informations société (étape 2)
4. Vérifier le récapitulatif (étape 3)
5. Créer le dossier

### Gérer un Dossier
1. Accéder au dossier depuis le Dashboard ou la liste
2. Utiliser les onglets pour naviguer :
   - **Informations** : Modifier les données
   - **Checklist** : Cocher les tâches accomplies
   - **Documents** : Uploader/consulter les documents
   - **Historique** : Voir la timeline

### Vue Kanban
- Visualiser tous les dossiers par statut
- Changer le statut directement depuis la carte
- Vue d'ensemble rapide

## 🐛 Debugging

Si l'application ne démarre pas :
1. Vérifier Node.js >= 18
2. Supprimer `node_modules` et `package-lock.json`
3. Réinstaller : `npm install`
4. Relancer : `npm run dev`

## 📝 Notes Importantes

- **Stockage local uniquement** : Les données sont stockées dans le navigateur. Si vous changez de navigateur ou effacez les données, vous perdrez les dossiers.
- **Mono-utilisateur** : L'application est conçue pour un seul utilisateur.
- **Formes juridiques** : Actuellement EURL, SARL, SASU, SAS. D'autres peuvent être ajoutées facilement.

## 🎯 Prochaines Étapes Recommandées

1. **Tester l'application** : Créer quelques dossiers de test
2. **Valider le workflow** : Vérifier que les statuts correspondent à votre processus
3. **Affiner les checklists** : Ajuster les items selon vos besoins réels
4. **Planifier l'upload de documents** : Définir le format et l'organisation
5. **Personnalisation** : Logo CCI, couleurs de marque

---

**Développé avec la méthodologie EPCT (Explore, Plan, Code, Test)**

Pour toute question ou modification, référez-vous au code source bien documenté.
