import React, { useState, useEffect } from 'react'
import { TbReportAnalytics } from "react-icons/tb";
import { MdOutlineClosedCaptionDisabled } from "react-icons/md";
import { ethers } from "ethers";
import Popup from "reactjs-popup"
import { Modal, useNotification } from "web3uikit";
import styled from "styled-components";
import nftAbi from "../../../../ethereum-blockchain/artifacts/contracts/VehicleNft.sol/VehicleNft.json";

const ReportEl = styled.div`
    &:hover{
        cursor: pointer;
    }
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
  margin-top: 70px;
  margin-bottom: 10px;
`

const Photo = styled.img`
  width: 90%;
`

const PhotoFrame = styled.div`
    margin: 2rem;
    display: flex;
    justify-content: center;
`


const Report = ({ nft }) => {
    const dispatch = useNotification();
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const addressStorage = require("../../../../ethereum-blockchain/constants/contractAddresses.json")
    const nftContractAddress = addressStorage["VehicleNft"][chainId][addressStorage["VehicleNft"][chainId].length-1];
    const [ reportUri , setReportUri ] = useState("https://cdn.dribbble.com/users/1186261/screenshots/3718681/_______.gif");
    const [ isOpen, setIsOpen ] = useState(false);

    useEffect(() => {
        if (nft) {
            getNftUri();
        }
    }, [nft])

    const closeModal = () => {
        setIsOpen(false);
    };

    // query report from blockchain
    const getNftUri = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const nftContract = new ethers.Contract(nftContractAddress, nftAbi.abi, provider);
        const _reportUri = await (nftContract.tokenIdToReportUri(nft.tokenId))
        setReportUri(_reportUri);
    }

    // onClick open popup to show image, if no image, show alert
    function viewReport() {
        if (reportUri) {
            setIsOpen(true);
        } else {
            dispatch({
                type: "error",
                message: `This NFT has not been inspected yet!`,
                title: "Unable to view inspection report!",
                position: "topR",
             })
        }

    }

    return (
        <ReportEl onClick={() => viewReport()}>
            {(reportUri) ? 
                <TbReportAnalytics size={"30px"}/>
                :
                <MdOutlineClosedCaptionDisabled size={"30px"}/>               
            }
            <Popup open={isOpen} closeOnDocumentClick onClose={closeModal} position="right center">
                <Overlay
                    style={{
                    height: '100vh',
                    transform: 'scale(1)',
                    }}>
                    <div>
                    <Modal
                        customFooter={<div style={{marginTop: "2rem", fontSize: "1.2rem", width: "100%", display: "flex", justifyContent: "center"}}><div>End of Report</div></div>}
                        onCancel={() => closeModal()}
                        onCloseButtonPressed={() => closeModal()}
                        onOk={function noRefCheck(){}}
                        title="Inspection Report"
                    >
                    <ModalContent>
                        <PhotoFrame>
                            <Photo src={reportUri}/>
                        </PhotoFrame>
                    </ModalContent>
                    </Modal>
                    </div>
                </Overlay>
            </Popup>
        </ReportEl>
    )
}

export default Report