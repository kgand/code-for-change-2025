#!/bin/bash

# Script to push all local branches to the remote repository

echo "=== Pushing All Local Branches Script ==="
echo "----------------------------------------"

# Get the name of the remote repository (usually 'origin')
DEFAULT_REMOTE="origin"
read -p "Enter remote name [$DEFAULT_REMOTE]: " REMOTE
REMOTE=${REMOTE:-$DEFAULT_REMOTE}

# Verify the remote exists
if ! git remote get-url $REMOTE > /dev/null 2>&1; then
    echo "Error: Remote '$REMOTE' does not exist!"
    exit 1
fi

echo "Fetching latest changes from remote..."
git fetch $REMOTE

# Get all local branches
echo "Finding all local branches..."
LOCAL_BRANCHES=$(git branch | sed 's/\*/ /g' | tr -d ' ')

# Count for statistics
TOTAL_BRANCHES=0
PUSHED_BRANCHES=0
FAILED_BRANCHES=0

echo "Starting to push all local branches..."
for BRANCH in $LOCAL_BRANCHES; do
    TOTAL_BRANCHES=$((TOTAL_BRANCHES+1))
    echo "----------------------------------------"
    echo "Processing branch: $BRANCH"
    
    # Check if branch exists on remote
    if git show-ref --verify --quiet refs/remotes/$REMOTE/$BRANCH; then
        echo "Branch exists on remote, pushing changes..."
    else
        echo "Branch doesn't exist on remote, creating it..."
    fi
    
    # Push the branch
    if git push $REMOTE $BRANCH; then
        echo "Successfully pushed $BRANCH to $REMOTE"
        PUSHED_BRANCHES=$((PUSHED_BRANCHES+1))
    else
        echo "Failed to push $BRANCH to $REMOTE"
        FAILED_BRANCHES=$((FAILED_BRANCHES+1))
    fi
done

echo "----------------------------------------"
echo "Push operation completed!"
echo "Total branches processed: $TOTAL_BRANCHES"
echo "Successfully pushed: $PUSHED_BRANCHES"
echo "Failed to push: $FAILED_BRANCHES"
echo "----------------------------------------"
echo "NOTE: To merge branches, create pull requests on your Git platform (GitHub, GitLab, etc.)"
echo "or use git commands to merge locally and then push the merged result." 