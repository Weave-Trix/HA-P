import styled from "styled-components";
import { Devices } from "../../Theme";

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  @media ${Devices.Tablet} {
    grid-template-columns: 1fr 1fr;
  }
  @media ${Devices.Laptop} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export default Grid;