# Ssemble MCP Server

MCP server for [Ssemble AI Clipping](https://aiclipping.ssemble.com) — create viral short-form videos from any AI assistant.

Works with **Claude Desktop**, **Claude Code**, **Cursor**, **VS Code**, **Windsurf**, and any MCP-compatible client.

## What it does

This MCP server lets AI assistants create short-form video clips from YouTube videos using Ssemble's AI clipping engine. The AI can:

- **Create shorts** from YouTube URLs or uploaded files
- **Webhook callbacks** — get notified when processing completes (works with n8n, Zapier, Make)
- **Browse assets** — caption templates, background music, gameplay overlays, meme hooks
- **Track processing** — check progress and retrieve completed clips
- **Manage requests** — list history, get results, delete old requests

## Prerequisites

- [Ssemble account](https://app.ssemble.com) with an active subscription
- API key (get it from Settings → API Keys in the Ssemble dashboard)
- Node.js >= 18

## Quick Start

### Claude Desktop

Edit your config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ssemble": {
      "command": "npx",
      "args": ["@ssemble/mcp-server"],
      "env": {
        "SSEMBLE_API_KEY": "sk_ssemble_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### Claude Code

```bash
claude mcp add ssemble -- npx @ssemble/mcp-server
```

Then set the environment variable:

```bash
export SSEMBLE_API_KEY="sk_ssemble_your_key_here"
```

### Cursor / VS Code / Windsurf

Add to your MCP settings:

```json
{
  "mcpServers": {
    "ssemble": {
      "command": "npx",
      "args": ["@ssemble/mcp-server"],
      "env": {
        "SSEMBLE_API_KEY": "sk_ssemble_your_key_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `create_short` | Create AI-generated short clips from a video. Returns request ID instantly. |
| `get_status` | Check processing progress (0-100%) and current step |
| `get_shorts` | Retrieve completed clips with video URLs, titles, viral scores |
| `list_requests` | List all your requests with pagination and status filtering |
| `delete_request` | Permanently delete a request and its videos |
| `list_templates` | Browse caption style templates |
| `list_music` | Browse background music tracks |
| `list_game_videos` | Browse gameplay overlay videos |
| `list_meme_hooks` | Browse meme hook attention-grabber clips |

## How Processing Works

Video processing takes 5-30 minutes. Two workflows available:

### Option A: Polling (manual check)
1. `create_short` — submits the job and returns instantly with a request ID
2. `get_status` — check progress anytime (queued → processing → completed)
3. `get_shorts` — retrieve the generated clips when done

### Option B: Webhook (automated)
1. `create_short` with `webhookUrl` — submits the job with a callback URL
2. When processing completes or fails, the API sends an HTTP POST to your URL with the results
3. No polling needed — ideal for n8n, Zapier, Make, and custom backend integrations

Webhook payload example:
```json
{
  "event": "shorts.completed",
  "requestId": "507f1f77bcf86cd799439011",
  "status": "completed",
  "timestamp": "2026-03-30T12:00:00.000Z",
  "data": {
    "shorts": [
      {
        "id": "...",
        "title": "AI-Generated Title",
        "video_url": "https://...",
        "duration": 45,
        "viral_score": 8.5
      }
    ]
  }
}
```

## Usage Examples

**Create shorts from a YouTube video:**
> "Create shorts from https://youtube.com/watch?v=abc123, use the first 10 minutes with chill background music"

**Browse available assets:**
> "Show me all caption templates" / "What background music is available?"

**Check progress:**
> "What's the status of my video request?"

**Get results:**
> "Show me the clips for request 507f1f77bcf86cd799439011, sorted by viral score"

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SSEMBLE_API_KEY` | Yes | Your Ssemble API key (starts with `sk_ssemble_`) |
| `SSEMBLE_API_BASE_URL` | No | Override API base URL (default: `https://aiclipping.ssemble.com/api/v1`) |

## Development

```bash
git clone https://gitlab.com/vlogr/ssemble-mcp-server.git
cd ssemble-mcp-server
npm install
SSEMBLE_API_KEY=sk_ssemble_your_key npm start
```

## License

MIT
