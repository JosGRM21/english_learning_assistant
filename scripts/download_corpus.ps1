$destDir = "c:\dev\personal\english_learning_assistant\vocab_corpus"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

$files = @(
    @{ Url = "https://www.newgeneralservicelist.com/s/NGSL_12_stats.csv"; Out = "NGSL_stats.csv" },
    @{ Url = "https://www.newgeneralservicelist.com/s/NGSL_12_lemmatized_for_teaching.csv"; Out = "NGSL_lemmatized.csv" },
    @{ Url = "https://www.newgeneralservicelist.com/s/NGSL_12_with_English_definitions.xlsx"; Out = "NGSL_definitions.xlsx" },
    @{ Url = "https://www.newgeneralservicelist.com/s/NAWL_12_lemmatized_for_teaching.csv"; Out = "NAWL_lemmatized.csv" },
    @{ Url = "https://www.newgeneralservicelist.com/s/NAWL_12_with_en_definitions.csv"; Out = "NAWL_definitions.csv" }
)

foreach ($f in $files) {
    $outPath = Join-Path $destDir $f.Out
    Write-Host "Descargando $($f.Out)..."
    Invoke-WebRequest -Uri $f.Url -OutFile $outPath -UserAgent "Mozilla/5.0"
}

Write-Host "`nDescargas finalizadas en: $destDir"
Get-ChildItem -Path $destDir | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
