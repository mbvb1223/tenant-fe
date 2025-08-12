#!/bin/bash
set -e

if [ "${CIRCLE_BRANCH}" = "dev" ]; then
  echo "$DEV_GOOGLE_CREDENTIALS" > credentials.json
  GOOGLE_APPLICATION_CREDENTIALS=credentials.json ./node_modules/.bin/firebase deploy --project tenant-fe
fi
if [ "${CIRCLE_BRANCH}" = "main" ]; then
  echo "$DEV_GOOGLE_CREDENTIALS" > credentials.json
  GOOGLE_APPLICATION_CREDENTIALS=credentials.json ./node_modules/.bin/firebase deploy --project tenant-fe
fi
