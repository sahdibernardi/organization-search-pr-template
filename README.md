# Find Repositories Without a pull_request_template.md in an Organization

This JavaScript file contains the script `getRepositoriesWithoutTemplate`, which is designed to fetch repositories that do not use a specific template.

## Functionality
The `getRepositoriesWithoutTemplate` function works by querying specific endpoints on gitHubAPI, filtering the results to exclude repositories that use a pull_request_template.md file. This is useful for scenarios where you want to analyze and improve Pull Request documentation on your organization.

## Requirements
node 16 or superior

## Setup
1. Clone this repository
2. You MUST have node.js installed on your machine in version 20^. If you don't have it, you can download it [here](https://nodejs.org/en/download/)
2. Install the dependencies by running `npm install`
3. Create a `.env` file in the root directory of the project and add the same variables as the `.env.example` file

## Running the script
Run the script by entering the root of this project on your terminal and running `node getRepositoriesWithoutTemplate.js`

The script will take a while to run, as it will fetch all repositories in the organization and then filter them. If your organization has a lot of repositories, you may want to consider running this script in a CI/CD pipeline.

When finished, the script will output a list of repositories that do not have a pull_request_template.md file in form of a .csv. The file will be saved in the root directory of the project and will be named `repositoriesWithoutTemplate.csv`. 

The structure of the file is as follows:
repositoryName, ownerName. Note that if the repository does not have an owner defined, the ownerName will be an empty string and on the CSV file an empty cell.

## Contributing
If you would like to contribute to this project, please open an issue or a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
