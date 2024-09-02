const fs = require('fs');

const data = fs.readFileSync('groups.json');
const groups = JSON.parse(data);

const headToHeadResults = {};

function winProbability(rankingA, rankingB) {
    const rankingDifference = rankingB - rankingA;
    const exponent = rankingDifference / 400;
    const probabilityA = 1 / (1 + Math.pow(10, exponent));
    return probabilityA;
}

function getScore(mean) {
    return Math.max(0, Math.round(mean + (Math.random() - 0.5) * 10));
}


function simulateMatch(teamA, teamB) {
    const rankingA = teamA.FIBARanking;
    const rankingB = teamB.FIBARanking;

    const winProbabilityA = winProbability(rankingA, rankingB);
    const teamAWins = winProbabilityA < 0.50;

    const averageScoreA = 80 - (rankingA - rankingB) * 2;
    const averageScoreB = 80 + (rankingA - rankingB) * 2;
    const scoreAdjustment = (winProbabilityA - 0.5) * 0;
    const scoreA = getScore(averageScoreA + scoreAdjustment);
    const scoreB = getScore(averageScoreB - scoreAdjustment);
    scoreA === scoreB ? scoreA+1:scoreA+0;
    return {
        teamA: teamA,
        scoreA: scoreA,
        teamB: teamB,
        scoreB: scoreB,
        winner: teamAWins ? teamA.Team : teamB.Team
    };
}

function groupPhases(group) {
    const results = [];
    const teams = group.map(t => ({
        ...t,
        points: 0,
        scored: 0,
        conceded: 0,
        difference: 0,
        wins: 0,
        loses: 0
    }));
    for (let phase = 1; phase <= 3; phase++) {
        console.log(`\nGrupa ${group[0].Group} - kolo ${phase}:`);
        const matchups = getMatchups(phase, teams);

        matchups.forEach(({ teamA, teamB }) => {
            const result = simulateMatch(teamA, teamB);
            results.push(result);
            const teamAData = teams.find(t => t.Team === result.teamA.Team);
            const teamBData = teams.find(t => t.Team === result.teamB.Team);

            if (result.winner === teamAData.Team) {
                teamAData.points += 2;
                teamAData.wins += 1;
                teamBData.points += 1;
                teamBData.loses += 1;
            } else if (result.winner != teamAData.Team) {
                teamBData.points += 2;
                teamBData.wins += 1;
                teamAData.points += 1;
                teamAData.loses += 1;
            }

            teamAData.scored += result.scoreA;
            teamAData.conceded += result.scoreB;
            teamBData.scored += result.scoreB;
            teamBData.conceded += result.scoreA;
            teamAData.difference += result.scoreA - result.scoreB;
            teamBData.difference += result.scoreB - result.scoreA;

            if (!headToHeadResults[teamAData.Team]) headToHeadResults[teamAData.Team] = {};
            if (!headToHeadResults[teamBData.Team]) headToHeadResults[teamBData.Team] = {};
            headToHeadResults[teamAData.Team][teamBData.Team] = result.scoreA > result.scoreB;
            headToHeadResults[teamBData.Team][teamAData.Team] = result.scoreB > result.scoreA;

            console.log(`${teamAData.Team} - ${teamBData.Team} (${result.scoreA} - ${result.scoreB})`);

        });
    }

    return teams.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.difference !== b.difference) return b.difference - a.difference;
        if (a.scored !== b.scored) return b.scored - a.scored;

        if (a.Team !== b.Team) {
            if (headToHeadResults[a.Team] && headToHeadResults[a.Team][b.Team]) {
                return -1;
            }
            if (headToHeadResults[b.Team] && headToHeadResults[b.Team][a.Team]) {
                return 1;
            }
        }
        return 0;
    });
}

function getMatchups(phase, teams) {
    const matchups = {
        1: [
            { teamA: teams[0], teamB: teams[1] },
            { teamA: teams[2], teamB: teams[3] }
        ],
        2: [
            { teamA: teams[0], teamB: teams[2] },
            { teamA: teams[1], teamB: teams[3] }
        ],
        3: [
            { teamA: teams[0], teamB: teams[3] },
            { teamA: teams[1], teamB: teams[2] }
        ]
    };

    return matchups[phase] || [];
}


function organizeHats(teams) {
    const hats = [[], [], [], []];

    teams.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.difference !== b.difference) return b.difference - a.difference;
        if (a.scored !== b.scored) return b.scored - a.scored;
        return 0;
    });

    const topEight = teams.slice(0, 8);

    topEight.forEach((team, index) => {
        const hatIndex = Math.floor(index / 2);
        hats[hatIndex].push(team);
    });
    console.log(`\nKonačan plasman: Ime   /pobede/porazi/bodovi/postignuti koševi/primljeni koševi/koš razlika:`);
    topEight.forEach((team, index) => {
        console.log(`${index + 1}. ${team.Team}   / ${team.wins} / ${team.loses} / ${team.points} / ${team.scored} / ${team.conceded} /  ${team.difference}`);
    });
    const hatNames = ['Šešir D', 'Šešir E', 'Šešir F', 'Šešir G'];
    console.log("\n\nŠeširi:");

    hatNames.forEach((hatName, index) => {
        console.log('\n', hatName);
        hats[index].forEach(team => {
            console.log(`    ${team.Team}`);
        });
    });
    console.log('\n');
    return hats;
}

