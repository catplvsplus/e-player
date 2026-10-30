import { InteractionContextType, MessageFlags } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';

export class SkipCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the currently playing song.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        const queue = EPlayer.player.queues.get(data.interaction.guildId);
        const member = data.interaction.member;

        if (!queue || queue?.isEmpty() || !queue.channel) {
            await data.interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!member.voice.channel || member.voice.channelId !== queue.channel.id) {
            await data.interaction.reply({ content: '❌ You need to be in a voice channel to pause music.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!queue.channel.permissionsFor(member.id)?.has('MuteMembers')) {
            queue.metadata?.skipVotes.add(member.id);

            const requiredVotes = Math.ceil(queue.channel.members.filter(m => !m.user.bot).size / 2);
            const currentVotes = queue.metadata?.skipVotes.size ?? 0;

            if (currentVotes < requiredVotes) {
                await data.interaction.reply({ content: `⏭️ ${member.user.username} has voted to skip the current song. (${currentVotes}/${requiredVotes} votes)`, flags: [MessageFlags.Ephemeral] });
                return;
            }
        }

        queue.node.skip();
        await data.interaction.reply({ content: `⏭️ Skipped **[${queue.currentTrack?.title}](<${queue.currentTrack?.url}>)**.`, flags: [MessageFlags.Ephemeral] });
    }
}

export default new SkipCommand();