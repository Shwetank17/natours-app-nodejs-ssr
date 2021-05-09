/* eslint-disable */
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log('locations', locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoiZnMtcHJvamVjdHMiLCJhIjoiY2tvZzRlbG9lMG15cTJ3anpkYTlhYWdwMSJ9.hx1lRWf1eZvPXzZn_k6orA';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/fs-projects/ckogsyw2r2kmk18muezp94d7p',
  // center: [-118.113491, 34.111745],
  // zoom: 10,
  // interactive: false,
  scrollZoom: false
});

// Create bound to lock in the set of latitudes and longitudes
const bounds = new mapboxgl.LngLatBounds();

locations.forEach(location => {
  // Create a div for our custom marker
  const element = document.createElement('div');
  element.className = 'marker';

  // Setup a Marker for Mapbox
  new mapboxgl.Marker({
    element,
    anchor: 'bottom' // this keeps the tip of the marker at the exact spot identified by the latitude and longitude coordinates
  })
    .setLngLat(location.coordinates)
    .addTo(map); // set the coordinates for our markers and add all markers to the map

  // Add Pop Up for markers
  new mapboxgl.Popup({
    offset: 30 // this offset prevents the pop up to overlap with the marker icon
  })
    .setLngLat(location.coordinates)
    .setHTML(`<p>Day ${location.day} ${location.description}</p>`)
    .addTo(map);

  // Extend map bounds to include our current location
  bounds.extend(location.coordinates);
});

// Tell map to ensure that all locations are bounded and are visible in map. It accepts second argument to adjust the CSS of our bounds
map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100
  }
});
