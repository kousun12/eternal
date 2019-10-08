#!/bin/bash

function help {
	echo "Usage: $(basename "$0") [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease]"
}

if [ "$1" = "help" ]; then
	help
	exit
fi

release=$1

if [ -d ".git" ]; then
	changes=$(git status --porcelain)
	if [ -z "${changes}" ]; then
	  version=${$release:-minor}
    echo "--${version}"
#    yarn deploy
	else
		echo "Git status dirty"
		exit 1
	fi
else
  echo "No git"
	exit 1
fi
