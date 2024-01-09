import "./style.scss";

import d3 from "d3";

const REPORT_DATA_REF = "2024-01";

import {BubbleMap} from "./bubbleMap";
import {NumberFormatterEN, NumberFormatterTR} from "./common";
import {LollipopChart} from "./lollipopChart";
import {WordCloud} from "./wordCloud";
import {BarChart} from "./barChart";

type OssContributor = {
    profile:{
        username:string;
        name:string;
        company:string;
        province:string;
    };
    // TODO: there's more info availabile here
    score:number;
    contributionScoresPerRepository:{ [repoNameWithOwner:string]:number };
}

interface CompanyInformation {
    name:string;
    numberOfUsers:number;
    sumOfScores:number;
    contributionScoresPerRepository:{ [repoNameWithOwner:string]:number };
}

let focusOrgs:{ [name:string]:number };
let focusRepos:{ [nameWithOwner:string]:number };
let userCounts:{ [province:string]:number };
let activeUserCounts:{ [province:string]:number };
let ossContributorCounts:{ [province:string]:number };
let userSignedUpAt:{ [date:string]:number };
let ossContributors:OssContributor[];
let companyOssContribution:{ [company:string]:CompanyInformation };

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
        d3.json(`https://raw.githubusercontent.com/OpenTRFoundation/state-of-oss-contribution/${REPORT_DATA_REF}/990-report-data/330-company-oss-contribution-information-map.json`),
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
        ]) => {
        focusOrgs = _focusOrgs as { [name:string]:number };
        focusRepos = _focusRepos as { [nameWithOwner:string]:number };
        userCounts = _userCounts as { [province:string]:number };
        activeUserCounts = _activeUserCounts as { [province:string]:number };
        ossContributorCounts = _ossContributorCounts as { [province:string]:number };
        userSignedUpAt = _userSignedUpAt as { [date:string]:number };
        ossContributors = _ossContributors as OssContributor[];
        companyOssContribution = _companyOssContribution as { [company:string]:CompanyInformation };
    });

    renderUserCountVisualizations();
    renderFocusOrgsAndRepoVisualizations();
    renderCompanyVisualizations();
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
        .slice(0, 50)
        .reduce((obj, [key, value]) => (
            Object.assign(obj, {[key]: Math.sqrt(value) * 4})
        ), {});


    new WordCloud("#focus-orgs-word-cloud", topFocusOrgs).draw();
}

function drawFocusRepositoryWordCloud() {
    // get top N focus orgs
    let topFocusRepos = Object.entries(focusRepos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .reduce((obj, [key, value]) => (
            Object.assign(obj, {[key]: Math.log2(value) * 2})
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
        .text(function (d) {
            return <any>d;
        })
}

function renderCompanyVisualizations() {
    // first, build a map to group minor contributors under "-Other-" company
    const groupedMap:{ [company:string]:CompanyInformation } = {
        // TODO: no hardcoding
        "-Other-": {
            name: "-Other-",
            numberOfUsers: 0,
            sumOfScores: 0,
            contributionScoresPerRepository: {},
        }
    };
    for (const companyInformation of Object.values(companyOssContribution)) {
        if (companyInformation.numberOfUsers > 1) {
            groupedMap[companyInformation.name] = companyInformation;
        } else {
            groupedMap["-Other-"].numberOfUsers += companyInformation.numberOfUsers;
            groupedMap["-Other-"].sumOfScores += companyInformation.sumOfScores;
            for (const repo in companyInformation.contributionScoresPerRepository) {
                if (!groupedMap["-Other-"].contributionScoresPerRepository[repo]) {
                    groupedMap["-Other-"].contributionScoresPerRepository[repo] = 0;
                }
                groupedMap["-Other-"].contributionScoresPerRepository[repo] += companyInformation.contributionScoresPerRepository[repo];
            }
        }
    }

    let groupedCompanies = Object.values(groupedMap);
    groupedCompanies.sort(function (a, b) {
        if (a.sumOfScores == b.sumOfScores) {
            return a.name.localeCompare(b.name);
        }
        return b.sumOfScores - a.sumOfScores;
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
                d.numberOfUsers,
                d.sumOfScores,
                mostContributedOrgs(d.contributionScoresPerRepository, 5),
            ];
        })
        .enter()
        .append("td")
        .text(function (d) {
            return <any>d;
        })

    const companyOssCountributorCountData:{ [company:string]:number } = {};
    for (const companyInformation of groupedCompanies) {
        companyOssCountributorCountData[companyInformation.name] = companyInformation.numberOfUsers;
    }

    const companyOssContributorScoreData:{ [company:string]:number } = {};
    for (const companyInformation of groupedCompanies) {
        companyOssContributorScoreData[companyInformation.name] = companyInformation.sumOfScores;
    }

    new LollipopChart("#company-oss-contributor-count-chart", companyOssCountributorCountData).draw();
    new LollipopChart("#company-oss-contributor-score-chart", companyOssContributorScoreData).draw();
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
    return sorted.slice(0, limit).map(([name, _]) => `${name}`).join(", ");
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
