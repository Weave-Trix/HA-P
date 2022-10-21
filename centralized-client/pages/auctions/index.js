import styled from "styled-components";
import {
  useMoralis,
  useMoralisQuery,
  useMoralisSubscription,
} from "react-moralis";
import React, { useReducer } from "react";
import AuctionsArticle from "../../next/components/Auctions/AuctionsArticle.js"

const IndexEl = styled.div``;


export default function Auctions() {
  // TODO: Show all upcoming vehicles
  // TODO: setup a self-hosted server to listen for on-chain events to be fired, and add tehm to a database to query

  /*
  var bidAucsAddress = [];
  var bidAucs = [];
  var bidHistory = [];
  // force rerender when new bid placed / deposit placed
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  // get address of bidAucs from ListAuctionRecords
  const { Moralis, isInitialized, ...rest } = useMoralis();
  const { data: lar_bidAucs, isLoading: isFetchingAddress } = useMoralisQuery(
    "ListAuctionRecords",
    (query) => query.equalTo("currState", 1).descending("createdAt"),
    [],
    { live: true }
  );

  // populate address to bidAucsAddress
  lar_bidAucs.map((auctions) => {
    bidAucsAddress.push(auctions.attributes.auctionAddress);
  });

  console.log(`bidAucsAddress: ${bidAucsAddress}`);

  // get details of bidAucs from sasb_bidAucs
  const { data: sasb_bidAucs, isLoading: isFetchingDetails } = useMoralisQuery(
    "StateAuctionStartedBidding",
    (query) =>
      query.containedIn("auction", [bidAucsAddress]).descending("createdAt"),
    [lar_bidAucs],
    {
      live: true,
    }
  );

  // populate details to biddingAuction
  sasb_bidAucs.map((auctions) => {
    bidAucs.push(auctions.attributes.auction);
  });
  console.log(`bidAucs: ${bidAucs}`);

  // get details of bidHistory from LogAuctionBidPlaced
  const { data: labp_bidHistory, isLoading: isFetchingHistory } =
    useMoralisQuery(
      "LogAuctionBidPlaced",
      (query) =>
        query
          .containedIn("auction", [bidAucsAddress])
          .descending("bidAmount_decimal"),
      [lar_bidAucs],
      {
        live: true,
      }
    );

  // populate details to bidHistory
  labp_bidHistory.map((bids) => {
    bidHistory.push(bids.attributes.bidAmount);
  });
  console.log(`bidHistory: ${bidHistory}`);
  console.log(sasb_bidAucs);
  console.log(labp_bidHistory);

  // listen for bidPlaced events
  useMoralisSubscription("LogAuctionBidPlaced", (query) => query, [], {
    onUpdate: forceUpdate,
  });

  // listen for depositPlaced events
  */

  return (
    <IndexEl>
      <AuctionsArticle />
    </IndexEl>
  );
}
