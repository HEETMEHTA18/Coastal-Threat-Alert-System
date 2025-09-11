# 🌊 Coastal Threat Assessment System (CTAS) - AI Models Dataset Guide

## 📊 Complete Dataset Collection Strategy

This guide provides comprehensive information on acquiring datasets for training all five AI models in the CTAS system.

## 🎯 Model-Specific Dataset Requirements

### 1. Sea Level Anomaly Detection Model
**Required Features:**
- Hourly sea level measurements
- Tidal predictions and residuals
- Meteorological conditions (wind speed, atmospheric pressure)
- Storm surge data
- Temperature and salinity measurements

**Primary Data Sources:**

#### NOAA Tides & Currents (Primary)
- **URL:** https://tidesandcurrents.noaa.gov/
- **Data Type:** Real-time and historical sea level data
- **Coverage:** US coastal stations
- **API:** Available with rate limits
- **Cost:** Free
- **Sample Stations:**
  - 8518750: The Battery, NY
  - 8570283: Sewells Point, VA
  - 8723214: Virginia Key, FL

#### NASA JPL Sea Level Change Portal
- **URL:** https://sealevel.jpl.nasa.gov/
- **Data Type:** Satellite altimetry data
- **Coverage:** Global
- **Formats:** NetCDF, CSV
- **Cost:** Free (registration required)

#### Copernicus Marine Service
- **URL:** https://marine.copernicus.eu/
- **Data Type:** European satellite oceanographic data
- **Coverage:** European waters primarily
- **Cost:** Free (registration required)

### 2. Algal Bloom Prediction Model
**Required Features:**
- Chlorophyll-a concentrations
- Water temperature and salinity
- Nutrient levels (nitrogen, phosphorus)
- Turbidity and dissolved oxygen
- Solar radiation and weather conditions

**Primary Data Sources:**

#### NASA Ocean Color Web
- **URL:** https://oceancolor.gsfc.nasa.gov/
- **Data Type:** MODIS/VIIRS chlorophyll-a data
- **Coverage:** Global
- **Resolution:** 1km daily, 4km daily
- **Formats:** NetCDF, HDF
- **Cost:** Free (NASA Earthdata account required)

#### NOAA Harmful Algal Bloom Monitoring
- **URL:** https://coastalscience.noaa.gov/science-areas/habs/
- **Data Type:** HAB event databases and forecasts
- **Coverage:** US coastal waters
- **Cost:** Free

#### EPA Water Quality Portal
- **URL:** https://www.waterqualitydata.us/
- **Data Type:** Multi-agency water quality data
- **Coverage:** US waters
- **API:** RESTful API available
- **Cost:** Free

### 3. Pollution Event Classification Model
**Required Features:**
- Water quality parameters (pH, dissolved oxygen, turbidity)
- Industrial discharge data
- Chemical concentration measurements
- Satellite imagery for oil spill detection
- Pollution incident reports

**Primary Data Sources:**

#### EPA Envirofacts
- **URL:** https://www.epa.gov/enviro/envirofacts-overview
- **Data Type:** Industrial discharge and violations
- **Coverage:** US facilities
- **API:** Available
- **Cost:** Free

#### Sentinel Hub
- **URL:** https://www.sentinel-hub.com/
- **Data Type:** Sentinel-2 satellite imagery
- **Coverage:** Global
- **Resolution:** 10m-60m
- **Cost:** Free tier available, paid plans for high volume

#### NOAA Marine Debris Program
- **URL:** https://marinedebris.noaa.gov/
- **Data Type:** Marine pollution incident reports
- **Coverage:** US waters
- **Cost:** Free

### 4. Cyclone Trajectory Prediction Model
**Required Features:**
- Historical storm tracks and intensities
- Atmospheric pressure and wind fields
- Sea surface temperatures
- Environmental wind shear
- Satellite imagery

**Primary Data Sources:**

#### NOAA Hurricane Database (HURDAT2)
- **URL:** https://www.nhc.noaa.gov/data/hurdat/
- **Data Type:** Historical hurricane tracks
- **Coverage:** Atlantic and Eastern Pacific
- **Formats:** Text files (structured format)
- **Cost:** Free

#### IBTrACS (International Best Track Archive)
- **URL:** https://www.ncdc.noaa.gov/ibtracs/
- **Data Type:** Global tropical cyclone database
- **Coverage:** Global (all basins)
- **Formats:** NetCDF, CSV
- **Cost:** Free

#### ECMWF Reanalysis (ERA5)
- **URL:** https://cds.climate.copernicus.eu/
- **Data Type:** High-resolution atmospheric reanalysis
- **Coverage:** Global
- **Resolution:** 0.25° hourly
- **Cost:** Free (registration required)

### 5. Blue Carbon Health Monitor Model
**Required Features:**
- Vegetation indices (NDVI, EVI, LAI)
- Biomass and canopy cover data
- Water quality parameters
- Species diversity indices
- Human impact indicators

**Primary Data Sources:**

