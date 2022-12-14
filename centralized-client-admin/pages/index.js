import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";
import { useMoralis } from 'react-moralis';

const IndexEl = styled.div`
`;

export default function Index() {
  const { isWeb3Enabled, account, Moralis } = useMoralis();
  console.log(isWeb3Enabled)
  return (
    <IndexEl>
      <Head>
        <title>HA-P</title>
        <meta name="description" content="Generated by create next app" />
      </Head>
    </IndexEl>
  );
}