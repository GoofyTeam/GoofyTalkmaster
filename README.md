# 🎤 GoofyTalkmaster

**GoofyTalkmaster** est une application web complète de gestion de conférences. Elle permet aux conférenciers de proposer des talks et aux organisateurs de les valider, planifier et publier dans un planning consultable par tous.

## 🚀 Fonctionnalités principales

- Authentification sécurisée selon le rôle (conférencier/organisateur)
- Création, édition et validation de talks
- Attribution des créneaux horaires et des salles
- Génération automatique du programme des conférences
- Interface utilisateur intuitive et responsive

## 🛠️ Technologies utilisées

- **Frontend** : React
- **Backend** : Laravel
- **Base de données** : PostgreSQL
- **Conteneurisation** : Docker

## 📦 Installation

### Prérequis

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Make](https://www.gnu.org/software/make/)

### Démarrage rapide

1. **Cloner le dépôt**

   ```bash
   git clone https://github.com/GoofyTeam/GoofyTalkmaster.git
   cd GoofyTalkmaster
   ```

2. **Préparer l'environnement Laravel**

   ```bash
   cp back/.env.example back/.env
   docker compose up -d
   make install
   make fresh
   ```

   > `make install` exécute `composer install` dans le conteneur `back-talkmaster` et `make fresh` lance les migrations et charge les données de démonstration.

3. **Accéder aux services**
   - Frontend : [http://localhost:3000](http://localhost:3000)
   - Backend : [http://localhost:8000](http://localhost:8080)
   - En ligne : [https://talkmaster.stroyco.eu](https://talkmaster.stroyco.eu)

### Lancement avec les images GHCR

Les images Docker prêtes à l'emploi sont publiées sur le registre GitHub Container Registry (GHCR) à chaque mise à jour de `main`.
Le fichier [`docker-compose.ghcr.yml`](docker-compose.ghcr.yml) vous permet de démarrer l'application sans reconstruire les images :

```bash
docker compose -f docker-compose.ghcr.yml up -d
```

Quelques points importants :

- Par défaut, le conteneur backend génère la clé applicative (`APP_KEY`), exécute les migrations et optimise le cache Laravel. Vous pouvez désactiver ces actions en passant les variables `LARAVEL_GENERATE_APP_KEY`, `LARAVEL_RUN_MIGRATIONS` ou `LARAVEL_OPTIMIZE` à `false`.
- Toutes les variables présentes dans `.env.example` peuvent être surchargées via des variables d'environnement Docker. Le point d'entrée applique automatiquement les valeurs reçues et les persiste dans le fichier `.env` du conteneur.
- Le volume nommé `laravel-storage` conserve les fichiers générés (uploads, caches). Pensez à le sauvegarder si vous souhaitez conserver ces données entre les déploiements.
- L'image frontend s'attend à ce que l'API soit accessible via le service `back-talkmaster` (alias réseau `nginx-talkmaster`) exposé sur le port `8080`. Pour pointer vers une autre API, il est nécessaire de reconstruire l'image avec `VITE_API_URL` configurée (voir `docker/front.prod.dockerfile`).
