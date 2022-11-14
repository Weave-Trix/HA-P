import React, { useState, useEffect } from 'react';
import Web3 from "web3";
import Head from "next/head";
import { ethers } from "ethers";
import styled from "styled-components";
import {
    useMoralis,
    useMoralisQuery,
    MoralisProvider,
    useWeb3ExecuteFunction
  } from "react-moralis";
  import { Eth, Reload } from '@web3uikit/icons';
  import { ENSAvatar, Tab, TabList, Table, EmptyRowsForSkeletonTable, Button, Loading, useNotification } from "web3uikit";
  import 'react-loading-skeleton/dist/skeleton.css'
  import Skeleton from 'react-loading-skeleton'
  import { Colors } from "../next/Theme";
  import CloseStateTag from "../next/components/Bids/CloseStateTag.js";
  import ButtonLoading from "../next/components/styled/ButtonLoading.styled.js";
  import RowCard from "../next/components/Bids/RowCard.js";
  import auctionAbi from "../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import nftAbi from "../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json";

const Article = styled.article`
    margin-bottom: 2rem;
    margin-left: 15%;
    margin-right: 15%;
`;

const Title = styled.h1`
    margin-top: 2.5rem;
    font-size: 2.5rem;
    font-weight: 500;
    color: ${Colors.Primary};
    text-align: center;
`;

const Subtitle = styled.h1`
    margin-top: 4rem;
    margin-bottom: 2rem;
    font-size: 1.5rem;
    font-weight: 500;
    color: ${Colors.White};
    text-align: center;
`;

const TableItem = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    align-self: center;
`

const AccAddress = styled.div`
    margin-left: 10px;
    display: flex;
    text-align: center;
    justify-content: center;
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

