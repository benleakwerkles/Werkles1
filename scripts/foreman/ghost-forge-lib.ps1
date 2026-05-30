function Get-GhostForgeRepoRoot {
  Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
}

if (-not ("System.Net.Http.HttpClient" -as [type])) {
  Add-Type -AssemblyName System.Net.Http
}

function Import-GhostForgeEnvFile {
  param([string]$Path = (Join-Path (Get-GhostForgeRepoRoot) "ghost-forge-worker\.env"))

  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $parts = $line -split "=", 2
    if ($parts.Count -ne 2) {
      return
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    if ($name -and -not [string]::IsNullOrWhiteSpace($value) -and $value -notmatch '^\$\(') {
      Set-Item -Path "Env:$name" -Value $value -Force
    }
  }
}

function Test-GhostForgeEnvValuePresent {
  param(
    [string]$Value,
    [string[]]$PlaceholderPatterns = @("your-project", "replace", "example", "set-this")
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  foreach ($pattern in $PlaceholderPatterns) {
    if ($Value -match [regex]::Escape($pattern)) {
      return $false
    }
  }

  return $true
}

function Get-GhostForgeBaseUrl {
  param([string]$BaseUrl = $env:PUBLIC_BASE_URL)

  if (-not $BaseUrl) {
    $BaseUrl = "https://werkles-ghost-forge1.onrender.com"
  }

  return $BaseUrl.TrimEnd("/").TrimEnd(".")
}

function Invoke-GhostForgeApi {
  param(
    [ValidateSet("GET", "POST")]
    [string]$Method,

    [Parameter(Mandatory = $true)]
    [string]$Path,

    [hashtable]$Headers = @{},

    [string]$Body,

    [int]$TimeoutSec = 90
  )

  $base = Get-GhostForgeBaseUrl
  $uri = if ($Path.StartsWith("http")) { $Path } else { "$base$Path" }
  $client = [System.Net.Http.HttpClient]::new()
  $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)

  try {
    $request = [System.Net.Http.HttpRequestMessage]::new($Method, $uri)
    foreach ($key in $Headers.Keys) {
      if ($key -eq "Content-Type") {
        continue
      }
      $request.Headers.TryAddWithoutValidation($key, [string]$Headers[$key]) | Out-Null
    }

    if ($Method -eq "POST") {
      $contentType = if ($Headers["Content-Type"]) { [string]$Headers["Content-Type"] } else { "application/json" }
      $request.Content = [System.Net.Http.StringContent]::new($Body, [System.Text.Encoding]::UTF8, $contentType)
    }

    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $statusCode = [int]$response.StatusCode
    $json = $null
    if ($text -and $text.TrimStart().StartsWith("{")) {
      try {
        $json = $text | ConvertFrom-Json
      } catch {
        $json = $null
      }
    }

    return [pscustomobject]@{
      StatusCode = $statusCode
      Body       = $text
      Json       = $json
      Ok         = $response.IsSuccessStatusCode
    }
  }
  finally {
    $client.Dispose()
  }
}

function Save-GhostForgeDownload {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,

    [Parameter(Mandatory = $true)]
    [string]$OutFile,

    [int]$TimeoutSec = 120
  )

  $client = [System.Net.Http.HttpClient]::new()
  $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)

  try {
    $bytes = $client.GetByteArrayAsync($Uri).GetAwaiter().GetResult()
    $dir = Split-Path $OutFile -Parent
    if ($dir) {
      New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    [System.IO.File]::WriteAllBytes($OutFile, $bytes)
  }
  finally {
    $client.Dispose()
  }
}
