const valueMultipliers = [-1, 0, 1, 2]; // [0, 0.5, 1, 2] is save-like, rather than rolling
export function calculateExpectedValue(mod: number, dc: number) {
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
export function getTier(expectedValue: number) {
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

// It turns out expected value directly corresponds to the difference of the dc and the mod
// We can see that all crits, or all crit fails, is impossible because 1s and 20s exist
// Even so, at a certain point, that's the only way to get a different outcome, no matter how much further the mod gets from the DC
// Leading up to that point, +1s are half as effective as they could be, because they only impact the very best/worst few rolls
export function getExpectedValue(mod: number, dc: number) {
	const diff = Math.min(Math.max(dc - mod, -9), 30);
	switch (diff) {
		case 30:
			return -0.95;
		case 29:
			return -0.9;
		case 28:
			return -0.85;
		case 27:
			return -0.8;
		case 26:
			return -0.75;
		case 25:
			return -0.7;
		case 24:
			return -0.65;
		case 23:
			return -0.6;
		case 22:
			return -0.55;
		case 21:
			return -0.5;
		case 20:
			return -0.4;
		case 19:
			return -0.3;
		case 18:
			return -0.2;
		case 17:
			return -0.1;
		case 16:
			return 0;
		case 15:
			return 0.1;
		case 14:
			return 0.2;
		case 13:
			return 0.3;
		case 12:
			return 0.4;
		case 11:
			return 0.5;
		case 10:
			return 0.55;
		case 9:
			return 0.65;
		case 8:
			return 0.75;
		case 7:
			return 0.85;
		case 6:
			return 0.95;
		case 5:
			return 1.05;
		case 4:
			return 1.15;
		case 3:
			return 1.25;
		case 2:
			return 1.35;
		case 1:
			return 1.45;
		case 0:
			return 1.5;
		case -1:
			return 1.55;
		case -2:
			return 1.6;
		case -3:
			return 1.65;
		case -4:
			return 1.7;
		case -5:
			return 1.75;
		case -6:
			return 1.8;
		case -7:
			return 1.85;
		case -8:
			return 1.9;
		case -9:
			return 1.95;
	}
}
