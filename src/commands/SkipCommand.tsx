import { Colors, InteractionContextType, MessageFlags } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';
import type { RepliableInteraction } from 'discord.js';
import { Bold, Hyperlink } from '@reciple/jsx';

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

        const nextTrack = queue.history.nextTrack;

        if (!nextTrack) {
            await interaction.reply(EPlayer.createSimpleContainerMessage({
                content: '❌ There is no next song in the queue.',
                color: Colors.Red
            }));
            return;
        }

        if (!hasPermission) {
            queue.metadata?.skipVotes.add(member.id);

            const requiredVotes = Math.ceil(queue.channel.members.filter(m => !m.user.bot).size / 2);
            const currentVotes = queue.metadata?.skipVotes.size ?? 0;

            if (currentVotes < requiredVotes) {
                await interaction.reply({ 
                    ...EPlayer.createSimpleContainerMessage({
                        content: `⏩ ${member.user.username} has voted to skip the current song. (${currentVotes}/${requiredVotes} votes)`,
                        color: Colors.Yellow
                    }),
                    flags: [MessageFlags.IsComponentsV2]
                });
                return;
            }
        }

        EPlayer.clearQueueVotes(queue);

        await queue.history.next();
        await interaction.reply({
            ...EPlayer.createSimpleContainerMessage({
                content: `⏩ Playing next song ${<Bold><Hyperlink url={nextTrack.url}>{nextTrack.title}</Hyperlink></Bold>}`
            }),
            flags: [MessageFlags.IsComponentsV2]
        });
    }
}

export default new SkipCommand();