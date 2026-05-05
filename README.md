# 📚 StudyBot+ | Professional Study Group Management

StudyBot+ is a high-performance Discord bot designed for educational environments. It provides a production-ready, interactive experience for managing temporary study voice channels with a custom, high-end dashboard.

## ✨ Key Features

- **🎓 Branch-Specific Organization**: Automatically creates and manages categories for different departments (CE, CSE, MECHANICAL, etc.).
- **⚡ Interactive Dashboard**: A full remote-control panel sent directly to each VC text chat, allowing owners to manage their room without commands.
- **🛡️ Advanced Permissions**: Instant `Lock`, `Unlock`, `Permit`, and `Reject` controls to keep study sessions private and safe.
- **📢 Public LFM System**: Dedicated "Looking For Members" channel where users can announce their sessions to the whole server.
- **🔧 Smart Setup**: Intelligent setup command that repairs configuration and avoids creating duplicate channels.
- **🚀 Auto-Join & Lifecycle**: Automatically moves users to their new rooms and deletes channels immediately when they are empty.
- **💾 Cloud Persistence**: Built on Node.js and Discord.js v14, using Cloudflare D1 for robust, serverless-ready data storage.

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `/setup` | Automatically configures categories and the LFM channel. |
| `/create_study` | Starts the two-step creation flow (Branch -> Subject Modal). |
| `/status` | Sets a custom status message for your voice channel. |
| `/invite` | Generates an invite for a specific user to join your room. |
| `/permit` / `/reject` | Grants or denies access to specific users or roles. |
| `/lock` / `/unlock` | Toggles the public access of your room. |
| `/subject` | Changes the topic/subject of the current session. |
| `/limit` | Adjusts the maximum number of participants. |

## 🚀 Setup & Installation

1. **Prerequisites**: Node.js v18+, Discord Bot Token, and Cloudflare D1 credentials.
2. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd discordbot
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Environment Variables**: Create a `.env` file based on `.env.example`.
5. **Initialize Database**:
   ```bash
   node src/utils/initDb.js
   ```
6. **Start the Bot**:
   ```bash
   node index.js
   ```

## 🎨 UI/UX Features
The bot utilizes Discord's latest Select Menus, Buttons, and Modals to provide a custom dashboard experience that stays inside the Voice Channel's text chat for maximum convenience.

---
*Built for student productivity and server organization.*
