# Source check: challenge resources

Checked on 2026-11-14 by opening each link from the challenge Resources tab
(https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=resources).

What was checked: whether the link opens and what the landing page says about the data and access. Only NASA POWER was tested with a real data request. "Not verified" means the page did not state it or could not be read; it does not mean the source is unusable.

## Result by source

| Source | Link result | What the page states | Access for our app |
|---|---|---|---|
| **NASA POWER** | Opens | Solar and meteorological data for energy, infrastructure, and agriculture | **Tested: works.** A request to the Daily API returned JSON with no key and no login (see below) |
| SMAP | Opens | Measures surface soil moisture and freeze/thaw everywhere on Earth every 2–3 days; 209 datasets listed | Through NASA Earthdata "Data and Tools". Login requirement and API not verified |
| GPM / IMERG | Opens | Precipitation data free to the public in several formats from several sources; FAQ covers getting data for a specific location | Download route not tested |
| Landsat (EarthExplorer) | Opens | Interactive map application; page text could not be read | Not verified |
| MODIS (LP DAAC) | Redirects to the LP DAAC page on Earthdata | LP DAAC distributes MODIS, VIIRS, ECOSTRESS, GEDI, and Harmonized Landsat Sentinel-2 data at no cost | Download route not tested |
| VIIRS (Earthdata Search) | Opens | Search tool with a "Log In" option | Results had not loaded when read; not verified |
| SRTM | Opens | Elevation data over nearly 80% of Earth's land surface, collected February 11–22, 2000; 28 datasets | Through Earthdata; not tested |
| ECOSTRESS | Opens | Collection 2 products: land surface temperature, evapotranspiration, NDVI inputs | Download route not tested |
| GEDI | **Link lands on a 2019 news post**, not a data page | — | Use LP DAAC instead (it lists GEDI) |
| NLDAS / GLDAS | Link is the general Earthdata home page | The challenge says to search "NLDAS" or "GLDAS" in Earthdata Search | Not verified |
| USDA Ag Data Commons | **Did not open** in the checking browser | — | Not checked |
| Web Soil Survey | **Did not open** | — | Not checked |
| SSURGO / STATSGO2 (NRCS) | **Did not open** | — | Not checked |
| USDA AMS Market News | **Did not open** | — | Not checked |
| USDA NASS QuickStats | **Did not open** | — | Not checked |
| CropScape (CDL) | **Redirects to a sign-in page** | Registration is required for CropScape and related tools | Needs an account |
| PRISM | Opens | Free datasets from 1895 to present; bulk gridded downloads and time series for a single location | Usable; covers the United States per the challenge description |
| NAIP | Opens | Page text could not be read | Not verified |
| NLCD (USGS) | Opens | Page text could not be read | Not verified |
| FAO GAEZ | Opens (GAEZ v4 Data Portal) | Page text could not be read | Not verified |
| CoCoRaHS | Opens | Maps and "View Data" sections; volunteer observer network | Not tested |
| USGS NWIS | Redirects to "Water Data for the Nation" | Water data from more than one million monitoring locations across the United States | Not tested |
| OpenET | Redirects to etdata.org | Case studies from U.S. states | Not tested |
| LANDFIRE | Opens | Data download in various formats | Not tested |
| Sentinel-2 (Copernicus Data Space) | Opens | Free access to Copernicus Sentinel data; explore in the Copernicus Browser, or register for an account for more | Browser works without account per the page; API not tested |
| ERA5 (Copernicus CDS) | Opens | Global reanalysis, hourly, from 1940 onwards; has Download and "Analysis ready data" tabs | Login requirement not verified |

The five USDA pages that did not open all failed the same way in the checking browser. They may open normally in a regular browser; this should be rechecked by hand.

## NASA POWER live test

Request (public endpoint from the NASA POWER documentation, with four parameters):

`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR&community=AG&longitude=0&latitude=0&start=20170101&end=20170103&format=JSON`

Response received on 2026-11-14:
- Daily values for all four parameters for each of the three days.
- Parameter names and units as returned: `T2M` Temperature at 2 Meters (C), `T2M_MAX` Temperature at 2 Meters Maximum (C), `T2M_MIN` Temperature at 2 Meters Minimum (C), `PRECTOTCORR` Precipitation Corrected (mm/day).
- Header: "NASA/POWER Source Native Resolution Daily Data", API version v2.10.3, sources MERRA2 and POWER, fill value -999.0 for missing data.
- No API key, token, or login was sent.

## What this means for the project

1. NASA POWER is confirmed as the starting data source: global, daily, usable directly from an app, no account.
2. Every other source needs a separate check of its download or API route before it is promised in the project description.
3. U.S.-only soil and crop sources (Web Soil Survey, SSURGO, CropScape, PRISM, NAIP) are not needed for a first version built on NASA POWER.
4. The GEDI link in the challenge resources does not lead to data.
