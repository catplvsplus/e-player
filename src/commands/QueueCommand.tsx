import { InteractionContextType, MessageFlags, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer, { type QueueMetadata } from '../EPlayer.js';
import type { GuildQueue } from 'discord-player';

export class QueueCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the current music queue.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        const queue = EPlayer.player.queues.get(data.interaction.guildId);

        if (!queue || queue?.isEmpty()) {
            await data.interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        await this.createQueuePagination(data.interaction, queue);
    }

    public async createQueuePagination(interaction: RepliableInteraction, queue: GuildQueue<QueueMetadata>): Promise<void> {
        await interaction.deferReply();
        // TODO: Implement queue pagination logic here
    }
}

export default new QueueCommand();