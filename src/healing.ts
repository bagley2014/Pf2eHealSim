import { Layout, Plot, plot } from 'nodeplotlib';

import { z } from 'zod';

const Character = z.object({
	name: z.string(),
	maxHP: z.number().min(1),
	initialRefocusActions: z.number().min(0).max(3),
	healing: z
		.object({
			potency: z.number(),
			targets: z.literal('single').or(z.literal('all')),
			charges: z.number().min(1).optional(),
		})
		.optional(),
});

type Character = z.infer<typeof Character>;

const luan = {
	name: 'Luan Xi',
	maxHP: 152,
	initialRefocusActions: 0,
};

const motzen = {
	name: 'Motzen Yuel',
	maxHP: 145,
	initialRefocusActions: 1,
	healing: {
		potency: 36,
		targets: 'single',
	},
};

const quan = {
	name: 'Quan Lei Fai',
	maxHP: 176,
	initialRefocusActions: 0,
	healing: {
		potency: 29,
		targets: 'all',
	},
};

const baselineIwakada = {
	name: 'Iwakada',
	maxHP: 114,
	initialRefocusActions: 1,
	healing: {
		potency: 48,
		targets: 'single',
	},
};

const testIwakada = {
	name: 'Iwakada',
	maxHP: 114,
	initialRefocusActions: 1,
	healing: {
		potency: 48,
		targets: 'single',
		charges: 3,
	},
};

const baselineCharacters: Character[] = [baselineIwakada, luan, motzen, quan];
const testCharacters: Character[] = [testIwakada, luan, motzen, quan];

function plotHealingInfo(characters: Character[]) {
	// All the characters start at one hp (ASSUMPTION: no one is downed)
	const healthPools = characters.map((_) => 1);
	const possibleHealthCombinations = characters.reduce((prev, curr) => curr.maxHP * prev, 1);
	const totalHealthCounts = new Map<number, number>();
	const timeToHealCounts = new Map<number, Map<number, number>>();

	for (let i = 0; i < possibleHealthCombinations; i++) {
		const totalHealth = healthPools.reduce((prev, curr) => prev + curr);
		totalHealthCounts.set(totalHealth, (totalHealthCounts.get(totalHealth) || 0) + 1);

		const maxTotalHealth = characters.reduce((prev, curr) => curr.maxHP + prev, 0);
		const desiredTotalMissingHealth = maxTotalHealth * 0.05; // ASSUMPTION: we'll stop healing at 95% to save time
		let currentMissingHealths = healthPools.map((health, index) => characters[index].maxHP - health).sort();
		let roundsToHeal = 0;

		// Measure time to heal
		while (currentMissingHealths.reduce((prev, curr) => prev + curr) > desiredTotalMissingHealth) {
			roundsToHeal++;
			for (const character of characters) {
				// Skip characters who can't heal or are refocusing
				if (!character.healing || roundsToHeal <= character.initialRefocusActions) continue;

				if (character.healing.targets === 'all')
					currentMissingHealths = currentMissingHealths.map((health) => Math.max(0, health - character.healing!.potency));
				else if (character.healing.targets === 'single') {
					for (let k = 0; k < (character.healing.charges || 1); k++) {
						// ASSUMPTION: single target healers will target the person with the most missing health
						currentMissingHealths.sort((a, b) => b - a);
						currentMissingHealths[0] = Math.max(0, currentMissingHealths[0] - character.healing!.potency);
					}
				}
			}
		}
		const dict = timeToHealCounts.get(totalHealth) || new Map<number, number>();
		dict.set(roundsToHeal * 10, (dict.get(roundsToHeal * 10) || 0) + 1);
		timeToHealCounts.set(totalHealth, dict);

		// Move to the next combination of hp values
		// We can count out all the possible combinations by treating each pool as a "digit"
		// Where the next pool in line is incremented once when the pool before it is maxed and the maxed pool is reset at the same time
		for (let pool = 0; pool < healthPools.length; pool++) {
			if (healthPools[pool] < characters[pool].maxHP) {
				healthPools[pool]++;
				break;
			} else healthPools[pool] = 1;
		}
	}

	const data: Plot[] = [
		{
			x: Array.from(totalHealthCounts.keys()),
			y: Array.from(totalHealthCounts.values()),
			type: 'scatter',
			name: 'total',
		},
		...[0, 10, 20, 30, 40].map((time): Plot => {
			const timeToHealCountValues: Map<number, number>[] = Array.from(timeToHealCounts.values());
			return {
				x: Array.from(timeToHealCounts.keys()),
				y: Array.from(timeToHealCountValues.map((x) => x.get(time) || 0)),
				type: 'bar',
				name: `${time} minutes to heal`,
			};
		}),
	];

	const layout: Layout = {
		title: 'Total Party Health After Combat',
		barmode: 'stack',
	};

	plot(data, layout);
}

function main() {
	plotHealingInfo(testCharacters);
	plotHealingInfo(baselineCharacters);
}

main();
