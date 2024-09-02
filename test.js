const fs = require('fs');
  
  // Učitavanje podataka iz JSON fajlova
  const groupsData = JSON.parse(fs.readFileSync('groups.json', 'utf8'));
  
  // Helper funkcija za simulaciju rezultata utakmica
  function simulateGame(team1, team2) {
      const rank1 = team1.FIBARanking;
      const rank2 = team2.FIBARanking;
      const baseProbability = 0.5;
      const difference = rank2 - rank1;
      const probability1 = baseProbability + (difference * 0.01);
  
      const team1Score = Math.floor(Math.random() * 30 + 70);
      const team2Score = Math.floor(Math.random() * 30 + 70);
  
      if (Math.random() < probability1) {
          return { winner: team1, loser: team2, score: [team1Score, team2Score] };
      } else {
          return { winner: team2, loser: team1, score: [team2Score, team1Score] };
      }
  }
  
  // Funkcija za simulaciju grupne faze
  function simulateGroupStage(groups) {
      const groupResults = {};
  
      Object.keys(groups).forEach(group => {
          const teams = groups[group];
          const matches = [];
          let standings = {};
  
          // Simuliraj sve utakmice unutar grupe
          for (let i = 0; i < teams.length; i++) {
              for (let j = i + 1; j < teams.length; j++) {
                  const match = simulateGame(teams[i], teams[j]);
                  matches.push({
                      team1: teams[i].Team,
                      team2: teams[j].Team,
                      score: `${match.score[0]}-${match.score[1]}`
                  });
  
                  // Ažuriraj bodove i statistiku
                  const winner = match.winner;
                  const loser = match.loser;
  
                  if (!standings[winner.ISOCode]) {
                      standings[winner.ISOCode] = { team: winner, points: 0, scored: 0, conceded: 0 };
                  }
                  if (!standings[loser.ISOCode]) {
                      standings[loser.ISOCode] = { team: loser, points: 0, scored: 0, conceded: 0 };
                  }
  
                  standings[winner.ISOCode].points += 2;
                  standings[winner.ISOCode].scored += match.score[0];
                  standings[winner.ISOCode].conceded += match.score[1];
  
                  standings[loser.ISOCode].scored += match.score[1];
                  standings[loser.ISOCode].conceded += match.score[0];
              }
          }
  
          // Sortiranje timova prema bodovima, koš razlici, itd.
          standings = Object.values(standings).sort((a, b) => {
              if (a.points !== b.points) return b.points - a.points;
              const diffA = a.scored - a.conceded;
              const diffB = b.scored - b.conceded;
              if (diffA !== diffB) return diffB - diffA;
              return (a.scored - b.scored);
          });
  
          groupResults[group] = {
              matches: matches,
              standings: standings
          };
      });
  
      return groupResults;
  }
  
  // Funkcija za prikaz grupne faze
  function displayGroupStage(results) {
      console.log('Grupna faza - I kolo:');
      Object.keys(results).forEach(group => {
          console.log(`Grupa ${group}:`);
          results[group].matches.forEach(match => {
              console.log(`    ${match.team1} - ${match.team2} (${match.score})`);
          });
      });
  
      console.log('\nKonačan plasman u grupama:');
      Object.keys(results).forEach(group => {
          console.log(`Grupa ${group}:`);
          results[group].standings.forEach((team, index) => {
              console.log(`    ${index + 1}. ${team.team.Team} ${team.points} bodova, ${team.scored} postignutih, ${team.conceded} primljenih, ${team.scored - team.conceded} koš razlika`);
          });
      });
  }
  
  // Funkcija za dobavljanje timova iz grupe za eliminacionu fazu
  function getTopTeams(groupResults) {
      const topTeams = [];
      Object.keys(groupResults).forEach(group => {
          const standings = groupResults[group].standings;
          topTeams.push(standings[0].team);
          topTeams.push(standings[1].team);
          topTeams.push(standings[2].team);
      });
  
      return topTeams;
  }
  
  // Pokreni simulaciju grupne faze
  const groupResults = simulateGroupStage(groupsData);
  displayGroupStage(groupResults);
  
  // Dobavi timove za eliminacionu fazu
  const topTeams = getTopTeams(groupResults);
  
  // Prikaz timova koji su prošli dalje
  console.log('\nTimovi koji su prošli dalje:');
  topTeams.forEach(team => console.log(`    ${team.Team}`));

  // Funkcija za dobavljanje timova iz grupe za eliminacionu fazu
