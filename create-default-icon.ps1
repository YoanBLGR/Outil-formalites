# Script PowerShell pour créer une icône PNG simple
Add-Type -AssemblyName System.Drawing

# Créer une image 1024x1024
$width = 1024
$height = 1024
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Fond bleu
$blue = [System.Drawing.Color]::FromArgb(37, 99, 235) # #2563eb
$brush = New-Object System.Drawing.SolidBrush($blue)
$graphics.FillRectangle($brush, 0, 0, $width, $height)

# Texte blanc "F"
$white = [System.Drawing.Color]::White
$font = New-Object System.Drawing.Font("Arial", 600, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush($white)
$text = "F"
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF(0, 0, $width, $height)
$graphics.DrawString($text, $font, $textBrush, $rect, $stringFormat)

# Sauvegarder
$bitmap.Save("$PSScriptRoot\app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Nettoyer
$graphics.Dispose()
$bitmap.Dispose()
$brush.Dispose()
$textBrush.Dispose()
$font.Dispose()

Write-Host "Icone creee: app-icon.png" -ForegroundColor Green

