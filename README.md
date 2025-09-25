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