function getTopTeams(groupResults) {
    const topTeams = [];
    Object.keys(groupResults).forEach(group => {
        const standings = groupResults[group].standings;
        topTeams.push(standings[0].team);
        topTeams.push(standings[1].team);
        topTeams.push(standings[2].team);
    });

    return topTeams;
}

// Funkcija za podelu timova u šešire
function getSeeds(topTeams) {
    const seeds = { D: [], E: [], F: [], G: [] };

    topTeams.forEach((team, index) => {
        if (index < 2) seeds.D.push(team);
        else if (index < 4) seeds.E.push(team);
        else if (index < 6) seeds.F.push(team);
        else if (index < 8)seeds.G.push(team);
    });

    return seeds;
}

// Funkcija za formiranje parova četvrtfinala
function createQuarterFinalPairs(seeds, groupResults) {
    const quarterFinals = [];
    const usedPairs = new Set();

    const getAvailableMatchups = (team1Seed, team2Seed) => {
        return team2Seed.filter(team2 => {
            return !usedPairs.has(`${team1Seed.Team}-${team2.Team}`) && !usedPairs.has(`${team2.Team}-${team1Seed.Team}`);
        });
    };

    // Poveži timove iz šešira D sa timovima iz šešira G
    seeds.D.forEach(team1 => {
        const availableTeamsG = getAvailableMatchups(team1, seeds.G);
        if (availableTeamsG.length > 0) {
            const team2 = availableTeamsG[Math.floor(Math.random() * availableTeamsG.length)];
            quarterFinals.push({ team1, team2 });
            usedPairs.add(`${team1.Team}-${team2.Team}`);
        }
    });

    // Poveži timove iz šešira E sa timovima iz šešira F
    seeds.E.forEach(team1 => {
        const availableTeamsF = getAvailableMatchups(team1, seeds.F);
        if (availableTeamsF.length > 0) {
            const team2 = availableTeamsF[Math.floor(Math.random() * availableTeamsF.length)];
            quarterFinals.push({ team1, team2 });
            usedPairs.add(`${team1.Team}-${team2.Team}`);
        }
    });

    return quarterFinals;
}

// Funkcija za prikaz šešira i četvrtfinala
function displaySeedingAndQuarterFinals(seeds, quarterFinals) {
    console.log('\nŠeširi:');
    Object.keys(seeds).forEach(seed => {
        console.log(`    Šešir ${seed}`);
        seeds[seed].forEach(team => console.log(`        ${team.Team}`));
    });

    console.log('\nEliminaciona faza:');
    quarterFinals.forEach(pair => {
        console.log(`    ${pair.team1.Team} - ${pair.team2.Team}`);
    });
}

// Pokreni simulaciju grupne faze
//const groupResults = simulateGroupStage(groupsData);
displayGroupStage(groupResults);

// Dobavi timove za eliminacionu fazu
//const topTeams = getTopTeams(groupResults);

// Podeli timove u šešire
const seeds = getSeeds(topTeams);

// Kreiraj parove četvrtfinala
const quarterFinals = createQuarterFinalPairs(seeds, groupResults);

// Prikaz šešira i četvrtfinala
displaySeedingAndQuarterFinals(seeds, quarterFinals);

// Funkcija za simulaciju utakmica eliminacione faze
function simulateEliminationGame(team1, team2) {
    if (!team1 || !team2 || team1.FIBARanking === undefined || team2.FIBARanking === undefined) {
        console.error('Timovi moraju imati FIBARanking. Tim1:', team1, 'Tim2:', team2);
        return { winner: null, loser: null, score: [0, 0] };
    }

    const rank1 = team1.FIBARanking;
    const rank2 = team2.FIBARanking;
    const baseProbability = 0.5;
    const difference = rank2 - rank1;
    const probability1 = baseProbability + (difference * 0.01);

    const team1Score = Math.floor(Math.random() * 30 + 70);
    const team2Score = Math.floor(Math.random() * 30 + 70);

    if (Math.random() < probability1) {
        return { winner: team1, loser: team2, score: [team1Score, team2Score] };
    } else {
        return { winner: team2, loser: team1, score: [team2Score, team1Score] };
    }
}

