import { Octokit } from "octokit";
import { writeFileSync } from 'fs';
import { configDotenv } from "dotenv";

configDotenv();
const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_TOKEN;
const ORG_NAME = process.env.ORG_NAME;

const numberOfRepositories = 808;
const numberOfPages = Math.ceil(numberOfRepositories / 100);

const lastYear = new Date();
lastYear.setFullYear(lastYear.getFullYear() - 1);
const lastYearISO = lastYear.toISOString();

const octokit = new Octokit({ 
  auth: GITHUB_TOKEN,
});

const getAllRepositories = async () => {
  const allRepositories = [];

  for (let i = 1; i <= numberOfPages; i++) {
    try{
      const res = await octokit.request('GET /orgs/{org}/repos', {
        org: ORG_NAME,
        per_page: 100,
        sort: 'pushed',
        page: i,
      })
      const repositorieNames = res.data.map(repo => repo.name);
      allRepositories.push(...repositorieNames);
    } catch (error) {
      console.log('Não foi possível buscar repositórios. Erro:', error)
    }
  }
  return allRepositories;
}

async function getCommitsOrActivities(repoName) {
  try {
    const commits = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner: ORG_NAME,
      repo: repoName,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
      per_page: 1,
      since: lastYearISO,
    })
  
    if (commits.data.length > 0) {
      return true;
    }

    const activity = await octokit.request('GET /repos/{owner}/{repo}/activity', {
      owner: ORG_NAME,
      repo: repoName,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
      per_page: 1,
      activity_type: 'push',
      time_period: 'year',
    })

    if (activity.data.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function findOwners(repoName) {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: ORG_NAME,
      repo: repoName,
      path: 'CODEOWNERS',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    const data = response.data;
    const owners = Buffer.from(data.content, 'base64').toString('utf8')
    return owners;
  }
  catch (error) {
    return '';
  }
}

async function getContent(repoName) {
  try {
    const content = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: ORG_NAME,
      repo: repoName,
      path: '.github',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    const data = content.data || [];
    const hasConfig = data.some(file => file?.name.toLowerCase() === 'pull_request_template.md');

    if(!hasConfig) {
      const codeownersFile = data.find(file => file?.name === 'CODEOWNERS')
      if (codeownersFile) {
        return {hasTemplate: false, owners: Buffer.from(codeownersFile.content, 'base64').toString('utf8')};
      }
      const findMyOwner = await findOwners(repoName)
      return {hasTemplate: false, owners: findMyOwner};
    };

    return {hasTemplate: true, owners: ''};
  }
  catch (error) {
    const findMyOwner = await findOwners(repoName);
      return {hasTemplate: false, owners: findMyOwner};
  }
}

async function convertAndSave(array) {
  function arrayParaCSV(array) {
    const headers = Object.keys(array[0]).join(',') + '\n';
    const linhas = array.map(obj => Object.values(obj).join(',')).join('\n');
    return headers + linhas;
  }
  
  const csvData = arrayParaCSV(array);
  
  try {
    writeFileSync('resultado.csv', csvData, 'utf8');
    console.log('Arquivo CSV salvo com sucesso!');
  } catch (err) {
    console.error('Erro ao salvar o arquivo:', err);
  }
}

const getRepositoriesWithoutTemplate = async () => {
  try {
    const allRepos = await getAllRepositories();

    const repositoriesWithoutTemplate = [];

    for (const repo of allRepos) {
      const commits = await getCommitsOrActivities(repo);

      if (commits) {
        const templateExists = await getContent(repo);

        if (!templateExists.hasTemplate) {
          repositoriesWithoutTemplate.push({repositoryName: repo, owners: templateExists.owners});
        }
      }
      else {
        const indexOfSecurityHub = allRepos.indexOf(repo);
        console.log('No commits in:', repo, ' which has indexOfSecurityHub:', indexOfSecurityHub);

        // break; // ordenação do github não é por commit nem por activity :/ em teoria já está ordenado por ordem de push, então se não houver commits, não haverá em mais nenhum da lista.
      }
    }

    console.log('The following Repositories are WithoutTemplate:', repositoriesWithoutTemplate);
    convertAndSave(repositoriesWithoutTemplate);

    return repositoriesWithoutTemplate;
  } catch (error) {
    console.error("Erro ao obter os repositórios:", error);
    return [];
  }
}

// console.log(await getContent('megasac-api'))
getRepositoriesWithoutTemplate();
