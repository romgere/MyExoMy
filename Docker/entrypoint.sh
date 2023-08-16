#!/bin/bash
if [[ $1 == "config" ]]
then
	cd /root/rover-app/packages/RoverApp/scripts
	bash
  
elif [[ $1 == "autostart" ]]
then
	cd /root/rover-app/packages/RoverApp

	# Install npm deps for control app & ROS nodejs scrips
	yarn install --production

	# run robot software
	yarn tsx src/index.ts 
	bash
elif [[ $1 == "devel" ]]
then
	cd /root/rover-app/packages/RoverApp
	bash
else
	bash
fi

