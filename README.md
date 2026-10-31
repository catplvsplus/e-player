# E Player

A simple Discord music bot built with [Reciple](https://reciple.dev) and [Discord Player](https://discord-player.js.org).

## Prerequisites

The following software is required to run this project

- **Runtime (Choose Either One)**
  - [Node.js](https://nodejs.org/en/) - The most popular JavaScript runtime
  - [Bun](https://bun.sh/) - A fast JavaScript runtime that supports Node.js APIs
  - [Deno](https://deno.land/) - A secure runtime for JavaScript and TypeScript
- **Package Manager (Choose Either One)**
  - [npm](https://www.npmjs.com/) - The default package manager for Node.js
  - [pnpm](https://pnpm.io/) - A fast, disk space-efficient package manager
  - [Bun](https://bun.sh/) - The default package manager for Bun
  - [Deno](https://deno.land/) - The default package manager for Deno
  - [yarn](https://yarnpkg.com/) - A fast, reliable, and secure dependency management tool
- **Discord Bot Token**
  - You will need a Discord bot token to run this project. You can create a bot and get the token from the [Discord Developer Portal](https://discord.com/developers/applications).
- **FFmpeg**
   - It is required for the bot to play audio. You can download it from [FFmpeg.org](https://ffmpeg.org/download.html) and follow the installation instructions for your operating system.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/catplvsplus/e-player.git
   cd e-player
   ```
2. Install Dependencies
   ```bash
   npm install # or bun/yarn/deno/pnpm install
   ```
3. Build Project
   ```bash
   npm run build # or bun/yarn/deno/pnpm run build
   ```
4. Copy the `.env.example` file to a new `.env` file and fill in your Discord bot token.
   ```bash
   cp .env.example .env
   ```
5. Start the bot:
   ```bash
   npm run build # or bun/yarn/deno/pnpm build
   npm run start # or bun/yarn/deno/pnpm start
   ```
6. Invite the bot to your server using the following URL (replace `YOUR_CLIENT_ID` with your bot's client ID):
   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274885249024&integration_type=0&scope=bot
   ```
7. Enjoy your music bot! Start with command `/play <query>` to play music in your Discord server.

## Acknowledgements
- [Reciple](https://reciple.js.org) - For providing a simple and powerful framework for building Discord bots.
- [Discord.js](https://discord.js.org/) - For providing a powerful library for interacting with the Discord API.
- [Discord Player](https://discord-player.js.org) - For providing a powerful and easy-to-use library for playing music in Discord.
- [Discord Player Youtube Extractor](https://github.com/retrouser955/discord-player-youtubei) - For providing a simple way to extract audio from YouTube videos for playback in Discord.
- [FFmpeg](https://ffmpeg.org/) - For providing a powerful multimedia framework for handling audio and video.