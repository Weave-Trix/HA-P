import React from 'react';
import { useCountdown } from '../../../hooks/useCountdown';
import CompactDateTimeDisplay from '../styled/CompactDateTimeDisplay';
import styled from 'styled-components';
import { Colors } from '../../Theme';

const CounterEl = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    line-height: 1.4rem;
    padding-top: 0.6rem;
    padding-left: 2rem;
    padding-right: 2rem;
    background-image: linear-gradient(to right, lightpink, lightskyblue);
    border-radius: 50px;
`

const ExpiredEl = styled.div`
    display: flex;
    align-items: center;
    font-weight: 500;
`



const ExpiredNotice = () => {
    return (
      <ExpiredEl>
        Expired
      </ExpiredEl>
    );
};

const ShowCounter = ({ days, hours, minutes, seconds }) => {
return (
    <CounterEl>
        <CompactDateTimeDisplay value={days} type={'DD'} isDanger={days <= 3} />
        <CompactDateTimeDisplay value={hours} type={'HH'} isDanger={false} />
        <CompactDateTimeDisplay value={minutes} type={'MM'} isDanger={false} />
        <CompactDateTimeDisplay value={seconds} type={'SS'} isDanger={false} />
    </CounterEl>
);
};

const CompactCountdownTimer = ({ targetDate }) => {
  const [days, hours, minutes, seconds] = useCountdown(targetDate);

  if (days + hours + minutes + seconds <= 0) {
    return <ExpiredNotice />;
  } else {
    return (
      <ShowCounter
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
      />
    );
  }
};

export default CompactCountdownTimer;