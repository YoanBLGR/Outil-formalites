/**
 * Script de test pour l'intégration Guichet Unique - Entrepreneur Individuel
 * 
 * Ce script permet de tester :
 * - La validation des données EI
 * - Le mapping EI → format Guichet Unique
 * - La structure JSON générée
 * - Optionnellement, la création réelle d'une formalité (si credentials configurés)
 * 
 * Usage:
 *   npx ts-node scripts/test-gu-ei.ts [--dry-run|--create]
 * 
 * Options:
 *   --dry-run : Valide et affiche la structure sans créer (défaut)
 *   --create  : Crée réellement la formalité sur le GU (nécessite .env configuré)
 */

// Charger les variables d'environnement depuis .env
import { config } from 'dotenv'
config()

import type { Dossier, EntrepreneurIndividuel, Client } from '../src/types'
import { validateDossierEIForGU, mapDossierEIToGUFormality } from '../src/utils/gu-mapper-ei'
import { createDraftFormality, isGuichetUniqueConfigured } from '../src/services/guichet-unique-api'
import { v4 as uuidv4 } from 'uuid'

// ==============================================
// DONNÉES DE TEST
// ==============================================

const testClient: Client = {
  civilite: 'M',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  telephone: '06 12 34 56 78',
}

const testEI: EntrepreneurIndividuel = {
  genre: 'M',
  prenoms: 'Jean Pierre',
  nomNaissance: 'DUPONT',
  nomUsage: undefined,
  dateNaissance: '1985-03-15',
  villeNaissance: 'Paris',
  lieuNaissance: 'Paris (75)',
  paysNaissance: 'France',
  nationalite: 'Française',
  situationMatrimoniale: 'Marié',
  commercantAmbulant: false,
  declarationType: 'mensuelle',
  adresseEntrepreneur: '25 Rue de la République 75011 PARIS',
  adresseEtablissement: '25 Rue de la République 75011 PARIS', // Même adresse
  email: 'jean.dupont@example.com',
  telephone: '06 12 34 56 78',
  numeroSecuriteSociale: '1 85 03 75 056 001 23', // Sera normalisé
  nomCommercial: 'JD Conseil',
  domiciliationDomicile: true,
  adresseDomicile: '25 Rue de la République 75011 PARIS',
  nombreActivites: 1,
  descriptionActivites: 'Conseil en stratégie et organisation d\'entreprise',
  optionVersementLiberatoire: true,
  codeInseeNaissance: '75056', // Paris
}

const testDossier: Dossier = {
  id: uuidv4(),
  numero: 'TEST-EI-2024-001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  typeDossier: 'EI',
  client: testClient,
  entrepreneurIndividuel: testEI,
  statut: 'NOUVEAU',
  documents: [],
  checklist: [],
  timeline: [
    {
      id: uuidv4(),
      type: 'CREATION',
      description: 'Dossier test EI créé',
      createdAt: new Date().toISOString(),
      createdBy: 'Script de test',
    }, 
  ],
}

// ==============================================
// FONCTIONS UTILITAIRES
// ==============================================

/**
 * Affiche un titre formaté
 */
function printTitle(title: string) {
  console.log('\n' + '='.repeat(70))
  console.log(`  ${title}`)
  console.log('='.repeat(70) + '\n')
}

/**
 * Affiche un sous-titre
 */
function printSubtitle(subtitle: string) {
  console.log('\n' + '-'.repeat(70))
  console.log(`  ${subtitle}`)
  console.log('-'.repeat(70) + '\n')
}

/**
 * Affiche un résultat de validation
 */
