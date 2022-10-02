// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract VehicleNft is ERC721, ERC721Burnable {
    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        authority = msg.sender;
    }

    modifier onlyAuthority() {
        require(msg.sender == authority, "Unauthorized function access!");
        _;
    }

    modifier onlyVehicleNotRegistered(string memory _chassisNum) {
        require(
            chassisNumToBool[_chassisNum] != true,
            "Vehicle already registered!"
        );
        _;
    }

    event NftMinted(
        address indexed owner,
        string tokenURI,
        uint256 indexed tokenId
    );

    event NftBurned(address indexed owner, uint256 indexed tokenId);

    event NftTransferred(
        address indexed prev_Owner,
        address indexed curr_Owner,
        uint256 indexed tokenId
    );

    using Counters for Counters.Counter;
    address private authority;
    Counters.Counter private _tokenIds;
    mapping(uint256 => string) private tokenIdToTokenUri;
    mapping(string => bool) private chassisNumToBool;

    function registerVehicle(
        address _owner,
        string memory _tokenURI,
        string memory _chassisNum
    )
        public
        onlyAuthority
        onlyVehicleNotRegistered(_chassisNum)
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 curr_tokenId = _tokenIds.current();
        tokenIdToTokenUri[curr_tokenId] = _tokenURI;
        _mint(_owner, curr_tokenId);
        chassisNumToBool[_chassisNum] = true;
        emit NftMinted(_owner, _tokenURI, curr_tokenId);

        return curr_tokenId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return tokenIdToTokenUri[tokenId];
    }

    function setAuditResult(address _auction, bool _valid)
        external
        onlyAuthority
    {
        (bool sent, ) = _auction.call(
            abi.encodeWithSignature("setAuditResult(bool)", _valid)
        );
        require(sent, "unable to send audit result");
        if (_valid) {
            (bool success, bytes memory data) = _auction.call(
                abi.encodeWithSignature("seller()")
            );
            require(success, "Unable to determine the contract type!");
            address seller = abi.decode(data, (address));

            (bool success_2, bytes memory data_2) = _auction.call(
                abi.encodeWithSignature("highestBidder()")
            );
            require(success_2, "Unable to determine the contract type!");
            address winner = abi.decode(data_2, (address));

            (bool success_3, bytes memory data_3) = _auction.call(
                abi.encodeWithSignature("tokenId()")
            );
            require(success_3, "Unable to determine the contract type!");
            uint256 tokenId = abi.decode(data_3, (uint256));

            transferFrom(seller, winner, tokenId);
        }
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override onlyAuthority {
        //solhint-disable-next-line max-line-length
        require(
            (_isApprovedOrOwner((_msgSender()), tokenId) ||
                (msg.sender == authority)),
            "ERC721: caller is not token owner or approved"
        );

        _transfer(from, to, tokenId);
        emit NftTransferred(from, to, tokenId);
    }

    function burn(uint256 tokenId) public virtual override onlyAuthority {
        //solhint-disable-next-line max-line-length
        _burn(tokenId);
        emit NftBurned(ownerOf(tokenId), tokenId);
    }

    function getAuthorityAddress() public view returns (address) {
        return authority;
    }
}
