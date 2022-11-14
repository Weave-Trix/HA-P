import React from "react";
import styled from "styled-components";
import Image from "next/image";
import Head from "next/head";
import { Colors, Devices } from "../../next/Theme";
import { HiOutlineExternalLink } from "react-icons/hi";
import { AiFillCaretLeft } from "react-icons/ai";
import { IoMdShareAlt } from "react-icons/io";
import { BsHeart, BsFillEyeFill, BsThreeDots, BsFillPersonFill } from "react-icons/bs";
import Tab from "../../next/components/styled/Tab.styled";
import Tabs from "../../next/components/styled/Tabs.styled";
import EditionSelector from "../../next/components/Asset/EditionSelector";
import OwnershipItem from "../../next/components/Asset/OwnershipItem";
import BidSticky from "../../next/components/Asset/BidSticky";
import Timer from "../../next/components/Timer/CompactCountdownTimer"
import Report from "../../next/components/NFT/Report";
import { RiAuctionFill } from "react-icons/ri";
import { useRouter } from "next/router";
import {
  getAllAuctionAddress,
  getPostData,
} from "../../next/lib/auctionAddress";
import Moralis from "moralis-v1";
import axios from "axios";
import {
  useMoralis,
  useMoralisQuery,
  useWeb3Contract,
  MoralisProvider,
} from "react-moralis";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { ENSAvatar, Widget, Eth } from "web3uikit";
import contractAbi from "../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import nftAbi from "../../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json";

const AssetEl = styled.article`
  height: 130vh;
  background-color: ${Colors.White};
  color: ${Colors.Black};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  @media ${Devices.Laptop} {
    padding: 1rem 13%;
  }
`;
const SectionContainer = styled.div`
  display: flex;
  gap: 6rem;
  flex-direction: column;
  @media ${Devices.Laptop} {
    flex-direction: row;
  }
`;

const Divider = styled.div`
  border-top: 1px solid grey;
  border-color: lightgrey;
  margin-top: 2rem;
  margin-bottom: 2rem;
`

const LeftSection = styled.div`
  display: flex;
  flex: 0.7rem;
  flex-direction: column;
  gap: 1rem;
`;
const ImageEl = styled.div`
  border-radius: 30px;
  overflow: hidden;
`;
const ChainLink = styled.a`
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 500;
  align-items: center;
  border: 1px solid ${Colors.Border};
  padding: 1.5rem 1rem;
`;
const RightSection = styled.div`
  margin-top: 4rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  flex: 0.95;
`;
const BackBtn = styled.span`
  color: ${Colors.Primary};
  display: flex;
  width: max-content;
  cursor: pointer;
  align-items: center;
`;

const TopBtns = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 1rem;
  svg {
    font-size: 1.5rem;
  }
`;

const LikesBtn = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ViewsEl = styled(LikesBtn)``;
const ShareBtn = styled(LikesBtn)``;
const MoreBtn = styled(LikesBtn)`
  margin-left: auto;
`;

const AuthorContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  span {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
`;
const AvatarEl = styled.div`
  border-radius: 50%;
  overflow: hidden;
  width: 50px;
  height: 50px;
  margin-right: 5px;
`;

const AuthorAddress = styled.div`
    align-items: left;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 1rem;
`

const CreatorLabel = styled.label`
  color: ${Colors.Gray};
  font-size: 0.8rem;
`;
const UsernameEl = styled.span``;

const AuctionTitle = styled.div`
    display: flex;
    align-items: center;
`

const Title = styled.h1`
  font-size: 1.7rem;
  display: inline-block;
  margin-right: 1rem;
`;

const MarketPlace = styled.span`
  border: 1px solid ${Colors.Gray};
  border-radius: 50px;
  padding: 0.2rem 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${Colors.Gray};
`;

const AcOfferLabel = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
  color: ${Colors.Gray};
  margin-bottom: 20px;
`;
const Des = styled.p`
  white-space: pre-wrap;
  margin-bottom: 10px;
  font-size: 0.85rem;
