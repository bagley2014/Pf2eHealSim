import { confirm, select } from '@inquirer/prompts';

import fg from 'fast-glob';
import { readFileSync } from 'fs';
import { z } from 'zod';

type Arrayable<T> = T | T[];
function arrayArrayable<T>(val: Arrayable<T>) {
	if (Array.isArray(val)) return val;
	return [val];
}
const Attribute = z.enum(['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']);

const Character = z.object({
	name: z.string(),
	// armor: z.enum(['None', 'Light', 'Medium', 'Heavy']), bad, because higher levels imply lower levels, but I don't know how to represent that
	classArchetype: z.boolean(),
	// focusSpells: z.boolean(), see spellcaster
	keyAttribute: Attribute.or(Attribute.array()).transform(arrayArrayable),
	mechanicalDeity: z.boolean(),
	// spellcaster: z.boolean(), I might want to make this object | null so that I can nest some properties, like prepared/spontaneous or casting stat, but I need to figure out how the consuming logic would work with null and/or objects first
	type: z.enum(['Class', 'Archetype']),
});
type Character = z.infer<typeof Character>;

const Trait = Character.keyof();
type Trait = z.infer<typeof Trait>;

const AnswerMap = z.map(z.string(), Character.array());
type AnswerMap = z.infer<typeof AnswerMap>;

const Question = z.object({
	text: z.string(),
	answers: AnswerMap,
	score: z.number(), // Lower is better
});
type Question = z.infer<typeof Question>;

const getDataFilenames = () => fg.sync('**/classes/**/*.json');

function getQuestionText(trait: Trait): string {
	switch (trait) {
		case 'name':
			return 'Here are your options:';
		case 'classArchetype':
			return 'Is taking a class archetype ok?';
		// case 'focusSpells':
		// 	return 'Do you want focus spells?';
		case 'keyAttribute':
			return 'What key attribute do you want?';
		case 'mechanicalDeity':
			return "Do you want your character's deity choice to have a mechanical impact?";
		// case 'spellcaster':
		// 	return 'Do you want a spellcasting class feature?';
		case 'type':
			return 'Are you looking for a class or an archetype?';
	}
}

function getApplicableAnswers(trait: Trait, character: Character): string[] {
	switch (trait) {
		case 'name':
			return [character.name];
		case 'classArchetype':
			return character.classArchetype ? ['Yes'] : ['No', 'Yes'];
		case 'keyAttribute':
			return character.keyAttribute;
		case 'mechanicalDeity':
			return character.mechanicalDeity ? ['Yes', "Don't care"] : ['No', "Don't care"];
		case 'type':
			return [character.type, "Don't care"];
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
		score: average(
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

export function auditData() {
	console.log('___Audit___');

	// Get all data, allowing  with passthrough of unexpected properties
	const data: Record<string, unknown>[] = [];
	for (const file of getDataFilenames()) {
		const json = JSON.parse(readFileSync(file, 'utf8'));
		const fileData = Character.partial().passthrough().array().parse(json);
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
		for (const trait of Trait.options) {
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
		possibleQuestions.push(getQuestion(trait, data));
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
			.map(([answer, characters]) => ({ name: answer, value: characters }))
			.toArray(),
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
		const fileData = Character.array().parse(json);
		data.push(...fileData);
	}

	do {
		const selectedCharacter = await reduceCharacters(data);
		console.log(selectedCharacter.name);
	} while (await confirm({ message: 'Start over?', default: false, transformer: (b) => (b ? 'Yes' : 'No') }));
}

main();
