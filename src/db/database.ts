import { createRxDatabase, addRxPlugin } from 'rxdb'
import type { RxDatabase } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { dossierSchema } from './schema'

if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin)
}

// Plugin pour les migrations de schéma
addRxPlugin(RxDBMigrationSchemaPlugin)

export type DatabaseCollections = {
  dossiers: any
}

let dbPromise: Promise<RxDatabase<DatabaseCollections>> | null = null

export async function getDatabase(): Promise<RxDatabase<DatabaseCollections>> {
  if (!dbPromise) {
    dbPromise = createDatabase()
  }
  return dbPromise
}

async function createDatabase(): Promise<RxDatabase<DatabaseCollections>> {
  const db = await createRxDatabase<DatabaseCollections>({
    name: 'formalyse_db',
    storage: wrappedValidateAjvStorage({
      storage: getRxStorageDexie()
    }),
  })

  await db.addCollections({
    dossiers: {
      schema: dossierSchema,
      migrationStrategies: {
        // Migration de la version 0 à 1 : ajout du champ statutsDraft (optionnel)
        1: function (oldDoc: any) {
          // Le champ statutsDraft est optionnel, pas besoin de l'initialiser
          return oldDoc
        },
        // Migration de la version 1 à 2 : ajout du champ checklistDocumentsGU (optionnel)
        2: function (oldDoc: any) {
          // Le champ checklistDocumentsGU est optionnel, pas besoin de l'initialiser
          // Il sera généré automatiquement lors de l'affichage si absent
          return oldDoc
        },
        // Migration de la version 2 à 3 : ajout du champ guichetUnique (optionnel)
        3: function (oldDoc: any) {
          // Le champ guichetUnique est optionnel, pas besoin de l'initialiser
          // Il sera ajouté lors de la création d'une formalité sur le GU
          return oldDoc
        },
      },
    },
  })

  return db
}

export async function generateDossierNumero(denomination: string): Promise<string> {
  const db = await getDatabase()
  const year = new Date().getFullYear()

  const existingDossiers = await db.dossiers
    .find({
      selector: {
        numero: {
          $regex: `^DOS-${year}-`,
        },
      },
    })
    .exec()

  const nextNumber = existingDossiers.length + 1
  const formattedNumber = String(nextNumber).padStart(3, '0')

  return `DOS-${year}-${formattedNumber}-${denomination}`
}
