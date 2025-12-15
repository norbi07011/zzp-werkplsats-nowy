# PowerShell script to execute template migration
# Reads SQL file and executes via Python + Supabase

$sqlFile = "c:\AI PROJEKT\zzp-werkplaats (3)\database-migrations\20250111_create_predefined_templates.sql"
$pythonExe = "C:/AI PROJEKT/zzp-werkplaats (3)/.venv/Scripts/python.exe"

Write-Host "Loading SQL file..." -ForegroundColor Cyan
$sqlContent = Get-Content $sqlFile -Raw

Write-Host "SQL file size: $($sqlContent.Length) characters" -ForegroundColor Yellow

Write-Host "`nExecuting migration via Supabase..." -ForegroundColor Cyan
Write-Host "Note: This will create 10 predefined invoice templates" -ForegroundColor Yellow

# Execute via Python script (creates temporary Python file)
$pyScript = @"
import os
from supabase import create_client, Client

url = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('VITE_SUPABASE_SERVICE_KEY')

if not url or not key:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")
    exit(1)

supabase: Client = create_client(url, key)

# Read SQL from file
with open(r'$sqlFile', 'r', encoding='utf-8') as f:
    sql = f.read()

print(f"Executing {len(sql)} characters of SQL...")

try:
    # Execute SQL
    result = supabase.rpc('exec_sql', {'query': sql}).execute()
    print("✅ Migration executed successfully!")
    print(result)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
"@

Write-Host "`nCreating temporary Python executor..." -ForegroundColor Cyan
$pyScript | Out-File -FilePath "temp-migration.py" -Encoding UTF8

# Run Python script
Write-Host "Running migration..." -ForegroundColor Green
& $pythonExe "temp-migration.py"

# Cleanup
Remove-Item "temp-migration.py" -ErrorAction SilentlyContinue

Write-Host "`nMigration complete!" -ForegroundColor Green
