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

### Étapes

1. Cloner le dépôt :

   ```bash
   git clone https://github.com/GoofyTeam/GoofyTalkmaster.git
   cd GoofyTalkmaster
   ```

2. Lancer les conteneurs :

   ```bash
   docker-compose up -d
   make fresh
   ```

3. Accéder à l'application :
   - Frontend : [http://localhost:3000](http://localhost:3000)
   - Backend : [http://localhost:8000](http://localhost:8080)
   - En ligne : [https://talkmaster.stroyco.eu](https://talkmaster.stroyco.eu)
