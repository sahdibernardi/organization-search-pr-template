import { Octokit } from "octokit";
import { configDotenv } from "dotenv";

configDotenv();
const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_TOKEN;
const ORG_NAME = process.env.ORG_NAME;

const numberOfRepositories = 808;
// const numberOfPages = Math.ceil(numberOfRepositories / 100);
const numberOfPages = 2; // ajustar para o correto.

const octokit = new Octokit({ 
  auth: GITHUB_TOKEN,
});

const getAllRepositories = async () => {
  const allRepositories = [];

  for (let i = 1; i <= numberOfPages; i++) {
    try{
      const res = await octokit.request('GET /orgs/{org}/repos', {
        org: ORG_NAME,
        per_page: 100, // ajustar para 100
        sort: 'pushed',
        direction: 'desc',
        page: i,
      })
      const repositorieNames = res.data.map(repo => repo.name);
      allRepositories.push(...repositorieNames);
    } catch (error) {
      console.log('Não foi possível buscar repositórios. Erro:', error)
    }
  }
  console.log(allRepositories);
  return allRepositories;
}

async function getCommits(repoName) {
  try {
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
  
    if (activity.data.length > 0) return true;
    return false;
  } catch (error) {
    return false;
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
    const data = content.data;
    const hasConfig = data.some(file => file?.name.toLowerCase() === 'pull_request_template.md');
    return hasConfig;
  }
  catch (error) {
    return false;
  }
}

const getRepositoriesWithoutTemplate = async () => {
  try {
    const allRepos = await getAllRepositories();
    const repositoriesWithoutTemplate = [];

    for (const repo of allRepos) {
      const commits = await getCommits(repo);

      if (commits) {
        const templateExists = await getContent(repo);

        if (!templateExists) {
          repositoriesWithoutTemplate.push(repo);
        }
      }
      else {
        console.log('No commits in:', repo)
        break; // já está ordenado por ordem de push, então se não houver commits, não haverá em mais nenhum da lista.
      }
    }

    console.log('The following Repositories are WithoutTemplate:', repositoriesWithoutTemplate);
    return repositoriesWithoutTemplate;
  } catch (error) {
    console.error("Erro ao obter os repositórios:", error);
    return [];
  }
}

// getAllRepositories();
// getCommits('sendgrid4r'); // repositório não mexido desde 2017
// getCommits('rdstation'); // repositório mais ativo
// console.log(await getContent('content-management-frontend')); // repo sem template
// console.log(await getContent('megasac-api')); // repo sem template
console.log('getCommits', await getCommits('security-hub')); // repo sem template
getRepositoriesWithoutTemplate();