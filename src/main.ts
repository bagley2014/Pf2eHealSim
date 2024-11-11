import { getExpectedValue } from './mods';

function main() {
	console.log(getExpectedValue(15, 15));
	console.log(getExpectedValue(10, 15));
	console.log(getExpectedValue(20, 20));
	console.log(getExpectedValue(15, 20));
}

main();
