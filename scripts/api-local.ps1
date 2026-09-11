# Levanta el API del menu contra Supabase. El .env del repo usa los nombres de
# Supabase (SUPABASE_URL / SUPABASE_ANON_KEY) y el server espera los de Capta,
# asi que aca se mapean. No imprime ningun valor.
$raiz = Split-Path $PSScriptRoot -Parent
$env:CAPTA_DATA_PROVIDER = "supabase"
$env:CAPTA_DB_PROVIDER = "supabase"

Get-Content (Join-Path $raiz ".env") -Encoding utf8 | ForEach-Object {
  if ($_ -match "^\s*#" -or $_ -notmatch "=") { return }
  $partes = $_ -split "=", 2
  $k = $partes[0].Trim()
  $v = $partes[1].Trim().Trim('"').Trim("'")
  if ($k -eq "SUPABASE_URL") {
    $env:CAPTA_SUPABASE_URL = $v
  } elseif ($k -eq "SUPABASE_ANON_KEY") {
    $env:CAPTA_SUPABASE_API_KEY = $v
  } elseif ($k -eq "SUPABASE_SERVICE_ROLE_KEY") {
    $env:CAPTA_SUPABASE_WRITE_API_KEY = $v
  }
}

if (-not $env:CAPTA_SUPABASE_URL) { throw "falta SUPABASE_URL en .env" }
if (-not $env:CAPTA_SUPABASE_API_KEY) { throw "falta SUPABASE_ANON_KEY en .env" }

Set-Location $raiz
node server/index.js
