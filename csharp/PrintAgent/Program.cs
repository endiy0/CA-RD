using System.Net;
using System.Text;
using System.Text.Json;
using System.Drawing.Printing;
using PrintAgent.Models;
using PrintAgent.Services;

const string Prefix = "http://127.0.0.1:18181/";

var listener = new HttpListener();
listener.Prefixes.Add(Prefix);
listener.Start();

Console.WriteLine($"PrintAgent listening on {Prefix}");

var printerService = new PrinterService();
var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
string? selectedPrinter = null;

while (listener.IsListening)
{
    var context = await listener.GetContextAsync();
    _ = Task.Run(() => HandleRequest(context));
}

async Task HandleRequest(HttpListenerContext context)
{
    try
    {
        AddCorsHeaders(context.Response);
        if (context.Request.HttpMethod == "OPTIONS")
        {
            context.Response.StatusCode = 204;
            context.Response.Close();
            return;
        }

        var path = context.Request.Url?.AbsolutePath ?? "/";

        if (context.Request.HttpMethod == "GET" && path == "/health")
        {
            await WriteJson(context.Response, new { ok = true }, 200);
            return;
        }

        if (context.Request.HttpMethod == "GET" && path == "/printer")
        {
            var printers = PrinterSettings.InstalledPrinters.Cast<string>().ToArray();
            var current = selectedPrinter ?? new PrinterSettings().PrinterName;
            var html = BuildPrinterPage(printers, current);
            await WriteHtml(context.Response, html, 200);
            return;
        }

        if (context.Request.HttpMethod == "POST" && path == "/printer")
        {
            var body = await new StreamReader(context.Request.InputStream, context.Request.ContentEncoding).ReadToEndAsync();
            var parsed = System.Web.HttpUtility.ParseQueryString(body);
            var printer = parsed["printer"];
            if (string.IsNullOrWhiteSpace(printer))
            {
                await WriteHtml(context.Response, "Printer is required.", 400);
                return;
            }

            selectedPrinter = printer;
            printerService.DefaultPrinterName = printer;
            await WriteHtml(context.Response, BuildPrinterPage(PrinterSettings.InstalledPrinters.Cast<string>().ToArray(), printer), 200);
            return;
        }

        if (context.Request.HttpMethod == "GET" && path == "/printers")
        {
            var printers = PrinterSettings.InstalledPrinters.Cast<string>().ToArray();
            var defaultPrinter = new PrinterSettings().PrinterName;
            await WriteJson(context.Response, new { printers, defaultPrinter }, 200);
            return;
        }

        if (context.Request.HttpMethod == "POST" && path == "/print")
        {
            var body = await new StreamReader(context.Request.InputStream, context.Request.ContentEncoding).ReadToEndAsync();
            var request = JsonSerializer.Deserialize<PrintRequest>(body, jsonOptions);

            if (request == null || string.IsNullOrWhiteSpace(request.ImageBase64))
            {
                await WriteJson(context.Response, new { ok = false, error = "imageBase64 required" }, 400);
                return;
            }

            if (!string.IsNullOrWhiteSpace(selectedPrinter) && string.IsNullOrWhiteSpace(request.PrinterName))
            {
                request.PrinterName = selectedPrinter;
            }

            printerService.PrintBase64(request.ImageBase64, request.PrinterName);
            await WriteJson(context.Response, new { ok = true }, 200);
            return;
        }

        await WriteJson(context.Response, new { ok = false, error = "not found" }, 404);
    }
    catch (Exception ex)
    {
        await WriteJson(context.Response, new { ok = false, error = ex.Message }, 500);
    }
}

static void AddCorsHeaders(HttpListenerResponse response)
{
    response.Headers.Add("Access-Control-Allow-Origin", "*");
    response.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
    response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
}

static string BuildPrinterPage(string[] printers, string current)
{
    var options = string.Join("", printers.Select(p =>
        $"<option value=\"{System.Net.WebUtility.HtmlEncode(p)}\" {(p == current ? "selected" : "")}>{System.Net.WebUtility.HtmlEncode(p)}</option>"));

    return $@"<!doctype html>
<html lang=""en"">
  <head>
    <meta charset=""utf-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"" />
    <title>PrintAgent - Printer</title>
    <style>
      body {{ font-family: Arial, sans-serif; margin: 32px; }}
      .card {{ max-width: 520px; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }}
      label {{ display: block; margin-bottom: 8px; font-weight: 600; }}
      select {{ width: 100%; padding: 8px; }}
      button {{ margin-top: 12px; padding: 8px 14px; }}
      .current {{ margin-top: 10px; color: #555; }}
    </style>
  </head>
  <body>
    <div class=""card"">
      <h2>Printer Selection</h2>
      <form method=""post"" action=""/printer"">
        <label for=""printer"">Choose printer</label>
        <select id=""printer"" name=""printer"">{options}</select>
        <button type=""submit"">Apply</button>
      </form>
      <div class=""current"">Current: {System.Net.WebUtility.HtmlEncode(current)}</div>
    </div>
  </body>
</html>";
}

static async Task WriteJson(HttpListenerResponse response, object payload, int statusCode)
{
    response.StatusCode = statusCode;
    response.ContentType = "application/json";
    var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    var buffer = Encoding.UTF8.GetBytes(json);
    response.ContentLength64 = buffer.Length;
    await response.OutputStream.WriteAsync(buffer, 0, buffer.Length);
    response.Close();
}

static async Task WriteHtml(HttpListenerResponse response, string html, int statusCode)
{
    response.StatusCode = statusCode;
    response.ContentType = "text/html; charset=utf-8";
    var buffer = Encoding.UTF8.GetBytes(html);
    response.ContentLength64 = buffer.Length;
    await response.OutputStream.WriteAsync(buffer, 0, buffer.Length);
    response.Close();
}
