const API_ID = '85bca05f-22ac-4e35-959c-51f5d8ae7c5b';

const Hypixel = require('hypixel-api-reborn');
const hypixel = new Hypixel.Client(API_ID);

const FireStore = require('./firestore');

let BazaarData = {};

let AHData = { auctions: [] };

let AwaitQueue = [];
let clientRef;

module.exports = {
    getBazaarData: async function () {
        await populateBazaarData();

        return BazaarData;
    },

    getAuctionData: function () {
        return AHData;
    },

    getMinPrice: async function (itemName, averageOver = 1, exact = false, rarity = undefined) {

        let reforges = ["GENTLE", "ODD", "FAST", "FAIR", "EPIC", "SHARP", "HEROIC", "SPICY", "LEGENDARY", "DIRTY", "GILDED", "WARPED", "BULKY", "SALTY", "TREACHEROUS", "STIFF", "LUCKY", "DEADLY", "FINE", "GRAND", "HASTY", "NEAT", "RAPID", "UNREAL", "AWKWARD", "RICH", "PRECISE", "HEADSTRONG", "CLEAN", "FIERCE", "HEAVY", "LIGHT", "MYTHIC", "PURE", "SMART", "TITANIC", "WISE", "PERFECT", "SPIKED", "RENOWNED", "CUBIC", "WARPED", "REINFORCED", "LOVING", "RIDICULOUS", "SUBMERGED", "JADED", "BIZARRE", "ITCHY", "OMINOUS", "PLEASANT", "PRETTY", "SHINY", "SIMPLE", "STRANGE", "VIVID", "GODLY", "DEMONIC", "FORCEFUL", "HURTFUL", "KEEN", "STRONG", "SUPERIOR", "UNPLEASANT", "ZEALOUS", "SILKY", "BLOODY", "SHADED", "SWEET", "FRUITFUL", "MAGNETIC", "REFINED", "BLESSED", "FLEET", "STELLAR", "MITHRAIC", "AUSPICIOUS", "HEATED", "AMBERED"];

        await populateBazaarData();

        let tag = itemName.replaceAll(' ', '_').toUpperCase();
        let tagSplit = tag.split('_');

        if (reforges.indexOf(tagSplit[0] == "⚚" ? tagSplit[1] : tagSplit[0]) >= 0) {
            tagSplit.splice(tagSplit[0] == "⚚" ? 1 : 0, 1);
        }

        if (tagSplit[tagSplit.length - 1].includes("✪")) {
            tagSplit.pop();
        }

        tag = tagSplit.join('_');

        itemName = tag.toLowerCase().replace("_", " ");

        if (BazaarData[tag]) {
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

    getItemBuyPrice: async function (key) {
        await populateBazaarData();

        return parseFloat(BazaarData[key].buySummary[0].pricePerUnit);
    },

    getItemSellPrice: async function (key) {
        await populateBazaarData();

        return parseFloat(BazaarData[key].sellSummary[0].pricePerUnit);
    },

    getItemData: async function(tag) {
        await populateBazaarData();

        return BazaarData[tag];
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

    initAuctionData: async (client) => {
        if (!clientRef) {
            clientRef = client;

            const Awaits = await FireStore.getCollectionAsObj("AwaitPrice");
            for (let i in Awaits) {
                AwaitQueue.push([Awaits[i].user, Awaits[i].name, Awaits[i].sign, Awaits[i].price, Awaits[i].timeStamp]);
            }
        }

        //console.log("Repopulating Auction Data...");
        AHData = await hypixel.getSkyblockAuctions().then(products => { return products; }).catch(console.log);
        //console.log("Auction Data repopulated.");

        for (let i = 0; i < AwaitQueue.length; i++) {
            let user = AwaitQueue[i][0];
            let itemName = AwaitQueue[i][1];
            let sign = AwaitQueue[i][2];
            let price = AwaitQueue[i][3];

            let itemPrice = await module.exports.getMinPrice(itemName);

            if (sign == ">" ? (price < itemPrice) : (price > itemPrice)) {
                try {
                    clientRef.users.cache.get(user).send("`" + itemName + "` has " + (sign == ">" ? " risen above `$" : " dropped below `$") + price.toLocaleString() + "`!");
                    FireStore.deleteEntry("AwaitPrice", AwaitQueue[i][4]);
                    AwaitQueue.splice(i, 1);
                    i--;
                    continue;
                }
                catch (e) { console.log("User hasn't spoken since restart"); } 
            }

            if (Date.now() - AwaitQueue[i][4] > 6 * 60 * 60 * 1000) {
                FireStore.deleteEntry("AwaitPrice", AwaitQueue[i][4]); 
                AwaitQueue.splice(i, 1);
                i--;
            }
        }

        //Create slow infinite loop to just make sure that the data is up to date. Can't do an await like with BZ cause this takes like 20s to finish the API call lol
        setTimeout(module.exports.initAuctionData, 10000);
    },

    addAwaitInternal: (user, itemName, sign, price, age) => {
        AwaitQueue.push([user, itemName, sign, price, age]);
    }

}


let lastUpdatedBZ = 0;
async function populateBazaarData() {
    if (Date.now() - lastUpdatedBZ > 10000) {
        //console.log("Repopulating Bazaar Data...");
        let bzData = await hypixel.getSkyblockBazaar().then(products => { return products; }).catch(console.log);

        BazaarData = {};

        for (let i in bzData) {
            BazaarData[bzData[i].productId] = bzData[i];
        }

        lastUpdatedBZ = Date.now();
    }
}

