import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Image from "next/image";
import { Modal, Input } from "web3uikit";
import Popup from "reactjs-popup"
import { Colors } from "../../Theme";
import Button from "../styled/Button.styled";
import auctionManagerAbi from "../../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/AuctionManager.json";
import auctionAbi from "../../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import {
    useMoralis,
    useMoralisQuery,
    useMoralisSubscription,
    useWeb3ExecuteFunction
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

const ButtonContainer = styled.div`
    margin-top: 2rem;
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
        #d640f7
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

const ModalText = styled.h4`
  font-weight: 600;
  margin-right: '1em';
  text-align: center;
  margin-top: 70px;
`

const GarageList = ({props}) => {
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../../../ethereum-blockchain/constants/contractAddresses.json")
    const auctionManagerAddress = addressStorage["AuctionManager"][chainId][addressStorage["AuctionManager"][chainId].length-1];
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
    const { Moralis } = useMoralis();
    

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


    return (
        <ListEl>
            <LeftSection>
                <Image src={image} width="366" height="300"/>
            </LeftSection>
            <RightSection>
                <div>
                    <ItemTitle>{vehicleName} ({mnfcYear})</ItemTitle>
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
                <ButtonContainer>
                    {auctionOngoing && <OngoingButton>Auction Ongoing</OngoingButton>}
                    {auctionRegistered && <RegisteredButton>Start Auction</RegisteredButton>}
                    {!auctionRegistered && !auctionOngoing && <SellButton onClick={() => createAuction()}>Sell</SellButton>}
                </ButtonContainer>
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
                        onOk={() => bidFetch()}
                        title="Place Bid"
                    >
                    <ModalContent>
                        <Input
                            id="bidLabel"
                            label="Your bid in WEI"
                            name="Test number Input"
                            width="100%"
                            type="number"
                            validation={{
                            numberMin: 1
                            }}        
                            onChange={() => test()}
                            value={1}
                        />
                        <ModalText>
                        HA-P charges 5% royalty for winner's full settlement
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