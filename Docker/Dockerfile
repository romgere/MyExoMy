# Base image
FROM ros:melodic 

ENV TZ=Europe/Amsterdam
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Fix expired GPG key issue (https://askubuntu.com/questions/1341378/invalid-signature-error-for-ros-repository-while-trying-to-do-sudo-apt-get-updat/1341386)
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys F42ED6FBAB17C654

# Basic tools
RUN apt-get update && \
    apt-get install vim nano git tmux wget curl net-tools iputils-ping  -y

# Install additional ros packages
RUN apt-get update && apt-get install ros-melodic-rosbridge-server ros-melodic-joy -y

# Install packages for web application
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get update && \
    apt-get install nodejs -y
RUN npm install http-server yarn -g

# Install packages for camera use
RUN apt-get update && \
    apt-get install ros-melodic-web-video-server ros-melodic-usb-cam -y

# Add ros sourcing to bashrc
RUN echo ". /opt/ros/melodic/setup.bash" >> ~/.bashrc

# Create Ros workspace
ENV EXOMY_WS=/root/exomy_ws
RUN mkdir -p $EXOMY_WS/src

WORKDIR /root

COPY ./entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
