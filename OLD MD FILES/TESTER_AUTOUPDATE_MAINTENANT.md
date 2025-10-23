# 🧪 Tester l'Auto-Update - Guide Pratique

## ⚠️ Important : L'updater ne fonctionne PAS en mode dev

L'auto-update Tauri **ne fonctionne QUE** dans une version **compilée et installée**.

❌ Ne fonctionne PAS : `npm run tauri:dev`  
✅ Fonctionne : Application installée via `.exe`

---

## 🎯 Méthode 1 : Installer la version précédente

### Étape 1 : Télécharger la v2.0.2

Si vous n'avez plus le fichier localement :
1. Allez sur : https://github.com/yoyoboul/formalyse/releases/tag/v2.0.2
2. Téléchargez `Formalyse_2.0.2_x64-setup.exe`

Sinon, utilisez le fichier déjà présent dans :
```
src-tauri\target\release\bundle\nsis\Formalyse_2.0.2_x64-setup.exe
```

### Étape 2 : Désinstaller la version actuelle

```
Paramètres Windows > Applications > Formalyse > Désinstaller
```

### Étape 3 : Installer la v2.0.2

Double-cliquez sur `Formalyse_2.0.2_x64-setup.exe`

### Étape 4 : Lancer l'application

1. Lancez Formalyse
2. Attendez **5-10 secondes**
3. Un panneau devrait apparaître en bas à droite :

```
🎉 Mise à jour disponible
Version 3.0.0 disponible (actuelle: 2.0.2)

[Vérifier maintenant] [Mettre à jour v3.0.0]
```

### Étape 5 : Installer la mise à jour

1. Cliquez sur **"Mettre à jour v3.0.0"**
2. Le téléchargement démarre (barre de progression)
3. Installation automatique
4. L'application redémarre en v3.0.0

---

## 🎯 Méthode 2 : Simuler en dev (pour debug uniquement)

Si vous voulez juste voir les logs sans installer :

### Modifier temporairement la version

Éditez `src/hooks/useTauriUpdater.ts` :

```typescript
const CURRENT_VERSION = '2.0.2' // ✅ Garder 2.0.2 pour simuler
```

### Vérifier tauri.conf.json

Éditez `src-tauri/tauri.conf.json` :

```json
{
  "version": "2.0.2"  // ⚠️ Temporaire pour test
}
```

### Lancer en mode dev

```bash
npm run tauri:dev
```

**Résultat attendu dans les logs :**
```
[12:30:01] 🔍 Vérification des mises à jour (API Tauri Updater)...
[12:30:01] 📍 Version actuelle: 2.0.2
[12:30:02] 🎉 Mise à jour disponible! 2.0.2 → 3.0.0
```

⚠️ **IMPORTANT :** Ne tentez PAS de télécharger/installer en mode dev, cela échouera !

### Après le test

Remettez les versions correctes :
- `tauri.conf.json` : `"version": "3.0.0"`
- `useTauriUpdater.ts` : `const CURRENT_VERSION = '3.0.0'`

---

## 🎯 Méthode 3 : Vérifier les logs détaillés

### Dans l'application installée

1. Ouvrez les **DevTools** : `Ctrl + Shift + I` (si activé en dev)
2. Onglet **Console**
3. Cherchez les logs qui commencent par `[HH:MM:SS]`

**Logs normaux (app à jour) :**
```
[12:22:01] 🔍 Vérification des mises à jour (API Tauri Updater)...
[12:22:01] 📍 Version actuelle: 3.0.0
[12:22:02] ✅ Application à jour - Aucune mise à jour nécessaire
```

**Logs avec MAJ disponible :**
```
[12:22:01] 🔍 Vérification des mises à jour (API Tauri Updater)...
[12:22:01] 📍 Version actuelle: 2.0.2
[12:22:02] 🎉 Mise à jour disponible! 2.0.2 → 3.0.0
[12:22:02] 📝 Notes: Mise a jour vers la version 3.0.0
```

**Logs d'erreur :**
```
[12:22:02] ❌ Erreur: Impossible de vérifier les mises à jour
```

---

## 🔍 Vérifier manuellement que tout fonctionne

### 1. Vérifier que latest.json est accessible

```powershell
Invoke-WebRequest -Uri "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json" -UseBasicParsing
```

**Résultat attendu :**
```json
{
    "version": "3.0.0",
    "platforms": {
        "windows-x86_64": {
            "signature": "dW50cnVzdGVk...",
            "url": "https://github.com/yoyoboul/formalyse/releases/download/v3.0.0/Formalyse_3.0.0_x64-setup.exe"
        }
    }
}
```

