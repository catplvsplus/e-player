import { QueueRepeatMode } from 'discord-player';
import { InteractionContextType, MessageFlags, type RepliableInteraction } from 'discord.js';
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
                { name: 'Queue', value: QueueRepeatMode.QUEUE },
                { name: 'Autoplay', value: QueueRepeatMode.AUTOPLAY }
            )
        )
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        await this.repeat(data.interaction, data.interaction.options.getInteger('mode') as QueueRepeatMode ?? undefined);
    }

    public async repeat(interaction: RepliableInteraction<'cached'>, mode?: QueueRepeatMode): Promise<void> {
        const queue = EPlayer.player.queues.get(interaction.guildId);
        const member = interaction.member;

        if (!queue || !queue.channel) {
            await interaction.reply({ content: '❌ There is no queue in this server.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        const newMode = mode ?? this.toggleRepeatMode(queue.repeatMode ?? QueueRepeatMode.OFF);

        if (!member.voice.channel || member.voice.channelId !== queue.channel.id) {
            await interaction.reply({ content: '❌ You need to be in a voice channel to change the repeat mode.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!queue.channel.permissionsFor(member.id)?.has('MuteMembers')) {
            await interaction.reply({ content: '❌ You do not have permission to change the repeat mode.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        await interaction.reply({ content: `✅ Repeat mode set to ${newMode}.` });

        queue.setRepeatMode(newMode);
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
}

export default new RepeatCommand();