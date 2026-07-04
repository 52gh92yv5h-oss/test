using System;
using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace FredEditor;

/// <summary>
/// Tunt Windows-skal runt den fristående Fred Editor-appen (WASM-variantens
/// enfils-HTML). All dokumentlogik körs i den inbäddade appen; skalet
/// tillhandahåller bara fönstret och WebView2-miljön. Kravspec V11,
/// avsnitt 5 (Windows-applikation).
/// </summary>
public partial class MainWindow : Window
{
    private const string VirtualHost = "fred-editor.local";

    public MainWindow()
    {
        InitializeComponent();
        Loaded += async (_, _) => await InitializeAsync();
    }

    private async System.Threading.Tasks.Task InitializeAsync()
    {
        try
        {
            // WebView2:s användardata (cache, localStorage för autosparade
            // dokument) läggs under %LocalAppData%\FredEditor.
            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "FredEditor");
            var environment = await CoreWebView2Environment.CreateAsync(
                userDataFolder: userDataFolder);
            await WebView.EnsureCoreWebView2Async(environment);

            // Appens HTML ligger i "app"-mappen bredvid exen (Content-item i
            // csproj). Virtuell host ger en riktig origin så att localStorage
            // och navigering fungerar som i en vanlig webbläsare.
            var appDir = Path.Combine(AppContext.BaseDirectory, "app");
            WebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                VirtualHost, appDir, CoreWebView2HostResourceAccessKind.Allow);

            WebView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            WebView.CoreWebView2.Settings.IsStatusBarEnabled = false;

            WebView.Source = new Uri($"https://{VirtualHost}/index.html");
        }
        catch (WebView2RuntimeNotFoundException)
        {
            ShowError(
                "Microsoft Edge WebView2 Runtime saknas.\n\n" +
                "WebView2 är förinstallerat på Windows 11 och de flesta Windows 10-datorer. " +
                "Installera det annars från https://developer.microsoft.com/microsoft-edge/webview2/ " +
                "och starta Fred Editor igen.");
        }
        catch (Exception ex)
        {
            ShowError($"Fred Editor kunde inte starta: {ex.Message}");
        }
    }

    private void ShowError(string message)
    {
        WebView.Visibility = Visibility.Collapsed;
        ErrorText.Text = message;
        ErrorText.Visibility = Visibility.Visible;
    }
}
