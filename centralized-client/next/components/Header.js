import React, { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { CgSearch } from "react-icons/cg";
import { IoClose } from "react-icons/io5";
import SearchBar from "./Header/SearchBar";
import styled from "styled-components";
import { Colors, Devices } from "../Theme";
import SearchBarMobile from "./Header/SearchBarMobile";
import { ConnectButton } from "web3uikit";

const HeaderEl = styled.header`
  z-index: 10;
  display: flex;
  color: ${Colors.White};
  width: 100%;
  align-items: center;
  height: 10%;
  gap: 1rem;
  padding: 0.6rem 1rem;
  top: 0;
  background-color: ${Colors.Background};
  position: sticky;
  svg {
    font-size: 2rem;
    cursor: pointer;
  }
  @media ${Devices.Laptop} {
    padding: 1rem 1.5rem;
  }
`;
const Center = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const LogoText = styled.a`
  font-size: 1.3rem;
  font-weight: 500;
  border-left: 1px solid ${Colors.Gray};
  padding-left: 1rem;
  display: none;
  @media ${Devices.Laptop, Devices.Tablet} {
    display: block;
  }
`;

const LogoBg = styled.div`
  background-color: ${Colors.White};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  margin-left: 9px;
  @media ${Devices.Laptop} {
    margin-left: 1rem;
    margin-right: 0.6rem;
  }
`;
const Logo = styled.img`
  width: 90%;
  height: 90%;
  @media ${Devices.Laptop} {
    display: block;
  }
`;

const Nav = styled.nav`
  margin-left: auto;
  border-right: 1px solid ${Colors.Gray};
  padding-right: 1rem;
  display: none;
  ul {
    display: flex;
    align-items: center;
    list-style: none;
    gap: 1rem;
  }
  @media ${Devices.Laptop} {
    display: block;
  }
`;

const NavItem = styled.a`
  font-size: 1rem;
  font-weight: 400;
`;

const SearchIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  @media ${Devices.Laptop} {
    display: none;
  }
  height: 26px;
  width: 26px;
`;

const MenuIcon = styled(SearchIcon)`
  height: 26px;
  width: 26px;
`;

export default function Header({ mobileMenu }) {
  const { MobileMenuIsOpen, setMobileMenuIsOpen } = mobileMenu;
  const [SearchIsOpen, setSearchIsOpen] = useState(false);

  function toggleMenu() {
    setMobileMenuIsOpen(!MobileMenuIsOpen);
  }

  return (
    <HeaderEl>
      <MenuIcon>
        {MobileMenuIsOpen ? (
          <IoClose
            style={{ fontSIze: "'2.5rem" }}
            color={Colors.Primary}
            onClick={() => toggleMenu()}
          />
        ) : (
          <FiMenu onClick={() => toggleMenu()} />
        )}
      </MenuIcon>
      <Center>
        <a href="/">
            <LogoBg>
                <Logo src="/trix-logo.png" />
            </LogoBg>
        </a>
        <LogoText href="/">Weave-Trix</LogoText>
        <Nav>
          <ul>
            <li>
              <NavItem href="/auctions">Auctions</NavItem>
            </li>
            <li>
              <NavItem href="#">Bids</NavItem>
            </li>
            <li>
              <NavItem href="#">Garage</NavItem>
            </li>
            <li>
              <NavItem href="#">Wallet</NavItem>
            </li>
          </ul>
        </Nav>
      </Center>
      {SearchIsOpen ? (
        <SearchBarMobile
          SearchIsOpen={SearchIsOpen}
          setSearchIsOpen={setSearchIsOpen}
        />
      ) : (
        ""
      )}
      <ConnectButton size="small"/>
      <SearchIcon>
        {SearchIsOpen ? (
          ""
        ) : (
          <CgSearch
            onClick={() => {
              setSearchIsOpen(!SearchIsOpen);
            }}
          />
        )}
      </SearchIcon>
    </HeaderEl>
  );
  s;
}
