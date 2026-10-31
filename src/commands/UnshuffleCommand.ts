import { InteractionContextType, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';

export class UnshuffleCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('unshuffle')
        .setDescription('Unshuffles the current queue.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.unshuffle(data.interaction);
    }

    public async unshuffle(interaction: RepliableInteraction<'cached'>): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });
        const hasPermission = await EPlayer.checkUserHasPermission({ queue, interaction, permission: 'MuteMembers' });

        if (!hasConnection || !userInVoiceChannel || !hasPermission || !queue?.channel) return;

        queue.disableShuffle();

        await interaction.reply(EPlayer.createSimpleContainerMessage({
            content: `🔀 Unshuffled songs in queue.`
        }));

        await EPlayer.updateNowPlayingMessage(queue);
    }
}

export default new UnshuffleCommand();