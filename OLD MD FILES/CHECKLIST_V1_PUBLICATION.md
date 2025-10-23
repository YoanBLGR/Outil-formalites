# ✅ Checklist Publication v1.0.0

## État Actuel

- [x] Code synchronisé à v1.0.0
  - [x] package.json → 1.0.0
  - [x] tauri.conf.json → 1.0.0
  - [x] useTauriUpdater.ts → 1.0.0
- [x] Commit créé : "v1.0.0 - Configuration auto-update complète"
- [x] Tag créé : v1.0.0
- [x] Push sur GitHub : ✅ Fait

---

## Étapes Restantes

### 1. Builder l'application

```bash
npm run tauri:build
```

**Durée :** 2-3 minutes

**Fichier généré :**
```
src-tauri\target\release\bundle\nsis\Formalyse_1.0.0_x64-setup.exe
```

---

### 2. Signer et générer latest.json

```powershell
.\sign-and-generate-json.ps1 -Version "1.0.0"
```

**Vous devrez :**
- Entrer le mot de passe de votre clé privée

**Fichier généré :**
```
latest.json (avec signature)
```

---

### 3. Créer la release sur GitHub

**Option A : Automatique (si token configuré)**

```powershell
$env:GITHUB_TOKEN = "votre_token"
.\create-release-simple.ps1 -Version "1.0.0"
```

**Option B : Manuel**

1. Allez sur : https://github.com/yoyoboul/formalyse/releases/new
2. Tag version : Sélectionnez **v1.0.0** (déjà créé)
3. Titre : `Formalyse v1.0.0`
4. Description :
   ```markdown
   ## 🎉 Version 1.0.0 - Release Initiale
   
   Première version stable de Formalyse Desktop.
   
   ### ✨ Fonctionnalités
   - Gestion complète des dossiers juridiques
   - Génération de statuts (EURL, SARL, SASU)
   - Export PDF et DOCX
   - IA intégrée
   - **Auto-update automatique**
   
   ### 📥 Installation
   Téléchargez `Formalyse_1.0.0_x64-setup.exe`
   ```

5. Uploadez les 2 fichiers :
   - `Formalyse_1.0.0_x64-setup.exe`
   - `latest.json`

6. Cliquez sur **"Publish release"**

---

### 4. Vérification

#### a) Vérifier la release

https://github.com/yoyoboul/formalyse/releases/tag/v1.0.0

Vous devez voir :
- ✅ Tag v1.0.0
- ✅ 2 fichiers attachés

#### b) Vérifier latest.json

```powershell
Invoke-WebRequest -Uri "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json" -UseBasicParsing
```

Doit retourner :
```json
{
    "version": "1.0.0",
    "platforms": {
        "windows-x86_64": {
            "signature": "dW50cnVzdGVk...",
            "url": "https://github.com/.../Formalyse_1.0.0_x64-setup.exe"
        }
    }
}
```

#### c) Installer et tester

1. Double-clic sur `Formalyse_1.0.0_x64-setup.exe`
2. Lancer l'application
3. Panneau de mise à jour devrait afficher :
   ```
   Version actuelle: 1.0.0
   ✅ Application à jour
   ```

---

## 🎊 Félicitations !

Une fois ces étapes terminées :
- ✅ Votre v1.0.0 est publiée
- ✅ L'auto-update est configuré
- ✅ Les prochaines versions se feront avec `.\release.bat`

---

## 📝 Pour la Prochaine Version (v1.0.1)

Quand vous voudrez publier une mise à jour :

```bash
.\release.bat
# Choisir : 1 (Patch)
# Entrer le mot de passe de la clé
# C'est tout ! 🚀
```

Le script fait tout automatiquement :
1. Incrémente 1.0.0 → 1.0.1
2. Build l'application
3. Signe l'exécutable
4. Génère latest.json
5. Commit + Tag + Push
6. Crée la release GitHub

**Et vos utilisateurs en v1.0.0 recevront la notification automatiquement !** 🎉

