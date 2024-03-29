﻿const dotenv = require('dotenv');
dotenv.config();

console.log(process.env.BOT_TOKEN);

const BOT_TOKEN = process.env.BOT_TOKEN;


const { Client, Intents } = require('discord.js');

const Helpers = require('./helper-functions/helpers');
const CommandFunctionality = require('./commands/command-callbacks');
const HypixelAPIHandler = require('./api-handler/api-tools');
const FireStore = require('./api-handler/firestore');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });


client.once('ready', async (message) => {

	/**
	 * HELP FUNCTION
	**/

	Helpers.registerCommand("help", "Prints out all possible commands and what they do.", CommandFunctionality.help);

	/**
	 * FIND PLAYER DATA FUNCTION
	**/

	Helpers.registerCommand("find", "Gives some basic information on a SkyBlock Player.", CommandFunctionality.findPlayerData);

	/**
	 * FIND BAZAAR FLIPS FUNCTION
	**/

	Helpers.registerCommand("bz", "Scans the market for some of the most profitable flips.", CommandFunctionality.directBazaarTradeList);

	/**
	 * FIND CRAFTING BASED BAZAAR FLIPS
	**/

	Helpers.registerSubCommand("bz", "craft", "Lists trades that are profitable by compacting unenchanted items.", CommandFunctionality.craftingBazaarTradeList);


	/**
	 * GET/SET FOR MINIMUM VOLUME AND PRICE FOR BZ COMMANDS.
	**/

	Helpers.registerSubCommand("bz", "minvolume", "This changes the minimum instant buy/sell volume acceptable.", CommandFunctionality.editBZMinVolume);
	Helpers.registerSubCommand("bz", "minprice", "This changes the minimum price per unit acceptable.", CommandFunctionality.editBZMinPrice);

	Helpers.registerSubCommand("bz", "settings", "Lists the bz command's settings and their values.", CommandFunctionality.listBZSettings);

	/**
	 * SEARCH PRICE DATA FOR SPECIFIC ITEM
	**/

	Helpers.registerCommand("price", "Prints the price of any specific item on the Bazaar or the Auction House.", CommandFunctionality.fetchItemPrice);

	/**
	 * SEARCH FOR VALUABLE AUCTION HOUSE FLIPS
	**/

	Helpers.registerCommand("ah", "Looks for items that are currently selling far lower than they usually do [HAVEN'T MAKE YET RELAX]", (client_, message) => { message.channel.send("Not done yet, try other commands!"); });
	Helpers.registerSubCommand("ah", "craft", "Finds items that are profitable to craft and resell on the Auction House.", CommandFunctionality.findAHCraftingFlips);


	Helpers.registerRecipe("EXP_SHARE_CORE 1 ENCHANTED_GOLD 72", "EXP_SHARE", exact = true);
	Helpers.registerRecipe("ENCHANTED_LAPIS_LAZULI_BLOCK 9", "EXPERIENCE_ARTIFACT");
	Helpers.registerRecipe("LUCKY_CLOVER_CORE 1 ENCHANTED_EMERALD 256", "LUCKY_CLOVER");
	Helpers.registerRecipe("ENCHANTED_EYE_OF_ENDER 32 NULL_OVOID 32 ENCHANTED_STRING 192 ENCHANTED_QUARTZ_BLOCK 32", "JUJU_SHORTBOW");
	Helpers.registerRecipe("ENCHANTED_COBBLESTONE 256", "HASTE_RING");
	Helpers.registerRecipe("WITHER_CATALYST 24", "CATACOMBS_EXPERT_RING");
	Helpers.registerRecipe("ANCIENT_ROSE 9", "FLOWER_OF_TRUTH");
	Helpers.registerRecipe("WITHER_HELMET 1 DIAMANTE'S_HANDLE 8", "NECRON'S_HELMET");
	Helpers.registerRecipe("WITHER_CHESTPLATE 1 DIAMANTE'S_HANDLE 8", "NECRON'S_CHESTPLATE");
	Helpers.registerRecipe("WITHER_LEGGINGS 1 DIAMANTE'S_HANDLE 8", "NECRON'S_LEGGINGS");
	Helpers.registerRecipe("WITHER_BOOTS 1 DIAMANTE'S_HANDLE 8", "NECRON'S_BOOTS");
	Helpers.registerRecipe("WITHER_HELMET 1 JOLLY_PINK_ROCK 8", "GOLDOR'S_HELMET");
	Helpers.registerRecipe("WITHER_CHESTPLATE 1 JOLLY_PINK_ROCK 8", "GOLDOR'S_CHESTPLATE");
	Helpers.registerRecipe("WITHER_LEGGINGS 1 JOLLY_PINK_ROCK 8", "GOLDOR'S_LEGGINGS");
	Helpers.registerRecipe("WITHER_BOOTS 1 JOLLY_PINK_ROCK 8", "GOLDOR'S_BOOTS");
	Helpers.registerRecipe("WITHER_HELMET 1 L.A.S.R.'S_EYE 8", "STORM'S_HELMET");
	Helpers.registerRecipe("WITHER_CHESTPLATE 1 L.A.S.R.'S_EYE 8", "STORM'S_CHESTPLATE");
	Helpers.registerRecipe("WITHER_LEGGINGS 1 L.A.S.R.'S_EYE 8", "STORM'S_LEGGINGS");
	Helpers.registerRecipe("WITHER_BOOTS 1 L.A.S.R.'S_EYE 8", "STORM'S_BOOTS");
	Helpers.registerRecipe("NULL_OVOID 32 ENCHANTED_EYE_OF_ENDER 32 ENCHANTED_DIAMOND 1", "ASPECT_OF_THE_VOID");
	Helpers.registerRecipe("GRIFFIN_FEATHER 44 ANCIENT_CLAW 376", "BEASTMASTER_CREST RARE");
	Helpers.registerRecipe("ENCHANTED_BIRCH_WOOD 48 NULL_OVOID 13 SUMMONING_EYE 1", "SOUL_ESOWARD");
	Helpers.registerRecipe("ENCHANTED_BLAZE_ROD 30 ENCHANTED_EYE_OF_ENDER 30 NULL_OVOID 96", "GYROKINETIC_WAND");
	Helpers.registerRecipe("ENCHANTED_IRON 128 TARANTULA_SILK 3", "TARANTULA_HELMET");
	Helpers.registerRecipe("REVIVED_HEART 1 REVENANT_CATALYST 1 UNDEAD_CATALYST 1 CRYSTALIZED_HEART 1 UNDEAD_SWORD 1", "REAPER_FALCION");
	Helpers.registerRecipe("UNDEAD_CATALYST 1 CRYSTALIZED_HEART 1 UNDEAD_SWORD 1", "REVENANT_FALCION");
	Helpers.registerRecipe("TARANTULA_SILK 36 ENCHANTED_ACACIA_WOOD 128", "SCORPION_FOIL");
	Helpers.registerRecipe("ENCHANTED_LAPIS_LAZULI_BLOCK 4 GOLDEN_TOOTH 32 RADIANT_POWER_ORB 1", "MANA_FLUX");
	Helpers.registerRecipe("ENCHANTED_REDSTONE_BLOCK 24 GOLDEN_TOOTH 128 OVERFLUX_CAPACITOR 1 MANA_FLUX_POWER_ORB 1", "OVERFLUX_POWER_ORB");
	Helpers.registerRecipe("ENCHANTED_REDSTONE 128 NULL_OVOID 3", "FINAL_DESTINATION_HELMET");
	Helpers.registerRecipe("ENCHANTED_REDSTONE 256 NULL_OVOID 4", "FINAL_DESTINATION_CHESTPLATE");
	Helpers.registerRecipe("ENCHANTED_REDSTONE 256 NULL_OVOID 3", "FINAL_DESTINATION_LEGGINGS");
	Helpers.registerRecipe("ENCHANTED_REDSTONE 128 NULL_OVOID 2", "FINAL_DESTINATION_BOOTS");
	Helpers.registerRecipe("ENCHANTED_ROTTEN_FLESH 256", "ZOMBIE'S_HEART");
	Helpers.registerRecipe("ENCHANTED_ROTTEN_FLESH 256 ENCHANTED_DIAMOND 256", "CRYSTALLIZED_HEART");
	Helpers.registerRecipe("ENCHANTED_LAPIS_LAZULI_BLOCK 9 SPIRIT_WING 3", "SPIRIT_SCEPTRE");
	Helpers.registerRecipe("CHALLENGING_ROD 1 ENCHANTED_WATER_LILY 136", "ROD_OF_LEGENDS");

	/**
	 * AUCTION HOUSE SETTINGS COMMAND
	**/

	Helpers.registerSubCommand("ah", "switchsortmode", "Changes the sorting mode between percent and direct profit.", CommandFunctionality.switchSortMode);
	Helpers.registerSubCommand("ah", "setpricerange", "Makes $ah commands only return trades within a specified budget.", CommandFunctionality.setBudget);

	Helpers.registerSubCommand("ah", "settings", "Lists the current !ah related settings.", CommandFunctionality.printAHSettings);

	/**
	 * PRINT ITEMS NECESSARY FOR A SPECIFIC AH CRAFTING FLIP
	**/

	Helpers.registerCommand("recipe", "Lists the items needed to craft the requested item", CommandFunctionality.getRecipe);

	/**
	 * COMPARE AUCTIONS THAT ARE ABOUT TO FINISH TO THE LOWEST BIN
	**/

	Helpers.registerSubCommand("ah", "snipe", "Finds auctions ending soon priced way below the lowest BIN.", CommandFunctionality.findAHSnipes);

	/**
	 * Await the price of an item on the AH or Bazaar to cross a certain boundary
	**/

	Helpers.registerCommand("await", "Get alerted when an item's price crosses a given threshold.", CommandFunctionality.awaitPrice);

	/**
	 * Set Internal Server Permissions
	**/

	Helpers.registerCommand("setperms", "For Bosch's Eyes Only: Change the Permission Level of the Guild", CommandFunctionality.setPerms);
	Helpers.getCommands()["setperms"].setInvisible();



	/**
	 * Name Server in Database
	**/

	Helpers.registerCommand("name", "For Bosch's Eyes Only: Append Name information to FireStore Perms Object (in case I ever need to delete perms remotely for some reason)", CommandFunctionality.nameServer);
	Helpers.getCommands()["name"].setInvisible();

	/**
	 * Filler Function to make sure things work
	**/

	Helpers.registerCommand("dev", "... go away you don't need this.", CommandFunctionality.devTest);
	Helpers.getCommands()["dev"].setInvisible();

	/**
	 * YES I'M FUNNY
	**/

	client.user.setActivity("your mom", { type: "STREAMING", url: "https://twitter.com/BoomerBosch" });


	await FireStore.initFirebase();

	HypixelAPIHandler.initAuctionData(client);
	//Helpers.initFirebase();
	Helpers.initBazaarUpdate();

	FireStore.deleteCollection("test");

	console.log("Bot Online!");

});

