# 🎨 Générer les icônes Formalyse

## ⚡ Solution rapide (Recommandé)

### Option 1 : Générateur automatique Tauri
```bash
# 1. Créez un logo carré (1024x1024px minimum)
# 2. Lancez la commande :
npx @tauri-apps/cli icon chemin/vers/votre-logo.png
```

Cela génère automatiquement toutes les icônes dans `src-tauri/icons/` !

### Option 2 : Générateur en ligne
1. Visitez : https://icon.kitchen/
2. Uploadez votre logo (1024x1024px)
3. Sélectionnez "Desktop Icons"
4. Téléchargez et décompressez dans `src-tauri/icons/`

### Option 3 : Icônes par défaut (temporaire)
L'application fonctionne sans icônes personnalisées. Tauri utilise des icônes par défaut.

## 📋 Icônes requises pour production

Pour un build de production complet, vous aurez besoin de :

```
src-tauri/icons/
├── 32x32.png          # Petite icône Windows
├── 128x128.png        # Icône standard
├── 128x128@2x.png     # Icône Retina (macOS)
├── icon.icns          # Icône macOS
└── icon.ico           # Icône Windows
```

## 🛠️ Réactiver les icônes

Une fois vos icônes générées, modifiez `src-tauri/tauri.conf.json` :

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    ...
  }
}
```

## 🎨 Recommandations pour votre logo

- **Format** : PNG avec fond transparent
- **Taille** : 1024x1024px minimum (idéal : 2048x2048px)
- **Style** : Simple, reconnaissable à petite taille
- **Couleurs** : Contrastées, pas trop de détails fins

## 📝 Logo Formalyse suggéré

Créez un logo avec :
- Icône : Document juridique stylisé ou "F" moderne
- Couleurs : Bleu professionnel (#2563eb) + gris (#64748b)
- Police : Sans-serif moderne (Inter, Roboto, etc.)

---

**Pour l'instant, l'app fonctionne avec les icônes par défaut !** 🚀

