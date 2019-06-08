'use strict';
const graphqlGot = require('graphql-got');
const controlAccess = require('control-access');
require('dotenv').config()

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;
const cache = `max-age=${Number(process.env.CACHE_MAX_AGE) || 300}`;
const maxRepos = Number(process.env.MAX_REPOS) || 6;

if (!token) {
	throw new Error('Please set your GitHub token in the `GITHUB_TOKEN` environment variable');
}

if (!username) {
	throw new Error('Please set your GitHub username in the `GITHUB_USERNAME` environment variable');
}
const query = `
	query {
		user(login: "${username}") {
			repositories(
				last: ${maxRepos},
				isFork: false,
				isLocked: false,
				ownerAffiliations: OWNER,
				privacy: PUBLIC,
				orderBy: {
					field: CREATED_AT,
					direction: DESC
				}
			) {
				nodes {
					name
					description
					url
					primaryLanguage {
						name
						color
					}
					stargazers() {
						totalCount
					}
					forks() {
						totalCount
					}
				}
			}
		}
	}
`;

async function fetchRepos() {
	const {body} = await graphqlGot('api.github.com/graphql', {
		query,
		token
	});

	const repos = body.user.repositories.nodes.map(repo => ({
		...repo,
		stargazers: repo.stargazers.totalCount,
		forks: repo.forks.totalCount
	}));
	return JSON.stringify(repos);
}

module.exports = async (request, response) => {
  const responseText = await fetchRepos()

	response.setHeader('cache-control', cache);
	response.end(responseText);
};
