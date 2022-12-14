import styled from "styled-components";
import { CgSearch } from "react-icons/cg";
import { Colors, Devices } from "../../Theme";

const SearchBarEl = styled.article`
  background-color: ${Colors.Background};
  padding: 1rem 2rem;
  gap: 0.5rem;
  height: 100%;
  width: 100%;
  position: absolute;
  left: 0;
  top: 0;
  flex: 1;
  align-items: center;
  display: flex;
  @media ${Devices.Laptop} {
    display: none;
  }
`;

const SearchBarBg = styled.div`
  background-color: ${Colors.White};
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  border-radius: 20px;
  padding: 0.5rem 0.7rem;
  svg {
    font-size: 1.5rem;
    color: ${Colors.Primary};
  }
`;

const SearchInput = styled.input`
  border: none;
  font-size: 1.15rem;
  flex: 1;
  :focus {
    outline: none;
  }
`;

const HideSearchBar = styled.span`
    margin-left: 1rem;
    cursor: pointer;
    color: ${Colors.White};
`;

export default function SearchBarMobile({ setSearchIsOpen }) {
  return (
    <SearchBarEl>
      <SearchBarBg>
        <CgSearch />
        <SearchInput placeholder="Search vehicles" />
      </SearchBarBg>
      <HideSearchBar
        onClick={() => {
          setSearchIsOpen(false);
        }}
      >
        Hide
      </HideSearchBar>
    </SearchBarEl>
  );
}