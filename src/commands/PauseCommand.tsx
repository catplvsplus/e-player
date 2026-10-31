import { InteractionContextType } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';
import type { RepliableInteraction } from 'discord.js';
import { Bold, Hyperlink } from '@reciple/jsx';

export class PauseCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the currently playing song.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.pause(data.interaction);
    }

    public async pause(interaction: RepliableInteraction<'cached'>): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });
        const isPlaying = await EPlayer.checkQueuePlaying({ queue, interaction });

        if (!hasConnection || !userInVoiceChannel || !isPlaying || !queue?.channel) return;

        const track = queue.currentTrack!;

        queue.node.pause();

        await interaction.reply(EPlayer.createSimpleContainerMessage({
            content: `⏸️ Paused ${<Bold><Hyperlink url={track.url}>{track.title}</Hyperlink></Bold>}`
        }));
    }
}

export default new PauseCommand();