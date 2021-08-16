const BOT_TOKEN = 'ODc0MTg2Mjg0NDYwMDQwMjA0.YRDTaw.3G0QmVlv8CxQPeV7_8snicuI8_w';



const { Client, Intents } = require('discord.js');

const Helpers = require('./helper-functions/helpers');
const CommandFunctionality = require('./commands/command-callbacks')
const HypixelAPIHandler = require('./api-handler/api-tools');

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

	Helpers.setVariable("minVolume", 700000);
	Helpers.setVariable("minPrice", 1000);

	Helpers.registerSubCommand("bz", "minvolume", "This changes the minimum instant buy/sell volume acceptable.", CommandFunctionality.editMinVolume);
	Helpers.registerSubCommand("bz", "minprice", "This changes the minimum price per unit acceptable.", CommandFunctionality.editMinPrice);

	Helpers.registerSubCommand("bz", "settings", "Lists the bz command's settings and their values.", CommandFunctionality.listBZSettings);

	/**
	 * SEARCH PRICE DATA FOR SPECIFIC ITEM
	**/

	Helpers.registerCommand("price", "Prints the price of any specific item on the Bazaar or the Auction House.", CommandFunctionality.fetchBZItemPrice);

	/**
	 * SEARCH FOR VALUABLE AUCTION HOUSE FLIPS
	**/

	Helpers.registerCommand("ah", "Looks for items that are currently selling far lower than they usually do [HAVEN'T MAKE YET RELAX]", (message) => { message.channel.send("not done yet go away"); });
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

	/**
	 * PRINT ITEMS NECESSARY FOR A SPECIFIC AH CRAFTING FLIP
	**/

	Helpers.registerCommand("recipe", "Lists the items needed to craft the requested item", CommandFunctionality.getRecipe);

	/**
	 * Filler Function to make sure things work
	**/

	Helpers.registerCommand("dev", "... go away you don't need this.", CommandFunctionality.devTest);

	/**
	 * YES I'M FUNNY
	**/

	client.user.setActivity("your mom", { type: "STREAMING", url: "https://twitter.com/BoomerBosch" });


	HypixelAPIHandler.initAuctionData();
	HypixelAPIHandler.initFirebase();

	console.log("Bot Online!");

});

client.on('messageCreate', async (message) => {
	if (message.content.startsWith("!") && message.channel.name == "bot-commands") {
		let commands = Helpers.getCommands();
		let content = message.content.toLowerCase();

		let commandFound = false;
		for (var i in commands) {
			if (content == "!" + commands[i].getTrigger()) {

				commands[i].callback(message);
				commandFound = true;
				break;

            }
			else if (content.startsWith("!" + commands[i].getTrigger() + " ")) {

				let commandSplit = content.split(" ");

				if (commands[i].usesSubCommands) {
					if (commandSplit[1] in commands[i].subCommands) {
						Helpers.getSubCommand(commandSplit[0].substring(1), commandSplit[1]).callback(message);
						commandFound = true;
						break;
                    }
				}
				else {
					commands[i].callback(message);
					commandFound = true;
					break;
                }
            }
		}

		if (!commandFound) {
			Helpers.throwError(message.channel, "Command Not Found", "Sorry, but `" + message.content + "` is not a valid command!\n`!help` for a list of available commands!");
        }

    }

});


client.login(BOT_TOKEN);