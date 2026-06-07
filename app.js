const SUPABASE_REST_URL = "https://dwohuxnsbaupysxtupxs.supabase.co/rest/v1";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5HdyIHS4QW98ZMEGk7NDvw_JEROoM2z";

let tours = [
  {
    id: "portugal-2025",
    title: "Portugal 2025 🇵🇹",
    shortTitle: "Portugal 2025",
    status: "Upcoming",
    dates: "May 15 - May 19, 2025",
    location: "Vilamoura, Portugal",
    image: "assets/images/tours/2019-vilamoura.jpg",
  },
  {
    id: "scotland-2024",
    title: "Scotland 2024 🇬🇧",
    shortTitle: "Scotland 2024",
    status: "Completed",
    dates: "May 9 - May 13, 2024",
    location: "Fife, Scotland",
    image: "assets/images/tours/2022-carnoustie.jpg",
  },
  {
    id: "mallorca-2023",
    title: "Mallorca 2023 🇪🇸",
    shortTitle: "Mallorca 2023",
    status: "Completed",
    dates: "May 4 - May 8, 2023",
    location: "Capdepera, Mallorca",
    image: "assets/images/tours/2023-woodhall-spa.jpg",
  },
  {
    id: "ireland-2022",
    title: "Ireland 2022 🇮🇪",
    shortTitle: "Ireland 2022",
    status: "Completed",
    dates: "May 12 - May 16, 2022",
    location: "Doonbeg, Ireland",
    image: "assets/images/tours/2021-st-mellion-burnham-berrow.webp",
  },
];

let nextTourStart = new Date("2026-08-06T00:00:00");
let countdownTimer = null;
let currentTourCourses = [];
let allCourses = [];
let isSupabaseConnected = false;
let hasLoadedSupabase = false;
let allPlayers = [];
const preloadedImages = new Set();

