import attributesJson from './attributes.json';
import skillItemsJson from './skillItems.json';
import skillProficienciesJson from './skillProficiencies.json';
import standardDCsJson from './standardDCs.json';
import { z } from 'zod';

type Arrayable<T> = T | T[];

const Tier = ['FFF', 'FF', 'F', 'D', 'C', 'B', 'A', 'S', 'SS'] as const;
type Tier = (typeof Tier)[number];

const Mod = z.number().int();
type Mod = z.infer<typeof Mod>;

const ModTierList = z.tuple([z.enum(Tier), Mod]).array();
type ModTierList = z.infer<typeof ModTierList>;

type CompositeTierList = [Arrayable<Tier>, Mod][];

const Exactly21TierLists = z
	.array(ModTierList.or(z.null()))
	.length(21, 'A Tier List Table needs 1 Tier List per level (and an empty zero index)');
const JustFirstTierListUndefined = z.tuple([z.null()]).rest(ModTierList);
const ModTierListTable = Exactly21TierLists.and(JustFirstTierListUndefined);

const attributeTierList = ModTierListTable.parse(attributesJson);
const skillProficiencyTierList = ModTierListTable.parse(skillProficienciesJson);
const skillItemTierList = ModTierListTable.parse(skillItemsJson);

const standardDCs = z.number().array().length(21, 'because there are 20 levels, plus the 0th index').parse(standardDCsJson);

const level = 1;

const valueMultipliers = [-1, 0, 1, 2]; // [0, 0.5, 1, 2] is save-like, rather than rolling
export function getExpectedValue(mod: Mod, dc: number) {
	let result = 0;
	for (let roll = 1; roll <= 20; roll++) {
		const check = roll + mod;
		// crit fail
		if (check <= dc - 10) result += valueMultipliers[roll == 20 ? 1 : 0];
		// crit success
		else if (check >= dc + 10) result += valueMultipliers[roll == 1 ? 2 : 3];
		// fail
		else if (check < dc) result += valueMultipliers[roll == 20 ? 2 : roll == 1 ? 0 : 1];
		// success
		else result += valueMultipliers[roll == 20 ? 3 : roll == 1 ? 1 : 2];
	}
	return result / 20;
}

// Kind of arbitrary tiers; a maxed out first level skill gets A-tier
function getTier(expectedValue: number): Tier {
	if (expectedValue >= 1.25) return 'SS';
	if (expectedValue >= 1) return 'S';
	if (expectedValue >= 0.75) return 'A';
	if (expectedValue >= 0.6) return 'B';
	if (expectedValue >= 0.45) return 'C';
	if (expectedValue >= 0.3) return 'D';
	if (expectedValue >= 0.15) return 'F';
	if (expectedValue > 0) return 'FF';
	return 'FFF';
}

function arrayArrayable<T>(val: Arrayable<T>) {
	if (Array.isArray(val)) return val;
	return [val];
}

function multiplyTiers(tierList1: CompositeTierList, tierList2: CompositeTierList) {
	const resultTierList: CompositeTierList = [];
	for (const tier1 of tierList1)
		for (const tier2 of tierList2) {
			const tiers = arrayArrayable(tier1[0])
				.concat(arrayArrayable(tier2[0]))
				.toSorted((tier1, tier2) => Tier.indexOf(tier2) - Tier.indexOf(tier1));
			resultTierList.push([tiers, tier1[1] + tier2[1]]);
		}
	return resultTierList;
}

const t = multiplyTiers(multiplyTiers(attributeTierList[level]!, skillProficiencyTierList[level]!), skillItemTierList[level]!);
t.sort((a, b) => b[1] - a[1]);
console.log(
	t.map((x) => [
		arrayArrayable(x[0]).join('|'),
		getExpectedValue(x[1], standardDCs[level]),
		getTier(getExpectedValue(x[1], standardDCs[level])),
	]),
);
