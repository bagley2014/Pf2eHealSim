import { CharacterSource, Trait } from './types';

import { getDataFilenames } from './helpers';
import { readFileSync } from 'fs';

// This would make sense in a CI test
export function auditData() {
	console.log('___Audit___');

	// Get all data, allowing  with passthrough of unexpected properties
	const data: Record<string, unknown>[] = [];
	for (const file of getDataFilenames()) {
		const json = JSON.parse(readFileSync(file, 'utf8'));
		const fileData = CharacterSource.sourceType().partial().passthrough().array().parse(json);
		data.push(...fileData);
	}

	console.log(`Total entries: ${data.length}`);

	const traits = new Map<string, number>();
	const incompleteEntries = [];
	for (const entry of data) {
		const keys = Object.keys(entry);
		// Count up all the assigned traits
		for (const key of keys) {
			traits.set(key, (traits.get(key) || 0) + 1);
		}
		// Track all the entries that are missing traits
		const requiredTraits = CharacterSource.sourceType().keyof().options;
		for (const trait of requiredTraits) {
			if (!keys.includes(trait)) {
				incompleteEntries.push(entry.name || entry);
				break;
			}
		}
	}

	if (incompleteEntries?.length) console.log('Entries that are missing required traits:', incompleteEntries);

	const unexpectedTraits = traits
		.entries()
		.filter((x) => !Trait.options.includes(x[0] as Trait))
		.toArray();
	if (unexpectedTraits?.length) console.log('Unexpected Traits:', unexpectedTraits);
}
