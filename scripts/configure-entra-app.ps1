[CmdletBinding()]
param(
    [string]$RedirectUri = 'http://localhost:5173/signin-oidc',
    [string]$ClientId,
    [switch]$RotateSecret,
    [switch]$GrantAdminConsent
)

$ErrorActionPreference = 'Stop'
$tenantId = '42242eff-faf6-4ccd-aea3-e2c4479f8ccb'
$microsoftGraphApiId = '00000003-0000-0000-c000-000000000000'
$powerBiApiId = '00000009-0000-0000-c000-000000000000'
$datasetReadAllScopeId = '7f33e027-4039-419b-938e-2f8ca153e68e'
$projectPath = Join-Path $PSScriptRoot '..\src\FVSDNexus.Api\FVSDNexus.Api.csproj'

az account show --output none
if ($LASTEXITCODE -ne 0) { throw 'Run az login before this script.' }

$environmentValues = @(azd env get-values 2>$null)
$existingClientIdLine = $environmentValues | Where-Object { $_ -like 'ENTRA_CLIENT_ID=*' } | Select-Object -First 1
$hasExistingSecret = $null -ne ($environmentValues | Where-Object { $_ -like 'ENTRA_CLIENT_SECRET=*' } | Select-Object -First 1)
$existingClientId = if (-not [string]::IsNullOrWhiteSpace($ClientId)) {
    $ClientId
} elseif ($existingClientIdLine) {
    ($existingClientIdLine -replace '^ENTRA_CLIENT_ID=', '').Trim('"')
} else {
    $null
}
$clientId = if ([string]::IsNullOrWhiteSpace($existingClientId)) {
    az ad app create `
        --display-name 'FVSD Nexus' `
        --sign-in-audience AzureADMyOrg `
        --web-redirect-uris $RedirectUri `
        --query appId `
        --output tsv
} else {
    $existingClientId
}

if ([string]::IsNullOrWhiteSpace($clientId)) { throw 'The Entra app registration could not be created or found.' }

# Admin consent returns to the API callback on the same browser-facing origin.
$adminConsentRedirectUri = $RedirectUri -replace '/signin-oidc$', '/api/auth/admin-consent/callback'
$currentRedirects = @(az ad app show --id $clientId --query 'web.redirectUris' --output json | ConvertFrom-Json)
$allRedirects = @($currentRedirects + $RedirectUri + $adminConsentRedirectUri | Sort-Object -Unique)
az ad app update --id $clientId --web-redirect-uris $allRedirects --output none

$servicePrincipalId = az ad sp show --id $clientId --query id --output tsv 2>$null
if ([string]::IsNullOrWhiteSpace($servicePrincipalId)) {
    az ad sp create --id $clientId --output none
}

function Add-DelegatedPermission([string]$ResourceAppId, [string]$ScopeId) {
    # Flatten before filtering: the previous query counted matching API entries,
    # not matching scopes, so an API already listed hid a missing scope.
    $existing = az ad app show --id $clientId `
        --query "length(requiredResourceAccess[?resourceAppId=='$ResourceAppId'].resourceAccess[] | [?id=='$ScopeId'])" `
        --output tsv
    if ($existing -eq '0') {
        az ad app permission add `
            --id $clientId `
            --api $ResourceAppId `
            --api-permissions "$ScopeId=Scope" `
            --output none
    }
}

$graphServicePrincipal = az ad sp show --id $microsoftGraphApiId --output json | ConvertFrom-Json
$userReadScopeId = $graphServicePrincipal.oauth2PermissionScopes |
    Where-Object { $_.value -eq 'User.Read' } |
    Select-Object -ExpandProperty id -First 1
if ([string]::IsNullOrWhiteSpace($userReadScopeId)) {
    throw 'Microsoft Graph delegated permission User.Read could not be resolved.'
}

# User.Read covers the signed-in user's own assignedLicenses/assignedPlans for the
# Microsoft 365 Copilot licence check; User.Read.All is not needed.
Add-DelegatedPermission $microsoftGraphApiId $userReadScopeId
Add-DelegatedPermission $powerBiApiId $datasetReadAllScopeId

if ($GrantAdminConsent) {
    az ad app permission admin-consent --id $clientId --output none
}

azd env set ENTRA_CLIENT_ID $clientId
dotnet user-secrets set 'AzureAd:ClientId' $clientId --project $projectPath | Out-Null
if (-not $hasExistingSecret -or $RotateSecret) {
    $clientSecret = az ad app credential reset `
        --id $clientId `
        --append `
        --display-name 'FVSD Nexus deployment' `
        --years 1 `
        --query password `
        --output tsv
    if ([string]::IsNullOrWhiteSpace($clientSecret)) { throw 'A client credential could not be created.' }

    azd env set ENTRA_CLIENT_SECRET $clientSecret
    dotnet user-secrets set 'AzureAd:ClientSecret' $clientSecret --project $projectPath | Out-Null
    $clientSecret = $null
}

Write-Host "FVSD Nexus app registration configured. Client ID: $clientId"
if (-not $GrantAdminConsent) {
    Write-Host 'An Entra administrator must grant tenant consent for delegated Microsoft Graph User.Read and Power BI Dataset.Read.All.'
}

$appOrigin = $RedirectUri -replace '/signin-oidc$', ''
Write-Host "Admin consent redirect URI registered: $adminConsentRedirectUri"
Write-Host 'With Nexus running, a tenant administrator signs in and opens:'
Write-Host "  Copilot licence check (Graph User.Read): $appOrigin/api/auth/admin-consent?target=copilot"
Write-Host "  Work IQ confirmed actions (Foundry):     $appOrigin/api/auth/admin-consent?target=workiq"
