import { InteractionContextType, type RepliableInteraction } from 'discord.js';
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

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });
        const hasPermission = await EPlayer.checkUserHasPermission({ queue, interaction, permission: 'MuteMembers' });

        if (!hasConnection || !userInVoiceChannel || !hasPermission) return;

        queue?.node.stop();
        await interaction.reply(EPlayer.createSimpleContainerMessage({
            content: `⏹️ Stopped playing.`
        }));
    }
}

export default new StopCommand();