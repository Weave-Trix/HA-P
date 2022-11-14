import styled from "styled-components";
import Image from "next/image";
import { Colors, Devices } from "../../Theme";
import Button from "../styled/Button.styled";
import Popup from "reactjs-popup"
import { Modal, Input } from "web3uikit";
import { useMoralis, useWeb3ExecuteFunction } from "react-moralis";
import { useRouter } from "next/router";
import { Eth, Reload } from '@web3uikit/icons';
import { ENSAvatar } from "web3uikit";
import contractAbi from "../../../../ethereum-blockchain/artifacts/contracts/AuctionContracts.sol/Auction.json";
import { useState, useEffect } from 'react';


const BidStickyEl = styled.article`
  box-shadow: 0 4px 40px rgb(0 0 0 /10%);
  border: 1px solid ${Colors.Border};
  padding: 0.8rem 3rem;
  border-radius: 5px;
  width: 74%;
  display: flex;
  position: fixed;
  background-color: ${Colors.White};
  bottom: 1rem;
`;

const LeftSection = styled.div`
  display: none;
  flex: 1;
  gap: 1rem;
  @media ${Devices.Laptop} {
    display: flex;
  }
`;

const ThumbEl = styled.span`
  width: 80px;
  height: 80px;
`;

const PlaceBidBtn = styled(Button)`
  flex: 1;
  width: 100%;
  font-size: 1.07rem;
  background: linear-gradient(
    to right,
    ${Colors.PrimaryDisable},
    #45f5c6
  );
`;

const PlaceDepositBtn = styled(Button)`
  flex: 1;
  width: 100%;
  font-size: 1.07rem;
  background: linear-gradient(
    to right,
    ${Colors.PrimaryDisable},
    #f73e47
  );
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const EditionEl = styled.span`
  font-weight: 500;
  font-size: 0.9rem;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 1.8rem;
  display: flex;
  margin-bottom: 15px;
`;

const RightSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.5rem;
  align-items: center;
  @media ${Devices.Laptop} {
    flex: 0.6;
  }
`;

const TextEl = styled.span`
  color: ${Colors.Gray};
  font-size: 0.7rem;
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

export default function BidSticky({ auction }) {
  // props: aucDeposit, userDeposit, highestBid
  console.log(auction.highestBid);
  const router = useRouter();
  const { auctionAddress } = router.query;
  const [isOpen, setisOpen] = useState(false);
  const [isDeposited, setIsDeposited] = useState(false);
  const [bidValue, setBidValue] = useState(0)
  const [minimumBid, setMinimumBid] = useState(0)
  useEffect(() => {
      if(auction.aucDeposit > 0) {
        setIsDeposited(auction.aucDeposit.toString() === auction.userDeposit.toString())
      }
  }, [auction.userDeposit, auction.aucDeposit])

  useEffect(() => {
    const minBidInt = parseInt(auction.highestBid, 10) + 1;
    setMinimumBid(minBidInt);
    if (bidValue < minBidInt) {
      setBidValue(minBidInt);
    }
    console.log(`HighestBid useEffect() ${auction.highestBid}`);
  }, [auction.highestBid])

  const closeModal = () => {
    setisOpen(false);
  };

  const { data : depositData, error : depositError, fetch : depositFetch, isFetching: depositIsFetching, isLoading : depositIsLoading } = useWeb3ExecuteFunction({
    abi: contractAbi.abi,
    contractAddress: auctionAddress,
    functionName: "placeDeposit",
    msgValue: auction.aucDeposit,
  })

  const { data : bidData, error : bidError, fetch : bidFetch, isFetching: bidIsFetching, isLoading : bidIsLoading } = useWeb3ExecuteFunction({
    abi: contractAbi.abi,
    contractAddress: auctionAddress,
    functionName: "placeBid",
    params: {
      _bidAmount: bidValue
    }
  })

  const test = () => {
    setBidValue((document.getElementById("bidLabel")).value)
  }

  return (
    <BidStickyEl>
      <LeftSection>
        <Info>
          {
            (auction.highestBid > 0) ?
              <div>
                <Title>Highest Bid <Eth fontSize='30px' style={{marginLeft: "40px", marginRight: "5px", alignSelf: "center"}}/>{auction.highestBid}</Title>
                <EditionEl>From <span style={{marginLeft: "30px", fontWeight: 100, fontSize: "0.9rem"}}>{auction.highestBidder}</span></EditionEl>
              </div>
              :
              <div>
                <Title>No Bidder <Eth fontSize='30px' style={{marginLeft: "20px", marginRight: "20px", alignSelf: "center"}}/><div style={{fontWeight: "200"}}>Be the first to Bid?</div></Title>
              </div>
          }
        </Info>
      </LeftSection>
      <RightSection>
        {(isDeposited) ? 
          <PlaceBidBtn onClick={() => {
          setisOpen(true)
          }}>Place bid</PlaceBidBtn>
          :
          <PlaceDepositBtn onClick={() => depositFetch()}>Place deposit</PlaceDepositBtn>
        }

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
                      numberMin: minimumBid
                    }}        
                    onChange={() => test()}
                    value={minimumBid}
                  />
                <ModalText>
                  HA-P charges 0% royalty for winner's full settlement
                </ModalText>
              </ModalContent>
              </Modal>
            </div>
          </Overlay>
        </Popup>
        <TextEl>Deposit equivalent to 1 USD must be placed before bidding</TextEl>
      </RightSection>
    </BidStickyEl>
  );
}