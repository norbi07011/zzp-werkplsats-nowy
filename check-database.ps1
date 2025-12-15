# ╔══════════════════════════════════════════════════════════════════════╗
# ║  Quick Database Check - Verify posts table columns                  ║
# ╚══════════════════════════════════════════════════════════════════════╝

Write-Host "🔍 Checking posts table columns..." -ForegroundColor Cyan
Write-Host ""

# Check if we have Supabase connection
if (-not $env:SUPABASE_DB_URL) {
    Write-Host "❌ SUPABASE_DB_URL not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 To fix this, run:" -ForegroundColor Yellow
    Write-Host '$env:SUPABASE_DB_URL = "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "OR apply migration manually via Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "1. Open: https://supabase.com/dashboard" -ForegroundColor Gray
    Write-Host "2. Go to SQL Editor" -ForegroundColor Gray
    Write-Host "3. Copy contents of: database/migrations/COMPLETE_FEED_MIGRATION.sql" -ForegroundColor Gray
    Write-Host "4. Paste and RUN" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Database URL found" -ForegroundColor Green
Write-Host ""

# Simple query to check columns
$query = @"
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('location', 'category', 'budget', 'likes_count', 'comments_count')
ORDER BY column_name;
"@

Write-Host "Running query..." -ForegroundColor Cyan
Write-Host ""

try {
    # Try psql if available
    $result = psql $env:SUPABASE_DB_URL -c $query -t 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "📊 Current posts table columns:" -ForegroundColor Green
        Write-Host $result
        Write-Host ""
        
        # Check what's missing
        $hasLocation = $result -match "location"
        $hasCategory = $result -match "category"
        $hasBudget = $result -match "budget"
        
        if (-not $hasLocation) {
            Write-Host "❌ location column: MISSING" -ForegroundColor Red
        } else {
            Write-Host "✅ location column: EXISTS" -ForegroundColor Green
        }
        
        if (-not $hasCategory) {
            Write-Host "❌ category column: MISSING" -ForegroundColor Red
        } else {
            Write-Host "✅ category column: EXISTS" -ForegroundColor Green
        }
        
        if (-not $hasBudget) {
            Write-Host "❌ budget column: MISSING" -ForegroundColor Red
        } else {
            Write-Host "✅ budget column: EXISTS" -ForegroundColor Green
        }
        
        Write-Host ""
        
        if (-not ($hasLocation -and $hasCategory -and $hasBudget)) {
            Write-Host "⚠️  MIGRATION REQUIRED!" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Apply migration: database/migrations/COMPLETE_FEED_MIGRATION.sql" -ForegroundColor Cyan
        } else {
            Write-Host "✅ All filter columns exist!" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ psql not available" -ForegroundColor Red
        Write-Host ""
        Write-Host "📝 Please apply migration manually via Supabase Dashboard" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Please apply migration manually via Supabase Dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
