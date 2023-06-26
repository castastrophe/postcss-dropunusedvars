#!/usr/bin/env sh

[ -n "$CI" ] && exit 0

husky install

## Install gh actionlint if user has gh cli
if [[ ! -z "$(command -v gh)" && -z "$(gh extension list | grep actionlint)" ]]; then
  gh extension install cschleiden/gh-actionlint >> /dev/null 2>&1
fi
