# PowerShell script to merge all branches into main and push the updated main branch

Write-Host "=== Complete All Pull Requests Script ===" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

# Get the name of the remote repository (usually 'origin')
$DefaultRemote = "origin"
$Remote = Read-Host "Enter remote name [$DefaultRemote]"
if ([string]::IsNullOrEmpty($Remote)) { $Remote = $DefaultRemote }

# Determine the main branch name (could be 'main' or 'master')
$DefaultMainBranch = "main"
$MainBranch = Read-Host "Enter main branch name [$DefaultMainBranch]"
if ([string]::IsNullOrEmpty($MainBranch)) { $MainBranch = $DefaultMainBranch }

# Verify the remote exists
try {
    $null = git remote get-url $Remote 2>&1
} catch {
    Write-Host "Error: Remote '$Remote' does not exist!" -ForegroundColor Red
    exit 1
}

# Check if main branch exists
if (-not (git show-ref --verify --quiet refs/heads/$MainBranch)) {
    Write-Host "Error: Branch '$MainBranch' does not exist locally!" -ForegroundColor Red
    exit 1
}

Write-Host "Fetching latest changes from remote..." -ForegroundColor Yellow
git fetch $Remote

# Save current branch to return to it later if needed
$CurrentBranch = git branch --show-current

# Update the main branch with latest changes
Write-Host "Updating $MainBranch with latest changes from remote..." -ForegroundColor Yellow
git checkout $MainBranch
git pull $Remote $MainBranch

# Get all local branches except main
Write-Host "Finding all local branches to merge into $MainBranch..." -ForegroundColor Yellow
$BranchesToMerge = (git branch) -replace "^\*?\s*", "" | Where-Object { $_ -ne $MainBranch }

# Statistics
$TotalBranches = 0
$MergedBranches = 0
$FailedMerges = 0
$SkippedBranches = 0

Write-Host "Starting to merge all branches into $MainBranch..." -ForegroundColor Green

foreach ($Branch in $BranchesToMerge) {
    $TotalBranches++
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "Processing branch: $Branch" -ForegroundColor White
    
    # Ask if the user wants to merge this branch
    $MergeConfirm = Read-Host "Do you want to merge '$Branch' into '$MainBranch'? (Y/n)"
    if ($MergeConfirm -eq "n" -or $MergeConfirm -eq "N") {
        Write-Host "Skipping branch: $Branch" -ForegroundColor Yellow
        $SkippedBranches++
        continue
    }
    
    # Update the branch with latest changes
    Write-Host "Updating branch $Branch with latest changes..." -ForegroundColor Yellow
    git checkout $Branch
    git pull $Remote $Branch 2>$null
    
    # Switch back to main and merge the branch
    Write-Host "Merging $Branch into $MainBranch..." -ForegroundColor Yellow
    git checkout $MainBranch
    
    # Attempt to merge
    $MergeOutput = git merge --no-ff $Branch 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully merged $Branch into $MainBranch" -ForegroundColor Green
        $MergedBranches++
    } else {
        Write-Host "Merge conflict detected when merging $Branch into $MainBranch" -ForegroundColor Red
        Write-Host $MergeOutput -ForegroundColor Red
        
        # Ask user what to do with the conflict
        $ConflictOption = Read-Host "What would you like to do? [a]bort, [c]ontinue manually, [s]kip this branch"
        
        if ($ConflictOption -eq "a" -or $ConflictOption -eq "A") {
            Write-Host "Aborting merge..." -ForegroundColor Yellow
            git merge --abort
            $FailedMerges++
        } elseif ($ConflictOption -eq "c" -or $ConflictOption -eq "C") {
            Write-Host "Please resolve conflicts manually and then continue the script." -ForegroundColor Yellow
            Write-Host "After resolving conflicts, commit your changes and then press Enter to continue."
            Read-Host "Press Enter to continue after manually resolving conflicts and committing..."
            $MergedBranches++
        } else {
            Write-Host "Skipping this branch and aborting merge..." -ForegroundColor Yellow
            git merge --abort
            $SkippedBranches++
        }
    }
}

# Push the updated main branch to remote
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Pushing updated $MainBranch to $Remote..." -ForegroundColor Yellow

$PushOutput = git push $Remote $MainBranch 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pushed updated $MainBranch to $Remote!" -ForegroundColor Green
} else {
    Write-Host "Failed to push updated $MainBranch to $Remote" -ForegroundColor Red
    Write-Host $PushOutput -ForegroundColor Red
}

# Return to original branch
if ($CurrentBranch -ne $MainBranch) {
    Write-Host "Returning to original branch: $CurrentBranch" -ForegroundColor Yellow
    git checkout $CurrentBranch
}

# Show summary
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Merge operation completed!" -ForegroundColor Cyan
Write-Host "Total branches processed: $TotalBranches" -ForegroundColor White
Write-Host "Successfully merged: $MergedBranches" -ForegroundColor Green
Write-Host "Failed to merge: $FailedMerges" -ForegroundColor $(if ($FailedMerges -gt 0) { "Red" } else { "Green" })
Write-Host "Skipped branches: $SkippedBranches" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Cyan 