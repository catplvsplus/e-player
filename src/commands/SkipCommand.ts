import { InteractionContextType } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';
import type { RepliableInteraction } from 'discord.js';

export class SkipCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the currently playing song.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.skip(data.interaction);
    }

    public async skip(interaction: RepliableInteraction<'cached'>): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);
        const member = interaction.member;

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });
        const hasPermission = await EPlayer.checkUserHasPermission({ queue, interaction, permission: 'MuteMembers', replyToInteraction: false });

        if (!hasConnection || !userInVoiceChannel || !queue?.channel) return;

        if (!hasPermission) {
            queue.metadata?.skipVotes.add(member.id);

            const requiredVotes = Math.ceil(queue.channel.members.filter(m => !m.user.bot).size / 2);
            const currentVotes = queue.metadata?.skipVotes.size ?? 0;

            if (currentVotes < requiredVotes) {
                await interaction.reply({ content: `⏩ ${member.user.username} has voted to skip the current song. (${currentVotes}/${requiredVotes} votes)` });
                return;
            }
        }

        queue.node.skip();
        await interaction.reply({ content: `⏩ Skipped **[${queue.currentTrack?.title}](<${queue.currentTrack?.url}>)**.` });
    }
}

export default new SkipCommand();