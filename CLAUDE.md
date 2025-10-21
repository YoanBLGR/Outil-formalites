# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Formalyse is a French legal document automation application for creating and managing company incorporation files (dossiers de constitution). It specializes in generating legal statutes (statuts) for French companies (EURL, SARL, SASU, SAS) with AI-powered assistance.

**Tech Stack:** React 19 + TypeScript + Vite, RxDB (offline-first database with Dexie storage), TailwindCSS, OpenAI GPT integration, Tesseract.js/Google Cloud Vision OCR

## Development Commands

```bash
# Development
npm run dev              # Start dev server (Vite)

# Build & Type Checking
npm run build           # TypeScript compile + Vite build
tsc -b                  # Type check only (no build)

# Code Quality
npm run lint            # Run ESLint
npm run preview         # Preview production build
```

## Architecture

### Database Layer (RxDB + Dexie)

The app uses **RxDB** (reactive database built on RxJS) with **Dexie** (IndexedDB wrapper) for offline-first local storage. All data is stored in the browser.

- **Schema:** `src/db/schema.ts` - Defines the `Dossier` collection schema with versioning (currently v2)
- **Database:** `src/db/database.ts` - Singleton pattern with `getDatabase()` - always use this function
- **Migrations:** Schema migrations are defined in `database.ts` (migrationStrategies). When updating the schema, increment the version number and add a migration strategy
- **Query Pattern:** RxDB uses RxJS observables. Use `.find()` with selectors and `.exec()` or subscribe to observables

### Template Engine System

The core of document generation is a custom template engine that processes JSON templates with conditional logic:

- **Templates:** `src/templates/*.json` - Structured JSON templates for each legal form
  - `statuts-eurl-conforme-v3.json` (current EURL template)
  - `statuts-sasu-conforme-v1.json` (current SASU template)

- **Engine:** `src/utils/template-engine.ts`
  - `getTemplate(formeJuridique)` - Loads the appropriate template
  - `buildVariables(dossier, statutsData)` - Constructs variable context from form data
  - `generateStatuts(dossier, statutsData)` - Main generation function that processes templates
  - `replaceVariables(texte, variables)` - Handles `{{variableName}}` substitution
  - `processConditionals(texte, variables)` - Handles `{{#if variable}}...{{else}}...{{/if}}` blocks

- **Template Structure:**
  ```json
  {
    "formeJuridique": "EURL",
    "preambule": { "variants": [...] },
    "articles": [
      {
        "numero": 1,
        "titre": "Article Title",
        "variants": [
          { "condition": "typeApport === 'NUMERAIRE_TOTAL'", "contenu": "..." }
        ]
      }
    ],
    "conclusion": { "texte": "..." }
  }
  ```

- **Text Helpers:** `src/utils/text-helpers.ts`
  - `nombreEnLettres(nombre)` - Converts numbers to French words (e.g., "100" → "cent")
  - `montantAvecLettres(montant)` - Formats currency with words
  - `accorderGenre(texte, civilite)` - Gender agreement for French text (M/Mme)
  - `formaterDateFrancais(date)` - French date formatting

### Export System

Documents are exported to DOCX and PDF with professional formatting:

- **Export Utils:** `src/utils/export-utils.ts`
  - `exportToDocx(content, filename)` - Uses `docx` library with proper Word formatting
  - `exportToPdf(content, filename)` - Uses `jspdf` with custom pagination and styling
  - Articles are auto-numbered, headers/footers added, spacing optimized for legal documents

- **Document Generators:**
  - `src/utils/mandat-cci-generator.ts` - Generates Chamber of Commerce mandate forms
  - `src/utils/avis-constitution-generator.ts` - Generates legal notice (avis de constitution)

### Guichet Unique Integration (Optional)

Automatic formality creation on the INPI Guichet Unique portal:

