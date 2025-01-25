import { FeatureCollection } from 'geojson';
import * as L from 'leaflet';
let geoJsonLayer: L.GeoJSON | undefined = undefined;
let marker: L.Marker | undefined = undefined;
let isPanning = false;

document.getElementById("isochrone-form")!.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = getElement<HTMLButtonElement>("submitButton")!;
  button.disabled = true;
  button.textContent = "Loading...";

  const lat = getElement<HTMLInputElement>("lat")!.value;
  const lng = getElement<HTMLInputElement>("lng")!.value;
  const travelTime = getElement<HTMLInputElement>("travel_time")!.value;
  const [hours, mins] = travelTime.split(":");
  const time = parseInt(hours) * 3600 + parseInt(mins) * 60;

  try {
    const response = await fetch(`https://isochrone-populations-py.fly.dev/isochrone?lat=${lat}&lng=${lng}&travel_time=${time}`);

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json() as FeatureCollection;
    const pop = parseInt(data.features[0].properties!["population"]);
    const timeFormat = parseInt(hours) > 0 ? `${hours} hours and ${mins} minutes` : `${mins} minutes`;
    getElement("result")!.innerHTML = `<p><strong>${pop.toLocaleString()}</strong> people live within ${timeFormat} of (${lat},${lng}) by public transit</p>`;
    if (geoJsonLayer) {
      map.removeLayer(geoJsonLayer);
    }


    geoJsonLayer = L.geoJSON(data).addTo(map);
    if (geoJsonLayer) {
      const bounds = geoJsonLayer.getBounds();
      map.fitBounds(bounds);
    }
  } catch (error) {
    console.log(error);
  }

  button.disabled = false;
  button.textContent = "Get Isochrone";
});

function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

const map = L.map('map').setView([51.505, -0.09], 4);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

map.on('dragstart', () => {
  // Set the flag to true when the user starts dragging the map
  isPanning = true;
});

map.on('dragend', () => {
  // Set the flag to false when the user stops dragging the map
  isPanning = false;
});



map.addEventListener("click", (e) => {
  if (isPanning) {
    return;
  }

  getElement<HTMLInputElement>("lat")!.value = e.latlng.lat.toFixed(3);
  getElement<HTMLInputElement>("lng")!.value = e.latlng.lng.toFixed(3);


  if (marker) {
    marker.setLatLng(e.latlng);
  } else {
    marker = L.marker(e.latlng).addTo(map);
  }
});
