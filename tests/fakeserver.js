const express = require("express")
const app = express();

app.use(express.json());
//app.use(express.urlencoded({extended: false}));

const {parseURL} = require("../utils/commonFunctions");

const PORT = 8080;

app.post('/', (req, res) => {
    return res.send('Received a POST HTTP method');
});

app.post("/enqueue/rentals_search/avis.co.uk", (req, res) => {
    
    
    let bodyItems = req.body.map( item => {
        const {url, extraParams} = parseURL(item.url);
        return {
            ...item,
            url,
            extraParams
        };
    });

    console.log(`Received a POST HTTP method with: ${JSON.stringify(bodyItems, null, 2)}`);

    return res.send('Received a POST HTTP method');
});

app.listen(PORT, () =>
  console.log(`Example app listening on port ${PORT} !`),
);