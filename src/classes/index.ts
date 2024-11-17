import { AnswerMap, CanonicalOptionOrdering, Character, CharacterSource, Question, Trait } from './types';
import { confirm, select } from '@inquirer/prompts';

import fg from 'fast-glob';
import { readFileSync } from 'fs';

const getDataFilenames = () => fg.sync('**/classes/**/*.json');

function getQuestionText(trait: Trait): string {
	switch (trait) {
		case Trait.enum.name:
			return 'Here are your options:';
		case Trait.enum.description:
			return 'N/A';
		case Trait.enum.armor:
			return "What's the lowest armor proficiency you'd accept?";
		case Trait.enum.classArchetype:
			return 'Is taking a class archetype ok?';
		case Trait.enum.focusSpells:
			return 'Do you want focus spells?';
		case Trait.enum.focusSpells_attribute:
			return 'What focus spell spellcasting attribute do you want?';
		case Trait.enum.focusSpells_tradition:
			return 'Which focus spell tradition do you want?';
		case Trait.enum.keyAttribute:
			return 'What key attribute do you want?';
		case Trait.enum.mechanicalDeity:
			return "Do you want your character's deity choice to have a mechanical impact?";
		case Trait.enum.spellcasting:
			return 'Do you want spell slots and a spellcasting class feature?';
		case Trait.enum.spellcasting_attribute:
			return 'What spellcasting attribute do you want?';
		case Trait.enum.spellcasting_full:
			return 'Do you want to be a full caster?';
		case Trait.enum.spellcasting_repertoire:
			return 'Do you want a spell repertoire class feature?';
		case Trait.enum.spellcasting_tradition:
			return 'Which spellcasting tradition do you want?';
		case Trait.enum.type:
			return 'Are you looking for a class or an archetype?';
	}
}

// Returns the list of answers that a character ISN'T disqualified by
function getApplicableAnswers(trait: Trait, character: Character): string[] {
	switch (trait) {
		// Simple strings
		case Trait.enum.name:
			return [character[trait]];
		case Trait.enum.type:
			return [character[trait] || 'null', "Don't care"];

		// Simple booleans
		case Trait.enum.mechanicalDeity:
		case Trait.enum.focusSpells:
		case Trait.enum.spellcasting:
		case Trait.enum.spellcasting_full:
		case Trait.enum.spellcasting_repertoire:
			return character[trait] ? ['Yes', "Don't care"] : ['No', "Don't care"];

		// String arrays
		case Trait.enum.keyAttribute:
		case Trait.enum.focusSpells_attribute:
		case Trait.enum.focusSpells_tradition:
		case Trait.enum.spellcasting_attribute:
		case Trait.enum.spellcasting_tradition:
			return [...(character[trait] || ['null']), "Don't Care"];

		// Misc Section
		case Trait.enum.description:
			return [];
		case Trait.enum.armor:
			return character.armor == 'Heavy'
				? ['None', 'Light', 'Medium', 'Heavy']
				: character.armor == 'Medium'
					? ['None', 'Light', 'Medium']
					: character.armor == 'Light'
						? ['None', 'Light']
						: ['None'];
		case Trait.enum.classArchetype:
			return character.classArchetype ? ['Yes'] : ['No', 'Yes'];
	}
}

function getQuestion(trait: Trait, characters: Character[]): Question {
	const average = (arr: number[]) => arr.reduce((acc, val) => acc + val) / arr.length;

	const answers: AnswerMap = new Map<string, Character[]>();
	const addCharacter = (key: string, value: Character) => answers.set(key, [...(answers.get(key) || []), value]);

	for (const character of characters) {
		for (const answer of getApplicableAnswers(trait, character)) {
			addCharacter(answer, character);
		}
	}

	return {
		text: getQuestionText(trait),
		answers: answers,
		// This tells us how many characters remain given each answer, on average
		score:
			answers.size == 0
				? Infinity
				: average(
						answers
							.values()
							.map((x) => x.length)
							.toArray(),
					),
	};
}

function getBestQuestion(questions: Question[], maxScore: number) {
	if (questions.length == 0) throw new Error('Questions must be non-zero in length');

	questions.sort((a, b) => a.score - b.score);
	let bestQuestion = questions[0];

	// This function filters the list of questions, then returns a new best question, if it exists
	const tryFilter = (predicate: (value: Question) => boolean) => {
		questions = questions.filter(predicate);
		return questions.length == 0 ? bestQuestion : questions[0];
	};

	// Filter out questions with only one answer, for they are useless
	bestQuestion = tryFilter((question) => question.answers.size > 1);

	// Filter out questions with the max score, for they have no discernment power and are therefore useless
	bestQuestion = tryFilter((question) => question.score + 0.0001 < maxScore);

	// Avoid asking about the class directly, because we only want to do that if we have no other choice, since it isn't meaningful on its own
	bestQuestion = tryFilter((question) => question.text != getQuestionText('name'));

	// Filter out questions with more than three answers, for they are unwieldy
	bestQuestion = tryFilter((question) => question.answers.size <= 3);

	return bestQuestion;
}

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

async function reduceCharacters(data: Character[], answeredQuestions: string[] = []) {
	// Start of recursive function, with anchor point
	if (data.length == 0) throw new Error('Data cannot be empty');
	if (data.length == 1) return data[0];
	console.log(`You've got ${data.length} options`);

	// Figure out possible questions
	const possibleQuestions = [];
	for (const trait of Trait.options) {
		// Skip any traits where any of the characters have a null value
		if (!data.map((x) => x[trait]).filter((x) => x === null).length) possibleQuestions.push(getQuestion(trait, data));
	}

	// Decide which question to ask, ignoring questions that were already answered
	const bestQuestion = getBestQuestion(
		possibleQuestions.filter((x) => !answeredQuestions.includes(x.text)),
		data.length,
	);
	answeredQuestions.push(bestQuestion.text);

	// Ask the question
	const remainingCharacters = await select({
		message: bestQuestion.text,
		choices: bestQuestion.answers
			.entries()
			.toArray()
			.sort()
			.sort(([answerA, _], [answerB, __]) => CanonicalOptionOrdering.indexOf(answerA) - CanonicalOptionOrdering.indexOf(answerB))
			.map(([answer, characters]) => ({ name: answer, value: characters })),
	});

	// Recurse using the set of remaining options
	return reduceCharacters(remainingCharacters, answeredQuestions);
}

async function main() {
	// auditData();

	// Get all data
	const data: Character[] = [];
	for (const file of getDataFilenames()) {
		const json = JSON.parse(readFileSync(file, 'utf8'));
		const fileData = CharacterSource.array().parse(json);
		data.push(...fileData);
	}

	do {
		const selectedCharacter = await reduceCharacters(data);
		console.log(selectedCharacter.name);
		if (selectedCharacter.description) console.log(selectedCharacter.description);
	} while (await confirm({ message: 'Start over?', default: false, transformer: (b) => (b ? 'Yes' : 'No') }));
}

main();
