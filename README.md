# Chrono Tool

## Set up

- Install dependencies `npm i`
- Add environment variables
  - Create a env file `touch .env`
  - Add bluecore.com/admin credentials
    - `USERNAME=email@email.com`
    - `PASSWORD=mysecretpassword`
  - You can manually supply the namespace using `-n namespace` or the tool can use the folder name you are current in (assuming you are running this tool from a cloned partner repo). To make this work you must add a environment variable that designates the folder that is used locally to store all of the cloned partner repos (used to make sure that we aren't pulling random folder names as the partner namespace). Add the name of the folder you use for your partner repos. EX ~/bcroot/`partner_repos`/{namespace}
    - `LOCAL_PARTNER_REPO_DIRECTORY=partner_repos`
  - Add a secret key to encrypt and store the bluecore.com/admin credentials locally
    - `SECRET=anystringatall`
- Add an alias in your `.zshrc`
  - `alias dsync='node ~/bcroot/path_to_chrono_tool/index.js'

## Usage

- Run `dsync` from a partner repo to see all of the flags you can use.
