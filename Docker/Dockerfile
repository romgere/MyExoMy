# Base image
FROM node:18

ENV TZ=Europe/Amsterdam
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update

# Basic tools
RUN apt-get install nano wget curl  -y

WORKDIR /root

COPY ./entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
