# Ssemble MCP Server — Complete Reference & Implementation Plan

## Table of Contents

1. [What is MCP?](#1-what-is-mcp)
2. [Why Ssemble + MCP?](#2-why-ssemble--mcp)
3. [Ssemble API — Complete Reference](#3-ssemble-api--complete-reference)
4. [MCP Server Architecture](#4-mcp-server-architecture)
5. [Async Processing Strategy](#5-async-processing-strategy--handling-long-running-jobs)
6. [Tool & Resource Mapping](#6-tool--resource-mapping)
7. [Implementation Plan & TODOs](#7-implementation-plan--todos)
8. [User Guide — How to Use the Ssemble MCP Server](#8-user-guide--how-to-use-the-ssemble-mcp-server)
9. [Distribution & Publishing](#9-distribution--publishing)

---

## 1. What is MCP?

**Model Context Protocol (MCP)** is an open standard by Anthropic that allows AI assistants (Claude, Cursor, Windsurf, etc.) to connect to external tools and data sources through a unified interface.

**Key concepts:**

| Concept        | Description                                                              |
| -------------- | ------------------------------------------------------------------------ |
| **MCP Server** | A lightweight process that exposes tools, resources, and prompts         |
| **MCP Client** | An AI application (Claude Desktop, Claude Code, Cursor, etc.)            |
| **Tools**      | Actions the AI can perform (like API calls)                              |
| **Resources**  | Data the AI can read/browse (like asset libraries)                       |
| **Prompts**    | Pre-built prompt templates the server can offer                          |
| **Transport**  | Communication layer — stdio (local) or HTTP+SSE (remote)                |

**Protocol:** JSON-RPC 2.0 over stdio or Streamable HTTP (SSE).

**SDKs available:**
- TypeScript: `@modelcontextprotocol/sdk`
- Python: `mcp` (PyPI)

---

## 2. Why Ssemble + MCP?

By exposing the Ssemble API as an MCP server, any AI assistant gains the ability to:

- **Create viral short-form videos** from YouTube URLs or uploaded files
- **Browse asset libraries** — caption templates, background music, gameplay overlays, meme hooks
- **Monitor processing** — check status, get progress updates
- **Manage requests** — list history, retrieve results, delete old requests
- **Automate content pipelines** — batch process videos, schedule creation, integrate with other MCP tools

### Example Conversations Users Could Have

> **User:** "Take this YouTube video and create 60-second shorts with Karaoke captions and chill background music"
>
> **AI:** Uses `list_music` to browse tracks → picks a chill track → calls `create_short` with parameters → **instantly returns requestId** → user checks back later with `get_status` → retrieves results via `get_shorts`

> **User:** "Show me all available gameplay overlays and create a split-screen short with Minecraft"
>
> **AI:** Calls `list_game_videos` → displays options → calls `create_short` with `gameVideo: true, gameVideoName: "Minecraft Parkour"` → **returns requestId instantly**, user checks status when ready

> **User:** "Process my last 5 YouTube videos into shorts and give me the best ones by viral score"
>
> **AI:** Submits 5 `create_short` requests (all return instantly) → user checks back → AI calls `get_status` on all 5 → fetches completed ones with `get_shorts` → sorts by `viral_score` → presents top clips

---

## 3. Ssemble API — Complete Reference

### Base URL

```
Production: https://aiclipping.ssemble.com/api/v1
```

### Authentication

All requests require an API key in the header:

```
X-API-Key: sk_ssemble_your_key_here
```

Alternative: `Authorization: Bearer sk_ssemble_your_key_here`

Keys are generated from the Ssemble dashboard at [app.ssemble.com](https://app.ssemble.com).

---

### 3.1 POST `/shorts/create` — Create a Short

Creates a new video processing request. Consumes **1 credit** per request.

#### Request Body

**Video Source (exactly one required):**

| Parameter | Type   | Description                                  |
| --------- | ------ | -------------------------------------------- |
| `url`     | string | YouTube video URL (not Shorts URLs)          |
| `fileUrl` | string | Publicly accessible video file URL (http/s)  |

**Time Range (both required):**

| Parameter | Type   | Description                                              |
| --------- | ------ | -------------------------------------------------------- |
| `start`   | number | Start time in seconds (>= 0)                            |
| `end`     | number | End time in seconds (> start, max window: 1200 seconds)  |

**Content Options (all optional):**

| Parameter         | Type    | Default       | Description                                                                                                         |
| ----------------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `preferredLength` | string  | `under60sec`  | Clip length: `under30sec`, `under60sec`, `under90sec`, `under3min`, `under5min`, `under10min`                       |
| `language`        | string  | `en`          | Spoken language (ISO 639-1): en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, tr, pl, nl, sv, no, da, fi, cs, vi, fa, uk, id |
| `captionLanguage` | string  | same as lang  | Caption/subtitle language if different from spoken language                                                          |
| `templateId`      | string  | Karaoke       | Caption template ID (24-char hex). Get from `GET /templates`                                                        |
| `noClipping`      | boolean | `false`       | Skip AI clipping — process entire time range as one clip                                                            |

**Overlay Options (all optional):**

| Parameter      | Type    | Default | Description                                                |
| -------------- | ------- | ------- | ---------------------------------------------------------- |
| `hookTitle`    | boolean | `false` | Add animated hook title at start                           |
| `memeHook`     | boolean | `false` | Prepend a short meme clip (2-5s attention grabber)         |
| `memeHookName` | string  | random  | Specific meme hook name (case-sensitive, from `GET /meme-hooks`) |
| `gameVideo`    | boolean | `false` | Add split-screen gameplay overlay (content top, game bottom) |
| `gameVideoName`| string  | random  | Specific game video name (case-sensitive, from `GET /game-videos`) |
| `ctaEnabled`   | boolean | `false` | Show call-to-action text overlay                           |
| `ctaText`      | string  | —       | CTA text content (max 200 chars, required when ctaEnabled=true) |

**Music Options (all optional):**

| Parameter     | Type    | Default | Description                                                    |
| ------------- | ------- | ------- | -------------------------------------------------------------- |
| `music`       | boolean | `false` | Add background music                                           |
| `musicName`   | string  | random  | Specific track name (case-sensitive, from `GET /music`)        |
| `musicVolume` | number  | `10`    | Music volume level (0-100)                                     |

**Layout (optional):**

| Parameter | Type   | Default | Description                                                     |
| --------- | ------ | ------- | --------------------------------------------------------------- |
| `layout`  | string | `auto`  | Video framing: `auto`, `fill`, `fit`, `square`                  |

#### Response (201 Created)

```json
{
  "data": {
    "requestId": "507f1f77bcf86cd799439011",
    "status": "queued",
    "message": "Your request has been queued for processing",
    "estimatedTime": "5-10 minutes"
  }
}
```

#### Constraints
- YouTube Shorts URLs are **not** supported
- Cannot provide both `url` and `fileUrl`
- Time window: 1 ≤ (end - start) ≤ 1,200 seconds
- Max video duration: 18,000 seconds (5 hours)
- `templateId` must be valid 24-char hex existing in the template library
- `musicName`, `gameVideoName`, `memeHookName` are exact, case-sensitive matches

---

### 3.2 GET `/shorts/:id/status` — Check Processing Status

| Parameter | In   | Type   | Description    |
| --------- | ---- | ------ | -------------- |
| `id`      | path | string | The request ID |

#### Response (200 OK)

```json
{
  "data": {
    "requestId": "507f1f77bcf86cd799439011",
    "status": "processing",
    "progress": 45,
    "message": "Transcribing audio...",
    "estimatedTimeRemaining": "3-5 minutes"
  }
}
```

**Status values:** `queued` → `processing` → `completed` / `failed` / `cancelled`

**Progress steps:** `queued` (0%) → `fetching_video` → `transcribing_audio` → `finding_highlights` → `finalizing` → `completed` (100%)

---

### 3.3 GET `/shorts/:id` — Get Generated Shorts

Returns the full request data including all generated clips.

| Parameter | In   | Type   | Description    |
| --------- | ---- | ------ | -------------- |
| `id`      | path | string | The request ID |

#### Response (200 OK)

```json
{
  "data": {
    "requestId": "507f1f77bcf86cd799439011",
    "status": "completed",
    "url": "https://www.youtube.com/watch?v=...",
    "title": "Original Video Title",
    "language": "en",
    "template": "Karaoke",
    "start": 0,
    "end": 600,
    "preferredLength": "under60sec",
    "sentences": [
      { "index": 0, "sentence": "Hello everyone...", "start": 0.5, "end": 2.3 }
    ],
    "shorts": [
      {
        "id": "a1b2c3d4-e5f6-...",
        "title": "AI-Generated Clip Title",
        "description": "Social media caption with #hashtags",
        "reason": "AI explanation of why this segment was selected",
        "viral_score": 85,
        "video_url": "https://storage.blob.core.windows.net/...",
        "startTimestamp": 120,
        "endTimestamp": 175,
        "duration": 55,
        "width": 1080,
        "height": 1920,
        "sentenceIndexes": [12, 13, 14, 15],
        "recompiling": false,
        "error": false,
        "errorMessage": null
      }
    ],
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:42:00Z"
  }
}
```

---

### 3.4 GET `/shorts` — List All Requests

| Parameter   | In    | Type   | Default     | Description                              |
| ----------- | ----- | ------ | ----------- | ---------------------------------------- |
| `page`      | query | number | `1`         | Page number                              |
| `limit`     | query | number | `10`        | Items per page (1-100)                   |
| `status`    | query | string | all         | Filter: queued, processing, completed, failed, cancelled |
| `sortBy`    | query | string | `createdAt` | Sort field: `createdAt` or `updatedAt`   |
| `sortOrder` | query | string | `desc`      | Sort direction: `asc` or `desc`          |

#### Response (200 OK)

```json
{
  "data": {
    "requests": [
      {
        "requestId": "507f1f77bcf86cd799439011",
        "status": "completed",
        "progress": 100,
        "url": "https://www.youtube.com/watch?v=...",
        "duration": 600,
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:42:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 42,
      "itemsPerPage": 10
    }
  }
}
```

---

### 3.5 DELETE `/shorts/:id` — Delete a Request

Permanently deletes a request and all generated videos. **Credits are NOT refunded.**

| Parameter | In   | Type   | Description    |
| --------- | ---- | ------ | -------------- |
| `id`      | path | string | The request ID |

#### Response (204 No Content)

Empty body on success.

---

### 3.6 GET `/templates` — List Caption Templates

Returns all available caption style templates.

#### Response (200 OK)

```json
{
  "data": {
    "templates": [
      {
        "templateId": "65a1b2c3d4e5f6a7b8c9d0e1",
        "name": "Karaoke",
        "displayName": "Karaoke",
        "previewUrl": "https://...",
        "isDefault": true
      }
    ]
  }
}
```

Default template: **Karaoke** (word-by-word highlighting).

---

### 3.7 GET `/music` — List Background Music

| Parameter | In    | Type   | Default | Description            |
| --------- | ----- | ------ | ------- | ---------------------- |
| `page`    | query | number | `1`     | Page number            |
| `limit`   | query | number | `10`    | Items per page (1-100) |

#### Response (200 OK)

```json
{
  "data": {
    "music": [
      { "name": "Chill Vibes", "duration": 120 }
    ],
    "pagination": { "currentPage": 1, "totalPages": 2, "totalItems": 45, "itemsPerPage": 25 }
  }
}
```

---

### 3.8 GET `/game-videos` — List Gameplay Overlays

| Parameter | In    | Type   | Default | Description            |
| --------- | ----- | ------ | ------- | ---------------------- |
| `page`    | query | number | `1`     | Page number            |
| `limit`   | query | number | `10`    | Items per page (1-100) |

#### Response (200 OK)

```json
{
  "data": {
    "gameVideos": [
      { "name": "Minecraft Parkour", "previewUrl": "https://..." }
    ],
    "pagination": { "currentPage": 1, "totalPages": 2, "totalItems": 30, "itemsPerPage": 25 }
  }
}
```

Available games include: GTA, Minecraft, Subway Surfer, Fortnite, and ~26 more.

---

### 3.9 GET `/meme-hooks` — List Meme Hook Clips

Short 2-5 second attention-grabbing clips prepended to the beginning of shorts.

| Parameter | In    | Type   | Default | Description            |
| --------- | ----- | ------ | ------- | ---------------------- |
| `page`    | query | number | `1`     | Page number            |
| `limit`   | query | number | `10`    | Items per page (1-100) |

#### Response (200 OK)

```json
{
  "data": {
    "memeHooks": [
      { "name": "Baby Vomit", "previewUrl": "https://..." }
    ],
    "pagination": { "currentPage": 1, "totalPages": 1, "totalItems": 25, "itemsPerPage": 25 }
  }
}
```

---

### 3.10 Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable description",
    "details": null
  }
}
```

| HTTP Status | Error Code              | Description                              |
| ----------- | ----------------------- | ---------------------------------------- |
| 400         | `invalid_request`       | Missing/invalid parameters               |
| 400         | `invalid_youtube_url`   | Unreachable URL or YouTube Shorts URL    |
| 400         | `video_too_long`        | Video exceeds 5-hour limit               |
| 401         | `missing_api_key`       | No API key provided                      |
| 401         | `invalid_api_key`       | Wrong format, expired, or revoked key    |
| 403         | `subscription_required` | No active subscription                   |
| 403         | `insufficient_credits`  | No credits remaining                     |
| 404         | `resource_not_found`    | Request ID doesn't exist                 |
| 429         | `rate_limit_exceeded`   | Too many requests                        |
| 500         | `internal_error`        | Server-side error                        |

---

### 3.11 Rate Limits

**Account-level limits (per API key):**

| Tier     | Hourly | Daily  |
| -------- | ------ | ------ |
| Standard | 100    | 1,000  |
| Higher   | 2,000  | 20,000 |

**Rate limit headers returned on every response:**

```
X-RateLimit-Limit-Hour: 100
X-RateLimit-Remaining-Hour: 95
X-RateLimit-Limit-Day: 1000
X-RateLimit-Remaining-Day: 950
X-RateLimit-Reset: 2025-01-15T11:00:00Z
```

---

## 4. MCP Server Architecture

### 4.1 High-Level Design

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│   AI Client         │  stdio  │   Ssemble MCP Server │  HTTPS  │  Ssemble API    │
│  (Claude Desktop,   │◄───────►│                      │◄───────►│  (Production)   │
│   Cursor, etc.)     │  or SSE │  - Tools (actions)   │         │                 │
│                     │         │  - Resources (data)  │         │                 │
└─────────────────────┘         └──────────────────────┘         └─────────────────┘
```

### 4.2 Transport Options

| Transport | Use Case                               | How it Works                           |
| --------- | -------------------------------------- | -------------------------------------- |
| **stdio** | Local installation (npx/npm package)   | Server runs as a subprocess of the AI client |
| **Streamable HTTP** | Remote/hosted deployment | Express server on port 3100, clients connect via HTTPS |

Both transports are implemented and deployed.

### 4.3 Tech Stack

```
Language:    JavaScript (ESM, plain JS — no build step needed)
SDK:         @modelcontextprotocol/sdk
Runtime:     Node.js >= 18
Package:     npm (published as @ssemble/mcp-server)
Repository:  https://gitlab.com/vlogr/ssemble-mcp-server.git
```

---

## 5. Async Processing Strategy — Handling Long-Running Jobs

### The Challenge

Ssemble's video processing takes **10-15 minutes** to complete. MCP tools are synchronous — the AI calls a tool, gets a response, and decides what to do next. Most MCP clients also enforce **tool timeouts** (typically 30-60 seconds). This means we **cannot** block and wait for processing to finish inside a single tool call.

### The Solution: Separate Tools (Submit → Check → Retrieve)

Instead of a single blocking call, we split the workflow into 3 distinct steps. This is the **recommended pattern** for any long-running operation in MCP.

```
Step 1: create_short     →  Instant response (queued, here's your requestId)
Step 2: get_status        →  User checks back anytime (progress %, current step)
Step 3: get_shorts        →  User retrieves results when completed
```

The AI **never blocks or hangs**. Each tool returns instantly with useful information.

### Conversation Flow Example

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  User: "Create shorts from this YouTube video with chill music"         │
│                                                                         │
│  AI calls: create_short(url, start, end, music: true)                   │
│  API returns instantly: { requestId: "abc123", status: "queued" }       │
│                                                                         │
│  AI responds: "Your request is submitted! (ID: abc123)                  │
│                Processing takes 10-15 minutes.                          │
│                Just ask me to check the status anytime."                 │
│                                                                         │
│  ──── user continues other work or comes back later ────                │
│                                                                         │
│  User: "How's my video doing?"                                          │
│                                                                         │
│  AI calls: get_status(requestId: "abc123")                              │
│  API returns: { status: "processing", progress: 45,                     │
│                 message: "Transcribing audio..." }                      │
│                                                                         │
│  AI responds: "It's 45% done — currently transcribing the audio.        │
│                Should be ready in a few more minutes."                   │
│                                                                         │
│  ──── user checks back again ────                                       │
│                                                                         │
│  User: "Is it done yet?"                                                │
│                                                                         │
│  AI calls: get_status(requestId: "abc123")                              │
│  API returns: { status: "completed", progress: 100 }                    │
│                                                                         │
│  AI calls: get_shorts(requestId: "abc123")                              │
│  API returns: { shorts: [4 clips with URLs, titles, viral scores] }     │
│                                                                         │
│  AI responds: "Done! Here are your 4 clips:                             │
│                1. 'Mind-Blowing Discovery' — 52s, viral score: 92       │
│                2. 'The Secret Nobody Knew' — 48s, viral score: 85       │
│                3. 'Wait For The Plot Twist' — 35s, viral score: 78      │
│                4. 'This Changes Everything' — 60s, viral score: 71      │
│                                                                         │
│                Here are the download links: ..."                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why NOT a Blocking `create_and_wait` Tool?

We intentionally **do not** provide a compound tool that blocks for 10-15 minutes because:

| Problem | Impact |
|---------|--------|
| **MCP client timeouts** | Most clients timeout tool calls after 30-60 seconds — the call would fail |
| **No user feedback** | User sees a spinner with zero information for 10+ minutes |
| **Connection fragility** | If the connection drops mid-wait, everything is lost |
| **Wastes conversation** | User can't do anything else while the tool hangs |

The separate-tools pattern solves all of these problems and gives a **better user experience**.

### Batch Workflow Example

The async pattern also handles multiple videos naturally:

```
User: "Process these 3 YouTube videos into shorts"

AI calls: create_short(video1) → requestId: "aaa"
AI calls: create_short(video2) → requestId: "bbb"
AI calls: create_short(video3) → requestId: "ccc"

AI responds: "All 3 submitted! IDs: aaa, bbb, ccc.
              I'll check on them whenever you ask."

...later...

User: "How are my videos doing?"

AI calls: get_status("aaa") → completed
AI calls: get_status("bbb") → processing (72%)
AI calls: get_status("ccc") → processing (31%)

AI responds: "Video 1 is done! Videos 2 and 3 are still processing (72% and 31%).
              Want me to fetch the results for the completed one?"
```

### Progress Step Details

The `get_status` tool returns rich progress information at each stage:

| Progress | Step | Message |
|----------|------|---------|
| 0% | `queued` | "Waiting in queue..." |
| 10-20% | `fetching_video` | "Downloading video from source..." |
| 20-50% | `transcribing_audio` | "Transcribing audio..." |
| 50-80% | `finding_highlights` | "AI is finding the best moments..." |
| 80-99% | `finalizing` | "Rendering final clips..." |
| 100% | `completed` | "Done! Ready to download." |

This gives the AI enough context to provide informative, natural-sounding status updates to the user.

---

## 6. Tool & Resource Mapping

### 6.1 MCP Tools (Actions)

These are the actions the AI can invoke:

#### Tool: `create_short`
**Description:** Create a new short-form video from a YouTube URL or file URL.

```json
{
  "name": "create_short",
  "description": "Create AI-generated short-form video clips from a YouTube video or uploaded file. Returns a request ID for tracking. Processing takes 5-30 minutes.",
  "inputSchema": {
    "type": "object",
    "required": ["start", "end"],
    "properties": {
      "url":             { "type": "string", "description": "YouTube video URL" },
      "fileUrl":         { "type": "string", "description": "Public video file URL (alternative to url)" },
      "start":           { "type": "number", "description": "Start time in seconds" },
      "end":             { "type": "number", "description": "End time in seconds (max 1200s window)" },
      "preferredLength": { "type": "string", "enum": ["under30sec","under60sec","under90sec","under3min","under5min","under10min"] },
      "language":        { "type": "string", "description": "Spoken language (ISO 639-1)" },
      "captionLanguage": { "type": "string", "description": "Caption language if different from spoken" },
      "templateId":      { "type": "string", "description": "Caption template ID from list_templates" },
      "noClipping":      { "type": "boolean", "description": "Skip AI clipping, process entire range" },
      "hookTitle":       { "type": "boolean", "description": "Add animated hook title" },
      "memeHook":        { "type": "boolean", "description": "Prepend meme hook clip" },
      "memeHookName":    { "type": "string", "description": "Specific meme hook name from list_meme_hooks" },
      "gameVideo":       { "type": "boolean", "description": "Add split-screen gameplay" },
      "gameVideoName":   { "type": "string", "description": "Specific game video from list_game_videos" },
      "ctaEnabled":      { "type": "boolean", "description": "Enable call-to-action overlay" },
      "ctaText":         { "type": "string", "description": "CTA text (max 200 chars)" },
      "music":           { "type": "boolean", "description": "Add background music" },
      "musicName":       { "type": "string", "description": "Specific track from list_music" },
      "musicVolume":     { "type": "number", "description": "Music volume 0-100 (default 10)" },
      "layout":          { "type": "string", "enum": ["auto","fill","fit","square"] }
    }
  }
}
```

#### Tool: `get_status`
**Description:** Check the processing status and progress of a short creation request.

```json
{
  "name": "get_status",
  "description": "Check processing status of a short creation request. Returns status (queued/processing/completed/failed), progress percentage, and estimated time remaining.",
  "inputSchema": {
    "type": "object",
    "required": ["requestId"],
    "properties": {
      "requestId": { "type": "string", "description": "The request ID from create_short" }
    }
  }
}
```

#### Tool: `get_shorts`
**Description:** Retrieve generated short clips with download URLs, titles, and viral scores.

```json
{
  "name": "get_shorts",
  "description": "Retrieve all generated short clips for a completed request. Returns video URLs, AI-generated titles, descriptions, viral scores, and durations.",
  "inputSchema": {
    "type": "object",
    "required": ["requestId"],
    "properties": {
      "requestId": { "type": "string", "description": "The request ID from create_short" }
    }
  }
}
```

#### Tool: `list_requests`
**Description:** List all short creation requests with pagination and filtering.

```json
{
  "name": "list_requests",
  "description": "List all short creation requests with optional status filtering, pagination, and sorting.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "page":      { "type": "number", "description": "Page number (default 1)" },
      "limit":     { "type": "number", "description": "Items per page, 1-100 (default 10)" },
      "status":    { "type": "string", "enum": ["queued","processing","completed","failed","cancelled"] },
      "sortBy":    { "type": "string", "enum": ["createdAt","updatedAt"] },
      "sortOrder": { "type": "string", "enum": ["asc","desc"] }
    }
  }
}
```

#### Tool: `delete_request`
**Description:** Permanently delete a request and all its generated videos.

```json
{
  "name": "delete_request",
  "description": "Permanently delete a short creation request and all generated videos. Credits are NOT refunded. This action is irreversible.",
  "inputSchema": {
    "type": "object",
    "required": ["requestId"],
    "properties": {
      "requestId": { "type": "string", "description": "The request ID to delete" }
    }
  }
}
```

#### Tool: `list_templates`
**Description:** List all available caption style templates.

```json
{
  "name": "list_templates",
  "description": "List all available caption style templates with preview URLs. Use templateId when creating shorts.",
  "inputSchema": { "type": "object", "properties": {} }
}
```

#### Tool: `list_music`
**Description:** Browse available background music tracks.

```json
{
  "name": "list_music",
  "description": "List available background music tracks with names and durations. Use musicName when creating shorts.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "page":  { "type": "number", "description": "Page number (default 1)" },
      "limit": { "type": "number", "description": "Items per page, 1-100 (default 10)" }
    }
  }
}
```

#### Tool: `list_game_videos`
**Description:** Browse available gameplay overlay videos for split-screen shorts.

```json
{
  "name": "list_game_videos",
  "description": "List available gameplay videos for split-screen overlays. Use gameVideoName when creating shorts.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "page":  { "type": "number", "description": "Page number (default 1)" },
      "limit": { "type": "number", "description": "Items per page, 1-100 (default 10)" }
    }
  }
}
```

#### Tool: `list_meme_hooks`
**Description:** Browse available meme hook clips (short attention-grabbers).

```json
{
  "name": "list_meme_hooks",
  "description": "List available meme hook clips (2-5 second attention grabbers prepended to shorts). Use memeHookName when creating shorts.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "page":  { "type": "number", "description": "Page number (default 1)" },
      "limit": { "type": "number", "description": "Items per page, 1-100 (default 10)" }
    }
  }
}
```

---

## 7. Implementation Plan & TODOs

> **Tracking**: This section is the living tracker. Mark items `[x]` when completed.
> **Repository**: Standalone repo at `ssemble-mcp-server/` (local: `/home/cer/ssemble_projects/ssemble-mcp-server/`, remote: `gitlab.com/vlogr/ssemble-mcp-server`)

### Phase 1: Project Setup

- [x] **Create standalone Git repo** — `ssemble-mcp-server/` at `/home/cer/ssemble_projects/ssemble-mcp-server/`
- [x] **Initialize Node.js project** — `npm init`, ESM config (`"type": "module"`)
- [x] **Install dependencies:**
  - `@modelcontextprotocol/sdk` — MCP protocol SDK
  - `zod` — Schema validation (used by MCP SDK)
  - `express` — HTTP transport
- [x] **Set up project structure:**
  ```
  ssemble-mcp-server/
  ├── src/
  │   ├── index.js                    # McpServer factory + tool/resource/prompt registration
  │   ├── transports/
  │   │   ├── stdio.js                # Entry point for npx/local usage (#!/usr/bin/env node)
  │   │   └── http.js                 # Entry point for remote deployment (Express on port 3100)
  │   ├── api/
  │   │   └── client.js               # Ssemble API HTTP wrapper (native fetch)
  │   ├── tools/
  │   │   ├── create-short.js         # POST /shorts/create
  │   │   ├── get-status.js           # GET /shorts/:id/status
  │   │   ├── get-shorts.js           # GET /shorts/:id
  │   │   ├── list-requests.js        # GET /shorts
  │   │   ├── delete-request.js       # DELETE /shorts/:id
  │   │   ├── list-templates.js       # GET /templates
  │   │   ├── list-music.js           # GET /music
  │   │   ├── list-game-videos.js     # GET /game-videos
  │   │   └── list-meme-hooks.js      # GET /meme-hooks
  │   ├── resources/
  │   │   └── static-data.js          # Languages, layouts, preferred lengths
  │   ├── prompts/
  │   │   └── workflows.js            # Pre-built prompt templates
  │   └── utils/
  │       └── format.js               # Markdown formatting for AI readability
  ├── deploy/
  │   ├── nginx-mcp.conf              # NGINX config reference for load balancer
  │   └── deploy.sh                   # Manual deployment script
  ├── server.json                     # Official MCP Registry metadata
  ├── process.json                    # PM2 config for HTTP transport
  ├── .gitlab-ci.yml                  # CI/CD pipeline (manual deploy to API servers)
  ├── package.json
  ├── README.md
  └── LICENSE (MIT)
  ```

### Phase 2: Core Implementation

- [x] **Build API client** (`src/api/client.js`)
  - Wrap all 9 Ssemble API endpoints with typed methods
  - Use native `fetch` (Node 18+, zero deps)
  - Handle authentication (API key from `process.env.SSEMBLE_API_KEY`)
  - Validate key format: must start with `sk_ssemble_`
  - Parse and forward error responses
  - Capture rate limit headers from responses

- [x] **Implement MCP server** (`src/index.js`)
  - Create McpServer instance with `@modelcontextprotocol/sdk`
  - Register all 9 tools with Zod input schemas
  - Register resources (languages, layouts, preferred lengths)
  - Register prompts (create-viral-short, batch-process-videos)
  - Handle server lifecycle (initialize, close)

- [x] **Implement each tool handler:**
  - [x] `create_short` — Validate inputs, call POST `/shorts/create`, return requestId
  - [x] `get_status` — Call GET `/shorts/:id/status`, return status + progress
  - [x] `get_shorts` — Call GET `/shorts/:id`, format and return clips data
  - [x] `list_requests` — Call GET `/shorts` with query params, return paginated list
  - [x] `delete_request` — Call DELETE `/shorts/:id`, confirm deletion
  - [x] `list_templates` — Call GET `/templates`, return template list
  - [x] `list_music` — Call GET `/music`, return track list
  - [x] `list_game_videos` — Call GET `/game-videos`, return game list
  - [x] `list_meme_hooks` — Call GET `/meme-hooks`, return hook list

- [x] **Implement MCP resources:**
  - [x] `ssemble://supported-languages` — Language codes + names
  - [x] `ssemble://preferred-lengths` — Duration options with descriptions
  - [x] `ssemble://layouts` — Layout options with descriptions

- [x] **Implement MCP prompts:**
  - [x] `create-viral-short` — Guided workflow for creating an optimized short
  - [x] `batch-process-videos` — Template for processing multiple videos

### Phase 3: Error Handling, UX & Transports

- [x] **Map API errors to MCP tool errors** — Return clear, actionable error messages
- [x] **Add rate limit awareness** — Include remaining quota in tool responses
- [x] **Format tool outputs for AI readability:**
  - Markdown tables for asset lists
  - Bullet points for shorts results
  - Clear status indicators (progress %, step names)
- [x] **Add input validation** — Zod schemas mirroring backend constraints:
  - Time window: 1 ≤ (end - start) ≤ 1200 seconds
  - Languages: en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, tr, pl, nl, sv, no, da, fi, cs
  - Preferred lengths: under30sec, under60sec, under90sec, under3min, under5min, under10min
  - Layouts: auto, fill, fit, square
  - templateId: 24-char hex regex
- [x] **Stdio transport** (`src/transports/stdio.js`)
  - Entry point with `#!/usr/bin/env node`
  - Uses `StdioServerTransport` from MCP SDK
  - Reads `SSEMBLE_API_KEY` from env
- [x] **Streamable HTTP transport** (`src/transports/http.js`)
  - Express server on configurable port (default 3100)
  - `POST /mcp` — MCP protocol endpoint
  - `GET /health` — Health check
  - `GET /.well-known/mcp/server-card.json` — Smithery auto-discovery
  - Per-request API key via `X-Ssemble-API-Key` header (multi-tenant support)

### Phase 4: Testing

- [x] **Manual testing — all 9 tools** — Tested with real API key against production API:
  - `list_templates`: 9 templates returned
  - `list_music`: 8 tracks returned
  - `list_game_videos`: 8 videos returned
  - `list_meme_hooks`: 159 hooks returned
  - `list_requests`: Paginated results working
  - `get_status`: Progress tracking (0% → 60% → 100%)
  - `get_shorts`: Full clip data with video URLs, viral scores
  - `create_short`: Request `69c38099145c7a22672ea64e` — queued → processing → completed
  - `delete_request`: Not tested (preserving test data)
- [x] **Integration test** — Full end-to-end workflow:
  - `create_short` (Rick Astley, 0-60s, under30sec) → request ID returned instantly
  - `get_status` → tracked from 0% (queued) → 60% (finding_highlights) → 100% (completed)
  - `get_shorts` → 1 clip: "Never Gonna Give You Up!", viral score 100, 36.62s, 1080x1920
  - Video URL: `https://cf.ssemble.com/ssemble-shortsmaker-plugin/export/file_1774420407892_khjzg1.mp4`
- [x] **Edge cases:**
  - Invalid API key: Returns clear error message
  - Key format validation: Rejects keys without `sk_ssemble_` prefix
  - Non-existent request ID: Returns 404 error
- [x] **Manual testing — HTTP transport** — Tested Streamable HTTP via public URL:
  - `curl https://mcp.ssemble.com/health` → OK
  - `curl https://mcp.ssemble.com/.well-known/mcp/server-card.json` → server card returned
  - MCP `initialize` request via curl → protocol version and capabilities returned
- [x] **Claude Code integration test** — Added as MCP server, called `list_templates` tool successfully
- [ ] **Unit tests** — Test each tool handler with mocked API responses (vitest) — deferred

### Phase 5: Documentation

- [x] **Write README.md** — Installation, configuration for all clients (Claude Desktop, Claude Code, Cursor, VS Code, Windsurf), usage examples
- [ ] **Write CHANGELOG.md** — Initial 1.0.0 release notes
- [ ] **Add to Ssemble docs** — New page at `content/docs/mcp.mdx` for MCP setup

### Phase 6: Deployment

**Target:** Existing API servers (10.0.0.12 / 10.0.0.13) — the MCP server is a lightweight proxy (~50MB RAM, no GPU)

- [x] **PM2 configuration** — `process.json` created
- [x] **NGINX config** — `deploy/nginx-mcp.conf` created for load balancer (10.0.0.21)
- [x] **GitLab CI/CD** — `.gitlab-ci.yml` with `deploy_main_mcp` (production, manual) and `deploy_development_mcp` (dev, auto)
- [x] **Deploy script** — `deploy/deploy.sh` for manual deployments
- [x] **First deploy to API servers** — Deployed on 10.0.0.12 and 10.0.0.13, PM2 `ssemble-mcp-http` online (~71MB RAM)
- [x] **Install NGINX config** on load balancer (10.0.0.21) — Added server block in `nginx.conf`, reloaded
- [x] **DNS setup** — Added `mcp` A record in Cloudflare → `74.249.53.6` (proxied)
- [x] **Verified public endpoint** — `https://mcp.ssemble.com/health`, `/mcp`, `/.well-known/mcp/server-card.json` all working
- [x] **Tested in Claude Code** — Added as MCP server, successfully called `list_templates` tool

#### Deployment Details

**API Servers (10.0.0.12, 10.0.0.13):**
- Directory: `/home/ssemble/ssemble-mcp-server/`
- PM2 process: `ssemble-mcp-http` (port 3100, ~71MB RAM)
- Config: `process.json` (calls `localhost:3000/api/v1` directly, bypassing external roundtrip)
- Node.js: v18.20.8 (same as existing API services)

**Load Balancer (10.0.0.21):**
- NGINX config added directly in `/etc/nginx/nginx.conf` (matching existing pattern)
- Upstream: `mcp_backend` → `10.0.0.12:3100` + `10.0.0.13:3100`
- SSL: Reuses existing Let's Encrypt cert at `/etc/letsencrypt/live/plugin-shortsmaker.ssemble.com/`
- Backup: `/etc/nginx/nginx.conf.bak`

**Cloudflare DNS:**
- Record: `mcp` A → `74.249.53.6` (proxied, orange cloud)
- SSL mode: Full (Cloudflare handles client SSL, accepts origin cert)

**GitLab CI/CD:**
- `.gitlab-ci.yml` with two deployment jobs:
  - `deploy_main_mcp` — Production deploy to API servers (manual trigger on `main` branch), SSHs as `ssemble` user
  - `deploy_development_mcp` — Dev deploy to 10.0.0.20 (auto on `development` branch), SSHs as `root` user

**Development Server (10.0.0.20) — NOT YET DEPLOYED:**
- Directory: `/root/ssemble-mcp-server/`
- User: `root`
- Node.js: v20.14.0 (matching existing dev environment)
- Branch: `development`
- PM2 process: `ssemble-mcp-http` (same name, separate server)
- Public IP: 20.80.243.82
- Note: Dev VM costs ~$383/month, only start when needed for development

**Dev Server Setup Steps (when needed):**

1. **Start the dev VM** (if stopped):
   ```bash
   az vm start --resource-group ssemble --name dev-shortsmaker-api-request-processor-export
   ```

2. **Create `development` branch** in GitLab (from local):
   ```bash
   cd /home/cer/ssemble_projects/ssemble-mcp-server
   git checkout -b development
   git push -u origin development
   git checkout main
   ```

3. **Clone repo on dev server** (SSH to 10.0.0.20 as root):
   ```bash
   ssh root@10.0.0.20
   cd /root
   git clone https://gitlab.com/vlogr/ssemble-mcp-server.git
   cd ssemble-mcp-server
   git checkout development
   export PATH=$PATH:/root/.nvm/versions/node/v20.14.0/bin
   npm install --production
   pm2 start process.json
   pm2 save
   ```

4. **Add NGINX config on load balancer** (SSH to 10.0.0.21):
   Add a new server block in `/etc/nginx/nginx.conf` (before `include sites-enabled`):
   ```nginx
   server {
       listen 443 ssl;
       server_name dev-mcp.ssemble.com;

       ssl_certificate /etc/letsencrypt/live/plugin-shortsmaker.ssemble.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/plugin-shortsmaker.ssemble.com/privkey.pem;

       location / {
           proxy_pass http://10.0.0.20:3100;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header Connection '';
           proxy_buffering off;
           proxy_cache off;
           proxy_read_timeout 300s;
       }
   }
   ```
   Then: `sudo nginx -t && sudo systemctl reload nginx`

5. **Add Cloudflare DNS record:**
   - Type: A
   - Name: `dev-mcp`
   - Value: `74.249.53.6` (load balancer public IP)
   - Proxy: ON (orange cloud)

6. **Verify:**
   ```bash
   curl https://dev-mcp.ssemble.com/health
   ```

### Phase 7: Publishing & Distribution

- [x] **Publish to npm** — `@ssemble/mcp-server@1.0.0` published (https://www.npmjs.com/package/@ssemble/mcp-server)
- [ ] **Create `server.json`** for Official MCP Registry:
  ```json
  {
    "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    "name": "io.github.aiclipping/ssemble-mcp-server",
    "title": "Ssemble AI Clipping",
    "description": "Create AI-powered short-form video clips from YouTube videos.",
    "version": "1.0.0",
    "websiteUrl": "https://aiclipping.ssemble.com",
    "repository": { "type": "git", "url": "https://gitlab.com/vlogr/ssemble-mcp-server" },
    "packages": [{
      "registryType": "npm",
      "identifier": "@ssemble/mcp-server",
      "transport": "stdio",
      "environmentVariables": [{ "name": "SSEMBLE_API_KEY", "required": true }]
    }],
    "remotes": [{ "transportType": "streamable-http", "url": "https://mcp.ssemble.com/mcp" }]
  }
  ```
- [ ] **Submit to Official MCP Registry** — `mcp-publisher publish` (modelcontextprotocol.io)
- [ ] **Submit to Smithery.ai** — Submit `https://mcp.ssemble.com/mcp` at smithery.ai/new
- [ ] **Submit to mcp.so** — Community directory, web form submission
- [ ] **Submit to Glama.ai** — Auto-indexed by npm keywords, or manual submit
- [ ] **Push to GitHub** — Public repo at `gitlab.com/vlogr/ssemble-mcp-server` with topics: mcp, ai-clipping, video, shorts
- [ ] **Product Hunt launch** — Landing page + demo video
- [ ] **Reddit/HN posts** — r/LocalLLaMA, r/ChatGPT, r/artificial, Show HN
- [ ] **Create demo video** — Show end-to-end usage with Claude

### Phase 8: Advanced Features (Future)

- [ ] **Webhook support** — Push notifications when processing completes (instead of polling)
- [ ] **Batch processing tool** — Process multiple videos in one call
- [ ] **OAuth integration** — Replace API key with OAuth flow for easier setup
- [ ] **Channel automation tools** — Expose channel automation API via MCP

---

## 8. User Guide — How to Use the Ssemble MCP Server

### 7.1 Installation

#### Option A: npm (recommended)

```bash
npm install -g @ssemble/mcp-server
```

#### Option B: From source

```bash
git clone https://gitlab.com/vlogr/ssemble-mcp-server.git
cd ssemble-mcp-server
npm install
npm run build
```

### 7.2 Get Your API Key

1. Go to [app.ssemble.com](https://app.ssemble.com)
2. Navigate to **Settings → API Keys**
3. Click **Generate New Key**
4. Copy the key (starts with `sk_ssemble_`)

### 7.3 Configure with Claude Desktop

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

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

### 7.4 Configure with Claude Code

#### Option A: From GitLab source (recommended for Ssemble developers)

**Step 1 — Clone the repo** (one time only):

```bash
cd ~/ssemble_projects   # or wherever you keep your repos
git clone https://gitlab.com/vlogr/ssemble-mcp-server.git
cd ssemble-mcp-server
npm install
```

**Step 2 — Get your API key:**

1. Go to [app.ssemble.com](https://app.ssemble.com)
2. Navigate to **Settings → API Keys**
3. Click **Generate New Key**
4. Copy the key (starts with `sk_ssemble_`)

**Step 3 — Add the MCP server to Claude Code:**

```bash
claude mcp add ssemble \
  -e SSEMBLE_API_KEY=sk_ssemble_your_key_here \
  -- node /full/path/to/ssemble-mcp-server/src/transports/stdio.js
```

Replace `/full/path/to/` with the actual absolute path where you cloned the repo. For example:

```bash
claude mcp add ssemble \
  -e SSEMBLE_API_KEY=sk_ssemble_XXXXX \
  -- node /home/youruser/ssemble_projects/ssemble-mcp-server/src/transports/stdio.js
```

**Step 4 — Restart Claude Code** (close and reopen the terminal/IDE).

**Step 5 — Verify it works** — Ask Claude: "List all available Ssemble templates"

You should see 9 templates returned from the `list_templates` tool.

#### Option B: Via npx (after npm publishing)

Once `@ssemble/mcp-server` is published to npm:

```bash
claude mcp add ssemble \
  -e SSEMBLE_API_KEY=sk_ssemble_your_key_here \
  -- npx @ssemble/mcp-server
```

#### Troubleshooting

- **"MCP server not found"** → Make sure you restarted Claude Code after adding the server
- **"Invalid API key"** → Key must start with `sk_ssemble_`. Get one from app.ssemble.com → Settings → API Keys
- **"Cannot find module"** → Check that the path in the `claude mcp add` command is correct and `npm install` was run
- **Check registered servers** → Run `claude mcp list` to see all configured MCP servers
- **Remove and re-add** → Run `claude mcp remove ssemble` then add again if something is wrong

### 7.5 Configure with Cursor

In Cursor settings, add an MCP server:

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

### 7.6 Usage Examples

Once configured, you can ask your AI assistant:

**Basic short creation:**
> "Create shorts from this YouTube video: https://youtube.com/watch?v=abc123 — use the first 10 minutes"

**With specific options:**
> "Create a 30-second short from https://youtube.com/watch?v=xyz with Minecraft gameplay overlay and chill background music"

**Browse assets:**
> "Show me all available caption templates"
> "What background music tracks are available?"
> "List all gameplay overlays"

**Check progress:**
> "What's the status of my last video request?"
> "Show me all my completed shorts"

**Get results:**
> "Get the download links for request 507f1f77bcf86cd799439011"
> "Show me my shorts sorted by viral score"

**Batch workflow:**
> "Process these 3 YouTube videos into shorts and give me the best clip from each by viral score"

---

## 9. Distribution & Publishing

### 9.1 npm Package

```bash
# Publish as scoped package
npm publish --access public
# Package name: @ssemble/mcp-server
# Binary: npx @ssemble/mcp-server
```

### 9.2 MCP Server Directories

| Directory | Requirement | Submission Method |
|-----------|-------------|-------------------|
| **Official MCP Registry** (modelcontextprotocol.io) | `server.json` + npm package | `mcp-publisher publish` CLI |
| **Smithery.ai** | Public HTTPS endpoint + `/.well-known/mcp/server-card.json` | Submit URL at smithery.ai/new |
| **mcp.so** | GitHub repo + npm link | Web form submission |
| **Glama.ai** | npm package with `mcp` keyword | Auto-indexed, or manual |
| **GitHub** | Public repo | Push + add `mcp` topic |
| **Product Hunt** | Landing page + demo | Manual launch |
| **Reddit** | Post | r/LocalLLaMA, r/ChatGPT, r/artificial |
| **Hacker News** | Post | Show HN |

### 9.3 Integration in Ssemble Docs

Add a new page at `content/docs/mcp.mdx`:
- Quick setup guide
- Link to npm package
- Configuration examples for each client (Claude Desktop, Claude Code, Cursor, VS Code, Windsurf)
- Interactive demo

### 9.4 Marketing Opportunities

- Blog post: "Use AI to Create Viral Shorts with Ssemble MCP"
- Add "Works with Claude, Cursor, Windsurf" badges to landing page
- Demo video showing conversational video creation
- Developer newsletter announcement

### 9.5 Deployment Infrastructure (LIVE)

**Hosted on existing API servers** (no new VM needed):
- Servers: api-1 (10.0.0.12) and api-2 (10.0.0.13) — Standard_B2als_v2 (2 vCPUs, 4GB RAM)
- Port: 3100 (PM2 managed as `ssemble-mcp-http`, ~71MB RAM per instance)
- Domain: `mcp.ssemble.com` (Cloudflare proxied → NGINX on 10.0.0.21 → API servers)
- NGINX config: Added in `/etc/nginx/nginx.conf` on load balancer (10.0.0.21)
- Internal optimization: `process.json` sets `SSEMBLE_API_BASE_URL=http://localhost:3000/api/v1`, bypassing Cloudflare/NGINX for API calls
- SSL: Cloudflare handles client-facing SSL, NGINX uses existing Let's Encrypt cert
- Deployment: GitLab CI/CD (manual trigger on `main` branch) or `deploy/deploy.sh` script
- Deployed: March 25, 2026

---

## Appendix: Quick Reference Card

```
┌──────────────────────────────────────────────────────────────┐
│                    SSEMBLE MCP SERVER                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TOOLS (Actions)                                             │
│  ─────────────                                               │
│  create_short        Create a video short (instant, async)   │
│  get_status          Check processing progress               │
│  get_shorts          Retrieve generated clips                │
│  list_requests       List all requests (paginated)           │
│  delete_request      Delete a request permanently            │
│  list_templates      Browse caption templates                │
│  list_music          Browse background music                 │
│  list_game_videos    Browse gameplay overlays                │
│  list_meme_hooks     Browse meme hook clips                  │
│                                                              │
│  ASYNC PATTERN                                               │
│  ─────────────                                               │
│  create_short → get_status → get_shorts                      │
│  (submit)        (poll)       (retrieve)                     │
│                                                              │
│  AUTH                                                        │
│  ────                                                        │
│  SSEMBLE_API_KEY=sk_ssemble_...                              │
│                                                              │
│  INSTALL                                                     │
│  ───────                                                     │
│  npx @ssemble/mcp-server                                     │
│                                                              │
│  API BASE                                                    │
│  ────────                                                    │
│  https://aiclipping.ssemble.com/api/v1                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
