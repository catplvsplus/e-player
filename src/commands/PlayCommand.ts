import { InteractionContextType, MessageFlags } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer, { type QueueMetadata } from '../EPlayer.js';
import { InteractionListenerBuilder, InteractionListenerType, type InteractionListenerData } from '@reciple/modules';

export class PlayCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from a given URL or search query.')
        .setContexts(InteractionContextType.Guild)
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The URL or search query of the song to play.')
                .setAutocomplete(true)
                .setRequired(true)
        )
        .toJSON();

    public interactions: InteractionListenerData[] = [
        new InteractionListenerBuilder()
            .setType(InteractionListenerType.Autocomplete)
            .setFilter(i => i.commandName === 'play')
            .setExecute(async interaction => {
                if (!interaction.inCachedGuild()) return;

                const query = interaction.options.getString('query', true);
                const results = await EPlayer.player
                    .search(query, { requestedBy: interaction.user as any })
                    .catch(() => null);

                await interaction.respond(
                    results?.tracks
                        .slice(0, 10)
                        .map((t) => ({
                            name: t.title,
                            value: t.url,
                        }))
                    ?? []
                );
            })
            .toJSON()
    ];

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        const query = data.interaction.options.getString('query', true);
        const member = data.interaction.member;

        if (!member.voice.channel) {
            await data.interaction.reply({ content: '❌ You need to be in a voice channel to play music.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        await data.interaction.deferReply();

        try {
            const { track } = await EPlayer.player.play<QueueMetadata>(
                member.voice.channel as any,
                query,
                {
                    requestedBy: data.interaction.user as any,
                    nodeOptions: {
                        metadata: {
                            interaction: data.interaction,
                            channel: data.interaction.channel,
                        }
                    },
                },
            );

            await data.interaction.editReply(`🎵 Added **[${track.title}](<${track.url}>)** to the queue.`);
        } catch (error) {
            await data.interaction.followUp(`❌ ${error}`);
        }
    }
}

export default new PlayCommand();