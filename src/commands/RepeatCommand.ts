import { QueueRepeatMode } from 'discord-player';
import { inlineCode, InteractionContextType, MessageFlags, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer from '../EPlayer.js';

export class RepeatCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('repeat')
        .setDescription('Repeats the current song.')
        .setContexts(InteractionContextType.Guild)
        .addIntegerOption(option => option
            .setName('mode')
            .setDescription('The repeat mode to set.')
            .setChoices(
                { name: 'Off', value: QueueRepeatMode.OFF },
                { name: 'Track', value: QueueRepeatMode.TRACK },
                { name: 'Queue', value: QueueRepeatMode.QUEUE }
            )
        )
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.repeat(data.interaction, data.interaction.options.getInteger('mode') as QueueRepeatMode ?? undefined);
    }

    public async repeat(interaction: RepliableInteraction<'cached'>, mode?: QueueRepeatMode): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);

        const hasConnection = await EPlayer.checkQueueConnection({ queue, interaction });
        const userInVoiceChannel = await EPlayer.checkUserInVoiceChannel({ queue, interaction });
        const hasPermission = await EPlayer.checkUserHasPermission({ queue, interaction, permission: 'MuteMembers' });

        if (!hasConnection || !userInVoiceChannel || !hasPermission || !queue?.channel) return;

        const newMode = mode ?? this.toggleRepeatMode(queue.repeatMode ?? QueueRepeatMode.OFF);

        queue.setRepeatMode(newMode);

        await interaction.reply({ content: `✅ Repeat mode set to ${inlineCode(this.getRepeatModeName(newMode))}.`, flags: [MessageFlags.Ephemeral] });
        await EPlayer.updateNowPlayingMessage(queue);
    }

    public toggleRepeatMode(mode: QueueRepeatMode): QueueRepeatMode {
        switch (mode) {
            case QueueRepeatMode.OFF:
                return QueueRepeatMode.QUEUE;
            case QueueRepeatMode.QUEUE:
                return QueueRepeatMode.TRACK;
            case QueueRepeatMode.TRACK:
            case QueueRepeatMode.AUTOPLAY:
                return QueueRepeatMode.OFF;
        }
    }

    public getRepeatModeName(mode: QueueRepeatMode): string {
        switch (mode) {
            case QueueRepeatMode.OFF:
                return 'Off';
            case QueueRepeatMode.TRACK:
                return 'Track';
            case QueueRepeatMode.QUEUE:
                return 'Queue';
            case QueueRepeatMode.AUTOPLAY:
                return 'Autoplay';
        }
    }
}

export default new RepeatCommand();