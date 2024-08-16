import "./style.scss";

import d3 from "d3";

const REPORT_DATA_REF = "2024-07";

// TODO: additional graphs:
// - # of focus orgs that people from TR contribute to (5 people contribute to 10+ focus orgs, 10 people contribute to 5-10 focus orgs, 100 people contribute to 1-5 focus orgs)

import {BubbleMap} from "./bubbleMap";
import {NumberFormatterEN, NumberFormatterTR} from "./common";
import {LollipopChart} from "./lollipopChart";
import {PieChart} from "./pieChart";
import {WordCloud} from "./wordCloud";
import {BarChart} from "./barChart";

const OTHER_COMPANY = "-Other-";
const UNKNOWN_COMPANY = "-Unknown-";
const OTHER_LANGUAGE = "-Other-";

type OssContributor = {
    profile:{
        username:string;
        name:string;
        company:string;
        province:string;
    };
    // TODO: there's more info availabile here
    contributionDiversityMultiplier:number;
    contributedFocusOrgCount:number;
    sumOfScores:number;
    score:number;
    contributionScoresPerRepository:{ [repoNameWithOwner:string]:number };
}

interface CompanyInformation {
    name:string;
    contributionScoresPerRepository:{[repoNameWithOwner:string]:number};
    sumOfUserScores:number;
    score:number;

    numberOfUsers:number;
    userDiversityMultiplier:number;

    contributedFocusOrgCount:number;
    contributionDiversityMultiplier:number;
}

let focusOrgs:{ [name:string]:number };
let focusRepos:{ [nameWithOwner:string]:number };
let userCounts:{ [province:string]:number };
let activeUserCounts:{ [province:string]:number };
let ossContributorCounts:{ [province:string]:number };
let userSignedUpAt:{ [date:string]:number };
let ossContributors:OssContributor[];
let companyOssContribution:{ [company:string]:CompanyInformation };
let contributedFocusOrganizations:{ [company:string]:{score:number; contributors:number; companies:string[];}};
let contributedFocusProjectPrimaryLanguages:{ [language:string]:number };
let weightedContributedFocusProjectLanguages:{ [language:string]:number };

async function main() {
    const browserLanguage = getUserLanguage();
    localize(browserLanguage);

    $(".navbar-nav .english").on("click", function () {
        setUserLanguage("en");
    });
    $(".navbar-nav .turkish").on("click", function () {
        setUserLanguage("tr");
    });

    enhanceLinks();

    // fetch data first
    await Promise.all([
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/110-focus-organization-score-map.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/120-focus-repository-score-map.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/210-user-province-counts-map.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/220-active-user-province-counts-map.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/230-oss-contributor-province-counts-map.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/240-user-signed-up-at-map.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/320-oss-contributor-leader-board.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/330-company-oss-contribution-leader-board.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/400-contributed-focus-organization-contribution-map.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/500-contributed-focus-project-primary-language-map.json`),
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/510-weighted-contributed-focus-project-language-map.json`),
    ]).then((
        [
            _focusOrgs,
            _focusRepos,
            _userCounts,
            _activeUserCounts,
            _ossContributorCounts,
            _userSignedUpAt,
            _ossContributors,
            _companyOssContribution,
            _contributedFocusOrganizations,
            _contributedFocusProjectPrimaryLanguages,
            _weightedContributedFocusProjectLanguages,
        ]) => {
        focusOrgs = _focusOrgs as { [name:string]:number };
        focusRepos = _focusRepos as { [nameWithOwner:string]:number };
        userCounts = _userCounts as { [province:string]:number };
        activeUserCounts = _activeUserCounts as { [province:string]:number };
        ossContributorCounts = _ossContributorCounts as { [province:string]:number };
        userSignedUpAt = _userSignedUpAt as { [date:string]:number };
        ossContributors = _ossContributors as OssContributor[];
        companyOssContribution = _companyOssContribution as { [company:string]:CompanyInformation };
        contributedFocusOrganizations = _contributedFocusOrganizations as { [company:string]:{score:number; contributors:number; companies:string[];} };
        contributedFocusProjectPrimaryLanguages = _contributedFocusProjectPrimaryLanguages as { [language:string]:number };
        weightedContributedFocusProjectLanguages = _weightedContributedFocusProjectLanguages as { [language:string]:number };
    });

    renderUserCountVisualizations();
    renderFocusOrgsAndRepoVisualizations();
    renderCompanyVisualizations();
    renderContributedFocusProjectVisualizations();
}

function enhanceLinks() {
    $(".content a")
        // make links open in new tab
        .attr("target", "_blank")
        // add icons to links
        .append(' <i class="bi bi-box-arrow-up-right"></i>');
}

