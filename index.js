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

// Look for *** to know where to replace paths with full URL paths from your own server (required by google for KML overlays)
 
	var marker;
 var infowindow;
 var contentString='';
 var firstTime = 1;
 
	var map;
	var markersArray = [];
	var ShapesLayer;
	    var StopsLayer;
	    var RouteLayer;
	    
	var i = 0;
     var iOS;

     if( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ){ 
         iOS = true; 
         //alert('iOS will crash your browser app right now!')
     }
 
function Init() {
  
  var hostandport = window.location.hostname + ':' + window.location.port;

 map = CreateMap();

	/**
	 * Create a custom-styled Google Map with no labels and custom color scheme.
	 */
	function CreateMap() {
		var map_style = [ {
			elementType : "labels",
			stylers : [ {
				visibility : "off"
			} ]
		}, {
			stylers : [ {
				saturation : -69
			} ]
		} ];
		var map_canvas = document.getElementById("map_canvas");
		var myOptions = {
			center : new google.maps.LatLng(38.1858635, -85.676193),
			zoom : 12,
			styles : map_style,
			mapTypeId : google.maps.MapTypeId.ROADMAP
		};
		 infowindow = new google.maps.InfoWindow({
             content: 'holding...'
         });
        
		return new google.maps.Map(map_canvas, myOptions);
		
		
		
	};
	
    
    function RgbToHsv(r, g, b) {
        var
            min = Math.min(r, g, b),
            max = Math.max(r, g, b),
            delta = max - min,
            h, s, v = max;

        v = Math.floor(max / 255 * 100);
        if ( max != 0 )
            s = Math.floor(delta / max * 100);
        else {
            // black
            return [0, 0, 0];
        }

        if( r == max )
            h = ( g - b ) / delta;         // between yellow & magenta
        else if( g == max )
            h = 2 + ( b - r ) / delta;     // between cyan & yellow
        else
            h = 4 + ( r - g ) / delta;     // between magenta & cyan

        h = Math.floor(h * 60);            // degrees
        if( h < 0 ) h += 360;

        return [h, s, v];
    }
    
	/**
	 * We want to assign a random color to each bus in our visualization. We
	 * pick from the HSV color-space since it gives more natural colors.
	 */
	function HsvToRgb(h, s, v) {
		h_int = parseInt(h * 6);
		f = h * 6 - h_int;
		var a = v * (1 - s);
		var b = v * (1 - f * s);
		var c = v * (1 - (1 - f) * s);
		switch (h_int) {
		case 0:
			return [ v, c, a ];
		case 1:
			return [ b, v, a ];
		case 2:
			return [ a, v, c ];
		case 3:
			return [ a, b, v ];
		case 4:
			return [ c, a, v ];
		case 5:
			return [ v, a, b ];
		}
	};

	function HsvToRgbString(h, s, v) {
		var rgb = HsvToRgb(h, s, v);
		for ( var i = 0; i < rgb.length; ++i) {
			rgb[i] = parseInt(rgb[i] * 256)
		}
		return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
	};

	var h = Math.random();
	var golden_ratio_conjugate = 0.618033988749895;

	function NextRandomColor() {
		h = (h + golden_ratio_conjugate) % 1;
		return HsvToRgbString(h, 0.90, 0.90)
	};
	
	function ValueFromHash(str){
		var hash = 0;
		var hashVal = 0;
		if (str.length == 0) return hash;
		for (i = 0; i < str.length; i++) {
			char = str.charCodeAt(i);
			hash = ((hash<<5)-hash)+char;
			hashVal = ((hash & hash) % 256)/256;
		}
		return hashVal;
	}
	
	function AgencyIdColor(v_data) {
		var agency = v_data.agency;
		var id = v_data.ID;
		var hue = v_data.hue;
		var rgbString;
		if(hue != null){
			rgbString = HsvToRgbString(hue+0.07*(Math.sin(Math.PI*ValueFromHash(id))-0.5), 1-(0.5*ValueFromHash(id)), Math.cos(ValueFromHash(id)*Math.PI/3)+0.4);
		}else{
			rgbString = HsvToRgbString(ValueFromHash(agency)+0.07*(Math.sin(Math.PI*ValueFromHash(id))-0.5), 1-(0.5*ValueFromHash(id)), Math.cos(ValueFromHash(id)*Math.PI/3)+0.4);
		}
		return rgbString;
	}


	var vehicles_by_uid = {};
	var animation_steps = 1;


    function showRoute(tripid,tripcolor) {
        if (typeof RouteLayer === 'undefined') {
            //console.log('not defined');
        } else {
            //console.log('clear');
            RouteLayer.setMap(null);
        }
        // *** needs to be a full URL to a dynamic KML route generator from your GTFS database. 3 sample route#.kml samples provided
        var routeURL = 'http://www.yourserver.com/gtfsrealtime/route.php?trip='+tripid+'&color='+tripcolor+'&rand='+animation_steps;
        
        //animation_steps++;
        //console.log(routeURL);
        RouteLayer = new google.maps.KmlLayer({
            url: routeURL,
            clickable: false,
            preserveViewport: true,
            suppressInfoWindows: false,
            screenOverlays: false
        });

        RouteLayer.setMap(map);

    }
    
    
	function UpdateVehicleYM(v_data) {
	    //console.log(v_data);
	    //console.log(updates);
	    //console.log(v_data.gtfs_realtime_version);

        var uid = v_data.ID;
        //if (!(uid in vehicles_by_uid)) {
        //    vehicles_by_uid[uid] = CreateVehicleYM(v_data);
        //}
       

        //if (!iOS) {
            vehicles_by_uid[uid] = CreateVehicleYM(v_data);
             var vehicle = vehicles_by_uid[uid];

            var op = CreateVehicleUpdateOperationYM(vehicle, v_data.Lat, v_data.Lon);
                
            //var cvym = CreateVehicleYM(v_data);
            //console.log(vehicle.uid);

            if (vehicle.uid != '0') {
                //if (!iOS) {
                    google.maps.event.addListener(vehicle.marker, 'click', function() {
                        infowindow.setContent(vehicle.contentinfo);
                        //console.log("content: "+vehicle.contentinfo);
                        infowindow.open(map,this);

                        // show route
                        showRoute(vehicle.uid, vehicle.color);
                    });
                //}

            }
        //}

    };
	
	function RGBColor(color_string)
    {
        this.ok = false;

        // strip any leading #
        if (color_string.charAt(0) == '#') { // remove # if any
            color_string = color_string.substr(1,6);
        }

        color_string = color_string.replace(/ /g,'');
        color_string = color_string.toLowerCase();

        
        

        // array of color definition objects
        var color_defs = [
            {
                re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
                example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
                process: function (bits){
                    return [
                        parseInt(bits[1]),
                        parseInt(bits[2]),
                        parseInt(bits[3])
                    ];
                }
            },
            {
                re: /^(\w{2})(\w{2})(\w{2})$/,
                example: ['#00ff00', '336699'],
                process: function (bits){
                    return [
                        parseInt(bits[1], 16),
                        parseInt(bits[2], 16),
                        parseInt(bits[3], 16)
                    ];
                }
            },
            {
                re: /^(\w{1})(\w{1})(\w{1})$/,
                example: ['#fb0', 'f0f'],
                process: function (bits){
                    return [
                        parseInt(bits[1] + bits[1], 16),
                        parseInt(bits[2] + bits[2], 16),
                        parseInt(bits[3] + bits[3], 16)
                    ];
                }
            }
        ];

        // search through the definitions to find a match
        for (var i = 0; i < color_defs.length; i++) {
            var re = color_defs[i].re;
            var processor = color_defs[i].process;
            var bits = re.exec(color_string);
            if (bits) {
                channels = processor(bits);
                this.r = channels[0];
                this.g = channels[1];
                this.b = channels[2];
                this.ok = true;
            }

        }

        // validate/cleanup values
        this.r = (this.r < 0 || isNaN(this.r)) ? 0 : ((this.r > 255) ? 255 : this.r);
        this.g = (this.g < 0 || isNaN(this.g)) ? 0 : ((this.g > 255) ? 255 : this.g);
        this.b = (this.b < 0 || isNaN(this.b)) ? 0 : ((this.b > 255) ? 255 : this.b);

        // some getters
        this.toRGB = function () {
            return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
        }
        this.toHex = function () {
            var r = this.r.toString(16);
            var g = this.g.toString(16);
            var b = this.b.toString(16);
            if (r.length == 1) r = '0' + r;
            if (g.length == 1) g = '0' + g;
            if (b.length == 1) b = '0' + b;
            return '#' + r + g + b;
        }

        // help
        this.getHelpXML = function () {

            var examples = new Array();
            // add regexps
            for (var i = 0; i < color_defs.length; i++) {
                var example = color_defs[i].example;
                for (var j = 0; j < example.length; j++) {
                    examples[examples.length] = example[j];
                }
            }
            // add type-in colors
            for (var sc in simple_colors) {
                examples[examples.length] = sc;
            }

            var xml = document.createElement('ul');
            xml.setAttribute('id', 'rgbcolor-examples');
            for (var i = 0; i < examples.length; i++) {
                try {
                    var list_item = document.createElement('li');
                    var list_color = new RGBColor(examples[i]);
                    var example_div = document.createElement('div');
                    example_div.style.cssText =
                            'margin: 3px; '
                            + 'border: 1px solid black; '
                            + 'background:' + list_color.toHex() + '; '
                            + 'color:' + list_color.toHex()
                    ;
                    example_div.appendChild(document.createTextNode('test'));
                    var list_item_value = document.createTextNode(
                        ' ' + examples[i] + ' -> ' + list_color.toRGB() + ' -> ' + list_color.toHex()
                    );
                    list_item.appendChild(example_div);
                    list_item.appendChild(list_item_value);
                    xml.appendChild(list_item);

                } catch(e){}
            }
            return xml;

        }

    }
	
	function calcBrightness(color) {
            return Math.sqrt(
               color.r * color.r * .299 +
               color.g * color.g * .587 +
               color.b * color.b * .114);          
          }
          
    function CreateVehicleYM(v_data) {
        //console.log(v_data);
        //console.log(v_data.Point);
        //console.log("CreateVehicle lat value: "+v_data.Lat+" Desc: "+v_data.Trip);
		var point = new google.maps.LatLng(v_data.Lat, v_data.Lon);
		var path = new google.maps.MVCArray();
		path.push(point);
		
		/* 
		//detect brightness of route color
        var rgbcolor = new RGBColor(v_data.Color);
                  if (rgbcolor.ok) { // 'ok' is true when the parsing was a success
                    var brightness = calcBrightness(rgbcolor);
                    var foreColor = (brightness < 130) ? "labelsWhite" : "labels";
                }
		*/
		var delay = v_data.Delay;
		if ((delay == 0) || (delay == '')) {
		    delay = '';
		} else {
		    delay = "("+v_data.Delay+" min delay)";
		}
		contentString = "<b>"+v_data.Line+" "+v_data.Name+"</b><br><hr style='height:4px;border:none;color:#"+v_data.Color+";background-color:#"+v_data.Color+";' /><i>Route</i>: "+v_data.Route+"<br><i>Next Stop</i>: "+v_data.Stop+"<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; at "+v_data.Time+" "+delay+"<br><i>Updated</i>: "+v_data.Date+" "+v_data.Time+" ("+v_data.Ago+" mins ago)<div style='text-align: center; width:100%; margin-top:6px;'><a href='http://www.yourmapper.com/crimescore' target='crimescore'><img src='http://static.yourmapper.com/crimescore/CrimeScoreLogo24.png' style='width:63px;height:24px;vertical-align:middle;margin-right:6px; margin-bottom:4px;' align='ablsmiddle' border='0' title='CrimeScore at current bus location - Click for more details' /></a> <span style='font-weight: bold; font-size:20px; color:#"+v_data.CrimeColor+"; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;'>"+v_data.CrimeGrade+"</span></div>";
		if (v_data.Line != '') {
		// marker 'M 16,0 C 16,0 0,24 0,33 C 0,42 7,49 16,49 C 25,49 32,42 32,33 C 32,24 16,0 16,0'
		// needle M-30 -2.5L-25 2.5L-20 -2.5L-20 -15L-25 -70L-30 -15z
		// star M 250,75 L 323,301 131,161 369,161 177,301 z
		// double circle M 600,81 A 107,107 0 0,1 600,295 A 107,107 0 0,1 600,81 z M 600,139 A 49,49 0 0,1 600,237 A 49,49 0 0,1 600,139 z
		// arrow head M 0,0  l -15,-5  +5,+5  -5,+5  +15,-5 z
		// arrow M 10,0  l +15,+5  -5,-5  +5,-5  -15,+5  m +10,0 +10,0
		// arrow point M -6,0  l +10,+5  -2,-5  +2,-5  -10,+5 m 8,0 2,0
		// circle arrow M 50 5 A 45 45, 0, 1, 0, 95 50 L 95 5 Z 
		// circle arrow with crosshair M 50 5 A 45 45, 0, 1, 0, 95 50 L 95 5 Z M 0 50 L 100 50 M 50 0 L 50 100
		
		//var bearing_arr = { 0: { x: -6, y: 8}, 45: { x: -2, y: -1}, 90: { x: 8, y: -7}, 135: { x: 18, y: -2}, 180: { x: 22, y: 8}, 225: { x: 18, y: 17}, 270: { x: 8, y: 23}, 315: { x: -2, y: 18}, 360: { x: -6, y: 8} };
		//var bearnum = (Math.round((parseInt(v_data.Bear)+22.5)/45)-1)*45;
		
		//console.log(bearnum);
		//console.log(v_data.Bear+ " " + v_data.Bear+22.5+ " " + (v_data.Bear+22.5)/45 + " " + bearnum+ " " + bearing_arr[bearnum]['x']+","+ bearing_arr[bearnum]['y']);
		
		// v_data.Bear - 45
		
	
        var marker_opts = {
            clickable : true,
            draggable : false,
            flat : false,
            icon : {
                path: 'M 50 5 A 45 45, 0, 1, 0, 95 50 L 95 5 Z',
                scale: .2,
                strokeColor: "000",
                strokeWeight:1,
                strokeOpacity: .7,
                fillColor: v_data.Color,
                fillOpacity: 0.8,
                rotation: v_data.Bear - 45,
                anchor: new google.maps.Point(50,50),
                origin: new google.maps.Point(50,50)
            },
            title : v_data.Line+" "+v_data.Name,
            map : map,
            position : point,
            labelContent: v_data.Line,
            labelAnchor: new google.maps.Point(8,8),
            labelClass: "labelsWhite", // the CSS class for the label
            labelStyle: {opacity: 0.90},
            labelInBackground: false
        };
   
    
		var polyline_opts = {
			clickable : true,
			editable : false,
			map : map,
			path : path,
			strokeColor : 663333,
			strokeOpacity : 0.5,
			strokeWeight : 3
		};
		
      
            var newmarker = new MarkerWithLabel(marker_opts);
    		markersArray.push(newmarker);
            return {
                uid : v_data.Trip,
                marker : newmarker,
                //marker : new google.maps.Marker(marker_opts),
                //polyline : new google.maps.Polyline(polyline_opts),
                path : path, 
                contentinfo: contentString,
                color: v_data.Color
                //lastUpdate : v_data.lastUpdate
            };

	    } else {
	        return {
    			uid : '0'
    		};
	    }
	};

	function CreateVehicleUpdateOperationYM(vehicle, lat, lon) {
		return function() {
			var point = new google.maps.LatLng(lat, lon);
			vehicle.marker.setPosition(point);
			
			var path = vehicle.path;
			var index = path.getLength() - 1;
			path.setAt(index, point);
			
		};
	};
	var first_update = true;

    

	function ProcessVehicleData(data) {
	    //console.log("Processing Locations...");
	    //console.log(data);
		//var vehicles = jQuery.parseJSON(data);
		//console.log(vehicles);
		//var updates = [];
		var bounds = new google.maps.LatLngBounds();
		//for ( var i = 0; i < animation_steps; ++i) {
		//	updates.push(new Array());
		//}
		
		var vehiclecount=1;
		if (iOS) {
		    var maxvehicles = 70;
		} else {
		    var maxvehicles = 300;
		}
	    /* // for sorting by most recently updated if JSON doesn't come back that way
	    data.sort(function(a, b){
            var keyA = a.Ago;
            var keyB = b.Ago;
            // Compare the 2 dates
            console.log(keyA);
            if(keyA < keyB) return -1;
            if(keyA > keyB) return 1;
            return 0;
        });
        */
		jQuery.each(data, function() {
		     //var exists = (typeof this.gtfs_realtime_version != "undefined");
        	    //console.log(vehiclecount+ " "+this.Ago);
        	    //if(exists){
        	        //console.log("skipping first record");
        	    //} else{
        	if (vehiclecount <= maxvehicles) {
        	    UpdateVehicleYM(this);
		    }
		    vehiclecount++;
			//console.log(this);
			//bounds.extend(new google.maps.LatLng(this.vehicle.position.longitude, this.vehicle.position.longitude));
		    //}
		});
		if (first_update && ! bounds.isEmpty()) {
			map.fitBounds(bounds);
			first_update = false;
		}
			
	};

    function clearOverlays() {
      //console.log('clearing...');
      for (var i = 0; i < markersArray.length; i++ ) {
          //console.log(i);
          markersArray[i].setMap(null);
      }
      markersArray.length = 0;
      markersArray = [];
      //console.log('... done');
    }

    //var jsonURL = "dataOriginal.json";
    //var jsonURL = "data.json";
    //var jsonURL = "json.php"; // realtime from bret
    //var jsonURL = "jsonPB.php"; // realtime from TARC
    //var jsonURL = "ymdata.php"; // realtime from your mapper database
    
    var jsonURL = "data.json"; // *** static file - you need to make this dynamic from your server
    
    function getRealtimeLocations() {
        $.getJSON( jsonURL, function( data ) {
            if (!firstTime) {
                //console.log('cleared');
                clearOverlays();
            }
            firstTime = 0;
            //document.getElementById('counter').style.visibility = 'visible'; 
            //if (!iOS){
                
                if (document.getElementById) { // DOM3 = IE5, NS6 
                    document.getElementById('counter').style.visibility = 'visible'; 
                    document.getElementById('routes').style.visibility = 'visible'; 
                    document.getElementById('stops').style.visibility = 'visible'; 
                } 
                else { 
                    if (document.layers) { // Netscape 4 
                        document.counter.visibility = 'visible'; 
                        document.routes.visibility = 'visible'; 
                        document.stops.visibility = 'visible'; 
                    } 
                    else { // IE 4 
                        document.all.counter.style.visibility = 'visible'; 
                        document.all.routes.style.visibility = 'visible'; 
                        document.all.stops.style.visibility = 'visible'; 
                    } 
                }
            //}
            //console.log("processing...");
            ProcessVehicleData(data);
            //if (!iOS){
                
                countdown();
            
            //}
        });
    }

    function countdown() {
        var seconds = 60;
        function tick() {
            var counter = document.getElementById("counter");
            seconds--;
            counter.innerHTML = "Refresh: " + String(seconds);
            if( seconds > 0 ) {
                setTimeout(tick, 1000);
            } else {
                getRealtimeLocations();
            }
        }
        tick();
    }
    
    
    getRealtimeLocations();

    //if (!iOS) {

        // pre-generated KMZ file of shapes from GTFS feed
        // *** needs to be full URL from your server - sample provided here
        ShapesLayer = new google.maps.KmlLayer({
            url: 'http://www.yourserver.com/gtfsrealtime/shapes.kmz',
            clickable: false,
            preserveViewport: true,
            suppressInfoWindows: true,
            screenOverlays: false
        });
        
        // pre-generated KMZ file of stops from GTFS feed
        // *** needs to be full URL from your server - sample provided here
        StopsLayer = new google.maps.KmlLayer({
            url: 'http://www.yourserver.com/gtfsrealtime/stops.kmz',
            clickable: true,
            preserveViewport: true,
            suppressInfoWindows: false,
            screenOverlays: false
        });

    //}

}

function toggleShapes() { 
    if (!document.getElementById('ShapesLayer').checked)  {
        //console.log("remove");
        ShapesLayer.setMap(null); 
    } else { 
        //console.log("show");
        
        ShapesLayer.setMap(map); 
    }
}

function toggleStops() { 
    if (!document.getElementById('StopsLayer').checked)  {
        //console.log("remove");
        StopsLayer.setMap(null); 
    } else { 
        //console.log("show");

        StopsLayer.setMap(map); 
    }
} 
