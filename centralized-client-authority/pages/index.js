import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Image from "next/image";
import Web3 from "web3";
import { ethers } from "ethers";
import Popup from "reactjs-popup"
import styled from "styled-components";
import {
  useMoralis,
  useMoralisQuery,
  useMoralisSubscription, 
  MoralisProvider,
  useWeb3ExecuteFunction
} from "react-moralis";
import { Colors } from "../next/Theme";
import Pagination from '@mui/material/Pagination';
import { Dropdown, Grid, ENSAvatar, Tab, TabList, Table, EmptyRowsForSkeletonTable, Button, Loading, useNotification, Modal, Input, TextArea, Select, Upload } from "web3uikit";
import { Reload } from '@web3uikit/icons'
import NftList from '../next/components/NFT/NftList';
import axios from "axios";
import FormData from "form-data";
import nftAbi from "../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json"

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
    margin-bottom: 2rem;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  margin-bottom: 2.5rem;
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
`

const ModalContent = styled.div`
  margin-top: 40px;
  margin-bottom: 10px;
`
const ModalItem = styled.div`
  margin: "2rem";
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

const SelectHolder = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`

const Bottom = styled.div`
    display: flex;
    justify-content: center;
`

const PaginationHolder = styled.div`
    margin-top: 2rem;
    padding-left: 2rem;
    padding-right: 2rem;
    padding-top: 5px;
    padding-bottom: 5px;
    border-radius: 50px;
    background-color: ${Colors.White};
`

const NoRecord = styled.h1`
  font-size: 2rem;
  font-weight: 400;
  color: ${Colors.Secondary};
  text-align: center;
  margin-top: 20vh;
