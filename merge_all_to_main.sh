#!/bin/bash

# Script to merge all branches into main and push the updated main branch

echo "=== Complete All Pull Requests Script ==="
echo "----------------------------------------"

# Get the name of the remote repository (usually 'origin')
DEFAULT_REMOTE="origin"
read -p "Enter remote name [$DEFAULT_REMOTE]: " REMOTE
REMOTE=${REMOTE:-$DEFAULT_REMOTE}

# Determine the main branch name (could be 'main' or 'master')
DEFAULT_MAIN_BRANCH="main"
read -p "Enter main branch name [$DEFAULT_MAIN_BRANCH]: " MAIN_BRANCH
MAIN_BRANCH=${MAIN_BRANCH:-$DEFAULT_MAIN_BRANCH}

# Verify the remote exists
if ! git remote get-url $REMOTE > /dev/null 2>&1; then
    echo "Error: Remote '$REMOTE' does not exist!"
    exit 1
fi

# Check if main branch exists
if ! git show-ref --verify --quiet refs/heads/$MAIN_BRANCH; then
    echo "Error: Branch '$MAIN_BRANCH' does not exist locally!"
    exit 1
fi

echo "Fetching latest changes from remote..."
git fetch $REMOTE

# Save current branch to return to it later if needed
CURRENT_BRANCH=$(git branch --show-current)

# Update the main branch with latest changes
echo "Updating $MAIN_BRANCH with latest changes from remote..."
git checkout $MAIN_BRANCH
git pull $REMOTE $MAIN_BRANCH

# Get all local branches except main
echo "Finding all local branches to merge into $MAIN_BRANCH..."
BRANCHES_TO_MERGE=$(git branch | sed 's/\*/ /g' | tr -d ' ' | grep -v "^$MAIN_BRANCH$")

# Statistics
TOTAL_BRANCHES=0
MERGED_BRANCHES=0
FAILED_MERGES=0
SKIPPED_BRANCHES=0

echo "Starting to merge all branches into $MAIN_BRANCH..."

for BRANCH in $BRANCHES_TO_MERGE; do
    TOTAL_BRANCHES=$((TOTAL_BRANCHES+1))
    echo "----------------------------------------"
    echo "Processing branch: $BRANCH"
    
    # Ask if the user wants to merge this branch
    read -p "Do you want to merge '$BRANCH' into '$MAIN_BRANCH'? (Y/n): " MERGE_CONFIRM
    if [[ "$MERGE_CONFIRM" == "n" || "$MERGE_CONFIRM" == "N" ]]; then
        echo "Skipping branch: $BRANCH"
        SKIPPED_BRANCHES=$((SKIPPED_BRANCHES+1))
        continue
    fi
    
    # Update the branch with latest changes
    echo "Updating branch $BRANCH with latest changes..."
    git checkout $BRANCH
    git pull $REMOTE $BRANCH 2>/dev/null
    
    # Switch back to main and merge the branch
    echo "Merging $BRANCH into $MAIN_BRANCH..."
    git checkout $MAIN_BRANCH
    
    # Attempt to merge
    if git merge --no-ff $BRANCH; then
        echo "Successfully merged $BRANCH into $MAIN_BRANCH"
        MERGED_BRANCHES=$((MERGED_BRANCHES+1))
    else
        echo "Merge conflict detected when merging $BRANCH into $MAIN_BRANCH"
        
        # Ask user what to do with the conflict
        read -p "What would you like to do? [a]bort, [c]ontinue manually, [s]kip this branch: " CONFLICT_OPTION
        
        if [[ "$CONFLICT_OPTION" == "a" || "$CONFLICT_OPTION" == "A" ]]; then
            echo "Aborting merge..."
            git merge --abort
            FAILED_MERGES=$((FAILED_MERGES+1))
        elif [[ "$CONFLICT_OPTION" == "c" || "$CONFLICT_OPTION" == "C" ]]; then
            echo "Please resolve conflicts manually and then continue the script."
            echo "After resolving conflicts, commit your changes and then press Enter to continue."
            read -p "Press Enter to continue after manually resolving conflicts and committing..."
            MERGED_BRANCHES=$((MERGED_BRANCHES+1))
        else
            echo "Skipping this branch and aborting merge..."
            git merge --abort
            SKIPPED_BRANCHES=$((SKIPPED_BRANCHES+1))
        fi
    fi
done

# Push the updated main branch to remote
echo "----------------------------------------"
echo "Pushing updated $MAIN_BRANCH to $REMOTE..."

if git push $REMOTE $MAIN_BRANCH; then
    echo "Successfully pushed updated $MAIN_BRANCH to $REMOTE!"
else
    echo "Failed to push updated $MAIN_BRANCH to $REMOTE"
fi

# Return to original branch
if [[ "$CURRENT_BRANCH" != "$MAIN_BRANCH" ]]; then
    echo "Returning to original branch: $CURRENT_BRANCH"
    git checkout $CURRENT_BRANCH
fi

# Show summary
echo "----------------------------------------"
echo "Merge operation completed!"
echo "Total branches processed: $TOTAL_BRANCHES"
echo "Successfully merged: $MERGED_BRANCHES"
echo "Failed to merge: $FAILED_MERGES"
echo "Skipped branches: $SKIPPED_BRANCHES"
echo "----------------------------------------" 