function getMatchup(hat1, hat2) {
    if (!Array.isArray(hats[hat1]) || !Array.isArray(hats[hat2])) {
        console.error();
        return null;
    }

    if (hats[hat1].length === 0 || hats[hat2].length === 0) {
        console.error();
        return null;
    }

    let teamA, teamB;
    let matchupKey;

    do {
        if (hats[hat1].length === 0 || hats[hat2].length === 0) {
            console.error(`Not enough teams left in hats ${hat1} or ${hat2}`);
            return null;
        }

        const teamAi = Math.floor(Math.random() * hats[hat1].length);
        const teamBi = Math.floor(Math.random() * hats[hat2].length);

        teamA = hats[hat1][teamAi];
        teamB = hats[hat2][teamBi];

        matchupKey = `${teamA.Team}-${teamB.Team}`;

        if (headToHeadResults[teamA.Team] && headToHeadResults[teamA.Team][teamB.Team]) {
            teamA = null;
            teamB = null;
        }
    } while (!teamA || !teamB);

    hats[hat1].splice(hats[hat1].indexOf(teamA), 1);
    hats[hat2].splice(hats[hat2].indexOf(teamB), 1);

    if (!headToHeadResults[teamA.Team]) headToHeadResults[teamA.Team] = {};
    if (!headToHeadResults[teamB.Team]) headToHeadResults[teamB.Team] = {};
    headToHeadResults[teamA.Team][teamB.Team] = true;
    headToHeadResults[teamB.Team][teamA.Team] = true;

    return { teamA, teamB };
}
function getQuarterfinals(hats) {
    const matchups = [];

    const hatPairs = [
        { hat1: 0, hat2: 2 },
        { hat1: 1, hat2: 3 },
        { hat1: 0, hat2: 3 },
        { hat1: 1, hat2: 2 }
    ];

    hatPairs.forEach(({ hat1, hat2 }) => {
        const matchup = getMatchup(hat1, hat2);
        if (matchup) {
            matchups.push(matchup);
        } else {
            console.error();
        }
    });

    return matchups;
}

function printRankedTeams(groupName, rankedTeams) {
    console.log(`\nTabela grupe ${groupName} (Ime   /pobede/porazi/bodovi/postignuti koševi/primljeni koševi/koš razlika):`);
    rankedTeams.forEach((team, index) => {
        console.log(`${index + 1}. ${team.Team}   / ${team.wins} / ${team.loses} / ${team.points} / ${team.scored} / ${team.conceded} / ${team.difference}`);
    });
}
function printQuarterfinals(matchups) {
    console.log("Eliminaciona faza:");
    matchups.forEach((matchup) => {
        console.log(`${matchup.teamA.Team} - ${matchup.teamB.Team}`);
    });
}

const groupsRankings = {};
const allTeams = [];

function simulateAndPrintPhases() {
    Object.keys(groups).forEach(groupName => {
        let group = groups[groupName];
        group.forEach(team => team.Group = groupName);
        let allResults = groupPhases(group);
        printRankedTeams(groupName, allResults);
        allTeams.push(...allResults);

    });
}
function processMatchups(matchups) {
    console.log(`\n\nČetvrtfinale:`);
    let winners = [];
    matchups.forEach((matchup) => {
        const result = simulateMatch(matchup.teamA, matchup.teamB);
        console.log(`${result.teamA.Team} - ${result.teamB.Team} (${result.scoreA} - ${result.scoreB})`);
        const winner = result.winner === matchup.teamA.Team ? matchup.teamA : matchup.teamB;
        winners.push(winner);
    });
    semifinal(winners);
}
function semifinal(quarterFinalsWinners) {
    let winners = [];
    let losers = [];
    console.log(`\n\nPolufinale:`);
    const matchups = [
        { teamA: quarterFinalsWinners[0], teamB: quarterFinalsWinners[1] },
        { teamA: quarterFinalsWinners[2], teamB: quarterFinalsWinners[3] }
    ];
    matchups.forEach(({ teamA, teamB }) => {
        const result = simulateMatch(teamA, teamB);
        const winner = result.winner === teamA.Team ? teamA : teamB;
        const loser = result.winner === teamA.Team ? teamB : teamA;
        winners.push(winner);
        losers.push(loser);
        console.log(`${teamA.Team} - ${teamB.Team} (${result.scoreA} - ${result.scoreB})`);
    });
    matchForBronze(losers);
    matchForGold(winners);

}
let goldMedalist = {};
let silverMedalist = {};
let bronzeMedalist = {};

function matchForGold(finalists) {
    console.log(`\n\nFinale:`);
    const final = simulateMatch(finalists[0], finalists[1]);
    console.log(`${final.teamA.Team} - ${final.teamB.Team} (${final.scoreA} - ${final.scoreB})`);
    [goldMedalist, silverMedalist] = final.winner === finalists[0].Team
        ? [finalists[0], finalists[1]]
        : [finalists[1], finalists[0]];

    printMedalists();
}
function matchForBronze(teams) {
    console.log(`\n\nUtakmica za treće mesto:`);
    const third = simulateMatch(teams[0], teams[1]);
    console.log(`${third.teamA.Team} - ${third.teamB.Team} (${third.scoreA} - ${third.scoreB})`);
    bronzeMedalist = third.winner === teams[0].Team ? teams[0] : teams[1];
    return bronzeMedalist;
}
function printMedalists() {
    console.log(`\n\nMedalje: \n1. ${goldMedalist.Team}\n2. ${silverMedalist.Team}\n3. ${bronzeMedalist.Team}\n `);
}

simulateAndPrintPhases();

const hats = organizeHats(allTeams);
const quarterfinalMatchups = getQuarterfinals(hats);

printQuarterfinals(quarterfinalMatchups);
processMatchups(quarterfinalMatchups);