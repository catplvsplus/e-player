import { Colors, InteractionContextType, MessageFlags } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer, { type QueueMetadata } from '../EPlayer.js';
import { InteractionListenerBuilder, InteractionListenerType, type InteractionListenerData } from '@reciple/modules';
import { QueryType } from 'discord-player';
import { Container, Heading, Hyperlink, LineBreak, Section, SubText, TextDisplay, Thumbnail } from '@reciple/jsx';

export class PlayCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from a given URL or search query.')
        .setContexts(InteractionContextType.Guild)
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The URL or search query of the song to play.')
                .setAutocomplete(true)
                .setRequired(true)
        )
        .toJSON();

    public interactions: InteractionListenerData[] = [
        new InteractionListenerBuilder()
            .setType(InteractionListenerType.Autocomplete)
            .setFilter(i => i.commandName === 'play')
            .setExecute(async interaction => {
                if (!interaction.inCachedGuild()) return;

                const query = interaction.options.getString('query', true);
                const results = await EPlayer.player
                    .search(query, {
                        searchEngine: QueryType.YOUTUBE,
                        fallbackSearchEngine: QueryType.AUTO,
                        requestedBy: interaction.user as any
                    })
                    .catch(() => null);

                await interaction.respond(
                    results?.tracks
                        .slice(0, 10)
                        .map((t) => ({
                            name: t.title,
                            value: t.url,
                        }))
                    ?? []
                );
            })
            .toJSON()
    ];

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        const query = data.interaction.options.getString('query', true);
        const member = data.interaction.member;

        if (!member.voice.channel) {
            await data.interaction.reply(EPlayer.createSimpleContainerMessage({
                content: '❌ You need to be in a voice channel to use this command.',
                color: Colors.Red
            }));
            return;
        }

        await data.interaction.deferReply();

        try {
            const { track } = await EPlayer.player.play<QueueMetadata>(
                member.voice.channel as any,
                query,
                {
                    searchEngine: QueryType.YOUTUBE,
                    fallbackSearchEngine: QueryType.AUTO,
                    requestedBy: data.interaction.user as any,
                    nodeOptions: {
                        metadata: {
                            interaction: data.interaction,
                            channel: data.interaction.channel,
                            nowPlayingMessage: null,
                            skipVotes: new Set<string>(),
                            previousVotes: new Set<string>(),
                        },
                        leaveOnEndCooldown: 60000,
                        leaveOnEmptyCooldown: 60000
                    }
                },
            );

            await data.interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: <>
                    <Container>
                        <TextDisplay>
                            <Heading level={2}>Added to queue</Heading>
                        </TextDisplay>
                        <Section>
                            <Thumbnail url={track.thumbnail}/>
                            <TextDisplay>
                                <Heading level={3}>
                                    🎵 <Hyperlink url={track.url}>{track.title}</Hyperlink>
                                </Heading>
                                <LineBreak/>
                                <SubText>{track.author} ∙ Requested by {track.requestedBy}</SubText>
                                <LineBreak/>
                            </TextDisplay>
                        </Section>
                    </Container>
                </>
            });
        } catch (error) {
            await data.interaction.followUp(`❌ ${error}`);
        }
    }
}

export default new PlayCommand();