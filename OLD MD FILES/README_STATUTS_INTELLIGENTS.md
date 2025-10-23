# Système de Statuts Intelligents

## Vue d'ensemble

Le système de statuts intelligents permet de gérer automatiquement l'évolution du statut d'un dossier en fonction de la progression de sa checklist. Il offre à la fois une **gestion manuelle** et des **suggestions automatiques** basées sur les tâches complétées.

## Fonctionnalités

### 1. Modification Manuelle du Statut

L'utilisateur peut à tout moment modifier le statut d'un dossier :

- **Bouton "Changer"** à côté du badge de statut
- Ouvre un dialogue interactif avec tous les statuts disponibles
- Affiche pour chaque statut :
  - La progression (% de tâches complétées)
  - Les tâches manquantes si le statut n'est pas encore accessible
  - Une indication visuelle si c'est le statut suggéré

**Validation des transitions :**
- ✅ Retour en arrière toujours autorisé (ex: PROJET_STATUTS → DEVIS_ENVOYE)
- ✅ Avancement autorisé si toutes les conditions sont remplies
- ❌ Avancement bloqué si des tâches requises manquent

### 2. Suggestions Automatiques

Le système analyse en temps réel la checklist et suggère automatiquement le statut approprié :

- **Alerte bleue** affichée quand un nouveau statut est suggéré
- Basée sur les règles de progression définies
- Accessible en un clic depuis l'alerte
- Peut être ignorée par l'utilisateur

### 3. Règles de Progression

Les statuts évoluent automatiquement selon ces règles :

| Statut | Conditions requises |
|--------|-------------------|
| **NOUVEAU** | Aucune (statut initial) |
| **DEVIS_ENVOYE** | • Informations société collectées<br>• Informations gérant/président collectées |
| **PROJET_STATUTS** | • Conditions précédentes<br>• Devis signé reçu |
| **ATTENTE_DEPOT** | • Conditions précédentes<br>• Projet de statuts rédigé<br>• Projet de statuts envoyé au client |
| **DEPOT_VALIDE** | • Conditions précédentes<br>• Attestation de dépôt des fonds reçue |
| **PREP_RDV** | • Conditions précédentes<br>• CNI gérant/président reçue<br>• Déclaration de non condamnation reçue<br>• Justificatif d'occupation du siège reçu |
| **RDV_SIGNE** | • Conditions précédentes<br>• Statuts signés |
| **FORMALITE_SAISIE** | • Conditions précédentes<br>• Annonce légale rédigée<br>• Annonce légale publiée<br>• Attestation de parution reçue<br>• Formulaire M0 complété<br>• Formalité saisie sur le Guichet Unique |
| **SUIVI** | • Conditions précédentes<br>• Dossier transmis au greffe |
| **CLOTURE** | Statut manuel uniquement |

## Architecture Technique

### Fichiers Principaux

```
src/
├── utils/
│   └── status-helpers.ts          # Logique de calcul et validation
├── components/
│   └── workflow/
│       └── StatusSelector.tsx     # Interface de sélection
└── pages/
    └── DossierDetail.tsx          # Intégration dans la page dossier
```

### Fonctions Utilitaires

**`calculateSuggestedStatus(checklist)`**
- Calcule le statut suggéré basé sur les tâches complétées
- Retourne le statut le plus avancé accessible
- Exclut CLOTURE qui est manuel

**`isValidStatusTransition(current, new, checklist)`**
- Valide si une transition de statut est autorisée
- Retourne `{ valid: boolean, reason?: string }`
- Autorise toujours les retours en arrière

**`getMissingTasksForStatus(status, checklist)`**
- Liste les tâches manquantes pour atteindre un statut
- Utilisé pour afficher les bloqueurs dans l'UI

**`getStatusCompletionPercentage(status, checklist)`**
- Calcule le % de complétion pour un statut donné
- Utilisé pour les barres de progression

## Utilisation

### Dans DossierDetail

```tsx
import { StatusSelector } from '../components/workflow/StatusSelector'
import { calculateSuggestedStatus } from '../utils/status-helpers'

// État
const [statusSelectorOpen, setStatusSelectorOpen] = useState(false)
const suggestedStatus = calculateSuggestedStatus(dossier.checklist)

// Handler de changement
const handleStatusChange = async (newStatus: WorkflowStatus) => {
  // Mise à jour du statut dans la base
  // Ajout d'un événement dans la timeline
}

// UI
<StatusSelector
  currentStatus={dossier.statut}
  checklist={dossier.checklist}
  onStatusChange={handleStatusChange}
  open={statusSelectorOpen}
  onOpenChange={setStatusSelectorOpen}
/>
```

## Timeline et Historique

Chaque changement de statut est enregistré dans la timeline du dossier :

```typescript
{
  id: crypto.randomUUID(),
  type: 'STATUS_CHANGE',
  description: 'Statut changé : Nouveau → Devis envoyé',
  createdAt: new Date().toISOString(),
  createdBy: 'Utilisateur',
  metadata: {
    oldStatus: 'NOUVEAU',
    newStatus: 'DEVIS_ENVOYE',
  },
}
```

## Personnalisation

### Ajouter un Nouveau Statut

1. Ajouter le statut dans `src/types/index.ts` :
```typescript
export type WorkflowStatus =
  | 'NOUVEAU'
  | 'MON_NOUVEAU_STATUT'
  | ...
```

2. Ajouter le label dans `WORKFLOW_STATUS_LABELS`

3. Ajouter la règle dans `src/utils/status-helpers.ts` :
```typescript
{
  status: 'MON_NOUVEAU_STATUT',
  requiredItems: ['Tâche A', 'Tâche B'],
  description: 'Description du statut',
}
```

### Modifier les Conditions

Éditer le tableau `STATUS_RULES` dans `src/utils/status-helpers.ts` :

```typescript
{
  status: 'PROJET_STATUTS',
  requiredItems: [
    'Informations société collectées',
    'Informations gérant/président collectées',
    'Devis signé reçu',
    // Ajouter de nouvelles conditions ici
  ],
  description: 'Devis signé, rédaction du projet de statuts',
}
```

## Tests

Tester la logique de statuts :

```bash
npm run test:status
```

Ou créer un test manuel :

```typescript
import { calculateSuggestedStatus } from './src/utils/status-helpers'

const checklist = [
  { id: '1', label: 'Informations société collectées', completed: true, required: true },
  { id: '2', label: 'Informations gérant/président collectées', completed: true, required: true },
]

const suggestedStatus = calculateSuggestedStatus(checklist)
console.log('Statut suggéré:', suggestedStatus) // 'DEVIS_ENVOYE'
```

## Améliorations Futures

- [ ] Notifications par email lors des changements de statut
- [ ] Statistiques sur les temps passés dans chaque statut
- [ ] Prédiction du temps restant jusqu'à la clôture
- [ ] Templates de checklist personnalisables par type de dossier
- [ ] Workflow conditionnels (ex: SAS vs SASU)
- [ ] Alertes si un dossier reste trop longtemps dans un statut

## Support

Pour toute question ou suggestion d'amélioration, contacter l'équipe de développement.
