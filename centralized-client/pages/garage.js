import React, { useState, useEffect } from 'react';
import Web3 from "web3";
import styled from "styled-components";
import Pagination from '@mui/material/Pagination';
import { Colors } from "../next/Theme";
import GarageList from '../next/components/Garage/GarageList';
import NoWeb3 from "../next/components/NoWeb3"
import {
    useMoralis,
    useMoralisQuery,
    useMoralisSubscription, 
    MoralisProvider,
    useWeb3ExecuteFunction
  } from "react-moralis";

const Article = styled.article`
    margin-bottom: 2rem;
    margin-left: 15%;
    margin-right: 15%;
`;

const Title = styled.h1`
    margin-top: 2.5rem;
    font-size: 2.5rem;
    font-weight: 500;
    color: ${Colors.Primary};
    text-align: center;
    margin-bottom: 5rem;
`;

const Bottom = styled.div`
    display: flex;
    justify-content: center;
`
const PaginationHolder = styled.div`
    margin-top: 2rem;
    padding-left: 2rem;
    padding-right: 2rem;
    padding-top: 5px;
    padding-bottom: 5px;
    border-radius: 50px;
    background-color: ${Colors.White};
`

const EmptyGarage = styled.h1`
  font-size: 2rem;
  font-weight: 400;
  color: ${Colors.White};
  text-align: center;
  margin-top: 20vh;
`;

export default function garage() {
    const itemPerPage = 5;
    // query ListNftRecords, equalTo (active = True, owner = Account)

    /* useState */
    const [yourGarage, setYourGarage] = useState([]);
    const [page, setPage] = useState(1);
    const [indexStart, setIndexStart] = useState(0);
    const [indexEnd, setIndexEnd] = useState(1 * itemPerPage);
    const [paginatedList, setPaginatedList] = useState([]);
    const { Moralis, isInitialized, isWeb3Enabled, account, ...rest } = useMoralis();

    /* useEffect */
    useEffect(() => {
        updatePaginatedList();
    }, [])
    useEffect(() => {
        if(isWeb3Enabled) {
            fetchGarage();
        }
    }, [MoralisProvider, account])

    useEffect(() => {
        updatePaginatedList();
    }, [indexStart, yourGarage])

    function updatePaginatedList() {
        setPaginatedList(yourGarage.slice(indexStart, indexEnd))
    }

    const fetchGarage = async (e) => {
        const query = new Moralis.Query("ListNftRecords");
        query.equalTo("active", true);
        query.equalTo("owner", account);
        query.descending("updatedAt");
        const queryRes = await query.find();
        const temp_yourGarage = [];
        queryRes.map((vehicle) => {
            temp_yourGarage.push(vehicle.attributes);
        })
        setYourGarage(temp_yourGarage);
    }

    return (
        <div>
        {isWeb3Enabled? (
            <div>
                <Article>
                    <Title>My Garage</Title>
                    {(yourGarage.length > 0) ?
                        <div>
                        {
                            paginatedList.map((vehicle) => {
                                return(
                                    <GarageList props={vehicle}/>
                                )
                            })
                        }
                        <Bottom>
                            <PaginationHolder>
                                <Pagination count={Math.ceil(yourGarage.length/itemPerPage)} onChange={
                                    (event, value) => {
                                        setPage(value);
                                        if (yourGarage.length > 0) {
                                            const indexStart = ((value - 1) * itemPerPage);
                                            const indexEnd = (value * itemPerPage);
                                            setIndexStart(indexStart);
                                            setIndexEnd(indexEnd);
                                            console.log(`Start: ${indexStart}`);
                                            console.log(`End: ${indexEnd}`);
                                        }
                                    }
                                } />
                            </PaginationHolder>
                        </Bottom>
                        </div>
                        :
                        <EmptyGarage>Seems like your garage is empty, emp-t, em-t, m-t</EmptyGarage>
                    }
                </Article>
            </div>
        )
        :
            <NoWeb3 props="My Garage"/>
        }
        </div>
    )
}