// Funkcija za simulaciju eliminacione faze
function simulateEliminationStage(quarterFinals) {
    const semiFinals = [];
    const thirdPlaceGame = {};
    const final = {};

    // Simulacija četvrtfinala
    console.log('\nČetvrtfinale:');
    quarterFinals.forEach((pair, index) => {
        const match = simulateEliminationGame(pair.team1, pair.team2);
        if (match.winner) {
            console.log(`    ${pair.team1.Team} - ${pair.team2.Team} (${match.score[0]}-${match.score[1]})`);
            if (index % 2 === 0) {
                semiFinals.push({ team1: match.winner, team2: null });
                semiFinals.push({ team1: null, team2: match.loser });
            } else {
                semiFinals[semiFinals.length - 1].team2 = match.winner;
                semiFinals[semiFinals.length - 2].team2 = match.loser;
            }
        } else {
            console.error('Ne može simulirati utakmicu. Pojavio se problem sa timovima.');
        }
    });

    // Simulacija polufinala
    console.log('\nPolufinale:');
    const winners = [];
    const losers = [];
    semiFinals.forEach((pair, index) => {
        if (pair.team1 && pair.team2) {
            const match = simulateEliminationGame(pair.team1, pair.team2);
            if (match.winner) {
                console.log(`    ${pair.team1.Team} - ${pair.team2.Team} (${match.score[0]}-${match.score[1]})`);
                if (index % 2 === 0) {
                    winners.push(match.winner);
                    losers.push(match.loser);
                } else {
                    winners.push(match.winner);
                    losers.push(match.loser);
                }
            } else {
                console.error('Ne može simulirati utakmicu. Pojavio se problem sa timovima.');
            }
        }
    });

    // Simulacija utakmice za treće mesto
    console.log('\nUtakmica za treće mesto:');
    if (losers.length === 2) {
        const thirdPlaceMatch = simulateEliminationGame(losers[0], losers[1]);
        if (thirdPlaceMatch.winner) {
            console.log(`    ${losers[0].Team} - ${losers[1].Team} (${thirdPlaceMatch.score[0]}-${thirdPlaceMatch.score[1]})`);
            thirdPlaceGame.winner = thirdPlaceMatch.winner;
            thirdPlaceGame.loser = thirdPlaceMatch.loser;
        } else {
            console.error('Ne može simulirati utakmicu za treće mesto.');
        }
    }

    // Simulacija finala
    console.log('\nFinale:');
    if (winners.length === 2) {
        const finalMatch = simulateEliminationGame(winners[0], winners[1]);
        if (finalMatch.winner) {
            console.log(`    ${winners[0].Team} - ${winners[1].Team} (${finalMatch.score[0]}-${finalMatch.score[1]})`);
            final.winner = finalMatch.winner;
            final.loser = finalMatch.loser;
        } else {
            console.error('Ne može simulirati finale.');
        }
    }

    return {
        semiFinals,
        thirdPlaceGame,
        final
    };
}

// Funkcija za prikaz medalja
function displayMedals(finalResults) {
    console.log('\nMedalje:');
    console.log(`    1. ${finalResults.final.winner.Team}`);
    console.log(`    2. ${finalResults.final.loser.Team}`);
    console.log(`    3. ${finalResults.thirdPlaceGame.winner.Team}`);
}

// Funkcija za prikaz eliminacione faze
function displayEliminationStage() {
    const groupResults = simulateGroupStage(groupsData);
    const topTeams = getTopTeams(groupResults);
    const seeds = getSeeds(topTeams);
    const quarterFinals = createQuarterFinalPairs(seeds, groupResults);

    displaySeedingAndQuarterFinals(seeds, quarterFinals);

    const eliminationResults = simulateEliminationStage(quarterFinals);
    displayMedals(eliminationResults);
}

// Pokreni simulaciju eliminacione faze
displayEliminationStage();
