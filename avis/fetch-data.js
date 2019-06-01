const puppeteer = require('puppeteer');
const {
    initFolder,
    initPageConsole,
    enqueueURL, 
    writeJSONToFile,
    getOutputFiles,
    getCliParams,
    retry,
} = require("../utils/commonFunctions");


/*******************************************************************
 * Parameters and initialization
 * we fetches a couple of values which are useful to understand 
 * in which UID we are (to push new URL to the correct task!)
 * and other information like the OUTPUT directory, where we store
 * images and other data
 *******************************************************************/
const {
    url,
    urlName,
    uid,
    output,
    taskName,
    extraParams
} = getCliParams();

const {startDate, endDate, inputLocation, locationAddress, days} = extraParams;
const {outputFile, errorFile, outputImage} = getOutputFiles(output, urlName);


// Meta declaration
const meta = {
    run_id: "000",
    rental_date_start: startDate,
    rental_date_end: endDate,
    agency_name: inputLocation,
    agency_postcode: locationAddress,
    screenshot_id: outputImage,
    days
};



const getDateParts = (dateString, separator="/") => {
    const [day, month, year] = dateString.split(separator);
    return {
        day: parseInt(day),
        month: parseInt(month)-1,
        year
    };
};


/**
 * Actual fetching logic
 * 
 * Timeouts here plays an important role. Use them wisely. One can even define custom logic to increase them programmatically
 * (maybe multiplying the retry with a constant)
 */
async function fillSearchForm(page) {

    console.log(" >>>>> Initiated form filling...");

    // Fill the location search input
    await page.click("#hire-search");
    await page.type("#hire-search", meta.agency_postcode);
    await page.waitFor(650);

    console.log(" I've just filled the search input !");

    const {day: startDay, month: startMonth, year: startYear} = getDateParts(meta.rental_date_start);
    let pickupDateXPath = `//div[@id='date-from-container']//td[@data-month='${startMonth}'][@data-year='${startYear}']/a[text()='${startDay}']`;

    const {day: endDay, month: endMonth, year: endYear} = getDateParts(meta.rental_date_end);
    let dropOffDateXPath = `//div[@id='date-to-container']//td[@data-month='${endMonth}'][@data-year='${endYear}']/a[text()='${endDay}']`;
    
    // Click on the Pick-up date button
    await page.click("#pick-up-date-button");
    console.log(` Just clcked on the Pick-up date button !`);

    await page.waitFor("section#set-pick-up-date.is-open");
    await page.waitFor(pickupDateXPath);
    await page.waitFor(500);

    // Select pick-up date and wait for it to be selected as expected
    let pickupDateHandle = await page.$x(pickupDateXPath).then( handles => handles[0]);
    await pickupDateHandle.click();
    await page.waitForFunction(`document.querySelector('#date-from').value === '${meta.rental_date_start}'`);
    console.log(` Pickup date has been successfuly updated !`);
    await page.waitFor(500);
    await pickupDateHandle.dispose();

    // Click on the Drop-off date button
    await page.click("#drop-off-date-button");
    console.log(` Just clcked on the Drop-off date button !`);

    await page.waitFor("section#set-drop-off-date.is-open");
    await page.waitFor(dropOffDateXPath);
    await page.waitFor(1000);

    // Select drop-off date and wait for it to be selected as expected
    let dropoffDateHandle = await page.$x(dropOffDateXPath).then( handles => handles[0]);;
    await dropoffDateHandle.click();
    await page.waitForFunction(`document.querySelector('#date-to').value === '${meta.rental_date_end}'`);
    console.log(` Drop-off date has been successfuly updated !`);
    await page.waitFor(500);
    await dropoffDateHandle.dispose();
    
    // Hit the submit button
    console.log(" About to click on the Search button...");
    await page.click("#car-search-submission1");
    await page.waitFor(".search-results-wrapper");

    console.log(">>>>> Form has been submitted! Successfully reached search results. ");
}

function extractData(page) {
    return page.$$eval("article.car-result-module", articles =>
        articles.map( article => ({
            // carGroup: article.getAttribute("class"),
            position: article.getAttribute("data-vehicle-id"),
            size: article.getAttribute("data-size"),
            gps: article.getAttribute("data-gps"),
            fuel: article.getAttribute("data-fuel"),
            transmission: article.getAttribute("data-transmission"),
            price: (article.querySelector(".vehicle__prices-price").innerText || "").trim()
        }))
    );
}

/**
 * Execute eval("utag_data = (function initUtag() { " + $x("//body/script[contains(text(), 'utag_data')]")[0].innerText + "; return utag_data;})();")
 * @param {*} page 
 */
async function getUtagData(page) {

    const scriptHandle = await page.$x("//body/script[contains(text(), 'utag_data')]").then( handles => handles[0]);
    const scriptContent = scriptHandle.innerText;
    await scriptHandle.dispose();
    const utag_data = await page.evaluate(
        `(
            () => { 
                ${scriptContent}; 
                return utag_data;
            }
        )();`
    );

    // Only keep relevant information
    return Object.keys(utag_data)
        .filter( key => /dropOff|booking|offer|pickUp|rental/.test(key))
        .reduce( (acc, key)  => {
            return {
                ...acc,
                [key] : utag_data[key]
            }
        }, {});
}

async function fetchData(page, meta) {

    console.log(" >>>>> Initiated data fetching...");
    const utag_data = await getUtagData(page);
    const carsData = await extractData(page);
    console.log(">>>>> Data fetching terminated !");
    
    return {
        ...meta,
        rentals: carsData,
        utag_data
    };
}

async function initBrowser(options={}) {

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...options
    });

    const page = await browser.newPage();

    // Comment out if you want to display page logs
    // initPageConsole(page);

    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36");
    await page.setViewport({
        width: 1100,
        height: 1700
    });

    return {browser, page};
}

/*******************************************************************
 * Web scraping START
 *******************************************************************/
async function run (startURL) {

    await initFolder(output);
    
    const {browser, page} = await initBrowser({
        headless: true
    });

    try {
        await page.goto(startURL);
        await page.waitFor("#hire-search");
        console.log("Search page is ready !");
    }
    catch (err) {
        console.log(" Timed out on entry point condition step. ");

        // we might want to store locally a screenshot to let us understand why things went wrong!
        await page.screenshot({path: outputImage + "-error.png"});

        // try changing the initial waitForSelector condition to test out the retry function
        extraParams.retried = retry(url, extraParams, errorFile);
        return;
    }
    
    await fillSearchForm(page);    
    const rentalData = await fetchData(page, meta);

    console.log(JSON.stringify(rentalData, null, 2));

    // most important, we might want to retrieve the data from inside the page and store it to disk
    await writeJSONToFile(rentalData, outputFile);
    await page.screenshot({path: outputImage, fullPage: true});

    await browser.close();
}

run(url);