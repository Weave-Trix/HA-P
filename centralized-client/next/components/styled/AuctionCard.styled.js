import React, { useReducer, useState, useEffect } from "react";
import Web3 from "web3";
import {
  useMoralis,
  useMoralisQuery,
  useMoralisSubscription,
  useWeb3Contract, MoralisProvider, MoralisContext
} from "react-moralis";
import styled from "styled-components";
import Image from "next/image";
import moment from 'moment';
import { Colors } from "../../Theme";
import { BsHeart, BsFillPersonFill } from "react-icons/bs";
import { RiAuctionFill } from "react-icons/ri";
import { ENSAvatar } from "web3uikit";
import CountdownTimer from "../Timer/CountdownTimer"
import contractAbi from "../../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import nftAbi from "../../../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json";

const WinningBadge = styled.span`
  position: absolute;
  left: 1rem;
  top: 1rem;
  z-index: 3;
  background: linear-gradient(
    to right,
    ${Colors.Gradients.PrimaryToSec[0]},
    #42ff5f
  );
  padding: 0.5rem 1rem;
  border-radius: 30px;
  font-weight: 500;
  color: ${Colors.White};
`;

const LosingBadge = styled.span`
  position: absolute;
  left: 1rem;
  top: 1rem;
  z-index: 3;
  background: linear-gradient(
    to right,
    ${Colors.Gradients.PrimaryToSec[0]},
    #f73e47
  );
  padding: 0.5rem 1rem;
  border-radius: 30px;
  font-weight: 500;
  color: ${Colors.White};
`;

const NFTCardEl = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Card = styled.div`
  border-radius: 15px;
  overflow: hidden;
  z-index: 2;
  background-color: ${Colors.White};
  color: ${Colors.Black};
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 40px rgb(0 0 0/10%);
`;

const BadgeEl = styled.span`
  position: absolute;
  left: 1rem;
  top: 1rem;
  z-index: 3;
  background: linear-gradient(
    to right,
    ${Colors.Gradients.PrimaryToSec[0]},
    ${Colors.Gradients.PrimaryToSec[1]}
  );
  padding: 0.5rem 1rem;
  border-radius: 30px;
  font-weight: 500;
  color: ${Colors.White};
`;

const ItemImage = styled.div``;
const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem 1.5rem;
  flex: 1;
  gap: 0.5rem;
`;
const TSection = styled.div`
  display: flex;
  justify-content: space-between;
`;
const EditionEl = styled.span`
  font-weight: 500;
`;
const StockEl = styled.span`
  color: ${Colors.Primary};
  font-weight: 600;
`;
const ItemTitle = styled.h2`
  font-size: 1.4rem;
`;  

const BiddingDetails = styled.div`
  display: flex;
  flex-direction: row;
  margin-right: 30px;
`;


const PriceSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const PriceTitle = styled.h3`
  font-weight: 100;
  font-size: 0.6rem;
`;

const PriceValue = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const PriceBold = styled.h3`
  font-size: 1.4rem;
  font-weight: 500;
  margin-right: 6px;
`;

const LeadingSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 30px;
`;

const LeadingTitle = styled.h3`
  font-weight: 100;
  font-size: 0.6rem;
`;

const LeadingValue = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const BottomSection = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${Colors.Gray};
`;
const AvatarEl = styled.span`
  overflow: hidden;
  border-radius: 50%;
  display: flex;
  height: 40px;
  width: 40px;
  margin-right: 0.5rem;
`;

const AuthorEl = styled.span``;

const Icons = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  gap: 0.5rem;
  > svg {
    cursor: pointer;
  }
`;

const LikesEl = styled.span`
  margin-left: 8px;
`;

const Bar1 = styled.span`
  width: 93%;
  height: 0.7rem;
  background-color: ${Colors.White};
  border-radius: 0 0 50px 50px;
  box-shadow: inset 0 4px 5px rgb(0 0 0 /10%);
  z-index: 1;
  /* filter: brightness(0.7); */
  transform: translateY(-30%);
`;
const Bar2 = styled(Bar1)`
  width: 88%;
  transform: translateY(-60%);
  /* filter: brightness(0.5); */
  z-index: 0;
`;

const truncateStr = (fullStr, strLen) => {
  if (fullStr.length <= strLen) return fullStr
  const separator = "..."
  const charsToShow = strLen - separator.length
  const frontChars = Math.ceil(charsToShow / 2)
  const backChars = Math.floor(charsToShow / 2)
  return fullStr.substring(0, frontChars) + separator + fullStr.substring(fullStr.length - backChars)
}

