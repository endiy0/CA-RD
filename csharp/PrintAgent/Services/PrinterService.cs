using System.Drawing;
using System.Drawing.Printing;

namespace PrintAgent.Services;

public class PrinterService
{
    public string? DefaultPrinterName { get; set; }

    public void PrintBase64(string imageBase64, string? printerName)
    {
        var bytes = Convert.FromBase64String(imageBase64);
        using var stream = new MemoryStream(bytes);
        using var image = Image.FromStream(stream);

        using var document = new PrintDocument();
        document.PrintController = new StandardPrintController();

        var targetPrinter = !string.IsNullOrWhiteSpace(printerName) ? printerName : DefaultPrinterName;
        if (!string.IsNullOrWhiteSpace(targetPrinter))
        {
            document.PrinterSettings.PrinterName = targetPrinter;
        }

        if (!document.PrinterSettings.IsValid)
        {
            throw new InvalidOperationException("Printer not found.");
        }

        document.PrintPage += (_, args) =>
        {
            var bounds = args.MarginBounds;
            var scale = Math.Min((float)bounds.Width / image.Width, (float)bounds.Height / image.Height);
            var targetWidth = (int)(image.Width * scale);
            var targetHeight = (int)(image.Height * scale);
            var offsetX = bounds.Left + (bounds.Width - targetWidth) / 2;
            var offsetY = bounds.Top + (bounds.Height - targetHeight) / 2;

            args.Graphics.DrawImage(image, offsetX, offsetY, targetWidth, targetHeight);
            args.HasMorePages = false;
        };

        document.Print();
    }
}
