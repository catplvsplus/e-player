import { InteractionContextType, MessageFlags, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';

export class ResumeCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes the currently playing song.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.resume(data.interaction);
    }

    public async resume(interaction: RepliableInteraction<'cached'>): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);
        const member = interaction.member;

        if (!queue || !queue.channel) {
            await interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!member.voice.channel || member.voice.channelId !== queue.channel.id) {
            await interaction.reply({ content: '❌ You need to be in a voice channel to resume music.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        queue.node.resume();

        await interaction.reply({ content: `▶️ Resumed **[${queue.currentTrack?.title}](<${queue.currentTrack?.url}>)**.`, flags: [MessageFlags.Ephemeral] });
    }
}

export default new ResumeCommand();