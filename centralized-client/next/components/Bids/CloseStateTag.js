import React from 'react';
import styled from 'styled-components';

const StatusTag = styled.div`
    padding-left: 14px;
    padding-right: 14px;
    padding-top: 5px;
    padding-bottom: 5px;
    color: white;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 700;
`

export default function CloseStateTag({props}) {
    // set state name, and color
    let name;
    let color;
    console.log(`rendering close state tag, props: ${props}`);

    switch(props) {
        case 0: // NOT_ENDED
            name = "processing";
            color = "plum";
            break;
        case 1: // CANCELED
            name = "canceled by seller";
            color = "lightslategrey";
            break;
        case 2: // NO_BIDDER
            name = "no bidder";
            color = "pink"
            break;
        case 3: // REJECTED_BY_SELLER
            name = "rejected by seller";
            color = "lightslategrey";
            break;
        case 4: // PAYMENT_OVERDUE
            name = "payment overdue";
            color = "red"
            break;
        case 5: // AUDIT_REJECTED
            name = "audit rejected";
            color = "red"
            break;
        case 6: // OWNERSHIP_TRANSFERRED
            name = "ownership transferred"
            color = "mediumspringgreen";
            break;
    }

    return (
        <StatusTag style={{backgroundColor: color}}>{name}</StatusTag>
    );
}