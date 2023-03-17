import { addAddressPadding } from "starknet";


const config = {
    appName: 'morphine-backend-dev',

    network: "goerli-alpha-2",
    apibaraUrl: "goerli-2.starknet.a5a.ch:443",

    jobs: {
        interval: {
            poolEvents: "05 * * * *",
            poolValues: "23 * * * *",
            poolInterestRateModel: "20 * * * *",
            multicallEvents: "30 * * * *",
            activeDrips: "30 * * * *",
            dripsValues: "40 * * * *",
        }
    },

    pools: [
        {
            name: "Pool DAI",
            address: addAddressPadding("0x7e758f80c7f650d595e1e0920b4455cb241737afc86982fa81776439dfdd0af"),
        },
        {
            name: "Pool ETH",
            address: addAddressPadding("0x6d47fcc95b5e8cf99610d09ce98a5cde64dc154049490402dc5746b59d0df12"),
        },
        {
            name: "Pool BTC",
            address: addAddressPadding("0x14415ad1dff6f61b06664e892f49b567634d1f2cb8f2c9206a548963b41e0d"),
        },
    ],

    dataProvider: {
        address: addAddressPadding("0x045df424d84031f362cff94a67a348aff33de74870d694c6dc0e2a5b936e8058")
    },

    registry: {
        address: addAddressPadding("0x125488ac8537e3b858e9c1023d17d83a72866e79c3b9c23409e3e7c0c0b989c")
    },


    fetchers: {
        poolEvents: {
            eventNames: [
                "Withdraw",
                "Deposit",
                "Borrow",
                "RepayDebt"
            ]
        },

        poolValues: {
            minInterval: 5 * 60_000, // 5 min 
        },

        poolInterestRateModel: {
            minInterval: 5 * 60_000, // 5 min 
        },

        activeDrips: {
            eventNames: [
                "OpenDrip",
                "CloseDrip"
            ]
        },

        dripsValues: {
            minInterval: 5 * 60_000, // 5 min 
        },

        dripEvents: {
            eventNames: [
                "MultiCallStarted",
                // "MultiCallFinished",
            ]
        },

        multicall: {
            eventNames: [
                "MultiCallStarted",
                "MultiCallFinished",
                "AddCollateral",
                "IncreaseBorrowedAmount",
                "DecreaseBorrowedAmount",
                "Approval",
                "Transfer",
                "Reedem",
                "TokenEnable",
                "TokenDisable",
                "Deposit",
                "Withdraw",
                "Sync",
                "Swap"
            ]
        }
    },


}

export default config;




