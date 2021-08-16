const { MessageEmbed } = require('discord.js');

let CommandRegistry = {};
let VariableRegistry = new Map();

let CraftingRegistry = {};

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

    setVariable (key, val) {
        VariableRegistry.set(key, val);
    },

    getVariable (key) {
        if (VariableRegistry.has(key)) {
            return VariableRegistry.get(key);
        }
        return false;
    },

    getEmbed() {
        return new MessageEmbed()
            .setColor('#aa7700')
            .setTimestamp()
            .setFooter("Created by BoschMods", 'https://cravatar.eu/helmhead/BoschMods/68.png');
    },

    sbNumberFormat(input) {

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

    registerRecipe(recipe, output) {
        let recipeSplit = recipe.split(' ');
        let shoppingList = [];

        for (let i = 0; i < recipeSplit.length; i += 2) {
            shoppingList.push([recipeSplit[i], parseInt(recipeSplit[i + 1])]);
        }

        CraftingRegistry[output] = {
            input: shoppingList,
            output: output
        };
    },

    getRecipes() {
        return CraftingRegistry;
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
