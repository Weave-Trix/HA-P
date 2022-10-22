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
  font-size: 2.5rem;
  font-weight: 500;
  color: ${Colors.Primary};
  text-align: center;
`;

const NoMetamask = styled.h1`
  font-size: 2rem;
  font-weight: 400;
  color: ${Colors.White};
  text-align: center;
  margin-top: 30vh;
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
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
    <div>
    {isWeb3Enabled? 
        <div>
            <Article>
            <Title>Auctions</Title>
                <TopSection>
                    <Sort>Sales Volume</Sort>
                    <Date>Today</Date>
                </TopSection>
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
                <ShowMore>show more</ShowMore>
                </Article>
            </div> : 
            <div>
                <Article>
                    <Title>Auctions</Title>
                    <NoMetamask>Please connect to MetaMask</NoMetamask>
                </Article>
            </div>}
        </div>
  );
};

export default AuctionsArticle;
