import { ButtonStyle, ComponentType, InteractionContextType, MessageFlags, type InteractionEditReplyOptions, type RepliableInteraction } from 'discord.js';
import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from 'reciple';
import EPlayer, { type QueueMetadata } from '../EPlayer.js';
import type { GuildQueue, Track } from 'discord-player';
import { ActionRow, Button, Container, Heading, HideLinkEmbed, Hyperlink, LineBreak, SubText, TextDisplay } from '@reciple/jsx';

export class QueueCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the current music queue.')
        .setContexts(InteractionContextType.Guild)
        .toJSON();

    public async execute(data: SlashCommand.ExecuteData): Promise<void> {
        if (!data.interaction.inCachedGuild()) return;

        const queue = EPlayer.player.queues.get(data.interaction.guildId);

        if (!queue || queue?.isEmpty()) {
            await data.interaction.reply({ content: '❌ There is no song in the queue.', flags: [MessageFlags.Ephemeral] });
            return;
        }

        await this.createQueuePagination(data.interaction, queue);
    }

    public async createQueuePagination(interaction: RepliableInteraction, queue: GuildQueue<QueueMetadata>): Promise<void> {
        await interaction.deferReply();

        const pages: Track[][] = queue.tracks
            .toArray()
            .reduce((acc: Track[][], track, index) => {
                (acc[Math.floor(index / 10)] ??= []).push(track);
                return acc;
            }, []);

        let currentPage = 0;

        const message = await interaction.editReply(this.createQueueMessageComponents(pages, currentPage));

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: i => i.user.id === interaction.user.id,
            time: 20000
        });

        collector.on('collect', async i => {
            switch (i.customId) {
                case 'queue-first':
                    currentPage = 0;
                    break;
                case 'queue-previous':
                    currentPage = Math.max(currentPage - 1, 0);
                    break;
                case 'queue-next':
                    currentPage = Math.min(currentPage + 1, pages.length - 1);
                    break;
                case 'queue-last':
                    currentPage = pages.length - 1;
                    break;
            }

            await i.update(this.createQueueMessageComponents(pages, currentPage));

            collector.resetTimer();
        });

        collector.on('end', async () => {
            await interaction.editReply(this.createQueueMessageComponents(pages, currentPage, true));
        });
    }

    public createQueueMessageComponents(pages: Track[][], currentPage: number, disabled: boolean = false): InteractionEditReplyOptions {
        return {
            flags: [MessageFlags.IsComponentsV2],
            components: <>
                <Container>
                    <TextDisplay>
                        <Heading>Queue</Heading>
                        <LineBreak/>
                        {pages[currentPage].map((track, index) => `${index + (currentPage * 10) + 1}. ${<Hyperlink url={<HideLinkEmbed url={track.url}/>}>{track.title}</Hyperlink>} (${track.requestedBy})` + <LineBreak/>)}
                        <LineBreak/>
                        <SubText>Page {currentPage + 1} of {pages.length}</SubText>
                    </TextDisplay>
                    {pages.length > 1
                        ? <ActionRow>
                            <Button style={ButtonStyle.Secondary} disabled={disabled} customId="queue-first" emoji="⏪"/>
                            <Button style={ButtonStyle.Secondary} disabled={disabled} customId="queue-previous" emoji="⬅️"/>
                            <Button style={ButtonStyle.Secondary} disabled={disabled} customId="queue-next" emoji="➡️"/>
                            <Button style={ButtonStyle.Secondary} disabled={disabled} customId="queue-last" emoji="⏩"/>
                        </ActionRow>
                        : null
                    }
                </Container>
            </>
        };
    }
}

export default new QueueCommand();