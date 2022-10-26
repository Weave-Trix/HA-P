import styled from "styled-components";
import {
  useMoralis,
  useMoralisQuery,
  useMoralisSubscription,
} from "react-moralis";
import { Grid, User } from '@web3uikit/icons'
import { Colors, Devices } from "../../next/Theme";
import React, { useReducer, useState } from "react";
import { ENSAvatar, Tab, TabList, Table, EmptyRowsForSkeletonTable, Button, Loading, useNotification } from "web3uikit";
import AuctionsArticle from "../../next/components/Auctions/AuctionsArticle.js"
import AuctionsManager from "../../next/components/Auctions/AuctionsManager";

const Article = styled.article`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  @media ${Devices.Tablet} {
    padding: 1rem 3rem;
  }
  @media ${Devices.Laptop} {
    padding: 1rem 5%;
  }
  @media ${Devices.LaptopL} {
    padding: 1rem 10%;
  }
`;

const Title = styled.h1`
    margin-top: 2.5rem;
    font-size: 2.5rem;
    font-weight: 500;
    color: ${Colors.Primary};
    text-align: center;
`;

const TopSection = styled.div`
  width: 100%;
`;

const Sort = styled.div`
  border-radius: 30px;
  border: 1px solid ${Colors.Primary};
  padding: 0.4rem 1rem;
  color: ${Colors.White};
  cursor: pointer;
`;
const Date = styled.div`
  background: linear-gradient(
    to right,
    ${Colors.Gradients.PrimaryToSec[0]},
    ${Colors.Gradients.PrimaryToSec[1]}
  );
  border-radius: 30px;
  padding: 0.4rem 2.5rem;
`;


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
  const [ tab, setTab ] = useState(1);
 

  return (
    <Article>
      <Title>{tab===1 ? "Auctions" : "My Auctions"}</Title>
        <TopSection>
          <TabList
          onChange={(event) => {
            setTab(event);
          }}
          tabStyle="bulbSeperate"
          >
          <Tab
            tabKey={1}
            tabName={<Grid fontSize='20px'/>}
            lineHeight={0}
          >
            <AuctionsArticle />
          </Tab>
          <Tab
            tabKey={2}
            tabName={<User fontSize='20px'/>}
            lineHeight={0}
          >
              <AuctionsManager />
          </Tab>
          </TabList>
        </TopSection>
    </Article>
  );
}
