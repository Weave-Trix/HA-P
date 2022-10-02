import styled, { createGlobalStyle } from "styled-components";
import { Colors } from "../src/Theme";
import { useState } from "react";
import Header from "../src/components/Header";

const GlobalStyle = createGlobalStyle`
 
  html,
  body {
    background-color: ${Colors.Background};
    font-family: "Poppins", sans-serif;
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
    font-family: 'Urbanist', sans-serif;
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
const MobileMenu = styled.div``;
const NavItem = styled.a``;

function MyApp({ Component, pageProps }) {
  const [MobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  return (
    <>
      <GlobalStyle />
      <Main>
        <Header mobileMenu={{ MobileMenuIsOpen, setMobileMenuIsOpen }} />
        {/* header */}
        {/* page */}
        {/* footer */}
        <Component {...pageProps} />
      </Main>
    </>
  );
}

export default MyApp;
