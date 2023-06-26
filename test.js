const fs = require("fs");
const test = require("ava");
const postcss = require("postcss");
const plugin = require("./index.js");

async function compare(t, fixtureFilePath, expectedFilePath, options = {}) {
	return postcss([plugin(options)])
		.process(readFile(`./fixtures/${fixtureFilePath}`), {
			from: fixtureFilePath,
		})
		.then((result) => {
			const expected = result.css;
			const actual = readFile(`./expected/${expectedFilePath}`);
			t.is(expected, actual);
			if (options.fix === false) t.is(result.warnings().length, 1);
		});
}

function readFile(filename) {
	return fs.readFileSync(filename, "utf8");
}

test("report on unused vars", (t) => {
	return compare(t, "report-only.css", "report-only.css", { fix: false });
});

test("drop unused variables, unless internally referenced", (t) => {
	return compare(t, "remove-unused.css", "remove-unused.css");
});
