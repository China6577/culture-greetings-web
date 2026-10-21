$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$projectEnv = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $projectEnv)) {
    $projectPasswordBytes = [byte[]]::new(24)
    [Security.Cryptography.RandomNumberGenerator]::Fill($projectPasswordBytes)
    $projectPassword = [Convert]::ToHexString($projectPasswordBytes).ToLowerInvariant()
    "POSTGRES_PASSWORD=$projectPassword`nWEB_PORT=5173`nAGNES_API_KEY=`n" | Set-Content -LiteralPath $projectEnv -Encoding utf8
    Write-Host '.env created with a random local database password.'
} else {
    Write-Host 'Existing .env preserved.'
}
Push-Location $projectRoot
try {
    docker compose config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Compose configuration is invalid.' }
    Write-Host 'Compose project: culture-greetings-web'
} finally { Pop-Location }
