#!/bin/bash
output_directory="/tmp/puppeteer/avis/output"

node ../fetch-data.js \
    'https://www.avis.co.uk/{{"inputLocation":"Bristol Temple Meads Train Station - United Kingdom","locationAddress":"BS12PY","startDate":"02/06/2019","retried":0,"endDate":"05/06/2019","days":3}}' \
    "avis.co.uk" \
    "UID" \
    "$output_directory" \
    "rentals_search"