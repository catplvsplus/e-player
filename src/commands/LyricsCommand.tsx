import { ButtonStyle, Colors, ComponentType, InteractionContextType, MessageFlags, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer, { type MessageOptions } from '../EPlayer.js';
import type { LrcSearchParams, LrcSearchResult } from 'discord-player';
import { ActionRow, Button, Container, Heading, Italic, LineBreak, Separator, SubText, TextDisplay } from '@reciple/jsx';

export class LyricsCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Displays the lyrics of a song.')
        .setContexts(InteractionContextType.Guild)
        .addStringOption(option => option
            .setName('song')
            .setDescription('The name of the song to get lyrics for.')
        )
        .toJSON();;

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        const queue = EPlayer.player.queues.get(data.interaction.guildId);
        const track = queue?.currentTrack ?? null;
        const query = data.interaction.options.getString('song');

        let search: LrcSearchParams|null = null;

        if (query) {
            search = { q: query };
        } else if (track) {
            search = { trackName: track!.title, artistName: track!.author || undefined };
        } else {
            await data.interaction.reply(EPlayer.createSimpleContainerMessage({
                content: '❌ No song to search lyrics for. Please provide a song name or play a song first.',
                color: Colors.Red
            }));
            return;
        }

        await data.interaction.deferReply();
        await this.createLyricsPagination(
            data.interaction,
            await EPlayer.player.lyrics.search(search).catch(() => [])
        );
    }

    public async createLyricsPagination(interaction: RepliableInteraction, pages: LrcSearchResult[]): Promise<void> {
        if (pages.length === 0) {
            await interaction.editReply(EPlayer.createSimpleContainerMessage({
                content: '❌ No lyrics found for the specified song.',
                color: Colors.Red
            }));
            return;
        }

        let currentPage = 0;

        const message = await interaction.editReply(this.createLyricsMessageComponents({ pages, currentPage }));

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: i => i.user.id === interaction.user.id,
            time: 20000
        });

        collector.on('collect', async i => {
            switch (i.customId) {
                case 'lyrics-first':
                    currentPage = 0;
                    break;
                case 'lyrics-previous':
                    currentPage = Math.max(currentPage - 1, 0);
                    break;
                case 'lyrics-next':
                    currentPage = Math.min(currentPage + 1, pages.length - 1);
                    break;
                case 'lyrics-last':
                    currentPage = pages.length - 1;
                    break;
            }

            await i.update(this.createLyricsMessageComponents({ pages, currentPage }));

            collector.resetTimer();
        });

        collector.on('end', async () => {
            await interaction.editReply(this.createLyricsMessageComponents({
                pages: pages,
                currentPage,
                disabled: false
            }));
        });
    }

    public createLyricsMessageComponents(options: LyricsMessageComponentsOptions): MessageOptions {
        const lyrics = options.pages[options.currentPage];

        return {
            flags: [MessageFlags.IsComponentsV2],
            components: <>
                <Container>
                    <TextDisplay>
                        <Heading level={3}>{lyrics.trackName}</Heading>
                        <LineBreak/>
                        <SubText>{lyrics.albumName} • {lyrics.artistName}</SubText>
                    </TextDisplay>
                    <Separator/>
                    <TextDisplay>
                        {lyrics.plainLyrics.length > 1997
                            ? lyrics.plainLyrics.slice(0, 1997) + '...'
                            : lyrics.plainLyrics || <Italic>No lyrics available.</Italic>
                        }
                        <LineBreak/>
                        <SubText>Page {options.currentPage + 1} of {options.pages.length}</SubText>
                    </TextDisplay>
                    {options.pages.length > 1
                        ? <ActionRow>
                            <Button style={ButtonStyle.Secondary} disabled={options.disabled} customId="lyrics-first" emoji="⏪"/>
                            <Button style={ButtonStyle.Secondary} disabled={options.disabled} customId="lyrics-previous" emoji="⬅️"/>
                            <Button style={ButtonStyle.Secondary} disabled={options.disabled} customId="lyrics-next" emoji="➡️"/>
                            <Button style={ButtonStyle.Secondary} disabled={options.disabled} customId="lyrics-last" emoji="⏩"/>
                        </ActionRow>
                        : null
                    }
                </Container>
            </>
        };
    }
}

export interface LyricsMessageComponentsOptions {
    pages: LrcSearchResult[];
    currentPage: number;
    disabled?: boolean;
}

export default new LyricsCommand();