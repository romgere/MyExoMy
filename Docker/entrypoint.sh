#!/bin/bash
if [[ $1 == "config" ]]
then
	cd /root/exomy_ws/src/exomy/Robot/scripts
	bash
elif [[ $1 == "autostart" ]]
then
	source /opt/ros/melodic/setup.bash
	cd /root/exomy_ws

	# Install npm deps for both control app & ROS nodejs scrips
	yarn --cwd src/exomy/ install
	
	# build control App
	yarn --cwd src/exomy/ControlApp run build
	# Launch Web GUI
	http-server src/exomy/ControlApp/dist -p 8000 &

	# Run catkin make
	catkin_make	
	# Catkin Sourcing
	source devel/setup.bash

	# Start ROS Robot software nodes
	roslaunch exomy exomy.launch

	bash
elif [[ $1 == "devel" ]]
then
	source /opt/ros/melodic/setup.bash
	cd /root/exomy_ws
	bash
else
	bash
fi

