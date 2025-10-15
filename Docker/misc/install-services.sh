directory=$( dirname "$0" )

# setup iwconfig-watch service
sudo cp $directory/iwconfig-watch.sh /usr/bin/
sudo cp $directory/iwconfig-watch.service /lib/systemd/system/
sudo systemctl enable iwconfig-watch.service
sudo systemctl start iwconfig-watch.service