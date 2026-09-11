# Prepara una imagen de portada para el menu: la achica a un ancho razonable y
# la guarda en JPG.
#
# La portada es lo primero que carga el menu en un celular con datos, y las que
# llegan del diseñador suelen venir en PNG de varios MB. Un JPG de ~1400px pesa
# una decima parte sin diferencia visible en pantalla.
#
# Uso:
#   .\comprimir-portada.ps1 -Origen ..\..\..\menu\panacea\header.png `
#                           -Destino ..\public\panacea\portada.jpg
#
# Si la imagen tiene transparencia se aplana contra -Fondo (las portadas se
# apoyan sobre el fondo del menu, no sobre nada).

param(
  [Parameter(Mandatory = $true)][string]$Origen,
  [Parameter(Mandatory = $true)][string]$Destino,
  [int]$Ancho = 1400,
  [int]$Calidad = 82,
  [string]$Fondo = "#FFFFFF"
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile((Resolve-Path $Origen))
$escala = [Math]::Min(1.0, $Ancho / $src.Width)
$w = [int]($src.Width * $escala)
$h = [int]($src.Height * $escala)

$bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
# El JPG no guarda alfa: sin esto, lo transparente sale negro.
$g.Clear([System.Drawing.ColorTranslator]::FromHtml($Fondo))
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $w, $h))
$g.Dispose()

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]$Calidad)

$rutaDestino = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Destino))
New-Item -ItemType Directory -Force -Path (Split-Path $rutaDestino) | Out-Null
$bmp.Save($rutaDestino, $codec, $params)
$params.Dispose(); $bmp.Dispose(); $src.Dispose()

$antes = [int]((Get-Item (Resolve-Path $Origen)).Length / 1KB)
$despues = [int]((Get-Item $rutaDestino).Length / 1KB)
"$($src.Width)x$($src.Height) ${antes} KB  ->  ${w}x${h} ${despues} KB"
"generada: $rutaDestino"
