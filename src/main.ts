import './mods';

import { getExpectedValue } from './mods/misc';

function main() {
	const dc = 30;
	for (let mod = dc - 30; mod < dc + 10; mod++) console.log(mod, dc - mod, getExpectedValue(mod, dc));
}

main();
