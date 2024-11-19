import { Answer, Character, CharacterSource, Trait, compareTraitStringsCanonically } from './types';
import { confirm, select } from '@inquirer/prompts';
import { findBestQuestion, getQuestion } from './questions';

import { getDataFilenames } from './helpers';
import { readFileSync } from 'fs';

async function reduceCharacters(data: Character[], answeredQuestions: string[] = []) {
	// Start of recursive function, with anchor point
	if (data.length == 0) throw new Error('Data cannot be empty');
	if (data.length == 1) return data[0];
	console.log(`You've got ${data.length} options`);

	// Figure out possible questions
	const possibleQuestions = [];
	for (const trait of Trait.options) {
		// Skip any traits where any of the characters have a null value
		if (!data.filter((x) => x[trait] === null).length) possibleQuestions.push(getQuestion(trait, data));
	}

	// Decide which question to ask, ignoring questions that were already answered
	const bestQuestion = findBestQuestion(possibleQuestions.filter((x) => !answeredQuestions.includes(x.text)));
	answeredQuestions.push(bestQuestion.text);

	// Ask the question
	const answerChoices = bestQuestion.answers
		.entries()
		.map(([answer, characters]) => ({ name: answer, value: characters }))
		.toArray();
	const remainingCharacters = await select({
		message: bestQuestion.text,
		choices: answerChoices
			.sort(({ name: a }, { name: b }) => (a > b ? 1 : b > a ? -1 : 0)) // Alphabetical
			.sort(({ name: a }, { name: b }) => compareTraitStringsCanonically(a, b)), // Canonical
	});

	// Recurse using the set of remaining options
	return reduceCharacters(remainingCharacters, answeredQuestions);
}

async function main() {
	// Get all data
	const data: Character[] = [];
	for (const file of getDataFilenames()) {
		const json = JSON.parse(readFileSync(file, 'utf8'));
		const fileData = CharacterSource.array().parse(json);
		data.push(...fileData);
	}

	// Main gameplay loop
	do {
		const selectedCharacter = await reduceCharacters(data);
		console.log(selectedCharacter.name);
		if (selectedCharacter.description) console.log(selectedCharacter.description);
	} while (await confirm({ message: 'Start over?', default: false, transformer: (b) => (b ? Answer.enum.Yes : Answer.enum.No) }));
}

main();
