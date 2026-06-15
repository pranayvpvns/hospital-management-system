# # Stop on error
# $ErrorActionPreference = "Stop"

# Write-Host "Starting Azure Setup..."

# # ==============================
# # CONFIG
# # ==============================
# $RESOURCE_GROUP = "mnh-hospital-rg"
# $LOCATION = "southeastasia"

# $MYSQL_SERVER_NAME = "mnh-mysql-server-$((Get-Random))"
# $MYSQL_ADMIN = "azureuser"
# $MYSQL_PASSWORD = "Rohith@12345!"  

# $MYSQL_DB = "mnh_hospital_db"
# $ENV_FILE = ".env"

# # ==============================
# # LOGIN CHECK
# # ==============================
# Write-Host "Checking Azure login..."
# az account show 2>$null
# if ($LASTEXITCODE -ne 0) {
#     az login
# }

# # ==============================
# # CREATE RESOURCE GROUP
# # ==============================
# Write-Host "Creating Resource Group..."
# az group create `
#   --name $RESOURCE_GROUP `
#   --location $LOCATION

# # ==============================
# # CREATE MYSQL SERVER
# # ==============================
# Write-Host "Creating MySQL Server..."

# az mysql flexible-server create `
#   --resource-group $RESOURCE_GROUP `
#   --name $MYSQL_SERVER_NAME `
#   --location $LOCATION `
#   --admin-user $MYSQL_ADMIN `
#   --admin-password $MYSQL_PASSWORD `
#   --sku-name Standard_B1ms `
#   --tier Burstable `
#   --storage-size 20 `
#   --version 8.0.21 `
#   --public-access 0.0.0.0

# # ==============================
# # FIREWALL RULE
# # ==============================
# Write-Host "Adding Firewall Rule..."

# az mysql flexible-server firewall-rule create `
#   --resource-group $RESOURCE_GROUP `
#   --name $MYSQL_SERVER_NAME `
#   --rule-name AllowAll `
#   --start-ip-address 0.0.0.0 `
#   --end-ip-address 255.255.255.255

# # ==============================
# # WAIT UNTIL SERVER READY
# # ==============================
# Write-Host "Waiting for MySQL server..."

# while ($true) {
#     $status = az mysql flexible-server show `
#         --resource-group $RESOURCE_GROUP `
#         --name $MYSQL_SERVER_NAME `
#         --query "state" -o tsv

#     if ($status -eq "Ready") {
#         Write-Host "MySQL Server is Ready!"
#         break
#     }

#     Write-Host "Still starting... waiting 10 seconds"
#     Start-Sleep -Seconds 10
# }

# # ==============================
# # RESET PASSWORD (SAFETY)
# # ==============================
# Write-Host "Ensuring password is set..."

# az mysql flexible-server update `
#   --resource-group $RESOURCE_GROUP `
#   --name $MYSQL_SERVER_NAME `
#   --admin-password $MYSQL_PASSWORD

# # ==============================
# # CREATE DATABASE
# # ==============================
# Write-Host "Creating Database..."

# az mysql flexible-server db create `
#   --resource-group $RESOURCE_GROUP `
#   --server-name $MYSQL_SERVER_NAME `
#   --database-name $MYSQL_DB

# # ==============================
# # GET MYSQL HOST
# # ==============================
# $MYSQL_HOST = az mysql flexible-server show `
#   --resource-group $RESOURCE_GROUP `
#   --name $MYSQL_SERVER_NAME `
#   --query "fullyQualifiedDomainName" `
#   -o tsv

# Write-Host "MySQL Host: $MYSQL_HOST"

# # ==============================
# # CREATE SQL FILE
# # ==============================
# Write-Host "Preparing SQL script..."

# $sqlFile = "init.sql"

# @"
# USE $MYSQL_DB;

# CREATE TABLE IF NOT EXISTS patients (
#     id INT AUTO_INCREMENT PRIMARY KEY,
#     name VARCHAR(100),
#     age INT,
#     gender VARCHAR(10),
#     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# );

# CREATE TABLE IF NOT EXISTS visits (
#     id INT AUTO_INCREMENT PRIMARY KEY,
#     patient_id INT,
#     visit_date DATE,
#     service VARCHAR(100),
#     cost DECIMAL(10,2)
# );

# CREATE TABLE IF NOT EXISTS billing (
#     id INT AUTO_INCREMENT PRIMARY KEY,
#     patient_id INT,
#     total_amount DECIMAL(10,2),
#     status VARCHAR(20)
# );

# INSERT INTO patients (name, age, gender) VALUES
# ('Rohith', 22, 'Male'),
# ('Anita', 30, 'Female');
# "@ | Out-File -FilePath $sqlFile -Encoding utf8

