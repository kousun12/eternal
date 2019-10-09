#!/bin/bash

if [ "$1" = "help" ]; then
	echo "Usage: $(basename "$0") [major | minor | patch | premajor | preminor | prepatch | prerelease]"
	exit
fi

release=$1

if [ -d ".git" ]; then
	changes=$(git status --porcelain)
	if [ -z "${changes}" ]; then
	  version=${release:-minor}
    yarn version --"$version"
    yarn deploy
    git push --tags
	else
		echo "Git status dirty"
		exit 1
	fi
else
  echo "No git"
	exit 1
fi