`;

const TagContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Tag = styled.span`
  border: 1px solid ${Colors.Black};
  border-radius: 5px;
  padding: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Info = styled.div`
  box-shadow: 0 4px 40px rgb(0 0 0 /10%);
  border: 1px solid ${Colors.Border};
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  padding: 0.8rem 1rem;
  border-radius: 5px;
  background-color: ${Colors.White};
`;

const EditionEl = styled.span`
  font-weight: 500;
  font-size: 0.8rem;
`;

const BidTitle = styled.div`
  font-weight: 400;
  font-size: 1.2rem;
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
`;



export async function getStaticPaths() {
  const paths = await getAllAuctionAddress();
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const postData = getPostData(params.id);
  return {
    props: {
      postData,
    },
  };
}

const auctionAddress = () => {
    const router = useRouter();
    const { auctionAddress } = router.query;
    const { isWeb3Enabled, account, isInitialized } = useMoralis();
    
    /*
    Start Section
    useState hooks
    */
    const [aucState, setAucState] = useState(0);
    const [aucStateText, setAucStateText] = useState("NULL");
    const [tokenId, setTokenId] = useState("0");
    const [nftSymbol, setNftSymbol] = useState("LOL");
    const [nftDescription, setNftDescription] = useState("Lorem ipsum, world's first tangible NFT marketplace for vehicle asset :)");
    const [accAddress, setAccAddress] = useState("0x0");
    const [nftAddress, setNftAddress] = useState("0x0");
    const [vehicleName, setVehicleName] = useState("Null");
    const [nftAttributes, setNftAttributes] = useState([]);
    const [highestBid, setHighestBid] = useState("0");
    const [highestBidder, setHighestBidder] = useState("0x0");
    const [bidEndTime, setBidEndTime] = useState(0);
    const [aucDeposit, setAucDeposit] = useState(0);
    const [userDeposit, setUserDeposit] = useState(0);
    const [seller, setSeller] = useState("0x0");
    const [authority, setAuthority] = useState("0x0");
    const [bidders, setBidders] = useState([]);
    const [uniqueBidders, setUniqueBidders] = useState([]);
    const [tokenURI, setTokenURI] = useState("0");
    const [imageURI, setImageURI] = useState(
        "https://cdn.dribbble.com/users/1186261/screenshots/3718681/_______.gif"
    );
    const [allTabs, setAllTabs] = useState(
      [
        { Id: 1, Title: "Attributes", Content: <Tab /> },
        { Id: 2, Title: "Bids", Content: <Tab /> },
        { Id: 3, Title: "Ownership", Content: <Tab /> },
      ]
    );
    /*
    End Section
    useState hooks
    */

    /* 
    Start Section
      WebSocket
    */
    // fetch logBidPlaced from blockchain event listener (initialize only)
    const { data: labp_bidPlaced, isLoading: isFetchingBidPlaced } =
        useMoralisQuery(
        "LogauctionbidplacedLogs",
        (query) =>
            query.equalTo("auction", auctionAddress).descending("createdAt"),
        [],
        { live: true }
        );

        // fetch current auction state from blockchain event listener
        const { data: lar_auctionRecord, isLoading: isFetchingAuctionRecord } = 
            useMoralisQuery(
                "ListAuctionRecords",
                (query) => query.equalTo("auctionAddress", auctionAddress),
                [],
                { live: true }
            );

        // listens to deposit placed activity from blockchain event listener
        const { data: ladp_depositPlaced, isLoading: isFetchingDepositPlaced } =
            useMoralisQuery(
                "LogauctiondepositplacedLogs",
                (query) => query.equalTo("auction", auctionAddress),
                [],
                { live: true}
            )

        // listens to deposit retrieved activity from blockchain event listener
        const { data: ladr_depositRetrieved, isLoading: isFetchingDepositRetrieved } =
        useMoralisQuery(
            "LogauctiondepositretrievedLogs",
            (query) => query.equalTo("auction", auctionAddress),
            [],
            { autoFetch: false }
        )

      const { data: tokenURIData, error: tokenURIError, isLoading: isLoadingTokenURI, fetch: fetchTokenURI } = useMoralisQuery("ListNftRecords");
    /* 
    End Section
    WebSocket
    */

    /* 
    Start Section
    useEffect hook, which triggers, when webSocket push new data
    */
    useEffect(() => {
        if (!isWeb3Enabled) {
          console.log("Web3 is not connected!");
        }
        console.log("Web3 connected");
      }, [MoralisProvider]);

    useEffect(() => {
        console.log("New bid detected");
        // clear bidders
        setBidders([]);
        // get latest bidders
        labp_bidPlaced.map((bids) => {
            const web3 = new Web3(MoralisProvider);
            const _accAddress = web3.utils.toChecksumAddress(bids.attributes.bidder);
            setBidders((prev_bidders) => [...prev_bidders, _accAddress]);
        });
        if (labp_bidPlaced.length > 0) {
          updateBidDetails();
        }
        if (auctionAddress) {
          updateAucDetails();
        }
    }, [labp_bidPlaced]);

    console.log(labp_bidPlaced);

    useEffect(() => {
        console.log("Auction state changed");
        updateAucState();
    }, [lar_auctionRecord]);

    useEffect(() => {
        console.log("Deposit changed");
        updateUserDeposit();
    }, [ladp_depositPlaced, ladr_depositRetrieved]);

    useEffect(() => {
    if (isWeb3Enabled) {
        console.log("account change detected");
        if (labp_bidPlaced.length > 0) {
          updateBidDetails();
        }
        if (auctionAddress) {
          updateAucDetails();
        }
        const web3 = new Web3(MoralisProvider);
        const _accAddress = web3.utils.toChecksumAddress(account);
        setAccAddress(_accAddress);
    }
    }, [isWeb3Enabled, account])

    useEffect(() => {
        console.log("evaluating isDeposited")
        updateUserDeposit()
    }, [accAddress, aucDeposit])

    useEffect(() => {
        updateTokenDetails();
        console.log("updating token details")
    }, [nftAddress])

    useEffect(() => {
      setUniqueBidders(new Set(bidders));
    }, [bidders])

    useEffect(() => {
      console.log("setting tabs...");
      console.log(nftAttributes);
      nftAttributes.length > 0 && setAllTabs(
      [
        { Id: 1, Title: "Attributes", Content: 
          <div style={{ display: 'grid', gap: '20px' }}>
            <section style={{ display: 'flex', gap: '20px' }}>
                <Widget info={nftAttributes[0].value} title={nftAttributes[0].trait_type}/>
                <Widget info={nftAttributes[1].value} title={nftAttributes[1].trait_type}/>
                <Widget info={nftAttributes[2].value} title={nftAttributes[2].trait_type}/>              
            </section>
            <section style={{ display: 'flex', gap: '20px' }}>
            <Widget info={nftAttributes[3].value} title={nftAttributes[3].trait_type}/>
            <Widget info={nftAttributes[4].value} title={nftAttributes[4].trait_type}/>         
            </section>
          </div>},
        { Id: 2, Title: "Bids", Content:
            labp_bidPlaced.map((bid) => {
              return (
                <Info>
                  <BidTitle>Bid Placed<div style={{display:"flex"}}><Eth fontSize='30px' style={{marginLeft: "40px", marginRight: "5px", alignSelf: "center"}}/>{bid.attributes.bidAmount}</div></BidTitle>
                  <EditionEl>From <span style={{marginLeft: "30px", fontWeight: 100, fontSize: "0.9rem"}}>{bid.attributes.bidder}</span></EditionEl>
                </Info>
              );
            })
       },
        { Id: 3, Title: "Ownership", Content: <OwnershipItem nft = {{seller: seller}}/> },
      ]
      );
    }, [seller, nftAttributes, labp_bidPlaced])

    /* 
    End Section
    useEffect hook, which triggers, when webSocket push new data
    */

    
    /*
    Start Section
    Fetch Web3 data
    */
    const { runContractFunction: getTokenId } = useWeb3Contract({
        abi: contractAbi.abi,
        contractAddress: auctionAddress,
        functionName: "tokenId",
    });

    const { runContractFunction: getNftAddress } = useWeb3Contract({
        abi: contractAbi.abi,
        contractAddress: auctionAddress,
        functionName: "nftAddress",
    });

    const { runContractFunction: getBidEndTime } = useWeb3Contract({
        abi: contractAbi.abi,
        contractAddress: auctionAddress,
        functionName: "bidEndTime",
    });

    const { runContractFunction: getHighestBid } = useWeb3Contract({
        abi: contractAbi.abi,
        contractAddress: auctionAddress,
        functionName: "highestBid",
    });

    const { runContractFunction: getHighestBidder } = useWeb3Contract({
        abi: contractAbi.abi,
        contractAddress: auctionAddress,
        functionName: "highestBidder",
    });

    const { runContractFunction: getSeller } = useWeb3Contract({
        abi: contractAbi.abi,
        contractAddress: auctionAddress,
        functionName: "seller",
    });

    const {runContractFunction: getAucState} = useWeb3Contract({
        abi: contractAbi.abi,
        contractAddress: auctionAddress,
        functionName: "currAuctionState"
    })

    const { runContractFunction: getAucDeposit } = useWeb3Contract({
        abi: contractAbi.abi,
        contractAddress: auctionAddress,
        functionName: "depositWei",
    });


    const {runContractFunction: getUserDeposit } = useWeb3Contract({
        abi: contractAbi.abi,
        contractAddress: auctionAddress,
        functionName: "bidderToDeposits",
        params: {
            "": accAddress  },
        })

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi.abi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
        tokenId: tokenId,
        },
    });

    const { runContractFunction: getAuthorityAddress } = useWeb3Contract({
        abi: nftAbi.abi,
        contractAddress: nftAddress,
        functionName: "getAuthorityAddress",
        params: {
        tokenId: tokenId,
        },
    });

    const {runContractFunction: getNftSymbol} = useWeb3Contract({
        abi: nftAbi.abi,
        contractAddress: nftAddress,
        functionName: "symbol",
    })
    /*
    End Section
    Fetch Web3 data
    */


    /*
    Start Section
    utility functions
    */
    function updateAucStateText(_aucState) {
        switch(_aucState) {
            case 0:
                setAucStateText("Auction Registered");
                break;
            case 1:
                setAucStateText("Accepting Bids");
                break;
            default:
                setAucStateText("Bidding Session Ended");
        }
      }
    
    const truncateStr = (fullStr, strLen) => {
      if (fullStr.length <= strLen) return fullStr;
      const separator = "...";
      const charsToShow = strLen - separator.length;
      const frontChars = Math.ceil(charsToShow / 2);
      const backChars = Math.floor(charsToShow / 2);
      return (
        fullStr.substring(0, frontChars) +
        separator +
        fullStr.substring(fullStr.length - backChars)
      );
    };
    /*
    End Section
    utility functions
    */



    /*
    Start Section
    async function for fetching data form blockchain
    */
    // fetch auction data from blockchain
    async function updateAucDetails() {
        // update tokenId
        const _tokenId = await getTokenId();
        _tokenId && setTokenId(_tokenId.toNumber());
        // update nftAddress
        const _nftAddress = await getNftAddress();
        _nftAddress && setNftAddress(_nftAddress);
        // update seller
        const _seller = await getSeller();
        _seller && setSeller(_seller);
        // update aucDeposit
        const _aucDeposit = await getAucDeposit();
        _aucDeposit && setAucDeposit(_aucDeposit);
        // update bidEndTime
        const _bidEndTime = await getBidEndTime();
        if (_bidEndTime) {
        setBidEndTime(_bidEndTime.toNumber() * 1000);
        }
    }

    // fetch auction state from blockchain
    async function updateAucState() {
            // update aucState
            const _aucState = await getAucState();
            setAucState(_aucState);
            if(_aucState !== undefined) {
                updateAucStateText(_aucState);
            }
    }

    // fetch deposit details from blockchain
    async function updateUserDeposit() {
        console.log("updating user deposit")
        const _userDeposit = await getUserDeposit();
        setUserDeposit(_userDeposit)
    }

    // fetch live bdding data from event emitter
    async function updateBidDetails() {
        console.log("updateBidDetails()")
        const _highestBid = labp_bidPlaced[0].attributes.bidAmount;
        setHighestBid(_highestBid);
        const _highestBidder = labp_bidPlaced[0].attributes.bidder;
        setHighestBidder(_highestBidder);
        // get unique bidders
    }

    // parse NFT data from TokenURI and fetch Nft details
    async function updateTokenDetails() {
        /* changed due to moralis migrate */
          // fetch tokenURI from parse server
        console.log("testing testing ruka ruka")
        const centServerUrl = process.env.NEXT_PUBLIC_CENT_SERVER_URL;
        console.log(`trying to fetch with tokenId => ${tokenId}`);
        const ipfsLink = await fetch(`${centServerUrl}/nftTokenUri/${tokenId}`,{
          method: 'GET',
        })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          console.log(`tokenURI fetched from mongoDb => ${data.msg}`);
          return(data.msg);
        })
        /* end change */
        
        if (ipfsLink) {
          console.log("processing ipfs link")
          const requestURL = ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
          const tokenURIResponse = await (await fetch(requestURL)).json();
          setTokenURI(tokenURIResponse);
          const _vehicleName = tokenURIResponse.name;
          setVehicleName(_vehicleName);
          const _imageURI = tokenURIResponse.image;
          const imageURIURL = _imageURI.replace("ifps://", "https://ipfs.io/ipfs/");
          setImageURI(imageURIURL);
          setNftDescription(tokenURIResponse.description);
          setNftAttributes(tokenURIResponse.attributes)
        }
        const _authority = await getAuthorityAddress();
        setAuthority(_authority);
        const _nftSymbol = await getNftSymbol();
        setNftSymbol(_nftSymbol);
    }
    /*
    End Section
    async function for fetching data form blockchain
    */ 


  return (
    <AssetEl>
      <Head>
        <title>HA-P</title>
        <meta name="description" content="Generated by create next app" />
      </Head>
      <SectionContainer>
        <LeftSection>
          <ImageEl>
            <Image
              src={imageURI}
              layout="responsive"
              width="1024px"
              height="840"
            />
          </ImageEl>
          <EditionSelector nft={{tokenId: tokenId}}/>
          <ChainLink>
            Vehicle Inspection Report <Report nft={{tokenId: tokenId}}/>
          </ChainLink>
        </LeftSection>
        <RightSection>
          <AuctionTitle>
            <Title>{vehicleName}</Title>
            <MarketPlace>{nftSymbol}</MarketPlace>
          </AuctionTitle>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <AcOfferLabel>{aucStateText}</AcOfferLabel>
            <TopBtns>
              <LikesBtn>
                <BsFillPersonFill />
                {uniqueBidders.size}
              </LikesBtn>
              <ViewsEl>
                <RiAuctionFill />
                {bidders.length}
              </ViewsEl>
            </TopBtns>
          </div>
          <AuthorContainer>
            <AvatarEl>
                <ENSAvatar
                    address={authority.toLowerCase()}
                    size={50}
                />
            </AvatarEl>
            <AuthorAddress>
              <CreatorLabel>Authorized by</CreatorLabel>
              <UsernameEl>{(authority === undefined) ? "Loading..": truncateStr(authority, 15)}</UsernameEl>
            </AuthorAddress>
          </AuthorContainer>
          <Timer targetDate={bidEndTime}/>
          <Divider />
          <Des>
            {nftDescription}
          </Des>
          <Tabs mt="1rem" data={allTabs} />
        </RightSection>
      </SectionContainer>
      { (true) ? 
        <BidSticky
            auction={{aucAdrres: auctionAddress, aucDeposit: aucDeposit, userDeposit: userDeposit, highestBid: highestBid, highestBidder: highestBidder}}
        /> : ""}
    </AssetEl>
  );
};

export default auctionAddress;