function renderUserCountVisualizations() {
    // draw user count map and update the numbers in the cards
    new BubbleMap("#github-user-map", "#github-user-map-tooltip", userCounts).draw();
    doUpdateUserCountCards(userCounts, "#user-count-cards");

    // draw active user count map and update the numbers in the cards
    new BubbleMap("#active-github-user-map", "#active-github-user-map-tooltip", activeUserCounts).draw();
    doUpdateUserCountCards(activeUserCounts, "#active-user-count-cards");

    // draw oss contributor count map and update the numbers in the cards
    new BubbleMap("#oss-contributor-map", "#oss-contributor-map-tooltip", ossContributorCounts).draw();
    doUpdateUserCountCards(ossContributorCounts, "#oss-contributor-count-cards");

    // draw user sign up chart
    new BarChart("#user-signed-up-at-chart", userSignedUpAt).draw();

    // update the oss contributors table
    updateOssContributorsTable();

    const totalOssContributorCount = Object.values(ossContributorCounts).reduce((a, b) => a + b, 0);
    jQuery(".oss-contributor-count").html(String(totalOssContributorCount));
}

function renderFocusOrgsAndRepoVisualizations() {
    // draw word clouds and update the numbers for focus orgs and repos
    drawFocusOrgWordCloud();
    drawFocusRepositoryWordCloud();
    // ignore number formatting here, it is ok
    jQuery(".focus-org-count").html(String(Object.keys(focusOrgs).length));
    jQuery(".focus-repository-count").html(String(Object.keys(focusRepos).length));
}

function doUpdateUserCountCards(data:{ [key:string]:number }, parentDivId:string) {
    let dataClone = structuredClone(data);

    const total = Object.values(dataClone).reduce((a, b) => a + b, 0);

    // delete unknown province
    delete dataClone["-Unknown-"];

    // find top 3 provinces
    const topProvinces = Object.entries(dataClone)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const $parent = jQuery(parentDivId);

    // update total
    const $totalCount = $parent.find(".total .count");
    const $totalCountEN = $totalCount.find("span[lang='en']");
    const $totalCountTR = $totalCount.find("span[lang='tr']");
    $totalCountEN.html(NumberFormatterEN.format(total));
    $totalCountTR.html(NumberFormatterTR.format(total));

    // update provinces
    for (const i in topProvinces) {
        const $province = $parent.find(`.province-${i}`);
        const $count = $province.find(".count");
        const $name = $province.find(".name");

        const $countEN = $count.find("span[lang='en']");
        const $countTR = $count.find("span[lang='tr']");

        const $nameEN = $name.find("span[lang='en']");
        const $nameTR = $name.find("span[lang='tr']");

        $countEN.html(NumberFormatterEN.format(topProvinces[i][1]));
        $countTR.html(NumberFormatterTR.format(topProvinces[i][1]));

        $nameEN.html(String(topProvinces[i][0]));
        $nameTR.html(String(topProvinces[i][0]));
    }
}

function drawFocusOrgWordCloud() {
    // get top N focus orgs
    let topFocusOrgs = Object.entries(focusOrgs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100)
        .reduce((obj, [key, value]) => (
            Object.assign(obj, {[key]: Math.sqrt(value) / 10})
        ), {});


    new WordCloud("#focus-orgs-word-cloud", topFocusOrgs).draw();
}

