﻿const HypixelAPIHandler = require('../api-handler/api-tools');
const Helpers = require('../helper-functions/helpers');

const FireStore = require('../api-handler/firestore');


module.exports = {

	help(client, message) {
		let commandSplit = message.content.split(" ");
		if (commandSplit.length > 1 && commandSplit[1][0] == '!') {
			commandSplit[1] = commandSplit[1].substring(1);
		}
		let commands = Helpers.getCommands();

		if (commandSplit.length > 1) {
			if (commands[commandSplit[1]] && commands[commandSplit[1]].visible) {
				let command = commands[commandSplit[1]];
				var replyEmbed = Helpers.getEmbed().setTitle("**Help Registry: " + command.getTitle() + "**");
				replyEmbed.setDescription(command.getDescription());
				for (let i in command.subCommands) {
					replyEmbed.addField("**" + command.subCommands[i].getTrigger() + "**:", command.subCommands[i].getDescription());
				}
				message.channel.send({ embeds: [replyEmbed] });
			}
			else {
				Helpers.throwError(message.channel, "No Such Command", "Sorry, but `" + commandSplit[1] + "` isn't a command, and as such we have no help to give other than recommend just `$help` to see all commands!");
            }
		}
		else {
			var replyEmbed = Helpers.getEmbed().setTitle("**Help Registry**");
			for (let i in commands) {
				if (commands[i].visible) {
					let descString = commands[i].getDescription();
					for (let b in commands[i].subCommands) {
						descString += "\n... **" + commands[i].subCommands[b].getTitle().toLowerCase() + ":** " + commands[i].subCommands[b].getDescription();
					}
					replyEmbed.addField("**" + commands[i].getTitle() + "**:", descString);

                }
			}

			message.channel.send({ embeds: [replyEmbed] });
        }
		
	},

	async directBazaarTradeList(client, message) {

		let bzData = await HypixelAPIHandler.getBazaarData();

		let validTrades = [];

		let settings = Helpers.getSettings(message.author.id);

		for (let i in bzData) {
			let itemData = bzData[i];

			if (itemData.sellSummary.length > 0 && itemData.buySummary.length > 0) {
				let sellPrice = itemData.sellSummary[0].pricePerUnit;
				let buyPrice = itemData.buySummary[0].pricePerUnit;
				if (itemData.status.sellMovingWeek > settings.minBZVolume && itemData.status.buyMovingWeek > settings.minBZVolume && sellPrice > settings.minBZPrice) {

					let niceName = Helpers.tagToName(itemData.productId);

					validTrades.push([(buyPrice * 0.9875) / sellPrice, niceName, sellPrice, buyPrice, (buyPrice * 0.9875 - sellPrice) * 1024]);

				}
			}
		}

		validTrades.sort((a, b) => { return b[4] - a[4]; });

		let replyEmbed = Helpers.getEmbed()
			.setTitle("Best Bazaar Trades")
			.setThumbnail('https://render.namemc.com/skin/3d/body.png?skin=f7e2e8b6d2f5fa95&model=classic&theta=39&phi=31&time=90&width=200&height=200');

		for (let i = 0; i < Math.min(7, validTrades.length); i++) {
			let margin = Helpers.cleanRound(validTrades[i][3] * 0.9875 - validTrades[i][2], 1);
			let marginPercent = Helpers.cleanRound(margin / validTrades[i][2] * 100, 2);

			replyEmbed.addField("#" + (i + 1) + ": `" + validTrades[i][1] + "`\n($" + (margin * 1024).toLocaleString() + " profit on x1024 Order)", "Margin: `" + margin.toLocaleString() + " (" + marginPercent + "%)`\nMoney Turnover: `$" + Helpers.cleanRound(validTrades[i][2] * 1024, 1).toLocaleString() + "  → $" + Helpers.cleanRound(validTrades[i][3] * 0.9875 * 1024, 1).toLocaleString() + "`");
		}

		message.channel.send({ embeds: [replyEmbed] });


	},




	async findPlayerData(client, message) {
		var username = message.content.split(' ')[1];
		var sbprofile = message.content.split(' ')[2];

		if (username) {
			var replyEmbed = Helpers.getEmbed();

			let playerData = await HypixelAPIHandler.getGeneralPlayer(username);
			let skyblockData = await HypixelAPIHandler.getSkyblockPlayer(username, sbprofile);

			if (skyblockData) {

				replyEmbed
					.setTitle(playerData.nickname + "'s Stats")
					.setURL("https://sky.shiiyu.moe/stats/" + username)
					.setDescription('Last Played Profile: ' + skyblockData.profileName)
					.setThumbnail('https://cravatar.eu/helmhead/' + username + '/68.png')
					.addFields(
						{ name: 'Catacombs Level: ' + skyblockData.dungeons.types.catacombs.level, value: Helpers.cleanRound(skyblockData.dungeons.types.catacombs.xpCurrent / skyblockData.dungeons.types.catacombs.xpForNext * 100, 2) + "% to next" },
					);

				let mainClass;
				for (let classname in skyblockData.dungeons.classes) {
					mainClass = mainClass ? mainClass : classname;
					if (skyblockData.dungeons.classes[classname].xp > skyblockData.dungeons.classes[mainClass].xp) {
						mainClass = classname;
					}
				}

				mainClassData = skyblockData.dungeons.classes[mainClass];
				replyEmbed.addField("Main Class: " + Helpers.niceCapitalize(mainClass), "Level " + mainClassData.level + " (" + Helpers.cleanRound(mainClassData.xpCurrent / mainClassData.xpForNext * 100, 2) + "% to next)");

				message.channel.send({ embeds: [replyEmbed] });

			}

			else if (!sbprofile) {
				replyEmbed
					.setTitle(username + "'s Stats")
					.setDescription('This player doesn\'t play Skyblock!')
					.setThumbnail('https://cravatar.eu/helmhead/' + username + '/68.png');

				message.channel.send({ embeds: [replyEmbed] });
			}
			else {
				replyEmbed
					.setTitle(username + "'s Stats")
					.setDescription('This player has no profile named ' + Helpers.niceCapitalize(sbprofile) + ".")
					.setThumbnail('https://cravatar.eu/helmhead/' + username + '/68.png');

				message.channel.send({ embeds: [replyEmbed] });
			}
		}

		else {
			let embed = Helpers.getEmbed().setTitle("No Username Input").setDescription("The proper format is `!find [username]` or `!find [username] [profile]`.").setThumbnail("https://www.freeiconspng.com/thumbs/error-icon/error-icon-32.png");

			message.channel.send({ embeds: [embed] });
        }

		
	},


	editBZMinVolume(client, message) {
		let commandSplit = message.content.split(" ");

		let settings = Helpers.getSettings(message.author.id);

		var replyEmbed = Helpers.getEmbed()
			.setTitle("Changing Minimum Volume")
			.setThumbnail('https://render.namemc.com/skin/3d/body.png?skin=f7e2e8b6d2f5fa95&model=classic&theta=39&phi=31&time=90&width=200&height=200');
		if (commandSplit.length > 2) {
			let parsed = Helpers.sbNumberFormat(commandSplit[2]);

			if (parsed < 0) {
				replyEmbed.addField("Command Error:", "`" + commandSplit[2] + "` is not a valid value!");
			}
			else {
				replyEmbed.addField("New Minimum Volume Set:", "`$" + parsed.toLocaleString() + "`");
				Helpers.setVariable(message.author.id, "minBZVolume", parsed);
			}
		}

		else {
			replyEmbed.addField("Type in a value after `minvolume` to change the value!", "Current Value: `" + settings.minBZVolume.toLocaleString() + "`");
		}

		message.channel.send({ embeds: [replyEmbed] });
	},

	editBZMinPrice(client, message) {
		let commandSplit = message.content.split(" ");

		let settings = Helpers.getSettings(message.author.id);

		var replyEmbed = Helpers.getEmbed()
			.setTitle("Changing Minimum Price")
			.setThumbnail('https://render.namemc.com/skin/3d/body.png?skin=f7e2e8b6d2f5fa95&model=classic&theta=39&phi=31&time=90&width=200&height=200');
		if (commandSplit.length > 2) {
			let parsed = Helpers.sbNumberFormat(commandSplit[2]);

			if (parsed < 0) {
				replyEmbed.addField("Command Error:", "`"+commandSplit[2] + "` is not a valid value!");
			}
			else {
				replyEmbed.addField("New Minimum Price Set:", "`$" + parsed.toLocaleString() + "`");
				Helpers.setVariable(message.author.id, "minBZPrice", parsed);
			}
		}
		else {
			replyEmbed.addField("Type in a value after `minprice` to change the value!", "Current Value: `$" + settings.minBZPrice.toLocaleString()+"`");
		}

		message.channel.send({ embeds: [replyEmbed] });
	},

	async craftingBazaarTradeList(client, message) {
		let bzData = await HypixelAPIHandler.getBazaarData();

		let settings = Helpers.getSettings(message.author.id);

		var enchantedPairs = [];
		var blackList = ["LEATHER", "STRING", "HARD_STONE", "BLAZE_ROD", "PACKED_ICE", "CACTUS", "SUGAR_CANE", "RABBIT_HIDE", "BLAZE_POWDER", "HUGE_MUSHROOM_1", "HUGE_MUSHROOM_2"];
		for (let i in bzData) {
			if (bzData["ENCHANTED_" + i] && !blackList.includes(i)) {

				let itemData = bzData[i];
				let enchItemData = await HypixelAPIHandler.getItemData("ENCHANTED_" + i);
				if (itemData.status.sellMovingWeek > settings.minBZVolume && enchItemData.status.buyMovingWeek > settings.minBZVolume) {
					enchantedPairs.push([i, "ENCHANTED_" + i, 160]);
				}
			}
		}
		enchantedPairs.push(["BLAZE_ROD", "ENCHANTED_BLAZE_POWDER", 160]);
		enchantedPairs.push(["ENCHANTED_BLAZE_POWDER", "ENCHANTED_BLAZE_ROD", 160]);
		enchantedPairs.push(["STRING", "ENCHANTED_STRING", 384]);
		enchantedPairs.push(["LEATHER", "ENCHANTED_LEATHER", 384]);
		enchantedPairs.push(["SUGAR_CANE", "ENCHANTED_SUGAR", 160]);
		enchantedPairs.push(["ENCHANTED_SUGAR", "ENCHANTED_SUGAR_CANE", 160]);
		enchantedPairs.push(["RABBIT_HIDE", "ENCHANTED_RABBIT_HIDE", 576]);
		enchantedPairs.push(["HARD_STONE", "ENCHANTED_HARD_STONE", 576]);

		let results = [];
		for (let i in enchantedPairs) {
			let cost = await (HypixelAPIHandler.getItemSellPrice(enchantedPairs[i][0])) * enchantedPairs[i][2] + (0.1 * enchantedPairs[i][2]);
			let rtrn = await (HypixelAPIHandler.getItemBuyPrice(enchantedPairs[i][1])) * 0.9875;
			results.push([enchantedPairs[i][0], enchantedPairs[i][1], (rtrn - cost) / cost, (rtrn - cost) * 71000 / enchantedPairs[i][2], (rtrn - cost), rtrn, cost, 71000 / enchantedPairs[i][2]]);
		}
		results.sort((a, b) => { return b[2] > 0.3 && a[2] > 0.3 ? b[3] - a[3] : b[2] > 0.3 ? 1 : a[2] > 0.3 ? -1 : 0; });

		var replyEmbed = Helpers.getEmbed()
			.setTitle("Best Bazaar Crafting Trades")
			.setThumbnail('https://render.namemc.com/skin/3d/body.png?skin=f7e2e8b6d2f5fa95&model=classic&theta=39&phi=31&time=90&width=200&height=200');

		for (let i = 0; i < Math.min(7, results.length); i++) {
			replyEmbed.addField("#" + (i + 1) + ": `" + Helpers.tagToName(results[i][0]) + " → " + Helpers.tagToName(results[i][1]) + "`\n($" + Helpers.cleanRound(results[i][3], 1).toLocaleString() + " profit on x71k Order)", "Margin: `$" + Helpers.cleanRound(results[i][4], 1) + " (" + Helpers.cleanRound(results[i][2] * 100, 2) + "% Margin)`\nMoney Turnover: `$" + Helpers.cleanRound(results[i][6] * results[i][7], 1).toLocaleString() + " → $" + Helpers.cleanRound(results[i][5] * results[i][7], 1).toLocaleString() +"`");
		}

		message.channel.send({ embeds: [replyEmbed] });
	},

	listBZSettings(client, message) {
		let replyEmbed = Helpers.getEmbed().setTitle("Bazaar Settings").setThumbnail('https://render.namemc.com/skin/3d/body.png?skin=f7e2e8b6d2f5fa95&model=classic&theta=39&phi=31&time=90&width=200&height=200');

		let settings = Helpers.getSettings(message.author.id);

		replyEmbed.addField("**minVolume**: `" +settings.minBZVolume.toLocaleString() + " units per week`", "This setting definines the minimum weekly insta-buys/sells a market needs to even be analyzed for any flip.");
		replyEmbed.addField("**minPrice**: `$" +settings.minBZPrice.toLocaleString() + "`", "This setting definines the minimum cost per item a market needs to be considered for direct flips.");

		message.channel.send({ embeds: [replyEmbed] });
	},

	async fetchItemPrice(client, message) {

		let itemID = Helpers.nameToTag(message.content.substring(7));
		let idSplit = message.content.substring(7).split(" ");

		let rarities = ['c', 'u', 'r', 'e', 'l', 'm', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

		if (itemID.length > 0) {
			if ((await HypixelAPIHandler.getBazaarData())[itemID] && !rarities.includes(idSplit[idSplit.length-1].toLowerCase())) {
				let itemData = await HypixelAPIHandler.getItemData(itemID);
				let itemBuy = await HypixelAPIHandler.getItemBuyPrice(itemID);
				let itemSell = await HypixelAPIHandler.getItemSellPrice(itemID);

				let replyEmbed = Helpers.getEmbed().setTitle(Helpers.tagToName(itemID) + " (Bazaar Item)").setThumbnail('https://render.namemc.com/skin/3d/body.png?skin=f7e2e8b6d2f5fa95&model=classic&theta=39&phi=31&time=90&width=200&height=200');
				replyEmbed.addField("Price Data:", "Buy Price: `$" + itemSell.toLocaleString() + "`\nSell Price: `$" + itemBuy.toLocaleString() + "`");
				replyEmbed.addField("Volume Data:", "Insta-Buys: `" + itemData.status.buyMovingWeek.toLocaleString() + " per week`\nInsta-Sells: `" + itemData.status.sellMovingWeek.toLocaleString() + " per week`");


				message.channel.send({ embeds: [replyEmbed] });
				return;
			}


			let AHData = await HypixelAPIHandler.getAuctionData();
			let itemName = message.content.substring(7);

			let validAuctions = [];
			let validAuctionsPreRarity = [];

			let checkRarity = rarities.includes(idSplit[idSplit.length - 1].toLowerCase());
			let rarity = rarities.indexOf(idSplit[idSplit.length - 1].toLowerCase()) % 6;

			if (checkRarity) {
				idSplit.pop();
				itemName = idSplit.join(' ');
			}

			AHData.auctions.forEach((auction) => {
				if (auction.bin && auction.bids.length == 0 && auction.item.toLowerCase().includes(itemName.toLowerCase())) {
					validAuctionsPreRarity.push(auction);
				}
			});

			validAuctionsPreRarity.forEach((auction) => {
				if (checkRarity ? rarities.indexOf(auction.rarity.toLowerCase()) % 6 == rarity : true) {
					validAuctions.push(auction);
                }
			});


			validAuctions.sort((a, b) => { return a.startingBid - b.startingBid; });

			if (validAuctions.length) {
				let replyEmbed = Helpers.getEmbed().setTitle("\""+Helpers.niceCapitalize(itemName) + "\" (Auction Search)").setThumbnail('https://static.wikia.nocookie.net/hypixel-skyblock/images/a/a8/Auction_Master.png/revision/latest/scale-to-width-down/249?cb=20210812151239');
				replyEmbed.addField("Stats:", "Matching Auctions: `" + validAuctions.length.toLocaleString() + "`");

				for (let i = 0; i < Math.min(3, validAuctions.length); i++) {
					replyEmbed.addField("Auction #" + (i + 1) + ": `" + validAuctions[i].item + "`", "Price: `$" + validAuctions[i].startingBid.toLocaleString() + "`\nRarity: `" + Helpers.niceCapitalize(validAuctions[i].rarity) + "`");
                }

				message.channel.send({ embeds: [replyEmbed] });
			}

			else if (validAuctionsPreRarity.length) {
				let replyEmbed = Helpers.getEmbed().setTitle("\"" + Helpers.niceCapitalize(itemName) + "\" (Auction Search)").setThumbnail('https://static.wikia.nocookie.net/hypixel-skyblock/images/a/a8/Auction_Master.png/revision/latest/scale-to-width-down/249?cb=20210812151239');
				let validRarities = [];

				for (let i in validAuctionsPreRarity) {
					let rarityIndex = rarities.indexOf(validAuctionsPreRarity[i].rarity.toLowerCase());
					if (!validRarities.includes(rarityIndex)) { validRarities.push(rarityIndex); }
				}

				validRarities.sort((a, b) => { return a - b; });

				let bodyText = "The search `" + Helpers.niceCapitalize(itemName) + "` only yielded results of ";

				if (validRarities.length == 1) {
					bodyText += "`" + Helpers.niceCapitalize(rarities[validRarities[0]]) + "` rarity.";
				}
				else if (validRarities.length == 2) {
					bodyText += "`" + Helpers.niceCapitalize(rarities[validRarities[0]]) + "` and `" + Helpers.niceCapitalize(rarities[validRarities[1]]) + "` rarity.";
				}
				else {
					for (let i = 0; i < validRarities.length - 1; i++) {
						bodyText += "`" + Helpers.niceCapitalize(rarities[validRarities[i]]) + "`, ";
					}
					bodyText += " and `" + Helpers.niceCapitalize(rarities[validRarities[validRarities.length - 1]]) + "` rarities.";
                }

				replyEmbed.addField("No Rarity Matches!", bodyText);

				message.channel.send({ embeds: [replyEmbed] });

            }

			else {
				let allBZItems = await HypixelAPIHandler.getBazaarData();
				let allItems = allBZItems;
				let matchingItems = [];

				for (let i in allItems) {
					if (i.includes(itemID)) {
						matchingItems.push(i);
                    }
                }

				if (matchingItems.length == 0) {
					Helpers.throwError(message.channel, "No Item Found", "Sorry, but your search doesn't match anything in the Bazaar or the Auction House.");
				}
				else if (matchingItems.length == 1) {
					Helpers.throwError(message.channel, "No Item Found", "Could you have been looking for `" + Helpers.tagToName(matchingItems[0]) + "`?");
				}
				else {
					let itemString = "";
					for (let i = 0; i < matchingItems.length - 1; i++) {
						itemString += "`" + Helpers.tagToName(matchingItems[i]) + "`, ";
					}

					itemString += "or `" + Helpers.tagToName(matchingItems[matchingItems.length - 1]) + "`?";

					Helpers.throwError(message.channel, "No Item Found", "Could you have been looking for " + itemString);
				}
			}
        }

		else {
			Helpers.throwError(message.channel, "No Item Requested", "You need to request an item, like `!price [item name]`!");
		}

	},

	async findAHCraftingFlips(client, message) {
		let recipes = Helpers.getRecipes();

		let settings = Helpers.getSettings(message.author.id);

		let priceData = [];

		for (let i in recipes) {
			let recipe = recipes[i];
			let craftPrice = 0;
			for (let b in recipe.input) {
				craftPrice += await HypixelAPIHandler.getMinPrice(recipe.input[b][0], averageOver = 3) * recipe.input[b][1];
			}
			if (craftPrice > settings.ahRangeMin && craftPrice < settings.ahRangeMax) {
				let sellPrice = await HypixelAPIHandler.getMinPrice(recipe.output, averageOver = 1, exact = recipe.exact, rarity = recipe.rarity);
				priceData.push([i, craftPrice, sellPrice]);
			}
		}

		priceData.sort((a, b) => { return (b[2] * 0.98 - b[1]) / (settings.ahSortMode ? 1 : b[1]) - (a[2] * 0.98 - a[1]) / (settings.ahSortMode ? 1 : a[1]); });

		let replyEmbed = Helpers.getEmbed().setTitle("Auction Crafting Flips").setThumbnail("https://static.wikia.nocookie.net/hypixel-skyblock/images/a/a8/Auction_Master.png/revision/latest/scale-to-width-down/249?cb=20210812151239");

		for (let i = 0; i < Math.min(8, priceData.length); i++) {
			let flip = recipes[priceData[i][0]];
			let profit = priceData[i][2] * 0.98 - priceData[i][1];
			if (profit > 0) {
				let profitPercent = profit / priceData[i][1] * 100;

				let title = "Flip #" + (i + 1) + ": `" + Helpers.tagToName(flip.output) + (flip.rarity ? " (" + Helpers.niceCapitalize(flip.rarity) + ")" : "") + "`";
				let bodyText = "Money Turnover: `$" + Helpers.cleanRound(priceData[i][1], 1).toLocaleString() + " → $" + Helpers.cleanRound(priceData[i][2], 1).toLocaleString() + "`\n";
				bodyText += "Profit After Fees: `$" + Helpers.cleanRound(profit, 1).toLocaleString() + " (" + Helpers.cleanRound(profitPercent, 2) + "% profit)`";
				replyEmbed.addField(title, bodyText);
            }
        }

		message.channel.send({ embeds: [replyEmbed] });
	},

	async getRecipe(client, message) {
		let recipe;
		let tag = message.content.substring(8).toUpperCase().replaceAll(' ', '_');

		for (let i in Helpers.getRecipes()) {
			if (i.includes(tag)) {
				recipe = Helpers.getRecipes()[i];
				tag = i;
            }
		}

		if (!recipe) {
			Helpers.throwError(message.channel, "No Recipe Found!", "I'm sorry, but we don't have that recipe in our library yet! If you would like to submit it, tell Bosch.");
			return;
        }

		let replyEmbed = Helpers.getEmbed().setTitle("Item Recipe: `" + Helpers.tagToName(tag) + "`").setThumbnail("https://static.wikia.nocookie.net/minecraft_gamepedia/images/9/93/Crafting_Table_JE3_BE2.png/revision/latest?cb=20190606093431");

		let recipeText = "";
		let craftPrice = 0;

		for (let i in recipe.input) {
			recipeText += Helpers.tagToName(recipe.input[i][0]) + " (" + recipe.input[i][1] + "): `$" + Helpers.cleanRound((await HypixelAPIHandler.getMinPrice(recipe.input[i][0])) * recipe.input[i][1], 1).toLocaleString() + (recipe.input[i][1] > 1 ? " (" + Helpers.cleanRound((await HypixelAPIHandler.getMinPrice(recipe.input[i][0])), 1).toLocaleString()+" per unit)" : "") + "`\n";
			craftPrice += await HypixelAPIHandler.getMinPrice(recipe.input[i][0]) * recipe.input[i][1];
		}

		recipeText = recipeText.substring(0, recipeText.length - 1);
		replyEmbed.addField("Pricing:", "Crafting: `$" + Helpers.cleanRound(craftPrice, 1).toLocaleString() + "`\nAuction House: `$" + Helpers.cleanRound(await HypixelAPIHandler.getMinPrice(recipe.output, averageOver = 1, exact = recipe.exact, rarity = recipe.rarity), 1).toLocaleString() + "`");
		replyEmbed.addField("Recipe:", recipeText);

		message.channel.send({ embeds: [replyEmbed] });
	},

	switchSortMode(client, message) {
		let settings = Helpers.getSettings(message.author.id);

		Helpers.setVariable(message.author.id, "ahSortMode", 1 - settings.ahSortMode);
		let modes = ["Percentage", "Direct"];
		let replyEmbed = Helpers.getEmbed().setTitle("Auction Sort Mode Changed").setThumbnail("https://static.wikia.nocookie.net/hypixel-skyblock/images/a/a8/Auction_Master.png/revision/latest/scale-to-width-down/249?cb=20210812151239");
		replyEmbed.setDescription("Sorting Mode switched from `" + modes[1 - settings.ahSortMode] + "` to `" + modes[settings.ahSortMode] + "`.");
		message.channel.send({ embeds: [replyEmbed] });
	},

	setBudget(client, message) {
		let settings = Helpers.getSettings(message.author.id);

		let input = message.content.split(" ");
		let firstNum = Helpers.sbNumberFormat(input[2]);
		let secondNum = Helpers.sbNumberFormat(input[3]);

		if (firstNum < 0) {
			Helpers.throwError(message.channel, "No Valid Input Given!", "Sorry, this command is either used as `!ah setpricerange [minprice]` or as `!ah setpricerange [minprice] [maxprice]`!");
		}
		else if (secondNum < 0) {
			let replyEmbed = Helpers.getEmbed().setTitle("Auction Price Range Changed").setThumbnail("https://static.wikia.nocookie.net/hypixel-skyblock/images/a/a8/Auction_Master.png/revision/latest/scale-to-width-down/249?cb=20210812151239");
			replyEmbed.setDescription("Range Minimum switched from `$" + Helpers.cleanRound(settings.ahRangeMin, 1).toLocaleString() + "` to `$" + Helpers.cleanRound(firstNum, 1).toLocaleString() + "`.");
			Helpers.setVariable(message.author.id,"ahRangeMin", firstNum);
			message.channel.send({ embeds: [replyEmbed] });
		}
		else {
			let replyEmbed = Helpers.getEmbed().setTitle("Auction Price Range Changed").setThumbnail("https://static.wikia.nocookie.net/hypixel-skyblock/images/a/a8/Auction_Master.png/revision/latest/scale-to-width-down/249?cb=20210812151239");

			replyEmbed.setDescription("Old Range: `$" + Helpers.cleanRound(settings.ahRangeMin, 1).toLocaleString() + " - $" + Helpers.cleanRound(settings.ahRangeMax, 1).toLocaleString() + "`\nNew Range: `$" + Helpers.cleanRound(firstNum, 1).toLocaleString() + " - $" + Helpers.cleanRound(secondNum, 1).toLocaleString()+"`");
			Helpers.setVariable(message.author.id, "ahRangeMin", firstNum);
			Helpers.setVariable(message.author.id, "ahRangeMax", secondNum);
			message.channel.send({ embeds: [replyEmbed] });
        }
	},

	printAHSettings(client, message) {
		let settings = Helpers.getSettings(message.author.id);

		let replyEmbed = Helpers.getEmbed().setTitle("Auction Settings").setThumbnail("https://static.wikia.nocookie.net/hypixel-skyblock/images/a/a8/Auction_Master.png/revision/latest/scale-to-width-down/249?cb=20210812151239");

		let modes = ["Percentage", "Direct"];

		replyEmbed.addField("Sorting Mode:", "Mode: `" + modes[settings.ahSortMode] + "`");
		replyEmbed.addField("Price Range:", "Minimum: `$" + Helpers.cleanRound(settings.ahRangeMin, 1).toLocaleString() + "`\nMaximum : `$" + Helpers.cleanRound(settings.ahRangeMax, 1).toLocaleString() + "`");
		message.channel.send({ embeds: [replyEmbed] });
	},

	async findAHSnipes(client, message) {
		let settings = Helpers.getSettings(message.author.id);
		let AHData = await HypixelAPIHandler.getAuctionData();

		let endingSoon = [];

		for (let i = 0; i < AHData.auctions.length; i++) {
			let auction = AHData.auctions[i];
			let lore = auction.item_lore ? auction.item_lore : "";
			if (!auction.bin && (auction.auctionEndTimestamp - Date.now() < 6 * 60 * 1000) && (auction.auctionEndTimestamp - Date.now() > 30 * 1000) && auction.item != "Enchanted Book" && auction.item[0] != "[" && lore.substring(11) != "§8Furniture") {
				let binPrice = await HypixelAPIHandler.getMinPrice(auction.item);
				let ahPrice = Math.max(auction.highestBid, auction.startingBid);

				if ((ahPrice < binPrice * 0.6 || binPrice - ahPrice > 500000 + binPrice * 0.02) && binPrice > settings.ahRangeMin && ahPrice < settings.ahRangeMax) {
					endingSoon.push([auction, ahPrice, binPrice * 0.98]);
                }
            }
		}

		endingSoon.sort((a, b) => {
			return !settings.ahSortMode ? (a[2] - a[1]) - (b[2] - b[1]) : ((a[2] - a[1])/a[1] - (b[2] - b[1])/b[1]);
		});

		let replyEmbed = Helpers.getEmbed().setTitle("Snipable Auctions").setThumbnail("https://static.wikia.nocookie.net/hypixel-skyblock/images/a/a8/Auction_Master.png/revision/latest/scale-to-width-down/249?cb=20210812151239");



		if (!endingSoon.length) {
			replyEmbed.setDescription("Unfortuately there are no profitable auction snipes right now! Try again in a bit.");
		}

		for (let i = 0; i < Math.min(6, endingSoon.length); i++) {
			let auction = endingSoon[i][0];
			let binPrice = endingSoon[i][2];
			let ahPrice = endingSoon[i][1];
			let profit = Helpers.cleanRound(binPrice - ahPrice, 1).toLocaleString()
			let profitPercentage = Helpers.cleanRound((binPrice - ahPrice) / ahPrice * 100, 2).toLocaleString();

			let titleText = "Item " + (i + 1) + ": `" + auction.item + "`";
			let bodyText = "Money Turnover: `$" + Helpers.cleanRound(ahPrice, 1).toLocaleString() + "` → `$" + Helpers.cleanRound(binPrice, 1).toLocaleString() + "`\nProfit After Fees: `$" + profit + " (" + profitPercentage + "%)`\nAuction ID: `"+auction.auctionId+"`";
			replyEmbed.addField(titleText, bodyText);
		}

		message.channel.send({ embeds: [replyEmbed] });
	},

	async awaitPrice(client, message) {
		let commandSplit = message.content.split(" ").filter((a) => {
			return a.length > 0;
		});
		let signIndex = Math.max(commandSplit.indexOf(">"), commandSplit.indexOf("<"));

		if (signIndex > 1 && signIndex + 2 == commandSplit.length) {
			let itemPrice = Helpers.sbNumberFormat(commandSplit[signIndex + 1]);
			if (itemPrice > 0) {
				let nameArray = [];
				for (let i = 1; i < signIndex; i++) {
					nameArray.push(commandSplit[i]);
				}
				let itemName = Helpers.niceCapitalize(nameArray.join(" "));
				Helpers.addAwait(message.author.id, itemName, commandSplit[signIndex], itemPrice);
				let replyEmbed = Helpers.getEmbed().setTitle("Alert Set!").setDescription("We'll notify you when `" + itemName + (commandSplit[signIndex] == ">" ? "` rises above `$" : "` drops below `$") + itemPrice.toLocaleString() + "`!");

				message.channel.send({ embeds: [replyEmbed] });
				return;
			}
			Helpers.throwError(message.channel, "Improper Price", "Sorry, `" + commandSplit[signIndex + 1] + "` is not a valid number!");
			return;
		}
		Helpers.throwError(message.channel, "Improper Format", "Sorry, but the correct format for this command is `$await [item name] [> : <] [price]`!");
	},

	async setPerms(client, message) {
		try {
			if (message.author.id == "416738519982276609") {
				let currentObj = await FireStore.get("GuildPermissions", message.guildId);
				let messageSplit = message.content.split(" ");
				currentObj.channelPerms[message.channelId] = parseInt(messageSplit[1]);
				FireStore.set("GuildPermissions", message.guildId, currentObj);
				//Helpers.updateBZData10Min();

			}

		}
		catch (e) {
			Helpers.throwError(message.channel, "Internal Error", "Sorry, but you managed to break the bot somehow: Bosch has been notified though!");
			client.users.cache.get("416738519982276609").send("MESSAGE: " + message.content + "\nERROR:\n" + e);
			console.log(e);
		}
	},

	async nameServer(client, message) {
		try {
			if (message.author.id == "416738519982276609") {
				let currentObj = await FireStore.get("GuildPermissions", message.guildId);
				currentObj.name = message.content.substring(message.content.indexOf(" ")+1);
				FireStore.set("GuildPermissions", message.guildId, currentObj);

				console.log("Successfully named Server " + message.guildId + " to \"" + currentObj.name + "\"");
			}

		}
		catch (e) {
			Helpers.throwError(message.channel, "Internal Error", "Sorry, but you managed to break the bot somehow: Bosch has been notified though!");
			client.users.cache.get("416738519982276609").send("MESSAGE: " + message.content + "\nERROR:\n" + e);
			console.log(e);
		}
	},

	async devTest(client, message) {
		try {
			console.log(message.author.id);
			if (message.author.id == "416738519982276609") {
				//Helpers.updateBZData10Min();

				/*let graphURL = await Helpers.getGraphURL("BazaarTenMin", message.content.substring(5));

				let replyEmbed = Helpers.getEmbed().setTitle("Testing").setImage(graphURL);
				message.channel.send({ embeds: [replyEmbed] });
				console.log(await Helpers.getGraphURL("BazaarTenMin", message.content.substring(5)));*/

				/*let userRef = await FireStore.getCollection("UserSettings");
				userRef.get().then(snap => {
					console.log(snap.size)
				});*/
            }

		}
		catch (e) {
			Helpers.throwError(message.channel, "Internal Error", "Sorry, but you managed to break the bot somehow: Bosch has been notified though!");
			client.users.cache.get("416738519982276609").send("MESSAGE: " + message.content + "\nERROR:\n" + e);
			console.log(e);
        }
    }

}

let averageObjs = (objArr) => {
	let retObj = {};
	for (let i in objArr[0]) {
		if (typeof objArr[0][i] == 'number') {
			retObj[i] = 0;
			for (let b in objArr) {
				retObj[i] += objArr[b][i] / objArr.length;
			}
		}
		else if (objArr[0][i] instanceof Object || objArr[0][i] instanceof Array) {
			let subObjArr = [];
			for (let b in objArr) {
				subObjArr.push(objArr[b][i]);
			}
			retObj[i] = averageObjs(subObjArr);
        }
	}
	return retObj;
}