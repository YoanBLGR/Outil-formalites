# 🖥️ Formalyse Desktop

## Version Desktop standalone avec Tauri

Formalyse est désormais disponible en **application desktop native** grâce à Tauri ! 

### ✨ Fonctionnalités Desktop

- ✅ **Aucune connexion internet requise** (sauf API externes)
- ✅ **Application native** Windows, macOS, Linux
- ✅ **Très légère** : 3-20 MB (vs 120+ MB pour Electron)
- ✅ **Rapide** : Démarrage instantané
- ✅ **Sécurisé** : Isolation processus Rust
- ✅ **Base de données locale** : Toutes vos données restent sur votre machine
- ✅ **Mises à jour automatiques** (configurables)

### 🎯 Utilisation

#### Pour les utilisateurs

1. **Téléchargez l'installateur** pour votre système :
   - Windows : `Formalyse_1.0.0_x64-setup.exe`
   - macOS : `Formalyse_1.0.0_x64.dmg`
   - Linux : `formalyse_1.0.0_amd64.deb` ou `.AppImage`

2. **Installez et lancez** l'application

3. **Profitez** de Formalyse en mode desktop !

#### Pour les développeurs

Consultez les guides détaillés :
- **Quick Start** : `QUICK_START_DESKTOP.md`
- **Guide complet** : `TAURI_BUILD_GUIDE.md`

**Commandes principales** :
```bash
# Mode développement
npm run tauri:dev

# Créer l'exécutable
npm run tauri:build
```

### 📦 Téléchargements

Les builds sont disponibles dans :
- `src-tauri/target/release/bundle/nsis/` (Windows)
- `src-tauri/target/release/bundle/dmg/` (macOS)
- `src-tauri/target/release/bundle/deb/` (Linux Debian/Ubuntu)
- `src-tauri/target/release/bundle/appimage/` (Linux universel)

### 🔒 Sécurité et confidentialité

- **Données locales** : Toutes vos données restent sur votre ordinateur
- **Aucune télémétrie** : Aucune donnée n'est envoyée à des serveurs tiers (sauf APIs configurées)
- **Open Source** : Code source complet disponible
- **Sandboxing** : Isolation entre le frontend (JS) et le backend (Rust)

### 🆚 Desktop vs Web

| Fonctionnalité | Desktop | Web |
|----------------|---------|-----|
| Installation | Oui | Non |
| Connexion internet | Optionnelle* | Obligatoire |
| Taille | 15-20 MB | - |
| Démarrage | Instantané | Dépend connexion |
| Performance | Native | Bonne |
| Intégration système | Complète | Limitée |
| Base de données | Locale | Locale (IndexedDB) |
| Mises à jour | Auto/Manuel | Automatique |

*\*APIs externes (OpenAI, Google Vision) nécessitent internet*

### 🛠️ Technologies

- **Tauri v2** : Framework Rust pour apps desktop
- **React 19** : Interface utilisateur
- **Vite** : Build tool
- **Dexie** : Base de données locale (IndexedDB)
- **WebView** : Moteur de rendu natif du système

### 📊 Comparaison avec Electron

| Critère | Tauri | Electron |
|---------|-------|----------|
| Taille app | ~15 MB | ~120 MB |
| RAM | ~50 MB | ~200+ MB |
| Langage backend | Rust | Node.js |
| Sécurité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Démarrage | Instantané | 1-3 sec |

### 🚀 Roadmap Desktop

- [ ] Auto-update intégré
- [ ] Notifications système
- [ ] Drag & drop de fichiers amélioré
- [ ] Shortcuts clavier personnalisables
- [ ] Mode offline complet
- [ ] Thème système (clair/sombre automatique)
- [ ] Multi-fenêtres
- [ ] Tray icon / Menu contextuel

### 🆘 Support

- **Documentation** : Voir `TAURI_BUILD_GUIDE.md`
- **Issues** : GitHub Issues
- **Discord Tauri** : https://discord.com/invite/tauri

### 📄 Licence

Voir LICENSE

---

**Développé avec ❤️ par l'équipe Formalyse**