- **Services:**
  - `src/services/guichet-unique-api.ts`
    - `createDraftFormality(formalityData)` - Creates a formality on the GU portal via `POST /formalities`
    - `isGuichetUniqueConfigured()` - Checks if GU credentials are configured
    - `testConnection()` - Tests authentication with the GU API
    - Handles authentication (token JSON or HttpOnly cookie), API requests, and error handling
  - `src/services/gu-data-dictionary.ts` - **NEW**
    - `fetchCategoryActivities()` - Fetches activity categories from GU API (with cache)
    - `getDefaultCategorizationCodes()` - Returns default categorization codes for activities
    - `findCategoryByKeyword(keyword)` - Finds category by keyword (for smart mapping)
    - Used to dynamically retrieve valid `categorisationActivite1/2` codes

- **Mapper:** `src/utils/gu-mapper.ts`
  - `mapDossierToGUFormality(dossier, statutsData)` - **ASYNC** - Converts Formalyse data → GU format (fetches activity categories)
  - `mapEtablissement(dossier, statutsData, role)` - **ASYNC** - Maps establishment with dynamic activity categorization
  - `validateDossierForGU(dossier, statutsData)` - Validates required data before submission
  - Maps French legal forms to GU codes (EURL: 5498, SARL: 5499, SASU: 5710, SAS: 5770)
  - Generates correct establishment structure with `rolePourEntreprise` codes

- **Types:** `src/types/guichet-unique.ts`
  - Complete TypeScript definitions for GU API based on official documentation (`formalities.json`)
  - **Structure:** Envelope with metadata + `content` field containing enterprise details
  - **Key types:**
    - `GUFormaliteCreation` - Request envelope (companyName, typeFormalite, typePersonne, content)
    - `GUFormaliteContent` - Content structure (natureCreation, personneMorale, piecesJointes)
    - `GUIdentitePersonneMorale` - Nested structure with `entreprise` + `description` (NOT flat)
    - `GUBlocEntrepriseIdentite` - Basic enterprise info (denomination, formeJuridique, objet)
    - `GUBlocDetailPersonneMorale` - Detailed info (duree, capital, dateClotureExerciceSocial)
    - `GUEtablissement` - Establishment with `rolePourEntreprise`: 1 (siege), 2 (siege+etablissement), 3 (etablissement)

- **Hook:** `src/hooks/useGuichetUnique.ts`
  - `createFormality(dossier, statutsData, options)` - React hook for creating formalities
  - Manages loading state, error handling, progress tracking
  - Updates the dossier in RxDB with GU data after successful creation

- **Component:** `src/components/guichet-unique/GuichetUniqueButton.tsx`
  - Button displayed in RedactionStatuts page (when progression >= 70%)
  - Modal with confirmation, progress tracking, and result display
  - Links to the formality on the GU portal

- **Configuration:** Requires environment variables (see `.env.example`):
  ```bash
  # Démo
  VITE_GU_API_URL=https://guichet-unique-demo.inpi.fr
  VITE_GU_USERNAME=your_email@example.com
  VITE_GU_PASSWORD=your_password

  # Production
  VITE_GU_API_URL=https://guichet-unique.inpi.fr
  ```

