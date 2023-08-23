# setup iwconfig-watch service
sudo cp misc/iwconfig-watch.sh /usr/bin/
sudo cp misc/iwconfig-watch.service /lib/systemd/system/
sudo systemctl enable iwconfig-watch.service
sudo systemctl start iwconfig-watch.service