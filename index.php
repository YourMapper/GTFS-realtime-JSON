<!--
/*

Copyright (C) 2013 Michael Schnuerle <code@yourmapper.com> www.yourmapper.com

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*********
Significant edits to change from web sockets to ajax, new data format,
added popup infowindows, custom symbols for busses with color and orientation, 
bus numbers on symbols, layer for stops, layer for routes, onclick show 
colored layer for one bus, auto refreshing, iOS support.
*********

Intial version (C) and info:

 * Copyright (C) 2012 Brian Ferris <bdferris@onebusaway.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.

*/
-->
<!DOCTYPE html>
<html lang="en">
<head>
  <title>TARC BUS Realtime Visualizer - YourMapper.com</title>
  <meta http-equiv="content-type" content="text/html;charset=utf-8" />
  <meta name="viewport" content="width=500">
  <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  <script type="text/javascript" src="http://maps.googleapis.com/maps/api/js?sensor=false"></script>
  <script src="markerwithlabel.js" type="text/javascript"></script>
  <script type="text/javascript" src="index.js"></script>
  <link href="index.css" rel="stylesheet" type="text/css" />
</head>
<body onload="Init()">
  <div id="map_canvas"></div>
  
  <div id="aboutmapoverlay" style="padding-bottom: 5px; text-align: center; border: 0px; z-index: 0; position: absolute; bottom: 13px; right: 5px; font-size: 10px; font-family: Arial; background-color: #5886d3; border: 1px solid #999999; color: white;">Created By:<br><a href="http://www.yourmapper.com/" title="Map data and widget services provided by Your Mapper. Click to read more about us and how to use our data in your site or app for free." target="_blank" style="text-decoration: none;  padding:3px; height: 100%; width:100%;"><img src="YourMapperWhiteSM.png" width="147" height="38" border="0"></a></div>
  
  <div id="mapadoverlay" style="padding-bottom: 5px; text-align: center; border: 0px; z-index: 0; position: absolute; bottom: 13px; right: 165px; font-size: 10px; font-family: Arial; background-color: #000; border: 1px solid #999999; color: white;">Louisville CrimeScore App:<br><a href="http://www.yourmapper.com/safetycheck" title="Louisville SafetyCheck - a CrimeScore rating iPhone app for your current location." target="_blank" style="text-decoration: none;  padding:3px; height: 100%; width:100%;"><img src="safetycheck-logo-sm.png" width="147" height="38" border="0"></a></div>
  
  <div id="counter" style="padding: 2px; text-align: center; border: 0px; z-index: 0; position: absolute; top: 50px; right: 5px; font-size: 14px; font-family: Arial; background-color: #000; border: 1px solid #999999; color: white; visibility: hidden; width: 90px; height: 15px;">Refresh: 60</div>

    <div id="routes" style="padding: 2px; text-align: center; border: 0px; z-index: 0; position: absolute; top: 74px; right: 5px; font-size: 14px; font-family: Arial; background-color: #5886d3; border: 1px solid #999999; color: white; visibility: hidden; width: 90px; height: 15px;"><input type="checkbox" id="ShapesLayer"  onClick="toggleShapes();" /> Routes </div>

    <div id="stops" style="padding: 2px; text-align: center; border: 0px; z-index: 0; position: absolute; top: 98px; right: 5px; font-size: 14px; font-family: Arial; background-color: #5886d3; border: 1px solid #999999; color: white; visibility: hidden; width: 90px; height: 15px;"><input type="checkbox" id="StopsLayer"  onClick="toggleStops();" /> Stops </div>
  
</body>
</html>