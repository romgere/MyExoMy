#!/bin/bash
# run_exomy- A script to run containers for dedicated functions of exomy

help_text="Usage: "$0" [MODE] [OPTIONS]
    A script to run ExoMy in different configurations
    Options:
        -a, --autostart     Toggles autostart mode on or off
        -d, --devel         Runs the development mode to change some code of ExoMy 
        -h, --help          Shows this text
"

### Main
# Initialize parameters 
container_name="exomy"
image_name="exomy"

# Process parameters
if [ "$1" != "" ]; then
    case $1 in
        -a | --autostart)       
                                container_name="${container_name}_autostart"
                                start_command="autostart"
                                options="--restart always"
                                ;;
        -s | --stop_autostart)  
                                docker container stop "${container_name}_autostart"
                                exit     
                                ;;
        -d | --devel)           
                                container_name="${container_name}_devel"
                                start_command="devel"
                                options="--restart always"
                                ;;  
        -h | --help )           echo "$help_text"
                                exit
                                ;;
        * )                     echo "ERROR: Not a valid mode!"
                                echo "$help_text"
                                exit 1
    esac
else
    echo "ERROR: You need to specify a mode!"
    echo "$help_text"
    exit
fi


echo "installing services..."
sudo sh ./misc/install-services.sh
echo "services installed."

# Build docker image from Dockerfile in directory 
directory=$( dirname "$0" )
docker build -t $image_name $directory

# Stop any of the 3 containers if running
RUNNING_CONTAINERS=$( docker container ls -a -q --filter name=exomy* )
if [ -n "$RUNNING_CONTAINERS" ]; then
    docker rm -f "$RUNNING_CONTAINERS"
fi

MY_EXOMY_FOLDER=${MY_EXOMY_FOLDER:-~/MyExoMy}
MY_EXOMY_FOLDER=`realpath $MY_EXOMY_FOLDER`

echo "using ${MY_EXOMY_FOLDER} as EXOMY FOLDER"


# Run docker container
docker run \
    -it \
    -v ${MY_EXOMY_FOLDER}:/root/rover-app \
    --mount type=bind,source=/tmp/iwconfig.watch,target=/tmp/iwconfig.watch,readonly \
    -p 3000:3000 \
    --privileged \
    ${options} \
    --name "${container_name}" \
    "${image_name}" \
    "${start_command}"
