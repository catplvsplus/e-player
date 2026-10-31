import { AppleMusicExtractor, SoundCloudExtractor, SpotifyExtractor } from '@discord-player/extractor';
import type { Logger } from '@prtty/print';
import { Player, type GuildQueue } from 'discord-player';
import { hyperlink, MessageFlags, type CommandInteraction, type SendableChannels } from 'discord.js';
import { BaseModule } from 'reciple';
import NowPlayingCommand from './commands/NowPlayingCommand.js';
import type { Message } from 'discord.js';
import { InteractionListenerBuilder, InteractionListenerType, type InteractionListenerData } from '@reciple/modules';
import SkipCommand from './commands/SkipCommand.js';
import ResumeCommand from './commands/ResumeCommand.js';
import PauseCommand from './commands/PauseCommand.js';
import PreviousCommand from './commands/PreviousCommand.js';
import { YoutubeExtractor } from 'discord-player-youtubei';
import RepeatCommand from './commands/RepeatCommand.js';
import UnshuffleCommand from './commands/UnshuffleCommand.js';
import ShuffleCommand from './commands/ShuffleCommand.js';

export class EPlayer extends BaseModule {
    private _player!: Player;

    public logger: Logger = useLogger().clone({ label: 'EPlayer' });

    public interactions: InteractionListenerData[] = [
        new InteractionListenerBuilder()
            .setType(InteractionListenerType.Button)
            .setFilter(i => i.customId.startsWith('player'))
            .setExecute(async interaction => {
                if (!interaction.inCachedGuild()) return;

                switch (interaction.customId) {
                    case 'player-repeat':
                        await RepeatCommand.repeat(interaction);
                        break;
                    case 'player-previous':
                        await PreviousCommand.previous(interaction);
                        break;
                    case 'player-toggle-pause': {
                        const queue = this.player.queues.get(interaction.guildId);

                        if (!queue || !queue.channel) {
                            await interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
                            return;
                        }

                        if (queue.node.isPaused()) {
                            await ResumeCommand.resume(interaction);
                        } else {
                            await PauseCommand.pause(interaction);
                        }
                        break;
                    }
                    case 'player-skip':
                        await SkipCommand.skip(interaction);
                        break;
                    case 'player-shuffle': {
                        const queue = this.player.queues.get(interaction.guildId);

                        if (!queue || !queue.channel) {
                            await interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
                            return;
                        }

                        if (queue.isShuffling) {
                            await UnshuffleCommand.unshuffle(interaction);
                        } else {
                            await ShuffleCommand.shuffle(interaction);
                        }
                        break;
                    }
                    default:
                        await interaction.reply({ content: '❌ Unknown button interaction.', flags: [MessageFlags.Ephemeral] });
                        break;
                }
            })
            .toJSON()
    ];

    public get player(): Player {
        if (!this._player) {
            throw new Error('Player is not initialized. Make sure to call onEnable() with the GuildVoiceStates intent enabled before accessing the player.');
        }

        return this._player;
    }

    public async onEnable(): Promise<void> {
        if (!this.client.options.intents.has('GuildVoiceStates')) {
            throw new Error('EPlayer requires the GuildVoiceStates intent to be enabled.');
        }

        this._player = new Player(this.client as any);

        await this.player.extractors.register(YoutubeExtractor, {
            cookie: process.env.YOUTUBE_COOKIE,
            downloads: {
                ytdlp: {
                    cookiePath: process.env.YOUTUBE_COOKIE_PATH,
                }
            }
        });

        await this.player.extractors.register(SpotifyExtractor, {
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });

        await this.player.extractors.register(AppleMusicExtractor, {});

        await this.player.extractors.register(SoundCloudExtractor, {
            clientId: process.env.SOUNDCLOUD_CLIENT_ID,
            oauthToken: process.env.SOUNDCLOUD_OAUTH_TOKEN,
            proxy: process.env.SOUNDCLOUD_PROXY
        })
    }

    public async onReady(): Promise<void> {
        this.player.events.on('playerError', (queue: GuildQueue<QueueMetadata>, error, track) => {
            queue.metadata?.channel?.send(`❌ ${error.message}\n${hyperlink(track.title, track.url)}`);
        });

        this.player.events.on('playerStart', async (queue: GuildQueue<QueueMetadata>) => {
            await queue.metadata?.nowPlayingMessage?.delete().catch(() => null);
            queue.metadata.nowPlayingMessage = await queue.metadata?.channel?.send(NowPlayingCommand.createNowPlayingMessageComponents({ queue, progressBar: false, controls: 'enabled' })) ?? null;
        });

        this.player.events.on('disconnect', async (queue: GuildQueue<QueueMetadata>) => {
            await queue.metadata?.channel?.send(`⛓️‍💥 Disconnected from voice channel.`);
            await queue.metadata?.nowPlayingMessage?.delete().catch(() => null);
        });

        this.player.events.on('playerSkip', async (queue: GuildQueue<QueueMetadata>) => {
            queue.metadata.skipVotes.clear();
        });

        this.player.events.on('playerPause', async (queue: GuildQueue<QueueMetadata>) => {
            await this.updateNowPlayingMessage(queue);
        });

        this.player.events.on('playerResume', async (queue: GuildQueue<QueueMetadata>) => {
            await this.updateNowPlayingMessage(queue);
        });
    }

    public async onDisable(): Promise<void> {
        this.player.destroy();
    }

    public async updateNowPlayingMessage(queue: GuildQueue<QueueMetadata>): Promise<void> {
        if (!queue.metadata?.nowPlayingMessage) return;

        await queue.metadata.nowPlayingMessage.edit(NowPlayingCommand.createNowPlayingMessageComponents({ queue, progressBar: false, controls: 'enabled' }));
    }
}

export interface QueueMetadata {
    interaction: CommandInteraction;
    channel: SendableChannels|null;
    nowPlayingMessage: Message|null;
    skipVotes: Set<string>;
    previousVotes: Set<string>;
}

export default new EPlayer();