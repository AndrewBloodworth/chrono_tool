const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");
require("colors");
const selectors = require("./selectors");
const Encryption = require("./encryption");
const { exec } = require("child_process");

module.exports = class ChronoTool {
  constructor() {
    this.optionDefinitions = [
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
        description:
          "Specify partner namespace. If not given, Chrono tool will use the directory name of the current working directory (usually cloned partner repos).",
      },
      {
        name: "files",
        alias: "f",
        type: String,
        description:
          "Include files to sync to datastore separated by commas.\nEX: chrono.yaml,product_feed.sql",
      },
      {
        name: "git",
        alias: "g",
        type: Boolean,
        description:
          "Include all files from most recent git commit from the current working directory.",
      },
      {
        name: "partnertick",
        alias: "p",
        type: Boolean,
        description: "Run a partner tick after syncing all files to datastore.",
      },
    ];
    this.guide = [
      {
        header: "Chrono Tool",
        content: `Chrono Tool is a tool used to sync chronometer jobs to datastore from the command line.`,
      },
      {
        header: "Flags:".red,
        optionList: this.optionDefinitions,
      },
      {
        header: "Usage:".blue,
        content: `dsync -g`,
      },
    ];
  }
  logger(message) {
    console.log(message);
  }
  async execSync(command) {
    return new Promise((success, failure) => {
      exec(command, (err, stdout, stderr) => {
        if (err) failure(err);
        success(stdout);
      });
    });
  }
  async init() {
    let options = { help: true };
    try {
      options = commandLineArgs(this.optionDefinitions);
    } catch (e) {
      this.logger(e.message);
    }

    if (options.help || Object.keys(options).length === 0) {
      var helpText = commandLineUsage(this.guide);
      this.logger(helpText);
      process.exit(1);
    }

    if (!options.namespace) {
      this.partner = process.cwd().split("/").pop();
      if (this.partner === "chrono_tool") {
        this.logger(`Namespace is required.`.red);
        process.exit(1);
      }
    } else {
      this.partner = options.namespace;
    }

    this.logger(`Namespace: ${this.partner}`.blue);
    let most_recently_commited_files = "";
    if (options.git) {
      const previous_commit_id = await this.execSync(
        `cd ${process.cwd()} && git rev-parse HEAD`
      );

      most_recently_commited_files = await this.execSync(
        `cd ${process.cwd()} && git diff-tree --no-commit-id --name-only -r ${previous_commit_id}`
      );
    }

    this.partnertick = options.partnertick;
    this.files = Array.from(
      new Set(
        [
          ...(options.files || "").split(","),
          ...most_recently_commited_files.split("\n"),
        ].filter((file) => file)
      )
    );

    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
  }
  async authenticate() {
    this.logger("Authenticating...".yellow);

    const Ciper = new Encryption(path.join(__dirname, "cookie.json"));
    const cookies = Ciper.decrypt();

    if (cookies) {
      await this.page.setCookie(...JSON.parse(cookies));
      await this.page.goto(selectors.pages.api_console);
    }

    try {
      await this.page.waitForSelector(selectors.navigation.workflow, {
        timeout: 500,
      });
    } catch (error) {
      this.logger("Log in".yellow);
      await this.page.goto(selectors.pages.api_console);

      await this.page.type(
        selectors.authentication.username,
        process.env.USERNAME
      );
      await this.page.type(
        selectors.authentication.password,
        process.env.PASSWORD
      );

      await this.page.click(selectors.authentication.login);

      await this.page.waitForNavigation();
      Ciper.encrypt(JSON.stringify(await this.page.cookies()));
    }

    this.logger("Authenticated".green);
  }

  async sleep(ms) {
    return new Promise((res) => {
      setTimeout(res, ms);
    });
  }

  async sync_files() {
    if (this.files.length === 0) return;

    this.logger(
      `File Sync:\n${this.files.map((file) => `- ${file}`).join("\n")}`.blue
    );
    for (let i = 0; i < this.files.length; i++) {
      await this.sync_single_file(
        this.files[i],
        `(${i + 1}/${this.files.length})`
      );
    }
  }
  async sync_single_file(file_name, progress) {
    this.logger(`Attempt to sync ${file_name} ${progress}`.yellow);
    for (let i = 0; i < 5; i++) {
      await this.page.goto(selectors.pages.api_console);

      await this.page.click(selectors.navigation.workflow);

      await this.page.type(
        selectors.forms.copy_single_file.partner,
        this.partner
      );
      await this.page.type(
        selectors.forms.copy_single_file.file_path,
        file_name
      );

      await this.page.click(selectors.forms.copy_single_file.button);

      const response = await this.page.waitForResponse(
        selectors.responses.copy_single_file_to_datastore
      );

      const response_text = await response.text();
      if (response_text === "File sync complete") {
        this.logger(`Successfully synced file: ${file_name}`.green);
        break;
      } else {
        const try_num = i + 1;
        this.logger(`Try (${try_num}/5) - ${response_text}`.red);
        if (try_num < 5) {
          const ms = try_num * 1000;
          this.logger(`Sleeping for ${ms}ms before retry`.yellow);
          await this.sleep(ms);
        }
      }
    }
  }

  async partner_tick() {
    if (!this.partnertick) return;
    this.logger(`Begin partner tick for ${this.partner}`.blue);
    await this.page.goto(selectors.pages.api_console);

    await this.page.click(selectors.navigation.chrono);

    await this.page.type(selectors.forms.partner_tick.partner, this.partner);
    await this.page.click(selectors.forms.partner_tick.button);

    await this.page.waitForResponse(selectors.responses.partner_tick);
    this.logger(`Partner Tick Success`.green);
  }

  async close() {
    await this.browser.close();
  }
};
