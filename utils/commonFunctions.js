const fs = require('fs');
const fetch = require("node-fetch");

const mkdirp = require('./mkdir');

/**
 * ENQUEUE URL function
 * Can be issued straight from outside the browser context, using the node-fetch API
 * 
 * Requires:
 * @param {string} taskname The name of the task, passed back to scrapngo server
 * @param {string} uid  The UID of the running task, passwd back to the scrapngo server
 * @param {string} urlName  Can be manually specified, if consistent with the one defined in the task.yml file, can bypass the regex
 * @param {Array<string>} urls  the URLs to be pushed to scrapngo server may or may not include the above extraParams formatted as JSON string 
 * @param {bool} fast   if true will use the "fast" queue rather than the strandard one fast queue is processed before the standard and is usually less crowded.
 *                      Moreover the queue mechanisms is FIFO (rather than FILO)
 * @param {bool} infiniteRetry: if true will bypass the "url duplication check"
 * @param {string} scrapngoServer is the URL of the scrapnngo server for the enqueue
 *******************************************************************/
const enqueueURL = async ({taskName, uid, urlName, urls, scrapngoServer, fast=false, infiniteRetry=false, isTest=false}) => {

    const postURL = `${scrapngoServer}/enqueue/${taskName}/${urlName}`;

    let postData = urls.map( url => ({
        url,
        command: '',
        uid,
        fast,
        infiniteRetry
    }));


    const headers = { "Connection": "close", "Content-Type": "application/json" };

    const options = {
        method: 'post',
        body: JSON.stringify(postData),
        headers,
    };
    
    try {
        console.log(` About to send request ${JSON.stringify({...options, body: postData}, null, 2)} to: ${postURL}`);

        if(!isTest) {
            const response = await fetch(postURL, options);

            if(!response.ok) {
                console.log(`Cannot send URL to server: ${url}`);
                return;
            }
            else {
                console.log(`Request has been sent! Reponse: ${JSON.stringify(response)}`);
            }
        }
        
        /**
         * This doesn't seem to be right nor possible,
         * since JSON.parse always return an Object corresponding 
         * to the given JSON text (if string to parse is a valid JSON)
         * "ok" is not an object...
         */
        /* if (JSON.parse(result) != "ok") {
            console.log(`Cannot send URL to server: ${url}`);
        } */

    } catch (err) {
        console.log('Error, cannot send URL to server: ' + err + " - " + scrapngoServer);
    }
};


const zeroPad = (num, places) => {
    let zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
};

const getDateAsString = (date, separator="/") =>
    zeroPad(date.getDate(), 2) + separator + zeroPad(date.getMonth() + 1, 2) + separator + date.getFullYear();

const initFolder = async (folderPath) => {

    if(fs.existsSync(folderPath)) {
        console.log(` [initFolder] - Folder already exists: '${folderPath}'`);
        return;
    }

    let mkdirPromise = mkdirp(folderPath, (err) => {
        if (err) console.error(err);
        else console.log(` [initFolders] - Folder has successfully been created: ${folderPath}`);
    });

    return mkdirPromise;
};


const writeToFile = (data, outputFile) => {

    if (!(Array.isArray(data) && data.length))
        return;

    const jsonData = data.reduce( 
        (acc, currentRow) => acc + JSON.stringify(currentRow) + "\n" ,
        ""
    );

    fs.writeFileSync(outputFile, jsonData, {flag: "a"});
};


/*******************************************************************
 * Support function to serialize scraped data and save it to file
 *******************************************************************/
const writeJSONToFile = (jsonObj, targetFile) => {

    if(!/\.json$/.test(targetFile))
      targetFile+= ".json";
  
    return new Promise((resolve, reject) => {
  
      try {
        var data = JSON.stringify(jsonObj);
        console.log(" Saving JSON data to file: %s", targetFile);
        //console.log("Saving object '%s' to JSON file: %s", JSON.stringify(jsonObj, null, 2), targetFile);
      }
      catch (err) {
        console.log(" Could not convert object to JSON string ! " + err);
        reject(err);
      }
          
      // Try saving the file.        
      fs.writeFile(targetFile, data, (err, text) => {
        if(err)
          reject(err);
        else {
          resolve(targetFile);
        }
      });
    });
};


// CLI parameters parsing
const getCliParam = index => process.argv[2+index] || undefined;

/**
 * Input URL parsing
 * @param {string} url 
 * returns {{url: string, extraParams:{*}}}
 */
