// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract VOC is ERC721, ERC721Burnable {
    modifier onlyAuthority() {
        require(msg.sender == authority, "Unauthorized function access!");
        _;
    }

    modifier onlyVeheicleNotRegistered(string memory _chassisNum) {
        require(chassisNumToBool[_chassisNum] != true, "Vehicle already registered!");
        _;
    }

    event NftMinted(address indexed owner, string tokenURI, uint256 indexed tokenId);

    event NftBurned(address indexed owner, uint256 indexed tokenId);

    event NftTransferred(address indexed prev_Owner, address indexed curr_Owner, uint256 indexed tokenId);

    using Counters for Counters.Counter;
    address private authority;
    Counters.Counter private _tokenIds;
    mapping(uint256 => string) private tokenIdToTokenUri;
    mapping(string => bool) private chassisNumToBool;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        authority = msg.sender;
    }

    function registerVehicle(address _owner, string memory _tokenURI, string memory _chassisNum)
        public
        onlyAuthority
        onlyVeheicleNotRegistered(_chassisNum)
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

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override onlyAuthority {
        //solhint-disable-next-line max-line-length
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
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
}
