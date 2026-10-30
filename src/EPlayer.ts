import { DefaultExtractors } from '@discord-player/extractor';
import type { Logger } from '@prtty/print';
import { Player, type GuildQueue } from 'discord-player';
import type { CommandInteraction, SendableChannels } from 'discord.js';
import { BaseModule } from 'reciple';

export class EPlayer extends BaseModule {
    private _player!: Player;

    public logger: Logger = useLogger().clone({ label: 'EPlayer' });

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

        await this.player.extractors.loadMulti(DefaultExtractors);
    }

    public async onReady(): Promise<void> {
        this.player.events.on('playerError', (queue: GuildQueue<QueueMetadata>, error) => {
            queue.metadata?.channel?.send(`❌ ${error.message}`);
        });

        this.player.events.on('playerStart', async (queue: GuildQueue<QueueMetadata>, track) => {
            queue.metadata?.channel?.send(`🎶 Now playing **[${track.title}](<${track.url}>)**.`);
        });

        this.player.events.on('disconnect', async (queue: GuildQueue<QueueMetadata>) => {
            queue.metadata?.channel?.send(`⛓️‍💥 Disconnected from voice channel.`);
        });

        this.player.events.on('playerSkip', async (queue: GuildQueue<QueueMetadata>, track) => {
            queue.metadata?.channel?.send(`⏭️ Skipped **[${track.title}](<${track.url}>)**.`);
        });

        this.player.events.on('playerPause', async (queue: GuildQueue<QueueMetadata>) => {
            queue.metadata?.channel?.send(`⏸️ Paused **[${queue.currentTrack?.title}](<${queue.currentTrack?.url}>)**.`);
        });

        this.player.events.on('playerResume', async (queue: GuildQueue<QueueMetadata>) => {
            queue.metadata?.channel?.send(`▶️ Resumed **[${queue.currentTrack?.title}](<${queue.currentTrack?.url}>)**.`);
        });
    }

    public async onDisable(): Promise<void> {
        this.player.destroy();
    }
}

export interface QueueMetadata {
    interaction: CommandInteraction;
    channel: SendableChannels|null;
}

export default new EPlayer();