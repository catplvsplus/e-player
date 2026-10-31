import { hyperlink, InteractionContextType, MessageFlags, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';

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

        if (!hasConnection || !userInVoiceChannel) return;

        const track = queue!.currentTrack;

        if (!track) {
            await interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        queue?.node.resume();

        await interaction.reply({ content: `▶️ Resumed playing **${hyperlink(track.title, track.url)}**`, flags: [MessageFlags.Ephemeral] });
    }
}

export default new ResumeCommand();