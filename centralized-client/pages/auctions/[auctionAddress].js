import React from "react";
import styled from "styled-components";
import Image from "next/image";
import Head from "next/head";
import { Colors, Devices } from "../../next/Theme";
import { HiOutlineExternalLink } from "react-icons/hi";
import { AiFillCaretLeft } from "react-icons/ai";
import { IoMdShareAlt } from "react-icons/io";
import { BsHeart, BsFillEyeFill, BsThreeDots } from "react-icons/bs";
import Tab from "../../next/components/styled/Tab.styled";
import Tabs from "../../next/components/styled/Tabs.styled";
import EditionSelector from "../../next/components/Asset/EditionSelector";
import OwnershipItem from "../../next/components/Asset/OwnershipItem";
import BidSticky from "../../next/components/Asset/BidSticky";
import { useRouter } from "next/router";
import {
  getAllAuctionAddress,
  getPostData,
} from "../../next/lib/auctionAddress";
import {
  useMoralis,
  useMoralisQuery,
  useWeb3Contract,
  MoralisProvider,
} from "react-moralis";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { ENSAvatar } from "web3uikit";
import contractAbi from "../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import nftAbi from "../../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json";

const AssetEl = styled.article`
  background-color: ${Colors.White};
  color: ${Colors.Black};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  @media ${Devices.Laptop} {
    padding: 1rem 15%;
  }
`;
const SectionContainer = styled.div`
  display: flex;
  gap: 2rem;
  flex-direction: column;
  @media ${Devices.Laptop} {
    flex-direction: row;
  }
`;

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
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 500;
  align-items: center;
  border: 1px solid ${Colors.Border};
  padding: 1.5rem 1rem;
`;
const RightSection = styled.div`
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
  gap: 1rem;
  align-items: center;
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
const EditionEl = styled.span`
  font-weight: 500;
`;

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

const AllTabs = [
  { Id: 1, Title: "Ownership", Content: <OwnershipItem /> },
  { Id: 2, Title: "History", Content: <Tab /> },
  { Id: 3, Title: "Bids", Content: <Tab /> },
  { Id: 4, Title: "Offers", Content: <Tab /> },
];

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
    const { isWeb3Enabled, account, Moralis } = useMoralis();



    /* 
    Start Section
    WebSocket
    */
    // fetch logBidPlaced from blockchain event listener (initialize only)
    const { data: labp_bidPlaced, isLoading: isFetchingBidPlaced } =
        useMoralisQuery(
        "LogAuctionBidPlaced",
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
                "LogAuctionDeplositPlaced",
                (query) => query.equalTo("auction", auctionAddress),
                [],
                { live: true}
            )

        // listens to deposit retrieved activity from blockchain event listener
        const { data: ladr_depositRetrieved, isLoading: isFetchingDepositRetrieved } =
        useMoralisQuery(
            "LogAuctionDepositRetrieved",
            (query) => query.equalTo("auction", auctionAddress),
            [],
            { live: true}
        )
    /* 
    End Section
    WebSocket
    */



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
    const [highestBid, setHighestBid] = useState("0");
    const [highestBidder, setHighestBidder] = useState("0x0");
    const [bidTimeLeft, setBidLeftTime] = useState(0);
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
    /*
    End Section
    useState hooks
    */


console.log(`HighestBid Ruka :${highestBid}`)
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
        updateAucDetails();
        updateBidDetails();
    }, [labp_bidPlaced]);

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
        console.log("account change detected")
        updateAucDetails()
        updateBidDetails()
        const web3 = new Web3(MoralisProvider)
        const _accAddress = web3.utils.toChecksumAddress(account)
        setAccAddress(_accAddress)
    }
    }, [isWeb3Enabled, account])

    useEffect(() => {
        console.log("evaluating isDeposited")
        updateUserDeposit()
    }, [accAddress, aucDeposit])

    useEffect(() => {
        updateTokenDetails();
    }, [nftAddress])

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
        setTokenId(_tokenId);
        // update nftAddress
        const _nftAddress = await getNftAddress();
        setNftAddress(_nftAddress);
        // update seller
        const _seller = await getSeller();
        setSeller(_seller);
        // update aucDeposit
        const _aucDeposit = await getAucDeposit();
        setAucDeposit(_aucDeposit);
        // update bidEndTime
        const _bidEndTime = await getBidEndTime();
        if (_bidEndTime) {
        setBidLeftTime(_bidEndTime.toNumber() * 1000);
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
        const _highestBid = await getHighestBid();
        setHighestBid(_highestBid);
        const _highestBidder = await getHighestBidder();
        setHighestBidder(_highestBidder);
        // get unique bidders
        setUniqueBidders(new Set(bidders));
    }

    // parse NFT data from TokenURI and fetch Nft details
    async function updateTokenDetails() {
        const ipfsLink = await getTokenURI();
        if (ipfsLink) {
        const requestURL = ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
        const tokenURIResponse = await (await fetch(requestURL)).json();
        setTokenURI(tokenURIResponse);
        const _vehicleName = tokenURIResponse.name;
        setVehicleName(_vehicleName);
        const _imageURI = tokenURIResponse.image;
        const imageURIURL = _imageURI.replace("ifps://", "https://ipfs.io/ipfs/");
        setImageURI(imageURIURL);
        setNftDescription(tokenURIResponse.description);
        console.log(tokenURIResponse);
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
      <Head>NFT ITEM</Head>
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
          <ChainLink>
            View Auction on Etherscan <HiOutlineExternalLink />
          </ChainLink>
        </LeftSection>
        <RightSection>
          <BackBtn>
            <AiFillCaretLeft />
            Back
          </BackBtn>
          <TopBtns>
            <LikesBtn>
              <BsHeart />
              710
            </LikesBtn>
            <ViewsEl>
              <BsFillEyeFill />
              16177
            </ViewsEl>
            <ShareBtn>
              <IoMdShareAlt />
              Share
            </ShareBtn>
            <MoreBtn>
              <BsThreeDots />
            </MoreBtn>
          </TopBtns>
          <AuctionTitle>
            <Title>{vehicleName}</Title>
            <MarketPlace>{nftSymbol}</MarketPlace>
          </AuctionTitle>
          <AcOfferLabel>{aucStateText}</AcOfferLabel>
          <AuthorContainer>
            <AvatarEl>
                <ENSAvatar
                    address={authority}
                    size={50}
                />
            </AvatarEl>
            <AuthorAddress>
              <CreatorLabel>Authorized by</CreatorLabel>
              <UsernameEl>{(authority === undefined) ? "Loading..": truncateStr(authority, 15)}</UsernameEl>
            </AuthorAddress>
          </AuthorContainer>
          <Des>
            {nftDescription}
          </Des>
          <EditionEl>371 Editions Minted</EditionEl>
          <EditionSelector />
          <Tabs mt="1rem" data={AllTabs} />
        </RightSection>
      </SectionContainer>
      { (true) ? 
        <BidSticky
            auction={{aucAdrres: auctionAddress, aucDeposit: aucDeposit, userDeposit: userDeposit, highestBid: highestBid}}
        /> : ""}
    </AssetEl>
  );
};

export default auctionAddress;
