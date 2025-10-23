# 🔐 Configuration des Clés de Signature - TERMINÉE

## ✅ Configuration actuelle

### Clé publique
**Emplacement:** `src-tauri/tauri.conf.json`

```json
"updater": {
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEI2QkY2NEU5NEU0QjQwMEQKUldRTlFFdE82V1MvdGhaTldBVUlhT0ZnNE1sTnFTeHFLOVArWjhSNisxRkwxTm5GRU56Qm1zUTcK"
}
```

✅ **Mise à jour effectuée**

---

### Clé privée
**Emplacement:** `C:\Users\Yoanb\.tauri\formalyse.key`

⚠️ **CRITIQUE - SÉCURITÉ:**
- ✅ Stockée localement uniquement
- ✅ Protégée par mot de passe
- ✅ Exclue de Git (via `.gitignore`)
- ❌ **NE JAMAIS LA PARTAGER**
- ❌ **NE JAMAIS LA COMMITTER**

---

## 📝 Prochaines étapes

Maintenant que vos clés sont configurées, vous pouvez :

### 1. Signer votre build et générer latest.json

```powershell
.\sign-and-generate-json.ps1 -Version "2.0.2"
```

Ce script va :
- ✅ Utiliser votre clé privée pour signer l'exécutable
- ✅ Générer `latest.json` avec la signature
- ✅ Vous donner les fichiers à uploader

---

### 2. Créer une release GitHub

1. Allez sur : https://github.com/yoyoboul/formalyse/releases/new
2. Tag version : `v2.0.2`
3. Titre : `Version 2.0.2`
4. Uploadez les 2 fichiers :
   - `Formalyse_2.0.2_x64-setup.exe` (signé)
   - `latest.json` (avec signature)

---

### 3. Tester l'auto-update

Une fois la release publiée :

```powershell
.\test-autoupdate.ps1
```

Ou lancez simplement l'application - elle vérifiera automatiquement les mises à jour après 5 secondes.

---

## 🔒 Variables d'environnement (optionnel)

Pour automatiser la signature lors des builds, vous pouvez définir :

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = "C:\Users\Yoanb\.tauri\formalyse.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "votre_mot_de_passe"
```

**ATTENTION:** Ne les mettez JAMAIS dans un fichier committé !

---

## 📋 Checklist de sécurité

- [x] Clé privée générée et protégée par mot de passe
- [x] Clé privée stockée dans `~/.tauri/formalyse.key`
- [x] Clé publique ajoutée dans `tauri.conf.json`
- [x] `.gitignore` mis à jour pour exclure `*.key`
- [x] Permissions updater ajoutées dans `capabilities/default.json`
- [x] Version cohérente dans `useTauriUpdater.ts` (2.0.2)
- [ ] Sauvegarde sécurisée de la clé privée (USB, gestionnaire de mots de passe)
- [ ] Build signé et testé
- [ ] Release GitHub publiée avec latest.json

---

## 🆘 En cas de perte de la clé privée

Si vous perdez votre clé privée :
1. ❌ Vous ne pourrez plus signer de mises à jour
2. ⚠️ Les utilisateurs avec l'ancienne version ne pourront plus mettre à jour
3. ✅ Solution : Générer une NOUVELLE paire de clés et publier une NOUVELLE version majeure

C'est pourquoi il est **CRUCIAL** de faire une sauvegarde sécurisée !

---

## ✅ Configuration terminée

Vous êtes maintenant prêt à :
1. Builder votre application : `npm run tauri:build`
2. Signer et générer latest.json : `.\sign-and-generate-json.ps1 -Version "2.0.2"`
3. Publier sur GitHub
4. Profiter de l'auto-update fonctionnel ! 🎉

