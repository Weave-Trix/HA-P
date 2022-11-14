import React, { useState, useEffect } from 'react'
import Web3 from "web3";
import Head from "next/head";
import Link from "next/link";
import { ethers } from "ethers";
import styled from "styled-components";
import { Colors, Devices } from "../next/Theme";
import { ENSAvatar, Tab, TabList, Table, EmptyRowsForSkeletonTable, Button, Loading, useNotification } from "web3uikit";
import { Reload  } from "@web3uikit/icons"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import RowCard from "../next/components/NFT/RowCard.js"
import {
    useMoralis,
    useMoralisQuery,
    useWeb3ExecuteFunction, 
    MoralisProvider
  } from "react-moralis";
import auctionAbi from "../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import nftAbi from "../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json";

const Article = styled.article`
    margin-bottom: 2rem;
    margin-left: 12%;
    margin-right: 12%;
`;

const Title = styled.h1`
    margin-top: 2.5rem;
    font-size: 2.5rem;
    font-weight: 500;
    color: ${Colors.Primary};
    text-align: center;
    margin-bottom: 5rem;
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

const BtnSpaceFiller = styled.div`
    width: 15px;
`

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

const audits = () => {
    const dispatch = useNotification();
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../ethereum-blockchain/constants/contractAddresses.json")
    const vehicleNftAddress = addressStorage["VehicleNft"][chainId][addressStorage["VehicleNft"][chainId].length-1];

    const { Moralis, isInitialized, isWeb3Enabled, account, ...rest } = useMoralis();

    /* useState */
    const [ currAccount, setCurrAccount ] = useState("");
    const [ pendAuditAucs, setPendAuditAucs ] = useState([]);
    const [ pendAuditAucsUI, setPendAuditAucsUI ] = useState([]);
    const [ pendAuditAucsTable, setPendAuditAucsTable ] = useState([]);
    const [ isLoadingPendAuditAucsTable, setIsLoadingPendAuditAucsTable ] = useState(true);
    const [ verifying, setVerifying ] = useState(false);

    // fetch LAR from moralis server where currState = 4
    const { data: lar_auctions, isLoading, isFetching } = useMoralisQuery(
        "ListAuctionRecords",
        (query) => query.equalTo("currState", 4).descending("createdAt"),
        [],
        { live: true }
    );

    const { data: testData, isLoading: loadingTest, isFetching: fetchingTest } = useMoralisQuery(
        "LognftmintedLogs",
        (query) => query.descending("createdAt"),
        [],
        { live: true }
    );

    console.log(testData);

    /* useEffect */
    useEffect(() => {
        if (isWeb3Enabled) {
            const web3 = new Web3(MoralisProvider)
            setCurrAccount(web3.utils.toChecksumAddress(account));
        }
    }, [account])

    useEffect(() => {
        updateAucDetails();
    }, [lar_auctions])

    /* execute smart contract function */
    const { data : setAuditResultData, error : setAuditResultError, fetch : setAuditResult, isFetching: fetchingSetAuditResult, isLoading : loadingSetAuditResult } = useWeb3ExecuteFunction();

    async function handleSetAuditResultSuccess(tx) {
        // executing
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
            message: `Audit has been submitted`,
            title: "Audit Success",
            position: "topR",
        })
        setVerifying(false);
    }

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
                    <ENSAvatar address={aucs.seller} size={30} />
                    <UserAddress>{(currAccount === aucs.seller) ? "You" : truncateStr(aucs.seller, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <ENSAvatar address={aucs.highestBidder} size={30} />
                    <UserAddress>{(currAccount === aucs.highestBidder) ? "You" : truncateStr(aucs.highestBidder, 15)}</UserAddress>
                </UserContainer>,
                <UserContainer>
                    <Button
                        onClick={() => {
                            const options = {
                                abi: nftAbi.abi,
                                contractAddress: vehicleNftAddress,
                                functionName: "setAuditResult",
                                params: {
                                  _auction: aucs.auctionContractAddress,
                                  _valid: true
                                }
                            }

                            setAuditResult({
                                params: options,
                                onSuccess: (tx) => handleSetAuditResultSuccess(tx),
                                onError: (error) => {
                                    console.log(error);
                                    dispatch({
                                        type: "error",
                                        message: `Unauthorized function access!`,
                                        title: "Unable to Set Audit Result",
                                        position: "topR",
                                    })
                                }
                            })
                        }}
                        customize={{
                            backgroundColor: '#73ffb7',
                            fontSize: 16,
                            onHover: 'darken',
                            textColor: '#ffffff'
                        }}
                        icon={
                            verifying &&
                            <Loading
                            size={12}
                            spinnerColor="#ffffff"
                            spinnerType="wave"
                            />
                        }
                        disabled={verifying}
                        text={verifying ?  "" : "Accept"}
                        theme="custom"
                    />
                    <BtnSpaceFiller />
                    <Button
                       onClick={() => {
                            const options = {
                                abi: nftAbi.abi,
                                contractAddress: vehicleNftAddress,
                                functionName: "setAuditResult",
                                params: {
                                _auction: aucs.auctionContractAddress,
                                _valid: false
                                }
                            }

                            setAuditResult({
                                params: options,
                                onSuccess: (tx) => handleSetAuditResultSuccess(tx),
                                onError: (error) => {
                                    console.log(error);
                                    dispatch({
                                        type: "error",
                                        message: `Unauthorized function access!`,
                                        title: "Unable to Set Audit Result",
                                        position: "topR",
                                    })
                                }
                            })
                        }}
                        customize={{
                            backgroundColor: 'red',
                            fontSize: 16,
                            onHover: 'darken',
                            textColor: '#ffffff'
                        }}
                        icon={
                            verifying &&
                            <Loading
                            size={12}
                            spinnerColor="#ffffff"
                            spinnerType="wave"
                            />
                        }
                        disabled={verifying}
                        text={verifying ?  "" : "Reject"}
                        theme="custom"
                    />
                </UserContainer>
            ]])
        })
    }, [pendAuditAucs, isLoadingPendAuditAucsTable, verifying])

    useEffect(() => {
        const table = <Table
        columnsConfig="2fr 1fr 1fr 1fr 1fr"
        customLoadingContent={<div style={{padding: '2rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '40vh', width: '90%'}}>
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
            <span>owner</span>,
            <span>winner</span>,
            <span>actions</span>
        ]}
        maxPages={5}
        pageSize={5}
        isLoading={isLoadingPendAuditAucsTable}
    />

    setPendAuditAucsTable(table);
    }, [pendAuditAucsUI])

    /* async functions */
    const updateAucDetails = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let temp_pendAuditAucs = [];

        for (let i = 0; i < lar_auctions.length; i++) {
            setIsLoadingPendAuditAucsTable(true);
            const auction = lar_auctions[i].attributes;
            const auctionContractAddress = auction.auctionAddress;
            const nftContractAddress = auction.nftAddress;
            const status = auction.currState;
            const auctionContract = new ethers.Contract(auctionContractAddress, auctionAbi.abi, provider);
            const nftContract = new ethers.Contract(nftContractAddress, nftAbi.abi, provider);
            const web3 = new Web3(MoralisProvider)
            console.log(web3.utils.toChecksumAddress(nftContractAddress));
            console.log(auction.tokenId)
            let nftName;
            let nftDescription;
            let nftImage;
            let nftAttributes;
            let bidEndTime;
            let highestBid;
            let highestBidder;
            const tokenId = auction.tokenId
            const seller = await auctionContract.seller();
            const tokenSymbol = (await nftContract.symbol());

            // fetch tokenURI from parse server
            const ListNftRecords = Moralis.Object.extend("ListNftRecords");
            const lnrQuery = new Moralis.Query(ListNftRecords);
            lnrQuery.equalTo("tokenId", String(tokenId));
            const nftRes = await lnrQuery.first();
            const ipfsLink = nftRes.attributes.tokenURI;

            console.log(ipfsLink);

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
            highestBidder = await auctionContract.highestBidder();

            const aucDetails = {
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
                "seller": seller
            }
            temp_pendAuditAucs.push(aucDetails);
        }
        setPendAuditAucs(temp_pendAuditAucs);
        setIsLoadingPendAuditAucsTable(false);
    }

    return (
        <Article>
            <Head>
                <title>HA-P for Authority</title>
                <meta name="description" content="Generated by create next app" />
            </Head>
            <Title>Pending Audits</Title>
            {pendAuditAucsTable}
        </Article>
    )
}

export default audits