import { Answer, AnswerMap, Armor, Character, MartialWeapon, Question, Rarity, Trait } from './types';

import { Stats } from 'fast-stats';

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
		case Trait.enum.focusSpells_domainSpells:
			return 'Do you want access to deity domain spells?';
		case Trait.enum.focusSpells_tradition:
			return 'Which focus spell tradition do you want?';
		case Trait.enum.class_keyAttribute:
			return 'What key attribute do you want?';
		case Trait.enum.mechanicalDeity:
			return "Do you want your character's deity choice to have a mechanical impact?";
		case Trait.enum.spellcasting:
			return 'Do you want spell slots?';
		case Trait.enum.spellcasting_attribute:
			return 'What spellcasting attribute do you want?';
		case Trait.enum.spellcasting_full:
			return 'Do you want to be a full caster?';
		// It seems innate casters can't use wands/staves/scrolls :/
		case Trait.enum.spellcasting_kind:
			return 'What kind of spell slots do you want?';
		case Trait.enum.spellcasting_tradition:
			return 'Which spellcasting tradition do you want?';
		case Trait.enum.kind:
			return 'Are you looking for a class or just an archetype?';
		case Trait.enum.archetype_tenPlusFeats:
			return 'Must the archetype have 10 or more class feats?';
		case Trait.enum.archetype_multiclass:
			return 'Must the archetype be a multiclass archetype?';
		case Trait.enum.archetype_armorTraining:
			return 'Must the archetype dedication give some armor training?';
		case Trait.enum.martialWeaponTraining:
			return 'What martial weapon proficiencies do you want?';
		case Trait.enum.shieldBlock:
			return 'Do you want Shield Block at level 1?';
		case Trait.enum.companion:
			return 'Do you want to get access to (some kind of) a companion?';
		case Trait.enum.familiar:
			return 'Do you want to get access to a familiar?';
		case Trait.enum.precisionDamage:
			return 'Do you want a way to add precision damage to your attacks?';
		case Trait.enum.spellLikeAbility:
			return 'Do you want a spell-like ability?';
		case Trait.enum.rarity:
			return "What's the highest rarity you're allowed'?";
		case Trait.enum.healingAbility:
			return 'Do you want access to an infallible, 10-minute-cooldown healing ability?';
	}
}