let players = [
  {
    name: "Gaz Elcock",
    nick: "The Missile",
    handicap: "12.4",
    role: "Vice Captain",
    avatar: "GE",
    tours: 14,
    wins: 2,
    top5: 5,
    spoons: 3,
    about: "Long hitter. Short temper. Terrible with directions. Loves a lost ball as much as a birdie.",
    strengths: ["Driver", "Banter"],
    weaknesses: ["Short Game", "Course Management"],
  },
  {
    name: "Tom Davies",
    nick: "The Velvet Hammer",
    handicap: "8.8",
    role: "Champion",
    avatar: "TD",
    tours: 16,
    wins: 4,
    top5: 11,
    spoons: 0,
    about: "Looks calm, swings smooth, then quietly removes everyone's lunch money on the back nine.",
    strengths: ["Putting", "Match Play"],
    weaknesses: ["Buying Rounds", "Modesty"],
  },
];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function slugifyName(name = "") {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function headshotForPlayer(player) {
  if (!player?.player_name) return "";
  const headshots = {
    "bander-pyke": "assets/images/headshots/bander-pyke.png",
    "brian-crotty": "assets/images/headshots/brian-crotty.png",
    "eamonn-sheehy": "assets/images/headshots/eamonn-sheehy.png",
    "edmund-northcott": "assets/images/headshots/edmund-northcott.png",
    "george-holman": "assets/images/headshots/george-holman.png",
    "greg-smith": "assets/images/headshots/greg-smith.png",
    "harry-rowlinson": "assets/images/headshots/harry-rowlinson.png",
    "henry-rudkin": "assets/images/headshots/henry-rudkin.png",
    "james-barrie": "assets/images/headshots/james-barrie.png",
    "james-rowlinson": "assets/images/headshots/james-rowlinson.png",
    "joe-barnett": "assets/images/headshots/joe-barnett.png",
    "johnny-griffiths": "assets/images/headshots/johnny-griffiths.png",
    "justin-colver": "assets/images/headshots/justin-colver.png",
    "luka-syplywczak": "assets/images/headshots/luka-syplywczak.png",
    "matt-neely": "assets/images/headshots/matt-neely.png",
    "nick-gubbins": "assets/images/headshots/nick-gubbins.png",
    "patch-foster": "assets/images/headshots/patch-foster.png",
    "peter-crocombe": "assets/images/headshots/peter-crocombe.png",
    "rob-moore": "assets/images/headshots/rob-moore.png",
    "sam-foster": "assets/images/headshots/sam-foster.png",
    "simon-collings": "assets/images/headshots/simon-collings.png",
    "simon-hicks": "assets/images/headshots/simon-hicks.png",
    "tom-smith": "assets/images/headshots/tom-smith.png",
    "tom-tynan": "assets/images/headshots/tom-tynan.png",
    "tom-wigglesworth": "assets/images/headshots/tom-wigglesworth.png",
    "will-gubbins": "assets/images/headshots/will-gubbins.png",
    "will-macpherson": "assets/images/headshots/will-macpherson.png",
  };
  return headshots[slugifyName(player.player_name)] || "";
}

function Avatar(player, className = "") {
  const headshot = headshotForPlayer(player);
  const initials = getInitials(player?.player_name || className || "N");
  return `
    <div class="avatar ${className}">
      ${headshot ? `<img src="${headshot}" alt="${escapeHtml(player.player_name)}" />` : initials}
    </div>
  `;
}

function flagForDestination(destination = "") {
  const place = destination.toLowerCase();
  if (place.includes("wales")) return "🏴";
  if (place.includes("bruges") || place.includes("belgium")) return "🇧🇪";
  if (place.includes("france") || place.includes("hardelot") || place.includes("touquet")) return "🇫🇷";
  if (place.includes("scotland") || place.includes("carnoustie")) return "🏴";
  if (place.includes("portugal") || place.includes("vilamoura") || place.includes("quinta")) return "🇵🇹";
  if (place.includes("morocco")) return "🇲🇦";
  if (place.includes("ireland")) return "🇮🇪";
  if (place.includes("spain") || place.includes("mallorca")) return "🇪🇸";
  return "⛳";
}

function formatDateRange(startDate, endDate, year) {
  if (!startDate) return String(year);

  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : start;
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(start);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const endMonth = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(end);

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${month} ${startDay} - ${endDay}, ${start.getFullYear()}`;
  }

  return `${month} ${startDay} - ${endMonth} ${endDay}, ${end.getFullYear()}`;
}

function getTourStatus(row) {
  const now = new Date();
  if (row.end_date) {
    return new Date(`${row.end_date}T23:59:59`) >= now ? "Upcoming" : "Completed";
  }
  if (row.start_date) {
    return new Date(`${row.start_date}T00:00:00`) >= now ? "Upcoming" : "Completed";
  }
  return Number(row.year) >= now.getFullYear() ? "Upcoming" : "Completed";
}

function imageForTour(row, index) {
  const imagesByYear = {
    2016: "assets/images/tours/2016-morocco.jpg",
    2017: "assets/images/tours/2017-monte-rei.jpg",
    2018: "assets/images/tours/2018-laranjal.webp",
    2019: "assets/images/tours/2019-vilamoura.jpg",
    2021: "assets/images/tours/2021-st-mellion-burnham-berrow.webp",
    2022: "assets/images/tours/2022-carnoustie.jpg",
    2023: "assets/images/tours/2023-woodhall-spa.jpg",
    2024: "assets/images/tours/2024-hardelot-le-touquet.jpg",
    2025: "assets/images/tours/2025-bruges-damme.jpg",
    2026: "assets/images/tours/2026-aberdovey.webp",
  };
  const fallbackImages = [
    "assets/images/tours/2026-aberdovey.webp",
    "assets/images/tours/2025-bruges-damme.jpg",
    "assets/images/tours/2024-hardelot-le-touquet.jpg",
    "assets/images/tours/2023-woodhall-spa.jpg",
  ];
  return imagesByYear[row.year] || fallbackImages[index % fallbackImages.length];
}

function preloadImages(urls = []) {
  urls
    .filter(Boolean)
    .filter((url) => !preloadedImages.has(url))
    .forEach((url) => {
      preloadedImages.add(url);

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = url;
      document.head.appendChild(link);

      const image = new Image();
      image.src = url;
    });
}

function mapSupabaseTour(row, index) {
  const name = row.tour_name || row.destination || `Tour ${row.year}`;
  const flag = flagForDestination(`${row.destination} ${name}`);
  return {
    id: `tour-${row.id}`,
    supabaseId: row.id,
    year: row.year,
    title: `${name} ${row.year} ${flag}`,
    shortTitle: `${name} ${row.year}`,
    status: getTourStatus(row),
    dates: formatDateRange(row.start_date, row.end_date, row.year),
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.destination || name,
    image: imageForTour(row, index),
  };
}

async function supabaseFetch(path) {
  const response = await fetch(`${SUPABASE_REST_URL}/${path}`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.json();
}

function getPlayerById(id) {
  return allPlayers.find((player) => Number(player.id) === Number(id));
}

function chooseDefaultHeadToHeadPlayers(playerRows) {
  const johnny = playerRows.find((player) => player.player_name === "Johnny Griffiths");
  const simon = playerRows.find((player) => player.player_name === "Simon Hicks");
  const first = johnny || playerRows[0];
  const second = simon || playerRows.find((player) => player.id !== first?.id);

  if (!state.selectedPlayerAId && first) state.selectedPlayerAId = first.id;
  if (!state.selectedPlayerBId && second) state.selectedPlayerBId = second.id;
  if (!state.selectedIndividualPlayerId && first) state.selectedIndividualPlayerId = first.id;
}

function getPlayerPoints(match, playerId) {
  if (Number(match.player_1_id) === Number(playerId)) return Number(match.player_1_points);
  if (Number(match.player_2_id) === Number(playerId)) return Number(match.player_2_points);
  return 0;
}

function getPlayerTeam(match, playerId) {
  if (Number(match.player_1_id) === Number(playerId)) return match.player_1_team;
  if (Number(match.player_2_id) === Number(playerId)) return match.player_2_team;
  return "";
}

function playerNameById(playerId) {
  return getPlayerById(playerId)?.player_name || `Player ${playerId}`;
}

function teamLineForMatch(match, playerA, playerB) {
  const participants = state.headToHeadParticipants[match.result_id] || [];
  const crocs = participants
    .filter((row) => row.team_name === "Crocs")
    .sort((a, b) => Number(a.player_slot) - Number(b.player_slot))
    .map((row) => playerNameById(row.player_id));
  const foz = participants
    .filter((row) => row.team_name === "Foz")
    .sort((a, b) => Number(a.player_slot) - Number(b.player_slot))
    .map((row) => playerNameById(row.player_id));

  if (match.format === "Fourball" && crocs.length && foz.length) {
    return `${crocs.join(" & ")} (Crocs) vs ${foz.join(" & ")} (Foz)`;
  }

  return `${playerA?.player_name || "Player A"} (${getPlayerTeam(match, playerA?.id)}) vs ${playerB?.player_name || "Player B"} (${getPlayerTeam(match, playerB?.id)})`;
}

function parseScoreMargin(score = "") {
  const normalized = String(score).trim().toUpperCase();
  if (!normalized || normalized === "A/S") return null;

  const upMatch = normalized.match(/^(\d+)\s*UP$/);
  if (upMatch) return Number(upMatch[1]);

  const matchPlayScore = normalized.match(/^(\d+)\s*&\s*\d+$/);
  if (matchPlayScore) return Number(matchPlayScore[1]);

  return null;
}

function summariseHeadToHead(matches, playerAId, playerBId) {
  let playerAWins = 0;
  let playerBWins = 0;
  let halves = 0;
  let largest = null;

  matches.forEach((match) => {
    const playerAPoints = getPlayerPoints(match, playerAId);
    if (playerAPoints === 1) playerAWins += 1;
    if (playerAPoints === 0.5) halves += 1;
    if (playerAPoints === 0) playerBWins += 1;

    const margin = parseScoreMargin(match.score);
    if (margin !== null && (!largest || margin > largest.margin)) {
      largest = { margin, score: match.score, winnerName: match.winner_name };
    }
  });

  return {
    playerAWins,
    playerBWins,
    halves,
    matchesPlayed: matches.length,
    lastMeeting: matches[0],
    mostRecentWinner: matches[0]?.winner_name || "N/A",
    largest,
  };
}

async function loadHeadToHeadMatches() {
  const playerAId = state.selectedPlayerAId;
  const playerBId = state.selectedPlayerBId;

  if (!playerAId || !playerBId || Number(playerAId) === Number(playerBId)) {
    state.headToHeadMatches = [];
    state.headToHeadParticipants = {};
    state.headToHeadError = "";
    render();
    return;
  }

  state.headToHeadLoading = true;
  state.headToHeadError = "";
  render();

  try {
    const query = [
      "head_to_head_matches?select=*",
      `or=(and(player_1_id.eq.${playerAId},player_2_id.eq.${playerBId}),and(player_1_id.eq.${playerBId},player_2_id.eq.${playerAId}))`,
      "order=year.desc",
      "order=day.desc",
      "order=match_number.desc",
    ].join("&");

    const matches = await supabaseFetch(query);
    state.headToHeadMatches = matches;
    state.headToHeadParticipants = await loadHeadToHeadParticipants(matches);
  } catch (error) {
    console.warn(error);
    state.headToHeadMatches = [];
    state.headToHeadParticipants = {};
    state.headToHeadError = "Could not load head-to-head matches.";
  } finally {
    state.headToHeadLoading = false;
    render();
  }
}

async function loadHeadToHeadParticipants(matches) {
  const resultIds = [...new Set(matches.map((match) => match.result_id).filter(Boolean))];
  if (!resultIds.length) return {};

  const rows = await supabaseFetch(
    `result_players?select=*&result_id=in.(${resultIds.join(",")})&order=result_id.desc&order=team_name.asc&order=player_slot.asc`
  );

  return rows.reduce((grouped, row) => {
    const resultId = row.result_id;
    if (!grouped[resultId]) grouped[resultId] = [];
    grouped[resultId].push(row);
    grouped[resultId].sort((a, b) => {
      if (a.team_name !== b.team_name) return a.team_name.localeCompare(b.team_name);
      return Number(a.player_slot) - Number(b.player_slot);
    });
    return grouped;
  }, {});
}

async function loadTourResults(year) {
  if (!year || state.tourResultsByYear[year] || state.tourResultsLoadingYear === year) return;

  state.tourResultsLoadingYear = year;
  state.tourResultsError = "";
  render();

  try {
    state.tourResultsByYear[year] = await supabaseFetch(
      `results_with_players?select=*&year=eq.${year}&order=day.asc&order=match_number.asc`
    );
  } catch (error) {
    console.warn(error);
    state.tourResultsError = "Could not load tour results.";
  } finally {
    state.tourResultsLoadingYear = null;
    render();
  }
}

async function loadTourProfiles(tourId) {
  if (!tourId || state.tourProfilesByTourId[tourId] || state.tourProfilesLoadingTourId === tourId) return;

  state.tourProfilesLoadingTourId = tourId;
  state.tourProfilesError = "";
  render();

  try {
    state.tourProfilesByTourId[tourId] = await supabaseFetch(
      `player_tour_profiles?select=*&tour_id=eq.${tourId}&order=player_id.asc`
    );
  } catch (error) {
    console.warn(error);
    state.tourProfilesError = "Could not load tour profiles.";
  } finally {
    state.tourProfilesLoadingTourId = null;
    render();
  }
}

async function loadIndividualMatches() {
  const playerId = state.selectedIndividualPlayerId;
  if (!playerId) return;
  if (state.individualMatchesByPlayerId[playerId] || state.individualLoadingPlayerId === playerId) return;

  state.individualLoadingPlayerId = playerId;
  state.individualError = "";
  render();

  try {
    const playerName = playerNameById(playerId);
    const playerPattern = encodeURIComponent(`*${playerName}*`);
    const resultRows = await supabaseFetch(
      [
        "results_with_players?select=*",
        `or=(crocs_team.ilike.${playerPattern},foz_team.ilike.${playerPattern})`,
        "order=year.desc",
        "order=day.asc",
        "order=match_number.asc",
      ].join("&")
    );

    state.individualMatchesByPlayerId[playerId] = resultRows.map((result) => ({
      ...result,
      selectedTeam: String(result.crocs_team || "").includes(playerName) ? "Crocs" : "Foz",
      participants: [],
    }));
  } catch (error) {
    console.warn(error);
    state.individualMatchesByPlayerId[playerId] = [];
    state.individualError = "Could not load individual matches.";
  } finally {
    state.individualLoadingPlayerId = null;
    render();
  }
}

async function loadStatsOverview() {
  if (state.statsOverviewRows || state.statsOverviewLoading) return;

  state.statsOverviewLoading = true;
  state.statsOverviewError = "";
  render();

  try {
    state.statsOverviewRows = await supabaseFetch(
      "results_with_players?select=*&order=year.desc&order=day.asc&order=match_number.asc"
    );
  } catch (error) {
    console.warn(error);
    state.statsOverviewRows = [];
    state.statsOverviewError = "Could not load overview stats.";
  } finally {
    state.statsOverviewLoading = false;
    render();
  }
}

async function loadDefendingChampions() {
  const latestCompleted = tours.find((tour) => tour.status === "Completed");
  if (!latestCompleted || state.defendingChampions || state.defendingChampionsLoading) return;

  state.defendingChampionsLoading = true;
  render();

  try {
    const rows = await supabaseFetch(
      `results_with_players?select=*&year=eq.${latestCompleted.year}&order=day.asc&order=match_number.asc`
    );
    const totals = teamPointsForRows(rows);
    const winner = totals.crocs >= totals.foz ? "Crocombe" : "Foster";
    state.defendingChampions = {
      team: `Team ${winner}`,
      side: winner === "Crocombe" ? "crocombe" : "foster",
      tour: latestCompleted.shortTitle,
      score: `${formatTeamPoints(totals.crocs)} - ${formatTeamPoints(totals.foz)}`,
    };
  } catch (error) {
    console.warn(error);
    state.defendingChampions = {
      team: "Team TBC",
      side: "neutral",
      tour: "Latest tour",
      score: "",
    };
  } finally {
    state.defendingChampionsLoading = false;
    render();
  }
}

async function loadTeamTourWins() {
  const completedTours = tours.filter((tour) => tour.status === "Completed" && tour.year);
  if (!completedTours.length || state.teamTourWins || state.teamTourWinsLoading) return;

  state.teamTourWinsLoading = true;
  render();

  try {
    const years = completedTours.map((tour) => tour.year).join(",");
    const rows = await supabaseFetch(`results_with_players?select=year,result&year=in.(${years})`);
    const rowsByYear = rows.reduce((grouped, row) => {
      if (!grouped[row.year]) grouped[row.year] = [];
      grouped[row.year].push(row);
      return grouped;
    }, {});

    state.teamTourWins = completedTours.reduce(
      (wins, tour) => {
        const totals = teamPointsForRows(rowsByYear[tour.year] || []);
        if (totals.crocs > totals.foz) wins.crocombe += 1;
        if (totals.foz > totals.crocs) wins.foster += 1;
        if (totals.crocs === totals.foz && (totals.crocs || totals.foz)) {
          wins.crocombe += 0.5;
          wins.foster += 0.5;
        }
        return wins;
      },
      { crocombe: 0, foster: 0 }
    );
  } catch (error) {
    console.warn(error);
    state.teamTourWins = { crocombe: 0, foster: 0 };
  } finally {
    state.teamTourWinsLoading = false;
    render();
  }
}

async function loadTouristData() {
  if (state.touristDataLoaded || state.touristDataLoading) return;

  state.touristDataLoading = true;
  state.touristDataError = "";
  render();

  try {
    const [profileRows, handicapRows, resultRows] = await Promise.all([
      supabaseFetch("player_tour_profiles?select=*&order=tour_id.desc&order=player_id.asc"),
      supabaseFetch("player_handicaps?select=*&order=tour_id.desc&order=player_id.asc"),
      supabaseFetch("results_with_players?select=*&order=year.desc&order=day.asc&order=match_number.asc"),
    ]);

    state.touristProfileRows = Array.isArray(profileRows) ? profileRows : [];
    state.touristHandicapRows = Array.isArray(handicapRows) ? handicapRows : [];
    state.touristResultsRows = Array.isArray(resultRows) ? resultRows : [];
    state.touristDataLoaded = true;
  } catch (error) {
    console.warn(error);
    state.touristProfileRows = [];
    state.touristHandicapRows = [];
    state.touristResultsRows = [];
    state.touristDataError = "Could not load tourist profiles.";
  } finally {
    state.touristDataLoading = false;
    render();
  }
}

async function loadSupabaseData() {
  try {
    const [tourRows, playerRows, courseRows] = await Promise.all([
      supabaseFetch("golf_tours?select=*&order=year.desc"),
      supabaseFetch("players?select=*&order=player_name.asc"),
      supabaseFetch("courses?select=*&order=year.desc,day.asc"),
    ]);

    if (Array.isArray(tourRows) && tourRows.length) {
      const mappedTours = tourRows.map(mapSupabaseTour);
      preloadImages(mappedTours.map((tour) => tour.image));
      const upcoming = mappedTours
        .filter((tour) => tour.startDate && new Date(`${tour.startDate}T00:00:00`) >= new Date())
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const completed = mappedTours
        .filter((tour) => !upcoming.includes(tour))
        .sort((a, b) => Number(b.year) - Number(a.year));

      tours = [...upcoming, ...completed];
      if (upcoming[0]?.startDate) {
        nextTourStart = new Date(`${upcoming[0].startDate}T00:00:00`);
      }

      const currentYear = upcoming[0]?.year || tours[0]?.year;
      currentTourCourses = Array.isArray(courseRows)
        ? courseRows.filter((course) => Number(course.year) === Number(currentYear))
        : [];
      allCourses = Array.isArray(courseRows) ? courseRows : [];
    }

    if (Array.isArray(playerRows) && playerRows.length) {
      allPlayers = playerRows;
      chooseDefaultHeadToHeadPlayers(playerRows);
      players = playerRows.slice(0, 10).map((player, index) => {
        return {
          id: player.id,
          name: player.player_name,
          nick: index % 2 ? "Short Game Scholar" : "The Quiet Assassin",
          handicap: "TBC",
          role: index === 0 ? "Captain's Pick" : "Nudger",
          avatar: getInitials(player.player_name),
          tours: 0,
          wins: 0,
          top5: 0,
          spoons: 0,
          about: "Profile data is now coming from Supabase. Nicknames, handicaps, and tour lore can be added next.",
          strengths: ["Availability", "Optimism"],
          weaknesses: ["Pending Data", "First Tee Nerves"],
        };
      });
    }

    isSupabaseConnected = true;
    hasLoadedSupabase = true;
    render();
    loadDefendingChampions();
    loadTeamTourWins();
    loadTouristData();
    if (state.statSubTab === "Overview") loadStatsOverview();
    if (state.statSubTab === "Head-to-Head") loadHeadToHeadMatches();
    if (state.statSubTab === "Individual") loadIndividualMatches();
    if (state.detailTour && state.detailSubTab === "Results") {
      const tour = tours.find((item) => item.id === state.detailTour);
      loadTourResults(tour?.year);
    }
    if (state.detailTour && ["Teams", "Profiles", "Roles"].includes(state.detailSubTab)) {
      const tour = tours.find((item) => item.id === state.detailTour);
      loadTourProfiles(tour?.supabaseId);
    }
    if (state.tab === "this-tour" && state.detailSubTab === "Results") {
      loadTourResults(tours[0]?.year);
    }
    if (state.tab === "this-tour" && ["Teams", "Profiles", "Roles"].includes(state.detailSubTab)) {
      loadTourProfiles(tours[0]?.supabaseId);
    }
  } catch (error) {
    console.warn(error);
    hasLoadedSupabase = true;
    render();
  }
}

const navItems = [
  ["home", "Home", "home"],
  ["tours", "Tours", "badge"],
  ["this-tour", "This Tour", "calendar"],
  ["stats", "Stats", "chart"],
  ["more", "More", "more"],
];

let state = {
  tab: "home",
  detailTour: null,
  detailSubTab: "Overview",
  statSubTab: "Head-to-Head",
  playerIndex: 0,
  selectedPlayerAId: null,
  selectedPlayerBId: null,
  headToHeadMatches: [],
  headToHeadParticipants: {},
  headToHeadLoading: false,
  headToHeadError: "",
  openHeadToHeadPicker: null,
  selectedIndividualPlayerId: null,
  individualMatchesByPlayerId: {},
  individualLoadingPlayerId: null,
  individualError: "",
  openIndividualPicker: false,
  statsOverviewRows: null,
  statsOverviewLoading: false,
  statsOverviewError: "",
  statsActiveOnly: true,
  defendingChampions: null,
  defendingChampionsLoading: false,
  teamTourWins: null,
  teamTourWinsLoading: false,
  touristProfileRows: [],
  touristHandicapRows: [],
  touristResultsRows: [],
  touristDataLoaded: false,
  touristDataLoading: false,
  touristDataError: "",
  touristProfileOpen: false,
  tourResultsByYear: {},
  tourResultsLoadingYear: null,
  tourResultsError: "",
  tourProfilesByTourId: {},
  tourProfilesLoadingTourId: null,
  tourProfilesError: "",
  expandedTourProfiles: {},
  moreMenuOpen: false,
  restoredScrollTop: 0,
};

const app = document.querySelector("#app");

function icon(name) {
  const icons = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    badge: '<rect x="5" y="4" width="14" height="16" rx="3"/><path d="M9 9h6M9 13l2 2 4-5"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    chart: '<path d="M5 19V9M12 19V5M19 19v-8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 14.5-4 16 0"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    share: '<path d="M16 6h3v14H5V6h3"/><path d="M12 3v11M8 7l4-4 4 4"/>',
    more: '<circle cx="12" cy="12" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    trophy: '<path d="M8 5h8v4a4 4 0 0 1-8 0V5Z"/><path d="M8 7H5a3 3 0 0 0 3 4M16 7h3a3 3 0 0 1-3 4M12 13v5M9 21h6"/>',
    ball: '<circle cx="12" cy="12" r="8"/><path d="M9 9h.01M13 8h.01M15 12h.01M10 14h.01"/>',
    flag: '<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>',
    plane: '<path d="m3 11 18-7-7 18-3-8-8-3Z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    suitcase: '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/><rect x="5" y="6" width="14" height="15" rx="2"/><path d="M9 6v15M15 6v15"/>',
    swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.home}</svg>`;
}

function Logo() {
  return `
    <div class="logo-mark" aria-label="The Cultured Nudgers">
      <div class="logo-ring">THE CULTURED<br><span>NUDGERS</span></div>
      <div class="logo-players">♟</div>
      <small>EST. 2014</small>
    </div>
  `;
}

function Header(title = "", detail = false) {
  if (!title && !detail) {
    return `<header class="app-header app-header-blank" aria-hidden="true"></header>`;
  }

  const leftControl =
    detail === "locked"
      ? `<span class="icon-spacer" aria-hidden="true"></span>`
      : detail
        ? `<button class="icon-btn" data-action="back" aria-label="Back">${icon("back")}</button>`
        : `<span class="icon-spacer" aria-hidden="true"></span>`;
  const rightControl = detail ? `<button class="icon-btn" aria-label="Share">${icon("share")}</button>` : `<span class="icon-spacer" aria-hidden="true"></span>`;

  return `
    <header class="app-header">
      ${leftControl}
      <h1>${title}</h1>
      ${rightControl}
    </header>
  `;
}

function Card(content, className = "") {
  return `<section class="card ${className}">${content}</section>`;
}

function HeroCard(tour, extra = "") {
  return `
    <section class="hero-card" style="background-image: linear-gradient(180deg, rgba(2,12,8,.1), rgba(2,12,8,.82)), url('${tour.image}')">
      <div class="hero-content">
        ${extra}
        <h2>${tour.title}</h2>
        <p>${tour.dates}</p>
      </div>
    </section>
  `;
}

function TourCard(tour) {
  return `
    <button class="tour-card" data-action="tour-detail" data-tour="${tour.id}" style="background-image: linear-gradient(90deg, rgba(2,14,9,.68), rgba(2,14,9,.1)), url('${tour.image}')">
      <span class="tour-card-title">${tour.title}</span>
      <span class="tour-card-dates">${tour.dates.replaceAll(" - ", " - ")}</span>
      <span class="status-pill">${tour.status}</span>
    </button>
  `;
}

function StatCard(label, value, detail, image) {
  return Card(`
    <div>
      <span class="eyebrow">${label}</span>
      <strong>${value}</strong>
      <small>${detail}</small>
    </div>
    ${image ? `<div class="stat-avatar">${image}</div>` : ""}
  `, "mini-stat");
}

function ActionTile(label, iconName) {
  return `<button class="action-tile">${icon(iconName)}<span>${label}</span></button>`;
}

function PlayerCard(player) {
  return `
    <article class="player-card card">
      <div class="player-top">
        <div class="player-photo-wrap ${player.isActive === false ? "inactive" : ""}">
          ${Avatar({ player_name: player.name }, "large")}
          ${player.isActive === false ? `<em>Inactive</em>` : ""}
        </div>
        <div>
          <h2>${player.name}</h2>
          <p>${player.nick === "[PLACEHOLDER]" ? player.nick : `"${player.nick}"`}</p>
          <span class="role-pill">${player.role}</span>
        </div>
        <div class="handicap"><span>Handicap</span>${player.handicap}</div>
      </div>
      <div class="player-stats">
        <span><b>${player.tours}</b>${Number(player.tours) === 1 ? "Tour" : "Tours"}</span>
        <span><b>${player.tourWins}</b>Tour Wins</span>
        <span><b>${player.individualWins}</b>Individual Wins</span>
      </div>
      <div class="profile-section">
        <h3>About ${player.name.split(" ")[0]}</h3>
        ${formatProfileBody(player.about)}
      </div>
      <div class="two-col">
        <div><h3>Strengths</h3>${player.strengths.map((x) => `<p>${escapeHtml(x)}</p>`).join("")}</div>
        <div><h3>Weaknesses</h3>${player.weaknesses.map((x) => `<p>${escapeHtml(x)}</p>`).join("")}</div>
      </div>
    </article>
  `;
}

function Home() {
  if (!hasLoadedSupabase) {
    return `
      ${Header()}
      <section class="home-logo">${Logo()}<p>Welcome back, Nudger 👋</p></section>
      ${Card(`
        <span class="eyebrow">Next Tour</span>
        <div class="loading-card">
          <strong>Loading tour room...</strong>
          <p>Fetching the latest Nudgers intel.</p>
        </div>
      `, "home-loading")}
    `;
  }

  const next = tours[0];
  return `
    ${Header()}
    <section class="home-logo">${Logo()}<p>Welcome back, Nudger 👋</p></section>
    <section class="next-tour" style="background-image: linear-gradient(180deg, rgba(255,255,255,.05), rgba(3,19,13,.54)), url('${next.image}')">
      <span>Next Tour</span>
      <h2>${next.title}</h2>
      <div class="countdown" data-countdown>
        <b data-countdown-days>--</b><i>:</i><b data-countdown-hours>--</b><i>:</i><b data-countdown-minutes>--</b><i>:</i><b data-countdown-seconds>--</b>
      </div>
      <div class="count-labels"><span>Days</span><span>Hrs</span><span>Mins</span><span>Secs</span></div>
      <p>⌖ ${next.location}<br>${next.startDate ? `Starts ${new Date(`${next.startDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : next.dates}</p>
    </section>
    <section class="defending-card ${state.defendingChampions?.side || "neutral"}">
      <span>Defending Champions</span>
      <strong>${escapeHtml(state.defendingChampions?.team || "Loading...")}</strong>
      <small>${escapeHtml(state.defendingChampions?.tour || "")}${state.defendingChampions?.score ? ` · ${escapeHtml(state.defendingChampions.score)}` : ""}</small>
    </section>
    <section class="tour-wins-card">
      <span>All-Time Tour Score</span>
      <div class="tour-wins-score">
        <strong>Team<br>Crocombe</strong>
        <b>${formatTeamPoints(state.teamTourWins?.crocombe || 0)}</b>
        <i></i>
        <b>${formatTeamPoints(state.teamTourWins?.foster || 0)}</b>
        <strong>Team<br>Foster</strong>
      </div>
    </section>
  `;
}

function updateCountdown() {
  const countdown = document.querySelector("[data-countdown]");
  if (!countdown) return;

  const remaining = Math.max(0, nextTourStart.getTime() - Date.now());
  const seconds = Math.floor(remaining / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const values = {
    days: String(days),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(secs).padStart(2, "0"),
  };

  Object.entries(values).forEach(([key, value]) => {
    const node = document.querySelector(`[data-countdown-${key}]`);
    if (node) node.textContent = value;
  });
}

function Tours() {
  return `${Header("Tours")}<div class="tour-list">${tours.map(TourCard).join("")}</div>`;
}

function TourOverview() {
  return `
    ${Card(`
      <div class="write-up">
        <div class="avatar captain">TD</div>
        <div>
          <h3>Captain's Write-Up</h3>
          <p>Another epic tour in the books. The weather was brutal, the golf was tougher, but the banter was unmatched. There were heroes, villains, and plenty of lost balls. Till next time...</p>
        </div>
      </div>
      <button class="gold-btn">Read Full Write-Up</button>
    `)}
    <h3 class="section-title">Tour Highlights</h3>
    <div class="highlight-grid">
      ${tours.map((tourItem) => `<img src="${tourItem.image}" alt="${tourItem.shortTitle} course highlight" />`).join("")}
    </div>
  `;
}

function ThisTourOverview() {
  const actions = [
    ["Itinerary", "calendar"], ["Tee Times", "flag"], ["Pairings", "user"],
    ["Rules", "badge"], ["Fines System", "trophy"], ["Travel Info", "plane"],
    ["Contacts", "phone"], ["WhatsApp", "phone"], ["Packing List", "suitcase"],
  ];

  return `<div class="action-grid this-tour-overview">${actions.map(([label, iconName]) => ActionTile(label, iconName)).join("")}</div>`;
}

function resultScoreForTeam(result, team, score) {
  if (result === "Half") return "Tied";
  if (result === `Win Team ${team}`) return score || "";
  return "";
}

function teamPointsForRows(rows) {
  return rows.reduce(
    (totals, row) => {
      if (row.result === "Half") {
        totals.crocs += 0.5;
        totals.foz += 0.5;
      }
      if (row.result === "Win Team Crocs") totals.crocs += 1;
      if (row.result === "Win Team Foz") totals.foz += 1;
      return totals;
    },
    { crocs: 0, foz: 0 }
  );
}

function formatTeamPoints(points) {
  if (points === 0.5) return "1/2";
  if (Number.isInteger(points)) return String(points);
  return String(points).replace(".5", "½");
}

function formatTeamNames(names = "") {
  return String(names || "")
    .split(/\s*&\s*/)
    .map((name) => escapeHtml(name.trim()))
    .filter(Boolean)
    .join("<br>");
}

function splitLongParagraph(text, maxLength = 620) {
  if (text.length <= maxLength) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|.+$/g) || [text];
  return sentences.reduce((paragraphs, sentence) => {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) return paragraphs;

    const lastIndex = paragraphs.length - 1;
    if (lastIndex >= 0 && `${paragraphs[lastIndex]} ${cleanSentence}`.length <= maxLength) {
      paragraphs[lastIndex] = `${paragraphs[lastIndex]} ${cleanSentence}`;
    } else {
      paragraphs.push(cleanSentence);
    }
    return paragraphs;
  }, []);
}

function formatProfileBody(value = "") {
  const raw = String(value || "No profile notes yet.").replace(/\r\n/g, "\n").trim();
  const withSections = raw.replace(
    /\s+(?=(Evening H cap|Offers|Outside his skill set|Sportsman most like|Guilty pleasure|Best Nudgers Moment|Worst Nudgers Moment)\s*:)/gi,
    "\n\n"
  );

  return withSections
    .split(/\n{2,}|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => splitLongParagraph(paragraph))
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function ResultRow(row) {
  const crocsWon = row.result === "Win Team Crocs";
  const fozWon = row.result === "Win Team Foz";
  const half = row.result === "Half";
  return `
    <div class="result-row ${crocsWon ? "crocs-win" : ""} ${fozWon ? "foz-win" : ""} ${half ? "half" : ""}">
      <div class="result-score crocs">${escapeHtml(resultScoreForTeam(row.result, "Crocs", row.score))}</div>
      <div class="result-team crocs">${formatTeamNames(row.crocs_team || "Team Crocombe")}</div>
      <div class="result-format">${row.format === "Singles" ? "S" : "F"}</div>
      <div class="result-team foz">${formatTeamNames(row.foz_team || "Team Foster")}</div>
      <div class="result-score foz">${escapeHtml(resultScoreForTeam(row.result, "Foz", row.score))}</div>
    </div>
  `;
}

function TourResults(tour) {
  const rows = state.tourResultsByYear[tour.year] || [];
  const days = rows.reduce((grouped, row) => {
    if (!grouped[row.day]) grouped[row.day] = [];
    grouped[row.day].push(row);
    return grouped;
  }, {});

  if (state.tourResultsLoadingYear === tour.year) {
    return Card(`<p class="empty-state">Loading results...</p>`);
  }

  if (state.tourResultsError) {
    return Card(`<p class="empty-state">${escapeHtml(state.tourResultsError)}</p>`);
  }

  if (!rows.length) {
    return Card(`<p class="empty-state">No match results found for this tour.</p>`);
  }

  return `
    <div class="results-board">
      <section class="day-results overall-results">
        <h3>Overall</h3>
        <div class="result-table overall-table">
          <div class="result-score-head">
            <span class="score-team crocs">Team Crocombe</span>
            <b class="score-total crocs">${formatTeamPoints(teamPointsForRows(rows).crocs)}</b>
            <i></i>
            <b class="score-total foz">${formatTeamPoints(teamPointsForRows(rows).foz)}</b>
            <span class="score-team foz">Team Foster</span>
          </div>
        </div>
      </section>
      ${Object.entries(days).map(([day, dayRows]) => `
        <section class="day-results">
          <h3>Day ${day}</h3>
          <p>${escapeHtml(dayRows[0]?.course_name || "")}</p>
          <div class="result-table">
            <div class="result-score-head">
              <span class="score-team crocs">Team Crocombe</span>
              <b class="score-total crocs">${formatTeamPoints(teamPointsForRows(dayRows).crocs)}</b>
              <i></i>
              <b class="score-total foz">${formatTeamPoints(teamPointsForRows(dayRows).foz)}</b>
              <span class="score-team foz">Team Foster</span>
            </div>
            <div class="result-gap"></div>
            ${dayRows.map(ResultRow).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function TourProfileCard(row) {
  const player = getPlayerById(row.player_id);
  const playerName = player?.player_name || `Player ${row.player_id}`;
  const title = row.tour_role || row.profile_title || "Tour Profile";
  return `
    <article class="tour-profile-card" id="tour-profile-${row.id}">
      <div class="tour-profile-head">
        ${Avatar(player, "tour-profile-avatar")}
        <div>
          <h3>${escapeHtml(playerName)}</h3>
          <span>${escapeHtml(title)}</span>
        </div>
      </div>
      <div class="profile-body-preview expanded">${formatProfileBody(row.profile_body)}</div>
    </article>
  `;
}

function TourProfileRail(profileRows) {
  return `
    <div class="tour-profile-rail" aria-label="Tour profile quick jump">
      ${profileRows.map((row) => {
        const player = getPlayerById(row.player_id);
        const playerName = player?.player_name || `Player ${row.player_id}`;
        return `
          <button class="tour-rail-face" data-action="jump-tour-profile" data-profile-id="${row.id}" aria-label="${escapeHtml(playerName)}">
            ${Avatar(player, "tour-rail-avatar")}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function TourRoleCard(row) {
  const player = getPlayerById(row.player_id);
  const playerName = player?.player_name || `Player ${row.player_id}`;
  return `
    <article class="tour-role-card">
      <h3>${escapeHtml(playerName)}</h3>
      <span>${escapeHtml(row.tour_role || "Tour Role")}</span>
    </article>
  `;
}

function TourProfiles(tour) {
  const rows = state.tourProfilesByTourId[tour.supabaseId] || [];
  const profileRows = rows.filter((row) => row.profile_body);

  if (state.tourProfilesLoadingTourId === tour.supabaseId) {
    return Card(`<p class="empty-state">Loading tour profiles...</p>`);
  }

  if (state.tourProfilesError) {
    return Card(`<p class="empty-state">${escapeHtml(state.tourProfilesError)}</p>`);
  }

  if (!profileRows.length) {
    return Card(`<p class="empty-state">No tour profiles found for this tour.</p>`);
  }

  return `
    <div class="tour-profile-reader">
      <div class="tour-profile-list with-rail">${profileRows.map(TourProfileCard).join("")}</div>
      ${TourProfileRail(profileRows)}
    </div>
  `;
}

function TourRoles(tour) {
  const rows = state.tourProfilesByTourId[tour.supabaseId] || [];
  const roleRows = rows.filter((row) => row.tour_role);

  if (state.tourProfilesLoadingTourId === tour.supabaseId) {
    return Card(`<p class="empty-state">Loading tour roles...</p>`);
  }

  if (state.tourProfilesError) {
    return Card(`<p class="empty-state">${escapeHtml(state.tourProfilesError)}</p>`);
  }

  if (!roleRows.length) {
    return Card(`<p class="empty-state">No tour roles found for this tour.</p>`);
  }

  return `<div class="tour-profile-list roles-list">${roleRows.map(TourRoleCard).join("")}</div>`;
}

function TeamPlayer(row) {
  const player = getPlayerById(row.player_id);
  const playerName = player?.player_name || `Player ${row.player_id}`;
  const firstName = playerName.split(" ")[0];
  return `
    <article class="team-player">
      ${Avatar(player, "team-avatar")}
      <strong>${escapeHtml(firstName)}</strong>
    </article>
  `;
}

function TourTeams(tour) {
  const rows = state.tourProfilesByTourId[tour.supabaseId] || [];
  const teamRows = rows.filter((row) => row.team_name);

  if (state.tourProfilesLoadingTourId === tour.supabaseId) {
    return Card(`<p class="empty-state">Loading teams...</p>`);
  }

  if (state.tourProfilesError) {
    return Card(`<p class="empty-state">${escapeHtml(state.tourProfilesError)}</p>`);
  }

  if (!teamRows.length) {
    return Card(`<p class="empty-state">No team selections found for this tour.</p>`);
  }

  const groupedTeams = teamRows.reduce((grouped, row) => {
    const teamName = row.team_name || "Team";
    if (!grouped[teamName]) grouped[teamName] = [];
    grouped[teamName].push(row);
    return grouped;
  }, {});

  return `
    <div class="teams-list">
      ${Object.entries(groupedTeams).sort(([teamA], [teamB]) => {
        if (teamA === "Crocs") return -1;
        if (teamB === "Crocs") return 1;
        if (teamA === "Foz") return -1;
        if (teamB === "Foz") return 1;
        return teamA.localeCompare(teamB);
      }).map(([teamName, playersForTeam]) => `
        <section class="team-card">
          <div class="team-head">
            <div>
              <h3>${escapeHtml(teamName)}</h3>
            </div>
          </div>
          <div class="team-grid">
            ${playersForTeam.map(TeamPlayer).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function TourDetail({ forcedTour = null, thisTourMode = false } = {}) {
  const foundTour = forcedTour || tours.find((item) => item.id === state.detailTour);
  if ((!foundTour || thisTourMode) && !hasLoadedSupabase) {
    return `
      ${Header("", true)}
      ${Card(`
        <span class="eyebrow">Tour</span>
        <div class="loading-card">
          <strong>Loading tour...</strong>
          <p>Fetching the latest course notes.</p>
        </div>
      `, "home-loading")}
    `;
  }

  const tour = foundTour || tours[0];
  const detailTabs = ["Overview", "Results", "Teams", "Profiles", "Roles", "Awards", "Stats"];
  const detailBody = `
    ${state.detailSubTab === "Overview" ? (thisTourMode ? ThisTourOverview() : TourOverview()) : ""}
    ${state.detailSubTab === "Results" ? TourResults(tour) : ""}
    ${state.detailSubTab === "Teams" ? TourTeams(tour) : ""}
    ${state.detailSubTab === "Profiles" ? TourProfiles(tour) : ""}
    ${state.detailSubTab === "Roles" ? TourRoles(tour) : ""}
    ${!["Overview", "Results", "Teams", "Profiles", "Roles"].includes(state.detailSubTab) ? Card(`<p class="empty-state">${state.detailSubTab} coming soon.</p>`) : ""}
  `;

  return `
    ${Header("", thisTourMode ? "locked" : true)}
    <section class="detail-hero" style="background-image: linear-gradient(180deg, rgba(2,10,7,.05), rgba(2,10,7,.88)), url('${tour.image}')">
      <div><h2>${tour.title}</h2><p>${tour.dates}</p></div>
    </section>
    <nav class="subnav detail-tabs">
      ${detailTabs.map((x) => `<button class="${x === state.detailSubTab ? "active" : ""}" data-action="detail-subtab" data-tab="${x}">${x}</button>`).join("")}
    </nav>
    <div class="detail-body">${detailBody}</div>
  `;
}

function ThisTour() {
  return TourDetail({ forcedTour: tours[0], thisTourMode: true });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function PlayerPicker(slot, player) {
  const isOpen = state.openHeadToHeadPicker === slot;
  const selectedOtherId = slot === "a" ? state.selectedPlayerBId : state.selectedPlayerAId;
  return `
    <div class="player-picker ${isOpen ? "open" : ""}">
      <button class="player-pick-trigger" data-action="toggle-h2h-picker" data-slot="${slot}" aria-label="Choose ${escapeHtml(player?.player_name || "player")}">
        ${Avatar(player, "h2h-avatar")}
        <p>${escapeHtml(player?.player_name || "Choose player")}</p>
      </button>
      ${
        isOpen
          ? `<div class="player-pick-menu">
              ${allPlayers
                .filter((option) => Number(option.id) !== Number(selectedOtherId))
                .map((option) => `
                  <button class="${Number(option.id) === Number(player?.id) ? "active" : ""}" data-action="choose-h2h-player" data-slot="${slot}" data-player-id="${option.id}">
                    <span>${headshotForPlayer(option) ? `<img src="${headshotForPlayer(option)}" alt="${escapeHtml(option.player_name)}" />` : getInitials(option.player_name)}</span>
                    ${escapeHtml(option.player_name)}
                  </button>
                `)
                .join("")}
            </div>`
          : ""
      }
    </div>
  `;
}

function MeetingCard(match, playerA, playerB) {
  const teamLine = teamLineForMatch(match, playerA, playerB);
  return `
    <article class="meeting-card">
      <div class="meeting-head">
        <div>
          <strong>${escapeHtml(match.tour_name || "Tour")}</strong>
          <span>${match.year} · Day ${match.day} · Match ${match.match_number}</span>
        </div>
        <b>${escapeHtml(match.score || "A/S")}</b>
      </div>
      <p class="meeting-course">${escapeHtml(match.course_name || "Course TBC")}</p>
      <div class="meeting-meta">
        <span>${escapeHtml(match.format || "Match")}</span>
        <span>${escapeHtml(teamLine)}</span>
      </div>
      <div class="meeting-result">
        <span>Winner</span>
        <strong>${escapeHtml(match.winner_name || "N/A")}</strong>
      </div>
    </article>
  `;
}

function HeadToHeadStats() {
  const playerA = getPlayerById(state.selectedPlayerAId);
  const playerB = getPlayerById(state.selectedPlayerBId);
  const matches = state.headToHeadMatches || [];
  const summary = summariseHeadToHead(matches, state.selectedPlayerAId, state.selectedPlayerBId);
  const largestMargin = summary.largest
    ? `${summary.largest.score} (${summary.largest.winnerName?.split(" ")[0] || "Winner"})`
    : "N/A";
  const lastMeeting = summary.lastMeeting
    ? `${summary.lastMeeting.tour_name} ${summary.lastMeeting.year} (${summary.lastMeeting.score || "A/S"})`
    : "N/A";

  return `
    ${Card(`
      <span class="eyebrow center">Select Two Players</span>
      <div class="versus h2h-versus">
        ${PlayerPicker("a", playerA)}
        <button class="swap" data-action="swap-h2h">${icon("swap")}<span>VS</span></button>
        ${PlayerPicker("b", playerB)}
      </div>
    `)}
    ${Card(`
      <h3 class="center-title">Head-to-Head Record</h3>
      <div class="record-row">
        <span><b>${summary.playerAWins}</b>Wins</span>
        <span><b>${summary.halves}</b>Halves</span>
        <span><b>${summary.playerBWins}</b>Wins</span>
      </div>
      <div class="data-row"><span>Matches played</span><strong>${summary.matchesPlayed}</strong></div>
      <div class="data-row"><span>Last meeting</span><strong>${escapeHtml(lastMeeting)}</strong></div>
      <div class="data-row"><span>Most recent winner</span><strong>${escapeHtml(summary.mostRecentWinner)}</strong></div>
      <div class="data-row"><span>Largest margin</span><strong>${escapeHtml(largestMargin)}</strong></div>
    `)}
    <h3 class="section-title">Match History</h3>
    ${state.headToHeadLoading ? Card(`<p class="empty-state">Loading matches...</p>`) : ""}
    ${state.headToHeadError ? Card(`<p class="empty-state">${escapeHtml(state.headToHeadError)}</p>`) : ""}
    ${!state.headToHeadLoading && !state.headToHeadError && matches.length === 0 ? Card(`<p class="empty-state">No head-to-head matches found.</p>`) : ""}
    <div class="meeting-list">
      ${matches.map((match) => MeetingCard(match, playerA, playerB)).join("")}
    </div>
  `;
}

function IndividualPlayerPicker(player) {
  return `
    <div class="individual-picker ${state.openIndividualPicker ? "open" : ""}">
      <button class="individual-pick-trigger" data-action="toggle-individual-picker" aria-label="Choose ${escapeHtml(player?.player_name || "player")}">
        ${Avatar(player, "h2h-avatar")}
        <p>${escapeHtml(player?.player_name || "Choose player")}</p>
      </button>
      ${
        state.openIndividualPicker
          ? `<div class="player-pick-menu individual-menu">
              ${allPlayers
                .map((option) => `
                  <button class="${Number(option.id) === Number(player?.id) ? "active" : ""}" data-action="choose-individual-player" data-player-id="${option.id}">
                    <span>${headshotForPlayer(option) ? `<img src="${headshotForPlayer(option)}" alt="${escapeHtml(option.player_name)}" />` : getInitials(option.player_name)}</span>
                    ${escapeHtml(option.player_name)}
                  </button>
                `)
                .join("")}
            </div>`
          : ""
      }
    </div>
  `;
}

function individualOutcome(match) {
  if (match.result === "Half") return { label: "Half", points: 0.5, className: "half" };
  const won = match.result === `Win Team ${match.selectedTeam}`;
  return {
    label: `${won ? "Won" : "Lost"}${match.score ? ` ${match.score}` : ""}`,
    points: won ? 1 : 0,
    className: won ? "win" : "loss",
  };
}

function summariseIndividual(matches) {
  return matches.reduce(
    (summary, match) => {
      const outcome = individualOutcome(match);
      summary.matches += 1;
      summary.points += outcome.points;
      if (outcome.points === 1) summary.wins += 1;
      if (outcome.points === 0.5) summary.halves += 1;
      if (outcome.points === 0) summary.losses += 1;
      return summary;
    },
    { matches: 0, wins: 0, halves: 0, losses: 0, points: 0 }
  );
}

function courseNameForMatch(match) {
  return (
    match.course_name ||
    allCourses.find((course) => Number(course.id) === Number(match.course_id))?.course_name ||
    allCourses.find((course) => Number(course.year) === Number(match.year) && Number(course.day) === Number(match.day))?.course_name ||
    "Course TBC"
  );
}

function compactTeamNames(names = "") {
  return splitTeamNames(names).join(" & ");
}

function slashTeamNames(names = "") {
  return splitTeamNames(names).join(" / ");
}

function splitTeamNames(names = "") {
  return String(names || "")
    .split(/\s*&\s*/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function teamNamesForMatch(match, teamName) {
  if (!match.participants?.length) {
    return slashTeamNames(teamName === "Crocs" ? match.crocs_team : match.foz_team);
  }

  return match.participants
    .filter((row) => row.team_name === teamName)
    .sort((a, b) => Number(a.player_slot) - Number(b.player_slot))
    .map((row) => playerNameById(row.player_id))
    .join(" / ");
}

function teamNameListForMatch(match, teamName) {
  if (!match.participants?.length) {
    return splitTeamNames(teamName === "Crocs" ? match.crocs_team : match.foz_team);
  }

  return match.participants
    .filter((row) => row.team_name === teamName)
    .sort((a, b) => Number(a.player_slot) - Number(b.player_slot))
    .map((row) => playerNameById(row.player_id));
}

function IndividualMatchRow(match) {
  const outcome = individualOutcome(match);
  const crocs = teamNamesForMatch(match, "Crocs");
  const foz = teamNamesForMatch(match, "Foz");
  return `
    <div class="individual-match-row">
      <div class="individual-detail-row">
        <strong>Match</strong>
        <span>${escapeHtml(crocs || "Crocs")}<br><em>vs</em> ${escapeHtml(foz || "Foz")}</span>
      </div>
      <div class="individual-detail-row">
        <strong>Result</strong>
        <span class="${outcome.className}">${escapeHtml(outcome.label)}</span>
      </div>
    </div>
  `;
}

function IndividualTourHistory(tourKey, matches) {
  const tour = tours.find((item) => Number(item.year) === Number(tourKey));
  const groupedDays = matches.reduce((grouped, match) => {
    if (!grouped[match.day]) grouped[match.day] = [];
    grouped[match.day].push(match);
    return grouped;
  }, {});

  return `
    <section class="individual-tour-box">
      <h3>${escapeHtml(tour?.shortTitle || `Tour ${tourKey}`)}</h3>
      ${Object.entries(groupedDays).map(([day, dayMatches]) => `
        <div class="individual-day">
          <div class="individual-day-head">
            <strong>Day ${day}</strong>
            <span>${escapeHtml(courseNameForMatch(dayMatches[0]))}</span>
          </div>
          ${dayMatches.map(IndividualMatchRow).join("")}
        </div>
      `).join("")}
    </section>
  `;
}

function IndividualStats() {
  const player = getPlayerById(state.selectedIndividualPlayerId);
  const matches = state.individualMatchesByPlayerId[state.selectedIndividualPlayerId] || [];
  const summary = summariseIndividual(matches);
  const groupedTours = matches.reduce((grouped, match) => {
    if (!grouped[match.year]) grouped[match.year] = [];
    grouped[match.year].push(match);
    return grouped;
  }, {});
  const winRate = summary.matches ? Math.round((summary.wins / summary.matches) * 100) : 0;

  return `
    ${Card(`
      <span class="eyebrow center">Select Player</span>
      ${IndividualPlayerPicker(player)}
    `)}
    ${Card(`
      <h3 class="center-title">Individual Summary</h3>
      <div class="record-row individual-record">
        <span><b>${summary.wins}</b>Wins</span>
        <span><b>${summary.halves}</b>Halves</span>
        <span><b>${summary.losses}</b>Losses</span>
      </div>
      <div class="data-row"><span>Matches played</span><strong>${summary.matches}</strong></div>
      <div class="data-row"><span>Total points</span><strong>${formatTeamPoints(summary.points)}</strong></div>
      <div class="data-row"><span>Win rate</span><strong>${winRate}%</strong></div>
    `)}
    <h3 class="section-title">Match History</h3>
    ${state.individualLoadingPlayerId === state.selectedIndividualPlayerId ? Card(`<p class="empty-state">Loading matches...</p>`) : ""}
    ${state.individualError ? Card(`<p class="empty-state">${escapeHtml(state.individualError)}</p>`) : ""}
    ${!state.individualLoadingPlayerId && !state.individualError && !matches.length ? Card(`<p class="empty-state">No individual matches found.</p>`) : ""}
    <div class="individual-history">
      ${Object.entries(groupedTours)
        .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
        .map(([year, yearMatches]) => IndividualTourHistory(year, yearMatches))
        .join("")}
    </div>
  `;
}

function emptyPlayerRecord(playerName) {
  return {
    playerName,
    matches: 0,
    wins: 0,
    fourballMatches: 0,
    fourballWins: 0,
    singlesMatches: 0,
    singlesWins: 0,
    points: 0,
  };
}

function addOverviewResult(records, playerName, match, teamName) {
  if (!playerName) return;
  if (!records[playerName]) records[playerName] = emptyPlayerRecord(playerName);

  const record = records[playerName];
  const won = match.result === `Win Team ${teamName}`;
  const points = match.result === "Half" ? 0.5 : won ? 1 : 0;
  const format = String(match.format || "").toLowerCase();
  record.matches += 1;
  record.points += points;
  if (won) record.wins += 1;
  if (format.includes("fourball")) {
    record.fourballMatches += 1;
    if (won) record.fourballWins += 1;
  }
  if (format.includes("singles")) {
    record.singlesMatches += 1;
    if (won) record.singlesWins += 1;
  }
}

function percentage(wins, matches) {
  return matches ? Math.round((wins / matches) * 100) : 0;
}

function bestBy(records, matchesKey, winsKey) {
  return records
    .filter((record) => record[matchesKey] > 0)
    .sort((a, b) => {
      const percentDiff = percentage(b[winsKey], b[matchesKey]) - percentage(a[winsKey], a[matchesKey]);
      if (percentDiff) return percentDiff;
      return b[matchesKey] - a[matchesKey];
    })[0];
}

function activePlayerNames() {
  return new Set(
    allPlayers
      .filter((player) => player.is_active !== false)
      .map((player) => player.player_name)
  );
}

function buildOverviewStats(rows, activeOnly = true) {
  const recordsByPlayer = {};
  const allowedPlayers = activeOnly ? activePlayerNames() : null;
  rows.forEach((match) => {
    splitTeamNames(match.crocs_team)
      .filter((playerName) => !allowedPlayers || allowedPlayers.has(playerName))
      .forEach((playerName) => addOverviewResult(recordsByPlayer, playerName, match, "Crocs"));
    splitTeamNames(match.foz_team)
      .filter((playerName) => !allowedPlayers || allowedPlayers.has(playerName))
      .forEach((playerName) => addOverviewResult(recordsByPlayer, playerName, match, "Foz"));
  });

  const records = Object.values(recordsByPlayer);
  const highestWin = bestBy(records, "matches", "wins");
  const highestFourball = bestBy(records, "fourballMatches", "fourballWins");
  const highestSingles = bestBy(records, "singlesMatches", "singlesWins");
  const mostWins = [...records].sort((a, b) => b.wins - a.wins || b.matches - a.matches)[0];
  const mostPoints = [...records].sort((a, b) => b.points - a.points || b.wins - a.wins)[0];
  const mostMatches = [...records].sort((a, b) => b.matches - a.matches || b.wins - a.wins)[0];

  return { highestWin, highestFourball, highestSingles, mostWins, mostPoints, mostMatches, records, totalMatches: rows.length };
}

function LeaderStat(label, name, value, detail = "") {
  return `
    <article class="leader-stat">
      <span>${label}</span>
      <strong>${escapeHtml(name)}</strong>
      <div class="leader-value"><b>${escapeHtml(value)}</b>${detail ? `<small>(${escapeHtml(detail)})</small>` : ""}</div>
    </article>
  `;
}

function percentLeader(record, matchesKey, winsKey) {
  if (!record) return { name: "N/A", value: "No matches", detail: "" };
  return {
    name: record.playerName,
    value: `${percentage(record[winsKey], record[matchesKey])}%`,
    detail: `${record[winsKey]}/${record[matchesKey]}`,
  };
}

function StatsOverview() {
  const rows = state.statsOverviewRows || [];
  const stats = buildOverviewStats(rows, state.statsActiveOnly);
  const highestWin = percentLeader(stats.highestWin, "matches", "wins");
  const highestFourball = percentLeader(stats.highestFourball, "fourballMatches", "fourballWins");
  const highestSingles = percentLeader(stats.highestSingles, "singlesMatches", "singlesWins");

  if (state.statsOverviewLoading) {
    return Card(`<p class="empty-state">Loading overview stats...</p>`);
  }

  if (state.statsOverviewError) {
    return Card(`<p class="empty-state">${escapeHtml(state.statsOverviewError)}</p>`);
  }

  if (!rows.length) {
    return Card(`<p class="empty-state">No overview stats found.</p>`);
  }

  return `
    <label class="stats-filter">
      <input type="checkbox" data-action="toggle-active-nudgers" ${state.statsActiveOnly ? "checked" : ""}>
      <span>Active Nudgers Only</span>
    </label>
    <div class="leader-grid">
      ${LeaderStat("Highest Win %", highestWin.name, highestWin.value, highestWin.detail)}
      ${LeaderStat("Highest Fourball Win %", highestFourball.name, highestFourball.value, highestFourball.detail)}
      ${LeaderStat("Highest Singles Win %", highestSingles.name, highestSingles.value, highestSingles.detail)}
      ${LeaderStat("Most Wins", stats.mostWins?.playerName || "N/A", String(stats.mostWins?.wins || 0), `${stats.mostWins?.matches || 0} matches`)}
      ${LeaderStat("Most Points", stats.mostPoints?.playerName || "N/A", formatTeamPoints(stats.mostPoints?.points || 0), `${stats.mostPoints?.wins || 0} wins`)}
      ${LeaderStat("Most Matches Played", stats.mostMatches?.playerName || "N/A", String(stats.mostMatches?.matches || 0), "matches")}
      ${LeaderStat("Total Nudgers Matches Played", String(stats.totalMatches), "")}
    </div>
    ${OverviewLeaderboard(stats.records)}
  `;
}

function OverviewLeaderboard(records = []) {
  const rows = [...records].sort((a, b) => b.points - a.points || b.matches - a.matches);

  return `
    <section class="overview-table-card">
      <h3>Player Records</h3>
      <div class="overview-table-wrap">
        <table class="overview-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total Played</th>
              <th>Total Won</th>
              <th>Fourball Win %</th>
              <th>Singles Win %</th>
              <th>Total Win %</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((record) => `
              <tr>
                <th>${escapeHtml(record.playerName)}</th>
                <td>${record.matches}</td>
                <td>${formatTeamPoints(record.points)}</td>
                <td>${percentage(record.fourballWins, record.fourballMatches)}%</td>
                <td>${percentage(record.singlesWins, record.singlesMatches)}%</td>
                <td>${percentage(record.wins, record.matches)}%</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function Stats() {
  return `
    <div class="stats-sticky">
      ${Header("Stats")}
      <nav class="subnav top">
        ${["Overview", "Head-to-Head", "Individual", "Records", "Fun Stats"].map((x) => `<button class="${x === state.statSubTab ? "active" : ""}" data-action="stat-tab" data-tab="${x}">${x}</button>`).join("")}
      </nav>
    </div>
    <div class="stats-body">
      ${state.statSubTab === "Overview" ? StatsOverview() : ""}
      ${state.statSubTab === "Head-to-Head" ? HeadToHeadStats() : ""}
      ${state.statSubTab === "Individual" ? IndividualStats() : ""}
      ${!["Overview", "Head-to-Head", "Individual"].includes(state.statSubTab) ? Card(`<p class="empty-state">${state.statSubTab} coming soon.</p>`) : ""}
    </div>
  `;
}

function latestByTourId(rows = []) {
  return [...rows].sort((a, b) => Number(b.tour_id || 0) - Number(a.tour_id || 0))[0];
}

function tourWinnerByYear(rows = []) {
  const grouped = rows.reduce((byYear, row) => {
    if (!byYear[row.year]) byYear[row.year] = [];
    byYear[row.year].push(row);
    return byYear;
  }, {});

  return Object.entries(grouped).reduce((winners, [year, yearRows]) => {
    const totals = teamPointsForRows(yearRows);
    if (totals.crocs > totals.foz) winners[year] = "Crocs";
    if (totals.foz > totals.crocs) winners[year] = "Foz";
    if (totals.crocs === totals.foz && (totals.crocs || totals.foz)) winners[year] = "Half";
    return winners;
  }, {});
}

function playerTourYears(playerName, profileRows = []) {
  const profileYears = profileRows
    .map((row) => tours.find((tour) => Number(tour.supabaseId) === Number(row.tour_id))?.year)
    .filter(Boolean);
  const resultYears = state.touristResultsRows
    .filter((row) => splitTeamNames(row.crocs_team).includes(playerName) || splitTeamNames(row.foz_team).includes(playerName))
    .map((row) => row.year)
    .filter(Boolean);

  return [...new Set([...profileYears, ...resultYears])];
}

function playerTourWins(playerName, profileRows = []) {
  const winners = tourWinnerByYear(state.touristResultsRows);
  const profileByYear = profileRows.reduce((byYear, row) => {
    const year = tours.find((tour) => Number(tour.supabaseId) === Number(row.tour_id))?.year;
    if (year && !byYear[year]) byYear[year] = row;
    return byYear;
  }, {});

  return playerTourYears(playerName, profileRows).reduce((wins, year) => {
    const winner = winners[year];
    const row = profileByYear[year];
    const teamName =
      row?.team_name ||
      (state.touristResultsRows.find((match) => Number(match.year) === Number(year) && splitTeamNames(match.crocs_team).includes(playerName)) ? "Crocs" : "") ||
      (state.touristResultsRows.find((match) => Number(match.year) === Number(year) && splitTeamNames(match.foz_team).includes(playerName)) ? "Foz" : "");

    if (winner === "Half") return wins + 0.5;
    if (winner && teamName === winner) return wins + 1;
    return wins;
  }, 0);
}

function buildTouristPlayers() {
  if (!allPlayers.length) {
    return players.map((player) => ({
      ...player,
      isActive: true,
      tourWins: player.wins ?? "[PLACEHOLDER]",
      individualWins: player.wins ?? "[PLACEHOLDER]",
      about: player.about || "[PLACEHOLDER]",
      strengths: player.strengths?.length ? player.strengths : ["[PLACEHOLDER]"],
      weaknesses: player.weaknesses?.length ? player.weaknesses : ["[PLACEHOLDER]"],
    }));
  }

  const overview = buildOverviewStats(state.touristResultsRows, false);
  const recordsByName = overview.records.reduce((records, record) => {
    records[record.playerName] = record;
    return records;
  }, {});

  return [...allPlayers]
    .sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active === false ? 1 : -1;
      return a.player_name.localeCompare(b.player_name);
    })
    .map((player) => {
      const profileRows = state.touristProfileRows.filter((row) => Number(row.player_id) === Number(player.id));
      const handicapRows = state.touristHandicapRows.filter((row) => Number(row.player_id) === Number(player.id));
      const latestProfile = latestByTourId(profileRows);
      const latestHandicap = latestByTourId(handicapRows);
      const record = recordsByName[player.player_name] || emptyPlayerRecord(player.player_name);

      return {
        id: player.id,
        name: player.player_name,
        nick: player.player_nickname || "[PLACEHOLDER]",
        isActive: player.is_active !== false,
        handicap: latestHandicap?.handicap ?? "[PLACEHOLDER]",
        role: latestProfile?.tour_role || "[PLACEHOLDER]",
        tours: playerTourYears(player.player_name, profileRows).length || "[PLACEHOLDER]",
        tourWins: formatTeamPoints(playerTourWins(player.player_name, profileRows)),
        individualWins: record.wins || 0,
        about: latestProfile?.profile_body || "[PLACEHOLDER]",
        strengths: ["[PLACEHOLDER]"],
        weaknesses: ["[PLACEHOLDER]"],
      };
    });
}

function TouristRoster(playersList, selectedIndex, showActiveSelection = false) {
  return `
    <div class="tourist-roster" aria-label="Tourist selector">
      ${playersList.map((player, index) => `
        <button class="tourist-chip ${showActiveSelection && index === selectedIndex ? "active" : ""} ${player.isActive === false ? "inactive" : ""}" data-action="player" data-index="${index}">
          <span class="tourist-photo">
            ${Avatar({ player_name: player.name }, "tourist-avatar")}
            ${player.isActive === false ? `<em>Inactive</em>` : ""}
          </span>
          <span class="tourist-name">${escapeHtml(player.name.split(" ")[0])}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function TouristProfilePage(player) {
  return `
    <button class="tourist-back" data-action="tourist-back" aria-label="Back to Tourists">${icon("back")}</button>
    ${PlayerCard(player)}
    ${Card(`
      <h3>Career Highlights</h3>
      <p>[PLACEHOLDER]</p>
    `)}
  `;
}

function Profiles() {
  const touristPlayers = buildTouristPlayers();
  const selectedIndex = Math.min(state.playerIndex, Math.max(touristPlayers.length - 1, 0));

  if (state.touristDataLoading) {
    return `
      ${Header("Tourists")}
      ${Card(`<p class="empty-state">Loading tourist profiles...</p>`)}
    `;
  }

  if (state.touristDataError) {
    return `
      ${Header("Tourists")}
      ${Card(`<p class="empty-state">${escapeHtml(state.touristDataError)}</p>`)}
    `;
  }

  return `
    ${Header("Tourists")}
    ${
      state.touristProfileOpen
        ? TouristProfilePage(touristPlayers[selectedIndex])
        : TouristRoster(touristPlayers, selectedIndex)
    }
  `;
}

function Media() {
  return `
    ${Header("Pictures & Media")}
    ${Card(`<p class="empty-state">Pictures & Media coming soon.</p>`)}
  `;
}

function BottomNav() {
  return `
    <nav class="bottom-nav">
      ${navItems.map(([id, label, iconName]) => `
        <button class="${id === "more" ? (["profiles", "media"].includes(state.tab) || state.moreMenuOpen ? "active" : "") : state.tab === id ? "active" : ""}" data-action="${id === "more" ? "toggle-more" : "tab"}" data-tab="${id}">
          ${icon(iconName)}
          <span>${label}</span>
        </button>
      `).join("")}
      ${
        state.moreMenuOpen
          ? `<div class="more-menu">
              <button data-action="more-option" data-tab="media">Pictures & Media</button>
              <button data-action="more-option" data-tab="profiles">Tourists</button>
            </div>`
          : ""
      }
    </nav>
  `;
}

function DesktopGate() {
  return `
    <section class="desktop-gate">
      ${Logo()}
      <h1>The Cultured Nudgers is built for mobile.</h1>
      <p>Open this on your phone for the full app experience.</p>
      <div class="qr-card" aria-label="QR placeholder">
        ${Array.from({ length: 64 }, (_, i) => `<span class="${i % 3 === 0 || i % 7 === 0 ? "dark" : ""}"></span>`).join("")}
      </div>
    </section>
  `;
}

function routeState() {
  const content = document.querySelector(".content");
  return {
    tab: state.tab,
    detailTour: state.detailTour,
    detailSubTab: state.detailSubTab,
    statSubTab: state.statSubTab,
    playerIndex: state.playerIndex,
    selectedPlayerAId: state.selectedPlayerAId,
    selectedPlayerBId: state.selectedPlayerBId,
    selectedIndividualPlayerId: state.selectedIndividualPlayerId,
    statsActiveOnly: state.statsActiveOnly,
    scrollTop: content ? Math.round(content.scrollTop) : Number(localStorage.getItem("nudgers-scroll-top") || 0),
  };
}

function persistRoute(replace = true) {
  const route = routeState();
  localStorage.setItem("nudgers-route", JSON.stringify(route));
  localStorage.setItem("nudgers-scroll-top", String(route.scrollTop || 0));

  const params = new URLSearchParams(window.location.search);
  params.set("tab", route.tab);
  if (route.detailTour) params.set("tour", route.detailTour);
  else params.delete("tour");
  if (route.detailSubTab) params.set("detail", route.detailSubTab);
  if (route.statSubTab) params.set("stat", route.statSubTab);
  if (route.selectedPlayerAId) params.set("pa", route.selectedPlayerAId);
  if (route.selectedPlayerBId) params.set("pb", route.selectedPlayerBId);
  if (route.selectedIndividualPlayerId) params.set("pi", route.selectedIndividualPlayerId);
  params.set("active", route.statsActiveOnly ? "1" : "0");
  if (route.scrollTop) params.set("scroll", route.scrollTop);
  else params.delete("scroll");

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  if (replace) window.history.replaceState(null, "", nextUrl);
}

function restoreRoute() {
  const params = new URLSearchParams(window.location.search);
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("nudgers-route") || "{}");
  } catch {
    saved = {};
  }

  const requestedTab = params.get("tab");
  state.tab = requestedTab || saved.tab || state.tab;
  state.detailTour = params.has("tour") ? params.get("tour") : requestedTab ? null : saved.detailTour || state.detailTour;
  state.detailSubTab = params.get("detail") || saved.detailSubTab || state.detailSubTab;
  if (state.detailSubTab === "Gallery") state.detailSubTab = "Teams";
  if (requestedTab === "this-tour" && !params.has("detail")) state.detailSubTab = "Overview";
  state.statSubTab = params.get("stat") || saved.statSubTab || state.statSubTab;
  state.playerIndex = Number(params.get("player") || saved.playerIndex || state.playerIndex);
  state.selectedPlayerAId = Number(params.get("pa") || saved.selectedPlayerAId || state.selectedPlayerAId) || null;
  state.selectedPlayerBId = Number(params.get("pb") || saved.selectedPlayerBId || state.selectedPlayerBId) || null;
  state.selectedIndividualPlayerId = Number(params.get("pi") || saved.selectedIndividualPlayerId || state.selectedIndividualPlayerId) || null;
  state.statsActiveOnly = params.has("active") ? params.get("active") !== "0" : saved.statsActiveOnly ?? state.statsActiveOnly;
  state.restoredScrollTop = Number(params.get("scroll") || saved.scrollTop || 0);
}

function restoreScrollPosition() {
  const content = document.querySelector(".content");
  if (!content || !state.restoredScrollTop) return;
  const scrollTop = state.restoredScrollTop;
  state.restoredScrollTop = 0;
  requestAnimationFrame(() => {
    content.scrollTo({ top: scrollTop, behavior: "instant" });
  });
}

function render() {
  if (window.matchMedia("(min-width: 769px)").matches) {
    app.innerHTML = DesktopGate();
    return;
  }
  const screens = {
    home: Home,
    tours: Tours,
    "this-tour": ThisTour,
    stats: Stats,
    profiles: Profiles,
    media: Media,
  };
  if (!screens[state.tab]) state.tab = "home";
  const screenContent = state.tab === "this-tour" ? ThisTour() : state.detailTour ? TourDetail() : screens[state.tab]();
  app.innerHTML = `
    <div class="phone-shell">
      <div class="content">${screenContent}</div>
      ${BottomNav()}
    </div>
  `;
  updateCountdown();
  restoreScrollPosition();
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "tab") {
    state.restoredScrollTop = 0;
    state.tab = target.dataset.tab;
    state.detailTour = null;
    if (state.tab === "this-tour") state.detailSubTab = "Overview";
    if (state.tab !== "profiles") state.touristProfileOpen = false;
    state.openHeadToHeadPicker = null;
    state.openIndividualPicker = false;
    state.moreMenuOpen = false;
  }
  if (action === "toggle-more") {
    state.moreMenuOpen = !state.moreMenuOpen;
  }
  if (action === "more-option") {
    state.restoredScrollTop = 0;
    state.tab = target.dataset.tab;
    state.detailTour = null;
    state.touristProfileOpen = false;
    state.moreMenuOpen = false;
    state.openHeadToHeadPicker = null;
    state.openIndividualPicker = false;
  }
  if (action === "tour-detail") {
    state.restoredScrollTop = 0;
    const tour = tours.find((item) => item.id === target.dataset.tour);
    if (tour?.status === "Upcoming") {
      state.tab = "this-tour";
      state.detailTour = null;
      state.detailSubTab = "Overview";
    } else {
      state.detailTour = target.dataset.tour;
      state.detailSubTab = "Overview";
    }
  }
  if (action === "back") {
    state.restoredScrollTop = 0;
    state.detailTour = null;
    state.detailSubTab = "Overview";
  }
  if (action === "detail-subtab") {
    state.restoredScrollTop = 0;
    state.detailSubTab = target.dataset.tab;
    const tour = state.tab === "this-tour" ? tours[0] : tours.find((item) => item.id === state.detailTour);
    if (state.detailSubTab === "Results") loadTourResults(tour?.year);
    if (["Teams", "Profiles", "Roles"].includes(state.detailSubTab)) loadTourProfiles(tour?.supabaseId);
  }
  if (action === "stat-tab") {
    state.restoredScrollTop = 0;
    state.statSubTab = target.dataset.tab;
    if (state.statSubTab === "Overview") loadStatsOverview();
    if (state.statSubTab === "Head-to-Head" && allPlayers.length) loadHeadToHeadMatches();
    if (state.statSubTab === "Individual" && allPlayers.length) loadIndividualMatches();
  }
  if (action === "toggle-active-nudgers") {
    state.statsActiveOnly = target.checked;
  }
  if (action === "player") {
    state.restoredScrollTop = 0;
    state.playerIndex = Number(target.dataset.index);
    if (state.tab === "profiles") state.touristProfileOpen = true;
  }
  if (action === "tourist-back") {
    state.restoredScrollTop = 0;
    state.touristProfileOpen = false;
  }
  if (action === "toggle-h2h-picker") {
    state.openHeadToHeadPicker = state.openHeadToHeadPicker === target.dataset.slot ? null : target.dataset.slot;
  }
  if (action === "toggle-individual-picker") {
    state.openIndividualPicker = !state.openIndividualPicker;
  }
  if (action === "choose-h2h-player") {
    if (target.dataset.slot === "a") state.selectedPlayerAId = Number(target.dataset.playerId);
    if (target.dataset.slot === "b") state.selectedPlayerBId = Number(target.dataset.playerId);
    state.openHeadToHeadPicker = null;
    loadHeadToHeadMatches();
  }
  if (action === "choose-individual-player") {
    state.selectedIndividualPlayerId = Number(target.dataset.playerId);
    state.openIndividualPicker = false;
    loadIndividualMatches();
  }
  if (action === "swap-h2h") {
    const previousA = state.selectedPlayerAId;
    state.selectedPlayerAId = state.selectedPlayerBId;
    state.selectedPlayerBId = previousA;
    state.openHeadToHeadPicker = null;
    loadHeadToHeadMatches();
  }
  if (action === "toggle-tour-profile") {
    const content = document.querySelector(".content");
    state.restoredScrollTop = content ? Math.round(content.scrollTop) : 0;
    const profileId = target.dataset.profileId;
    state.expandedTourProfiles[profileId] = !state.expandedTourProfiles[profileId];
  }
  if (action === "jump-tour-profile") {
    jumpToTourProfile(target.dataset.profileId);
    persistRoute();
    return;
  }
  render();
  persistRoute();
});

function jumpToTourProfile(profileId) {
  const target = document.getElementById(`tour-profile-${profileId}`);
  if (!target) return;

  const content = document.querySelector(".content");
  const fixedHeaderHeight = 192;
  const targetTop = target.getBoundingClientRect().top + (content?.scrollTop || 0) - fixedHeaderHeight;
  content?.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" });
}

document.addEventListener("scroll", () => persistRoute(), true);
window.addEventListener("resize", render);
restoreRoute();
render();
loadSupabaseData();

if (!countdownTimer) {
  countdownTimer = window.setInterval(updateCountdown, 1000);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
