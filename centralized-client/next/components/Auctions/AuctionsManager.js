import React, { useState, useEffect, useReducer } from 'react';
import Web3 from "web3";
import Link from "next/link";
import { ethers } from "ethers";
import styled from "styled-components";
import { Colors, Devices } from "../../../next/Theme";
import { Eth, Reload } from '@web3uikit/icons';
import { ENSAvatar, Tab, TabList, Table, EmptyRowsForSkeletonTable, Button, Loading, useNotification, Modal, Metamask } from "web3uikit";
import Popup from "reactjs-popup"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import RowCard from "../../../next/components/Bids/RowCard.js"
import CloseStateTag from "../../../next/components/Bids/CloseStateTag.js"
import CompactCountdownTimer from "../../../next/components/Timer/CompactCountdownTimer"
import {
    useMoralis,
    useMoralisQuery,
    useMoralisSubscription, 
    MoralisProvider,
    useWeb3ExecuteFunction
  } from "react-moralis";
  import auctionRegistryAbi from "../../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/AuctionRegistry.json";
import auctionAbi from "../../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import nftAbi from "../../../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json";

const Article = styled.article`
    margin-bottom: 2rem;
    margin-top: 1.5rem;
    width: 100%;
`;

const Title = styled.h1`
    margin-top: 2.5rem;
    font-size: 2.5rem;
    font-weight: 500;
    color: ${Colors.Primary};
    text-align: center;
    margin-bottom: 2.5rem;
`;

const Filler = styled.h1`
    margin-top: 2rem;
    padding: 2rem;
    border-top: 1px;
    border-bottom-style: none;
    border-left-style: none;
    border-right-style: none;
    border-top-style: solid;
    border-color: ${Colors.Primary};
`

const UserContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    align-self: center;
`

const UserAddress = styled.div`
    margin-left: 10px;
    display: flex;
    text-align: center;
    justify-content: center;
`

const TimerSection = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.5rem;
    align-self: center;
`

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

const Overlay = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
`

const ModalContent = styled.div`
  margin-top: 70px;
  margin-bottom: 10px;
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const ModalText = styled.h4`
  font-weight: 600;
  margin-right: '1em';
  text-align: center;
  margin-top: 70px;
  width: 60%;
`

/* AuctionStates (group 1 / group 2)
    REGISTERED, -> 0
    BIDDING, -> 1 (1)
    VERIFYING_WINNER, -> 1 (2)
    PENDING_PAYMENT, -> 1 (3)
    PENDING_AUDIT, -> 1 (4)
    AUCTION_CLOSED, -> 1 (5)

    NOT_ENDED, (0)
    CANCELED, -> 2 (1)
    NO_BIDDER, -> 2 (2)
    REJECTED_BY_SELLER, -> 2 (3)
    PAYMENT_OVERDUE, -> 2 (4)
    AUDIT_REJECTED, -> 2 (5)
    OWNERSHIP_TRANSFERRED -> 2 (6)
*/

// display all auctions created by this account (equalTo("seller", thisAccount))
//  => groups according to state (registered, bidding, verifying_winner, pendingFullSettlement, pendingAudit, closed)

/*
    1. fetch auction listings, query equalTo account (from moralis database)
    2. fetch nftDetails (from smart contract) if auction_closed, fetch end state
*/