client.on('messageCreate', async (message) => {
	try {
		if (!message.content.startsWith("$")) {
			return;
        }

		let guildID = message.guildId;
		let guildPerms = await FireStore.get("GuildPermissions", guildID);

		if (!guildPerms) {
			FireStore.set("GuildPermissions", guildID, {
				birthEpoch: Date.now(),
				channelPerms: {}
			});
			guildPerms = {
				channelPerms: {}
			};
		}

		//Either the channel has been given a permission value, or I am the one sending the message
		let channelPerms = guildPerms.channelPerms[message.channelId];

		let allowCommand = Helpers.canRunCommand(message.author.id, channelPerms) || (message.author.id == "416738519982276609");

		if (allowCommand) {
			Helpers.registerMessage(message.author.id);
			if (!Helpers.getSettings(message.author.id)) {
				await Helpers.initSettings(message.author.id);
				Helpers.saveSettings(message.author.id);
			}

			let commands = Helpers.getCommands();
			let content = message.content.toLowerCase();

			let commandFound = false;
			for (var i in commands) {
				if (content == "$" + commands[i].getTrigger()) {

					commands[i].callback(client, message);
					commandFound = true;
					break;

				}
				else if (content.startsWith("$" + commands[i].getTrigger() + " ")) {

					let commandSplit = content.split(" ");

					if (commands[i].usesSubCommands) {
						if (commandSplit[1] in commands[i].subCommands) {
							Helpers.getSubCommand(commandSplit[0].substring(1), commandSplit[1]).callback(client, message);
							commandFound = true;
							break;
						}
					}
					else {
						commands[i].callback(client, message);
						commandFound = true;
						break;
					}
				}
			}

			if (!commandFound) {
				Helpers.throwError(message.channel, "Command Not Found", "Sorry, but `" + message.content + "` is not a valid command!\n`$help` for a list of available commands!");

			}

		}
	}
	catch (e) {
		Helpers.throwError(message.channel, "Internal Error", "Sorry, but you managed to break the bot somehow: Bosch has been notified though!");
		client.users.cache.get("416738519982276609").send("MESSAGE: " + message.content + "\nERROR:\n"+e);
		console.log(e);
    }

});


client.login(BOT_TOKEN);