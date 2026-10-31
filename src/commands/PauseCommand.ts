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
        const member = interaction.member;

        if (!queue || !queue.channel) {
            await interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!member.voice.channel || member.voice.channelId !== queue.channel.id) {
            await interaction.reply({ content: '❌ You need to be in a voice channel to pause music.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        queue.node.pause();

        await interaction.reply({ content: `⏸️ Paused **[${queue.currentTrack?.title}](<${queue.currentTrack?.url}>)**.`, flags: [MessageFlags.Ephemeral] });
    }
}

export default new PauseCommand();