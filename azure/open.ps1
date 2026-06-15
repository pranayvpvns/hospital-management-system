# Stop on error
$ErrorActionPreference = "Stop"

Write-Host "Starting Azure OpenAI Setup..."

# ==============================
# CONFIG
# ==============================
$RESOURCE_GROUP = "mnh-hospital-rg"
$LOCATION = "southeastasia"
$OPENAI_NAME = "mnh-openai"   # keep simple name
$DEPLOYMENT_NAME = "mnh-gpt-deploy"  # YOUR MANUAL DEPLOYMENT NAME

# ==============================
# CREATE RESOURCE GROUP
# ==============================
az group create `
  --name $RESOURCE_GROUP `
  --location $LOCATION

# ==============================
# CREATE OPENAI RESOURCE (if not exists)
# ==============================
az cognitiveservices account create `
  --name $OPENAI_NAME `
  --resource-group $RESOURCE_GROUP `
  --location koreacentral `
  --kind OpenAI `
  --sku S0

# ==============================
# GET KEY
# ==============================
$KEY = az cognitiveservices account keys list `
  --name $OPENAI_NAME `
  --resource-group $RESOURCE_GROUP `
  --query key1 -o tsv

# ==============================
# GET ENDPOINT
# ==============================
$ENDPOINT = az cognitiveservices account show `
  --name $OPENAI_NAME `
  --resource-group $RESOURCE_GROUP `
  --query properties.endpoint -o tsv

# ==============================
# SAVE TO .ENV
# ==============================
$envContent = @"
AZURE_OPENAI_API_KEY=$KEY
AZURE_OPENAI_ENDPOINT=$ENDPOINT
AZURE_OPENAI_DEPLOYMENT=$DEPLOYMENT_NAME
AZURE_OPENAI_API_VERSION=2024-02-15-preview
"@

Set-Content -Path ".env" -Value $envContent

Write-Host "✅ Setup Complete!"
Write-Host "Now connect agents."