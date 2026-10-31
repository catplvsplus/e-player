import { InteractionContextType, type RepliableInteraction } from 'discord.js';
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

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });
        const hasPermission = await EPlayer.checkUserHasPermission({ queue, interaction, permission: 'MuteMembers' });

        if (!hasConnection || !userInVoiceChannel || !hasPermission || !queue?.channel) return;

        queue.enableShuffle();

        await interaction.reply(EPlayer.createSimpleContainerMessage({
            content: `🔀 Shuffled songs in queue.`
        }));

        await EPlayer.updateNowPlayingMessage(queue);
    }
}

export default new ShuffleCommand();