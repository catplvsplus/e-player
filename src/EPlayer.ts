import { AppleMusicExtractor, AttachmentExtractor, SoundCloudExtractor, SpotifyExtractor } from '@discord-player/extractor';
import type { Logger } from '@prtty/print';
import { Player, type GuildQueue } from 'discord-player';
import { hyperlink, MessageFlags, type CommandInteraction, type SendableChannels } from 'discord.js';
import { BaseModule } from 'reciple';
import NowPlayingCommand from './commands/NowPlayingCommand.js';
import type { GuildMember, Message, PermissionResolvable } from 'discord.js';
import { InteractionListenerBuilder, InteractionListenerType, type InteractionListenerData } from '@reciple/modules';
import SkipCommand from './commands/SkipCommand.js';
import ResumeCommand from './commands/ResumeCommand.js';
import PauseCommand from './commands/PauseCommand.js';
import PreviousCommand from './commands/PreviousCommand.js';
import { YoutubeExtractor } from 'discord-player-youtubei';
import RepeatCommand from './commands/RepeatCommand.js';
import UnshuffleCommand from './commands/UnshuffleCommand.js';
import ShuffleCommand from './commands/ShuffleCommand.js';
import type { RepliableInteraction } from 'discord.js';

export class EPlayer extends BaseModule {
    private _player!: Player;

    public logger: Logger = useLogger().clone({ label: 'EPlayer' });

    public interactions: InteractionListenerData[] = [
        new InteractionListenerBuilder()
            .setType(InteractionListenerType.Button)
            .setFilter(i => i.customId.startsWith('player'))
            .setExecute(async interaction => {
                if (!interaction.inCachedGuild()) return;

                const queue = this.player.queues.get<QueueMetadata>(interaction.guildId);

                if (queue?.metadata.nowPlayingMessage?.id !== interaction.message.id) {
                    await interaction.reply({ content: '❌ This button is not for this queue.', flags: [MessageFlags.Ephemeral] });
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
                            await interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
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
                            await interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
                            return;
                        }

                        if (queue.isShuffling) {
                            await UnshuffleCommand.unshuffle(interaction);
                        } else {
                            await ShuffleCommand.shuffle(interaction);
                        }
                        break;
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
        });

        await this.player.extractors.register(AttachmentExtractor, {});
    }

    public async onReady(): Promise<void> {
        this.player.on('debug', this.logger.debug);
        this.player.on('error', this.logger.error);

        this.player.events.on('playerError', (queue: GuildQueue<QueueMetadata>, error, track) => {
            queue.metadata?.channel?.send(`❌ ${error.message}\n${hyperlink(track.title, track.url)}`);
        });

        this.player.events.on('playerStart', async (queue: GuildQueue<QueueMetadata>) => {
            const newNowPlayingMessage = await queue.metadata?.channel?.send(NowPlayingCommand.createNowPlayingMessageComponents({ queue, progressBar: false, controls: 'enabled' }));

            queue.metadata.nowPlayingMessage = newNowPlayingMessage ?? null;

            await this.setVoiceChannelStatus(queue.channel!.id, `🎶 ${queue.currentTrack?.title ?? 'Playing Music'}`);
        });

        this.player.events.on('playerFinish', async (queue: GuildQueue<QueueMetadata>) => {
            await this.setVoiceChannelStatus(queue.channel!.id, "");
            await queue.metadata?.nowPlayingMessage?.delete().catch(() => null);

            queue.metadata.nowPlayingMessage = null;
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
        for (const [id, queue] of this.player.queues.cache) {
            queue.connection?.disconnect();
        }

        this.player.destroy();
    }

    public async updateNowPlayingMessage(queue: GuildQueue<QueueMetadata>): Promise<void> {
        if (!queue.metadata?.nowPlayingMessage) return;

        await queue.metadata.nowPlayingMessage.edit(NowPlayingCommand.createNowPlayingMessageComponents({ queue, progressBar: false, controls: 'enabled' }));
    }

    public async checkQueueConnection({ queue, interaction, replyToInteraction }: CheckOptions): Promise<boolean> {
        if (queue && queue.connection && queue.channel) return true;

        if (replyToInteraction !== false) {
            await interaction.reply({ content: '❌ There is no active queue in this server.', flags: [MessageFlags.Ephemeral] });
        }

        return false;
    }

    public async checkUserInVoiceChannel({ queue, interaction, replyToInteraction, member }: CheckOptions & { member?: GuildMember; }): Promise<boolean> {
        member ??= interaction.member;

        if (member.voice.channel && queue?.channel && member.voice.channelId == queue.channel?.id) {
            return true;
        }

        if (replyToInteraction !== false) {
            await interaction.reply({ content: '❌ You need to be in a voice channel to use this command.', flags: [MessageFlags.Ephemeral] });
        }

        return false;
    }

    public async checkUserHasPermission({ queue, interaction, permission, replyToInteraction }: CheckOptions & { permission: PermissionResolvable; }): Promise<boolean> {
        const member = interaction.member;

        if (queue?.channel?.permissionsFor(member.id)?.has(permission)) {
            return true;
        }

        if (replyToInteraction !== false) {
            await interaction.reply({ content: '❌ You do not have permission to use this command.', flags: [MessageFlags.Ephemeral] });
        }

        return false;
    }

    public async setVoiceChannelStatus(channelId: string, status: string): Promise<boolean> {
        const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/voice-status`, {
            headers: {
                "accept": "*/*",
                "authorization": `Bot ${this.client.token}`,
                "content-type": "application/json"
            },
            body: JSON.stringify({ status }),
            method: "PUT"
        });

        if (!response.ok) {
            this.logger.error(`Failed to set voice channel status for channel ${channelId}: ${response.status} ${response.statusText}`);
            return false;
        }

        return true;
    }
}

export interface QueueMetadata {
    interaction: CommandInteraction;
    channel: SendableChannels|null;
    nowPlayingMessage: Message|null;
    skipVotes: Set<string>;
    previousVotes: Set<string>;
}

export interface CheckOptions {
    queue: GuildQueue<QueueMetadata>|null;
    interaction: RepliableInteraction<'cached'>;
    replyToInteraction?: boolean;
}

export default new EPlayer();