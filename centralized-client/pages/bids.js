import React, { useState, useEffect } from 'react'
import Web3 from "web3";
import Link from "next/link";
import { ethers } from "ethers";
import styled from "styled-components";
import { Colors, Devices } from "../next/Theme";
import { Eth } from '@web3uikit/icons';
import { ENSAvatar, Tab, TabList, Table } from "web3uikit";
import RowCard from "../next/components/Bids/RowCard.js"
import CompactCountdownTimer from "../next/components/Timer/CompactCountdownTimer"
import {
    useMoralis,
    useMoralisQuery,
    useMoralisSubscription, 
    MoralisProvider
  } from "react-moralis";
import auctionAbi from "../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import nftAbi from "../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json";

const Article = styled.article`
    margin-top: 3rem;
    margin-bottom: 2rem;
    margin-left: 3%;
    margin-right: 3%;
`;

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

const bids = () => {
    // blockchain connection details
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../ethereum-blockchain/constants/contractAddresses.json")

    /* useState */
    const [ currAccount, setCurrAccount ] = useState("");
    const [ aucStatus, setAucStatus ] = useState([]);
    const [ bidAucs, setBidAucs ] = useState([]);
    const [ verWinnerAucs, setVerWinnerAucs ] = useState([]);
    const [ pendPayAucs, setPendPayAucs ] = useState([]);
    const [ pendAuditAucs, setPendAuditAucs ] = useState([]);
    const [ closedAucs, setClosedAucs ] = useState([]);
    const [ bidAucsUI, setBidAucsUI ] = useState([]);
    const [ verWinnerAucsUI, setVerWinnerAucsUI ] = useState([]);
    const [ pendPayAucsUI, setPendPayAucsUI ] = useState([]);
    const [ pendAuditAucsUI, setPendAuditAucsUI ] = useState([]);
    const [ closedAucsUI, setClosedAucsUI ] = useState([]);

    // 1. fetch bid placed, query equalTo account (from moralis database)
    const { Moralis, isInitialized, isWeb3Enabled, account, ...rest } = useMoralis();
    const { data: labp_auctions, isLoading: isFetchingAddress } = useMoralisQuery(
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
    }, [account])

    useEffect(() => {
        // 2. for each bid placed, query the current auction status (from smart contract)
        if (labp_auctions.length > 0) {
            updateAucStatus();
        }
    }, [labp_auctions])
    useEffect(() => {
        // 3. for each status, query relevant details (from smart contract)
        if (aucStatus.length > 0) {
            updateAucDetails();
        }
    }, [aucStatus])

    // update UI for each state
    useEffect(() => {
        bidAucs.map((aucs) => {
            setBidAucsUI((prev_aucs) => [...prev_aucs, [
                <RowCard props={aucs}/>,
                <UserContainer>
                    <ENSAvatar address={aucs.seller} size={30} />
                    <UserAddress>{truncateStr(aucs.seller, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <ENSAvatar address={aucs.highestBidder} size={30} />
                    <UserAddress>{truncateStr(aucs.highestBidder, 15)}</UserAddress>
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

    useEffect(() => {
        verWinnerAucs.map((auc) => {
            console.log(auc)
        })
    }, [verWinnerAucs])

    useEffect(() => {
        pendPayAucs.map((auc) => {
            console.log(auc)
        })
    }, [pendPayAucs])

    useEffect(() => {
        pendAuditAucs.map((auc) => {
            console.log(auc)
        })
    }, [pendAuditAucs])

    useEffect(() => {
        closedAucs.map((auc) => {
            console.log(auc)
        })
    }, [closedAucs])

    const updateAucStatus = async (e) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let temp_aucStatus = [];
        for (let i = 0; i < labp_auctions.length; i++) {
            const auctionContract = new ethers.Contract(labp_auctions[i].attributes.auction, auctionAbi.abi, provider);
            const resAucStatus = await (auctionContract.currAuctionState());
            const aucStatusObj = {"auction": labp_auctions[i].attributes.auction, "status": resAucStatus};
            if (! (temp_aucStatus.find(arr => arr.auction === aucStatusObj.auction))) { // remove duplicate
                temp_aucStatus.push(aucStatusObj);                
            }

        }
        setAucStatus(temp_aucStatus);
    }

    console.log(aucStatus);

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
        let temp_verWinnerAucs = [];
        let temp_pendPayAucs = [];
        let temp_pendAuditAucs = [];
        let temp_closedAucs = [];
        for (let i = 0; i < aucStatus.length; i++) {
            const auctionContractAddress = labp_auctions[i].attributes.auction;
            const nftContractAddress = labp_auctions[i].attributes.nftAddress
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
                case 2: // VERIFYING_WINNER
                    console.log("case 2 reached");
                    // query details
                    const sellerVerifyTime = await auctionContract.verify_expiryTime();

                    if (currAccount === highestBidder) {
                        temp_verWinnerAucs.push({
                            ...generalDetails,
                            "sellerVerifyTime": sellerVerifyTime
                        })
                    } else {
                        temp_closedAucs.push(generalDetails)
                    }
                    break;
                case 3: // PENDING PAYMENT
                    console.log("case 3 reached");
                    // query details
                    const platformCharge = await auctionContract.platformCharge();
                    const paymentExpiryTime = await auctionContract.payment_expiryTime();

                    if (currAccount === highestBidder) {
                        temp_pendPayAucs.push({
                            ...generalDetails,
                            "platformCharge": platformCharge,
                            "paymentExpiryTime": paymentExpiryTime,
                        })
                    } else {
                        temp_closedAucs.push(generalDetails);
                    }
                    break;
                case 4: // PENDING_AUDIT
                    console.log("case 4 reached");
                    //query details
                    const authority = await nftContract.getAuthorityAddress();

                    if (currAccount === highestBidder) {
                        temp_pendAuditAucs.push({
                            ...generalDetails,
                            "authority": authority
                        })
                    } else {
                        temp_closedAucs.push(generalDetails);
                    }
                    break;
                case 5: // AUCTION_CLOSED
                    console.log("case 5 reached");
                    // query details
                    temp_closedAucs.push(generalDetails)
                    break;
                default:
                    console.log("Bad ruka");
            }
        } // end of for loop

        setBidAucs(temp_bidAucs);
        setVerWinnerAucs(temp_verWinnerAucs);
        setPendPayAucs(temp_pendPayAucs);
        setPendAuditAucs(temp_pendAuditAucs);
        setClosedAucs(temp_closedAucs);
    }
    
    return (
        <Article>
            <TabList
                defaultActiveKey={1}
                onChange={function noRefCheck(){}}
                tabStyle="bulbUnion"
                >
                <Tab
                    tabKey={1}
                    tabName="Bidding"
                >
                    <div>
                        <Table
                        columnsConfig="2fr 1fr 1fr 1fr 1.5fr"
                        data={bidAucsUI}
                        header={[
                            <span>NFT</span>,
                            <span>seller</span>,
                            <span>leader</span>,
                            <span>highest-bid</span>,
                            <span>time-left</span>
                        ]}
                        maxPages={5}
                        pageSize={5}
                        />
                    </div>
                </Tab>
                <Tab
                    tabKey={2}
                    tabName="Verifying Winner"
                >
                    <div>
                    This is Card 2
                    </div>
                </Tab>
                <Tab
                    tabKey={3}
                    tabName="Pending Payment"
                >
                    <div>
                    This is Card 3
                    </div>
                </Tab>
                <Tab
                    tabKey={4}
                    tabName="Pending Audit"
                >
                    <div>
                    This is Card 4
                    </div>
                </Tab>
                </TabList>
        </Article>
    )
}

export default bids