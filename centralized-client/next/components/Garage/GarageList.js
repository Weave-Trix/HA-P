import React, { useState, useEffect } from 'react';
import Web3 from "web3";
import { ethers } from "ethers";
import styled from 'styled-components';
import Image from "next/image";
import { Modal, Input, useNotification, Loading } from "web3uikit";
import Slider from '@mui/material/Slider';
import { Reload } from '@web3uikit/icons'
import Popup from "reactjs-popup"
import { Colors } from "../../Theme";
import Button from "../styled/Button.styled";
import Report from "../NFT/Report";
import auctionManagerAbi from "../../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/AuctionManager.json";
import auctionRegistryAbi from "../../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/AuctionRegistry.json";
import auctionAbi from "../../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import {
    useMoralis,
    useMoralisQuery,
    useMoralisSubscription,
    useWeb3ExecuteFunction,
    MoralisProvider
  } from "react-moralis";

const ListEl = styled.div`
    border-radius: 15px;
    overflow: hidden;
    z-index: 2;
    background-color: ${Colors.White};
    color: ${Colors.Black};
    position: relative;
    display: flex;
    flex-direction: row;
    box-shadow: 0 0 40px ${Colors.Primary};
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
`

const LeftSection = styled.div`
    width: 35%;
    padding-left: 1rem;
    padding-right: 1rem;
`

const RightSection = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 65%;
    background-color: #edebeb;
    border-radius: 15px;
    padding: 2rem;
    padding-bottom: 1rem;
`

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 1rem;
  flex: 1;
  gap: 0.5rem;
`;

const ItemTitle = styled.h2`
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
`;  

const ItemDetails = styled.div`
    display: flex;
    flex-direction: row;
    margin-right: 30px;
`;

const ChassisTitle = styled.h3`
    font-weight: 100;
    font-size: 0.6rem;
`

const ChassisValue = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 0.85rem;
`

const ButtonSection = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
`

const ButtonContainer = styled.div`
    margin-top: 2rem;
    flex: 1;
    align-items: center;
`

const SellButton = styled(Button)`
  flex: 1;
  width: 100%;
  font-size: 1.07rem;
  background: linear-gradient(
        to right,
        ${Colors.PrimaryDisable},
        #45f5c6
    );
`;

const OngoingButton = styled(Button)`
    flex: 1;
    width: 100%;
    font-size: 1.07rem;
    background: linear-gradient(
        to right,
        ${Colors.PrimaryDisable},
        #f73e47
    );
`;

const RegisteredButton = styled(Button)`
    flex: 1;
    width: 100%;
    font-size: 1.07rem;
    background: linear-gradient(
        to right,
        ${Colors.PrimaryDisable},
        #ca6fe3
    );
`;

const CancelButton = styled(Button)`
    flex: 1;
    width: 100%;
    font-size: 1.07rem;
    background: linear-gradient(
        to right,
        #050d2e,
        ${Colors.PrimaryDisable}
    );
`;

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
`

const SliderContainer = styled.div`
    margin-top: 40px;
`

const SliderTitle = styled.div`
    font-size: 0.9rem;
    font-weight: 500;
    color: #317fb0;
`

const ModalText = styled.h4`
  font-weight: 600;
  margin-right: '1em';
  text-align: center;
  margin-top: 70px;
