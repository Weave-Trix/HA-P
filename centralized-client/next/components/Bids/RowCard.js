import * as React from 'react';
import AspectRatio from '@mui/joy/AspectRatio';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import CardOverflow from '@mui/joy/CardOverflow';
import Divider from '@mui/joy/Divider';
import Typography from '@mui/joy/Typography';

export default function RowCard({props}) {
    console.log(`rendering NFT card, tokenID : ${props.tokenId} status: ${props.status}`)
    console.log(props);
    const truncateStr = (fullStr, strLen) => {
        if (fullStr.length <= strLen) return fullStr;
        const separator = "...";
        const charsToShow = strLen - separator.length;
        const frontChars = Math.ceil(charsToShow / 2);
        const backChars = Math.floor(charsToShow / 2);
        return (
          fullStr.substring(0, frontChars) +
          separator +
          fullStr.substring(fullStr.length - backChars)
        );
      };
    
    // set state color
    let color;

    switch(props.status) {
        case 1: // BIDDING
            color = "plum";
            break;
        case 2: // VERIFYING_WINNER
            color = "pink";
            break;
        case 3: // PENDING_PAYMENT
            color = "lightblue";
            break;
        case 4: // PENDING_AUDIT
            color = "lightgreen"
            break;
        case 5: // CLOSED_AUCTION
            color = "lightslategrey"
            break;
    }

  return (
    <Card row sx={{ width: 360, bgcolor: "#e8e8e8" }}>
      <CardOverflow>
        <AspectRatio ratio="4/3" sx={{ width: 114 }}>
          <img
            src={props.nftImage}
            loading="lazy"
            alt=""
          />
        </AspectRatio>
      </CardOverflow>
      <CardContent sx={{ px: 2 }}>
        <Typography fontSize="0.9rem" fontWeight="md" textColor="black" mb={0.5}>
          {props.nftName}
        </Typography>
        <Typography fontSize="0.68rem" level="body2">{truncateStr(props.nftContractAddress, 19)}</Typography>
      </CardContent>
      <Divider />
      <CardOverflow
        variant="soft"
        style={{backgroundColor: color}}
        sx={{
          px: 0.2,
          writingMode: 'vertical-rl',
          textAlign: 'center',
          fontSize: 'xs2',
          fontWeight: 'xl2',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: "white"
        }}
      >
        {props.tokenSymbol + " " + props.tokenId}
      </CardOverflow>
    </Card>
  );
}
