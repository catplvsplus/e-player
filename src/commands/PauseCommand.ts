import { InteractionContextType, MessageFlags } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';
import type { RepliableInteraction } from 'discord.js';

export class PauseCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the currently playing song.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.pause(data.interaction);
    }

    public async pause(interaction: RepliableInteraction<'cached'>): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });

        if (!hasConnection || !userInVoiceChannel || !queue?.channel) return;

        queue.node.pause();

        await interaction.reply({ content: `⏸️ Paused **[${queue.currentTrack?.title}](<${queue.currentTrack?.url}>)**.`, flags: [MessageFlags.Ephemeral] });
    }
}

export default new PauseCommand();