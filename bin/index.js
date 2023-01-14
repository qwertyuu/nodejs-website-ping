#! /usr/bin/env node
const puppeteer = require('puppeteer-extra');
const { executablePath } = require('puppeteer');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const yargs = require('yargs');
const { ExpressionExecutorStep, PageGetterStep, PageContentGetterStep } = require("../steps");

puppeteer.use(StealthPlugin());

const argv = yargs.options({
	url: {
		demand: true,
		alias: 'u',
		describe: 'The URL of the website to check',
		string: true
	},
	expression: {
		demand: true,
		alias: 'e',
		describe: 'The condition, as an expression, that must be met',
		string: true
	},
	wait_page_contents: {
		demand: false,
		alias: 'w',
		default: 0,
		describe: 'The number of milliseconds to wait before trying to get page contents',
		number: true
	},
	loop_delay: {
		demand: false,
		alias: 'd',
		default: 1000,
		describe: 'The number of milliseconds to wait between pings',
		number: true
	},
	timeout: {
		demand: false,
		alias: 't',
		default: 1000,
		describe: 'The number of milliseconds to wait before calling a timeout',
		number: true
	},
	headless: {
		demand: false,
		alias: 'h',
		default: true,
		describe: 'Start the ping browser in headless',
		boolean: true
	},
}).boolean("inverse").alias("inverse", "i").help().argv;

async function main(args) {
	const browser = await puppeteer.launch({ headless: args.headless, executablePath: executablePath() });
	const page = await browser.newPage();
	let stopPing = false;
	let context = {
		...args,
		page,
		responses: [],
	};
	const steps = [
		new PageGetterStep(context),
		new PageContentGetterStep(context),
		new ExpressionExecutorStep(context),
	];
	while (!stopPing) {
		let breakCalled = false;
		for (let index = 0; index < steps.length; index++) {
			const step = steps[index];

			const stepResult = await step.run(context);
			//console.log("Ran step " + step.constructor.name + " and got " + JSON.stringify(stepResult));

			let result = stepResult.result;
			if (args.inverse && typeof result === "boolean") {
				result = !result;
			}

			if (result === true) {
				if (stepResult.reason) {
					console.log(`yea! ${stepResult.reason}`);
				} else {
					console.log("yea!");
				}
				process.stderr.write("\007");
				breakCalled = true;
				break;
			} else if (result === false) {
				if (stepResult.reason) {
					console.log(`nope! ${stepResult.reason}`);
				} else {
					console.log("nope!");
				}
				breakCalled = true;
				break;
			}
		}
		if (!breakCalled) {
			console.error("No steps could determine whether the ping was successful. Aborting.");
			break;
		}
		if (stopPing) {
			break;
		}
		await new Promise(resolve => setTimeout(resolve, args.loop_delay));
		for (let index = 0; index < steps.length; index++) {
			const step = steps[index];
			if (step.pingDone) {
				step.pingDone(context);
			}
		}
	}
	await browser.close();
}

main(argv);
