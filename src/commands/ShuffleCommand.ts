import { InteractionContextType, MessageFlags, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';

export class ShuffleCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffles the current queue.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.shuffle(data.interaction);
    }

    public async shuffle(interaction: RepliableInteraction<'cached'>): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);
        const member = interaction.member;

        if (!queue || !queue.channel) {
            await interaction.reply({ content: '❌ There is no queue in this server.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!member.voice.channel || member.voice.channelId !== queue.channel.id) {
            await interaction.reply({ content: '❌ You need to be in a voice channel to shuffle the queue.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!queue.channel.permissionsFor(member.id)?.has('MuteMembers')) {
            await interaction.reply({ content: '❌ You do not have permission to shuffle the queue.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        queue.enableShuffle();

        await interaction.reply({ content: `🔀 Shuffled **${queue.size}** songs in queue.` });
        await EPlayer.updateNowPlayingMessage(queue);
    }
}

export default new ShuffleCommand();