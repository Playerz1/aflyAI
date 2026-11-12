$envLines = @(Get-Content C:\Users\Administrator\Desktop\aflyAI\.env)
$dbLine = @($envLines | Where-Object { $_.StartsWith('DATABASE_URL=') })[0]
$directLine = @($envLines | Where-Object { $_.StartsWith('DIRECT_URL=') })[0]
$dbUrl = $dbLine.Substring('DATABASE_URL='.Length).Trim('"')
$directUrl = $directLine.Substring('DIRECT_URL='.Length).Trim('"')

$dbUrl | vercel env add DATABASE_URL production 2>&1 | Select-Object -Last 1
$directUrl | vercel env add DIRECT_URL production 2>&1 | Select-Object -Last 1
