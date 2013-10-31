# GTFS-realtime-JSON

Online JS Google Maps API application that pulls in real time structured JSON to create a live map of all busses/trains in a city's GTFS transportation network.

## Location

The current version of this code uses static JSON and KML/KMZ files to create a map of all bus locations in Louisville's TARC transportation system.

It could easily be modified for any city though by changing the start lat/lon location, and generating the dynamic files needed from your own GTFS public transit database data.

## Usage

1. Download the repo and put all the files in a single directory on your server.
2. Open index.js and change the relevant paths to full URLs on your server.
3. Open the index.php page (feel free to change this to index.html - there is nothing dynamic in it at the moment).

Your will see a Google Map with the location of every bus, with its number on the marker, and in the direction it is headed.  Clicking a bus will open a popup with route info, delay, next stop arrival time, and CrimeScore.  It will also generate a colored KML path of the bus's route.

*Note that on iOS devices, only the most recently checked-in 70 busses show up.  More than that and the browser tends to crash, even on an 5s device.  An improvement would be to add a UI element that showed and hid buses based on some user criteria (last check-in, delay, rount numbers, etc).*

## Changes needed in index.js file

Before everything works, you need to change some paths in the index.js file.  Search for three asterix (***) to see where.

1. routeURL. If you want to have a dynamic route show up, you will have to create a dynamic script on your server that returns the KML paht of the bus route clicked.  The parameters required are shown in the code.  There are 3 example files I've included for reference: route1.kml, route2.kml, and route3.kml
2. jsonURL. The data in this example comes from a static file called data.json. You should generate a similar file from your server based on your city's GTFS data.
3. ShapesLayer and StopsLayer.  These are 2 pre-generated kmz files that come from your city's GTFS feed.  See the example files provided called shapes.kmz and stops.kmz for reference. Style yours as you like.
 
See the sample-screenshot.png file for how this might look when implemented.

## Use Our API

If you don't want to recreate the wheel, you can use our API calls for bus locations, delays, updates, and routes.  Learn more and
subscribe here at Mashape: https://www.mashape.com/yourmapper/TARC-realtime#!documentation
