# Evopricing Avis scraper

The Avis bot is a cars rental pricing scraper.

## Usage

**1. Enqueuing search URLs**

To enqueue URLs for car rental price quotes for 1, 3, 7 and 28 days duration, for each of the 3 rental agencies:

* name: London City Airport
```javascript
  {{"inputLocation":"London City Airport", "locationAddress":"E162PX"}}
```

* name: Newcastle City Centre
```javascript
  {{"inputLocation":"Newcastle City Centre", "locationAddress":"NE47JL"}}
```

*  name: Bristol Temple Meads Train Station - United Kingdom
```javascript
  {{"inputLocation":"Bristol Temple Meads Train Station - United Kingdom", "locationAddress":"BS12PY"}}'
```

Run the test command:

```bash
cd tests/
./test-fetch-locations.sh
```
(Make sure you have +x rights for your user in order to execute the .sh script.)

Or you can also customize the search paramters:

```bash
node ./fetch-locations.js \
    'https://localhost/{{"agencies":[{"agency_name":"London City Airport","agency_postcode":"E162PX"},{"agency_name":"Newcastle City Centre","agency_postcode":"NE47JL"},{"agency_name":"Bristol Temple Meads Train Station - United Kingdom","agency_postcode":"BS12PY"}], "days":[1,3,7,28], "start_in": 2}}' \
    "avis.co.uk" \
    "UID" \
    "/tmp/puppeteer/avis/output" \
    "rentals_search"
```

***
**2. Fetching data**

To fetch data for a specific rental agency, you can run the test command:

```bash
cd tests/
./test-fetch-data.sh
```

Or you can also customize the search parameters: 

```bash
node ../fetch-data.js \
    'https://www.avis.co.uk/{{"inputLocation":"Bristol Temple Meads Train Station - United Kingdom","locationAddress":"BS12PY","startDate":"02/06/2019","retried":0,"endDate":"05/06/2019","days":3}}' \
    "avis.co.uk" \
    "UID" \
    "/tmp/puppeteer/avis/output" \
    "rentals_search"
```