// Returns the list of answers that a character ISN'T disqualified by
function getApplicableAnswers(trait: Trait, character: Character): string[] {
	switch (trait) {
		// Simple strings
		case Trait.enum.name:
			return [character[trait]];
		case Trait.enum.kind:
			return [character[trait], Answer.enum["Don't care"]];

		// Simple booleans
		case Trait.enum.mechanicalDeity:
		case Trait.enum.focusSpells:
		case Trait.enum.focusSpells_domainSpells:
		case Trait.enum.shieldBlock:
		case Trait.enum.spellcasting:
		case Trait.enum.spellcasting_full:
			return character[trait] ? [Answer.enum.Yes, Answer.enum["Don't care"]] : [Answer.enum.No, Answer.enum["Don't care"]];

		// Booleans where "Yes" eliminates options, but "No" does not
		case Trait.enum.archetype_armorTraining:
		case Trait.enum.archetype_multiclass:
		case Trait.enum.archetype_tenPlusFeats:
		case Trait.enum.familiar:
		case Trait.enum.precisionDamage:
			return character[trait] ? [Answer.enum.Yes, Answer.enum["Don't care"]] : [Answer.enum["Don't care"]];

		// Booleans where "No" eliminates options, but "Yes" does not
		case Trait.enum.class_classArchetype:
			return character[trait] ? [Answer.enum["Don't care"]] : [Answer.enum.No, Answer.enum["Don't care"]];

		// Booleans where a meaningful string is used in place of `true`
		case Trait.enum.companion:
		case Trait.enum.spellLikeAbility:
			return character[trait]
				? [Answer.enum.Yes, character[trait], Answer.enum["Don't care"]]
				: [Answer.enum.No, Answer.enum["Don't care"]];

		// Booleans where a string array is used in place of `true`
		case Trait.enum.healingAbility:
			return character[trait]
				? [Answer.enum.Yes, ...character[trait], Answer.enum["Don't care"]]
				: [Answer.enum.No, Answer.enum["Don't care"]];

		// String arrays
		case Trait.enum.class_keyAttribute:
		case Trait.enum.focusSpells_attribute:
		case Trait.enum.focusSpells_tradition:
		case Trait.enum.spellcasting_attribute:
		case Trait.enum.spellcasting_kind:
		case Trait.enum.spellcasting_tradition:
			return [...(character[trait] || ['null']), Answer.enum["Don't care"]];

		// Misc Section
		case Trait.enum.description:
			return [];
		case Trait.enum.rarity:
			return character.rarity == Rarity.enum.Common
				? [Rarity.enum.Unique, Rarity.enum.Rare, Rarity.enum.Uncommon, Rarity.enum.Common]
				: character.rarity == Rarity.enum.Uncommon
					? [Rarity.enum.Unique, Rarity.enum.Rare, Rarity.enum.Uncommon]
					: character.rarity == Rarity.enum.Rare
						? [Rarity.enum.Unique, Rarity.enum.Rare]
						: [Rarity.enum.Unique];
		case Trait.enum.class_armor:
			return character.class_armor == Armor.enum.Heavy
				? [Armor.enum.Unarmored, Armor.enum.Light, Armor.enum.Medium, Armor.enum.Heavy]
				: character.class_armor == Armor.enum.Medium
					? [Armor.enum.Unarmored, Armor.enum.Light, Armor.enum.Medium]
					: character.class_armor == Armor.enum.Light
						? [Armor.enum.Unarmored, Armor.enum.Light]
						: [Armor.enum.Unarmored];
		case Trait.enum.martialWeaponTraining:
			return character.martialWeaponTraining === MartialWeapon.enum.All
				? [...MartialWeapon.exclude([MartialWeapon.enum.None]).options, Answer.enum["Don't care"]]
				: [character.martialWeaponTraining, Answer.enum["Don't care"]];
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

export function getQuestion(trait: Trait, characters: Character[]): Question {
	const answers: AnswerMap = new Map<string, Character[]>();
	const addCharacter = (key: string, value: Character) => answers.set(key, [...(answers.get(key) || []), value]);

	for (const character of characters) {
		for (const answer of getApplicableAnswers(trait, character)) {
			addCharacter(answer, character);
		}
	}

	// If "Yes" is an answer, we don't want to include any identical answers,
	// For example, exclude "Animal" from "Do you want a companion?" if "Yes" is an equivalent answer
	if (answers.has(Answer.enum.Yes)) {
		const yesChars = new Set(answers.get(Answer.enum.Yes)?.map((char) => char.name));
		for (const answer of answers
			.keys()
			.toArray()
			.filter((x) => x != Answer.enum.Yes)) {
			const identicalCharSet = yesChars.symmetricDifference(new Set(answers.get(answer)!.map((char) => char.name))).size === 0;
			if (identicalCharSet) answers.delete(answer);
		}
	}

	// A question is useless if all the answers apply to all the options, aka, none of the answers eliminate any of the options
	const useless = answers.values().every((x) => x.length == characters.length);

	return { answers, text: getQuestionText(trait), score: getScore(answers, characters), useless };
}

// This function applies filters to the questions sequentially, keeping track of the best question before each filter is applied
// If a filter eliminates all the options, then we return the best question from before the filter was applied
// Because of this, the most important filters should be applied first, since they'll be the least likely to be ignored
// The "name" question filter is notable, because if that becomes the best question, the "game" is over,
//		so avoid filtering out valid but "suboptimal" questions before that filter
//		Anything before that filter is intended to be omitted permanently, not just deprioritized
export function findBestQuestion(questions: Question[]) {
	if (questions.length == 0) throw new Error('Questions must be non-zero in length');

	questions.sort((a, b) => a.score - b.score);
	let bestQuestion = questions[0];

	// This function filters the list of questions, then returns a new best question, if it exists
	const tryFilter = (predicate: (value: Question) => boolean) => {
		questions = questions.filter(predicate);
		return questions.length == 0 ? bestQuestion : questions[0];
	};

	// Filter out questions marked useless, for they are useless
	bestQuestion = tryFilter((question) => !question.useless);

	// Filter out questions with only one answer, for they are also useless
	bestQuestion = tryFilter((question) => question.answers.size > 1);

	// Avoid asking about the class directly, because we only want to do that if we have no other choice, since it isn't meaningful on its own
	bestQuestion = tryFilter((question) => question.text != getQuestionText('name'));

	// Filter out questions with more than four answers, for they are unwieldy
	bestQuestion = tryFilter((question) => question.answers.size <= 4);

	return bestQuestion;
}
