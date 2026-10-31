import { ButtonStyle, Colors, InteractionContextType, MessageFlags, MessageFlagsBitField, type InteractionEditReplyOptions, type InteractionReplyOptions, type MessageEditOptions, type MessageReplyOptions } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer, { type QueueMetadata } from '../EPlayer.js';
import { QueueRepeatMode, type GuildQueue, type PlayerProgressbarOptions, type Track } from 'discord-player';
import { ActionRow, Button, Container, Heading, Hyperlink, LineBreak, Section, SubText, TextDisplay, Thumbnail } from '@reciple/jsx';

export class NowPlayingCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('now-playing')
        .setDescription('Shows the currently playing track.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        const queue = EPlayer.player.queues.get(data.interaction.guildId);

        if (!queue || !queue.currentTrack) {
            await data.interaction.reply({ content: '❌ There is no song currently playing.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        await data.interaction.reply(this.createNowPlayingMessageComponents({ queue }));
    }

    public createNowPlayingMessageComponents(options: NowPlayingMessageComponentsOptions): MessageReplyOptions & MessageEditOptions & InteractionEditReplyOptions & InteractionReplyOptions {
        const flags: MessageFlagsBitField = new MessageFlagsBitField(MessageFlags.IsComponentsV2);
        const track: Track = options.track ?? options.queue.currentTrack!;

        if (options.ephemeral) {
            flags.add(MessageFlags.Ephemeral);
        }

        return {
            flags: flags.bitfield,
            components: <>
                <Container accentColor={Colors.Blurple}>
                    <TextDisplay>
                        <Heading level={2}>Now Playing</Heading>
                    </TextDisplay>
                    <Section>
                        <Thumbnail url={track.thumbnail}/>
                        <TextDisplay>
                            <Heading level={3}>
                                🎶 <Hyperlink url={track.url}>{track.title}</Hyperlink>
                            </Heading>
                            <LineBreak/>
                            <SubText>{track.author} ∙ Requested by {track.requestedBy}</SubText>
                            <LineBreak/>
                            {(options.progressBar ?? true)
                                ? options.queue.node.createProgressBar(
                                    typeof options.progressBar === 'boolean'
                                        ? {
                                            timecodes: true,
                                            separator: ' '
                                        }
                                        : options.progressBar
                                )
                                : null
                            }
                        </TextDisplay>
                    </Section>
                    {options.controls
                        ? <ActionRow>
                            <Button
                                style={options.queue.repeatMode ? ButtonStyle.Primary : ButtonStyle.Secondary} 
                                customId="player-repeat"
                                emoji={options.queue.repeatMode === QueueRepeatMode.TRACK ? '🔂' : '🔁'}
                            />
                            <Button
                                style={ButtonStyle.Primary}
                                customId="player-previous"
                                emoji="⏪"
                            />
                            <Button
                                style={ButtonStyle.Primary}
                                customId="player-toggle-pause"
                                emoji={options.queue.node.isPaused() ? '▶️' : '⏸️'}
                            />
                            <Button
                                style={ButtonStyle.Primary}
                                customId="player-skip"
                                emoji="⏩"
                            />
                            <Button
                                style={options.queue.isShuffling ? ButtonStyle.Primary : ButtonStyle.Secondary}
                                customId="player-shuffle"
                                emoji="🔀"
                            />
                        </ActionRow>
                        : null
                    }
                </Container>
            </>
        };
    }
}

export interface NowPlayingMessageComponentsOptions {
    ephemeral?: boolean;
    progressBar?: boolean|PlayerProgressbarOptions;
    queue: GuildQueue<QueueMetadata>;
    track?: Track;
    controls?: 'enabled'|'disabled'|false;
}

export default new NowPlayingCommand();