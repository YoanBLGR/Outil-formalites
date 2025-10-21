# Icônes de l'application

## Génération automatique des icônes

Pour générer les icônes de votre application Tauri, utilisez un outil en ligne ou installez un générateur :

### Option 1 : En ligne (Recommandé)
Visitez : https://icon.kitchen/
- Uploadez votre logo (1024x1024px minimum)
- Sélectionnez "Desktop Icons"
- Téléchargez et placez les icônes dans ce dossier

### Option 2 : CLI Tauri
```bash
npm install -g @tauri-apps/cli
npx @tauri-apps/cli icon path/to/your-icon.png
```

## Icônes requises

Les fichiers suivants doivent être présents :
- `32x32.png` - Icône Windows (petite)
- `128x128.png` - Icône générique
- `128x128@2x.png` - Icône Retina
- `icon.icns` - Icône macOS
- `icon.ico` - Icône Windows

## Icône temporaire

Pour l'instant, Tauri utilisera une icône par défaut si ces fichiers sont manquants.

