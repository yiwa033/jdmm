#!/bin/bash
cd /home/z/my-project/.next/standalone
export PORT=3000
export NODE_ENV=production
exec node server.js
