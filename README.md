# Chrono Tool

## Set up

- Install dependencies `npm i`
- Add environment variables
  - Create a env file `touch .env`
  - Add bluecore.com/admin credentials
    - `USERNAME`
    - `PASSWORD`
  - Add the name of the folder you use for your partner repos. EX ~/bcroot/`partner_repo`/{namespace}
    - LOCAL_PARTNER_REPO_DIRECTORY
  - Add a secret key to encrypt and store the bluecore.com/admin credentials locally
    - SECRET
- Add an alias in your `.zshrc`
  - `alias dsync='node ~/bcroot/path_to_chrono_tool/index.js'

## Usage

- Run `dsync` from a partner repo to see all of the flags you can use.
