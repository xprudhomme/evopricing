const {enqueueURL} = require("../../utils/commonFunctions");

(async function test() {

    const taskName = "rentals_search";
    const uid = "UID";
    const urlName = "avis.co.uk";
    const scrapngoServer = "http://localhost:8080";

    const urls = [
        "https://www.avis.co.uk/{{\"inputLocation\":\"Newcastle City Centre\",\"locationAddress\":\"NE47JL\",\"startDate\":\"01/06/2019\",\"retried\":0,\"endDate\":\"29/06/2019\",\"days\":28}}"
    ];

    await enqueueURL({taskName, uid, urlName, urls, scrapngoServer});
})();