# Base image
FROM balenalib/rpi-raspbian

ENV TZ=Europe/Amsterdam
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update

# Basic tools
RUN apt-get install nano wget curl  -y

# This is needed to build some npm deps
RUN apt-get install make g++ -y

# install node
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install nodejs -y
RUN npm install yarn -g

WORKDIR /root

COPY ./entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
