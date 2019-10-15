#!/bin/bash

if [ "$1" = "help" ]; then
  echo "Usage: $(basename "$0") [major | minor | patch | premajor | preminor | prepatch | prerelease]"
  exit
fi

release=$1

changes=$(git status --porcelain)
if [ -z "${changes}" ]; then
  version=${release:-minor}
  yarn version --"$version"
  yarn deploy
  git push --tags
else
  echo "git dirty, commit first"
  exit 1
fi
