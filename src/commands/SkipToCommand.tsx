import { Colors, InteractionContextType, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';
import { InteractionListenerBuilder, InteractionListenerType, type InteractionListenerData } from '@reciple/modules';
import { Bold, Hyperlink } from '@reciple/jsx';

export class SkipToCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('skip-to')
        .setDescription('Skips to a specific song in the queue.')
        .setContexts(InteractionContextType.Guild)
        .addIntegerOption(option => option
            .setName('position')
            .setDescription('The position of the song in the queue to skip to.')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .toJSON();

    public interactions: InteractionListenerData[] = [
        new InteractionListenerBuilder()
            .setType(InteractionListenerType.Autocomplete)
            .setFilter(i => i.commandName == 'skip-to')
            .setExecute(async interaction => {
                if (!interaction.inCachedGuild()) return;

                const queue = EPlayer.player.queues.get(interaction.guildId);
                if (!queue) return;

                const focusedOption = interaction.options.getFocused(true);

                const choices = queue.tracks
                    .map((track, index) => ({ name: `${index + 1}. ${track.title}`, value: index + 1 }))
                    .filter(choice => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()) || choice.value.toString().includes(focusedOption.value))
                    .splice(0, 25);

                await interaction.respond(choices);
            })
            .toJSON()
    ];

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        const position = data.interaction.options.getInteger('position', true);
        await this.skipTo(data.interaction, position);
    }

    public async skipTo(interaction: RepliableInteraction<'cached'>, position: number): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });
        const hasPermission = await EPlayer.checkUserHasPermission({ queue, interaction, permission: 'MuteMembers' });

        if (!hasConnection || !userInVoiceChannel || !hasPermission || !queue) return;

        if (!queue || queue.tracks.size <= 1) {
            await interaction.reply(EPlayer.createSimpleContainerMessage({
                content: '❌ There are not enough songs in the queue to skip to a specific position.',
                color: Colors.Red
            }));
            return;
        }

        if (position < 1 || position > (queue.tracks.size ?? 0)) {
            await interaction.reply(EPlayer.createSimpleContainerMessage({
                content: `❌ Invalid position. Please provide a position between 1 and ${queue.tracks.size}.`,
                color: Colors.Red
            }));
            return;
        }

        const skipped = queue?.node.skipTo(position - 1);
        const track = queue.currentTrack;

        if (!skipped || !track) {
            await interaction.reply(EPlayer.createSimpleContainerMessage({
                content: '❌ Failed to skip to the specified position.',
                color: Colors.Red
            }));
            return;
        }

        EPlayer.clearQueueVotes(queue);

        await interaction.reply(EPlayer.createSimpleContainerMessage({
            content: `⏩ Skipped to ${<Bold><Hyperlink url={track.url}>{track.title}</Hyperlink></Bold>}`
        }));
    }
}

export default new SkipToCommand();