- **Authentication:** Uses `/api/user/login/sso` endpoint with email/password
  - Supports two modes: Token JSON (for API-only accounts) OR HttpOnly cookie (standard accounts)
  - HttpOnly cookies are automatically sent by the browser (not accessible via JavaScript)
  - Proxy Vite configured for CORS in development (`/gu-api` → `https://guichet-unique-demo.inpi.fr/api`)
  - Requires accepting CPU (Conditions Particulières d'Utilisation) on the web portal
  - Demo and production require separate accounts

- **API Structure (Official Documentation):**
  ```typescript
  POST /formalities
  {
    "companyName": "string",             // Company name
    "referenceMandataire": "string",     // Mandataire reference (free field)
    "nomDossier": "string",              // File name
    "typeFormalite": "C",                // C (Creation), M (Modification), R (Radiation)
    "observationSignature": "string",    // Signature notes (optional)
    "diffusionINSEE": "O",               // O (Yes) or N (No)
    "indicateruEntreeSortieRegistre": true,  // Entry/exit from register
    "typePersonne": "P",                 // P (Personne Morale)
    "numNat": "string",                  // SIREN if existing
    "content": {                         // Enterprise details
      "identite": {...},
      "adresse": {...},
      "optionsFiscales": {...},
      "etablissementPrincipal": {...},   // If activity
      "autresEtablissements": [...],     // Including siege if differentiated
      "dirigeants": [...],
      "piecesJointes": [...]             // PDF files in base64 (< 10MB)
    }
  }
  ```

- **Workflow Integration:**
  - Button appears in RedactionStatuts header when progression >= 70%
  - Disabled until progression = 100% (all required fields filled)
  - On success: Updates dossier status to `FORMALITE_SAISIE` and stores formality ID/URL
  - Timeline entry added to track the GU submission

- **⚠️ Important Notes:**
  - The GU integration is optional and requires mandataire credentials from INPI
  - All types and structures are based on official INPI documentation (`formalities.json` OpenAPI spec)
  - Test in sandbox environment (guichet-unique-demo.inpi.fr) before production use
  - Attachments must be PDF format, base64 encoded, and < 10MB
  - **CRITICAL:** `typePersonne: 'M'` for Personne Morale (NOT 'P'!)
  - **CRITICAL:** `identite` structure MUST be nested (`entreprise` + `description`), not flat
  - Never send `isEnableBypassModificationRepresentant` or `isEnableBypassModificationBE` (server-side only)
  - For creation: don't send `siren` (assigned by INSEE after creation)
  - `dateClotureExerciceSocial` format is JJMM (e.g., "3112" for Dec 31), not MM-DD
  - Capital must be in `montantCapital` (euros as number), not `montantCapitalCentime`
  - **CRITICAL:** `adresseEntreprise` and `etablissementPrincipal.adresse` use `BlocAdresse` format (codePays, commune, typeVoie, voie)
  - **CRITICAL:** `activites[]` must include `categorisationActivite1` and `categorisationActivite2` (2-digit codes)

### AI Integration (Optional Features)

AI features require `VITE_OPENAI_API_KEY` in `.env`:

- **Services:**
  - `src/services/ai-suggestions.ts` - Context-aware suggestions for statute clauses
  - `src/services/ai-chat.ts` - Interactive chat assistant for legal questions
  - `src/services/ai-validation.ts` - Validates statute data for completeness

- **AI is optional:** The app functions fully without OpenAI API keys. Check `import.meta.env.VITE_AI_ENABLED` before using AI features.

### OCR System (CNI Extraction)

Dual OCR engine for extracting data from French national ID cards:

- **Primary Service:** `src/services/ocr-cni.ts`
  - `extractCNIData(imageFile, onProgress, engine)` - Main OCR function
  - Auto-selects best engine: Google Cloud Vision (if configured) → Tesseract.js (local fallback)

- **Engines:**
  - **Tesseract.js** - Local, free, 75-85% accuracy (always available)
  - **Google Cloud Vision** - Cloud, paid, 95%+ accuracy (requires `VITE_GOOGLE_CLOUD_VISION_API_KEY`)

- **Parser:** `src/utils/cni-parser.ts` - Parses OCR raw text into structured `CNIData` with confidence scores

### Wizard & Form System

Multi-step wizard for statute creation with validation:

- **Configuration:** `src/config/redaction-steps.tsx`
  - `REDACTION_STEPS` - 5-step wizard definition (Identité → Capital → Gouvernance → Modalités → Finalisation)
  - `SECTION_TO_STEP_MAP` - Maps template sections to wizard steps
  - `isStepComplete(step, data)` - Validates step completion
  - `getStepValidationErrors(step, data)` - Returns validation errors for display

- **Main Page:** `src/pages/RedactionStatuts.tsx` - Wizard orchestrator with live preview

### Workflow System

Company file status tracking (from creation to closure):

- **Status Flow:** `NOUVEAU` → `DEVIS_ENVOYE` → `PROJET_STATUTS` → `ATTENTE_DEPOT` → `DEPOT_VALIDE` → `PREP_RDV` → `RDV_SIGNE` → `FORMALITE_SAISIE` → `SUIVI` → `CLOTURE`
- **Components:**
  - `src/components/workflow/StatusSelector.tsx` - Status change UI
  - `src/components/workflow/StatusBadge.tsx` - Visual status indicator
- **Helpers:** `src/utils/status-helpers.ts` - Status transitions and validation

### Checklist System

Two types of checklists track file progress:

1. **General Checklist** - Tracks workflow steps and tasks
   - Template: `src/utils/checklist-templates.ts`
   - Component: `src/components/checklist/EnhancedChecklist.tsx`

2. **Document GU Checklist** - Tracks required documents for "Guichet Unique" (business formalities center)
   - Template: `src/utils/documents-gu-checklist.ts`
   - Component: `src/components/documents/DocumentsChecklistGU.tsx`

## Important Patterns

### Working with RxDB

```typescript
// Always get database instance first
const db = await getDatabase()

// Query with reactive updates
const dossiers$ = db.dossiers.find().sort({ createdAt: 'desc' }).$

// Update documents
await dossier.update({ $set: { statut: 'NOUVEAU' } })

// Use .exec() for one-time queries
const dossier = await db.dossiers.findOne(id).exec()
```

### Adding New Template Variants

When adding conditional content to templates:

1. Add the variant to the template JSON with a condition
2. Ensure the condition variable is built in `buildVariables()`
3. Test both true/false paths of the condition
4. Use `evaluateCondition()` for complex logic (see `template-engine.ts`)

### Handling French Legal Text

- Always use `accorderGenre()` for gender agreement in generated text
- Use `nombreEnLettres()` for all numeric values that need word representation
- French legal documents require specific formatting: articles numbered, justified text, proper spacing

### Document Blob Storage

Files are stored as Blobs in RxDB. When working with documents:
- Store: `{ fichier: await file.arrayBuffer() }` → convert to Blob for storage
- Retrieve: Create object URL: `URL.createObjectURL(new Blob([document.fichier]))`
- Always revoke object URLs when done: `URL.revokeObjectURL(url)`

## Environment Variables

Required `.env` configuration (see `.env.example`):

```bash
# Optional - AI Features
VITE_OPENAI_API_KEY=sk-...
VITE_AI_ENABLED=true

# Optional - High-precision OCR
VITE_GOOGLE_CLOUD_VISION_API_KEY=...

# Optional - Guichet Unique Integration
# Démo: https://guichet-unique-demo.inpi.fr
# Production: https://guichet-unique.inpi.fr
VITE_GU_API_URL=https://guichet-unique-demo.inpi.fr
VITE_GU_USERNAME=your_email@example.com
VITE_GU_PASSWORD=your_password

# Feature Flags
VITE_FEATURE_OCR=true
VITE_FEATURE_AI_CHAT=true
```

## Key Type Definitions

- **Dossier** (`src/types/index.ts`) - Main file entity with client, company, documents, checklist, timeline, and optional `guichetUnique` data
- **GuichetUniqueData** (`src/types/index.ts`) - Stores GU formality ID, status, URL, and reference
- **StatutsData** (`src/types/statuts.ts`) - Statute form data structure (all wizard inputs)
- **StatutsDraft** - Saved draft state of statute creation
- **FormeJuridique** - Legal form: `'EURL' | 'SARL' | 'SASU' | 'SAS'`
- **WorkflowStatus** - File status enum (10 states from NOUVEAU to CLOTURE)
- **GUFormaliteCreation** (`src/types/guichet-unique.ts`) - Complete formality structure for GU API

## File Naming Conventions

- Components: PascalCase (`DossierDetail.tsx`, `StatusSelector.tsx`)
- Utils: kebab-case (`template-engine.ts`, `export-utils.ts`)
- Types: Use barrel exports from `src/types/index.ts`
- Templates: Versioned JSON (`statuts-eurl-conforme-v3.json`)

## Testing Notes

- No test suite currently configured
- When testing statute generation, always verify:
  1. All variables are replaced (no remaining `{{variable}}` or `[À compléter]`)
  2. Conditional blocks render correctly for all paths
  3. Gender agreement is correct throughout
  4. Article numbering is sequential
  5. DOCX/PDF exports open correctly in Word/PDF readers
