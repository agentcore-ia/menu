# Genera los assets de Racing a partir del unico archivo que dio el local
# (logo.png, transparente, celeste #0096F7 + negro).
#
#   logo.png        el original, para fondos claros
#   logo-claro.png  el mismo logo todo en blanco, para el fondo celeste
#   hero.png        1200x800  celeste con el logo blanco   (cabecera del menu)
#   compartir.png   1200x630  celeste con el logo blanco   (preview de WhatsApp)
#   icono.png        512x512  celeste con el logo blanco   (favicon / apple-touch)
#
# El blanco se hace con una ColorMatrix (no pixel por pixel): fuerza R,G,B a 1
# y deja pasar el alfa, asi el antialiasing del borde se conserva.

Add-Type -AssemblyName System.Drawing

$origen  = "C:\Users\matii\Documents\menu\Racing\logo.png"
$destino = "C:\Users\matii\Documents\Agentcore\menu\public\racing"
$celeste = [System.Drawing.Color]::FromArgb(255, 0, 150, 247)   # #0096F7

New-Item -ItemType Directory -Force -Path $destino | Out-Null
Copy-Item $origen (Join-Path $destino "logo.png") -Force

$logo = [System.Drawing.Image]::FromFile($origen)

# --- ColorMatrix que pinta todo de blanco conservando el alfa ---------------
$m = New-Object System.Drawing.Imaging.ColorMatrix
$m.Matrix00 = 0; $m.Matrix01 = 0; $m.Matrix02 = 0; $m.Matrix03 = 0; $m.Matrix04 = 0
$m.Matrix10 = 0; $m.Matrix11 = 0; $m.Matrix12 = 0; $m.Matrix13 = 0; $m.Matrix14 = 0
$m.Matrix20 = 0; $m.Matrix21 = 0; $m.Matrix22 = 0; $m.Matrix23 = 0; $m.Matrix24 = 0
$m.Matrix30 = 0; $m.Matrix31 = 0; $m.Matrix32 = 0; $m.Matrix33 = 1; $m.Matrix34 = 0
$m.Matrix40 = 1; $m.Matrix41 = 1; $m.Matrix42 = 1; $m.Matrix43 = 0; $m.Matrix44 = 1

$attr = New-Object System.Drawing.Imaging.ImageAttributes
$attr.SetColorMatrix($m)

function Dibujar {
  param([System.Drawing.Graphics]$g, [int]$x, [int]$y, [int]$w, [int]$h, [bool]$blanco)
  $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
  if ($blanco) {
    $g.DrawImage($logo, $rect, 0, 0, $logo.Width, $logo.Height,
                 [System.Drawing.GraphicsUnit]::Pixel, $attr)
  } else {
    $g.DrawImage($logo, $rect)
  }
}

function NuevoLienzo {
  param([int]$ancho, [int]$alto, [System.Drawing.Color]$fondo, [double]$ocupa, [string]$salida)
  $bmp = New-Object System.Drawing.Bitmap $ancho, $alto,
         ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear($fondo)

  # El logo entra por ancho o por alto, lo que primero toque el margen.
  $escala = [Math]::Min(($ancho * $ocupa) / $logo.Width, ($alto * $ocupa) / $logo.Height)
  $w = [int]($logo.Width * $escala)
  $h = [int]($logo.Height * $escala)
  Dibujar $g ([int](($ancho - $w) / 2)) ([int](($alto - $h) / 2)) $w $h $true

  $g.Dispose()
  $bmp.Save((Join-Path $destino $salida), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  "  $salida  ${ancho}x${alto}"
}

# --- logo blanco suelto, con el mismo tamano que el original ---------------
$blanco = New-Object System.Drawing.Bitmap $logo.Width, $logo.Height,
          ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gb = [System.Drawing.Graphics]::FromImage($blanco)
$gb.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
Dibujar $gb 0 0 $logo.Width $logo.Height $true
$gb.Dispose()
$blanco.Save((Join-Path $destino "logo-claro.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$blanco.Dispose()

"generados en $destino"
"  logo.png        (copia del original)"
"  logo-claro.png  $($logo.Width)x$($logo.Height) blanco"
NuevoLienzo 1200 800 $celeste 0.72 "hero.png"
NuevoLienzo 1200 630 $celeste 0.70 "compartir.png"
NuevoLienzo  512 512 $celeste 0.82 "icono.png"

$logo.Dispose()
$attr.Dispose()
