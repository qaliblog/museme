#!/bin/bash

# Script to set up git remote for museme repository

echo "Setting up git remote for museme..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
fi

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "Remote 'origin' already exists. Updating URL..."
    git remote set-url origin git@github.com:qaliblog/museme.git
else
    echo "Adding remote 'origin'..."
    git remote add origin git@github.com:qaliblog/museme.git
fi

# Verify the remote
echo ""
echo "Current remotes:"
git remote -v

echo ""
echo "Git remote setup complete!"
echo "You can now push to the repository with:"
echo "  git push -u origin main"
echo ""
echo "Note: Make sure you have SSH keys set up for GitHub."
