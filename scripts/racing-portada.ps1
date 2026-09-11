# Portada del menu de Racing: la foto del local con un degradado a blanco abajo,
# para que corte contra el fondo del menu en vez de terminar en un borde duro.
#
# El degradado va horneado en el PNG y no en el CSS a proposito: la cabecera de
# la plantilla pizzeria la comparten otros locales (La Esquina), y un degradado
# en el CSS les cambiaria la suya sin que nadie lo haya pedido.

Add-Type -AssemblyName System.Drawing

$origen  = "C:\Users\matii\Documents\menu\Racing\banner.png"
$destino = "C:\Users\matii\Documents\Agentcore\menu\public\racing\portada.jpg"
$ALTO_DEGRADE = 0.42   # porcion de abajo que se funde
$PASOS = 160           # tramos del gradiente
$ANCHO_FINAL = 1400    # alcanza y sobra para el ancho de un telefono
$CALIDAD = 82

# Sale en JPG y no en PNG: el PNG de la foto pesaba 3 MB y es lo primero que
# carga el menu en un celular con datos. El degradado termina en blanco pleno,
# asi que no hace falta transparencia.
$src = [System.Drawing.Image]::FromFile($origen)
$escala = [Math]::Min(1.0, $ANCHO_FINAL / $src.Width)
$w = [int]($src.Width * $escala)
$h = [int]($src.Height * $escala)
"origen: $($src.Width)x$($src.Height)  ->  ${w}x${h}"

$bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $w, $h))

# Un unico gradiente, no bandas. Dibujar rectangulos translucidos uno sobre
# otro compone el alfa dos veces en cada solape y deja lineas horizontales
# visibles; el LinearGradientBrush lo resuelve en una sola pasada.
#
# Los tramos siguen una curva (t^1.6) en vez de una recta: asi el blanco entra
# tarde y suave, y la foto no se lava desde el principio.
$inicio = [int]($h * (1 - $ALTO_DEGRADE))
$alto = $h - $inicio

$rect = New-Object System.Drawing.Rectangle 0, ($inicio - 1), $w, ($alto + 2)
$brocha = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $rect,
  [System.Drawing.Color]::FromArgb(0, 255, 255, 255),
  [System.Drawing.Color]::FromArgb(255, 255, 255, 255),
  [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)

$mezcla = New-Object System.Drawing.Drawing2D.ColorBlend $PASOS
$colores = New-Object 'System.Drawing.Color[]' $PASOS
$posiciones = New-Object 'single[]' $PASOS
for ($i = 0; $i -lt $PASOS; $i++) {
  $t = $i / ($PASOS - 1)
  $alfa = [int][Math]::Round(255 * [Math]::Pow($t, 1.6))
  if ($alfa -gt 255) { $alfa = 255 }
  $colores[$i] = [System.Drawing.Color]::FromArgb($alfa, 255, 255, 255)
  $posiciones[$i] = [single]$t
}
$mezcla.Colors = $colores
$mezcla.Positions = $posiciones
$brocha.InterpolationColors = $mezcla
$brocha.WrapMode = [System.Drawing.Drawing2D.WrapMode]::TileFlipXY

$g.FillRectangle($brocha, $rect)
$brocha.Dispose()
# Las ultimas filas, blanco pleno: asi empalma exacto con el fondo del menu.
$solido = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillRectangle($solido, 0, $h - 3, $w, 3)
$solido.Dispose()

$g.Dispose()

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]$CALIDAD)
$bmp.Save($destino, $codec, $params)
$params.Dispose()
$bmp.Dispose()
$src.Dispose()

$kb = [int]((Get-Item $destino).Length / 1KB)
"generada: $destino  (${kb} KB)"
