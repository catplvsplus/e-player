import { SlashCommandBuilder, SlashCommandModule, type SlashCommand } from "reciple";

export class PingCommand extends SlashCommandModule {
    public data = new SlashCommandBuilder()
        .setName('ping')
        .setDescription('My ping command!')
        .toJSON();

    public async execute({ interaction }: SlashCommand.ExecuteData): Promise<void> {
        await interaction.reply('Pong!');
    }
}

export default new PingCommand();