export default function wallet() {
    const dispatch = useNotification();
    /* useState */
    const { Moralis, isInitialized, isWeb3Enabled, account, ...rest } = useMoralis();
    const [ currAccount, setCurrAccount ] = useState("");
    const [ pendRefundAucs, setPendRefundAucs ] = useState([]);
    const [ pendRetrieveAucs, setPendRetrieveAucs ] = useState([]);
    const [ pendTransactions, setPendTransactions ] = useState([]);
    const [ pendTransactionsUI, setPendTransactionsUI ] = useState();
    const [ pendTransactionsTable, setPendTransactionsTable ] = useState();
    const [ retrieving, setRetrieving ] = useState(false);
    const [ isLoadingPendingTxTable, setIsLoadingPendingTxTable ] = useState(true);
    const [ depositPlaced, setDepositPlaced ] = useState([]);
    const [ depositRetrieved, setDepositRetrieved ] = useState([]);
    const [ fullSettlementPaid, setFullSettlementPaid ] = useState([]);
    const [ sellerEarningsRetrieved, setSellerEarningsRetrieved ] = useState([]);
    const [ transactionRecords, setTransactionRecords ] = useState([]);
    const [ transactionRecordsUI, setTransactionRecordsUI ] = useState();
    const [ transactionRecordsTable, setTransactionRecordsTable ] = useState();

    // 1: check if refundFullSettlement needed, from moralis (ListPendingWinnerPaymentRefund)
    const { data: lpwpr_pendingRefund, isFetching: fetchingPendingRefund, isLoading: loadingPendingRefund } = useMoralisQuery(
        "ListpendingwinnerpaymentrefundLogs",
        (query) => query.equalTo("winner", account),
        [account],
        { live: true }
    )

    const { data: lpser_pendingRetrieval, isFetching: fetchingPendingRetrieval, isLoading: loadingPendingRetrieval } = useMoralisQuery(
        "ListpendingsellerearningsretrievalLogs",
        (query) => query.equalTo("seller", account),
        [account],
        { live: true }
    )

    const { data: ladp_depositPlaced, isFetching: fetchingDepositPlaced, isLoading: loadingDepositPlaced } = useMoralisQuery(
        "LogauctiondepositplacedLogs",
        (query) => query.equalTo("bidder", account),
        [account],
        { live: true }
    )

    const { data: ladr_depositRetrieved, isFetching: fetchingDepositRetrieved, isLoading: loadingDepositRetrieved } = useMoralisQuery(
        "LogauctiondepositretrievedLogs",
        (query) => query.equalTo("seller", account),
        [account],
        { live: true }
    )

    const { data: lafsp_fullSettlementPaid, isFetching: fetchingFullSettlementPaid, isLoading: loadingFullSettlementPaid } = useMoralisQuery(
        "LogauctionfullsettlementpaidLogs",
        (query) => query.equalTo("seller", account),
        [account],
        { live: true }
    )

    const { data: lser_earningsRetrieved, isFetching: fetchingEarningsRetrieved, isLoading: loadingEarningsRetrieved } = useMoralisQuery(
        "LogsellerearningsretrievedLogs",
        (query) => query.equalTo("seller", account),
        [account],
        { live: true }
    )

    useEffect(() => {
        let temp_depositPlaced = [];
        ladp_depositPlaced.map((aucs) => {
            temp_depositPlaced.push({
                "auctionAddress": aucs.attributes.auction,
                "amount": "- " + aucs.attributes.depositAmount,
                "transactionName": "deposit placed",
                "time": aucs.attributes.createdAt.toLocaleString()
            });
        })
        setDepositPlaced(temp_depositPlaced);
    }, [ladp_depositPlaced])

    useEffect(() => {
        let temp_depositRetrieved = [];
        ladr_depositRetrieved.map((aucs) => {
            temp_depositRetrieved.push({
                "auctionAddress": aucs.attributes.auction,
                "amount": "+ " + aucs.attributes.depositAmount,
                "transactionName": "deposit placed",
                "time": aucs.attributes.createdAt.toLocaleString()
        });
        })
        setDepositRetrieved(temp_depositRetrieved);
    }, [ladr_depositRetrieved])

    useEffect(() => {
        let temp_fullSettlementPaid = [];
        lafsp_fullSettlementPaid.map((aucs) => {
            temp_fullSettlementPaid.push({
                "auctionAddress": aucs.attributes.auction,
                "amount": "- " + aucs.attributes.paidAmount,
                "transactionName": "full-settlement paid",
                "time": aucs.attributes.createdAt.toLocaleString()
            });
        })
        setFullSettlementPaid(temp_fullSettlementPaid);
    }, [lafsp_fullSettlementPaid])

    useEffect(() => {
        let temp_earningsRetrieved = [];
        lser_earningsRetrieved.map((aucs) => {
            temp_earningsRetrieved.push({
                "auctionAddress": aucs.attributes.auction,
                "amount": "+ " + aucs.attributes.retrieveAmount,
                "transactionName": "earnings retrieved",
                "time": aucs.attributes.createdAt.toLocaleString()
            });
        })
        setSellerEarningsRetrieved(temp_earningsRetrieved);
    }, [lser_earningsRetrieved])

    useEffect(() => {
        setTransactionRecords(depositPlaced.concat(depositRetrieved, fullSettlementPaid, sellerEarningsRetrieved))
    }, [depositPlaced, depositRetrieved, fullSettlementPaid,sellerEarningsRetrieved])

    useEffect(() => {
        console.log(transactionRecords);
        setTransactionRecordsUI([]);
        transactionRecords.map((aucs) => {
            setTransactionRecordsUI((prev_aucs) => [...prev_aucs,[
                <TableItem>
                    <ENSAvatar address={aucs.auctionAddress} size={30} />
                    <AccAddress>{truncateStr(aucs.auctionAddress, 15)}</AccAddress>
                </TableItem>,
                <TableItem>
                    {aucs.transactionName}
                </TableItem>,
                <TableItem>
                    <Eth fontSize='30px' style={{marginRight: "5px"}}/>
                    {aucs.amount}
                </TableItem>,
                <TableItem>
                    {aucs.time}
                </TableItem>
            ]])
        })
    }, [transactionRecords])

    useEffect (() => {
        const table = <Table
            columnsConfig="1.5fr 1.5fr 1.4fr 1.5fr"
            customLoadingContent={<div style={{padding: '2rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '20vh', width: '90%'}}>
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </div>}
            data={transactionRecordsUI}
            header={[
                <span>auction</span>,
                <span>transaction type</span>,
                <span>amount</span>,
                <span>timestamp</span>
            ]}
            maxPages={5}
            pageSize={9}
        />

        setTransactionRecordsTable(table);
    }, [transactionRecordsUI])

    useEffect(() => {
        if (isWeb3Enabled) {
            const web3 = new Web3(MoralisProvider)
            setCurrAccount(web3.utils.toChecksumAddress(account));
        }
    }, [account])

    useEffect(() => {
        if (account) {
            fetchPendingRefundDetails();
        }
        setIsLoadingPendingTxTable(true);
    }, [lpwpr_pendingRefund])

    useEffect(() => {
        if (account) {
            fetchPendingRetrievalDetails();
        }
    }, [lpser_pendingRetrieval])

    useEffect(() => { // merge obj
        setPendTransactions(pendRefundAucs.concat(pendRetrieveAucs));
    }, [pendRefundAucs, pendRetrieveAucs])

    useEffect(() => {
        console.log(pendTransactions);
        setPendTransactionsUI([]);
        pendTransactions.map((aucs) => {
            setPendTransactionsUI((prev_aucs) => [...prev_aucs,[
                <RowCard props={aucs} />,
                <TableItem>
                    <ENSAvatar address={aucs.auctionContractAddress} size={30} />
                    <AccAddress>{truncateStr(aucs.auctionContractAddress, 15)}</AccAddress>
                </TableItem>,
                <TableItem>
                    <CloseStateTag props={aucs.endState}/>
                </TableItem>,
                <TableItem>
                    {retrieving ? 
                        <ButtonLoading />
                        :
                        <Button
                        onClick={() => {
                            setRetrieving(true);
                            (aucs.endState === 5) ? 
                                retrieveRefund(aucs.auctionContractAddress)
                                :
                                retrieveEarnings(aucs.auctionContractAddress)
                        }}
                        icon={
                            retrieving &&
                            <Loading
                            size={12}
                            spinnerColor="#ffffff"
                            spinnerType="wave"
                            />
                        }
                        text={retrieving ? "" : aucs.transactionName}
                        theme="secondary"
                        color="green"
                        type="submit"
                        size="large"
                    />
                    }
                </TableItem>
            ]])
        })
    }, [pendTransactions, retrieving])

    console.log(`check retrieving boolean : ${retrieving}`)

    useEffect (() => {
        console.log("UI changed")
        const table = <Table
            columnsConfig="2fr 1fr 1.2fr 1.5fr"
            customLoadingContent={<div style={{padding: '2rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '20vh', width: '90%'}}>
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </div>}
            data={pendTransactionsUI}
            header={[
                <span>NFT</span>,
                <span>auction</span>,
                <span>closing status</span>,
                <span>action</span>
            ]}
            maxPages={5}
            pageSize={3}
            isLoading={isLoadingPendingTxTable}
        />

        setPendTransactionsTable(table);
    }, [pendTransactionsUI])

    /*
    LogAuctionDepositPlaced
    LogAuctionDepositRetrieved
    LogAuctionFullSettlementPaid
    LogSellerEarningsRetrieved
    */

    /* smart contract interaction */
    const { data: retrieveRefundData, error: retrieveRefundError, fetch: retrieveRefundFetch, isLoading: retrieveRefundIsLoading, isFetching: retrieveRefundIsFetching, } = useWeb3ExecuteFunction();

    async function retrieveRefund(_aucAddress) {
        console.log(`Retrieving refund: ${_aucAddress}`);
        const options = {
            abi: auctionAbi.abi,
            contractAddress: _aucAddress,
            functionName: "refundFullSettlement",
        }
        retrieveRefundFetch({
            params: options,
            onSuccess: (tx) => handleRetrieveRefundSuccess(tx),
            onError: (error) => {
                setRetrieving(false);
                console.log(error.toString());
            }
        })
    }

    async function handleRetrieveRefundSuccess(tx) {
        // creating
        console.log("retrieving refund...")
        setRetrieving(true);
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
            message: `Full Settlement refunded into winner's account`,
            title: "Full Settlement Refund Success",
            position: "topR",
        })
        setRetrieving(false);
    }

    async function retrieveEarnings(_aucAddress) {
        console.log(`Retrieving refund: ${_aucAddress}`);
        const options = {
            abi: auctionAbi.abi,
            contractAddress: _aucAddress,
            functionName: "withdrawSellerEarnings",
        }
        retrieveRefundFetch({
            params: options,
            onSuccess: (tx) => handleRetrieveEarningsSuccess(tx),
            onError: (error) => {
                setRetrieving(false);
                console.log(error);
            }
        })
    }

    async function handleRetrieveEarningsSuccess(tx) {
        // creating
        console.log("retrieving refund...")
        setRetrieving(true);
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
            message: `Full Settlement deposited to seller's account`,
            title: "Earnings withdrawn successfully",
            position: "topR",
        })
        setRetrieving(false);
    }

    /* async functions */
    const fetchPendingRefundDetails = async (e) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const web3 = new Web3(MoralisProvider)
        let temp_pendingRefundAucs = [];

        for (let i = 0; i < lpwpr_pendingRefund.length; i++) {
            const pendingRefundObj = lpwpr_pendingRefund[i].attributes;
            const auctionContractAddress = web3.utils.toChecksumAddress(pendingRefundObj.auction);
            const nftContractAddress = web3.utils.toChecksumAddress(pendingRefundObj.nftAddress);
            const auctionContract = new ethers.Contract(auctionContractAddress, auctionAbi.abi, provider);
            const nftContract = new ethers.Contract(nftContractAddress, nftAbi.abi, provider);

            let nftName;
            let nftDescription;
            let nftImage;
            const tokenId = Number(pendingRefundObj.tokenId);
            const fullSettlement = Number(pendingRefundObj.fullSettlement);
            const endState = await auctionContract.auctionEndState();
            const status = await auctionContract.currAuctionState();
            const tokenSymbol = await nftContract.symbol();

            const ipfsLink = await nftContract.tokenURI(tokenId);
            if(ipfsLink) {
                const requestURL = ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
                const tokenURI = await (await fetch(requestURL)).json();
                nftName = tokenURI.name;
                nftDescription = tokenURI.description;
                nftImage = tokenURI.image.replace("ifps://", "https://ipfs.io/ipfs/");
            }

            const details = {
                "transactionName": "Retrieve Payment Refund",
                "auctionContractAddress": auctionContractAddress,
                "nftContractAddress": nftContractAddress,
                "status": status,
                "tokenSymbol": tokenSymbol,
                "tokenId": tokenId,
                "nftName": nftName,
                "nftDescription": nftDescription,
                "nftImage": nftImage,
                "endState": endState,
                "transactionValue": fullSettlement
            }

            temp_pendingRefundAucs.push(details);
        } // end of for loop

        setIsLoadingPendingTxTable(false);
        setPendRefundAucs(temp_pendingRefundAucs);
    } // end of fetchPendingRefundDetails()

    const fetchPendingRetrievalDetails = async (e) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const web3 = new Web3(MoralisProvider)
        let temp_pendingRetrievalAucs = [];
        const currAccount = web3.utils.toChecksumAddress(account);

        for (let i = 0; i < lpser_pendingRetrieval.length; i++) {
            const pendingRetrievalObj = lpser_pendingRetrieval[i].attributes;
            const auctionContractAddress = web3.utils.toChecksumAddress(pendingRetrievalObj.auction);
            const nftContractAddress = web3.utils.toChecksumAddress(pendingRetrievalObj.nftAddress);
            const auctionContract = new ethers.Contract(auctionContractAddress, auctionAbi.abi, provider);
            const nftContract = new ethers.Contract(nftContractAddress, nftAbi.abi, provider);

            let nftName;
            let nftDescription;
            let nftImage;
            const tokenId = Number(pendingRetrievalObj.tokenId);
            const sellerEarnings = Number(pendingRetrievalObj.highestBid);
            const endState = await auctionContract.auctionEndState();
            const status = await auctionContract.currAuctionState();
            const tokenSymbol = await nftContract.symbol();

            const ipfsLink = await nftContract.tokenURI(tokenId);
            if(ipfsLink) {
                const requestURL = ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
                const tokenURI = await (await fetch(requestURL)).json();
                nftName = tokenURI.name;
                nftDescription = tokenURI.description;
                nftImage = tokenURI.image.replace("ifps://", "https://ipfs.io/ipfs/");
            }

            const details = {
                "transactionName": "Retrieve Auction Earnings",
                "auctionContractAddress": auctionContractAddress,
                "nftContractAddress": nftContractAddress,
                "status": status,
                "tokenSymbol": tokenSymbol,
                "tokenId": tokenId,
                "nftName": nftName,
                "nftDescription": nftDescription,
                "nftImage": nftImage,
                "endState": endState,
                "transactionValue": sellerEarnings
            }

            temp_pendingRetrievalAucs.push(details);
        } // end of for loop
        setIsLoadingPendingTxTable(false);
        setPendRetrieveAucs(temp_pendingRetrievalAucs);
    } // end of fetchPendingRefundDetails()


    // TODO: check if retrieveFullSettlement needed, from moralis (ListPendingSellerEarnngsRetrieved)
    return (
        <Article>
            <Head>
                <title>HA-P</title>
                <meta name="description" content="Generated by create next app" />
            </Head>
            <Title>Wallet</Title>
            <Subtitle>Incoming Funds</Subtitle>
            {pendTransactionsTable}
            <Subtitle>Transaction Log</Subtitle>
            {transactionRecordsTable}
        </Article>
    )
}