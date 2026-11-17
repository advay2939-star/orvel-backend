#!/bin/bash
# Deploys ~/Desktop/Orvel/1-website-LIVE to www.orvelsound.com (Vercel project "orvel").
cd "$(dirname "$0")/1-website-LIVE" || exit 1
echo "Deploying $(pwd) to production…"
npx vercel --prod
echo
echo "Finished. You can close this window."
read -n 1 -s
