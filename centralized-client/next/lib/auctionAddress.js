require('dotenv').config()
const Moralis = require("moralis-v1/node")

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
const appId = process.env.NEXT_PUBLIC_APPLICATION_ID;
const masterKey = process.env.masterKey;

const queryBidAucs = async () => {
    await Moralis.start({ serverUrl, appId, masterKey});
    const query = new Moralis.Query("StateauctionstartedbiddingLogs");
    const lar_bidAucs = await query.find();
    return lar_bidAucs;
}

const getAllAuctionAddress = async () => {
    const lar_bidAucs = await queryBidAucs();
    const test = lar_bidAucs.map((aucs) =>{
        return {
            params: {
                auctionAddress: aucs.attributes.auction,
            },
        };
    });
    return test
}

const getPostData = (id) => {
    return null;
}

export { getAllAuctionAddress, getPostData }