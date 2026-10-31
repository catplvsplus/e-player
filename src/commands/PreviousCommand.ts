import { InteractionContextType } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';
import type { RepliableInteraction } from 'discord.js';

export class PreviousCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('previous')
        .setDescription('Plays the previous song in the queue.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.previous(data.interaction);
    }

    public async previous(interaction: RepliableInteraction<'cached'>): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);
        const member = interaction.member;

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });
        const hasPermission = await EPlayer.checkUserHasPermission({ queue, interaction, permission: 'MuteMembers', replyToInteraction: false });

        if (!hasConnection || !userInVoiceChannel || !queue?.channel) return;

        if (!hasPermission) {
            queue.metadata?.previousVotes.add(member.id);

            const requiredVotes = Math.ceil(queue.channel.members.filter(m => !m.user.bot).size / 2);
            const currentVotes = queue.metadata?.previousVotes.size ?? 0;

            if (currentVotes < requiredVotes) {
                await interaction.reply({ content: `⏪ ${member.user.username} has voted to play the previous song. (${currentVotes}/${requiredVotes} votes)` });
                return;
            }
        }

        queue.node.skip();
        await interaction.reply({ content: `⏪ Played previous song **[${queue.history.previousTrack?.title}](<${queue.history.previousTrack?.url}>)**.` });
    }
}

export default new PreviousCommand();