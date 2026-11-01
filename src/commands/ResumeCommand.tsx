import { InteractionContextType, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';
import { Bold, Hyperlink } from '@reciple/jsx';

export class ResumeCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes the currently playing song.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.resume(data.interaction);
    }

    public async resume(interaction: RepliableInteraction<'cached'>): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });
        const isPlaying = await EPlayer.checkQueuePlaying({ queue, interaction });

        if (!hasConnection || !userInVoiceChannel || !isPlaying || !queue?.channel) return;

        const track = queue.currentTrack!;

        queue.node.resume();

        await interaction.reply(EPlayer.createSimpleContainerMessage({
            content: `▶️ Resumed ${<Bold><Hyperlink url={track.url}>{track.title}</Hyperlink></Bold>}`
        }));
    }
}

export default new ResumeCommand();