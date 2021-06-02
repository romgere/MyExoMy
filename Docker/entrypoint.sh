#!/bin/bash
if [[ $1 == "config" ]]
then
	cd /root/exomy_ws/src/exomy/Robot/scripts
	bash
elif [[ $1 == "autostart" ]]
then
	source /opt/ros/melodic/setup.bash
	cd /root/exomy_ws

	# Install & build control App
	npm install --prefix src/exomy/ControlApp/
	npm run build --prefix src/exomy/ControlApp/
	# Launch Web GUI
	http-server src/exomy/ControlApp/build -p 8000 &

	# Run catkin make
	catkin_make
	# Install npm package for our ROS nodejs script
	npm install --prefix src/exomy/Robot/
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