### 2. Vérifier la configuration de l'updater

Ouvrez `src-tauri/tauri.conf.json` :

```json
"plugins": {
    "updater": {
        "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEI2QkY2NEU5NEU0QjQwMEQKUldRTlFFdE82V1MvdGhaTldBVUlhT0ZnNE1sTnFTeHFLOVArWjhSNisxRkwxTm5GRU56Qm1zUTcK",
        "endpoints": [
            "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json"
        ]
    }
}
```

Vérifiez :
- ✅ `pubkey` est définie
- ✅ `endpoints` pointe vers `/latest/download/latest.json`

### 3. Vérifier les permissions

Ouvrez `src-tauri/capabilities/default.json` :

```json
"permissions": [
    "updater:default",    // ✅ Doit être présent
    "process:default",    // ✅ Doit être présent
    "http:default"
]
```

---

## ✅ Checklist de Validation

Avant de tester l'auto-update, vérifiez :

- [ ] La release v3.0.0 est publiée sur GitHub
- [ ] Le fichier `latest.json` est uploadé dans la release
- [ ] Le fichier `Formalyse_3.0.0_x64-setup.exe` est uploadé
- [ ] L'URL `https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json` est accessible
- [ ] Le `latest.json` contient une `signature`
- [ ] Vous testez depuis une version **installée** (pas dev)
- [ ] La version installée est **inférieure** à 3.0.0 (ex: 2.0.2)

---

## 🎬 Scénario de Test Complet

### Scénario : Tester le workflow complet

1. **Installer v2.0.2**
   - Désinstaller Formalyse si déjà installé
   - Installer `Formalyse_2.0.2_x64-setup.exe`

2. **Vérifier la version installée**
   - Lancer Formalyse
   - Dans le panneau d'update : "Version actuelle: 2.0.2"

3. **Attendre la vérification auto**
   - Après 5 secondes, le panneau devrait afficher :
     ```
     🎉 Mise à jour disponible
     Version 3.0.0 disponible (actuelle: 2.0.2)
     ```

4. **Installer la mise à jour**
   - Cliquer sur "Mettre à jour v3.0.0"
   - Observer la progression (0% → 100%)
   - L'app se ferme et se relance automatiquement

5. **Vérifier la nouvelle version**
   - L'app redémarre
   - Panneau d'update : "Version actuelle: 3.0.0"
   - Message : "✅ Application à jour"

---

## 🐛 Problèmes Courants

### "Application à jour" alors que GitHub a une version plus récente

**Causes possibles :**
1. Vous êtes en mode dev (`npm run tauri:dev`)
   - **Solution :** Installer l'app via `.exe`

2. La version dans `useTauriUpdater.ts` est incorrecte
   - **Solution :** Vérifier que `CURRENT_VERSION` correspond à la version compilée

3. L'updater n'a pas pu contacter GitHub
   - **Solution :** Vérifier les logs pour des erreurs réseau

### "Impossible de vérifier les mises à jour"

**Causes possibles :**
1. Pas de connexion internet
2. L'endpoint GitHub n'est pas accessible
3. La signature est invalide
4. Permissions manquantes

**Solution :** Consultez les logs détaillés dans le panneau de debug.

### Téléchargement bloqué à 0%

**Causes possibles :**
1. L'exécutable n'est pas sur GitHub
2. L'URL dans latest.json est incorrecte

**Solution :** Vérifiez que l'URL est correcte et accessible.

---

## 🎉 Résultat Attendu

Si tout fonctionne correctement :

1. ✅ L'app vérifie les MAJ au démarrage (après 5s)
2. ✅ Un panneau s'affiche quand une MAJ est disponible
3. ✅ Le téléchargement se fait avec barre de progression
4. ✅ L'installation est automatique et silencieuse
5. ✅ L'app redémarre automatiquement
6. ✅ La nouvelle version est installée

**Félicitations ! Votre système d'auto-update fonctionne ! 🎊**

---

## 📝 Pour les Prochaines Versions

Quand vous publiez la v3.0.1 (par exemple) :

1. Les utilisateurs en v3.0.0 lanceront l'app
2. Après 5s, le panneau apparaît : "Mise à jour disponible : 3.0.1"
3. Ils cliquent sur "Mettre à jour"
4. L'app se met à jour automatiquement

**C'est automatique et transparent pour l'utilisateur ! 🚀**

