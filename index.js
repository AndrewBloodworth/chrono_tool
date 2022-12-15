const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");
require("colors");
const selectors = require("./selectors");
const Encryption = require("./encryption");

const logger = (message) => console.log(message);

const authenticate = async (page) => {
  logger("Begin Authentication".blue);

  const Ciper = new Encryption(path.join(__dirname, "cookie.json"));
  const cookies = Ciper.decrypt();

  if (cookies) {
    await page.setCookie(...JSON.parse(cookies));
    await page.goto(selectors.pages.api_console);
  }

  try {
    await page.waitForSelector(selectors.navigation.workflow, { timeout: 500 });
  } catch (error) {
    logger("Log in".yellow);
    await page.goto(selectors.pages.api_console);

    await page.type(selectors.authentication.username, process.env.USERNAME);
    await page.type(selectors.authentication.password, process.env.PASSWORD);

    await page.click(selectors.authentication.login);

    await page.waitForNavigation();
    Ciper.encrypt(JSON.stringify(await page.cookies()));
  }

  logger("Authenticated".green);
};

const sleep = async (ms) =>
  new Promise((res) => {
    setTimeout(res, ms);
  });

const sync_single_file = async (page, namespace, file_name, progress) => {
  logger(`Attempt to sync ${file_name} ${progress}`.yellow);
  for (let i = 0; i < 5; i++) {
    await page.goto(selectors.pages.api_console);

    await page.click(selectors.navigation.workflow);

    await page.type(selectors.forms.copy_single_file.partner, namespace);
    await page.type(selectors.forms.copy_single_file.file_path, file_name);

    await page.click(selectors.forms.copy_single_file.button);

    const response = await page.waitForResponse(
      selectors.responses.copy_single_file_to_datastore
    );

    const response_text = await response.text();
    if (response_text === "File sync complete") {
      logger(`Successfully synced file: ${file_name}`.green);
      break;
    } else {
      const try_num = i + 1;
      logger(`Try (${try_num}/5) - ${response_text}`.red);
      if (try_num < 5) {
        const ms = try_num * 1000;
        logger(`Sleeping for ${ms}ms before retry`.yellow);
        await sleep(ms);
      }
    }
  }
};

const partner_tick = async (page, namespace) => {
  await page.goto(selectors.pages.api_console);

  await page.click(selectors.navigation.chrono);

  await page.type(selectors.forms.partner_tick.partner, namespace);
  await page.click(selectors.forms.partner_tick.button);

  await page.waitForResponse(selectors.responses.partner_tick);
  logger(`Partner Tick Success`.green);
};
const optionDefinitions = [
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Show this help text",
  },
  {
    name: "namespace",
    alias: "n",
    type: String,
    description: "Partner namespace",
  },
  {
    name: "files",
    alias: "f",
    type: String,
    description: "Files to sync with datastore",
  },
  {
    name: "partnertick",
    alias: "p",
    type: Boolean,
    description: "Run a partner tick",
  },
];
const guide = [
  {
    header: "Chrono Tool",
    content: `Chrono Tool is a tool for chrono`,
  },
  {
    header: "Flags:".red,
    optionList: optionDefinitions,
  },
  {
    header: "Usage:".blue,
    content: `chrono_tool`,
  },
];
const main = async () => {
  let options = { help: true };
  try {
    options = commandLineArgs(optionDefinitions);
  } catch (e) {
    console.log(e.message);
  }

  if (options.help) {
    var helpText = commandLineUsage(guide);
    console.log(helpText);
    process.exit(1);
  }
  if (!!!options.namespace) {
    logger("Namespace is required".red);
    return;
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await authenticate(page);

  const partner = options.namespace;
  const files = Array.from(
    new Set((options.files || "").split(",").filter((file) => file))
  );
  if (files.length > 0) {
    logger(`Begin syncing process for ${partner}`.blue);
    for (let i = 0; i < files.length; i++) {
      await sync_single_file(
        page,
        partner,
        files[i],
        `(${i + 1}/${files.length})`
      );
    }
  }

  if (options.partnertick) {
    logger(`Begin partner tick for ${partner}`.blue);
    await partner_tick(page, partner);
  }

  await browser.close();
};

main();
