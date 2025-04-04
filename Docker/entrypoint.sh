#!/bin/bash

# Remove Control app from mono repo to reduce dependency (not used directly on Raspberry)
node /clean-monorepo.js

if [[ $1 == "autostart" ]]
then
	cd /root/rover-app/packages/RoverApp

	# Install npm deps for control app & ROS nodejs scrips
	yarn install --production

	# run robot software
	yarn start
	bash
elif [[ $1 == "devel" ]]
then
	cd /root/rover-app/packages/RoverApp
	bash
else
	bash
fi

