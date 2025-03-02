# PowerShell script to push all local branches to the remote repository

Write-Host "=== Pushing All Local Branches Script ===" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

# Get the name of the remote repository (usually 'origin')
$DefaultRemote = "origin"
$Remote = Read-Host "Enter remote name [$DefaultRemote]"
if ([string]::IsNullOrEmpty($Remote)) { $Remote = $DefaultRemote }

# Verify the remote exists
try {
    $null = git remote get-url $Remote 2>&1
} catch {
    Write-Host "Error: Remote '$Remote' does not exist!" -ForegroundColor Red
    exit 1
}

Write-Host "Fetching latest changes from remote..." -ForegroundColor Yellow
git fetch $Remote

# Get all local branches
Write-Host "Finding all local branches..." -ForegroundColor Yellow
$LocalBranches = (git branch) -replace "^\*?\s*", ""

# Count for statistics
$TotalBranches = 0
$PushedBranches = 0
$FailedBranches = 0

Write-Host "Starting to push all local branches..." -ForegroundColor Green
foreach ($Branch in $LocalBranches) {
    $TotalBranches++
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "Processing branch: $Branch" -ForegroundColor White
    
    # Check if branch exists on remote
    if (git show-ref --verify --quiet refs/remotes/$Remote/$Branch) {
        Write-Host "Branch exists on remote, pushing changes..." -ForegroundColor Yellow
    } else {
        Write-Host "Branch doesn't exist on remote, creating it..." -ForegroundColor Yellow
    }
    
    # Push the branch
    $pushResult = git push $Remote $Branch
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully pushed $Branch to $Remote" -ForegroundColor Green
        $PushedBranches++
    } else {
        Write-Host "Failed to push $Branch to $Remote" -ForegroundColor Red
        Write-Host $pushResult -ForegroundColor Red
        $FailedBranches++
    }
}

Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Push operation completed!" -ForegroundColor Cyan
Write-Host "Total branches processed: $TotalBranches" -ForegroundColor White
Write-Host "Successfully pushed: $PushedBranches" -ForegroundColor Green
Write-Host "Failed to push: $FailedBranches" -ForegroundColor $(if ($FailedBranches -gt 0) { "Red" } else { "Green" })
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "NOTE: To merge branches, create pull requests on your Git platform (GitHub, GitLab, etc.)" -ForegroundColor Yellow
Write-Host "or use git commands to merge locally and then push the merged result." -ForegroundColor Yellow 