function printValidationResult(valid: boolean, errors: string[]) {
  if (valid) {
    console.log('✅ Validation réussie : toutes les données sont complètes\n')
  } else {
    console.log('❌ Validation échouée : données incomplètes\n')
    console.log('Erreurs détectées:')
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`)
    })
    console.log('')
  }
}

/**
 * Affiche les informations du dossier
 */
function printDossierInfo(dossier: Dossier) {
  console.log('Dossier:')
  console.log(`  Numéro: ${dossier.numero}`)
  console.log(`  Type: ${dossier.typeDossier}`)
  console.log('')
  
  if (dossier.entrepreneurIndividuel) {
    const ei = dossier.entrepreneurIndividuel
    console.log('Entrepreneur Individuel:')
    console.log(`  Nom complet: ${ei.prenoms} ${ei.nomNaissance}`)
    console.log(`  Nom commercial: ${ei.nomCommercial || 'N/A'}`)
    console.log(`  Date de naissance: ${ei.dateNaissance}`)
    console.log(`  Ville de naissance: ${ei.villeNaissance}`)
    console.log(`  Nationalité: ${ei.nationalite}`)
    console.log(`  Situation matrimoniale: ${ei.situationMatrimoniale}`)
    console.log(`  Numéro sécu: ${ei.numeroSecuriteSociale}`)
    console.log(`  Adresse domicile: ${ei.adresseDomicile}`)
    console.log(`  Adresse établissement: ${ei.adresseEtablissement || 'Identique au domicile'}`)
    console.log(`  Activité: ${ei.descriptionActivites}`)
    console.log(`  Déclaration: ${ei.declarationType}`)
    console.log(`  Versement libératoire: ${ei.optionVersementLiberatoire ? 'Oui' : 'Non'}`)
    console.log('')
  }
  
  console.log('Client:')
  console.log(`  Nom: ${dossier.client.civilite} ${dossier.client.prenom} ${dossier.client.nom}`)
  console.log(`  Email: ${dossier.client.email}`)
  console.log(`  Téléphone: ${dossier.client.telephone}`)
  console.log('')
}

/**
 * Affiche la structure JSON de manière formatée avec limite de taille
 */
function printJSON(obj: any, title: string, maxDepth: number = 10) {
  console.log(`${title}:`)
  console.log('')
  
  try {
    const json = JSON.stringify(obj, null, 2)
    const lines = json.split('\n')
    
    // Limiter l'affichage si trop volumineux
    if (lines.length > 200) {
      console.log(lines.slice(0, 100).join('\n'))
      console.log('\n... (contenu tronqué, trop volumineux) ...\n')
      console.log(lines.slice(-50).join('\n'))
      console.log(`\n📊 Taille totale: ${lines.length} lignes`)
    } else {
      console.log(json)
    }
  } catch (error) {
    console.error('Erreur lors de la sérialisation JSON:', error)
  }
  
  console.log('')
}

/**
 * Affiche un résumé des champs clés
 */
function printFormalitySummary(formalite: any) {
  console.log('Résumé de la formalité:')
  console.log(`  Nom: ${formalite.companyName}`)
  console.log(`  Type formalité: ${formalite.typeFormalite} (${formalite.typeFormalite === 'C' ? 'Création' : 'Autre'})`)
  console.log(`  Type personne: ${formalite.typePersonne} (${formalite.typePersonne === 'P' ? 'Personne Physique' : 'Personne Morale'})`)
  console.log(`  Référence mandataire: ${formalite.referenceMandataire}`)
  console.log(`  Diffusion INSEE: ${formalite.diffusionINSEE}`)
  console.log(`  Diffusion commerciale: ${formalite.diffusionCommerciale}`)
  console.log('')
  
  if (formalite.content?.natureCreation) {
    console.log('Nature de création:')
    console.log(`  Date création: ${formalite.content.natureCreation.dateCreation}`)
    console.log(`  Micro-entreprise: ${formalite.content.natureCreation.microEntreprise ? 'Oui' : 'Non'}`)
    console.log(`  Établie en France: ${formalite.content.natureCreation.etablieEnFrance ? 'Oui' : 'Non'}`)
    console.log('')
  }
  
  if (formalite.content?.personnePhysique?.identite?.entrepreneur) {
    const entrepreneur = formalite.content.personnePhysique.identite.entrepreneur
    console.log('Entrepreneur:')
    
    if (entrepreneur.descriptionPersonne) {
      const desc = entrepreneur.descriptionPersonne
      console.log(`  Nom: ${desc.nom}`)
      console.log(`  Prénoms: ${desc.prenoms?.join(', ')}`)
      console.log(`  Genre: ${desc.genre === '1' ? 'Masculin' : 'Féminin'}`)
      console.log(`  Date naissance: ${desc.dateDeNaissance}`)
      console.log(`  Ville naissance: ${desc.villeNaissance}`)
      console.log(`  Pays naissance: ${desc.paysNaissance}`)
      console.log(`  Nationalité: ${desc.codeNationalite}`)
      console.log(`  Situation matrimoniale: ${desc.situationMatrimoniale}`)
      console.log(`  Numéro sécu: ${desc.numeroSecu}`)
    }
    
    if (entrepreneur.regimeMicroSocial) {
      console.log(`  Régime micro-social: ${entrepreneur.regimeMicroSocial.optionMicroSocial ? 'Oui' : 'Non'}`)
      console.log(`  Périodicité: ${entrepreneur.regimeMicroSocial.periodiciteVersement === 'M' ? 'Mensuelle' : 'Trimestrielle'}`)
    }
    
    console.log('')
  }
  
  if (formalite.content?.personnePhysique?.etablissementPrincipal) {
    console.log('Établissement principal:')
    const etab = formalite.content.personnePhysique.etablissementPrincipal
    
    if (etab.descriptionEtablissement) {
      console.log(`  Rôle: ${etab.descriptionEtablissement.rolePourEntreprise}`)
      console.log(`  Enseigne: ${etab.descriptionEtablissement.enseigne || 'N/A'}`)
      console.log(`  Établissement principal: ${etab.descriptionEtablissement.indicateurEtablissementPrincipal ? 'Oui' : 'Non'}`)
    }
    
    if (etab.adresse) {
      console.log(`  Adresse: ${etab.adresse.numVoie || ''} ${etab.adresse.typeVoie || ''} ${etab.adresse.voie || ''}`)
      console.log(`  Code postal: ${etab.adresse.codePostal}`)
      console.log(`  Commune: ${etab.adresse.commune}`)
    }
    
    if (etab.activites && etab.activites.length > 0) {
      console.log(`  Activité: ${etab.activites[0].descriptionDetaillee}`)
    }
    
    console.log('')
  }
}

// ==============================================
// FONCTION PRINCIPALE
// ==============================================

async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || '--dry-run'
  
  printTitle('TEST INTÉGRATION GUICHET UNIQUE - ENTREPRENEUR INDIVIDUEL')
  
  console.log(`Mode: ${mode === '--create' ? 'CRÉATION RÉELLE' : 'DRY-RUN (simulation)'}`)
  console.log(`Date: ${new Date().toLocaleString('fr-FR')}`)
  console.log('')
  
  // Étape 1 : Afficher les informations du dossier
  printSubtitle('ÉTAPE 1 : Informations du dossier test')
  printDossierInfo(testDossier)
  
  // Étape 2 : Validation
  printSubtitle('ÉTAPE 2 : Validation des données')
  const validation = validateDossierEIForGU(testDossier)
  printValidationResult(validation.valid, validation.errors)
  
  if (!validation.valid) {
    console.log('⚠️  Le test s\'arrête ici car les données ne sont pas valides.')
    process.exit(1)
  }
  
  // Étape 3 : Mapping
  printSubtitle('ÉTAPE 3 : Mapping vers le format Guichet Unique')
  
  try {
    const formalite = await mapDossierEIToGUFormality(testDossier)
    
    console.log('✅ Mapping réussi\n')
    
    // Afficher le résumé
    printFormalitySummary(formalite)
    
    // Afficher la structure complète (tronquée si trop grande)
    printSubtitle('ÉTAPE 4 : Structure JSON complète')
    printJSON(formalite, 'Formalité générée')
    
    // Étape 4 : Création (optionnelle)
    if (mode === '--create') {
      printSubtitle('ÉTAPE 5 : Création de la formalité sur le Guichet Unique')
      
      // Vérifier la configuration
      if (!isGuichetUniqueConfigured()) {
        console.log('❌ Le Guichet Unique n\'est pas configuré')
        console.log('   Ajoutez vos credentials dans le fichier .env')
        console.log('   Voir .env.example pour les variables nécessaires')
        console.log('')
        process.exit(1)
      }
      
      console.log('🚀 Création de la formalité en cours...\n')
      
      try {
        const response = await createDraftFormality(formalite)
        
        console.log('✅ Formalité créée avec succès !\n')
        console.log('Réponse du Guichet Unique:')
        console.log(`  ID: ${response.formalityId}`)
        console.log(`  Statut: ${response.status}`)
        console.log(`  Date création: ${response.createdAt}`)
        if (response.url) {
          console.log(`  URL: ${response.url}`)
        }
        if (response.reference) {
          console.log(`  Référence: ${response.reference}`)
        }
        
        if (response.warnings && response.warnings.length > 0) {
          console.log('\n⚠️  Avertissements:')
          response.warnings.forEach((warning, index) => {
            console.log(`  ${index + 1}. ${warning.message}`)
          })
        }
        
        console.log('')
        
      } catch (error: any) {
        console.log('❌ Erreur lors de la création de la formalité\n')
        console.error('Détails de l\'erreur:')
        if (error.message) {
          console.error(`  Message: ${error.message}`)
        }
        if (error.statusCode) {
          console.error(`  Code HTTP: ${error.statusCode}`)
        }
        if (error.errors && error.errors.length > 0) {
          console.error('\n  Erreurs détaillées:')
          error.errors.forEach((err: any, index: number) => {
            console.error(`    ${index + 1}. ${err.message || err}`)
            if (err.field) {
              console.error(`       Champ: ${err.field}`)
            }
          })
        }
        console.log('')
        process.exit(1)
      }
    } else {
      printSubtitle('ÉTAPE 5 : Simulation terminée')
      console.log('✅ Test en mode dry-run terminé avec succès')
      console.log('')
      console.log('💡 Pour créer réellement la formalité sur le GU, lancez:')
      console.log('   npx ts-node scripts/test-gu-ei.ts --create')
      console.log('')
    }
    
    // Résumé final
    printTitle('RÉSUMÉ DU TEST')
    console.log('✅ Validation: OK')
    console.log('✅ Mapping: OK')
    if (mode === '--create') {
      console.log('✅ Création: OK')
    } else {
      console.log('⏭️  Création: Non effectuée (mode dry-run)')
    }
    console.log('')
    console.log('🎉 Test terminé avec succès !')
    console.log('')
    
  } catch (error: any) {
    console.log('❌ Erreur lors du mapping\n')
    console.error('Détails de l\'erreur:')
    console.error(`  Message: ${error.message || error}`)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    console.log('')
    process.exit(1)
  }
}

// ==============================================
// EXÉCUTION
// ==============================================

main().catch((error) => {
  console.error('Erreur fatale:', error)
  process.exit(1)
})

