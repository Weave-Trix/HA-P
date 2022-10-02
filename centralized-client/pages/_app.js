import styled, { createGlobalStyle } from "styled-components";
import { Colors } from "../next/Theme";
import { useState } from "react";
import Header from "../next/components/Header";
import { MoralisProvider } from "react-moralis";
import Page from "../next/components/styled/Page.styled";

const GlobalStyle = createGlobalStyle`
 
  html,
  body {
    background-color: ${Colors.Background};
    font-family: 'Montserrat', sans-serif;
  }
  p,a,h1,h2,h3,h5,h6,div,span{
    /* color:${Colors.White}; */
    color: inherit;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  * {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    transition:all .3s;
    font-family: 'Montserrat', sans-serif;
  }
  /* width */
  body::-webkit-scrollbar {
    width: 5px;
  }
  /* Track */
  body::-webkit-scrollbar-track {
    background: #ffffff;
  }
  /* Handle */
  body::-webkit-scrollbar-thumb {
    background: #212121;
    border-radius: 20px;
  }
  /* Handle on hover */
  body::-webkit-scrollbar-thumb:hover {
    background: rgb(43, 43, 43);
  }
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
`;
const MobileMenu = styled.div`
  background-color: ${Colors.Background};
  color: ${Colors.White};
  z-index: ${(p) => (p.open ? "9" : "-1")};
  position: absolute;
  padding: 2rem 1rem 1rem 1.2rem;
  left: 0;
  display: flex;
  width: ${(p) => (p.open ? "100%" : "0")};
  height: 100%;
  ul {
    opacity: ${(p) => (p.open ? "1" : "0")};
    transition: all 0.1s ease-out;
    text-decoration: none;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
  }
`;

const NavItem = styled.a`
  font-size: 1.2rem;
  font-weight: 400;
`;

function MyApp({ Component, pageProps }) {
  const [MobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  return (
    <MoralisProvider initializeOnMount={false}>
      <GlobalStyle />
      <Main>
        <Header mobileMenu={{ MobileMenuIsOpen, setMobileMenuIsOpen }} />
        <Page>
          <MobileMenu open={MobileMenuIsOpen}>
            <ul>
              <li>
                <NavItem href="auctions">Auctions</NavItem>
              </li>
              <li>
                <NavItem href="#">Bids</NavItem>
              </li>
              <hr color={Colors.Primary} size="1" />
              <li>
                <NavItem href="#">Garage</NavItem>
              </li>
              <li>
                <NavItem href="#">Wallet</NavItem>
              </li>
            </ul>
          </MobileMenu>
          <Component {...pageProps} />
        </Page>
        {/* footer */}
      </Main>
    </MoralisProvider>
  );
}

export default MyApp;
