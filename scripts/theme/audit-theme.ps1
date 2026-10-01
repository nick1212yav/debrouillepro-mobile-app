# scripts/theme/audit-theme.ps1
# DébrouillePro — Audit du thème
# Compatible Windows PowerShell 5.1

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$output = Join-Path $root "scripts\theme\audit-report.txt"

$patterns = @(
    'bg-black\b',
    'bg-white\b',
    'text-white\b',
    'text-black\b',
    'border-white',
    'border-black',
    '#050509',
    '#050714',
    '#0A0A10',
    '#101018',
    '#111827',
    '#0F172A',
    '#FFFFFF',
    '#000000',
    'rgba\(255,\s*255,\s*255',
    'rgba\(0,\s*0,\s*0'
)

$extensions = @(
    '.tsx',
    '.ts',
    '.jsx',
    '.js'
)

$excludedDirectories = @(
    'node_modules',
    'android',
    'ios',
    '.expo',
    '.git',
    'build',
    'dist',
    'scripts',
    'backups'
)

$scanDirectories = @(
    (Join-Path $root 'src'),
    (Join-Path $root 'app')
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       DEBROUILLEPRO THEME AUDIT       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Projet : $root" -ForegroundColor Gray
Write-Host ""

$allResults = New-Object System.Collections.Generic.List[object]

$totalFiles = 0
$totalHits = 0

foreach ($scanDirectory in $scanDirectories) {

    if (-not (Test-Path $scanDirectory)) {
        Write-Host "Dossier absent : $scanDirectory" -ForegroundColor DarkYellow
        continue
    }

    $files = Get-ChildItem `
        -Path $scanDirectory `
        -Recurse `
        -File `
        -ErrorAction SilentlyContinue

    foreach ($file in $files) {

        if ($extensions -notcontains $file.Extension.ToLowerInvariant()) {
            continue
        }

        $normalizedPath = $file.FullName.Replace('/', '\')

        $skip = $false

        foreach ($excluded in $excludedDirectories) {
            $escapedExcluded = [regex]::Escape($excluded)
            $pattern = '[\\/]' + $escapedExcluded + '[\\/]'

            if ($normalizedPath -match $pattern) {
                $skip = $true
                break
            }
        }

        if ($skip) {
            continue
        }

        $totalFiles++

        try {
            $content = [System.IO.File]::ReadAllText($file.FullName)
        }
        catch {
            Write-Host "Impossible de lire : $($file.FullName)" -ForegroundColor DarkYellow
            continue
        }

        if ([string]::IsNullOrEmpty($content)) {
            continue
        }

        foreach ($pattern in $patterns) {

            $matches = [regex]::Matches(
                $content,
                $pattern,
                [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
            )

            foreach ($match in $matches) {

                $before = $content.Substring(0, $match.Index)
                $line = ($before -split "`n").Count

                $relativeFile = $file.FullName.Replace(
                    $root,
                    "."
                ).Replace(
                    "\",
                    "/"
                )

                $result = [PSCustomObject]@{
                    File    = $relativeFile
                    Line    = $line
                    Pattern = $pattern
                    Match   = $match.Value
                }

                $allResults.Add($result)
                $totalHits++
            }
        }
    }
}

# Rapport texte
$reportLines = New-Object System.Collections.Generic.List[string]

$reportLines.Add("DEBROUILLEPRO THEME AUDIT")
$reportLines.Add("=========================")
$reportLines.Add("")
$reportLines.Add("Projet : $root")
$reportLines.Add("Date   : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$reportLines.Add("")
$reportLines.Add("Fichiers scannes : $totalFiles")
$reportLines.Add("Occurrences      : $totalHits")
$reportLines.Add("")

if ($totalHits -eq 0) {

    $reportLines.Add("Aucune occurrence detectee.")

}
else {

    $reportLines.Add("DETAIL DES OCCURRENCES")
    $reportLines.Add("=======================")
    $reportLines.Add("")

    foreach ($result in $allResults) {

        $lineText = "{0}:{1} | {2} | {3}" -f `
            $result.File, `
            $result.Line, `
            $result.Match, `
            $result.Pattern

        $reportLines.Add($lineText)
    }
}

[System.IO.File]::WriteAllLines(
    $output,
    $reportLines,
    [System.Text.UTF8Encoding]::new($false)
)

# Affichage console
Write-Host ""
Write-Host "=== RESUME ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Fichiers scannes : $totalFiles" -ForegroundColor White
Write-Host "Occurrences      : $totalHits" -ForegroundColor White
Write-Host ""
Write-Host "Rapport :" -ForegroundColor Gray
Write-Host $output -ForegroundColor Green
Write-Host ""

if ($totalHits -gt 0) {

    Write-Host "Premieres occurrences detectees :" -ForegroundColor Yellow
    Write-Host ""

    $displayCount = [Math]::Min(30, $allResults.Count)

    for ($i = 0; $i -lt $displayCount; $i++) {

        $r = $allResults[$i]

        $displayLine = "{0}:{1}  {2}" -f `
            $r.File, `
            $r.Line, `
            $r.Match

        Write-Host $displayLine -ForegroundColor Gray
    }

    if ($allResults.Count -gt 30) {

        Write-Host ""
        Write-Host `
            "... $($allResults.Count - 30) occurrences supplementaires dans le rapport." `
            -ForegroundColor DarkYellow
    }
}

Write-Host ""
Write-Host "=== AUDIT TERMINE ===" -ForegroundColor Cyan
Write-Host ""