import React from 'react';
import styled from 'styled-components';

const DateEl = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`

const DateValue = styled.h3`
    font-size: 1.2em;
    font-weight: 500px;
`

const DateSymbol = styled.h4`
    font-size: 0.8em;
    font-weight: 400px;
`

const DateTimeDisplay = ({ value, type, isDanger }) => {
  return (
    <DateEl>
      <DateValue>{value}</DateValue>
      <DateSymbol>{type}</DateSymbol>
    </DateEl>
  );
};

export default DateTimeDisplay;
