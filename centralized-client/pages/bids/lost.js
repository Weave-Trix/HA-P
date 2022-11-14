import React, { useState, useEffect } from 'react'
import Web3 from "web3";
import Head from "next/head";
import Link from "next/link";
import { ethers } from "ethers";
import styled from "styled-components";
import { Colors, Devices } from "../../next/Theme";
import { Eth, Reload } from '@web3uikit/icons';
import { ENSAvatar, Tab, TabList, Table, EmptyRowsForSkeletonTable, Button, Loading, useNotification } from "web3uikit";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import RowCard from "../../next/components/Bids/RowCard.js"
import CloseStateTag from "../../next/components/Bids/CloseStateTag.js"
import CompactCountdownTimer from "../../next/components/Timer/CompactCountdownTimer"
import {
    useMoralis,
    useMoralisQuery,
    useMoralisSubscription, 
    MoralisProvider,
    useWeb3ExecuteFunction
  } from "react-moralis";
import auctionAbi from "../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import nftAbi from "../../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json";

const Article = styled.article`
    margin-bottom: 2rem;
    margin-left: 3%;
    margin-right: 3%;
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

/* AuctionStates (group 1 / group 2)
    REGISTERED, (0)
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

// display bid details separated by 2 groups
//  => first group active auctions (bidding, pendingSellerApproval, pendingFullSettlement, pendingAudit)
//  => second group history auctions (closed(closeState))

/*
    1. fetch bid placed, query equalTo account (from moralis database)
    2. for each bid placed, query the current auction status (from smart contract)
    3. if auction_closed, fetch end state
*/

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

const convertIntToDate = (intTime) => {
    return (new Date(intTime));
}

const lost = () => {
    // blockchain connection details
    const web3 = new Web3(MoralisProvider)
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../../ethereum-blockchain/constants/contractAddresses.json")
    const dispatch = useNotification()

    /* useState */
    const [ currAccount, setCurrAccount ] = useState("");
    const [ aucStatus, setAucStatus ] = useState([]);;
    const [ closedAucs, setClosedAucs ] = useState([]);
    const [ closedAucsUI, setClosedAucsUI ] = useState([]);
    const [ closedAucsTable, setClosedAucsTable ] = useState();
    const [ isLoadingClosedAucsTable, setIsLoadingClosedAucsTable ] = useState(true);
    const [ makingPayment, setMakingPayment ] = useState(false);

    console.log(makingPayment)

    // global value
    let payAmount;
    let payAuction;

    // 1. fetch bid placed, query equalTo account (from moralis database)
    const { Moralis, isInitialized, isWeb3Enabled, account, ...rest } = useMoralis();
    const { data: labp_auctions, isLoading, isFetching } = useMoralisQuery(
        "LogAuctionBidPlaced",
        (query) => query.equalTo("bidder", account).descending("createdAt"),
        [account],
        { live: true }
    );

    /* useEffect */
    useEffect(() => {
        if (isWeb3Enabled) {
            const web3 = new Web3(MoralisProvider)
            setCurrAccount(web3.utils.toChecksumAddress(account));
        }
        // start skeleton
        setIsLoadingClosedAucsTable(true);
    }, [account])

    useEffect(() => {
        // 2. for each bid placed, query the current auction status (from smart contract)
        if (labp_auctions.length > 0) {
            updateAucStatus();
        } else {
            setIsLoadingClosedAucsTable(false);
        }
    }, [labp_auctions])

    useEffect(() => {
        // 3. for each status, query relevant details (from smart contract)
        if (aucStatus.length > 0) {
            updateAucDetails();
        }
    }, [aucStatus])

    /* update UI and table for each state */
    // closedAucs
    useEffect(() => {
        setClosedAucsUI([]);
        closedAucs.map((aucs) => {
            setClosedAucsUI((prev_aucs) => [...prev_aucs, [
                <RowCard props={aucs}/>,
                <UserContainer>
                    <ENSAvatar address={aucs.auctionContractAddress} size={30} />
                    <UserAddress>{truncateStr(aucs.auctionContractAddress, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <Eth fontSize='30px' style={{marginRight: "5px"}}/>
                    {aucs.bidAmount}
                </UserContainer>,
                <UserContainer>
                    <Eth fontSize='30px' style={{marginRight: "5px"}}/>
                    {aucs.highestBid}
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
                <span>your-bid</span>,
                <span>winning-bid</span>,
                <span>auction-status</span>
            ]}
            maxPages={5}
            pageSize={5}
            isLoading={isLoadingClosedAucsTable}
        />

        setClosedAucsTable(table);
    }, [closedAucsUI])


    /* async functions */
    const updateAucStatus = async (e) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let temp_aucStatus = [];
        for (let i = 0; i < labp_auctions.length; i++) {
            const auctionContract = new ethers.Contract(labp_auctions[i].attributes.auction, auctionAbi.abi, provider);
            const resAucStatus = await (auctionContract.currAuctionState());
            const aucStatusObj = {...labp_auctions[i].attributes, "status": resAucStatus};
            if (! (temp_aucStatus.find(arr => arr.auction === aucStatusObj.auction))) { // remove duplicate
                temp_aucStatus.push(aucStatusObj);                
            }

        }
        setAucStatus(temp_aucStatus);
    }

    const updateAucDetails = async (e) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        /*
            BIDDING, -> 1 (1)
            VERIFYING_WINNER, -> 1 (2)
            PENDING_PAYMENT, -> 1 (3)
            PENDING_AUDIT, -> 1 (4)
            AUCTION_CLOSED, -> 1 (5)
        */
        let temp_closedAucs = [];

        for (let i = 0; i < aucStatus.length; i++) {
            const auctionContractAddress = aucStatus[i].auction;
            const nftContractAddress = aucStatus[i].nftAddress;
            const auctionContract = new ethers.Contract(auctionContractAddress, auctionAbi.abi, provider);
            const nftContract = new ethers.Contract(nftContractAddress, nftAbi.abi, provider);
            let status = aucStatus[i].status;
            let nftName;
            let nftDescription;
            let nftImage;
            let nftAttributes;
            let bidEndTime;
            let highestBid;
            let highestBidder;
            let endState;
            const tokenId = (await auctionContract.tokenId()).toNumber();
            const seller = await auctionContract.seller();
            const tokenSymbol = (await nftContract.symbol());

            // query generals
            // fetch tokenURI from parse server
            const ListNftRecords = Moralis.Object.extend("ListNftRecords");
            const lnrQuery = new Moralis.Query(ListNftRecords);
            lnrQuery.equalTo("tokenId", String(tokenId));
            const nftRes = await lnrQuery.first();
            const ipfsLink = nftRes.attributes.tokenURI;

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

            if (currAccount === highestBidder) { // skip if you won
                continue;
            }

            const query = new Moralis.Query("LogAuctionBidPlaced");
            query.equalTo("auction", auctionContractAddress);
            query.equalTo("bidder", account);
            query.descending("createdAt");
            const yourBid = await query.first();
            const bidAmount = yourBid.attributes.bidAmount;
            console.log(yourBid.attributes.bidAmount);


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
                "endState": endState,
                "bidAmount": bidAmount
            }

            // query specifics
            switch(status) {
                case 2: // VERIFYING_WINNER
                    console.log("case 2 reached");
                    if (currAccount !== highestBidder) {
                        temp_closedAucs.push(generalDetails)
                    }
                    break;
                case 3: // PENDING PAYMENT
                    console.log("case 3 reached");
                    if (currAccount !== highestBidder) {
                        temp_closedAucs.push(generalDetails)
                    }
                    break;
                case 4: // PENDING_AUDIT
                    console.log("case 4 reached");
                    if (currAccount !== highestBidder) {
                        temp_closedAucs.push(generalDetails)
                    }
                    break;
                case 5: // AUCTION_CLOSED
                    console.log("case 5 reached");
                    if (currAccount !== highestBidder) {
                        temp_closedAucs.push(generalDetails)
                    }
                    break;
                default:
                    console.log("Bad ruka");
            }
        } // end of for loop

        setClosedAucs(temp_closedAucs);

        // stop skeleton
        setIsLoadingClosedAucsTable(false);
    }
    
    return (
        <Article>
            <Head>
                <title>HA-P</title>
                <meta name="description" content="Generated by create next app" />
            </Head>
            <Title>Lost Bids</Title>
            {closedAucsTable}
            <Filler />
        </Article>
    )
}

export default lost