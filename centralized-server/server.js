require('dotenv').config()
const express = require('express')
const { MongoClient, MONGO_CLIENT_EVENTS } = require("mongodb");
const port = 8000;
const app = express();
const cors = require('cors')({origin: true});

/* mongoDb client */
const mongoDbUri = process.env.MONGO_URI;
const mongoClient = new MongoClient(mongoDbUri);

/* mongoDb query */
async function fetchNftUri(_tokenId) {
    console.log(`fetching tokenID -> ${_tokenId}`)
    try {
        const database = mongoClient.db('test');
        const nftRecords = database.collection('LognftmintedLogs');
        // query nftUri
        const query = { tokenId: _tokenId };
        const nft = await nftRecords.findOne(query);
        return nft;
    } catch (error) {
        console.log(error);
        throw new Error('query unsuccessful');
    } finally {
        console.log('Ruka chan says Hi~');
    }
}


app.listen(port, () => {
    console.log('We are live on ' + port);
})

app.get('/nftTokenUri/:tokenId', function (req,res) {
    const tokenId = req.params.tokenId;
    fetchNftUri(tokenId)
        .then(nftUri =>{
            console.log(nftUri)
            if (nftUri !== null) {
                cors(req, res, () => {
                    res.json({msg: nftUri.tokenURI});
                });
            } else {
                console.log('Nft not found in mongoDb');
                //res.status(404);
            }
        })
        .catch(err => {
            console.log(err);
            //res.status(400);
        })
})
