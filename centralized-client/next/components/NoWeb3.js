import styled from "styled-components";
import { Colors, Devices } from "../Theme";

const NoMetamask = styled.h1`
  font-size: 2rem;
  font-weight: 400;
  color: ${Colors.White};
  text-align: center;
  margin-top: 30vh;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 500;
  color: ${Colors.Primary};
  text-align: center;
`;

const Article = styled.article`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  @media ${Devices.Tablet} {
    padding: 1rem 3rem;
  }
  @media ${Devices.Laptop} {
    padding: 1rem 5%;
  }
  @media ${Devices.LaptopL} {
    padding: 1rem 10%;
  }
`;

export default function NoWeb3({props}) {
    return (
        <Article>
            <Title>{props}</Title>
            <NoMetamask>Please connect to MetaMask</NoMetamask>
        </Article>
    ) 
}