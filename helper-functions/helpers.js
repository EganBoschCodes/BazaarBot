const { MessageEmbed } = require('discord.js');

const HypixelAPIHandler = require('../api-handler/api-tools');
const FireStore = require('../api-handler/firestore');

const ChartJSImage = require('chart.js-image');

let CommandRegistry = {};
let SettingsRegistry = {};
let CraftingRegistry = {};

let updateTimer = Date.now();

module.exports = {

    getCommands () {
        return CommandRegistry;
    },

    cleanRound (num, dec) {
        return Math.floor(num * Math.pow(10, dec)) / Math.pow(10, dec);
    },

    registerCommand (trigger, description, callback) {
        CommandRegistry[trigger] = new Command(trigger, description, callback);
    },

    getCommand (trigger) {
        return CommandRegistry[trigger];
    },

    registerSubCommand (mainTrigger, subTrigger, description, callback) {
        CommandRegistry[mainTrigger].subCommands[subTrigger] = new Command(subTrigger, description, callback);
        CommandRegistry[mainTrigger].usesSubCommands = true;
    },

    getSubCommand (trigger, subTrigger) {
        return CommandRegistry[trigger].subCommands[subTrigger];
    },

    niceCapitalize(text) {
        let niceText = "";
        text.split(" ").forEach((a) => { niceText += a[0].toUpperCase() + a.substring(1, a.length).toLowerCase() + " "; });
        return niceText.substring(0, niceText.length - 1);
    },

    tagToName (text) {
        let niceName = "";
        let nameSplit = text.split('_');
        for (let b in nameSplit) {
            niceName += this.niceCapitalize(nameSplit[b]) + " ";
        }
        return niceName.substring(0, niceName.length - 1);
    },

    nameToTag(name) {
        return name.toUpperCase().replaceAll(' ', '_');
    },

    getEmbed() {
        return new MessageEmbed()
            .setColor('#aa7700')
            .setTimestamp()
            .setFooter("Created by BoschMods", 'https://cravatar.eu/helmhead/BoschMods/68.png');
    },

    sbNumberFormat(input) {
        if (!input) { return -1;}
        input = input.replaceAll(',', '');

        let parsed = parseFloat(input, 10);
        if (isNaN(parsed)) { return -1; }

        let isNormalNumber = ("" + parsed) == input;

        if (isNormalNumber) {
            return parsed;
        }

        let prefix = parseFloat(input.substring(0, input.length - 1), 10);
        let isNormalPrefix = ("" + prefix) == input.substring(0, input.length - 1);

        if (isNormalPrefix) {
            let finalChar = input[input.length - 1];
            if (finalChar == 'k') {
                return prefix * 1000;
            }
            if (finalChar == 'm') {
                return prefix * 1000000;
            }
            if (finalChar == 'b') {
                return prefix * 1000000000;
            }
        }

        return -1;
    },

    throwError(channel, title, content) {
        let embed = this.getEmbed().setTitle("" + title).setDescription("" + content).setThumbnail("https://www.freeiconspng.com/thumbs/error-icon/error-icon-32.png");

        channel.send({ embeds: [embed] });
    },

    registerRecipe(recipe, output, exact = false) {
        let tag = output.split(" ")[0];
        let rarity = output.split(" ")[1];
        let recipeSplit = recipe.split(' ');
        let shoppingList = [];

        for (let i = 0; i < recipeSplit.length; i += 2) {
            shoppingList.push([recipeSplit[i], parseInt(recipeSplit[i + 1])]);
        }

        CraftingRegistry[tag] = {
            input: shoppingList,
            output: tag,
            rarity: rarity,
            exact: exact
        };
    },

    getRecipes() {
        return CraftingRegistry;
    },

    async initSettings(username) {

        //DEFAULT SETTINGS
        SettingsRegistry[username] = {
            minBZVolume: 700000,
            minBZPrice: 1000,
            ahSortMode: 0,
            ahRangeMin: 500000,
            ahRangeMax: 1000000000
        }

        let userdata = await FireStore.get("UserSettings", username);

        if (userdata) {
            for (let i in userdata) {
                SettingsRegistry[username][i] = userdata[i];
            }
        }

        module.exports.saveSettings(username);

    },

    setVariable(id, key, val) {
        SettingsRegistry[id][key] = val;
        module.exports.saveSettings(id);
    },

    getVariable(id, key) {
        console.log(id + " " + key);
        return SettingsRegistry[id][key];
    },

    getSettings(username) {
        return SettingsRegistry[username];
    },

    saveSettings: async (username) => {
        await FireStore.set("UserSettings", username, module.exports.getSettings(username));
    },

    firebasifyBZData(bzData) {
        let obj = {};
        for (let i in bzData) {
            let attribute = {};
            if (bzData[i].buySummary[0]) {
                attribute.maxBuyPrice = bzData[i].buySummary[0].pricePerUnit;
                attribute.avgBuyPrice = bzData[i].buySummary[0].pricePerUnit;
                attribute.minBuyPrice = bzData[i].buySummary[0].pricePerUnit;
            }
            if (bzData[i].sellSummary[0]) {
                attribute.maxSellPrice = bzData[i].sellSummary[0].pricePerUnit;
                attribute.avgSellPrice = bzData[i].sellSummary[0].pricePerUnit;
                attribute.minSellPrice = bzData[i].sellSummary[0].pricePerUnit;
            }
            obj[i] = attribute;
        }
        obj.timeStamp = Date.now();
        return obj;
    },

    initBazaarUpdate() {
        let currentTime = Date.now();
        let trigger10m = (currentTime % 600000) < (updateTimer % 600000);
        let trigger60m = (currentTime % 3600000) < (updateTimer % 3600000);
        updateTimer = currentTime;
        if (trigger10m) {
            module.exports.updateBZData10Min();
        }

        setTimeout(module.exports.initBazaarUpdate, 5000);
    },

    async updateBZData10Min() {
        let bzData = await HypixelAPIHandler.getBazaarData();
        let obj = module.exports.firebasifyBZData(bzData);
        const collectionRef = await FireStore.getCollection("BazaarTenMin");
        await collectionRef.doc("" + Date.now()).set(obj);
        console.log("BAZAAR DATA UPDATED - 10m");


        const snapshot = await collectionRef.orderBy('timeStamp').limit(2).get();
        snapshot.forEach(async doc => {
            let age = (Date.now() - doc.id) / 600000;
            if (age > 24) {
                console.log("Deleting: " + doc.id)
                const res = await collectionRef.doc(doc.id).delete();
            }
        });
    },

    async updateBZDataHour() {
        const tenMinRef = await FireStore.getCollection("BazaarTenMin");
        const hourlyRef = await FireStore.getCollection("BazaarHourly");
        console.log("BAZAAR DATA UPDATED - 1h");


        const lastHour = await tenMinRef.orderBy('timeStamp', 'desc').limit(6).get();
        let bzDataArr = [];
        let counter = 0;
        await lastHour.forEach(async doc => {
            let docdata = await tenMinRef.doc(doc.id).get();
            counter++;
            bzDataArr.push(docdata.data());
        });
        while (counter < lastHour.size) { await module.exports.sleep(10); }
        let hourlyAverageData = module.exports.averageObjs(bzDataArr);
        await hourlyRef.doc("" + Date.now()).set(hourlyAverageData);


        const snapshot = await hourlyRef.orderBy('timeStamp').limit(2).get();
        snapshot.forEach(async doc => {
            let age = (Date.now() - doc.id) / 3600000;
            console.log(doc.id)
            if (age > 24) {
                console.log("Deleting Hourly Document: " + doc.id)
                const res = await hourlyRef.doc(doc.id).delete();
            }
        });
    },

    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    averageObjs: (objArr) => {
        let retObj = {};
        for (let i in objArr[0]) {
            if (typeof objArr[0][i] == 'number') {
                retObj[i] = 0;
                let div = 0;
                for (let b in objArr) {
                    if (objArr[b]) {
                        retObj[i] += objArr[b][i];
                        div++;
                    }
                }
                retObj[i] /= div;
            }
            else if (objArr[0][i] instanceof Object) {
                let buyMax = 0;
                let buyMin = Infinity;
                let buyAvg = 0;
                let sellMax = 0;
                let sellMin = Infinity;
                let sellAvg = 0;
                let div = 0;
                for (let b in objArr) {
                    buyMax = Math.max(buyMax, objArr[b].maxBuyPrice);
                    buyMin = Math.min(buyMin, objArr[b].minBuyPrice);
                    buyAvg += objArr[b].avgBuyPrice;

                    sellMax = Math.max(sellMax, objArr[b].maxSellPrice);
                    sellMin = Math.min(sellMin, objArr[b].minSellPrice);
                    sellAvg += objArr[b].avgSellPrice;
                    div++;
                }
                retObj[i] = {
                    minBuyPrice: buyMin,
                    avgBuyPrice: buyAvg / div,
                    maxBuyPrice: buyMax,
                    minSellPrice: sellMin,
                    avgSellPrice: sellAvg / div,
                    maxSellPrice: sellMax,
                };
            }
        }
        return retObj;
    },

    getGraphURL: async (collectionName, tagName) => {
        let chartData = {
            type: "line",
            data: {
                "labels": [],
                datasets: [
                    {
                        label: module.exports.tagToName(tagName) + " Buy Price",
                        borderColor: "rgb(255,+99,+132)",
                        backgroundColor: "rgba(0,0,0,0)",
                        data: []
                    },
                    {
                        label: module.exports.tagToName(tagName) + " Sell Price",
                        borderColor: "rgb(75,+192,+192)",
                        backgroundColor: "rgba(0,0,0,0)",
                        data: []
                    }]
            },
            options: {
                title: {
                    display: true,
                    text: module.exports.tagToName(tagName) + " Price History"
                },
                "scales": {
                    "xAxes": [
                        {
                            "scaleLabel": {
                                "display": false,
                                "labelString": "Time"
                            }
                        }
                    ],
                    "yAxes": [
                        {
                            "stacked": false,
                            "scaleLabel": {
                                "display": true,
                                "labelString": "Value"
                            }
                        }
                    ]
                }
            }
        }

        const collectionRef = await FireStore.getCollection(collectionName);
        const datapoints = await collectionRef.orderBy('timeStamp', 'desc').limit(20).get();
        let bzDataArr = [];
        let counter = 0;
        await datapoints.forEach(async doc => {
            let docdata = await collectionRef.doc(doc.id).get();
            bzDataArr.push(docdata.data());
            counter++;
        });
        while (counter < datapoints.size) { await module.exports.sleep(10); }
        console.log("CHECKPOINT");

        bzDataArr.sort((a, b) => { return a.timeStamp - b.timeStamp; });
        for (let i = bzDataArr.length - 1; i >= 0; i--) {
            chartData.data.datasets[0].data.push(module.exports.cleanRound(bzDataArr[i][tagName].avgBuyPrice, 1));
            chartData.data.datasets[1].data.push(module.exports.cleanRound(bzDataArr[i][tagName].avgSellPrice, 1));

            
            chartData.data.labels.push("");
        }
        console.log(chartData.data.datasets[0].data);
        console.log(chartData.data.datasets[1].data);
        const line_chart = ChartJSImage().chart(chartData).backgroundColor('white').width(500).height(300);
        return await line_chart.toURL();

    },

    addAwait: async (user, itemName, sign, price) => {
        let time = Date.now();
        let awaitObj = {
            user: user,
            name: itemName,
            sign: sign,
            price: price,
            timeStamp: Date.now()
        }

        FireStore.set("AwaitPrice", time, awaitObj);

        HypixelAPIHandler.addAwaitInternal(user, itemName, sign, price, Date.now());
    }
    
}

function Command(trigger, description, callback) { 
    this.callback = callback;
    this.getTrigger = function () {
        return trigger.toLowerCase();
    };
    this.getTitle = function () {
        return module.exports.niceCapitalize(trigger);
    };
    this.getDescription = function () {
        return description;
    };
    this.usesSubCommands = false;
    this.subCommands = {};
};
