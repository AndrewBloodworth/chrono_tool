module.exports = {
  authentication: {
    username: "input#input27",
    password: "input#input34",
    login: 'input[type="submit"][value="Log in"]',
  },
  navigation: {
    workflow: "li.workflow > a",
    chrono: "li.chrono > a",
  },
  forms: {
    copy_single_file: (() => {
      const form_selector =
        'form[action="/api/workflow/copy_single_file_to_datastore"]';
      return {
        partner: `${form_selector} input[name="partner"]`,
        file_path: `${form_selector} input[name="file_path"]`,
        button: `${form_selector} button[type="submit"]`,
      };
    })(),
    partner_tick: (() => {
      const form_selector = 'form[action="/api/chrono/partner_tick"]';
      return {
        partner: `${form_selector} input[name="partner"]`,
        button: `${form_selector} button[type="submit"]`,
      };
    })(),
  },
  success: {
    file_sync: "div#output > div.data > pre",
  },
  pages: {
    api_console: "https://bluecore.com/admin/api_console",
  },
  responses: {
    copy_single_file_to_datastore:
      "https://bluecore.com/api/workflow/copy_single_file_to_datastore",
    partner_tick: "https://bluecore.com/api/chrono/partner_tick",
  },
};
