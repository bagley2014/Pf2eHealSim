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

const level = 17;

function getTier(mod: Mod, dc: number): Tier {
	const diff = dc - mod;
	// if (diff <= 0) return 'SSS';
	if (diff <= 3) return 'SS';
	if (diff <= 5) return 'S';
	if (diff <= 8) return 'A';
	if (diff <= 9) return 'B';
	if (diff <= 11) return 'C';
	if (diff <= 13) return 'D';
	if (diff <= 15) return 'F';
	if (diff <= 16) return 'FF';
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
console.log(t.map((x) => [arrayArrayable(x[0]).join('|'), x[1], getTier(x[1], standardDCs[level])]));
