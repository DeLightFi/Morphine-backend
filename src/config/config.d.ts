export type MorphineConfig = {
    server: any,
    network: string,
    apibaraUrl: string,
    jobs: {
        interval: { [key: string]: string }
    },
    pools: {name:string, address:string}[],
    fetchers: { [key: string]: any }
    dataProvider: any,
    registry: any,
    multicall: any,
}