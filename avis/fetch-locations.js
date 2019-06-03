
const {
    enqueueURL,
    getCliParams,
    getDateAsString,
    // getOutputFiles,
    // retry
} = require("../utils/commonFunctions");


/*******************************************************************
 * Parameters and initialization
 * we fetches a couple of values which are useful to understand 
 * in which UID we are (to push new URL to the correct task!)
 * and other information like the OUTPUT directory, where we store
 * images and other data
 *******************************************************************/
const {
    urlName, 
    // output, 
    uid, 
    taskName, 
    scrapngoServer,
    extraParams
} = getCliParams();

// const {errorFile} = getOutputFiles(output, urlName);


const isTest = false;


const meta = {
    run_id: "000",
    rental_date_start : "03/06/2019",
    agencies: [
        {agency_name: "London City Airport", agency_postcode: "E162PX"},
        {agency_name: "Newcastle City Centre", agency_postcode: "NE47JL"},
        {agency_name: "Bristol Temple Meads Train Station - United Kingdom", agency_postcode: "BS12PY"}
    ],
    screenshot_id: "/tmp/img.png",
    days : [1, 3, 7, 28],
    start_in: 1
};


if ('agencies' in extraParams) {
    meta.agencies = extraParams.agencies;
}
console.log(` >>>>> Agencies are: ${JSON.stringify(meta.agencies)}`);


if ('days' in extraParams) {
    meta.days = extraParams.days;
} 
console.log(` >>>>> Days are: ${JSON.stringify(meta.days)}`);


if ('start_in' in extraParams) {
    meta.start_in = extraParams.start_in;
} 
console.log(` >>>>> Start in: ${meta.start_in}`);



function getLocationURL (inputLocation, locationAddress, startDate) {

    return dayShift => {

        let endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + dayShift);

        let extraParams = {
            inputLocation,
            locationAddress,
            startDate: getDateAsString(startDate),
            retried: 0, // initialize retried to 0
            endDate: getDateAsString(endDate),
            days: dayShift
        };

        return 'https://www.avis.co.uk/{' + JSON.stringify(extraParams) + '}'
    };
}


function getLocationURLs({agency_name, agency_postcode, start_in, days}) {

    let startDate = new Date();
    startDate.setDate(startDate.getDate() + start_in);

    return days.map(getLocationURL(agency_name, agency_postcode, startDate));
}


function getURLsFromAgenciesAndDays({agencies, ...meta}) {
    //For each agency, concat previous URLs with new ones
    return agencies.reduce(
        (allURLs, {agency_name, agency_postcode}) => 
            [
                ...allURLs,
                ...getLocationURLs({
                    ...meta,
                    agency_name,
                    agency_postcode
                })
            ]
        , [] // Init our allURLs array accumulator with empty array
    );
}

/*******************************************************************
* Create URLs and enqueue them
*******************************************************************/
(async function test() {

    // await initFolder(output);

    //const urls = getLocationURLs(meta);
    const urls = getURLsFromAgenciesAndDays(meta);
    // console.dir(urls);
    await enqueueURL({taskName, uid, urlName, urls, scrapngoServer, isTest});
})();