const parseURL = (url) => {

    let extraParams = {};
    try {
        const extraParamsString = url.match(/.*\{(\{.*\})\}/)[1];
        console.log(' [getCliParams] Extra params JSON string is: ' + extraParamsString);
        extraParams = JSON.parse(extraParamsString);
        url = url.replace(/\{\{.*\}\}/, "");
        console.log(' [getCliParams] Request URL is now: ' + url);
    } catch (err) {}

    return {
        url, extraParams
    };
};

/*******************************************************************
 * Parameters and initialization
 * we fetches a couple of values which are useful to understand 
 * in which UID we are (to push new URL to the correct task!)
 * and other information like the OUTPUT directory, where we store
 * images and other data
 *******************************************************************/
const getCliParams = () => {

    let tmpUrl = getCliParam(0);
    console.log(">>>>> Fetching " + tmpUrl);

    const urlName = getCliParam(1);
    console.log(">>>>> Known as " + urlName);

    const uid = String(getCliParam(2));
    console.log(">>>>> UID is " + uid);

    const output = getCliParam(3) + '/' + uid;
    console.log(">>>>> Output folder is " + output);

    const taskName = getCliParam(4);
    console.log(">>>>> task Name is " + taskName);

    let scrapngoServer = getCliParam(5);
    if (!scrapngoServer) {
        // by default we are assuming that the reverse-SSH connection is available
        scrapngoServer = "http://localhost:8080";
    }

    console.log(">>>>> scrapngo server is  " + scrapngoServer);


    /**
     * EXTRACT parameters from URL: this is a simple workaround to pass custom data between two scraping scripts.
     * We are using below format, which can of course changed.
     * 
     * https://www.codref.com/{{"inputLocation": "here", "retried": o}}'
     * 
     *******************************************************************/
    const {url, extraParams} = parseURL(tmpUrl);
    /*
    let extraParams = {};
    try {
        const extraParamsString = url.match(/.*\{(\{.*\})\}/)[1];
        console.log(' [getCliParams] Extra params JSON string is: ' + extraParamsString);
        extraParams = JSON.parse(extraParamsString);
        url = url.replace(/\{\{.*\}\}/, "");
        console.log(' [getCliParams] Request URL is now: ' + url);
    } catch (err) {}*/

    const retried = extraParams.retried;
    console.log(">>>>> retried attempt is " + retried);

    return {
        extraParams,
        retried,
        url,
        urlName,
        uid,
        output,
        taskName,
        scrapngoServer
    };
};

const getOutputFiles = (output, urlName, duration=1) => {

    /*******************************************************************
     * OUTPUT files definition and project-wide variables
     * these can be changed, although it is a good idea to stick to
     * common format among different projects
     *******************************************************************/
    const currentTime = new Date();
    const month = zeroPad(currentTime.getMonth() + 1, 2);
    const day = zeroPad(currentTime.getDate(), 2 );
    const year = currentTime.getFullYear();
    const outputFile = `${output}/${urlName}-${year}-${month}-${day}-duration-${duration}.json`;
    const errorFile = `${output}/${urlName}/errors-${year}-${month}-${day}-duration-${duration}.json`;
    const outputImage = `${output}/${urlName}-${year}-${month}-${day}-duration-${duration}.png`;
    return {
        outputFile,
        errorFile,
        outputImage,
    };
}





const initPageConsole = page => {

    // print out all the messages in the headless browser context
    page.on('console', msg => console.log(' [PAGE LOG] - ', msg.text()));
};

/** 
 * Disable selected resources (load page faster and consumes less bandwidth)
 **
// If any of these strings are found in the requested resource's URL, skip this request. These are not required for running tests.
/* let skip = [
    'www.adsensecustomsearchads.com',
    'googleads.g.doubleclick.net',
    'cm.g.doubleclick.net',
    'www.googleadservices.com',
    'facebook.com',
    'connect.facebook.net',
    'www.facebook.com',
    'doubleclick.net',
    'cl.qualaroo.com',
    'maps.googleapis.com',
    'cdnssl.clicktale.net',
    'gateway.foresee.com',
    'consent.trustarc.com',
    'c.go-mpulse.net',
    'ssl.google-analytics.com',
    'www.googletagmanager.com'
];*/

module.exports = {
    initFolder,
    initPageConsole,
    enqueueURL,
    getCliParam,
    getCliParams,
    getDateAsString,
    getOutputFiles,
    parseURL,
    writeJSONToFile,
    writeToFile,
};