const ChronoTool = require("./chrono_tool");
(async () => {
  const tool = new ChronoTool();

  await tool.init();

  await tool.authenticate();

  await tool.sync_files();

  await tool.partner_tick();

  await tool.close();
})();
