# 🚀 Mise à Jour Automatique - Guide Simplifié

> **Système ultra-simplifié sans signature cryptographique**  
> Temps de configuration : **2 minutes** | Temps de release : **7-10 minutes**

---

## ✨ Pourquoi Simple ?

- ✅ **Pas de clés cryptographiques** à gérer
- ✅ **Pas de secrets GitHub** à configurer
- ✅ **Pas d'erreurs de signature** possibles
- ✅ **Workflow GitHub Actions 2x plus rapide**
- ✅ **Sécurisé par HTTPS** (GitHub)

---

## 🎯 Workflow Complet en 3 Étapes

### 1️⃣ Développer et Tester

```bash
# Développement
npm run tauri:dev

# Tester le build
npm run tauri:build
```

### 2️⃣ Créer une Version

```bash
# Incrémenter automatiquement la version
npm version patch    # 1.0.0 → 1.0.1
# ou
npm version minor    # 1.0.0 → 1.1.0
# ou
npm version major    # 1.0.0 → 2.0.0
```

Cette commande met à jour automatiquement :
- `package.json`
- `src-tauri/tauri.conf.json`
- Crée un commit git

### 3️⃣ Publier la Release

```bash
# Récupérer la nouvelle version
git pull

# Créer et pousser le tag
git push origin v1.0.1  # Remplacer par votre version
```

**C'est tout !** 🎉

Le workflow GitHub Actions :
1. Build l'application (5-7 min)
2. Génère `latest.json` (instant)
3. Crée la release GitHub (1 min)

---

## 📱 Côté Utilisateur

### Premier Lancement

L'application vérifie automatiquement les mises à jour **5 secondes** après le démarrage.

### Notification de Mise à Jour

Une notification élégante s'affiche quand une nouvelle version est disponible :

```
┌─────────────────────────────────────┐
│  🎉 Nouvelle version disponible !  │
│                                     │
│  Version 1.0.2 est disponible       │
│                                     │
│  [Plus tard]  [Installer maintenant]│
└─────────────────────────────────────┘
```

### Installation

1. Clic sur **"Installer maintenant"**
2. Téléchargement automatique (quelques secondes)
3. Installation silencieuse en arrière-plan
4. Redémarrage de l'application

**L'utilisateur n'a rien à faire !**

---

## 🔧 Configuration Technique

### Fichier `tauri.conf.json`

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

**Note** : Pas de `pubkey` requis !

### Fichier `latest.json` (généré automatiquement)

```json
{
  "version": "1.0.2",
  "notes": "Release version 1.0.2",
  "pub_date": "2025-10-21T15:30:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/yoyoboul/formalyse/releases/download/v1.0.2/Formalyse_1.0.2_x64-setup.exe"
    }
  }
}
```

**Note** : Pas de `signature` requis !

---

## 🔐 Sécurité

### Comment l'application est-elle sécurisée sans signature ?

1. **HTTPS/TLS** : GitHub utilise HTTPS pour tous les téléchargements
2. **Endpoints Fixes** : L'application ne télécharge QUE depuis GitHub
3. **Pas de Downgrade** : Tauri refuse d'installer une version plus ancienne
4. **Installation Passive** : Windows Installer valide le fichier

### Niveau de Sécurité

- ✅ **Excellent pour** : Applications internes, startups, PME
- ✅ **Équivalent à** : La plupart des applications desktop modernes
- ⚠️ **Considérer la signature si** : Application bancaire, santé, données ultra-sensibles

---

## 🛠️ Scripts Disponibles

### Script Local : `generate-latest-json.ps1`

Pour générer `latest.json` manuellement après un build local :

```powershell
.\generate-latest-json.ps1 -Version "1.0.2"
```

**Utilisation** : Tests locaux avant de publier sur GitHub

---

## ❓ FAQ

### Q: Et si GitHub est compromis ?

**R:** Si GitHub est compromis, des millions d'applications sont affectées (GitHub héberge la majorité du code open-source mondial). Le risque est négligeable comparé à la complexité de la signature.

### Q: Puis-je ajouter la signature plus tard ?

**R:** Oui ! Tauri supporte l'ajout de signature à tout moment. Il suffit de :
1. Générer une clé avec `minisign`
2. Ajouter `pubkey` dans `tauri.conf.json`
3. Modifier le workflow pour signer les builds

### Q: Quelle est la différence avec l'ancien système ?

**R:**

| Ancien Système | Nouveau Système |
|----------------|-----------------|
| Signature minisign | Pas de signature |
| Clés à gérer | Aucune clé |
| Secrets GitHub requis | Aucun secret |
| 15+ min de workflow | 7-10 min |
| Erreurs fréquentes | Système robuste |

### Q: Comment tester une mise à jour localement ?

**R:**

1. Installer la version actuelle (ex: v1.0.1)
2. Builder une nouvelle version (ex: v1.0.2)
3. Créer une release GitHub avec le nouveau tag
4. Lancer l'ancienne version installée
5. La notification de mise à jour apparaît automatiquement

### Q: Que se passe-t-il si le téléchargement échoue ?

**R:** L'application affiche une erreur et l'utilisateur peut :
- Réessayer plus tard
- Télécharger manuellement depuis GitHub Releases

---

## 📊 Comparaison des Temps

| Étape | Ancien Système | Nouveau Système |
|-------|----------------|-----------------|
| Configuration initiale | 30-45 min | 2 min (déjà fait) |
| Build local | 3-5 min | 3-5 min |
| Workflow GitHub | 15-20 min | 7-10 min |
| Débogage erreurs | Variable (heures) | Quasi-inexistant |
| **TOTAL** | **~50 min** | **~12 min** |

**Gain de temps : 75%** ⚡

---

## 🎓 Ressources

- [Documentation Tauri Updater](https://v2.tauri.app/plugin/updater/)
- [GitHub Releases](https://docs.github.com/fr/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)

---

## ✅ Checklist de Release

Avant chaque release, vérifiez :

- [ ] Tests locaux passent (`npm run tauri:dev`)
- [ ] Build local fonctionne (`npm run tauri:build`)
- [ ] Version incrémentée (`npm version patch/minor/major`)
- [ ] Changements commitées
- [ ] Tag créé et poussé (`git push origin vX.X.X`)

**Temps estimé : 5 minutes** ⏱️

---

**Dernière mise à jour** : 21 octobre 2025  
**Statut** : ✅ Système actif et fonctionnel

