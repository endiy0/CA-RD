namespace PrintAgent.Models;

public class PrintRequest
{
    public string ImageBase64 { get; set; } = string.Empty;
    public string? PrinterName { get; set; }
}
