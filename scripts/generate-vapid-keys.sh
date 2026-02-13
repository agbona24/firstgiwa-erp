#!/bin/bash
# Generate VAPID keys for Web Push notifications
# Run: chmod +x scripts/generate-vapid-keys.sh && ./scripts/generate-vapid-keys.sh

echo "🔑 Generating VAPID keys for Web Push notifications..."
echo ""

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

# Generate keys using web-push
VAPID_OUTPUT=$(npx web-push generate-vapid-keys --json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "Installing web-push package..."
    npm install -g web-push
    VAPID_OUTPUT=$(npx web-push generate-vapid-keys --json)
fi

# Extract keys
PUBLIC_KEY=$(echo $VAPID_OUTPUT | grep -o '"publicKey":"[^"]*"' | cut -d'"' -f4)
PRIVATE_KEY=$(echo $VAPID_OUTPUT | grep -o '"privateKey":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PUBLIC_KEY" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Failed to generate VAPID keys"
    exit 1
fi

echo "✅ VAPID keys generated successfully!"
echo ""
echo "Add these to your .env file:"
echo ""
echo "# Web Push VAPID Keys"
echo "VAPID_PUBLIC_KEY=$PUBLIC_KEY"
echo "VAPID_PRIVATE_KEY=$PRIVATE_KEY"
echo "VAPID_SUBJECT=mailto:admin@yourdomain.com"
echo ""

# Optionally append to .env if it exists
if [ -f ".env" ]; then
    read -p "Would you like to append these to .env? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "" >> .env
        echo "# Web Push VAPID Keys (generated $(date))" >> .env
        echo "VAPID_PUBLIC_KEY=$PUBLIC_KEY" >> .env
        echo "VAPID_PRIVATE_KEY=$PRIVATE_KEY" >> .env
        echo "VAPID_SUBJECT=mailto:admin@yourdomain.com" >> .env
        echo "✅ Keys appended to .env"
    fi
fi
