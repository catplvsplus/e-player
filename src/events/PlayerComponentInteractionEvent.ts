import { Colors } from 'discord.js';
import { BaseModule } from 'reciple';
import { InteractionListenerBuilder, InteractionListenerType, type InteractionListenerData } from '@reciple/modules';
import SkipCommand from '../commands/SkipCommand.js';
import ResumeCommand from '../commands/ResumeCommand.js';
import PauseCommand from '../commands/PauseCommand.js';
import PreviousCommand from '../commands/PreviousCommand.js';
import RepeatCommand from '../commands/RepeatCommand.js';
import UnshuffleCommand from '../commands/UnshuffleCommand.js';
import ShuffleCommand from '../commands/ShuffleCommand.js';
import EPlayer, { type QueueMetadata } from '../EPlayer.js';

export class PlayerComponentInteractionEvent extends BaseModule {
    public interactions: InteractionListenerData[] = [
        new InteractionListenerBuilder()
            .setType(InteractionListenerType.Button)
            .setFilter(i => i.customId.startsWith('player'))
            .setExecute(async interaction => {
                if (!interaction.inCachedGuild()) return;

                const queue = EPlayer.player.queues.get<QueueMetadata>(interaction.guildId);

                if (queue?.metadata.nowPlayingMessage?.id !== interaction.message.id) {
                    await interaction.reply(EPlayer.createSimpleContainerMessage({
                        content: '❌ This button interaction is no longer valid.',
                        color: Colors.Red
                    }));
                    return;
                }

                switch (interaction.customId) {
                    case 'player-repeat':
                        await RepeatCommand.repeat(interaction);
                        break;
                    case 'player-previous':
                        await PreviousCommand.previous(interaction);
                        break;
                    case 'player-toggle-pause':
                        if (!queue || !queue.channel) {
                            await interaction.reply(EPlayer.createSimpleContainerMessage({
                                content: '❌ There is no song currently playing.',
                                color: Colors.Red
                            }));
                            return;
                        }

                        if (queue.node.isPaused()) {
                            await ResumeCommand.resume(interaction);
                        } else {
                            await PauseCommand.pause(interaction);
                        }
                        break;
                    case 'player-skip':
                        await SkipCommand.skip(interaction);
                        break;
                    case 'player-shuffle':
                        if (!queue || !queue.channel) {
                            await interaction.reply(EPlayer.createSimpleContainerMessage({
                                content: '❌ There is no song currently playing.',
                                color: Colors.Red
                            }));
                            return;
                        }

                        if (queue.isShuffling) {
                            await UnshuffleCommand.unshuffle(interaction);
                        } else {
                            await ShuffleCommand.shuffle(interaction);
                        }
                        break;
                    default:
                        await interaction.reply(EPlayer.createSimpleContainerMessage({
                            content: '❌ Unknown button interaction.',
                            color: Colors.Red
                        }));
                        break;
                }
            })
            .toJSON()
    ];
}

export default new PlayerComponentInteractionEvent();