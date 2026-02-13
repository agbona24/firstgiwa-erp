#!/bin/bash
# Generate PWA icons from SVG using ImageMagick or rsvg-convert
# Run: chmod +x generate-icons.sh && ./generate-icons.sh

ICON_SVG="public/icons/icon.svg"
OUTPUT_DIR="public/icons"
SIZES=(72 96 128 144 152 192 384 512)

echo "🎨 Generating PWA icons..."

# Check for available conversion tools
if command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    for size in "${SIZES[@]}"; do
        convert -background none -resize ${size}x${size} "$ICON_SVG" "${OUTPUT_DIR}/icon-${size}x${size}.png"
        echo "  ✓ Generated icon-${size}x${size}.png"
    done
elif command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert..."
    for size in "${SIZES[@]}"; do
        rsvg-convert -w $size -h $size "$ICON_SVG" > "${OUTPUT_DIR}/icon-${size}x${size}.png"
        echo "  ✓ Generated icon-${size}x${size}.png"
    done
else
    echo "⚠️  No image conversion tool found."
    echo "   Install ImageMagick: brew install imagemagick"
    echo "   Or librsvg: brew install librsvg"
    echo ""
    echo "   Alternatively, use an online SVG to PNG converter:"
    echo "   1. Visit https://cloudconvert.com/svg-to-png"
    echo "   2. Upload public/icons/icon.svg"
    echo "   3. Generate sizes: 72, 96, 128, 144, 152, 192, 384, 512"
    echo "   4. Save to public/icons/ as icon-{size}x{size}.png"
    exit 1
fi

echo ""
echo "✅ All icons generated successfully!"
echo "   Icons saved to: $OUTPUT_DIR"
