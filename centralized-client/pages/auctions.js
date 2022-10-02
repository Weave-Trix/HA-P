import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";

const IndexEl = styled.div`
`;

export default function Index() {
// TODO: Show all bidding auctions
// TODO: Show all upcoming vehicles

// TODO: index events off-chain and then read form database
// TODO: setup a self-hosted server to listen for on-chain events to be fired, and add tehm to a database to query
  return (
    <IndexEl>
      <Head>
        <title>HA-P auctions</title>
        <meta name="HA-P auctions" content="A list of all available auctions." />
        
      </Head>
    </IndexEl>
  );
}