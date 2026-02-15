# 🇧🇫 BurkinaBizz — Marketplace Local du Burkina Faso

> Application de marché local pour le Burkina Faso avec paiement Mobile Money (Orange Money, Moov Money) et contact WhatsApp.

---

## 📱 Captures d'écran

| Accueil | Marché | Détails | Dashboard |
|---------|--------|---------|-----------|
| Catégories & Hero | FlatList produits | Infos + WhatsApp | Gestion vendeur |

---

## 🚀 Démarrage rapide

### 1. Prérequis
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Compte Firebase (gratuit)

### 2. Installation

```bash
cd BurkinaBizz
npm install
```

### 3. Configuration Firebase

1. Allez sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. Créez un nouveau projet nommé **"burkinabizz"**
3. Activez **Authentication** → Email/Password + Google
4. Créez une base de données **Firestore** (mode production)
5. Activez **Storage**
6. Dans Paramètres du projet → Vos applications → Ajoutez une app Web
7. Copiez la config dans `lib/firebase.ts`

```typescript
// lib/firebase.ts — remplacez ces valeurs
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "burkinabizz.firebaseapp.com",
  projectId: "burkinabizz",
  storageBucket: "burkinabizz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Déployer les règles Firebase

```bash
npm install -g firebase-tools
firebase login
firebase use --add  # Sélectionnez votre projet
firebase deploy --only firestore:rules,storage,firestore:indexes
```

### 5. Lancer en développement

```bash
npx expo start
```

- Scan le QR code avec **Expo Go** (iOS/Android)
- Ou appuyez `a` pour Android, `i` pour iOS (simulateur)

---

## 📦 Build production (App Store + Play Store)

### Configurer EAS

```bash
eas login
eas build:configure
```

### Mettre à jour `eas.json`

Remplacez dans `eas.json`:
- `YOUR_APPLE_ID@email.com`
- `YOUR_APP_STORE_CONNECT_APP_ID`
- `YOUR_APPLE_TEAM_ID`
- Fournissez `google-play-service-account.json`

### Mettre à jour `app.json`

Remplacez:
- `"projectId": "YOUR_EAS_PROJECT_ID"` → votre vrai ID EAS

```bash
# Obtenir votre project ID
eas project:info
```

### Build Android (APK preview / AAB production)

```bash
# APK test interne
npm run build:android

# Ou directement:
eas build --platform android --profile production
```

### Build iOS

```bash
eas build --platform ios --profile production
```

### Soumettre aux stores

```bash
npm run submit:android  # Google Play
npm run submit:ios      # App Store Connect
```

---

## 🗂️ Structure du projet

```
BurkinaBizz/
├── app/
│   ├── _layout.tsx          # Navigation root + AuthProvider
│   ├── index.tsx            # 🏠 HomeScreen
│   ├── marketplace.tsx      # 🛒 MarketplaceScreen
│   ├── auth.tsx             # 🔑 AuthScreen
│   ├── product/
│   │   └── [id].tsx         # 📦 ProductDetailsScreen
│   └── vendor/
│       ├── dashboard.tsx    # 🏪 VendorDashboardScreen
│       └── add-product.tsx  # ➕ AddProductScreen
├── components/
│   ├── ProductCard.tsx      # Carte produit réutilisable
│   ├── CategoryBadge.tsx    # Filtre par catégorie
│   ├── LoadingSpinner.tsx   # Spinner de chargement
│   └── EmptyState.tsx       # État vide
├── constants/
│   └── index.ts             # Couleurs, catégories, villes
├── hooks/
│   └── useColorTheme.ts     # Dark/light mode hook
├── lib/
│   ├── firebase.ts          # Config Firebase (⚠️ à configurer)
│   └── AuthContext.tsx      # Contexte authentification
├── types/
│   └── index.ts             # TypeScript interfaces
├── assets/images/           # Icônes & splash
├── firestore.rules          # Règles sécurité Firestore
├── storage.rules            # Règles sécurité Storage
├── firebase.json            # Config déploiement Firebase
├── firestore.indexes.json   # Index Firestore
├── eas.json                 # Config EAS Build
└── app.json                 # Config Expo
```

---

## 🔥 Structure Firestore

```
users/{userId}
  ├── name: string
  ├── email: string
  └── role: "vendor"

products/{productId}
  ├── name: string
  ├── price: number (FCFA)
  ├── category: "Alimentation" | "Mode" | "Téléphones" | "Services" | "Transport" | "Autre"
  ├── description: string
  ├── imageUrl: string
  ├── vendorId: string (uid)
  ├── phone: string (WhatsApp)
  ├── city: "Ouagadougou" | "Bobo-Dioulasso" | ...
  └── createdAt: Timestamp
```

---

## 📲 Fonctionnalités

### Invité (non connecté)
- ✅ Parcourir le marché
- ✅ Filtrer par catégorie
- ✅ Rechercher des produits
- ✅ Voir les détails d'un produit
- ✅ Contacter vendeur sur WhatsApp
- ✅ Voir instructions Mobile Money
- ❌ Ajouter un produit
- ❌ Accéder au dashboard

### Vendeur (connecté)
- ✅ Tout ce que peut faire un invité
- ✅ Dashboard avec liste de ses produits
- ✅ Ajouter un produit avec photo
- ✅ Supprimer ses produits
- ✅ Déconnexion

---

## 🎨 Design System

| Token | Valeur |
|-------|--------|
| Couleur primaire | `#2E7D32` (vert) |
| Bouton CTA | `#F9A825` (jaune) |
| Mode sombre/clair | `useColorScheme()` |
| Border radius | 12-18px |
| Devise | FCFA |

---

## 📞 Configuration WhatsApp

Le bouton "Contacter sur WhatsApp" utilise le deep link:
```
https://wa.me/{phone}?text=Bonjour%20je%20suis%20intéressé...
```

Le numéro doit être au format international: `+22670000000`

---

## 🔒 Sécurité

- Les invités peuvent uniquement **lire** les produits
- Les vendeurs ne peuvent modifier/supprimer **que leurs propres produits**
- Les images sont limitées à **5 MB max**
- Validation côté serveur via Firestore Rules

---

## 🌍 Localisation

- Langue: **Français**
- Devise: **FCFA** (Franc CFA)
- Villes: Ouagadougou, Bobo-Dioulasso, Koudougou, Banfora, Ouahigouya
- Paiement: Orange Money, Moov Money

---

## 🐛 Dépannage

**Erreur "permission-denied" Firestore**
→ Déployez les règles: `firebase deploy --only firestore:rules`

**WhatsApp ne s'ouvre pas**
→ Vérifiez que le numéro est au format international (+226...)

**Images qui ne chargent pas**
→ Déployez les règles Storage: `firebase deploy --only storage`

**Build EAS échoue**
→ Vérifiez que `projectId` dans `app.json` est correct
