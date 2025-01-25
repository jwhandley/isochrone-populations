# Isochrone Population Calculator

## Overview

This web application calculates and displays the population living in
[isochrones](https://en.wikipedia.org/wiki/Isochrone_map) using public
transportation from a specified location.

## Technologies

- [Leaflet.js](https://leafletjs.com/) for mapping
- [TravelTime API](traveltime.com) for isochrones (I wanted to make the
  isochrones myself, but decided it was worth outsourcing to maximise the range
  of available locations)
- Population data from the
  [Global Human Settlement Layer gridded population
  dataset](https://human-settlement.emergency.copernicus.eu/download.php?ds=pop)
- Geospatial analysis tools (the
  [backend](https://github.com/jwhandley/isochrone-populations-py) uses rasterio
  to mask the population grid)
