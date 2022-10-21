import React from 'react';
import { useCountdown } from '../../../hooks/useCountdown';
import DateTimeDisplay from '../styled/DateTimeDisplay';
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
`

const ExpiredEl = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    padding-top: 1.4rem;
    font-weight: 500;
`



const ExpiredNotice = () => {
    return (
      <ExpiredEl>
        Bidding session ended
      </ExpiredEl>
    );
};

const ShowCounter = ({ days, hours, minutes, seconds }) => {
return (
    <CounterEl>
        <DateTimeDisplay value={days} type={'DD'} isDanger={days <= 3} />
        <DateTimeDisplay value={hours} type={'HH'} isDanger={false} />
        <DateTimeDisplay value={minutes} type={'MM'} isDanger={false} />
        <DateTimeDisplay value={seconds} type={'SS'} isDanger={false} />
    </CounterEl>
);
};

const CountdownTimer = ({ targetDate }) => {
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

export default CountdownTimer;