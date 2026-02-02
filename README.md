# CA:RD (Custom Avatar : Real-time Description)

## Overview
- Tablet/Browser: answer AI questions → `/api/generate`
- Raspberry Pi Server: Ollama JSON → SVG → PNG base64 → queue
- Print Station PC: `/print` page claims jobs → local C# PrintAgent prints

## Run (server)

```bash
cd server
npm install
npm --prefix front install
npm --prefix front run build
node server.js
```

## Run (Print Station PC)

```bash
cd csharp
 dotnet run --project PrintAgent/PrintAgent.csproj
```

Open `http://<server-ip>:3000/print` in the print station browser.
Optional: open `http://127.0.0.1:18181/printer` on the print PC to select the default printer.

## Run (Tablet)

Open `http://<server-ip>:3000` and generate/print cards.

## Test Scenarios
1. `GET /api/health` returns `{ ok: true }`.
2. Answer the 4~5 AI questions → preview shows card and stats.
3. Click “인쇄 요청” → print job queued.
4. Print station `/print` claims job automatically.
5. Local agent receives image and prints without dialogs.
6. After print, job is removed from queue (Zero Persistence).
7. Force Ollama failure (set invalid `OLLAMA_URL`) → 3 retries → “현재 주파수가 불안정합니다”.