function drawFocusRepositoryWordCloud() {
    // get top N focus orgs
    let topFocusRepos = Object.entries(focusRepos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .reduce((obj, [key, value]) => (
            Object.assign(obj, {[key]: Math.log2(value) * 3})
        ), {});


    new WordCloud("#focus-repositories-word-cloud", topFocusRepos).draw();
}


function updateOssContributorsTable() {
    // convert ossContributors from a map to an array
    let index = 1;
    const ossContributorsArray = Object.entries(ossContributors)
        .map(([_username, ossContributor]) => {
            return [
                index++,
                ossContributor.profile.username,
                ossContributor.profile.name,
                ossContributor.profile.company,
                ossContributor.sumOfScores,
                ossContributor.contributedFocusOrgCount,
                ossContributor.contributionDiversityMultiplier,
                ossContributor.score,
                mostContributedOrgs(ossContributor.contributionScoresPerRepository, 5),
            ];
        });

    d3
        .select("#oss-contributors-table")
        .append("tbody")
        .selectAll("tr")
        .data(ossContributorsArray)
        .enter()
        .append("tr")
        .selectAll("td")
        .data(function (d) {
            return d;
        })
        .enter()
        .append("td")
        .html(function (d, index) {
            switch (index) {
                case 1: {
                    return `<a class="link-dark" href="https://github.com/${d}" target="_blank">@${d}</a>`;
                }
                case 8: {
                    // convert array to links
                    const links = (<string[]>d).map(function (org:string) {
                        return `<a class="link-dark" href="https://github.com/${org}" target="_blank">${org}</a>`
                    });
                    return links.join(", ");
                }
                default: {
                    return <any>d;
                }
            }
        });
}

function renderCompanyVisualizations() {
    // first, build a map to group minor contributors under "-Other-" company
    const groupedMap:{ [company:string]:CompanyInformation } = {
        [OTHER_COMPANY]: {
            name: OTHER_COMPANY,
            contributionScoresPerRepository: {},
            sumOfUserScores: 0,
            score: 0,

            numberOfUsers: 0,
            userDiversityMultiplier: 1,

            contributedFocusOrgCount: 1,
            contributionDiversityMultiplier: 1,
        }
    };
    for (const companyInformation of Object.values(companyOssContribution)) {
        if (companyInformation.numberOfUsers > 1) {
            groupedMap[companyInformation.name] = companyInformation;
        } else {
            groupedMap[OTHER_COMPANY].numberOfUsers += companyInformation.numberOfUsers;
            groupedMap[OTHER_COMPANY].score += companyInformation.score;
            for (const repo in companyInformation.contributionScoresPerRepository) {
                if (!groupedMap[OTHER_COMPANY].contributionScoresPerRepository[repo]) {
                    groupedMap[OTHER_COMPANY].contributionScoresPerRepository[repo] = 0;
                }
                groupedMap[OTHER_COMPANY].contributionScoresPerRepository[repo] += companyInformation.contributionScoresPerRepository[repo];
            }
        }
    }

    let groupedCompanies = Object.values(groupedMap);
    groupedCompanies.sort(function (a, b) {
        if (a.score == b.score) {
            return a.name.localeCompare(b.name);
        }
        return b.score - a.score;
    });

    // update the company oss contributor count tables
    let index = 1;
    d3
        .select("#company-oss-contributor-count-table")
        .append("tbody")
        .selectAll("tr")
        .data(groupedCompanies)
        .enter()
        .append("tr")
        .selectAll("td")
        .data(function (d:any) {
            return [
                index++,
                d.name,
                d.sumOfUserScores,
                d.numberOfUsers,
                d.userDiversityMultiplier,
                d.contributedFocusOrgCount,
                d.contributionDiversityMultiplier,
                d.score,
                mostContributedOrgs(d.contributionScoresPerRepository, 5),
            ];
        })
        .enter()
        .append("td")
        .html(function (d, index) {
            switch (index) {
                case 8: {
                    // convert array to links
                    const links = (<string[]>d).map(function (org:string) {
                        return `<a class="link-dark" href="https://github.com/${org}" target="_blank">${org}</a>`
                    });
                    return links.join(", ");
                }
                default: {
                    return <any>d;
                }
            }
        });

    const companyOssCountributorCountData:{ [company:string]:number } = {};
    for (const companyInformation of groupedCompanies) {
        companyOssCountributorCountData[companyInformation.name] = companyInformation.numberOfUsers;
    }

    const companyOssContributorScoreData:{ [company:string]:number } = {};
    for (const companyInformation of groupedCompanies) {
        companyOssContributorScoreData[companyInformation.name] = companyInformation.score;
    }

    delete companyOssCountributorCountData[OTHER_COMPANY];
    delete companyOssCountributorCountData[UNKNOWN_COMPANY];
    delete companyOssContributorScoreData[OTHER_COMPANY];
    delete companyOssContributorScoreData[UNKNOWN_COMPANY];

    // TODO: only show top N

    new LollipopChart("#company-oss-contributor-count-chart", companyOssCountributorCountData).draw();
    new LollipopChart("#company-oss-contributor-score-chart", companyOssContributorScoreData).draw();
}

function renderContributedFocusProjectVisualizations() {
    // get the sorted list of keys
    let contributedFocusOrganizationsKeys = Object.keys(contributedFocusOrganizations);
    contributedFocusOrganizationsKeys.sort((a, b) => contributedFocusOrganizations[b].score - contributedFocusOrganizations[a].score);

    // get top N focus orgs
    contributedFocusOrganizationsKeys = contributedFocusOrganizationsKeys.slice(0, 50);

    // TODO: show sum of stars, number of matched focus repos, etc.
    // convert contributedFocusOrganizations from a map to an array
    let index = 1;
    const contributedFocusOrganizationsArray = contributedFocusOrganizationsKeys
        .map((company) => {
            return [
                index++,
                company,
                contributedFocusOrganizations[company].score,
                contributedFocusOrganizations[company].contributors,
                contributedFocusOrganizations[company].companies.length,
            ];
        });

    // update the company oss contributor count tables
    d3
        .select("#contributed-orgs-table")
        .append("tbody")
        .selectAll("tr")
        .data(contributedFocusOrganizationsArray)
        .enter()
        .append("tr")
        .selectAll("td")
        .data(function (d:[]) {
            return d;
        })
        .enter()
        .append("td")
        .html(function (d, index) {
            switch (index) {
                case 1: {
                    return `<a class="link-dark" href="https://github.com/${d}" target="_blank">${d}</a>`
                }
                default: {
                    return <any>d;
                }
            }
        });

    // ignore number formatting here, it is ok
    jQuery(".contributed-org-count").html(String(Object.keys(contributedFocusOrganizations).length));

    // get the total number of repositories contributed to, from the contributedFocusProjectPrimaryLanguages map
    const totalNumberOfRepositories = Object.values(contributedFocusProjectPrimaryLanguages).reduce((a, b) => a + b, 0);
    // ignore number formatting here, it is ok
    jQuery(".contributed-repo-count").html(String(totalNumberOfRepositories));

    // get the top N primary languages and their counts, combine the rest under "Other"
    const contributedFocusProjectPrimaryLanguagesKeys = Object.keys(contributedFocusProjectPrimaryLanguages);
    contributedFocusProjectPrimaryLanguagesKeys.sort((a, b) => contributedFocusProjectPrimaryLanguages[b] - contributedFocusProjectPrimaryLanguages[a]);
    const topNPrimaryLanguages = contributedFocusProjectPrimaryLanguagesKeys.slice(0, 15);
    const otherPrimaryLanguages = contributedFocusProjectPrimaryLanguagesKeys.slice(15);
    let otherPrimaryLanguagesCount = 0;
    for (const language of otherPrimaryLanguages) {
        otherPrimaryLanguagesCount += contributedFocusProjectPrimaryLanguages[language];
    }
    const topNPrimaryLanguagesWithOtherCounts:{ [language:string]:number } = {};
    for (const language of topNPrimaryLanguages) {
        topNPrimaryLanguagesWithOtherCounts[language] = contributedFocusProjectPrimaryLanguages[language];
    }
    topNPrimaryLanguagesWithOtherCounts[OTHER_LANGUAGE] = otherPrimaryLanguagesCount;

    new LollipopChart("#repo-primary-language-chart", topNPrimaryLanguagesWithOtherCounts, {
        xAxisScaleExponent: 1,
        xAxisMaxFactor: 1.1,
    }).draw();


    // get the top N languages, combine the rest under "Other"
    const contributedFocusProjectWeightedLanguagesKeys = Object.keys(weightedContributedFocusProjectLanguages);
    contributedFocusProjectWeightedLanguagesKeys.sort((a, b) => weightedContributedFocusProjectLanguages[b] - weightedContributedFocusProjectLanguages[a]);
    const topNWeightedLanguages = contributedFocusProjectWeightedLanguagesKeys.slice(0, 10);
    const otherWeightedLanguages = contributedFocusProjectWeightedLanguagesKeys.slice(10);
    let otherWeightedLanguagesTotal = 0;
    for (const language of otherWeightedLanguages) {
        otherWeightedLanguagesTotal += weightedContributedFocusProjectLanguages[language];
    }
    const topNWeightedLanguagesWithOtherCounts:{ [language:string]:number } = {};
    for (const language of topNWeightedLanguages) {
        topNWeightedLanguagesWithOtherCounts[language] = Math.floor(weightedContributedFocusProjectLanguages[language]);
    }
    topNWeightedLanguagesWithOtherCounts[OTHER_LANGUAGE] = Math.floor(otherWeightedLanguagesTotal);

    new PieChart("#repo-weighted-language-chart", topNWeightedLanguagesWithOtherCounts).draw();
}

function mostContributedOrgs(contributionScoresPerRepository:{ [repoNameWithOwner:string]:number }, limit:number) {
    const map = new Map<string, number>();

    for (const repo in contributionScoresPerRepository) {
        const orgName = repo.split("/")[0];
        if (!map.has(orgName)) {
            map.set(orgName, 0);
        }
        map.set(orgName, map.get(orgName)! + contributionScoresPerRepository[repo]);
    }

    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);

    // return the top N
    return sorted.slice(0, limit).map(([name, _]) => `${name}`);
}

function localize(language:string) {
    if (["tr", "en"].includes(language)) {
        let lang = ":lang(" + language + ")";
        let hide = "[lang]:not(" + lang + ")";
        document.querySelectorAll(hide).forEach(function (node:HTMLElement) {
            node.style.display = 'none';
        });
        let show = "[lang]" + lang;
        document.querySelectorAll(show).forEach(function (node:HTMLElement) {
            node.style.display = 'inherit';
        });
    }
}

function getUserLanguage() {
    if (localStorage.getItem("language")) {
        return localStorage.getItem("language")!;
    }

    let language = navigator.language;
    if (language) {
        language = language.split("-")[0];
    }
    if (!["tr", "en"].includes(language)) {
        language = "en";
    }
    return language;
}

function setUserLanguage(language:string) {
    localStorage.setItem("language", language);
    localize(language);
}

(() => {
    main();
})();
