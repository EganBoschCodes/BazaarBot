const API_ID = '85bca05f-22ac-4e35-959c-51f5d8ae7c5b';

const Hypixel = require('hypixel-api-reborn');
const hypixel = new Hypixel.Client(API_ID);

var admin = require("firebase-admin");

var serviceAccount = require("../firebase-priv.json");

let BazaarData = new Map();
let BazaarItemsList = [];

let AHData = {auctions:[]};

module.exports = {
    getBazaarData: async function () {

        return hypixel.getSkyblockBazaar().then(products => {
            return products;
        }).catch(console.log);

    },

    getAuctionData: function () {
        return AHData;
    },

    getMinPrice: async function (itemName, averageOver = 1, exact = false, rarity = undefined) {

        let bzItems = await module.exports.getBazaarRoster(); 

        let tag = itemName.replaceAll(' ', '_').toUpperCase();

        if (BazaarItemsList.indexOf(tag) >= 0) {
            return module.exports.getItemSellPrice(tag);
        }

        itemName = itemName.replaceAll('_', ' ');

        let validAuctions = [];

        AHData.auctions.forEach((auction) => {
            if (auction.bin && auction.bids.length == 0 && (exact ? auction.item.toLowerCase() == itemName.toLowerCase() : auction.item.toLowerCase().includes(itemName.toLowerCase())) && (rarity ? rarity == auction.rarity : true)) {
                validAuctions.push(auction);
            }
        });

        validAuctions.sort((a, b) => { return a.startingBid - b.startingBid; });

        let numChecked = Math.min(averageOver, validAuctions.length);
        let price = 0;
        for (let i = 0; i < numChecked; i++) {
            price += validAuctions[i].startingBid / numChecked;
        }

        return validAuctions.length ? price : -1;
    },

    getBazaarMap: async function () {
        await populateBazaarData();

        return BazaarData;
    },

    getBazaarRoster: async function () {
        await populateBazaarData();

        return BazaarItemsList;
    },

    getItemBuyPrice: async function (key) {
        await populateBazaarData();

        return parseFloat(BazaarData.get(key).buySummary[0].pricePerUnit);
    },

    getItemSellPrice: async function (key) {
        await populateBazaarData();

        return parseFloat(BazaarData.get(key).sellSummary[0].pricePerUnit);
    },

    getItemData: async function(tag) {
        await populateBazaarData();

        return BazaarData.get(tag);
    },

    getGeneralPlayer: async function (username) {
        return await hypixel.getPlayer(username).then(player => { return player; }).catch(() => { return false; });
    },

    getSkyblockPlayer: async function (username, sbprofile) {
        let skyblockData = await hypixel.getSkyblockMember(username).then(player => { return player; }).catch(() => { return false; });

        if (!skyblockData) { return false; }

        let it = skyblockData.values();
        let lastSavedData;

        for (let profile; !(profile = it.next()).done;) {

            if (sbprofile) {
                if (profile.value.profileName.toLowerCase() == sbprofile.toLowerCase()) {
                    lastSavedData = profile.value;
                }
            }

            else {
                lastSavedData = lastSavedData ? lastSavedData : profile.value;
                if (lastSavedData.lastSave < profile.value.lastSave) {
                    lastSavedData = profile.value;
                }
            }

        }

        return sbprofile && !lastSavedData ? 0 : lastSavedData;
    },

    initAuctionData : async function () {
        //console.log("Repopulating Auction Data...");
        AHData = await hypixel.getSkyblockAuctions().then(products => { return products; }).catch(console.log);
        //console.log("Auction Data repopulated.");

        //Create slow infinite loop to just make sure that the data is up to date. Can't do an await like with BZ cause this takes like 20s to finish the API call lol
        setTimeout(module.exports.initAuctionData, 10000);
    },

    initFirebase: async function () {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://bazaar-bot-default-rtdb.firebaseio.com"
        });
    },

    testAddThing: async () => {
        let obj = {
            discord_id: 1,
            discord_username: "test",
            val_id: 2,
            fn_id: 3,
        };

        const res = await admin.firestore().collection('BazaarPriceHistory').doc("temp").set(obj);
    }
}


let lastUpdatedBZ = 0;
async function populateBazaarData() {
    if (Date.now() - lastUpdatedBZ > 10000) {
        //console.log("Repopulating Bazaar Data...");
        let bzData = await hypixel.getSkyblockBazaar().then(products => { return products; }).catch(console.log);

        BazaarData.clear();
        BazaarItemsList = [];

        for (let i in bzData) {
            BazaarData.set(bzData[i].productId, bzData[i]);
            BazaarItemsList.push(bzData[i].productId);
        }

        lastUpdatedBZ = Date.now();
    }
}

