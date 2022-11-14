import { useMoralis } from 'react-moralis';
import Moralis from 'moralis-v1';
import { Button, ENSAvatar } from 'web3uikit';
import { useState, useEffect } from 'react'

export const ConnectButton = () => {
  const { authenticate, enableWeb3, isWeb3Enabled, account } = useMoralis();
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() =>{
    enableWeb3();
  }, [])

  useEffect(() => {
    if (account) {
      setAuthenticated(true);
    }
  }, [isWeb3Enabled])

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

  const handleAuth = async (provider) => {
    try {
      setAuthError(null);
      setIsAuthenticating(true);

      // Enable web3 to get user address and chain
      await enableWeb3({ throwOnError: true, provider });
      const { account, chainId } = Moralis;

      if (!account) {
        throw new Error('Connecting to chain failed, as no connected account was found');
      }
      if (!chainId) {
        throw new Error('Connecting to chain failed, as no connected chain was found');
      }

      // Get message to sign from the auth api
      const { message } = await Moralis.Cloud.run('requestMessage', {
        address: account,
        chain: parseInt(chainId, 16),
        network: 'evm',
      });

      // Authenticate and login via parse
      await Moralis.authenticate({
        signingMessage: message,
        throwOnError: true,
      });
      setAuthenticated(true);

    } catch (error) {
      setAuthError(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async() => {
    try {
      setAuthenticated(false);
      await Moralis.User.logOut();
    } catch (error) {
      console.log(`logOut failed`, error);
    }
  }

  if (account) {  console.log(truncateStr(account, 15)); }

    return (
      <div style={{backgroundColor: `${ authenticated ? "#e1f1f7" : "#ffffff"}`, padding: "5px", paddingLeft: "10px", paddingRight: "10px", borderRadius: "15px", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center"}}>
        { authenticated && <ENSAvatar address={account} size={35} /> }
        { authenticated && <div style={{width: "9px"}}/> }
        <Button 
          size="large"
          onClick={() => {
            authenticated ?
              logout()
              :
              handleAuth("metamask")}}
          text= { authenticated ? truncateStr(account, 20) : "Connect to Ethereum"}
        />
      </div>
    )
}