param(
    [Parameter(Mandatory = $true)]
    [long]$OrderId,

    [Parameter(Mandatory = $true)]
    [decimal]$Amount,

    [string]$BackendUrl = "http://localhost:8080"
)

$transactionId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$payload = @{
    id = $transactionId
    gateway = "MBBank"
    transactionDate = [DateTimeOffset]::UtcNow.ToString("o")
    accountNumber = "20119999988888"
    subAccount = ""
    transferType = "in"
    transferAmount = $Amount
    accumulated = $Amount
    code = "DEMO"
    content = "DH$OrderId"
    referenceCode = "DEMO-FLOW-$transactionId"
    description = "UniBus complete flow demo payment"
} | ConvertTo-Json

$uri = "$($BackendUrl.TrimEnd('/'))/api/v1/payments/sepay/webhook"
$response = Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $payload
$response | ConvertTo-Json -Depth 5
