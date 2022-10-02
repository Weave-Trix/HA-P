export interface RequestMessage {
    address: string;
    chain: string;
    network: string;
}
export declare function requestMessage({ address, chain, network }: {
    address: string;
    chain: string;
    network: 'evm';
}): Promise<string>;
