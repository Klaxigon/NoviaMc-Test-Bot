const { Client, GatewayIntentBits, MessageEmbed } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const clientId = '//';
const guildId = '//';

const commands = [
  {
      name: 'kick',
      description: 'Kickt einen User vom Discord-Server',
      type: 1,
      options: [
          {
              name: 'user',
              type: 6,
              description: 'Der zu kickende Benutzer',
              required: true,
          },
          {
              name: 'reason',
              type: 3,
              description: 'Der Grund für den Kick',
              required: true,
          },
      ],
  },
  {
      name: 'info',
      description: 'Gibt Informationen über einen Benutzer zurück',
      type: 1,
      options: [
          {
              name: 'user',
              type: 6,
              description: 'Der Benutzer, über den Informationen abgerufen werden sollen',
              required: true,
          },
      ],
  },
   {
        name: 'givepunish',
        description: 'Vergibt die Rolle "Punish" an einen Benutzer.',
        type: 1,
        options: [
            {
                name: 'user',
                type: 6,
                description: 'Der Benutzer, dem die Rolle "Punish" gegeben werden soll.',
                required: true,
            },
        ],
    },
    {
        name: 'delpunish',
        description: 'Entzieht die Rolle "Punish" von einem Benutzer.',
        type: 1,
        options: [
            {
                name: 'user',
                type: 6,
                description: 'Der Benutzer, dem die Rolle "Punish" entzogen werden soll.',
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: '9' }).setToken('//');

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const client = new Client({ 
  intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers, 
  ],
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'kick') {
    const user = options.getUser('user');
    const reason = options.getString('reason');

    if (!interaction.member.roles.cache.some(role => role.name === 'Punish')) {
        return interaction.reply('Du hast nicht die Berechtigung, diesen Befehl zu verwenden.');
    }

    try {
        await interaction.guild.members.kick(user, reason);

        const kickEmbed = {
          color: 0xff0000, 
          title: 'Benutzer gekickt',
          description: `Benutzer @${user.tag} wurde aus dem Server gekickt.`,
          fields: [
              { name: 'Grund', value: reason },
          ],
          timestamp: new Date(),
          footer: {
              text: `Server: ${interaction.guild.name}`,
              icon_url: interaction.guild.iconURL({ dynamic: true }) || undefined,
          },
      };

      interaction.reply({ embeds: [kickEmbed] });
  } catch (error) {
      console.error(error);
      interaction.reply('Es gab einen Fehler beim Kicken des Benutzers.');
  }

} else if (commandName === 'givepunish') {
    const targetMember = options.getMember('user');

    try {
        const punishRole = interaction.guild.roles.cache.find(role => role.name === 'Punish');
        
        if (!punishRole) {
            return interaction.reply('Die Rolle "Punish" wurde auf diesem Server nicht gefunden.');
        }

        await targetMember.roles.add(punishRole);
        interaction.reply(`Benutzer ${targetMember.user.tag} hat nun die Rolle "Punish".`);
    } catch (error) {
        console.error(error);
        interaction.reply('Es gab einen Fehler beim Hinzufügen der Rolle "Punish" für den Benutzer.');
    }


} else if (commandName === 'delpunish') {
    const targetUser = options.getUser('user');

    try {
        const punishRole = interaction.guild.roles.cache.find(role => role.name === 'Punish');
        
        if (!punishRole) {
            return interaction.reply('Die Rolle "Punish" wurde auf diesem Server nicht gefunden.');
        }

        const member = interaction.guild.members.cache.get(targetUser.id);

        if (!member) {
            return interaction.reply('Der Benutzer wurde nicht gefunden.');
        }

        if (!member.roles.cache.has(punishRole.id)) {
            return interaction.reply(`Der Benutzer ${targetUser.tag} hat die Rolle "Punish" nicht.`);
        }

        await member.roles.remove(punishRole);
        interaction.reply(`Die Rolle "Punish" wurde dem Benutzer ${targetUser.tag} entzogen.`);
    } catch (error) {
        console.error(error);
        interaction.reply('Es gab einen Fehler beim Entfernen der Rolle "Punish" für den Benutzer.');
    }


  } else if (commandName === 'info') {
   
    if (!interaction.member.roles.cache.some(role => role.name === 'Punish')) {
        return interaction.reply('Du hast nicht die Berechtigung, diesen Befehl zu verwenden.');
    }

    const user = options.getUser('user');

    const joinedAt = user.joinedAt ? user.joinedAt.toLocaleString() : 'Unbekannt';
    const userId = user.id;
    const banned = await interaction.guild.bans.fetch().then(bans => bans.has(userId));
    const currentChannel = user.presence?.clientStatus?.desktop || 'Nicht im Voice-Channel';

    const infoEmbed = {
        title: `${user.tag} Informationen`,
        fields: [
            { name: 'Beigetreten am', value: joinedAt },
            { name: 'Benutzer ID', value: userId },
            { name: 'Gebannt', value: banned ? 'Ja' : 'Nein' },
            { name: 'Aktueller Channel', value: currentChannel },
        ],
         timestamp: new Date(),
          footer: {
              text: `Server: ${interaction.guild.name}`,
              icon_url: interaction.guild.iconURL({ dynamic: true }) || undefined,
          },
      };

    interaction.reply({ embeds: [infoEmbed] });
}
});


client.login('//');
