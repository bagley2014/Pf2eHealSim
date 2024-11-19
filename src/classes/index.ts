import { Answer, AnswerMap, Armor, Character, CharacterSource, Question, Trait, compareTraitStringsCanonically } from './types';
import { confirm, select } from '@inquirer/prompts';

import { Stats } from 'fast-stats';
import { getDataFilenames } from './helpers';
import { readFileSync } from 'fs';

function getQuestionText(trait: Trait): string {
	switch (trait) {
		case Trait.enum.name:
			return 'Here are your options:';
		case Trait.enum.description:
			return 'N/A';
		case Trait.enum.class_armor:
			return "What's the lowest armor proficiency you'd accept?";
		case Trait.enum.class_classArchetype:
			return 'Are you fine with taking a class archetype?';
		case Trait.enum.focusSpells:
			return 'Do you want focus spells?';
		case Trait.enum.focusSpells_attribute:
			return 'What focus spell spellcasting attribute do you want?';
		case Trait.enum.focusSpells_tradition:
			return 'Which focus spell tradition do you want?';
		case Trait.enum.class_keyAttribute:
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
		case Trait.enum.kind:
			return 'Are you looking for a class or just an archetype?';
		case Trait.enum.archetype_tenPlusFeats:
			return 'Must the archetype have 10 or more feats?';
		case Trait.enum.archetype_multiclass:
			return 'Must the archetype be a multiclass archetype?';
		case Trait.enum.archetype_armorTraining:
			return 'Must the archetype dedication give some armor training?';
		case Trait.enum.martialWeaponTraining:
			return 'Do you want martial weapon proficiency at level 1?';
		case Trait.enum.shieldBlock:
			return 'Do you want Shield Block at level 1?';
		case Trait.enum.animalCompanion:
			return 'Do you want to get access to an animal companion?';
		case Trait.enum.familiar:
			return 'Do you want to get access to a familiar?';
		case Trait.enum.precisionDamage:
			return 'Do you want a way to add precision damage to your attacks?';
	}
}

// Returns the list of answers that a character ISN'T disqualified by
function getApplicableAnswers(trait: Trait, character: Character): string[] {
	switch (trait) {
		// Simple strings
		case Trait.enum.name:
			return [character[trait]];
		case Trait.enum.kind:
			return [character[trait] || 'null', Answer.enum["Don't care"]];

		// Simple booleans
		case Trait.enum.mechanicalDeity:
		case Trait.enum.focusSpells:
		case Trait.enum.precisionDamage:
		case Trait.enum.shieldBlock:
		case Trait.enum.spellcasting:
		case Trait.enum.spellcasting_full:
		case Trait.enum.spellcasting_repertoire:
			return character[trait] ? [Answer.enum.Yes, Answer.enum["Don't care"]] : [Answer.enum.No, Answer.enum["Don't care"]];

		// Booleans where "Yes" eliminates options, but "No" does not
		case Trait.enum.animalCompanion:
		case Trait.enum.archetype_armorTraining:
		case Trait.enum.archetype_multiclass:
		case Trait.enum.archetype_tenPlusFeats:
		case Trait.enum.familiar:
			return character[trait] ? [Answer.enum.Yes, Answer.enum["Don't care"]] : [Answer.enum["Don't care"]];

		// Booleans where "No" eliminates options, but "Yes" does not
		case Trait.enum.class_classArchetype:
			return character[trait] ? [Answer.enum["Don't care"]] : [Answer.enum.No, Answer.enum["Don't care"]];

		// String arrays
		case Trait.enum.class_keyAttribute:
		case Trait.enum.focusSpells_attribute:
		case Trait.enum.focusSpells_tradition:
		case Trait.enum.spellcasting_attribute:
		case Trait.enum.spellcasting_tradition:
			return [...(character[trait] || ['null']), Answer.enum["Don't care"]];

		// Misc Section
		case Trait.enum.description:
			return [];
		case Trait.enum.class_armor:
			return character.class_armor == Armor.enum.Heavy
				? [Armor.enum.Unarmored, Armor.Enum.Light, Armor.Enum.Medium, Armor.Enum.Heavy]
				: character.class_armor == Armor.enum.Medium
					? [Armor.enum.Unarmored, Armor.Enum.Light, Armor.Enum.Medium]
					: character.class_armor == Armor.enum.Light
						? [Armor.enum.Unarmored, Armor.Enum.Light]
						: [Armor.enum.Unarmored];
		case Trait.enum.martialWeaponTraining:
			return character.martialWeaponTraining === true
				? ['Yes, all martial weapons', 'Yes, some martial weapons', Answer.enum["Don't care"]]
				: character.martialWeaponTraining
					? ['Yes, some martial weapons', Answer.enum["Don't care"]]
					: [Answer.enum["Don't care"]];
	}
}