const AuctionsManager = () => {
    // blockchain connection details
    const web3 = new Web3(MoralisProvider)
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../../../ethereum-blockchain/constants/contractAddresses.json")
    const auctionRegistryAddress = addressStorage["AuctionRegistry"][chainId][addressStorage["AuctionRegistry"][chainId].length-1];
    const dispatch = useNotification()

    // force rerender when account changes
    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

    /* useState */
    const [ currAccount, setCurrAccount ] = useState("");
    const [ aucStatus, setAucStatus ] = useState([]);
    const [ biddingAucs, setBiddingAucs ] = useState([]);
    const [ verWinnerAucs, setVerWinnerAucs ] = useState([]);
    const [ pendPayAucs, setPendPayAucs ] = useState([]);
    const [ pendAuditAucs, setPendAuditAucs ] = useState([]);
    const [ closedAucs, setClosedAucs ] = useState([]);
    const [ biddingAucsUI, setBiddingAucsUI ] = useState([]);
    const [ verWinnerAucsUI, setVerWinnerAucsUI ] = useState([]);
    const [ pendPayAucsUI, setPendPayAucsUI ] = useState([]);
    const [ pendAuditAucsUI, setPendAuditAucsUI ] = useState([]);
    const [ closedAucsUI, setClosedAucsUI ] = useState([]);
    const [ biddingAucsTable, setBiddingAucsTable ] = useState();
    const [ verWinnerAucsTable, setVerWinnerAucsTable ] = useState();
    const [ pendPayAucsTable, setPendPayAucsTable ] = useState();
    const [ pendAuditAucsTable, setPendAuditAucsTable ] = useState();
    const [ closedAucsTable, setClosedAucsTable ] = useState();
    const [ isLoadingBiddingAucsTable, setIsLoadingBiddingAucsTable ] = useState(true);
    const [ isLoadingVerWinnerAucsTable, setIsLoadingVerWinnerAucsTable ] = useState(true);
    const [ isLoadingPendPayAucsTable, setIsLoadingPendPayAucsTable ] = useState(true);
    const [ isLoadingPendAuditAucsTable, setIsLoadingPendAuditAucsTable ] = useState(true);
    const [ isLoadingClosedAucsTable, setIsLoadingClosedAucsTable ] = useState(true);
    const [ verifying, setVerifying ] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [ tempAuctionAddress, setTempAuctionAddress ] = useState("");

    // 1. fetch bid placed, query equalTo account (from moralis database)
    const { Moralis, isInitialized, isWeb3Enabled, account, ...rest } = useMoralis();
    const { data: lar_auctions, isLoading, isFetching } = useMoralisQuery(
        "ListAuctionRecords",
        (query) => query.equalTo("seller", account).descending("createdAt"),
        [account],
        { live: true }
    );

    /* useEffect */
    const closeModal = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        if (isWeb3Enabled) {
            const web3 = new Web3(MoralisProvider)
            setCurrAccount(web3.utils.toChecksumAddress(account));
        }
        // start skeleton
        setIsLoadingBiddingAucsTable(true);
        setIsLoadingVerWinnerAucsTable(true);
        setIsLoadingPendPayAucsTable(true);
        setIsLoadingPendAuditAucsTable(true);
        setIsLoadingClosedAucsTable(true);
    }, [account])

    useEffect(() => {
        updateAucDetails();
    }, [lar_auctions])

    // biddingAucs
    useEffect(() => {
        setBiddingAucsUI([]);
        biddingAucs.map((aucs) => {
            setBiddingAucsUI((prev_aucs) => [...prev_aucs, [
                <RowCard props={aucs}/>,
                <UserContainer>
                    <ENSAvatar address={aucs.auctionContractAddress} size={30} />
                    <UserAddress>{truncateStr(aucs.auctionContractAddress, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <ENSAvatar address={aucs.highestBidder} size={30} />
                    <UserAddress>{(aucs.highestBidder === "0x0000000000000000000000000000000000000000") ? "No Bidder" : truncateStr(aucs.highestBidder, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                <Eth fontSize='30px' style={{marginRight: "5px"}}/>
                    {(aucs.highestBidder === "0x0000000000000000000000000000000000000000") ? "No Bidder" : aucs.highestBid}
                </UserContainer>,
                <TimerSection>
                    <CompactCountdownTimer targetDate={aucs.bidEndTime * 1000} />
                </TimerSection>
            ]])
        })
    }, [biddingAucs])

    useEffect(() => {
        const table = <Table
            columnsConfig="2fr 1fr 1fr 1fr 1.5fr"
            customLoadingContent={<div style={{padding: '2rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '40vh', width: '80vw'}}>
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </div>}
            data={biddingAucsUI}
            header={[
                <span>NFT</span>,
                <span>auction</span>,
                <span>leader</span>,
                <span>highest-bid</span>,
                <span>time-left</span>
            ]}
            maxPages={5}
            pageSize={5}
            isLoading={isLoadingBiddingAucsTable}
        />

        setBiddingAucsTable(table);
    }, [biddingAucsUI])


    // verWinnerAucs
    useEffect(() => {
        setVerWinnerAucsUI([]);
        verWinnerAucs.map((aucs) => {
            console.log(`This auction needs to be verified: ${aucs.auctionContractAddress}`)
            setVerWinnerAucsUI((prev_aucs) => [...prev_aucs, [
                <RowCard props={aucs}/>,
                <UserContainer>
                    <ENSAvatar address={aucs.auctionContractAddress} size={30} />
                    <UserAddress>{truncateStr(aucs.auctionContractAddress, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <ENSAvatar address={aucs.highestBidder} size={30} />
                    <UserAddress>{(currAccount === aucs.highestBidder) ? "You" : truncateStr(aucs.highestBidder, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                <Eth fontSize='30px' style={{marginRight: "5px"}}/>
                    {aucs.highestBid}
                </UserContainer>,
                <UserContainer>
                    <Button
                        onClick={() => {
                            setTempAuctionAddress(aucs.auctionContractAddress);
                            setVerifying(true);
                            setIsOpen(true);
                        }}
                        disabled={verifying}
                        icon={
                            verifying &&
                            <Loading
                              size={12}
                              spinnerColor="#ffffff"
                              spinnerType="wave"
                            />
                          }
                        text={verifying ? "" : "pay"}
                        theme="secondary"
                        color="green"
                        type="submit"
                        size="large"
                    />
                </UserContainer>,
                <TimerSection>
                    <CompactCountdownTimer targetDate={aucs.sellerVerifyTime * 1000} />
                </TimerSection>,
            ]])
        })
    }, [verWinnerAucs])

    useEffect(() => {
        const table = <Table
            columnsConfig="2fr 1fr 1fr 0.8fr 0.8fr 1.5fr"
            customLoadingContent={<div style={{padding: '2rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '40vh', width: '80vw'}}>
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </div>}
            data={verWinnerAucsUI}
            header={[
                <span>NFT</span>,
                <span>auction</span>,
                <span>winner</span>,
                <span>winning-bid</span>,
                <span>verify</span>,
                <span>time-left</span>
            ]}
            maxPages={5}
            pageSize={5}
            isLoading={isLoadingVerWinnerAucsTable}
        />

        setVerWinnerAucsTable(table);
    }, [biddingAucsUI])

    // pendPayAucs
    useEffect(() => {
        setPendPayAucsUI([]);
        // nft
        // auction (with avatar)
        // paymentInfo (highestBid + platformCharge)
        // paymentExpiryTime
        // payment button

        pendPayAucs.map((aucs) => {
            setPendPayAucsUI((prev_aucs) => [...prev_aucs, [
                <RowCard props={aucs}/>,
                <UserContainer>
                    <ENSAvatar address={aucs.aucsContractAddress} size={30} />
                    <UserAddress>{truncateStr(aucs.aucsContractAddress, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <ENSAvatar address={aucs.highestBidder} size={30} />
                    <UserAddress>{(currAccount === aucs.highestBidder) ? "You" : truncateStr(aucs.highestBidder, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                <Eth fontSize='30px' style={{marginRight: "5px"}}/>
                    {aucs.platformCharge + aucs.highestBid}
                </UserContainer>,
                <TimerSection>
                    <CompactCountdownTimer targetDate={aucs.paymentExpiryTime * 1000} />
                </TimerSection>
            ]])
        })
    }, [pendPayAucs])

    useEffect (() => {
        const table = <Table
            columnsConfig="2fr 1fr 1fr 1fr 1.5fr"
            customLoadingContent={<div style={{padding: '2rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '40vh', width: '80vw'}}>
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </div>}
            data={pendPayAucsUI}
            header={[
                <span>NFT</span>,
                <span>auction</span>,
                <span>winner</span>,
                <span>amount</span>,
                <span>payment expires in</span>
            ]}
            maxPages={5}
            pageSize={5}
            isLoading={isLoadingPendPayAucsTable}
        />

        setPendPayAucsTable(table);
    }, [pendPayAucsUI])

    // pendAuditAucs
    useEffect(() => {
        setPendAuditAucsUI([]);
        pendAuditAucs.map((aucs) => {
            setPendAuditAucsUI((prev_aucs) => [...prev_aucs, [
                <RowCard props={aucs}/>,
                <UserContainer>
                    <ENSAvatar address={aucs.auctionContractAddress} size={30} />
                    <UserAddress>{truncateStr(aucs.auctionContractAddress, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <ENSAvatar address={aucs.authority} size={30} />
                    <UserAddress>{(currAccount === aucs.authority) ? "You" : truncateStr(aucs.authority, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <ENSAvatar address={aucs.seller} size={30} />
                    <UserAddress>{(account === aucs.seller) ? "You" : truncateStr(aucs.seller, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <ENSAvatar address={aucs.highestBidder} size={30} />
                    <UserAddress>{(currAccount === aucs.highestBidder) ? "You" : truncateStr(aucs.highestBidder, 15)}</UserAddress>
                </UserContainer>
            ]])
        })
    }, [pendAuditAucs])

    useEffect (() => {
        const table = <Table
            columnsConfig="2fr 1fr 1fr 1fr 1fr"
            customLoadingContent={<div style={{padding: '2rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '40vh', width: '80vw'}}>
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </div>}
            data={pendAuditAucsUI}
            header={[
                <span>NFT</span>,
                <span>auction</span>,
                <span>authority</span>,
                <span>from</span>,
                <span>to</span>
            ]}
            maxPages={5}
            pageSize={5}
            isLoading={isLoadingPendAuditAucsTable}
        />

        setPendAuditAucsTable(table);
    }, [pendAuditAucsUI])

    // closedAucs
    useEffect(() => {
        setClosedAucsUI([]);
        closedAucs.map((aucs) => {
            setClosedAucsUI((prev_aucs) => [...prev_aucs, [
                <RowCard props={aucs}/>,
                <UserContainer>
                    <ENSAvatar address={aucs.auctionContractAddress} size={30} />
                    <UserAddress>{(currAccount === aucs.auctionContractAddress) ? "You" : truncateStr(aucs.seller, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <Eth fontSize='30px' style={{marginRight: "5px"}}/>
                        {aucs.highestBid}
                </UserContainer>,
                <UserContainer>
                    <ENSAvatar address={aucs.currOwner} size={30} />
                    <UserAddress>{(currAccount === aucs.currOwner) ? "You" : truncateStr(aucs.currOwner, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <CloseStateTag props={aucs.endState}/>
                </UserContainer>
            ]])
        })
    }, [closedAucs])

    useEffect (() => {
        const table = <Table
            columnsConfig="2fr 1fr 1fr 1fr 1.5fr"
            customLoadingContent={<div style={{padding: '2rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '40vh', width: '80vw'}}>
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </div>}
            data={closedAucsUI}
            header={[
                <span>NFT</span>,
                <span>auction</span>,
                <span>winning bid</span>,
                <span>current owner</span>,
                <span>closing status</span>
            ]}
            maxPages={5}
            pageSize={5}
            isLoading={isLoadingClosedAucsTable}
        />

        setClosedAucsTable(table);
    }, [closedAucsUI])


    /* async functions */
    const updateAucDetails = async (e) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let temp_biddingAucs = [];
        let temp_verWinnerAucs = [];
        let temp_pendPayAucs = [];
        let temp_pendAuditAucs = [];
        let temp_closedAucs = [];

        for (let i = 0; i < lar_auctions.length; i++) {
            const auctionObj = lar_auctions[i].attributes;
            const auctionContractAddress = web3.utils.toChecksumAddress(auctionObj.auctionAddress);
            const nftContractAddress = web3.utils.toChecksumAddress(auctionObj.nftAddress);
            const auctionContract = new ethers.Contract(auctionContractAddress, auctionAbi.abi, provider);
            const nftContract = new ethers.Contract(nftContractAddress, nftAbi.abi, provider);
            let nftName;
            let nftDescription;
            let nftImage;
            let nftAttributes;
            let bidEndTime;
            let highestBid;
            let highestBidder;
            let endState;
            const status = auctionObj.currState;
            const tokenId = auctionObj.tokenId;
            const seller = auctionObj.seller;
            const tokenSymbol = await nftContract.symbol();

            // query generals
            const ipfsLink = await nftContract.tokenURI(tokenId);
            if(ipfsLink) {
                const requestURL = ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
                const tokenURI = await (await fetch(requestURL)).json();
                nftName = tokenURI.name;
                nftDescription = tokenURI.description;
                nftAttributes = tokenURI.attributes
                nftImage = tokenURI.image.replace("ifps://", "https://ipfs.io/ipfs/");
            }

            bidEndTime = (await auctionContract.bidEndTime()).toNumber();
            highestBid = (await auctionContract.highestBid()).toNumber();
            endState = await auctionContract.auctionEndState();
            highestBidder = await auctionContract.highestBidder();

            const generalDetails = {
                "auctionContractAddress": auctionContractAddress,
                "nftContractAddress": nftContractAddress,
                "status": status,
                "tokenSymbol": tokenSymbol,
                "tokenId": tokenId,
                "nftName": nftName,
                "nftDescription": nftDescription,
                "nftImage": nftImage,
                "nftAttributes": nftAttributes,
                "bidEndTime": bidEndTime,
                "highestBid": highestBid,
                "highestBidder": highestBidder,
                "seller": seller,
                "endState": endState
            }

            // query general
            switch (auctionObj.currState) {
                case 1:
                    console.log("case 1 reached");
                    temp_biddingAucs.push(generalDetails);
                    break;
                case 2:
                    console.log("case 2 reached");
                    // query details
                    const sellerVerifyTime = await auctionContract.verify_expiryTime();
                    temp_verWinnerAucs.push({...generalDetails, "sellerVerifyTime": sellerVerifyTime});
                    break;
                case 3:
                    console.log("case 3 reached");
                    // query details
                    const paymentExpiryTime = await auctionContract.payment_expiryTime();
                    temp_pendPayAucs.push({...generalDetails, "paymentExpiryTime": paymentExpiryTime});
                    break;
                case 4:
                    console.log("case 4 reached");
                    //query details
                    const authority = await nftContract.getAuthorityAddress();
                    temp_pendAuditAucs.push({...generalDetails, "authority": authority});
                    break;
                case 5:
                    console.log("case 5 reached");
                    // query details
                    const currOwner = await nftContract.ownerOf(tokenId);
                    temp_closedAucs.push({...generalDetails, "currOwner": currOwner})
                    break;
                default:
                    console.log("bad ruka");
            }

            // stop skeleton
            if (i === (lar_auctions.length - 1)) {
                setIsLoadingBiddingAucsTable(false);
                setIsLoadingVerWinnerAucsTable(false);
                setIsLoadingPendPayAucsTable(false);
                setIsLoadingPendAuditAucsTable(false);
                setIsLoadingClosedAucsTable(false);
            }
        } // end of for loop
        setBiddingAucs(temp_biddingAucs);
        setVerWinnerAucs(temp_verWinnerAucs);
        setPendPayAucs(temp_pendPayAucs);
        setPendAuditAucs(temp_pendAuditAucs);
        setClosedAucs(temp_closedAucs);
    }

    const { data : verifyResultData, error : verifyResultError, fetch : verifyResultFetch, isFetching: verifyResultFetching, isLoading : verifyResultLoading } = useWeb3ExecuteFunction()

    async function verifyResult(_result) {
        console.log(`Verifying result: ${_result}`)
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log(tempAuctionAddress);
        const options = {
            abi: auctionAbi.abi,
            contractAddress: tempAuctionAddress,
            functionName: "verifyWinner",
            params: {
              approveWinningBid: _result
            }
        }
        verifyResultFetch({
            params: options,
            onSuccess: (tx) => handleVerifyResultSuccess(tx),
            onError: (error) => console.log(error)
        })
        closeModal();
    }

    async function handleVerifyResultSuccess(tx) {
        // creating
        setVerifying(true);
        dispatch({
            type: "info",
            icon: <Reload fontSize='50px'/>,
            message: "Please wait while your transaction is being mined on Ethereum blockchain",
            title: "Pending transaction...",
            position: "topR",
          })
        await tx.wait(1);
        // created
        dispatch({
            type: "success",
            message: `Verify Auction Result's transaction has been processed`,
            title: "Auction Started",
            position: "topR",
        })
        setVerifying(false);
    }

    return (
        <Article>
            <TabList
            defaultActiveKey={1}
            onChange={function noRefCheck(){}}
            tabStyle="bulbUnion"
            isWidthAuto
            >
                <Tab
                    tabKey={1}
                    tabName="Bidding"
                >
                    {biddingAucsTable}
                </Tab>
                <Tab
                    tabKey={2}
                    tabName="Pending Verification"
                >
                    {verWinnerAucsTable}
                </Tab>
                <Tab
                    tabKey={3}
                    tabName="Awaiting Winner's Payment"
                >
                    {pendPayAucsTable}
                </Tab>
                <Tab
                    tabKey={4}
                    tabName="Awaiting Ownership Transfer"
                >
                    {pendAuditAucsTable}
                </Tab>
                <Tab
                    tabKey={5}
                    tabName="Completed"
                >
                    {closedAucsTable}
                </Tab>
            </TabList>
            <Popup open={isOpen} closeOnDocumentClick onClose={closeModal} position="right center">
                <Overlay
                    style={{
                    height: '100vh',
                    transform: 'scale(1)',
                    }}>
                    <div>
                    <Modal
                        className="close"
                        cancelText="Reject Auction's Result"
                        id="v-center"
                        isCentered
                        okText="Accept Auction's Result"
                        onCancel={() => verifyResult(false)}
                        onCloseButtonPressed={() => closeModal()}
                        onOk={() => verifyResult(true)}
                        title="Start Auction"
                    >
                    <ModalContent>
                        <Metamask fontSize='150px'/>
                        <ModalText>
                        In the case of rejecting auctoin's result, seller's payment will be fully refunded along with the deposit, and no penalty will be incurred to any party.
                        </ModalText>
                    </ModalContent>
                    </Modal>
                    </div>
                </Overlay>
            </Popup>
        </Article>
    )
}

export default AuctionsManager