#!/bin/bash
if [[ $1 == "config" ]]
then
	cd /root/exomy_ws/src/exomy/Robot/scripts
	bash
elif [[ $1 == "autostart" ]]
then
	source /opt/ros/melodic/setup.bash
	cd /root/exomy_ws
	# Run catkin make
	catkin_make
	# Install npm package for our ROS nodejs script
	npm install --prefix src/exomy/Robot/
	# Same for control App
	npm install --prefix src/exomy/ControlApp/
	# Catkin Sourcing
	source devel/setup.bash
	# Launch Web GUI
	http-server src/exomy/ControlApp/ -p 8000 &
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

