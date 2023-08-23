#!/bin/bash

# Ensure we start with a fresh file
sudo rm /tmp/iwconfig.watch

# Run iwconfig each second
while true; do
    iwconfig > /tmp/iwconfig.watch
    sleep 1
done
