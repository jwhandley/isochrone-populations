import { FeatureCollection, Point } from 'geojson';
import * as L from 'leaflet';
let geoJsonLayer: L.GeoJSON | undefined = undefined;
let marker: L.Marker | undefined = undefined;
let isPanning = false;
let timeout: number | undefined = undefined;
const debounce = (func: TimerHandler, delay: number) => {
  clearTimeout(timeout);
  timeout = setTimeout(func, delay);
};



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
    getElement("result")!.innerHTML = `<p><strong>${pop.toLocaleString()}</strong> people live within ${timeFormat} of (${lat},${lng}) by public transportation.</p>`;
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
  isPanning = true;
});

map.on('dragend', () => {
  isPanning = false;
});

const locationInput = getElement<HTMLInputElement>("location")!;
const autoCompleteContainer = document.createElement("div");
autoCompleteContainer.className = "autoComplete-results";
autoCompleteContainer.style.display = "none";
locationInput.parentElement!.appendChild(autoCompleteContainer);
locationInput.addEventListener("change", () => {
  if (locationInput.value.length == 0) autoCompleteContainer.innerHTML = "";
});

locationInput.addEventListener("keyup", async () => {
  const query = locationInput.value.trim();
  if (query.length <= 2) return;
  debounce(() => geocode(query), 200);
});

async function geocode(query: string): Promise<void> {
  const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=geojson&limit=5&city=${query}`);
  const results = await resp.json() as FeatureCollection

  autoCompleteContainer.innerHTML = "";
  autoCompleteContainer.style.display = "none";

  results.features.forEach((feature) => {
    const { display_name } = feature.properties as { display_name: string };
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";
    resultItem.textContent = display_name;

    resultItem.addEventListener("click", () => {
      locationInput.value = display_name;
      autoCompleteContainer.innerHTML = "";
      autoCompleteContainer.style.display = "none";

      const geometry = feature.geometry as Point;
      getElement<HTMLInputElement>("lat")!.value = geometry.coordinates[1].toFixed(3);
      getElement<HTMLInputElement>("lng")!.value = geometry.coordinates[0].toFixed(3);

    });

    autoCompleteContainer.appendChild(resultItem);
  });
  autoCompleteContainer.style.display = "inline-block";
}

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
