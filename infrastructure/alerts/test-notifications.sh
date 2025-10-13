#!/bin/bash

# Test Alert Notifications
# Sends test notifications to verify action groups work

set -e

# Configuration
RESOURCE_GROUP="mindx-hieunh01-rg"

echo "================================================"
echo "📧 Alert Notification Test"
echo "================================================"
echo ""

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found"
    exit 1
fi

if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure"
    echo "Run: az login"
    exit 1
fi

echo "✅ Azure CLI ready"
echo ""

# List action groups
echo "📋 Available Action Groups:"
echo ""

ACTION_GROUPS=$(az monitor action-group list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[].name" -o tsv)

if [ -z "$ACTION_GROUPS" ]; then
    echo "❌ No action groups found in $RESOURCE_GROUP"
    exit 1
fi

# Display menu
echo "Found action groups:"
i=1
for ag in $ACTION_GROUPS; do
    # Get notification details
    EMAILS=$(az monitor action-group show \
        --name "$ag" \
        --resource-group "$RESOURCE_GROUP" \
        --query "emailReceivers[].emailAddress" -o tsv 2>/dev/null || echo "")
    
    echo "  $i) $ag"
    if [ -n "$EMAILS" ]; then
        for email in $EMAILS; do
            echo "     Email: $email"
        done
    fi
    i=$((i + 1))
done

echo "  0) Test all"
echo ""

read -p "Select action group to test: " choice
echo ""

# Test function
test_action_group() {
    local AG_NAME=$1
    
    echo "📧 Testing: $AG_NAME"
    echo ""
    
    # Get action group details
    AG_INFO=$(az monitor action-group show \
        --name "$AG_NAME" \
        --resource-group "$RESOURCE_GROUP" 2>/dev/null)
    
    if [ -z "$AG_INFO" ]; then
        echo "❌ Action group not found"
        return 1
    fi
    
    # Check for email receivers
    EMAILS=$(echo "$AG_INFO" | jq -r '.emailReceivers[].emailAddress' 2>/dev/null || echo "")
    
    if [ -z "$EMAILS" ]; then
        echo "⚠️  No email notifications configured"
    else
        echo "Email notifications configured:"
        echo "$EMAILS" | while read email; do
            echo "  ✅ $email"
        done
    fi
    
    echo ""
    echo "Sending test notification..."
    echo ""
    
    # Send test notification using Azure
    az monitor action-group test-notifications create \
        --action-group-id "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/actionGroups/$AG_NAME" \
        --alert-type "Metric" \
        --notification-type "Email" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Test notification sent!"
        echo ""
        echo "Expected results:"
        echo "  • Email should arrive within 1-2 minutes"
        echo "  • Subject: 'Test notification from Azure'"
        echo "  • Check spam folder if not received"
        echo ""
    else
        echo ""
        echo "⚠️  Azure CLI test-notifications may not be available"
        echo ""
        echo "Alternative: Create a manual test alert"
        echo ""
        echo "Steps:"
        echo "  1. Go to Azure Portal → Monitor → Action groups"
        echo "  2. Click on: $AG_NAME"
        echo "  3. Click 'Test' button"
        echo "  4. Select notification type (Email)"
        echo "  5. Click 'Test' → Check inbox"
        echo ""
    fi
}

# Process choice
if [ "$choice" = "0" ]; then
    echo "Testing all action groups..."
    echo ""
    for ag in $ACTION_GROUPS; do
        test_action_group "$ag"
        echo ""
        echo "─────────────────────────────────────────"
        echo ""
    done
else
    # Get selected action group
    AG_ARRAY=($ACTION_GROUPS)
    INDEX=$((choice - 1))
    
    if [ $INDEX -lt 0 ] || [ $INDEX -ge ${#AG_ARRAY[@]} ]; then
        echo "❌ Invalid choice"
        exit 1
    fi
    
    SELECTED_AG="${AG_ARRAY[$INDEX]}"
    test_action_group "$SELECTED_AG"
fi

echo ""
echo "✅ Notification test complete!"
echo ""
echo "Verification checklist:"
echo "  ☐ Email received within 2 minutes"
echo "  ☐ Email content is clear"
echo "  ☐ Sender is recognizable (Azure/Microsoft)"
echo "  ☐ Not in spam folder"
echo ""
echo "If email not received:"
echo "  1. Check spam/junk folder"
echo "  2. Verify email address in action group"
echo "  3. Check email service isn't blocking Azure"
echo "  4. Try Portal test method (see above)"
echo ""

