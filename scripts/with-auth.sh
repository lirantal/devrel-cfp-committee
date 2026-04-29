#!/bin/bash
# Simple wrapper script to run commands with 1Password authentication
op run --env-file=./.env -- "$@"
git 