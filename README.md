# LaplanqueBot - Bot Discord pour les jeux gratuits Steam

Ce bot Discord surveille automatiquement les jeux qui deviennent gratuits sur Steam et envoie des notifications dans un canal Discord spécifié.

## Fonctionnalités

- Vérifie automatiquement les nouveaux jeux gratuits toutes les 30 minutes
- Envoie des notifications avec des embeds Discord contenant :
  - Le nom du jeu
  - Le lien vers la page Steam
  - L'image du jeu
  - Le prix original
  - La durée de l'offre (si disponible)

## Configuration

1. Installez Node.js sur votre machine si ce n'est pas déjà fait
2. Clonez ce dépôt
3. Installez les dépendances :
   ```bash
   npm install
   ```
4. Créez un fichier `.env` à la racine du projet avec les informations suivantes :
   ```
   DISCORD_TOKEN=votre_token_discord_ici
   CHANNEL_ID=votre_channel_id_ici
   ```

### Configuration du Bot Discord

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une nouvelle application
3. Dans la section "Bot" :
   - Cliquez sur "Reset Token" pour obtenir votre token
   - Activez les "Privileged Gateway Intents" suivants :
     - SERVER MEMBERS INTENT
     - MESSAGE CONTENT INTENT
4. Le bot générera automatiquement un lien d'invitation avec les permissions nécessaires au démarrage

### Permissions nécessaires

Le bot a besoin des permissions suivantes :
- Voir les salons
- Envoyer des messages
- Intégrer des liens
- Joindre des fichiers
- Voir les anciens messages

### Obtenir l'ID du canal

1. Activez le mode développeur dans Discord (Paramètres > Avancés > Mode développeur)
2. Faites clic droit sur le canal où vous voulez recevoir les notifications
3. Cliquez sur "Copier l'identifiant"
4. Collez l'ID dans votre fichier `.env`

## Lancement du bot

Pour démarrer le bot, exécutez :
```bash
npm start
```

Lors du démarrage, le bot affichera son lien d'invitation dans la console. Utilisez ce lien pour inviter le bot sur votre serveur.

## Maintenance

Le bot vérifie automatiquement les nouveaux jeux gratuits toutes les 30 minutes. Si vous souhaitez modifier cet intervalle, vous pouvez changer la valeur de `CHECK_INTERVAL` dans `index.js`. 
