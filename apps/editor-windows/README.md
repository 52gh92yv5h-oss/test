# Fred Editor för Windows (C# + WebView2)

Ett tunt native Windows-program i C#/WPF som bäddar in den fristående
Fred Editor-appen (WASM-variantens enfils-`index.html`) via **WebView2**.
All dokumentlogik körs i den inbäddade appen — skalet tillhandahåller bara
fönstret, WebView2-miljön och en beständig lagringsplats. Det ger full
funktionsparitet med webbvarianten (typografi, 3×3-sidhuvud, parameterlägen
inline/panel, inbyggd standardmall, extern start m.m.) utan en tredje
motorimplementation att underhålla.

## Köra

1. Hämta `FredEditor-win-x64`-artefakten från GitHub Actions-workflowet
   **"Bygg Windows-editorn (C# + WebView2)"** (fliken *Actions* på GitHub,
   körs vid push till `main` eller manuellt via *Run workflow*).
2. Packa upp och dubbelklicka på `FredEditor.exe` (mappen `app/` måste
   ligga bredvid exen).

**Krav:** Windows 10/11 med **Microsoft Edge WebView2 Runtime**
(förinstallerad på Windows 11 och de flesta Windows 10-datorer; annars
visar appen en hänvisning till nedladdningssidan).

Autosparade dokument lagras i `%LocalAppData%\FredEditor`.

## Bygga

```bash
# 1. Bygg den inbäddade editorn (repo-roten; engångssteg: rustup target add wasm32-unknown-unknown)
npm run build:editor-wasm

# 2. Publicera Windows-exen (kräver .NET 8 SDK; fungerar även från Linux/macOS
#    tack vare EnableWindowsTargeting)
dotnet publish apps/editor-windows/FredEditor.csproj -c Release -r win-x64 --self-contained -p:PublishSingleFile=true
```

Resultatet hamnar i `apps/editor-windows/bin/Release/net8.0-windows/win-x64/publish/`
(`FredEditor.exe` + `app/index.html`, ~156 MB självständig exe utan
.NET-installationskrav).

Obs: exen kan **byggas** på Linux men bara **köras** på Windows — därför
sker körverifieringen i GitHub Actions-workflowet på en Windows-runner.

## Arkitektur

```
apps/editor-windows/
├── FredEditor.csproj    net8.0-windows, WPF, WebView2, EnableWindowsTargeting
├── App.xaml(.cs)        WPF-appens startpunkt
├── MainWindow.xaml(.cs) Fönster + WebView2; virtuell host fred-editor.local
│                        mappas till app/-mappen så localStorage/origin fungerar
└── (app/index.html)     Kopieras från apps/editor-wasm/dist/ vid bygge
```
