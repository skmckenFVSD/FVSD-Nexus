targetScope = 'subscription'

@minLength(1)
param environmentName string

param location string

@description('Microsoft Entra application (client) ID for the FVSD Nexus web app.')
param entraClientId string

@secure()
@description('Client secret for the FVSD Nexus Entra application. Stored in Key Vault.')
param entraClientSecret string

param tenantId string = '42242eff-faf6-4ccd-aea3-e2c4479f8ccb'
param fabricWorkspaceId string = 'f8a1522b-e94c-4e57-a60e-392d892e27ff'
param fabricSemanticModelId string = 'faaef455-4f1e-4a8c-91f8-8e4eb1c6215e'

var normalizedEnvironment = toLower(replace(environmentName, '_', '-'))
var resourceToken = take(uniqueString(subscription().subscriptionId, environmentName), 8)
var resourceGroupName = 'rg-fvsd-insights-${normalizedEnvironment}'
var tags = {
  'azd-env-name': environmentName
  application: 'FVSD Nexus'
  workload: 'education-analytics'
}

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module application './resources.bicep' = {
  name: 'fvsd-insights-resources'
  scope: resourceGroup
  params: {
    location: location
    resourceToken: resourceToken
    tags: tags
    entraClientId: entraClientId
    entraClientSecret: entraClientSecret
    tenantId: tenantId
    fabricWorkspaceId: fabricWorkspaceId
    fabricSemanticModelId: fabricSemanticModelId
  }
}

output AZURE_LOCATION string = location
output AZURE_RESOURCE_GROUP string = resourceGroup.name
output AZURE_APP_SERVICE_NAME string = application.outputs.appServiceName
output AZURE_APP_SERVICE_URL string = application.outputs.appServiceUrl
output APPLICATIONINSIGHTS_NAME string = application.outputs.applicationInsightsName
output KEY_VAULT_NAME string = application.outputs.keyVaultName
