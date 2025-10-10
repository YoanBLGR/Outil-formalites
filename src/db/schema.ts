import type { RxJsonSchema } from 'rxdb'
import type { Dossier } from '../types'

export const dossierSchema: RxJsonSchema<Dossier> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    numero: {
      type: 'string',
      maxLength: 200,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 50,
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 50,
    },
    client: {
      type: 'object',
      properties: {
        civilite: {
          type: 'string',
          enum: ['M', 'Mme'],
        },
        nom: {
          type: 'string',
        },
        prenom: {
          type: 'string',
        },
        email: {
          type: 'string',
          format: 'email',
        },
        telephone: {
          type: 'string',
        },
      },
      required: ['civilite', 'nom', 'prenom', 'email', 'telephone'],
    },
    societe: {
      type: 'object',
      properties: {
        formeJuridique: {
          type: 'string',
          enum: ['EURL', 'SARL', 'SASU', 'SAS'],
        },
        denomination: {
          type: 'string',
        },
        siege: {
          type: 'string',
        },
        capitalSocial: {
          type: 'number',
        },
        objetSocial: {
          type: 'string',
        },
      },
      required: ['formeJuridique', 'denomination', 'siege'],
    },
    statut: {
      type: 'string',
      maxLength: 50,
      enum: [
        'NOUVEAU',
        'DEVIS_ENVOYE',
        'PROJET_STATUTS',
        'ATTENTE_DEPOT',
        'DEPOT_VALIDE',
        'PREP_RDV',
        'RDV_SIGNE',
        'FORMALITE_SAISIE',
        'SUIVI',
        'CLOTURE',
      ],
    },
    documents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          nom: {
            type: 'string',
          },
          type: {
            type: 'string',
          },
          categorie: {
            type: 'string',
          },
          fichier: {
            type: 'string',
          },
          uploadedAt: {
            type: 'string',
            format: 'date-time',
          },
          uploadedBy: {
            type: 'string',
          },
        },
      },
    },
    checklist: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          label: {
            type: 'string',
          },
          completed: {
            type: 'boolean',
          },
          required: {
            type: 'boolean',
          },
          dependsOn: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          formeJuridique: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
    timeline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          type: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          createdBy: {
            type: 'string',
          },
          metadata: {
            type: 'object',
          },
        },
      },
    },
    statutsDraft: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        dossierId: {
          type: 'string',
        },
        formeJuridique: {
          type: 'string',
        },
        data: {
          type: 'object',
        },
        progression: {
          type: 'number',
        },
        sections: {
          type: 'object',
        },
        version: {
          type: 'number',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
        },
        generatedDocumentUrl: {
          type: 'string',
        },
      },
    },
  },
  required: ['id', 'numero', 'createdAt', 'updatedAt', 'client', 'societe', 'statut'],
  indexes: ['numero', 'statut', 'createdAt'],
}