function getScore(answers: AnswerMap, characters: Character[]) {
	// If there are no answers, the question gets a score of Infinity, which signifies that it should be ignored
	// Otherwise, we start by assigning each answer a score based on what portion of the characters will remain if that answer is selected
	//		Thus, the max score an answer can receive is 1, meaning 100% of the characters will remain if that answer is selected
	//		The purpose of representing the answers' scores as percentages is so that we can justify using the geometric mean, because the fraction is applied multiplicatively
	// Then, we compute a score for the question as a whole by multiplying the geometric mean of answers' scores with their geometric standard deviation
	// 		The geometric mean tells us how good the answers are on average
	//			The problem with an averaging metric is that questions with two answers, one that eliminates no options and another that eliminated most options, would get a really good score, because any average would be low
	// 		The standard deviation is useful for identifying questions where all the answers leave a similar number of remaining results
	//			In theory, having lots of choices that leave the same number of options would minimize the number of options remaining, and would be optimal, meaning the standard deviation is enough on its own
	//			But in practice, there options that can end up under multiple answers, meaning that a completely worthless question that can't eliminate any options with any answer will still have a good standard deviation
	//		By combining the two metrics, we try to reduce the pitfalls of both
	//			Not only do we identify a question whose answers are good "on average" but we also try to account for whether or not that's caused by outliers
	//			With this metric, questions with two answers, one scored near zero and another near one, get scores close to the max* of one rather than one close to the average
	//			(*that's the max an answer can have; a question can actually go higher, for math reasons I don't quite comprehend)
	// Note that the score for a question where all the answers are useless (aka have a score of 1) is also 1, meaning that useless questions have a score of 1
	//		(The worst geometric mean in this case is 1, naturally, and the smallest geometric standard deviation is also 1, representing absolutely no spread, so our final score is 1)
	//		But not all questions with a score >= 1 are useless, sometimes they're just not that good
	//		Any deviation is going to be greater than 1, and a bad, but not useless, average may be "high" (ake close to 1) enough to give a high score
	let score = Infinity;
	if (answers.size) {
		const s = new Stats().push(
			answers
				.values()
				.map((x) => x.length / characters.length)
				.toArray(),
		);
		const geometricStandardDeviation = s.gstddev();
		const geometricMean = s.gmean();
		score = geometricMean * geometricStandardDeviation;
	}
	return score;
}

function getQuestion(trait: Trait, characters: Character[]): Question {
	const answers: AnswerMap = new Map<string, Character[]>();
	const addCharacter = (key: string, value: Character) => answers.set(key, [...(answers.get(key) || []), value]);

	for (const character of characters) {
		for (const answer of getApplicableAnswers(trait, character)) {
			addCharacter(answer, character);
		}
	}

	return { answers, text: getQuestionText(trait), score: getScore(answers, characters) };
}

function getBestQuestion(questions: Question[]) {
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

	// Filter out questions with high scores, for they are unlikely to produce good results
	bestQuestion = tryFilter((question) => question.score + 0.0001 < 1);

	// Avoid asking about the class directly, because we only want to do that if we have no other choice, since it isn't meaningful on its own
	bestQuestion = tryFilter((question) => question.text != getQuestionText('name'));

	// Filter out questions with more than three answers, for they are unwieldy
	bestQuestion = tryFilter((question) => question.answers.size <= 3);

	return bestQuestion;
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
		if (!data.filter((x) => x[trait] === null).length) possibleQuestions.push(getQuestion(trait, data));
	}

	// Decide which question to ask, ignoring questions that were already answered
	const bestQuestion = getBestQuestion(possibleQuestions.filter((x) => !answeredQuestions.includes(x.text)));
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
