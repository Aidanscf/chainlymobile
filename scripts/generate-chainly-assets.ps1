Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$assetsDir = "e:\anything1\mobile\assets\images"

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  if ($diameter -gt $Width) { $diameter = $Width }
  if ($diameter -gt $Height) { $diameter = $Height }

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Draw-ChainLink {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$CenterX,
    [float]$CenterY,
    [float]$Scale,
    [string]$PrimaryHex,
    [string]$SecondaryHex
  )

  $primary = [System.Drawing.ColorTranslator]::FromHtml($PrimaryHex)
  $secondary = [System.Drawing.ColorTranslator]::FromHtml($SecondaryHex)

  $penPrimary = New-Object System.Drawing.Pen($primary, (52 * $Scale))
  $penSecondary = New-Object System.Drawing.Pen($secondary, (52 * $Scale))
  $penPrimary.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $penSecondary.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $penPrimary.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penPrimary.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penSecondary.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penSecondary.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $pathA = New-RoundedRectPath -X (-175 * $Scale) -Y (-94 * $Scale) -Width (245 * $Scale) -Height (188 * $Scale) -Radius (68 * $Scale)
  $pathB = New-RoundedRectPath -X (-70 * $Scale) -Y (-94 * $Scale) -Width (245 * $Scale) -Height (188 * $Scale) -Radius (68 * $Scale)

  $matrixA = New-Object System.Drawing.Drawing2D.Matrix
  $matrixA.RotateAt(-32, (New-Object System.Drawing.PointF(0, 0)))
  $matrixA.Translate($CenterX, $CenterY, [System.Drawing.Drawing2D.MatrixOrder]::Append)
  $pathA.Transform($matrixA)

  $matrixB = New-Object System.Drawing.Drawing2D.Matrix
  $matrixB.RotateAt(32, (New-Object System.Drawing.PointF(0, 0)))
  $matrixB.Translate($CenterX, $CenterY, [System.Drawing.Drawing2D.MatrixOrder]::Append)
  $pathB.Transform($matrixB)

  $Graphics.DrawPath($penSecondary, $pathA)
  $Graphics.DrawPath($penPrimary, $pathB)

  $accentBrush = New-Object System.Drawing.SolidBrush($primary)
  $Graphics.FillEllipse(
    $accentBrush,
    $CenterX + (122 * $Scale),
    $CenterY - (128 * $Scale),
    (42 * $Scale),
    (42 * $Scale)
  )

  $accentBrush.Dispose()
  $penPrimary.Dispose()
  $penSecondary.Dispose()
  $pathA.Dispose()
  $pathB.Dispose()
  $matrixA.Dispose()
  $matrixB.Dispose()
}

function New-Canvas {
  param(
    [int]$Width,
    [int]$Height,
    [System.Drawing.Color]$Background
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear($Background)

  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-Canvas {
  param(
    $Canvas,
    [string]$Path
  )

  $Canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Dispose()
}

$white = [System.Drawing.ColorTranslator]::FromHtml("#FFFFFF")
$transparent = [System.Drawing.Color]::Transparent
$charcoal = "#111827"
$orange = "#FF6A2A"
$softOrange = [System.Drawing.ColorTranslator]::FromHtml("#FFF3EC")

# App icon: white background with soft badge and mark.
$icon = New-Canvas -Width 1024 -Height 1024 -Background $white
$iconBadgeBrush = New-Object System.Drawing.SolidBrush($softOrange)
$icon.Graphics.FillEllipse($iconBadgeBrush, 176, 176, 672, 672)
Draw-ChainLink -Graphics $icon.Graphics -CenterX 512 -CenterY 512 -Scale 1.18 -PrimaryHex $orange -SecondaryHex $charcoal
$iconBadgeBrush.Dispose()
Save-Canvas -Canvas $icon -Path (Join-Path $assetsDir "icon.png")

# Adaptive icon: transparent foreground mark only.
$adaptive = New-Canvas -Width 1024 -Height 1024 -Background $transparent
Draw-ChainLink -Graphics $adaptive.Graphics -CenterX 512 -CenterY 512 -Scale 1.1 -PrimaryHex $orange -SecondaryHex $charcoal
Save-Canvas -Canvas $adaptive -Path (Join-Path $assetsDir "adaptive-icon.png")

# Favicon: compact mark on white.
$favicon = New-Canvas -Width 256 -Height 256 -Background $white
$favBadgeBrush = New-Object System.Drawing.SolidBrush($softOrange)
$favicon.Graphics.FillEllipse($favBadgeBrush, 28, 28, 200, 200)
Draw-ChainLink -Graphics $favicon.Graphics -CenterX 128 -CenterY 128 -Scale 0.28 -PrimaryHex $orange -SecondaryHex $charcoal
$favBadgeBrush.Dispose()
Save-Canvas -Canvas $favicon -Path (Join-Path $assetsDir "favicon.png")

# Splash asset: transparent logo + wordmark for white background splash.
$splash = New-Canvas -Width 1024 -Height 1024 -Background $transparent
Draw-ChainLink -Graphics $splash.Graphics -CenterX 512 -CenterY 380 -Scale 0.76 -PrimaryHex $orange -SecondaryHex $charcoal

$wordmarkColor = [System.Drawing.ColorTranslator]::FromHtml($charcoal)
$wordmarkBrush = New-Object System.Drawing.SolidBrush($wordmarkColor)
$fontFamily = New-Object System.Drawing.FontFamily("Segoe UI Semibold")
$wordmarkFont = New-Object System.Drawing.Font($fontFamily, 60, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$splash.Graphics.DrawString("Chainly", $wordmarkFont, $wordmarkBrush, (New-Object System.Drawing.RectangleF(0, 650, 1024, 90)), $format)

$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#6B7280"))
$subFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$splash.Graphics.DrawString("Ride smarter.", $subFont, $subBrush, (New-Object System.Drawing.RectangleF(0, 730, 1024, 42)), $format)

$subBrush.Dispose()
$wordmarkBrush.Dispose()
$subFont.Dispose()
$wordmarkFont.Dispose()
$fontFamily.Dispose()
$format.Dispose()
Save-Canvas -Canvas $splash -Path (Join-Path $assetsDir "splash-icon.png")

Write-Output "Generated Chainly branding assets."
