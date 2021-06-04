This is based on [ESA - ExoMy project](https://github.com/esa-prl/ExoMy/)

TODO: 

- switch to yarn
- use yarn workspace
- put eslint conf on Robot folder

# My ExoMy Project Structure

### `ControlApp` folder

Contains the web app used to control the ExoMy Robot

### `Docker` folder

Contains the docker file & usefull stuff related to docker

### `ElectricalDesign` foler

Contains Fritzing schema of the robot

### `MechanicalDesign` folder

Contains freecad file of the robot design


### `Misc` folder

Various usefull stuff (personnal purchase list, freecad macro, ...)


### `Robot` folder

Robot software aims to be run on Rapsberry based on top of ROS


# Configure Raspberry Pi

### Start from fresh install

### Enable Camera, SSH and I2C

### OS update 
`apt-get update && sudo apt-get full-upgrade`)

### Install docker

```sh
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pi
sudo reboot now
```

(Optional) test docker installation with : 
`docker run hello-world`

### Get Source Code

```sh
cd
git clone https://github.com/romgere/MyExoMy.git
```

### Run Docker Containers

To see the different options of the script use:

`sh ~/MyExoMy/Docker/run_exomy.sh -h`

Or if you are already in the `MyExoMy/Docker` folder:

`sh run_exomy.sh -h`

Depending on the state of the project, different configurations of the docker container are used:

#### Config

This configuration is used to run configuration scripts for the motors as described in the chapter final integration

`sh ~/MyExoMy/Docker/run_exomy.sh -c`

#### Devel

This configuration is used to start the container for development purposes. It installs the source code and sources the environment. You can make modifications to the code and run your custom launch files.

`sh ~/MyExoMy/Docker/run_exomy.sh -d`

#### Autostart

This configuration is used to autostart the software when ExoMy is switched on. ExoMy can then be controlled using the website or with a gamepad.

`sh ~/MyExoMy/Docker/run_exomy.sh -a`

Stop Autostart This configuration is used to stop the autostart docker container.

`sh ~/MyExoMy/Docker/run_exomy.sh -s`

### Tips

Edit source files from raspberry directly on your computeur : 

```sh
apt-get install sshfs
cd
mkdir pi_home
sshfs -o allow_other,default_permissions pi@xxx.xxx.xxx.xxx:/home/pi pi_home/ # replace xxx.xxx.xxx.xxx by your raspberry address
cd pi_home/MyExoMy #Open this folder in your IDE
```