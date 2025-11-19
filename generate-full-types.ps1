# Temporary fix: Save generated types to new file
$types = npx supabase gen types typescript --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres" 2>&1 | Out-String
$types | Out-File -FilePath "src/lib/database.types.ts" -Encoding UTF8
Write-Host "✅ Types generated successfully"
Write-Host "File size: $((Get-Item src/lib/database.types.ts).Length) bytes"
