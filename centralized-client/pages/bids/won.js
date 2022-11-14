import React, { useState, useEffect } from 'react';
import Web3 from "web3";
import Link from "next/link";
import { ethers } from "ethers";
import Head from "next/head";
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
    if (!fullStr) {
        return ("None");
    }
    console.log(`truncating string: ${fullStr}`);
    if (fullStr && fullStr.length <= strLen) return fullStr;
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

const won = () => {
    // blockchain connection details
    const web3 = new Web3(MoralisProvider)
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../../ethereum-blockchain/constants/contractAddresses.json")
    const dispatch = useNotification()

    /* useState */
    const [ currAccount, setCurrAccount ] = useState("");
    const [ aucStatus, setAucStatus ] = useState([]);
    const [ verWinnerAucs, setVerWinnerAucs ] = useState([]);
    const [ pendPayAucs, setPendPayAucs ] = useState([]);
    const [ pendAuditAucs, setPendAuditAucs ] = useState([]);
    const [ closedAucs, setClosedAucs ] = useState([]);
    const [ verWinnerAucsUI, setVerWinnerAucsUI ] = useState([]);
    const [ pendPayAucsUI, setPendPayAucsUI ] = useState([]);
    const [ pendAuditAucsUI, setPendAuditAucsUI ] = useState([]);
    const [ closedAucsUI, setClosedAucsUI ] = useState([]);
    const [ verWinnerAucsTable, setVerWinnerAucsTable ] = useState();
    const [ pendPayAucsTable, setPendPayAucsTable ] = useState();
    const [ pendAuditAucsTable, setPendAuditAucsTable ] = useState();
    const [ closedAucsTable, setClosedAucsTable ] = useState();
    const [ isLoadingVerWinnerAucsTable, setIsLoadingVerWinnerAucsTable ] = useState(true);
    const [ isLoadingPendPayAucsTable, setIsLoadingPendPayAucsTable ] = useState(true);
    const [ isLoadingPendAuditAucsTable, setIsLoadingPendAuditAucsTable ] = useState(true);
    const [ isLoadingClosedAucsTable, setIsLoadingClosedAucsTable ] = useState(true);
    const [ makingPayment, setMakingPayment ] = useState(false);


    // global value
    let payAmount;
    let payAuction;

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
        setIsLoadingVerWinnerAucsTable(true);
        setIsLoadingPendPayAucsTable(true);
        setIsLoadingPendAuditAucsTable(true);
        setIsLoadingClosedAucsTable(true);
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

    /* update UI and table for each state */

    // verWinnerAucs
    useEffect(() => {
        setVerWinnerAucsUI([]);
        verWinnerAucs.map((aucs) => {
            console.log(`This auction needs to be verified: ${aucs.auctionContractAddress}`)
            setVerWinnerAucsUI((prev_aucs) => [...prev_aucs, [
                <RowCard props={aucs} />,
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
                    <CompactCountdownTimer targetDate={aucs.sellerVerifyTime * 1000} />
                </TimerSection>
            ]])
        })
    }, [verWinnerAucs])

    useEffect (() => {
        const table = <Table
            columnsConfig="2fr 1fr 1fr 1fr 1.5fr"
            customLoadingContent={<div style={{padding: '2rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '40vh', width: '90%'}}>
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
                <span>time-left</span>
            ]}
            maxPages={5}
            pageSize={5}
            isLoading={isLoadingVerWinnerAucsTable}
        />

        setVerWinnerAucsTable(table);
    }, [verWinnerAucsUI])

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
                    <ENSAvatar address={aucs.auctionContractAddress} size={30} />
                    <UserAddress>{truncateStr(aucs.auctionContractAddress, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                <Eth fontSize='30px' style={{marginRight: "5px"}}/>
                    {aucs.platformCharge + aucs.highestBid}
                </UserContainer>,
                <UserContainer>
                    <Button
                        onClick={() => {
                            setMakingPayment(true);
                            payAmount = aucs.platformCharge + aucs.highestBid;
                            payAuction = aucs.auctionContractAddress;
                            console.log(aucs);
                            console.log(`paying : ${payAmount}`);
                            console.log(`paying to: ${payAuction}`)
                            payFullSettlement();
                        }}
                        disabled={makingPayment || isFetchingPay}
                        text={(makingPayment || isFetchingPay) ? "Mining Transaction" : "Pay Full Settlement"}
                        theme="secondary"
                        color="green"
                        type="submit"
                        size="large"
                    />
                </UserContainer>,
                <TimerSection>
                    <CompactCountdownTimer targetDate={aucs.paymentExpiryTime * 1000} />
                </TimerSection>
            ]])
        })
    }, [pendPayAucs, makingPayment])

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
                <span>amount</span>,
                <span>pay</span>,
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
            console.log(`Pending Audit Aucs => ${aucs.auctionContractAddress}`)
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
                    <UserAddress>{(currAccount === aucs.seller) ? "You" : truncateStr(aucs.seller, 15)}</UserAddress>
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


    /* smart contract interaction */
    const { data: dataPay, error: errorPay, fetch: fetchPay, isLoading: isLoadingPay, isFetching: isFetchingPay, } = useWeb3ExecuteFunction({
        abi: auctionAbi.abi,
        contractAddress: payAuction,
        functionName: "payFullSettlement",
        msgValue: payAmount,
    })

    const test = () => {
        console.log("paying");
        console.log(auctionAbi.abi);
        console.log(payAuction);
        console.log(payAmount);
        fetchPay();
    }

    const payFullSettlement = async (e) => {
        setMakingPayment(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        if (provider) {
            let signer = provider.getSigner(0);
            const auction = new ethers.Contract(payAuction, auctionAbi.abi, provider);
            let contractAsSigner = auction.connect(signer);
            console.log(provider)
            try {
                // retrieving
                dispatch({
                    type: "info",
                    icon: <Reload fontSize='50px'/>,
                    message: "Please wait while your transaction is being mined on Ethereum blockchain",
                    title: "Pending transaction...",
                    position: "topR",
                  })
                const payFullSettlementRes = await contractAsSigner.payFullSettlement({value: payAmount});
                const txReceipt = await payFullSettlementRes.wait(1);
                updateAucStatus()
                console.log(txReceipt);

                // retrieved
                dispatch({
                    type: "success",
                    message: `Payment succesful, paid ${payAmount} as full settlement for auction ${payAuction}`,
                    title: "Earnings Retrieved",
                    position: "topR",
                })
                setMakingPayment(false);
            } catch (err) {
                console.log("error making payment");
                console.log(err.errorName);
                setMakingPayment(false);
            }
            payAmount = 0;
            payAuction = 0;
        }
    }

    /* async functions */
    const updateAucStatus = async (e) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let temp_aucStatus = [];
        for (let i = 0; i < labp_auctions.length; i++) {
            const auctionContract = new ethers.Contract(labp_auctions[i].attributes.auction, auctionAbi.abi, provider);
            const resAucStatus = await (auctionContract.currAuctionState());
            if (resAucStatus === 3) {
                console.log(`Catched pendPayAucs from labp, ${labp_auctions[i].attributes.auction}`);
            }
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
        let temp_verWinnerAucs = [];
        let temp_pendPayAucs = [];
        let temp_pendAuditAucs = [];
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
                console.log(nftImage);
            }

            bidEndTime = (await auctionContract.bidEndTime()).toNumber();
            highestBid = (await auctionContract.highestBid()).toNumber();
            endState = await auctionContract.auctionEndState();
            highestBidder = await auctionContract.highestBidder();

            if (currAccount !== highestBidder) { // skip if you lost
                continue;
            }

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
                case 2: // VERIFYING_WINNER
                    console.log("case 2 reached");
                    // query details
                    const sellerVerifyTime = await auctionContract.verify_expiryTime();

                    if (currAccount === highestBidder) {
                        temp_verWinnerAucs.push({
                            ...generalDetails,
                            "sellerVerifyTime": sellerVerifyTime
                        })
                    }
                    break;
                case 3: // PENDING PAYMENT
                    console.log("case 3 reached");
                    // query details
                    const platformCharge = await auctionContract.platformCharge();
                    console.log(`Setting platformCharge: ${Number(platformCharge)}`)
                    const paymentExpiryTime = await auctionContract.payment_expiryTime();

                    if (currAccount === highestBidder) {
                        temp_pendPayAucs.push({
                            ...generalDetails,
                            "platformCharge": Number(platformCharge),
                            "paymentExpiryTime": paymentExpiryTime,
                        })
                    }
                    console.log("=> Setting pendPayAucs")
                    console.log(generalDetails);
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
                    }
                    break;
                case 5: // AUCTION_CLOSED
                    console.log("case 5 reached");
                    // query details
                    // fetch tokenURI from parse server
                    const ListNftRecords = Moralis.Object.extend("ListNftRecords");
                    const lnrQuery = new Moralis.Query(ListNftRecords);
                    lnrQuery.equalTo("tokenId", String(tokenId));
                    const nftRes = await lnrQuery.first();
                    const currOwner = nftRes.attributes.owner;

                    if (currAccount === highestBidder) {
                        temp_closedAucs.push({
                            ...generalDetails,
                            "currOwner": currOwner
                        })
                    }
                    break;
                default:
                    console.log("Bad ruka");
            }
        } // end of for loop

        setVerWinnerAucs(temp_verWinnerAucs);
        setPendPayAucs(temp_pendPayAucs);
        setPendAuditAucs(temp_pendAuditAucs);
        setClosedAucs(temp_closedAucs);

        // stop skeleton
        setIsLoadingVerWinnerAucsTable(false);
        setIsLoadingPendPayAucsTable(false);
        setIsLoadingPendAuditAucsTable(false);
        setIsLoadingClosedAucsTable(false);
    }
    
    return (
        <Article>
            <Head>
                <title>HA-P</title>
                <meta name="description" content="Generated by create next app" />
            </Head>
            <Title>Won Bids</Title>
            <TabList
                defaultActiveKey={1}
                onChange={function noRefCheck(){}}
                tabStyle="bulbUnion"
                isWidthAuto
                >
                <Tab
                    tabKey={1}
                    tabName="Waiting for Verification"
                >
                    {verWinnerAucsTable}
                </Tab>
                <Tab
                    tabKey={2}
                    tabName="Pending Payment (action required)"
                >
                    {pendPayAucsTable}
                </Tab>
                <Tab
                    tabKey={3}
                    tabName="Awaiting Ownership Transfer"
                >
                    {pendAuditAucsTable}
                </Tab>
                <Tab
                    tabKey={4}
                    tabName="Completed"
                >
                    {closedAucsTable}
                </Tab>
            </TabList>
            <Filler />
        </Article>
    )
}

export default won