export default function AuctionCard({ props }) {
  const { isWeb3Enabled, account, Moralis } = useMoralis();
  useEffect(() => {
    if (!isWeb3Enabled) {
      Moralis.enableWeb3();
    }
    }, [MoralisProvider]);

  const [tokenId, setTokenId] = useState("0");
  const [accAddress, setAccAddress] = useState("0x0");
  const [nftAddress, setNftAddress] = useState("0x0");
  const [vehicleName, setVehicleName] = useState("Null");
  const [highestBid, setHighestBid] = useState("0");
  const [highestBidder, setHighestBidder] = useState("0x0");
  const [bidTimeLeft, setBidLeftTime] = useState(0);
  const [seller, setSeller] = useState("0x0");
  const [bidders, setBidders] = useState([]);
  const [uniqueBidders, setUniqueBidders] = useState([]);
  const [tokenURI, setTokenURI] = useState("0");
  const [imageURI, setImageURI] = useState("https://cdn.dribbble.com/users/1186261/screenshots/3718681/_______.gif");
  const [currAucState, setCurrAucState] = useState("");


  const {runContractFunction: getTokenId} = useWeb3Contract({
    abi: contractAbi.abi,
    contractAddress: props,
    functionName: "tokenId"
  })

  const {runContractFunction: getNftAddress} = useWeb3Contract({
    abi: contractAbi.abi,
    contractAddress: props,
    functionName: "nftAddress"
  })

  const {runContractFunction: getHighestBid} = useWeb3Contract({
    abi: contractAbi.abi,
    contractAddress: props,
    functionName: "highestBid"
  })

  const {runContractFunction: getHighestBidder} = useWeb3Contract({
    abi: contractAbi.abi,
    contractAddress: props,
    functionName: "highestBidder"
  })

  const {runContractFunction: getBidEndTime} = useWeb3Contract({
    abi: contractAbi.abi,
    contractAddress: props,
    functionName: "bidEndTime"
  })

  const {runContractFunction: getSeller} = useWeb3Contract({
    abi: contractAbi.abi,
    contractAddress: props,
    functionName: "seller"
  })

  const {runContractFunction: getTokenURI} = useWeb3Contract({
    abi: nftAbi.abi,
    contractAddress: nftAddress,
    functionName: "tokenURI",
    params: {
      tokenId: tokenId
    }
  })

  // fetch auction data from blockchain
  async function updateAucDetails() {
    const _tokenId = await getTokenId()
    setTokenId(_tokenId)
    const _nftAddress = await getNftAddress()
    setNftAddress(_nftAddress)
    const _seller = await getSeller()
    setSeller(_seller)
    const _bidEndTime = await getBidEndTime()
    setBidLeftTime(_bidEndTime.toNumber() * 1000)
  }

  async function updateBidDetails() {
    const _highestBid = await getHighestBid()
    setHighestBid(_highestBid)
    const _highestBidder = await getHighestBidder()
    setHighestBidder(_highestBidder)
    // get unique bidders
    setUniqueBidders(new Set(bidders));
  }

  // parse NFT data from TokenURI
  async function updateTokenDetails() {
    const ipfsLink = await getTokenURI()
    if(ipfsLink) {
      const requestURL = ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/")
      const tokenURIResponse = await (await fetch(requestURL)).json()
      setTokenURI(tokenURIResponse)
      const _vehicleName = tokenURIResponse.name
      setVehicleName(_vehicleName)
      const _imageURI = tokenURIResponse.image
      const imageURIURL = _imageURI.replace("ifps://", "https://ipfs.io/ipfs/")
      setImageURI(imageURIURL)
    }
  }

  // fetch logBidPlaced from blockchain event listener (initialize only)
  const { data: labp_bidPlaced, isLoading: isFetchingBidPlaced } = useMoralisQuery(
    "LogAuctionBidPlaced",
    (query) => query.equalTo("auction", props).descending("createdAt"),
    [],
    { live: true }
  );

  useEffect(() => {
    console.log("New bid detected")
    // clear bidders
    setBidders([]);
    // get latest bidders
    labp_bidPlaced.map((bids) => {
      const web3 = new Web3(MoralisProvider)
      const _accAddress = web3.utils.toChecksumAddress(bids.attributes.bidder)
      setBidders((prev_bidders) => [...prev_bidders, _accAddress])
    })
    updateAucDetails()
    updateBidDetails()
  }, [labp_bidPlaced])

  useEffect(() => {
    console.log("account change detected")
    if (isWeb3Enabled) {
      updateAucDetails()
      updateBidDetails()
      const web3 = new Web3(MoralisProvider)
      const _accAddress = web3.utils.toChecksumAddress(account)
      setAccAddress(_accAddress)
    }
  }, [isWeb3Enabled, account])

  useEffect(() => {
    updateTokenDetails();
  }, [nftAddress])

  return (
    <NFTCardEl >
      <Card>
      {bidders.includes(accAddress) ? (highestBidder === accAddress ?  <WinningBadge>Leading</WinningBadge> : <LosingBadge>Losing</LosingBadge>) : ""}
      <ItemImage>
          <Image src={imageURI} width="1024" height="840" />
        </ItemImage>
        <InfoSection>
          <TSection></TSection>
          <ItemTitle>{vehicleName}</ItemTitle>
          <BiddingDetails>
            <PriceSection>
              <PriceTitle>
                AUCTION
              </PriceTitle>
              <PriceValue>
                <PriceBold> {highestBid.toString()}</PriceBold>
                {"wei"}
              </PriceValue>
            </PriceSection>
            <LeadingSection>
              <LeadingTitle>
                LEADER
              </LeadingTitle>
              <LeadingValue>
               {(highestBidder === "0x0000000000000000000000000000000000000000") ? "No Bidder" : truncateStr(highestBidder, 15)}
              </LeadingValue>
            </LeadingSection>
          </BiddingDetails>
          <BottomSection>
            <AvatarEl>
              <ENSAvatar
                address={seller}
                size={40}
              />
            </AvatarEl>
            <AuthorEl>{(accAddress === seller || seller === undefined) ? "by You" : truncateStr(seller || "", 15)}</AuthorEl>
            <Icons>
              <LikesEl>
                <BsFillPersonFill /> {uniqueBidders.size}
              </LikesEl>
              <LikesEl>
                <RiAuctionFill /> {bidders.length}
              </LikesEl>
            </Icons>
          </BottomSection>
          <CountdownTimer targetDate={bidTimeLeft} />
        </InfoSection>
      </Card>
      <Bar1 />
      <Bar2 />
    </NFTCardEl>
  );
}
