require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuration
const CHECK_INTERVAL = 1800000; // Vérifier toutes les 30 minutes
let lastCheckedSteamGames = new Set();
let lastCheckedEpicGames = new Set();

async function getFreeEpicGames() {
    try {
        const response = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions');
        const data = await response.json();
        
        const freeGames = [];
        if (data.data && data.data.Catalog && data.data.Catalog.searchStore) {
            const games = data.data.Catalog.searchStore.elements;
            
            for (const game of games) {
                // Vérifier si le jeu est gratuit
                const promotions = game.promotions;
                if (promotions && promotions.promotionalOffers && promotions.promotionalOffers.length > 0) {
                    const offers = promotions.promotionalOffers[0].promotionalOffers;
                    if (offers && offers.length > 0) {
                        const now = new Date();
                        const startDate = new Date(offers[0].startDate);
                        const endDate = new Date(offers[0].endDate);
                        
                        if (now >= startDate && now <= endDate && offers[0].discountSetting.discountPercentage === 0) {
                            freeGames.push({
                                name: game.title,
                                url: `https://store.epicgames.com/fr/p/${game.urlSlug}`,
                                image: game.keyImages ? game.keyImages[0].url : null,
                                originalPrice: game.price.totalPrice.originalPrice,
                                endDate: endDate
                            });
                        }
                    }
                }
            }
        }
        return freeGames;
    } catch (error) {
        console.error('Erreur lors de la récupération des jeux gratuits Epic:', error);
        return [];
    }
}

async function getFreeSteamGames() {
    try {
        const response = await fetch('https://store.steampowered.com/api/featuredcategories');
        const data = await response.json();
        
        const freeGames = [];
        if (data.specials && data.specials.items) {
            for (const item of data.specials.items) {
                if (item.final_price === 0 && item.original_price > 0) {
                    freeGames.push({
                        name: item.name,
                        url: `https://store.steampowered.com/app/${item.id}`,
                        image: item.large_capsule_image,
                        originalPrice: item.original_price
                    });
                }
            }
        }
        return freeGames;
    } catch (error) {
        console.error('Erreur lors de la récupération des jeux gratuits Steam:', error);
        return [];
    }
}

async function sendSteamGamesMessage(channel) {
    const freeGames = await getFreeSteamGames();
    
    if (freeGames.length === 0) {
        channel.send('Aucun jeu gratuit trouvé actuellement sur Steam. 😢');
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('🎮 Jeux Gratuits sur Steam')
        .setColor('#00ff00')
        .setDescription('Voici les jeux actuellement gratuits sur Steam :')
        .setTimestamp();

    for (const game of freeGames) {
        embed.addFields({
            name: game.name,
            value: `Prix original: ${(game.originalPrice / 100).toFixed(2)}€\n[Voir sur Steam](${game.url})`,
            inline: false
        });
    }

    try {
        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
    }
}

async function sendEpicGamesMessage(channel) {
    const freeGames = await getFreeEpicGames();
    
    if (freeGames.length === 0) {
        channel.send('Aucun jeu gratuit trouvé actuellement sur Epic Games. 😢');
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('🎮 Jeux Gratuits sur Epic Games')
        .setColor('#0078F2')  // Couleur d'Epic Games
        .setDescription('Voici les jeux actuellement gratuits sur Epic Games :')
        .setTimestamp();

    for (const game of freeGames) {
        const endDate = new Date(game.endDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        embed.addFields({
            name: game.name,
            value: `Prix original: ${(game.originalPrice / 100).toFixed(2)}€\nGratuit jusqu'au : ${endDate}\n[Voir sur Epic Games](${game.url})`,
            inline: false
        });

        if (game.image) {
            embed.setImage(game.image);
        }
    }

    try {
        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
    }
}

async function checkAndNotifyNewGames(channel) {
    // Vérifier Steam
    const steamGames = await getFreeSteamGames();
    for (const game of steamGames) {
        if (!lastCheckedSteamGames.has(game.name)) {
            const embed = new EmbedBuilder()
                .setTitle('🎮 Nouveau Jeu Gratuit sur Steam!')
                .setDescription(`**${game.name}** est maintenant gratuit sur Steam!`)
                .setColor('#00ff00')
                .setURL(game.url)
                .setImage(game.image)
                .addFields(
                    { name: 'Prix original', value: `${(game.originalPrice / 100).toFixed(2)}€`, inline: true },
                    { name: 'Prix actuel', value: 'GRATUIT!', inline: true }
                )
                .setTimestamp();

            try {
                await channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message Steam:', error);
            }
        }
    }

    // Vérifier Epic Games
    const epicGames = await getFreeEpicGames();
    for (const game of epicGames) {
        if (!lastCheckedEpicGames.has(game.name)) {
            const endDate = new Date(game.endDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const embed = new EmbedBuilder()
                .setTitle('🎮 Nouveau Jeu Gratuit sur Epic Games!')
                .setDescription(`**${game.name}** est maintenant gratuit sur Epic Games!`)
                .setColor('#0078F2')
                .setURL(game.url)
                .addFields(
                    { name: 'Prix original', value: `${(game.originalPrice / 100).toFixed(2)}€`, inline: true },
                    { name: 'Gratuit jusqu\'au', value: endDate, inline: true }
                )
                .setTimestamp();

            if (game.image) {
                embed.setImage(game.image);
            }

            try {
                await channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message Epic:', error);
            }
        }
    }

    // Mettre à jour les listes des jeux vérifiés
    lastCheckedSteamGames.clear();
    lastCheckedEpicGames.clear();
    steamGames.forEach(game => lastCheckedSteamGames.add(game.name));
    epicGames.forEach(game => lastCheckedEpicGames.add(game.name));
}

// Gestionnaire de commandes
client.on('messageCreate', async (message) => {
    // Ignorer les messages des bots
    if (message.author.bot) return;

    const command = message.content.toLowerCase();
    
    // Commandes séparées pour Steam et Epic Games
    if (command === '!freegamessteam') {
        await sendSteamGamesMessage(message.channel);
    } else if (command === '!freegamesepic') {
        await sendEpicGamesMessage(message.channel);
    } else if (command === '!freegames') {
        // Afficher les deux
        await sendSteamGamesMessage(message.channel);
        await sendEpicGamesMessage(message.channel);
    }
});

client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}!`);
    
    // Générer le lien d'invitation avec les permissions nécessaires
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=274877910016&scope=bot`;
    console.log('Lien d\'invitation du bot:', inviteLink);
    
    // Trouver le canal configuré
    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) {
        console.error('Canal non trouvé! Vérifiez CHANNEL_ID dans le fichier .env');
        return;
    }

    // Vérifier immédiatement puis toutes les 30 minutes
    checkAndNotifyNewGames(channel);
    setInterval(() => checkAndNotifyNewGames(channel), CHECK_INTERVAL);
});

client.login(process.env.DISCORD_TOKEN); 
