#!/bin/bash
# Persistent dev server launcher
cd /home/z/my-project
pkill -f "next dev" 2>/dev/null
sleep 1
rm -f dev.log
# Use setsid to fully detach from this shell's session
# Redirect all FDs to log file
setsid bash -c './node_modules/.bin/next dev -p 3000 > dev.log 2>&1 & echo $! > /tmp/pp-dev.pid; disown' < /dev/null > /dev/null 2>&1
sleep 3
# Verify
if [ -f /tmp/pp-dev.pid ]; then
  PID=$(cat /tmp/pp-dev.pid)
  if kill -0 $PID 2>/dev/null; then
    echo "Dev server started with PID=$PID"
  else
    echo "Process died"
  fi
fi