`

const GarageList = ({props}) => {
    const dispatch = useNotification();

    // blockchain connection details
    const web3 = new Web3(MoralisProvider)
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../../../ethereum-blockchain/constants/contractAddresses.json")
    const auctionManagerAddress = addressStorage["AuctionManager"][chainId][addressStorage["AuctionManager"][chainId].length-1];
    const auctionRegistryAddress = addressStorage["AuctionRegistry"][chainId][addressStorage["AuctionRegistry"][chainId].length-1];

    const { Moralis } = useMoralis();
    const [tokenURI, setTokenURI] = useState("NULL")
    const [tokenId, setTokenId] = useState(0);
    const [nftAddress, setNftAddress] = useState("");
    const [chassisId, setChassisId] = useState("CNxxxxxxxxxx");
    const [vehicleName, setVehicleName] = useState("Loading...")
    const [mnfcYear, setMnfcYear] = useState(0);
    const [createdAt, setCreatedAt] = useState("Loading...");
    const [image, setImage] = useState("https://cdn.dribbble.com/users/1186261/screenshots/3718681/_______.gif");
    const [isOpen, setIsOpen] = useState(false);
    const [auctionOngoing, setAuctionOngoing] = useState(false);
    const [auctionRegistered, setAuctionRegistered] = useState(false);
    const [creatingAuction, setCreatingAuction] = useState(false);
    const [startingBid, setStartingBid] = useState(1);
    const [auctionDuration, setAuctionDuration] = useState(1);
    const [startingAuction, setStartingAuction] = useState(false);
    

    useEffect(() => {
        updateTokenDetails();
        fetchAuctions();
    }, [props])

    const closeModal = () => {
        setIsOpen(false);
    };

    // parse server connection
    const fetchAuctions = async (e) => {
        const query = new Moralis.Query("ListAuctionRecords");
        query.equalTo("tokenId", props.tokenId);
        query.descending("createdAt");
        const queryRes = await query.first();
        if (queryRes && (queryRes.attributes.currState !== 5) && (queryRes.attributes.currState!==0)) {
            setAuctionOngoing(true);
        } else if (queryRes && (queryRes.attributes.currState === 0)) {
            setAuctionRegistered(true);
        }else {
            setAuctionOngoing(false);
        }
    }

    // parse NFT data from TokenURI
    async function updateTokenDetails() {
        const ipfsLink = props.tokenURI;
        const requestURL = ipfsLink.replace("ipfs://", "https://ipfs.io/ipfs/");
        const tokenURIResponse = await (await fetch(requestURL)).json();
        setTokenURI(tokenURIResponse);
        const _vehicleName = tokenURIResponse.name;
        setVehicleName(_vehicleName);
        const _imageURI = tokenURIResponse.image;
        setChassisId(tokenURIResponse.attributes[3].value);
        setMnfcYear(tokenURIResponse.attributes[0].value);
        setCreatedAt(props.createdAt.toLocaleString());
        setTokenId(props.tokenId);
        const imageURIURL = _imageURI.replace("ifps://", "https://ipfs.io/ipfs/");
        setImage(imageURIURL);
        setNftAddress(props.nftAddress);
    }

    // execute smart contract function
    const { data : createAuctionData, error : createAuctionError, fetch : createAuction, isFetching: createAuctionFetching, isLoading : createAuctionLoading } = useWeb3ExecuteFunction({
        abi: auctionManagerAbi.abi,
        contractAddress: auctionManagerAddress,
        functionName: "createAuction",
        params: {
          _nftAddress: nftAddress,
          _tokenId: tokenId
        }
    })

    async function handleCreateAuctionSuccess(tx) {
        // creating
        setCreatingAuction(true);
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
            message: `Vehicle is now registered for auction`,
            title: "Auction Registered",
            position: "topR",
        })
        setCreatingAuction(false);
        setAuctionRegistered(true);
    }

    // get auction address from auction registry
    // create new auction object
    // start auction
    const { data : startAuctionData, error : startAuctionError, fetch : startAuctionFetch, isFetching: startAuctionFetching, isLoading : startAuctionLoading } = useWeb3ExecuteFunction()
    
    async function startAuction() {
        console.log("starting auction")
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const auctionRegistryContract = new ethers.Contract(auctionRegistryAddress, auctionRegistryAbi.abi, provider);
        const auctionAddress = await auctionRegistryContract.auctionListings(nftAddress, tokenId);
        console.log(auctionAddress);
        const options = {
            abi: auctionAbi.abi,
            contractAddress: auctionAddress,
            functionName: "startAuction",
            params: {
              _durationSec: auctionDuration,
              _startingBid: startingBid
            }
        }
        startAuctionFetch({
            params: options,
            onSuccess: (tx) => handleStartAuctionSuccess(tx),
            onError: (error) => console.log(error)
        });
        closeModal();
    }


    async function handleStartAuctionSuccess(tx) {
        // creating
        setStartingAuction(true);
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
            message: `Auction has been listed in auction marketplace`,
            title: "Auction Started",
            position: "topR",
        })
        setStartingAuction(false);
        setAuctionRegistered(false);
        setAuctionOngoing(true);
    }

    return (
        <ListEl>
            <LeftSection>
                <Image src={image} width="366" height="300"/>
            </LeftSection>
            <RightSection>
                <div>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <ItemTitle>{vehicleName} ({mnfcYear})</ItemTitle>
                        <Report nft={{tokenId: tokenId}}/>
                    </div>
                    <ItemDetails>
                        <InfoSection>
                            <ChassisTitle>Chassis Number</ChassisTitle>
                            <ChassisValue>{chassisId}</ChassisValue>
                        </InfoSection>
                        <InfoSection>
                            <ChassisTitle>Entered Garage At</ChassisTitle>
                            <ChassisValue>{createdAt}</ChassisValue>
                        </InfoSection>
                    </ItemDetails>
                    <ItemDetails>
                        <InfoSection>
                            <ChassisTitle>Token Symbol</ChassisTitle>
                            <ChassisValue>VOC</ChassisValue>
                        </InfoSection>
                        <InfoSection>
                            <ChassisTitle>Token ID</ChassisTitle>
                            <ChassisValue>{tokenId}</ChassisValue>
                        </InfoSection>
                    </ItemDetails>
                </div>
                <ButtonSection>
                    {auctionRegistered &&
                        <ButtonContainer style={{marginRight: "2rem"}}>
                            <CancelButton>Cancel Auction</CancelButton>
                        </ButtonContainer>
                    }
                    <ButtonContainer>
                        {auctionOngoing && <OngoingButton>In Marketplace</OngoingButton>}
                        {auctionRegistered &&
                            <RegisteredButton 
                                disabled={startingAuction || startAuctionFetching}
                                onClick={() => setIsOpen(true)}>
                                {(startingAuction || startAuctionFetching || isOpen) ? 
                                    <Loading
                                        size={12}
                                        spinnerColor="#ffffff"
                                        spinnerType="wave"
                                    />
                                    :
                                    "Start Bidding Session"}
                            </RegisteredButton>}
                        {!auctionRegistered && !auctionOngoing && 
                            <SellButton 
                                disabled={creatingAuction || createAuctionFetching}
                                onClick={() => createAuction({
                                    onSuccess: (tx) => handleCreateAuctionSuccess(tx),
                                    onError: (error) => console.log(error)
                                })}>
                                    {(creatingAuction || createAuctionFetching) ? <Loading
                                        size={12}
                                        spinnerColor="#ffffff"
                                        spinnerType="wave"
                                    /> 
                                    : 
                                    "Create Auction"}
                            </SellButton>}
                    </ButtonContainer>
                </ButtonSection>
                <Popup open={isOpen} closeOnDocumentClick onClose={closeModal} position="right center">
                <Overlay
                    style={{
                    height: '100vh',
                    transform: 'scale(1)',
                    }}>
                    <div>
                    <Modal
                        className="close"
                        okButtonColor="red"
                        id="v-center"
                        isCentered
                        okText="Yes! I am 100% sure!"
                        onCancel={() => closeModal()}
                        onCloseButtonPressed={() => closeModal()}
                        onOk={() => startAuction()}
                        title="Start Auction"
                    >
                    <ModalContent>
                        <Input
                            id="startingBidInput"
                            label="Starting bid in WEI"
                            name="Test number Input"
                            width="100%"
                            type="number"
                            validation={{
                            numberMin: 1
                            }}
                            onChange={() => setStartingBid(document.getElementById("startingBidInput").value)}
                            value={1}
                        />
                        <SliderContainer>
                            <SliderTitle>Auction duration in minutes</SliderTitle>
                        <Slider 
                            id="auctionDurationSlider"
                            defaultValue={50}
                            aria-label="Default"
                            valueLabelDisplay="auto"
                            min={1}
                            max={1440}
                            onChange={
                                (event, value) => {
                                    setAuctionDuration(value * 60); // minute to sec
                                }
                            }
                        />
                        </SliderContainer>
                        <ModalText>
                        HA-P charges 0% royalty for winner's full settlement
                        </ModalText>
                    </ModalContent>
                    </Modal>
                    </div>
                </Overlay>
                </Popup>
            </RightSection>
        </ListEl>
  )
}

export default GarageList