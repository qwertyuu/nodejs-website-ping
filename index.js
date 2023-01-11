const puppeteer = require('puppeteer-extra');
const { executablePath } = require('puppeteer');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const yargs = require('yargs');
var userAgent = require('user-agents');
const { compileExpression } = require("filtrex");

puppeteer.use(StealthPlugin());

const argv = yargs.options({
  url: {
    demand: true,
    alias: 'u',
    describe: 'The URL of the website to check',
    string: true
  },
  condition: {
    demand: true,
    alias: 'c',
    describe: 'The condition that must be met',
    string: true
  },
  wait_before_page_load: {
    demand: false,
    alias: 'w',
    default: 0,
    describe: 'The number of milliseconds to wait before page load',
    number: true
  },
  loop_delay: {
    demand: false,
    alias: 'd',
    default: 1000,
    describe: 'The number of milliseconds to wait between pings',
    number: true
  }
}).help().alias('help', 'h').argv;

function strlen(s) {
  return s.length;
}

function contains(a, b) {
  return a.includes(b);
}

function print(a) {
  console.log(a);
  return true;
}

async function main(url, expression, wait_before_page_load, loop_wait) {
  // Compile expression to executable function
  var myfilter = compileExpression(expression, {
    extraFunctions: {
      strlen,
      contains,
      print,
    }
  });
  const browser = await puppeteer.launch({ headless: false, executablePath: executablePath() });
  const page = await browser.newPage();
  let responses = [];

  page.on('response', response => {
    if (response.url() === url) {
      const status = response.status();
      responses.push(status);
    }
  })
  while (true) {
    await page.setUserAgent(userAgent.random().toString());

    const response = await page.goto(url);
    await page.waitForTimeout(wait_before_page_load);

    const content = await page.evaluate(() => {
      return document.querySelector("body").textContent;
    });

    const context = {
      content,
      response,
      responses,
    };

    const result = myfilter(context);
    if (result === true) {
      console.log("yea!");
      process.stderr.write("\007");
    } else if (result === false) {
      console.log("nope!");
    } else {
      // error happened
      console.log(result);
      break;
    }
    responses = [];
    await new Promise(resolve => setTimeout(resolve, loop_wait));
  }
  await browser.close();
}

main(argv.url, argv.condition, argv.wait_before_page_load, argv.loop_delay);
