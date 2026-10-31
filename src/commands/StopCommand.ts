import { InteractionContextType, MessageFlags, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';

export class StopCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the currently playing song and clears the queue.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.stop(data.interaction);
    }

    public async stop(interaction: RepliableInteraction<'cached'>): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);
        const member = interaction.member;

        if (!queue || !queue.channel) {
            await interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!member.voice.channel || member.voice.channelId !== queue.channel.id) {
            await interaction.reply({ content: '❌ You need to be in a voice channel to stop music.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!queue.channel.permissionsFor(member.id)?.has('MuteMembers')) {
            await interaction.reply({ content: '❌ You do not have permission to stop the music.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        queue.node.stop();
        await interaction.reply({ content: `⏹️ Stopped playing.` });
    }
}

export default new StopCommand();