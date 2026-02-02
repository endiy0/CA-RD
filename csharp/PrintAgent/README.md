# PrintAgent

Local HTTP print agent for CA:RD. Runs on Windows and prints PNG data to the default printer (or a named printer).

## Run

```bash
cd csharp
 dotnet run --project PrintAgent/PrintAgent.csproj
```

## Endpoints

- `GET /health` → `{ ok: true }`
- `GET /printers` → `{ printers: string[], defaultPrinter?: string }`
- `POST /print` → `{ imageBase64, printerName? }`

The agent listens on `http://127.0.0.1:18181/`.
