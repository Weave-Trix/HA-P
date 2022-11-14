import React, { useState, useEffect } from 'react'
import Head from "next/head";
import Web3 from "web3";
import Link from "next/link";
import { ethers } from "ethers";
import styled from "styled-components";
import { Colors, Devices } from "../../next/Theme";
import { Eth } from '@web3uikit/icons';
import { ENSAvatar, Tab, TabList, Table, EmptyRowsForSkeletonTable } from "web3uikit";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import RowCard from "../../next/components/Bids/RowCard.js"
import CompactCountdownTimer from "../../next/components/Timer/CompactCountdownTimer"
import {
    useMoralis,
    useMoralisQuery,
    useMoralisSubscription, 
    MoralisProvider
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

const bidding = () => {
    // blockchain connection details
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../../ethereum-blockchain/constants/contractAddresses.json")

    /* useState */
    const [ currAccount, setCurrAccount ] = useState("");
    const [ aucStatus, setAucStatus ] = useState([]);
    const [ bidAucs, setBidAucs ] = useState([]);
    const [ bidAucsUI, setBidAucsUI ] = useState([]);
    const [ bidAucsTable, setBidAucsTable ] = useState();
    const [ isLoadingBidAucsTable, setIsLoadingBidAucsTable ] = useState(true);

    // 1. fetch bid placed, query equalTo account (from moralis database)
    const { Moralis, isInitialized, isWeb3Enabled, account, ...rest } = useMoralis();
    const { data: labp_auctions, isLoading, isFetching } = useMoralisQuery(
        "LogauctionbidplacedLogs",
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
        setIsLoadingBidAucsTable(true);
    }, [account])

    useEffect(() => {
        // 2. for each bid placed, query the current auction status (from smart contract)
        if (labp_auctions.length > 0) {
            updateAucStatus();
        } else {
            setIsLoadingBidAucsTable(false);
        }
    }, [labp_auctions])

    useEffect(() => {
        // 3. for each status, query relevant details (from smart contract)
        if (aucStatus.length > 0) {
            updateAucDetails();
        }
    }, [aucStatus])

    /* update UI and table for each state */
    
    // bidAucs
    useEffect(() => {
        setBidAucsUI([]);
        bidAucs.map((aucs) => {
            setBidAucsUI((prev_aucs) => [...prev_aucs, [
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
                <TimerSection>
                    <CompactCountdownTimer targetDate={aucs.bidEndTime * 1000} />
                </TimerSection>
            ]])
        })
    }, [bidAucs])

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
            data={bidAucsUI}
            header={[
                <span>NFT</span>,
                <span>auction</span>,
                <span>leader</span>,
                <span>highest-bid</span>,
                <span>time-left</span>
            ]}
            maxPages={5}
            pageSize={5}
            isLoading={isLoadingBidAucsTable}
        />

        setBidAucsTable(table);
    }, [bidAucsUI])



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
        let temp_bidAucs = [];
        
        for (let i = 0; i < aucStatus.length; i++) {
            const auctionContractAddress = aucStatus[i].auction;
            const nftContractAddress = aucStatus[i].nftAddress;
            const auctionContract = new ethers.Contract(auctionContractAddress, auctionAbi.abi, provider);
            const nftContract = new ethers.Contract(nftContractAddress, nftAbi.abi, provider);
            let status = aucStatus[i].status;

            if (status !== 1) { // skip if not bidding
                continue;
            }

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
            const tokenSymbol = await nftContract.symbol();

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

            console.log(`End State: ${endState}`)

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

            // query specifics
            switch(status) {
                case 1: // BIDDING
                    console.log("case 1 reached");
                    // query details
                    temp_bidAucs.push(generalDetails);
                    break;
                default:
                    console.log("Bad ruka");
            }
        } // end of for loop

        setBidAucs(temp_bidAucs);

        // stop skeleton
        setIsLoadingBidAucsTable(false);
    }
    
    return (
        <Article>
            <Head>
                <title>HA-P</title>
                <meta name="description" content="Generated by create next app" />
            </Head>
            <Title>Bidding</Title>
            {bidAucsTable}
            <Filler />
        </Article>
    )
}

export default bidding