# # ==============================
# # EXECUTE SQL USING AZURE CLI
# # ==============================
# Write-Host "Executing SQL via Azure CLI..."

# cmd /c "mysql --ssl-mode=REQUIRED -h $MYSQL_HOST -u $MYSQL_USER_FULL -p$MYSQL_PASSWORD $MYSQL_DB < init.sql"

# # ==============================
# # SAVE TO .env
# # ==============================
# Write-Host "Saving credentials to .env..."

# $MYSQL_USER_FULL = "$MYSQL_ADMIN@$MYSQL_SERVER_NAME"

# @"
# MYSQL_HOST=$MYSQL_HOST
# MYSQL_USER=$MYSQL_USER_FULL
# MYSQL_PASSWORD=$MYSQL_PASSWORD
# MYSQL_DATABASE=$MYSQL_DB
# "@ | Out-File -FilePath $ENV_FILE -Encoding utf8

# Write-Host "Setup Complete!"

# Stop on error
$ErrorActionPreference = "Stop"

Write-Host "Starting Azure Setup..."

# ==============================
# CONFIG
# ==============================
$RESOURCE_GROUP = "mnh-hospital-rg"
$LOCATION = "southeastasia"

# Using a consistent name for your existing server or a new random one
$MYSQL_SERVER_NAME = "mnh-mysql-server-1723298262" 
$MYSQL_ADMIN = "azureuser"
$MYSQL_PASSWORD = "Rohith@12345!"  

$MYSQL_DB = "mnh_hospital_db"
$ENV_FILE = ".env"

# ==============================
# LOGIN CHECK
# ==============================
Write-Host "Checking Azure login..."
az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    az login
}

# ==============================
# CREATE RESOURCE GROUP
# ==============================
Write-Host "Creating Resource Group..."
az group create `
  --name $RESOURCE_GROUP `
  --location $LOCATION

# ==============================
# CREATE MYSQL SERVER
# ==============================
Write-Host "Creating/Verifying MySQL Server..."

az mysql flexible-server create `
  --resource-group $RESOURCE_GROUP `
  --name $MYSQL_SERVER_NAME `
  --location $LOCATION `
  --admin-user $MYSQL_ADMIN `
  --admin-password $MYSQL_PASSWORD `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --storage-size 20 `
  --version 8.0.21 `
  --public-access 0.0.0.0

# ==============================
# FIREWALL RULE
# ==============================
Write-Host "Adding Firewall Rule..."

az mysql flexible-server firewall-rule create `
  --resource-group $RESOURCE_GROUP `
  --name $MYSQL_SERVER_NAME `
  --rule-name AllowAll `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 255.255.255.255

# ==============================
# CREATE DATABASE
# ==============================
Write-Host "Creating Database..."

az mysql flexible-server db create `
  --resource-group $RESOURCE_GROUP `
  --server-name $MYSQL_SERVER_NAME `
  --database-name $MYSQL_DB

# ==============================
# GET MYSQL HOST
# ==============================
$MYSQL_HOST = az mysql flexible-server show `
  --resource-group $RESOURCE_GROUP `
  --name $MYSQL_SERVER_NAME `
  --query "fullyQualifiedDomainName" `
  -o tsv

Write-Host "MySQL Host: $MYSQL_HOST"

# ==============================
# PREPARE SQL SCRIPT
# ==============================
Write-Host "Preparing SQL script..."

$sqlFile = "init.sql"

@"
USE $MYSQL_DB;

CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    age INT,
    gender VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    visit_date DATE,
    service VARCHAR(100),
    cost DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS billing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    total_amount DECIMAL(10,2),
    status VARCHAR(20)
);

INSERT INTO patients (name, age, gender) VALUES
('Rohith', 22, 'Male'),
('Anita', 30, 'Female');
"@ | Out-File -FilePath $sqlFile -Encoding utf8

# ==============================
# EXECUTE SQL VIA MYSQL CLIENT
# ==============================
Write-Host "Executing SQL via MySQL Client..."

$MYSQL_USER_SIMPLE = $MYSQL_ADMIN 

# Fixed for PowerShell redirection
Get-Content $sqlFile | mysql --host=$MYSQL_HOST --user=$MYSQL_USER_SIMPLE --password=$MYSQL_PASSWORD --ssl-mode=REQUIRED $MYSQL_DB

if ($LASTEXITCODE -ne 0) {
    Write-Warning "SQL Execution failed. Check if mysql-client is installed."
}

# ==============================
# SAVE TO .env
# ==============================
Write-Host "Saving credentials to .env..."

@"
MYSQL_HOST=$MYSQL_HOST
MYSQL_USER=$MYSQL_USER_SIMPLE
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_DATABASE=$MYSQL_DB
"@ | Out-File -FilePath $ENV_FILE -Encoding utf8

Write-Host "Setup Complete!"