import React, { useState, useEffect } from 'react'
import styled from "styled-components";
import { BsChevronUp, BsChevronDown, BsChevronRight } from "react-icons/bs";
import {useMoralis} from "react-moralis";
import { Colors } from "../../Theme";
import {
  useMoralisQuery
} from "react-moralis";

const EditionSelectorEl = styled.article`
  display: flex;
  border: 1px solid ${Colors.Border};
  align-items: center;
  gap: 1rem;
  height: 4.2rem;
  padding-left: 1rem;
  padding-right: 1rem;
  border-radius: 8px;
`;
const BtnContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
const TopBtn = styled.span`
  cursor: pointer;
  width: 2rem;
  height: 2rem;
  border-right: 1px solid ${Colors.Border};
  border-bottom: 1px solid ${Colors.Border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
`;
const BottomBtn = styled(TopBtn)`
  border-bottom: none;
`;
const EdInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;
const EditionLabel = styled.span`
  font-weight: 500;
  margin-bottom: 6px;
`;

const MintDate = styled.span`
  color: ${Colors.Gray};
  font-size: 0.9rem;
`;
const SelectEdition = styled.a`
  color: ${Colors.Primary};
  font-size: 0.95rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

export default function EditionSelector({ nft }) {
  const { Moralis, isInitialized, isWeb3Enabled, account, ...rest } = useMoralis();

  const { data: nftData, isLoading, isFetching } = useMoralisQuery(
    "LognftmintedLogs",
    (query) => query.equalTo("tokenId", String(nft.tokenId)).descending("createdAt"),
    [nft],
    { live: true }
);

  return (
    <EditionSelectorEl>
      <EdInfo>
        <EditionLabel>Vehicle NFT #{nft.tokenId}</EditionLabel>
        <MintDate>Date minted : {(nftData.length > 0) && nftData[0].attributes.createdAt.toLocaleString()}</MintDate>
      </EdInfo>
      <SelectEdition href="#">
        view on Etherscan <BsChevronRight />
      </SelectEdition>
    </EditionSelectorEl>
  );
}