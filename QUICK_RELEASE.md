# 🚀 Release Rapide - Formalyse

Guide ultra-rapide pour publier une release en **3 clics**.

---

## ⚡ Quick Start (3 étapes)

### 1️⃣ Configuration (une seule fois)

```cmd
set-token.bat
```

- Entrez votre token GitHub
- C'est tout ! ✅

<details>
<summary>Comment obtenir un token GitHub ? 🔑</summary>

1. https://github.com/settings/tokens/new
2. Permissions : `repo` + `write:packages`
3. Copiez le token (commence par `ghp_...`)

</details>

---

### 2️⃣ Publier une release

```cmd
release.bat
```

**Choix de version** :
1. **Patch** (1.0.5 → 1.0.6) - Correctifs
2. **Minor** (1.0.5 → 1.1.0) - Nouvelles fonctionnalités  
3. **Major** (1.0.5 → 2.0.0) - Changements majeurs
4. **Manuelle** - Saisir (ex: 2.1.3) 🆕

**C'est tout !** Le script fait **TOUT** automatiquement :

- ✅ Met à jour la version
- ✅ Build l'application (2-3 min)
- ✅ Commit + tag Git
- ✅ Push sur GitHub
- ✅ Crée la release
- ✅ Upload les fichiers
- ✅ Publie !

**Temps total : 3-4 minutes** ⏱️

---

### 3️⃣ C'est fini !

Les utilisateurs reçoivent la notification de mise à jour automatiquement ! 🎉

---

## 📁 Fichiers disponibles

| Fichier | Description | Utilisation |
|---------|-------------|-------------|
| **`release.bat`** | Script principal | Publier une release |
| **`set-token.bat`** | Config token | Une seule fois |
| **`release-auto.ps1`** | Version PowerShell | Alternative avancée |

---

## 💡 Sans token GitHub ?

Le script fonctionne quand même, mais vous devrez uploader les fichiers manuellement sur GitHub à la fin.

---

## 🎯 Workflow recommandé

```
1. Développez vos features
   └─> npm run tauri:dev

2. Testez localement
   └─> Tout fonctionne ? ✅

3. Publiez
   └─> release.bat

4. Attendez 3 minutes ☕

5. C'est publié ! 🎉
```

---

## ⚡ Comparaison

| Méthode | Temps | Auto |
|---------|-------|------|
| GitHub Actions | 7-10 min | 100% |
| **release.bat** | **3-4 min** | **100%** |
| Manuel | 15+ min | 0% |

**Le script local est 2-3x plus rapide !** 🚀

---

## 🆘 Problèmes ?

### "Token invalide"
- Vérifiez les permissions : `repo` + `write:packages`
- Recréez le token si expiré

### "Build échoue"
```cmd
npm install
npm run tauri:build
```

### "Fichier introuvable"
- Le build a peut-être échoué
- Vérifiez les logs

---

## 📚 Documentation complète

- **Guide détaillé** : [RELEASE_LOCALE.md](RELEASE_LOCALE.md)
- **Auto-update** : [AUTOUPDATE_GUIDE.md](AUTOUPDATE_GUIDE.md)

---

**Happy Releasing! 🎉**

