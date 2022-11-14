import React, { useState, useEffect } from 'react';
import Web3 from "web3";
import { ethers } from "ethers";
import styled from 'styled-components';
import Image from "next/image";
import { Modal, Input, useNotification, Loading, Upload } from "web3uikit";
import Slider from '@mui/material/Slider';
import { Reload } from '@web3uikit/icons'
import Popup from "reactjs-popup"
import { Colors } from "../../Theme";
import Button from "../styled/Button.styled";
import Report from "../NFT/Report";
import nftAbi from "../../../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json"
import {
    useMoralis,
    useMoralisQuery,
    useMoralisSubscription,
    useWeb3ExecuteFunction,
    MoralisProvider
  } from "react-moralis";
  import axios from "axios";
  import FormData from "form-data";

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

const ButtonSpace = styled.div`
    width: 1rem;
`

const BurnButton = styled(Button)`
  flex: 1;
  width: 100%;
  font-size: 1.07rem;
  background: linear-gradient(
        to right,
        black,
        #f73e47
    );
`;

const AddReportButton = styled(Button)`
  flex: 1;
  width: 100%;
  font-size: 1.07rem;
  background: linear-gradient(
        to right,
        ${Colors.PrimaryDisable},
        #72fcec
    );
`;

const BurnedButton = styled(Button)`
  flex: 1;
  width: 100%;
  font-size: 1.07rem;
  background: linear-gradient(
        to right,
        grey,
        #000000
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
  margin-top: 50px;
  margin-bottom: 50px;
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

const NftList = ({props}) => {
    const dispatch = useNotification();

    // blockchain connection details
    const web3 = new Web3(MoralisProvider)
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../../../ethereum-blockchain/constants/contractAddresses.json")
    const auctionManagerAddress = addressStorage["AuctionManager"][chainId][addressStorage["AuctionManager"][chainId].length-1];
    const auctionRegistryAddress = addressStorage["AuctionRegistry"][chainId][addressStorage["AuctionRegistry"][chainId].length-1];
    const vehicleNftAddress = addressStorage["VehicleNft"][chainId][addressStorage["VehicleNft"][chainId].length-1];
    const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT

    const { Moralis } = useMoralis();
    const [tokenURI, setTokenURI] = useState("NULL")
    const [tokenId, setTokenId] = useState(0);
    const [nftAddress, setNftAddress] = useState("");
    const [chassisId, setChassisId] = useState("CNxxxxxxxxxx");
    const [vehicleName, setVehicleName] = useState("Loading...")
    const [mnfcYear, setMnfcYear] = useState(0);
    const [createdAt, setCreatedAt] = useState("Loading...");
    const [image, setImage] = useState("https://cdn.dribbble.com/users/1186261/screenshots/3718681/_______.gif");
    const [burningNft, setBurningNft] = useState(false);
    const [addingReport, setAddingReport] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportImage, setReportImage] = useState();
    const [inputValid, setInputValid] = useState(false);


    useEffect(() => {
        updateTokenDetails();
    }, [props])

    useEffect(() => {
        if (reportImage) {
            setInputValid(true);
        } else {
            setInputValid(false);
        }
    }, [reportImage])

    const closeReportModal = () => {
        setIsReportOpen(false);
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
        setNftAddress(props.nftContractAddress);
    }

    // execute smart contract function
    const { data : approveBurnData, error : approveBurnError, fetch : approveBurn, isFetching: fetchingApproveBurn, isLoading : loadingApproveBurn } = useWeb3ExecuteFunction({
        abi: nftAbi.abi,
        contractAddress: nftAddress,
        functionName: "approveBurn",
        params: {
          _tokenId: tokenId
        }
    })

    const { data : burnData, error : burnError, fetch : burnNft, isFetching: fetchingBurn, isLoading : loadingBurn } = useWeb3ExecuteFunction({
        abi: nftAbi.abi,
        contractAddress: nftAddress,
        functionName: "burn",
        params: {
            _tokenId: tokenId
        }
    })

    const { data : reportData, error : reportError, fetch : addReport, isFetching: fetchingReport, isLoading : loadingReport } = useWeb3ExecuteFunction();

    async function handleApproveBurnSuccess(tx) {
        // creating
        setBurningNft(true);
        dispatch({
            type: "info",
            icon: <Reload fontSize='50px'/>,
            message: "Please wait while your transaction is being mined on Ethereum blockchain",
            title: "Pending transaction...",
            position: "topR",
          })
        await tx.wait(1);
        dispatch({
            type: "success",
            message: `Nft is approved for burning, sign this transaction again if you wish to proceed to burn nft`,
            title: "NFT Approved for Burning",
            position: "topR",
        })
        burnNft(
            {
                onSuccess: (tx) => handleBurnNftSuccess(tx),
                onError: (error) => {
                    console.log(error);
                    dispatch({
                      type: "error",
                      message: `Unauthorized function access!`,
                      title: "Unable to Burn NFT",
                      position: "topR",
                    })
                }
            }
        )
    }

    async function handleBurnNftSuccess(tx) {
        dispatch({
            type: "info",
            icon: <Reload fontSize='50px'/>,
            message: "Please wait while your transaction is being mined on Ethereum blockchain",
            title: "Pending transaction...",
            position: "topR",
        })
        await tx.wait(1);
        setBurningNft(false);
        // burned
        dispatch({
            type: "success",
            message: `Nft burned successfully`,
            title: "NFT Burned",
            position: "topR",
        })
    }

    const uploadReport = async () => {
        closeReportModal();
        setAddingReport(true);
        var data = new FormData();

        if (reportImage) {
            // upload report file to ipfs
            console.log("reportImage retrieved")
            const pinataToken = 'Bearer ' + PINATA_JWT;
            const fileName = reportImage.name;
            const metadata = JSON.stringify({"name": fileName, "keyvalues": {"company": "Pinata"}});
            data.append('file', reportImage);
            data.append('pinataOptions', '{"cidVersion": 1}');
            data.append('pinataMetadata', metadata);
      
            console.log(data);
            
            var config = {
              method: 'post',
              url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
              headers: { 
                'Authorization': pinataToken, 
                ...data.getHeaders ? data.getHeaders() : { 'Content-Type': 'multipart/form-data' }
              },
              data : data
            };
      
            const res = await axios(config);
            const imageUri = 'https://ipfs.io/ipfs/' + res.data.IpfsHash
            console.log(`imageURI => ${imageUri}`);
            console.log(`tokenId => ${tokenId}`);

            // execute contract function to set imageUri
            const options = {
                abi: nftAbi.abi,
                contractAddress: vehicleNftAddress,
                functionName: "addReport",
                params: {
                  _tokenId: tokenId,
                  _tokenURI: imageUri
                }
            }
    
            addReport({
                params: options,
                onSuccess: (tx) => handleRegisterVehicleSuccess(tx),
                onError: (error) => {
                console.log(error);
                setAddingReport(false);
                dispatch({
                    type: "error",
                    message: `Unauthorized function access!`,
                    title: "Unable to Upload Inspection Report",
                    position: "topR",
                })
                }
            });
        }
    }

    async function handleRegisterVehicleSuccess(tx) {
        // creating
        setAddingReport(true);
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
            message: `Inspection Report has been uploaded`,
            title: "Mint Success",
            position: "topR",
        })
        setAddingReport(false);
    }

    return (
        <div>
        <ListEl>
            <LeftSection>
                <Image style={{crossOrigin: "anonymous"}} src={image} width="366" height="300"/>
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
                            <ChassisTitle>Created At</ChassisTitle>
                            <ChassisValue>{createdAt}</ChassisValue>
                        </InfoSection>
                    </ItemDetails>
                    <ItemDetails>
                        <InfoSection>
                            <ChassisTitle>Current Owner</ChassisTitle>
                            <ChassisValue>{truncateStr(props.owner, 18)}</ChassisValue>
                        </InfoSection>
                        <InfoSection>
                            <ChassisTitle>Token ID</ChassisTitle>
                            <ChassisValue>{tokenId}</ChassisValue>
                        </InfoSection>
                    </ItemDetails>
                </div>
                <div>
                    {props.active ?
                    <ButtonSection>
                        <ButtonContainer>
                            <BurnButton 
                                disabled={burningNft}
                                onClick={() => approveBurn({
                                    onSuccess: (tx) => handleApproveBurnSuccess(tx),
                                    onError: (error) => {
                                        console.log(error);
                                        dispatch({
                                            type: "error",
                                            message: `Unauthorized function access!`,
                                            title: "Unable to Burn NFT",
                                            position: "topR",
                                        })
                                    }
                                })}>
                                    {(burningNft) ? <Loading
                                        size={12}
                                        spinnerColor="#ffffff"
                                        spinnerType="wave"
                                    /> 
                                    : 
                                    "Burn NFT"}
                            </BurnButton>
                            </ButtonContainer>
                            <ButtonSpace />
                            <ButtonContainer>
                                <AddReportButton 
                                    disabled={addingReport}
                                    onClick={() => setIsReportOpen(true)
                                    }>
                                        {(addingReport) ? <Loading
                                            size={12}
                                            spinnerColor="#ffffff"
                                            spinnerType="wave"
                                        /> 
                                        : 
                                        "Add Report"}
                                </AddReportButton>
                            </ButtonContainer>
                         </ButtonSection>
                    :
                    <ButtonSection>
                        <ButtonContainer>
                            <BurnedButton disabled>
                                Burned (NFT cease to exist)
                            </BurnedButton>
                        </ButtonContainer>
                    </ButtonSection>
                }
                </div>
                <Popup open={isReportOpen} closeOnDocumentClick onClose={closeReportModal} position="right center">
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
                            onCancel={() => closeReportModal()}
                            onCloseButtonPressed={() => closeReportModal()}
                            onOk={() => uploadReport()}
                            title="Inspection Report"
                            {...(!inputValid) && {isOkDisabled: true}}
                        >
                        <ModalContent>
                        <Upload
                            onChange={(file) => setReportImage(file)}
                            theme="withIcon"
                        />
                        </ModalContent>
                        </Modal>
                        </div>
                    </Overlay>
                </Popup>
            </RightSection>
        </ListEl>
        </div>
  )
}

export default NftList