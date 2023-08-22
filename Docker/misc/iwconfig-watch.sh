#!/bin/bash
while true; do
    iwconfig >> /tmp/iwconfig.watch
    sleep 2
done
