import React, { useReducer, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { Colors, Devices } from "../../Theme";
import Grid from "../styled/Grid.styled";
import AuctionCard from "../styled/AuctionCard.styled";
import {
  useMoralis,
  useMoralisQuery,
  useMoralisSubscription,
} from "react-moralis";

const AuctionsArticleEl = styled.div`
  margin-top: 1.5rem;
  margin-bottom: 2rem;
`

const NoMetamask = styled.h1`
  font-size: 2rem;
  font-weight: 400;
  color: ${Colors.White};
  text-align: center;
  margin-top: 30vh;
`;

const ShowMore = styled.button`
  margin-top: 1rem;
  cursor: pointer;
  border: 1px solid ${Colors.Primary};
  padding: 1rem 2rem;
  color: ${Colors.Primary};
  background-color: transparent;
  border-radius: 5px;
  font-size: 1rem;
`;

const AuctionsArticle = () => {
  var bidAucsAddress = [];
  // force rerender when auction started bidding changes
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [imageURI, setImageURI] = useState("");
  // get address of biddingAuctions from ListAuctionRecords
  const { Moralis, isInitialized, isWeb3Enabled, ...rest } = useMoralis();
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

  console.log(bidAucsAddress);

  return (
    <AuctionsArticleEl>
    {isWeb3Enabled? 
        <div>
                <Grid>
                    {bidAucsAddress.map((auctionAddress) => {
                    return (
                        <Link key={auctionAddress} href={`/auctions/${auctionAddress}`} passHref>
                        <a>
                            <AuctionCard props={auctionAddress} />
                        </a>
                        </Link>
                    );
                    })}
                </Grid>
            </div> : 
            <div>
                    <NoMetamask>Please connect to MetaMask</NoMetamask>
            </div>}
        </AuctionsArticleEl>
  );
};

export default AuctionsArticle;