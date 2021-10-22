#!/bin/bash
echo "* * * Deploy Files for Webserver * * *"
sudo cp app.js /var/www/html && sudo cp index.html /var/www/html
echo "* * * Finished * * *"