`;


export default function Index() {
  const web3 = new Web3(MoralisProvider)
  const dispatch = useNotification();
  const itemPerPage = 5;
  const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
  const addressStorage = require("../../ethereum-blockchain/constants/contractAddresses.json")
  const vehicleNftAddress = addressStorage["VehicleNft"][chainId][addressStorage["VehicleNft"][chainId].length-1];

  const { Moralis, isInitialized, isWeb3Enabled, account, ...rest } = useMoralis();
  const [ nftsDetails, setNftsDetails ] = useState([]);
  const [indexStart, setIndexStart] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [indexEnd, setIndexEnd] = useState(1 * itemPerPage);
  const [page, setPage] = useState(1);
  const [paginatedList, setPaginatedList] = useState([]);
  const [showActiveNft, setShowActiveNft] = useState(true);
  const [ownerAddress, setOwnerAddress] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [manufactureYear, setManufactureYear] = useState(0);
  const [origin, setOrigin] = useState("Import New");
  const [color, setColor] = useState("Black");
  const [coverPhoto, setCoverPhoto] = useState();
  const [displacement, setDisplacement] = useState(0);
  const [vehicleDescription, setVehicleDescription] = useState("");
  const [ownerAddressError, setOwnerAddressError] = useState(true);
  const [inputValid, setInputValid] = useState(false);
  const [mintingNft, setMintingNft] = useState(false);


  const closeModal = () => {
    setIsOpen(false);
  };
  
  // TODO: display a list of NFTs with button to burn NFT
  // query ListNftRecords
  const { data: lnr_nfts, isLoading: loadingNfts, isFetching: fetchingNfts } = useMoralisQuery(
      "ListNftRecords",
      (query) => query.equalTo("active", showActiveNft).descending("createdAt"),
      [account, showActiveNft],
      { live: true }
  );

  useEffect(() => {
    fetchNftsDetails();
  }, [lnr_nfts])

  useEffect(() => {
    updatePaginatedList();
  }, [indexStart, nftsDetails])

  useEffect(() => {
    checkInputValidity();
  }, [vehicleName, vehicleDescription, manufactureYear, chassisNumber])


  /* functions */
  function updatePaginatedList() {
      setPaginatedList(nftsDetails.slice(indexStart, indexEnd))
  }

  function checkAddress(_address) {
    return (web3.utils.toChecksumAddress(_address));
  }

  function checkInputValidity() {
    if (
      (10 <= vehicleName.length && vehicleName.length <= 20) &&
      (60 <= vehicleDescription.length) &&
      (1886 <= manufactureYear && manufactureYear <= 2022) &&
      (chassisNumber.toString().length === 12) &&
      (660 <= displacement && displacement <= 10000) &&
      coverPhoto !== undefined
    ) {
      setInputValid(true);
    } else {
      setInputValid(false);
    }
  }


  function resetInput() {
    setOwnerAddress("");
    setChassisNumber("");
    setVehicleName("");
    setManufactureYear(0);
    setOrigin("Import New");
    setColor("Black");
    setCoverPhoto();
    setDisplacement(0);
    setVehicleDescription("");
    setOwnerAddressError(true);
    setInputValid(false);
  }

  // execute smart contract function
  const { data : registerVehicleData, error : registerVehicleError, fetch : registerVehicle, isFetching: fetchingRevisterVehicle, isLoading : loadingRegisterVehicle } = useWeb3ExecuteFunction();

  /* async functions */
  const fetchNftsDetails = async () => {
    let temp_arr = [];
    for (let i = 0; i< lnr_nfts.length; i++) {
      const nftDetails = await parseNftDetails(lnr_nfts[i].attributes);
      temp_arr.push(nftDetails);
    }
    setNftsDetails(temp_arr);
  }

  console.log(nftsDetails);

  const parseNftDetails = async (nft) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let nftName;
    let nftDescription;
    let nftAttributes;
    let nftImage;
    // query generals
    if(nft) {
        const requestURL = nft.tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
        const tokenURI = await (await fetch(requestURL)).json();
        nftName = tokenURI.name;
        nftDescription = tokenURI.description;
        nftAttributes = tokenURI.attributes
        nftImage = tokenURI.image.replace("ifps://", "https://ipfs.io/ipfs/");
    }
    return ({
      "status": 4,
      "tokenSymbol": "VOC",
      "tokenId": nft.tokenId,
      "nftContractAddress": nft.nftAddress,
      "nftName": nftName,
      "nftImage": nftImage,
      "owner": nft.owner,
      "createdAt": nft.createdAt.toLocaleString(),
      "tokenURI": nft.tokenURI,
      "active": nft.active
    })
  } 

  const handleTokenUris = async () => {
    closeModal();
    setMintingNft(true);

    console.log("entered handleTokenUris()");
    var data = new FormData();

    if (coverPhoto) {
      // upload cover photo to ipfs
      console.log("coverPhoto retrieved");
      const pinataToken = 'Bearer ' + PINATA_JWT;
      const fileName = coverPhoto.name;
      const metadata = JSON.stringify({"name": fileName, "keyvalues": {"company": "Pinata"}});
      data.append('file', coverPhoto);
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
      const tokenUri = {
        "name": vehicleName,
        "description": vehicleDescription,
        "image": imageUri,
        "attributes": [
          {
            "trait_type": "Manufacture Year",
            "value": manufactureYear
          },
          {
            "trait_type": "Color",
            "value": color
          },
          {
            "trait_type": "Displacement",
            "value": displacement
          },
          {
            "trait_type": "Chassis Number",
            "value": chassisNumber
          },
          {
            "trait_type": "Origin",
            "value": origin
          },
        ]
      }

      console.log(tokenUri);

      // upload tokenUri to ipfs
      var tokenData = JSON.stringify({
        "pinataOptions": {
          "cidVersion": 1
        },
        "pinataMetadata": {
          "name": "VOC Token URI",
          "keyvalues": {
            "minter": "HA-P IICP Coventry"
          }
        },
        "pinataContent": {
          ...tokenUri
        }
      });
      
      var tokenConfig = {
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': pinataToken
        },
        data : tokenData
      };
      
      const tokenRes = await axios(tokenConfig);
      
      const tokenIpfsLink = 'https://ipfs.io/ipfs/' + tokenRes.data.IpfsHash

      const options = {
        abi: nftAbi.abi,
        contractAddress: vehicleNftAddress,
        functionName: "registerVehicle",
        params: {
          _owner: ownerAddress,
          _tokenURI: tokenIpfsLink,
          _chassisNum: chassisNumber
        }
      }

      registerVehicle({
          params: options,
          onSuccess: (tx) => handleRegisterVehicleSuccess(tx),
          onError: (error) => {
            console.log(error);
            setMintingNft(false);
            dispatch({
              type: "error",
              message: `Unauthorized function access!`,
              title: "Unable to Register Vehicle",
              position: "topR",
            })
          }
      });
    } // end of IF
  }

  async function handleRegisterVehicleSuccess(tx) {
    // creating
    setMintingNft(true);
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
        message: `Vehicle NFT has been minted`,
        title: "Mint Success",
        position: "topR",
    })
    setMintingNft(false);
    resetInput();
  }


  return (
    <div>
      <Head>
        <title>HA-P for Authority</title>
        <meta name="description" content="Generated by create next app" />
      </Head>
      <Article>
          <Title>NFT Records</Title>
          <TopSection>
            <Dropdown
              icon={<Grid fontSize='20px' style={{marginRight: "5px"}}/>}
              label="Viewing : "
              defaultOptionIndex={0}
              onChange={(e) => {
                setShowActiveNft(e.id)
                console.log(e.id)
              }}
              onComplete={function noRefCheck(){}}
              options={[
                {
                  id: true,
                  label: 'Active NFT'
                },
                {
                  id: false,
                  label: 'Burned NFT'
                }
              ]}
            />
            <Button
              onClick={() => setIsOpen(true)}
              customize={{
                backgroundColor: '#73ffb7',
                fontSize: 16,
                onHover: 'darken',
                textColor: '#ffffff'
              }}
              icon={
                mintingNft &&
                <Loading
                  size={12}
                  spinnerColor="#ffffff"
                  spinnerType="wave"
                />
              }
              disabled={mintingNft}
              text={mintingNft ?  "" : "Mint NFT"}
              theme="custom"
            />
          </TopSection>
          {(lnr_nfts.length > 0) ?
              <div>
                {
                    paginatedList.map((vehicle) => {
                        return(
                            <NftList props={vehicle}/>
                        )
                    })
                }
              <Bottom>
                <PaginationHolder>
                    <Pagination count={Math.ceil(nftsDetails.length/itemPerPage)} onChange={
                        (event, value) => {
                            setPage(value);
                            if (nftsDetails.length > 0) {
                                const indexStart = ((value - 1) * itemPerPage);
                                const indexEnd = (value * itemPerPage);
                                setIndexStart(indexStart);
                                setIndexEnd(indexEnd);
                                console.log(`Start: ${indexStart}`);
                                console.log(`End: ${indexEnd}`);
                            }
                        }
                    } />
                </PaginationHolder>
            </Bottom>
          </div>
          :
          <NoRecord>Seems like NFT record is empty, emp-t, em-t, m-t</NoRecord>
          }
        <Popup 
          open={isOpen} 
          closeOnDocumentClick 
          onClose={closeModal} 
          position="right center">
          <Overlay
            style={{
              height: '100vh',
              transform: 'scale(1)',
            }}>
            <div>
              <Modal
                id="height"
                isVisible
                className="close"
                okButtonColor="red"
                okText="Yes! I am 100% sure!"
                onCancel={() => closeModal()}
                onCloseButtonPressed={() => closeModal()}
                onOk={() => handleTokenUris()}
                title="Mint NFT"
                {...(!inputValid) && {isOkDisabled: true}}
              >
              <ModalContent>
                <Upload
                  onChange={(file) => setCoverPhoto(file)}
                  theme="withIcon"
                />
                <Input
                    id="bidLabel"
                    label="owner address"
                    name="Test number Input"
                    width="100%"
                    style={{marginBottom: "3rem", marginTop: "3rem"}}
                    errorMessage="Invalid Ethereum Address"
                    state={(ownerAddressError) ? "error" : "confirmed"}
                    onChange={
                      (e) => {
                        try {
                          var input = checkAddress(e.target.value);
                          setOwnerAddressError(false);
                          setOwnerAddress(input);
                        } catch (error) {
                          setOwnerAddressError(true);
                        }
                      }
                    }
                  />
                  <Input
                    id="bidLabel"
                    label="chassis number (CN)"
                    name="Test number Input"
                    type="number"
                    width="100%"
                    style={{marginBottom: "3rem"}}
                    errorMessage="Chassis Number Length Must Be 12"
                    state={(chassisNumber.toString().length === 12) ? "confirmed" : "error"}
                    onChange={
                      (e) => {
                        console.log(e.target.value);
                        try {
                          var input = e.target.value
                          setChassisNumber(input);
                        } catch (error) {
                          console.log(error);
                        }
                      }
                    }
                  />
                  <Input
                    id="bidLabel"
                    label="vehicle name"
                    name="Test number Input"
                    width="100%"
                    style={{marginBottom: "4rem"}}
                    errorMessage="Vehicle Name Must Be Within 10 to 20 Characters"
                    state={(10 <= vehicleName.length && vehicleName.length <= 20) ? "confirmed" : "error"}
                    onChange={
                      (e) => {
                        try {
                          var input = e.target.value;
                          setVehicleName(input);
                        } catch (error) {
                          console.log(error);
                        }
                      }
                    }
                  />
                  <SelectHolder>
                    <Select
                      label="Origin"
                      onBlurTraditional={function noRefCheck(){}}
                      onChange={(e) => setOrigin(e.label)}
                      onChangeTraditional={function noRefCheck(){}}
                      options={[
                        {
                          id: '1',
                          label: 'Import New',
                        },
                        {
                          id: '2',
                          label: 'Import Used',
                        },
                        {
                          id: '3',
                          label: 'CKD',
                        }
                      ]}
                      defaultOptionIndex='0'
                      style={{
                        marginRight: "3rem"
                      }}
                    />
                    <Select
                      label="Color"
                      onBlurTraditional={function noRefCheck(){}}
                      onChange={(e) => setColor(e.label)}
                      onChangeTraditional={function noRefCheck(){}}
                      options={[
                        {
                          id: '1',
                          label: 'Black',
                        },
                        {
                          id: '2',
                          label: 'White',
                        },
                        {
                          id: '3',
                          label: 'Red',
                        },
                        {
                          id: '4',
                          label: 'Blue',
                        },
                        {
                          id: '5',
                          label: 'Silver',
                        },
                        {
                          id: '6',
                          label: 'Brown',
                        },
                      ]}
                      defaultOptionIndex='0'
                      style={{
                        marginRight: "3rem"
                      }}
                    />      
                  </SelectHolder>
                  <Input
                    id="bidLabel"
                    label="year manufacture"
                    name="Test number Input"
                    width="100%"
                    style={{marginBottom: "3rem", marginTop: "4rem"}}
                    errorMessage="Manufacture Year Must Be Within Range 1957 - 2022"
                    state={(1886 <= manufactureYear && manufactureYear <= 2022) ? "confirmed" : "error"}
                    onChange={
                      (e) => {
                        try {
                          var input = e.target.value;
                          setManufactureYear(input);
                        } catch (error) {
                          console.log(error);
                        }
                      }
                    }
                  />
                  <Input
                    id="bidLabel"
                    label="displacement (cc)"
                    name="Test number Input"
                    width="100%"
                    style={{marginBottom: "3rem"}}
                    errorMessage="Displacement Must Be Within Range 660 - 10000"
                    state={(660 <= displacement && displacement <= 10000) ? "confirmed" : "error"}
                    onChange={
                      (e) => {
                        try {
                          var input = e.target.value;
                          setDisplacement(input);
                        } catch (error) {
                          console.log(error);
                        }
                      }
                    }
                  />
                  <TextArea
                    id="bidLabel"
                    label="vehicle description"
                    name="Test number Input"
                    width="100%"
                    style={{marginBottom: "3rem"}}
                    errorMessage="Please Provide A Description With More Than 60 Characters"
                    state={(60 <= vehicleDescription.length) ? "confirmed" : "error"}
                    onChange={
                      (e) => {
                        try {
                          var input = e.target.value;
                          setVehicleDescription(input);
                        } catch (error) {
                          console.log(error);
                        }
                      }
                    }
                  />
                <ModalText>
                  HA-P charges 0% royalty for winner's full settlement
                </ModalText>
              </ModalContent>
              </Modal>
            </div>
          </Overlay>
        </Popup>
      </Article>
    </div>
  );
}