/*
1. Seller can register a new vehicle by minting a vehicle NFT
2. Seller can host an auction for vehicles NFT that they own by creating a new BiddingHost contract
3. BiddingHost can call HAP to emit events 
    to record each bid, extend bid end time, end bid, and record pending payments
4. Chainlink Keeper is needed for automated end bid + refund deposit, lock contract + send deposit to HAP owner
*/
