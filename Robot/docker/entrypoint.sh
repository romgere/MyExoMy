#!/bin/bash
if [[ $1 == "config" ]]
then
	cd /root/exomy_ws/src/exomy/scripts
	bash
elif [[ $1 == "autostart" ]]
then
	source /opt/ros/melodic/setup.bash
	cd /root/exomy_ws
	catkin_make

	# Install npm package for our nodejs script
	npm install --prefix src/exomy/

	source devel/setup.bash

	http-server src/exomy/gui -p 8000 &
	roslaunch exomy exomy.launch

	bash
elif [[ $1 == "devel" ]]
then
	source /opt/ros/melodic/setup.bash
	cd /root/exomy_ws
	# catkin_make
	# source devel/setup.bash
	bash
else
	bash
fi

