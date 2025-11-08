#!/bin/bash
set -e
# This script deploys the Firebase project based on the branch.
npm install --no-save firebase-tools

if [ "${CIRCLE_BRANCH}" = "dev" ]; then
  echo "$DEV_GOOGLE_CREDENTIALS" > credentials.json
  GOOGLE_APPLICATION_CREDENTIALS=credentials.json ./node_modules/.bin/firebase deploy --project tenant-fe
fi

if [ "${CIRCLE_BRANCH}" = "main" ]; then
  echo "$DEV_GOOGLE_CREDENTIALS" > credentials.json
  GOOGLE_APPLICATION_CREDENTIALS=credentials.json ./node_modules/.bin/firebase deploy --project tenant-fe
fi

if [ "${CIRCLE_BRANCH}" = "cct" ]; then
  echo "$DEV_GOOGLE_CREDENTIALS" > credentials.json
  GOOGLE_APPLICATION_CREDENTIALS=credentials.json ./node_modules/.bin/firebase hosting:channel:deploy cct --only hosting:tenant-fe --project tenant-fe
fi