#### NASA MODIS Vegetation Indices
- **URL:** https://modis.gsfc.nasa.gov/data/dataprod/mod13.php
- **Data Type:** NDVI, EVI, LAI products
- **Coverage:** Global
- **Resolution:** 250m-1km
- **Cost:** Free

#### Global Mangrove Watch
- **URL:** https://www.globalmangrovewatch.org/
- **Data Type:** Mangrove extent and change
- **Coverage:** Global mangrove areas
- **Formats:** GeoTIFF, Shapefile
- **Cost:** Free

#### Blue Carbon Initiative
- **URL:** https://www.thebluecarboninitiative.org/
- **Data Type:** Blue carbon ecosystem data
- **Coverage:** Global coastal ecosystems
- **Cost:** Free

## 🔧 Data Collection Implementation

### Step 1: API Key Registration
Register for API keys from these services:

1. **NASA Earthdata Login**
   - Register at: https://urs.earthdata.nasa.gov/
   - Required for: NASA Ocean Color, MODIS data

2. **NOAA API Key**
   - Register at: https://www.ncdc.noaa.gov/cdo-web/token
   - Required for: Weather and oceanographic data

3. **Copernicus Marine Service**
   - Register at: https://marine.copernicus.eu/
   - Required for: European oceanographic data

4. **EPA Environmental Data**
   - No API key required for most services
   - Rate limits apply

### Step 2: Data Collection Scripts

Use the provided `dataset_collection_guide.py` script to:
- Automatically collect data from multiple sources
- Handle API rate limits and authentication
- Export data in training-ready formats

### Step 3: Data Preprocessing Pipeline

1. **Data Cleaning:**
   - Remove outliers and invalid measurements
   - Handle missing values appropriately
   - Standardize units and coordinate systems

2. **Feature Engineering:**
   - Calculate derived variables (anomalies, trends)
   - Create temporal features (seasonality, time since last event)
   - Spatial interpolation for missing locations

3. **Data Integration:**
   - Align timestamps across different data sources
   - Match spatial coordinates and projections
   - Create composite datasets for multi-source models

### Step 4: Training Data Organization

Organize collected data into these structures:

```
data/
├── sea_level_anomaly/
│   ├── raw/
│   ├── processed/
│   └── training/
├── algal_bloom/
│   ├── raw/
│   ├── processed/
│   └── training/
├── pollution_events/
│   ├── raw/
│   ├── processed/
│   └── training/
├── cyclone_trajectory/
│   ├── raw/
│   ├── processed/
│   └── training/
└── blue_carbon_health/
    ├── raw/
    ├── processed/
    └── training/
```

## 📈 Data Quality Requirements

### Minimum Dataset Sizes:
- **Sea Level Anomaly:** 2+ years of hourly data from 5+ stations
- **Algal Bloom:** 1000+ water quality samples with bloom events
- **Pollution Events:** 500+ pollution incident records
- **Cyclone Trajectory:** 50+ historical storm tracks
- **Blue Carbon Health:** 500+ ecosystem assessment points

### Data Quality Metrics:
- **Completeness:** >80% data availability
- **Accuracy:** Validated against ground truth where available
- **Temporal Coverage:** Multi-year datasets to capture seasonal patterns
- **Spatial Coverage:** Representative of target deployment areas

## 🚀 Getting Started

1. **Immediate Actions:**
   ```bash
   # Clone the dataset collection repository
   git clone https://github.com/coastal-monitoring/dataset-collection
   
   # Install required packages
   pip install pandas requests netCDF4 xarray
   
   # Set up API credentials
   export NASA_EARTHDATA_TOKEN="your_token_here"
   export NOAA_API_KEY="your_key_here"
   ```

2. **Run Initial Data Collection:**
   ```bash
   python dataset_collection_guide.py
   ```

3. **Train Models:**
   ```bash
   # Train each model with collected data
   python sea_level_anomaly_detector.py
   python algal_bloom_predictor.py
   python pollution_event_classifier.py
   python cyclone_trajectory_model.py
   python blue_carbon_health_monitor.py
   ```

## 📋 Data Update Schedule

- **Real-time Data:** Sea level, weather (hourly updates)
- **Daily Data:** Satellite imagery, water quality
- **Weekly Data:** Ecosystem health indicators
- **Monthly Data:** Pollution reports, carbon assessments
- **Annual Data:** Climate trends, ecosystem mapping

## 🔒 Data Privacy and Ethics

- All datasets are from public sources or require appropriate permissions
- Follow data use agreements and attribution requirements
- Ensure GDPR/privacy compliance for any personally identifiable information
- Implement appropriate data retention and deletion policies

## 📞 Support and Resources

- **Technical Support:** Contact dataset providers directly
- **Model Training Help:** Refer to individual model documentation
- **Integration Issues:** Check the main CTAS documentation
- **Community Forum:** Join the coastal monitoring developer community

This comprehensive dataset strategy will provide the foundation for training robust, accurate AI models for coastal threat assessment and monitoring.
