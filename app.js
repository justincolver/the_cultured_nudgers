const SUPABASE_REST_URL = "https://dwohuxnsbaupysxtupxs.supabase.co/rest/v1";
const SUPABASE_STORAGE_URL = "https://dwohuxnsbaupysxtupxs.supabase.co/storage/v1/object/public";
const SUPABASE_PHOTOS_BUCKET = "Photos";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5HdyIHS4QW98ZMEGk7NDvw_JEROoM2z";

let tours = [
  {
    id: "portugal-2025",
    title: "Portugal 2025 🇵🇹",
    shortTitle: "Portugal 2025",
    status: "Upcoming",
    dates: "May 15 - May 19, 2025",
    location: "Vilamoura, Portugal",
    image: "/assets/images/tours/2019-vilamoura.jpg",
  },
  {
    id: "scotland-2024",
    title: "Scotland 2024 🇬🇧",
    shortTitle: "Scotland 2024",
    status: "Completed",
    dates: "May 9 - May 13, 2024",
    location: "Fife, Scotland",
    image: "/assets/images/tours/2022-carnoustie.jpg",
  },
  {
    id: "mallorca-2023",
    title: "Mallorca 2023 🇪🇸",
    shortTitle: "Mallorca 2023",
    status: "Completed",
    dates: "May 4 - May 8, 2023",
    location: "Capdepera, Mallorca",
    image: "/assets/images/tours/2023-woodhall-spa.jpg",
  },
  {
    id: "ireland-2022",
    title: "Ireland 2022 🇮🇪",
    shortTitle: "Ireland 2022",
    status: "Completed",
    dates: "May 12 - May 16, 2022",
    location: "Doonbeg, Ireland",
    image: "/assets/images/tours/2021-st-mellion-burnham-berrow.webp",
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

let players = [];

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
    "bander-pyke": "/assets/images/headshots/bander-pyke.png",
    "brian-crotty": "/assets/images/headshots/brian-crotty.png",
    "eamonn-sheehy": "/assets/images/headshots/eamonn-sheehy.png",
    "edmund-northcott": "/assets/images/headshots/edmund-northcott.png",
    "george-holman": "/assets/images/headshots/george-holman.png",
    "greg-smith": "/assets/images/headshots/greg-smith.png",
    "harry-rowlinson": "/assets/images/headshots/harry-rowlinson.png",
    "henry-rudkin": "/assets/images/headshots/henry-rudkin.png",
    "james-barrie": "/assets/images/headshots/james-barrie.png",
    "james-rowlinson": "/assets/images/headshots/james-rowlinson.png",
    "joe-barnett": "/assets/images/headshots/joe-barnett.png",
    "johnny-griffiths": "/assets/images/headshots/johnny-griffiths.png",
    "justin-colver": "/assets/images/headshots/justin-colver.png",
    "luka-syplywczak": "/assets/images/headshots/luka-syplywczak.png",
    "matt-neely": "/assets/images/headshots/matt-neely.png",
    "nick-gubbins": "/assets/images/headshots/nick-gubbins.png",
    "patch-foster": "/assets/images/headshots/patch-foster.png",
    "peter-crocombe": "/assets/images/headshots/peter-crocombe.png",
    "raff-mckenzie": "/assets/images/headshots/raff-mckenzie.png",
    "raff-mckensie": "/assets/images/headshots/raff-mckenzie.png",
    "rob-moore": "/assets/images/headshots/rob-moore.png",
    "sam-foster": "/assets/images/headshots/sam-foster.png",
    "simon-collings": "/assets/images/headshots/simon-collings.png",
    "simon-hicks": "/assets/images/headshots/simon-hicks.png",
    "tom-smith": "/assets/images/headshots/tom-smith.png",
    "tom-tynan": "/assets/images/headshots/tom-tynan.png",
    "tom-wigglesworth": "/assets/images/headshots/tom-wigglesworth.png",
    "will-gubbins": "/assets/images/headshots/will-gubbins.png",
    "will-major": "/assets/images/headshots/will-major.png",
    "will-macpherson": "/assets/images/headshots/will-macpherson.png",
  };
  return headshots[slugifyName(player.player_name)] || "";
}

function playerNickname(player = {}) {
  return String(player.player_nickname || "").trim();
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

function stripTourFlags(value = "") {
  return String(value)
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "")
    .replace(/\u{1F3F4}/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
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
    2016: "/assets/images/tours/2016-morocco.jpg",
    2017: "/assets/images/tours/2017-monte-rei.jpg",
    2018: "/assets/images/tours/2018-laranjal.webp",
    2019: "/assets/images/tours/2019-vilamoura.jpg",
    2021: "/assets/images/tours/2021-st-mellion-burnham-berrow.webp",
    2022: "/assets/images/tours/2022-carnoustie.jpg",
    2023: "/assets/images/tours/2023-woodhall-spa.jpg",
    2024: "/assets/images/tours/2024-hardelot-le-touquet.jpg",
    2025: "/assets/images/tours/2025-bruges-damme.jpg",
    2026: "/assets/images/tours/2026-aberdovey.webp",
  };
  const fallbackImages = [
    "/assets/images/tours/2026-aberdovey.webp",
    "/assets/images/tours/2025-bruges-damme.jpg",
    "/assets/images/tours/2024-hardelot-le-touquet.jpg",
    "/assets/images/tours/2023-woodhall-spa.jpg",
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
  return {
    id: `tour-${row.id}`,
    supabaseId: row.id,
    year: row.year,
    title: stripTourFlags(`${name} ${row.year}`),
    shortTitle: stripTourFlags(`${name} ${row.year}`),
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
    cache: "no-store",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.json();
}

async function supabaseWrite(path, { method = "POST", body } = {}) {
  const response = await fetch(`${SUPABASE_REST_URL}/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Supabase write failed: ${response.status}`);
  return response.status === 204 ? null : response.json();
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

async function loadTourPhotos(year) {
  if (!year || state.tourPhotosByYear[year] || state.tourPhotosLoadingYear === year) return;

  state.tourPhotosLoadingYear = year;
  state.tourPhotosError = "";
  render();

  try {
    const rows = await supabaseFetch(
      `photos?select=*&tour_year=eq.${year}&order=is_group_photo.desc&order=uploaded_at.asc`
    );
    state.tourPhotosByYear[year] = rows.filter((row) => !isBrochureRow(row));
  } catch (error) {
    console.warn(error);
    state.tourPhotosError = "Could not load tour photos.";
  } finally {
    state.tourPhotosLoadingYear = null;
    render();
  }
}

async function loadMatchReport(year) {
  if (
    !year ||
    Object.prototype.hasOwnProperty.call(state.matchReportsByYear, year) ||
    state.matchReportsLoadingYear === year
  ) {
    return;
  }

  state.matchReportsLoadingYear = year;
  state.matchReportsError = "";
  render();

  try {
    const rows = await supabaseFetch(`match_reports?select=*&year=eq.${year}&limit=1`);
    state.matchReportsByYear[year] = rows[0] || null;
  } catch (error) {
    console.warn(error);
    state.matchReportsError = "Could not load match report.";
    state.matchReportsByYear[year] = null;
  } finally {
    state.matchReportsLoadingYear = null;
    render();
  }
}

async function loadTourBrochures(year) {
  if (!year || state.tourBrochuresByYear[year] || state.tourBrochuresLoadingYear === year) return;

  state.tourBrochuresLoadingYear = year;
  state.tourBrochuresError = "";
  render();

  try {
    const rows = await supabaseFetch(`photos?select=*&tour_year=eq.${year}&order=uploaded_at.asc`);
    state.tourBrochuresByYear[year] = rows.filter(isBrochureRow);
  } catch (error) {
    console.warn(error);
    state.tourBrochuresError = "Could not load brochures.";
  } finally {
    state.tourBrochuresLoadingYear = null;
    render();
  }
}

function isBrochureRow(row = {}) {
  const bucket = String(row.bucket_name || "").trim().toLowerCase();
  const mediaType = String(row.media_type || "").trim().toLowerCase();
  const filePath = String(row.file_path || "").trim().toLowerCase();

  return (
    bucket === "brochures" ||
    bucket === "bruchures" ||
    mediaType.includes("brochure") ||
    filePath.endsWith(".pdf")
  );
}

function tourPageCacheKey(year, pageKey) {
  return `${year}:${pageKey}`;
}

function normaliseTourPageContent(content) {
  return Array.isArray(content)
    ? content
        .filter((block) => block && ["heading", "subheading", "subheading3", "text", "bullet"].includes(block.type))
        .map((block) => ({ type: block.type, text: String(block.text || "") }))
    : [];
}

async function loadTourPage(year, pageKey, fallbackTitle) {
  if (!year || !pageKey) return;
  const cacheKey = tourPageCacheKey(year, pageKey);
  if (state.tourPagesByKey[cacheKey] || state.tourPageLoadingKey === cacheKey) return;

  state.tourPageLoadingKey = cacheKey;
  state.tourPageError = "";
  render();

  try {
    const rows = await supabaseFetch(
      `tour_pages?select=*&tour_year=eq.${year}&page_key=eq.${encodeURIComponent(pageKey)}&limit=1`
    );
    let page = rows[0];
    if (!page) {
      const createdRows = await supabaseWrite("tour_pages", {
        body: {
          tour_year: Number(year),
          page_key: pageKey,
          title: fallbackTitle,
          content: [],
          updated_at: new Date().toISOString(),
        },
      });
      page = createdRows?.[0];
    }

    state.tourPagesByKey[cacheKey] = {
      ...page,
      content: normaliseTourPageContent(page?.content),
    };
  } catch (error) {
    console.warn(error);
    state.tourPageError = "Could not load this tour page.";
  } finally {
    state.tourPageLoadingKey = null;
    render();
  }
}

async function saveTourPage(year, pageKey) {
  const cacheKey = tourPageCacheKey(year, pageKey);
  const page = state.tourPagesByKey[cacheKey];
  if (!page?.id || state.tourPageSavingKey === cacheKey) return;

  state.tourPageSavingKey = cacheKey;
  state.tourPageError = "";
  render();

  try {
    const savedRows = await supabaseWrite(`tour_pages?id=eq.${page.id}`, {
      method: "PATCH",
      body: {
        title: page.title,
        content: normaliseTourPageContent(page.content),
        updated_at: new Date().toISOString(),
      },
    });
    const savedPage = savedRows?.[0] || page;
    state.tourPagesByKey[cacheKey] = {
      ...savedPage,
      content: normaliseTourPageContent(savedPage.content),
    };
    delete state.tourPageDrafts[cacheKey];
    state.tourPageSavedKey = cacheKey;
    state.tourPageEditingKey = null;
  } catch (error) {
    console.warn(error);
    state.tourPageError = "Could not save this tour page.";
  } finally {
    state.tourPageSavingKey = null;
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

function normaliseHallOfFameRow(row = {}) {
  return {
    ...row,
    id: row.id,
    year: row.year ?? "",
    commentary: row.commentary || "",
  };
}

function sortedHallOfFameRows(rows = []) {
  return [...rows].sort((a, b) => {
    const yearA = Number(a.year);
    const yearB = Number(b.year);
    if (Number.isFinite(yearA) && Number.isFinite(yearB) && yearA !== yearB) return yearB - yearA;
    return String(a.commentary || "").localeCompare(String(b.commentary || ""));
  });
}

async function loadHallOfFame({ force = false } = {}) {
  if ((!force && state.hallOfFameLoaded) || state.hallOfFameLoading) return;

  state.hallOfFameLoading = true;
  state.hallOfFameError = "";
  render();

  try {
    const rows = await supabaseFetch("hall_of_fame?select=id,year,commentary&order=year.desc");
    state.hallOfFameRows = sortedHallOfFameRows((Array.isArray(rows) ? rows : []).map(normaliseHallOfFameRow));
    state.hallOfFameLoaded = true;
  } catch (error) {
    console.warn(error);
    state.hallOfFameError = "Could not load Hall of Fame.";
  } finally {
    state.hallOfFameLoading = false;
    render();
  }
}

function hallOfFamePayload(year, commentary) {
  const yearValue = String(year || "").trim();
  const parsedYear = Number(yearValue);
  return {
    year: yearValue && Number.isFinite(parsedYear) ? parsedYear : null,
    commentary: String(commentary || "").trim(),
  };
}

async function hallOfFameWrite({ method, id = "", body }) {
  const query = id ? `?id=${encodeURIComponent(id)}` : "";
  const response = await fetch(`/api/hall-of-fame${query}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if ([405, 501].includes(response.status) && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      const path = id ? `hall_of_fame?id=eq.${encodeURIComponent(id)}` : "hall_of_fame";
      return supabaseWrite(path, { method, body });
    }
    throw new Error(data?.error || `Hall of Fame write failed: ${response.status}`);
  }
  return data;
}

async function addHallOfFameRow() {
  const yearInput = document.querySelector("[data-hof-new-year]");
  const commentaryInput = document.querySelector("[data-hof-new-commentary]");
  const payload = hallOfFamePayload(yearInput?.value, commentaryInput?.value);

  if (!payload.year && !payload.commentary) return;

  state.hallOfFameSavingId = "new";
  state.hallOfFameError = "";
  render();

  try {
    const rows = await hallOfFameWrite({ method: "POST", body: payload });
    const created = rows?.[0];
    if (created) {
      state.hallOfFameRows = sortedHallOfFameRows([
        normaliseHallOfFameRow(created),
        ...state.hallOfFameRows,
      ]);
      state.hallOfFameEditingId = null;
      state.hallOfFameAdding = false;
    }
  } catch (error) {
    console.warn(error);
    state.hallOfFameError = error.message || "Could not add Hall of Fame row.";
  } finally {
    state.hallOfFameSavingId = null;
    render();
  }
}

function hallOfFameDraftForRow(row) {
  const key = String(row.id);
  return state.hallOfFameDrafts[key] || {
    year: row.year ?? "",
    commentary: row.commentary || "",
  };
}

async function saveHallOfFameRow(rowId) {
  const row = state.hallOfFameRows.find((item) => String(item.id) === String(rowId));
  if (!row || state.hallOfFameSavingId) return;

  const draft = hallOfFameDraftForRow(row);
  const payload = hallOfFamePayload(draft.year, draft.commentary);
  if (Number(row.year || 0) === Number(payload.year || 0) && String(row.commentary || "") === payload.commentary) return;

  state.hallOfFameSavingId = rowId;
  state.hallOfFameError = "";
  render();

  try {
    const rows = await hallOfFameWrite({
      method: "PATCH",
      id: rowId,
      body: payload,
    });
    const saved = normaliseHallOfFameRow(rows?.[0] || { ...row, ...payload });
    state.hallOfFameRows = sortedHallOfFameRows(
      state.hallOfFameRows.map((item) => String(item.id) === String(rowId) ? saved : item)
    );
    delete state.hallOfFameDrafts[String(rowId)];
    state.hallOfFameEditingId = null;
  } catch (error) {
    console.warn(error);
    state.hallOfFameError = error.message || "Could not save Hall of Fame row.";
  } finally {
    state.hallOfFameSavingId = null;
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
      players = playerRows.slice(0, 10).map((player) => {
        return {
          id: player.id,
          name: player.player_name,
          nick: "",
          handicap: "?",
          role: formatTourRole(null),
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
    if (state.detailTour && ["Overview", "Results", "Brochures"].includes(state.detailSubTab)) {
      const tour = tours.find((item) => item.id === state.detailTour);
      if (state.detailSubTab === "Overview") {
        loadTourPhotos(tour?.year);
        loadMatchReport(tour?.year);
      }
      if (state.detailSubTab === "Results" || tour?.status === "Completed") loadTourResults(tour?.year);
      if (state.detailSubTab === "Brochures") loadTourBrochures(tour?.year);
    }
    if (state.detailTour && ["Teams", "Profiles", "Roles"].includes(state.detailSubTab)) {
      const tour = tours.find((item) => item.id === state.detailTour);
      loadTourProfiles(tour?.supabaseId);
    }
    if (state.tab === "this-tour" && state.detailSubTab === "Results") {
      loadTourResults(tours[0]?.year);
    }
    if (state.tab === "this-tour" && state.detailSubTab === "Brochures") {
      loadTourBrochures(tours[0]?.year);
    }
    if (state.tab === "this-tour" && ["Teams", "Profiles", "Roles"].includes(state.detailSubTab)) {
      loadTourProfiles(tours[0]?.supabaseId);
    }
    if (state.tab === "this-tour" && state.detailSubTab === "Overview" && state.thisTourOverviewPanel === "random-nudger-generator") {
      loadTourProfiles(tours[0]?.supabaseId);
    }
    if (state.tab === "media") {
      loadMediaLibrary();
    }
    if (state.tab === "hall-of-fame") {
      loadHallOfFame();
    }
    if (
      state.tab === "this-tour" &&
      state.detailSubTab === "Overview" &&
      state.thisTourOverviewPanel &&
      !["scorecards", "random-nudger-generator"].includes(state.thisTourOverviewPanel)
    ) {
      loadTourPage(currentTourPageYear(), state.thisTourOverviewPanel, formatOverviewFeatureTitle(state.thisTourOverviewPanel));
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
  ["profiles", "Tourists", "people"],
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
  statsOverviewSortKey: "points",
  rivalsOverlayOpen: false,
  statsOverlayKey: "",
  statsOverlayIndex: 0,
  selectedRivals: [],
  selectedRivalPairs: [],
  activeRivalPairIndex: 0,
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
  touristProfileReturn: null,
  tourResultsByYear: {},
  tourResultsLoadingYear: null,
  tourResultsError: "",
  tourPhotosByYear: {},
  tourPhotosLoadingYear: null,
  tourPhotosError: "",
  matchReportsByYear: {},
  matchReportsLoadingYear: null,
  matchReportsError: "",
  matchReportOpenYear: null,
  tourBrochuresByYear: {},
  tourBrochuresLoadingYear: null,
  tourBrochuresError: "",
  tourProfilesByTourId: {},
  tourProfilesLoadingTourId: null,
  tourProfilesError: "",
  expandedTourProfiles: {},
  thisTourOverviewPanel: "",
  thisTourOverviewYear: null,
  tourPagesByKey: {},
  tourPageLoadingKey: null,
  tourPageSavingKey: null,
  tourPageSavedKey: null,
  tourPageError: "",
  tourPageEditingKey: null,
  tourPageDrafts: {},
  hallOfFameRows: [],
  hallOfFameLoading: false,
  hallOfFameLoaded: false,
  hallOfFameError: "",
  hallOfFameSavingId: null,
  hallOfFameEditingId: null,
  hallOfFameAdding: false,
  hallOfFameDrafts: {},
  randomNudgerDraw: {
    mode: "pairs",
    started: false,
    order: [],
    revealed: [],
    shuffling: false,
    slot: {
      spinning: false,
      currentPlayerId: null,
      selectedPlayerId: null,
    },
  },
  homeMenuOpen: false,
  birthdayOverlayDismissed: false,
  restoredScrollTop: 0,
  updateAvailable: false,
};

const app = document.querySelector("#app");
let waitingServiceWorker = null;
let refreshingForUpdate = false;
let serviceWorkerRegistration = null;
let lastAutoUpdateCheckAt = 0;
let randomNudgerSpinTimer = null;

function icon(name) {
  const icons = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    badge: '<rect x="5" y="4" width="14" height="16" rx="3"/><path d="M9 9h6M9 13l2 2 4-5"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    chart: '<path d="M5 19V9M12 19V5M19 19v-8"/>',
    pin: '<path d="M12 21s7-5.3 7-11a7 7 0 0 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 14.5-4 16 0"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.5 11.8-3.5 13 0"/><circle cx="17" cy="9" r="2.8"/><path d="M14.5 19c1.1-2.1 5.3-2.1 6.4 0"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    share: '<path d="M16 6h3v14H5V6h3"/><path d="M12 3v11M8 7l4-4 4 4"/>',
    more: '<circle cx="12" cy="12" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    trophy: '<path d="M8 5h8v4a4 4 0 0 1-8 0V5Z"/><path d="M8 7H5a3 3 0 0 0 3 4M16 7h3a3 3 0 0 1-3 4M12 13v5M9 21h6"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    ball: '<circle cx="12" cy="12" r="8"/><path d="M9 9h.01M13 8h.01M15 12h.01M10 14h.01"/>',
    flag: '<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>',
    plane: '<path d="m3 11 18-7-7 18-3-8-8-3Z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    suitcase: '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/><rect x="5" y="6" width="14" height="15" rx="2"/><path d="M9 6v15M15 6v15"/>',
    swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8"/><path d="M21 3v5h-5"/>',
    shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m7 17 4.2-4.2a1.5 1.5 0 0 1 2.1 0L18 17"/>',
    logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.home}</svg>`;
}

function Logo() {
  return `
    <img class="home-logo-image" src="/assets/images/homepage-logo.png" alt="The Cultured Nudgers" />
  `;
}

function UpdateAvailableBanner() {
  if (!state.updateAvailable) return "";
  return `
    <button class="update-banner" data-action="refresh-app-update" type="button">
      <span class="update-banner-icon">${icon("share")}</span>
      <span class="update-banner-copy">
        <strong>New version available</strong>
        <small>Tap to refresh and get the latest features.</small>
      </span>
      <span class="update-banner-cta">Refresh ${icon("refresh")}</span>
    </button>
  `;
}

const APP_UPDATE_NOTICE_EXPIRES_AT = new Date("2026-06-20T23:59:59+01:00");

function shouldShowAppUpdateNotice(now = new Date()) {
  return now <= APP_UPDATE_NOTICE_EXPIRES_AT;
}

function HomeAppUpdateNotice() {
  if (!shouldShowAppUpdateNotice()) return "";
  return `
    <section class="home-app-update" aria-label="App update">
      <div class="home-app-update-header">
        <span class="home-app-update-badge">📢</span>
        <div>
          <span>App Update</span>
          <h2>What's New</h2>
        </div>
      </div>
      <div class="home-app-update-list">
        <article>
          <strong>🏆 Hall of Fame</strong>
          <p>Record legendary moments that deserve a permanent place in Nudgers folklore. Find it under ☰ Menu on the Home tab.</p>
        </article>
        <article>
          <strong>🎲 Random Nudger Generator</strong>
          <p>Need to pick a Nudger for rooms or forfeits. Let fate decide. Found on the THIS TOUR tab.</p>
        </article>
      </div>
    </section>
  `;
}

function HomeRefreshButton() {
  return `<button class="home-refresh-btn" data-action="refresh-app-update" type="button" aria-label="Refresh app">${icon("refresh")}</button>`;
}

function HomeMenuButton() {
  return `
    <button class="home-menu-btn" data-action="toggle-home-menu" type="button" aria-label="Menu">${icon("menu")}</button>
    ${state.homeMenuOpen ? `
      <div class="home-menu">
        <button data-action="open-menu-page" data-tab="media" type="button">${icon("image")}<span>Media</span></button>
        <button data-action="open-menu-page" data-tab="hall-of-fame" type="button">${icon("trophy")}<span>Hall of Fame</span></button>
        <button data-action="logout" type="button">${icon("logout")}<span>Log Out</span></button>
      </div>
    ` : ""}
  `;
}

function birthdayMonthDay(value = "") {
  const match = String(value).match(/^\d{4}-(\d{2})-(\d{2})$/);
  return match ? `${match[1]}-${match[2]}` : "";
}

function todaysBirthdayPlayers() {
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return allPlayers.filter((player) =>
    player?.is_active !== false &&
    birthdayMonthDay(player.player_birthday) === today
  );
}

function formatBirthdayNames(birthdayPlayers) {
  const names = birthdayPlayers.map((player) => player.player_name).filter(Boolean);
  if (names.length <= 1) return names[0] || "Nudger";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function BirthdayHeadshot(birthdayPlayers) {
  const firstPlayer = birthdayPlayers[0];
  const headshot = headshotForPlayer(firstPlayer);
  const name = firstPlayer?.player_name || "Nudger";
  if (headshot) {
    return `<img src="${headshot}" alt="${escapeHtml(name)}" />`;
  }
  return `<span class="birthday-headshot-fallback">${escapeHtml(getInitials(name))}</span>`;
}

function BirthdayOverlay() {
  const birthdayPlayers = todaysBirthdayPlayers();
  if (!birthdayPlayers.length) return "";
  if (state.birthdayOverlayDismissed) return "";
  const birthdayNames = formatBirthdayNames(birthdayPlayers);
  return `
    <section class="birthday-overlay" data-birthday-overlay-root aria-label="Birthday message for ${escapeHtml(birthdayNames)}">
      <button class="birthday-close" data-action="dismiss-birthday-overlay" type="button" aria-label="Close birthday message">×</button>
      <div class="birthday-confetti" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="birthday-balloons" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div class="birthday-sparkles" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div class="birthday-copy">
        <span class="eyebrow">Tour Announcement</span>
        <div class="birthday-headshot">
          ${BirthdayHeadshot(birthdayPlayers)}
        </div>
        <h2>Happy Birthday, ${escapeHtml(birthdayNames)}!</h2>
        <button class="birthday-cheers" data-action="dismiss-birthday-overlay" type="button">
          Cheers now
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </section>
  `;
}

function syncBirthdayOverlay() {
  const existing = document.querySelector("[data-birthday-overlay-root]");
  const shouldShow =
    state.tab === "home" &&
    !state.detailTour &&
    !state.birthdayOverlayDismissed &&
    todaysBirthdayPlayers().length > 0 &&
    hasLoadedSupabase &&
    !window.matchMedia("(min-width: 769px)").matches;

  if (shouldShow && !existing) {
    document.body.insertAdjacentHTML("beforeend", BirthdayOverlay());
  }
  if (!shouldShow && existing) existing.remove();
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
  const rightControl = detail && detail !== "locked" ? `<button class="icon-btn" aria-label="Share">${icon("share")}</button>` : `<span class="icon-spacer" aria-hidden="true"></span>`;

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
        <h2>${escapeHtml(stripTourFlags(tour.title))}</h2>
        <p>${tour.dates}</p>
      </div>
    </section>
  `;
}

function PageHero(title, subtitle = "", image = "") {
  const background = image ? ` style="background-image: linear-gradient(180deg, rgba(2,10,7,.05), rgba(2,10,7,.88)), url('${image}')"` : "";

  return `
    <section class="page-hero"${background}>
      <div>
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
    </section>
  `;
}

function pageHeroImage(offset = 0) {
  return tours[offset]?.image || tours[0]?.image || "/assets/images/tours/2026-aberdovey.webp";
}

function yearFromTour(tour) {
  return tour?.year || String(tour?.title || tour?.shortTitle || "").match(/\b(20\d{2})\b/)?.[1] || "";
}

function tourDetailHeroTitle(tour) {
  const year = yearFromTour(tour);
  return [tourDisplayName(tour), year].filter(Boolean).join(" ");
}

function compactDateRange(dateRange = "") {
  return String(dateRange)
    .replace(/\s+-\s+/g, "-")
    .replace(/,\s*\d{4}\b$/, "");
}

function tourCourseCount(tour) {
  const year = yearFromTour(tour);
  const coursesForTour = allCourses.filter((course) => Number(course.year) === Number(year));
  return new Set(coursesForTour.map((course) => course.course_name || course.id).filter(Boolean)).size || coursesForTour.length || currentTourCourses.length || 0;
}

function tourPlayerCount(tour) {
  const rows =
    state.tourProfilesByTourId[tour.supabaseId] ||
    state.touristProfileRows.filter((row) => Number(row.tour_id) === Number(tour.supabaseId));
  return new Set(
    rows
      .filter((row) => row.on_tour === true || row.on_tour === "true")
      .map((row) => row.player_id)
      .filter(Boolean)
  ).size;
}

function DetailHeroMeta(tour) {
  const playerCount = tourPlayerCount(tour);
  const courseCount = tourCourseCount(tour);
  return `
    <div class="detail-hero-meta">
      <span>${icon("user")}<b>${playerCount}</b> ${playerCount === 1 ? "Player" : "Players"}</span>
      <i></i>
      <span>${icon("flag")}<b>${courseCount}</b> ${courseCount === 1 ? "Course" : "Courses"}</span>
      <i></i>
      <span>${icon("calendar")}${escapeHtml(compactDateRange(tour.dates))}</span>
    </div>
  `;
}

function BillSplitterScorecard(crocombePoints = 0, fosterPoints = 0, { showAllTimeRecord = false } = {}) {
  return `
    <section class="tour-wins-card ${showAllTimeRecord ? "all-time-record" : ""}">
      ${showAllTimeRecord ? `<div class="all-time-record-ribbon"><span>★</span> All Time Record <span>★</span></div>` : ""}
      <div class="tour-wins-clip">
        <div class="tour-wins-score">
          <div class="tour-wins-team crocs">
            <strong>Team Crocombe</strong>
            <b>${formatTeamPoints(crocombePoints)}</b>
          </div>
          <div class="tour-wins-trophy" aria-label="Bill Splitter Trophy">
            <img src="/assets/images/trophies/bill-splitter-trophy-lite.png?v=169" alt="" aria-hidden="true" />
          </div>
          <div class="tour-wins-team foz">
            <strong>Team Foster</strong>
            <b>${formatTeamPoints(fosterPoints)}</b>
          </div>
        </div>
      </div>
    </section>
  `;
}

function TourCard(tour) {
  return `
    <button class="tour-card" data-action="tour-detail" data-tour="${tour.id}" style="background-image: linear-gradient(90deg, rgba(2,14,9,.68), rgba(2,14,9,.1)), url('${tour.image}')">
      <span class="tour-card-title">${escapeHtml(stripTourFlags(tour.title))}</span>
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

function ActionTile(label, iconName, view) {
  return `<button class="action-tile" data-action="overview-panel" data-view="${view}">${icon(iconName)}<span>${label}</span></button>`;
}

function HandicapGraph(history = []) {
  const rows = history
    .map((row) => ({
      ...row,
      handicap: Number(row.handicap),
      year: Number(row.year),
    }))
    .filter((row) => Number.isFinite(row.handicap) && Number.isFinite(row.year))
    .sort((a, b) => a.year - b.year);

  if (!rows.length) {
    return `<p class="handicap-empty">No handicap history yet.</p>`;
  }

  const width = 320;
  const height = 104;
  const padX = 16;
  const padY = 16;
  const values = rows.map((row) => row.handicap);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const ticks = max === min ? [max] : [max, (max + min) / 2, min];
  const tickLabels = ticks.map((tick) => {
    const rounded = Math.round(tick * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/\.0$/, "");
  });
  const points = rows.map((row, index) => {
    const x = rows.length === 1 ? width / 2 : padX + (index / (rows.length - 1)) * (width - padX * 2);
    const y = padY + ((max - row.handicap) / range) * (height - padY * 2);
    return { ...row, x, y };
  });
  const polyline = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const latest = rows[rows.length - 1];

  return `
    <div class="handicap-chart">
      <div class="handicap-chart-meta">
        <span>Latest</span>
        <strong>${escapeHtml(formatHandicap(latest.handicap))}</strong>
      </div>
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Handicap history">
        <line x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" />
        <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" />
        ${ticks.map((tick, index) => {
          const y = padY + ((max - tick) / range) * (height - padY * 2);
          return `<text class="handicap-y-label" x="${padX - 7}" y="${(y + 3).toFixed(1)}" text-anchor="end">${escapeHtml(tickLabels[index])}</text>`;
        }).join("")}
        <polyline points="${polyline}" />
        ${points.map((point) => `
          <g>
            <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.2" />
            <text x="${point.x.toFixed(1)}" y="${height - 3}" text-anchor="middle">${escapeHtml(`'${String(point.year).slice(-2)}`)}</text>
          </g>
        `).join("")}
      </svg>
    </div>
  `;
}

function PlayerCard(player) {
  const nickname = String(player.nick || "").trim();
  const role = String(player.role || "").trim();
  return `
    <article class="player-card">
      <div class="player-identity">
        <div class="player-photo-wrap ${player.isActive === false ? "inactive" : ""}">
          ${Avatar({ player_name: player.name }, "large")}
          ${player.isActive === false ? `<em>Inactive</em>` : ""}
        </div>
        <h2>${escapeHtml(player.name)}</h2>
        ${nickname ? `<p>"${escapeHtml(nickname)}"</p>` : ""}
        ${role ? `<span class="role-pill">${icon("ball")}${escapeHtml(role)}</span>` : ""}
      </div>
      <div class="handicap">
        <span>Handicap</span>
        <strong>${escapeHtml(String(player.handicap))}</strong>
      </div>
      <div class="player-stats">
        <span><span class="player-stat-value">${icon("flag")}<b>${player.tours}</b></span><small>${Number(player.tours) === 1 ? "Tour" : "Tours"}</small></span>
        <span><span class="player-stat-value">${icon("star")}<b>${player.tourWins}</b></span><small>${Number(player.tourWins) === 1 ? "Tour Win" : "Tour Wins"}</small></span>
        <span><span class="player-stat-value">${icon("ball")}<b>${player.individualWins}</b></span><small>Total Points</small></span>
      </div>
      <div class="profile-detail-stats">
        <span><span class="player-stat-value">${icon("flag")}<b>${escapeHtml(String(player.debutTour || "N/A"))}</b></span><small>Debut Tour</small></span>
        <span><span class="player-stat-value">${icon("chart")}<b>${escapeHtml(String(player.winPercent || "N/A"))}</b></span><small>Win %</small></span>
      </div>
      <div class="profile-panel handicap-history-panel">
        <h3>${icon("flag")}Handicap</h3>
        ${HandicapGraph(player.handicapHistory)}
      </div>
    </article>
  `;
}

function Home() {
  if (!hasLoadedSupabase) {
    return `
      ${Header()}
      <section class="home-logo">${HomeMenuButton()}${HomeRefreshButton()}${Logo()}<p>Welcome back, Nudger 👋</p></section>
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
  const previous = latestCompletedTour();
  const daysSincePrevious = daysBetweenDates(previous?.endDate);
  const daysUntilNext = daysUntilDate(next.startDate);
  const samFoster = allPlayers.find((player) => player.player_name === "Sam Foster");
  const nextDateLabel = next.startDate && next.endDate
    ? `${new Date(`${next.startDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric" })} - ${new Date(`${next.endDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : next.dates;
  return `
    ${Header()}
    <section class="home-logo">
      ${HomeMenuButton()}
      ${HomeRefreshButton()}
      ${Logo()}
      <p>Welcome back, Nudger 👋</p>
      <div class="home-tour-clock">
        ${daysSincePrevious !== null && previous ? `<span>${daysSincePrevious} days since ${escapeHtml(tourDisplayName(previous))}</span>` : ""}
        ${daysUntilNext !== null ? `<b>${daysUntilNext} days until ${escapeHtml(tourDisplayName(next))}</b>` : ""}
      </div>
    </section>
    ${HomeAppUpdateNotice()}
    <section class="next-tour" style="background-image: linear-gradient(180deg, rgba(255,255,255,.05), rgba(3,19,13,.54)), url('${next.image}')">
      <span>Next Tour</span>
      <h2>${escapeHtml(stripTourFlags(next.title))}</h2>
      <div class="countdown" data-countdown>
        <b data-countdown-days>--</b><i>:</i><b data-countdown-hours>--</b><i>:</i><b data-countdown-minutes>--</b><i>:</i><b data-countdown-seconds>--</b>
      </div>
      <div class="count-labels"><span>Days</span><span>Hrs</span><span>Mins</span><span>Secs</span></div>
      <div class="next-tour-footer">
        <div class="next-tour-meta">
          <span>${icon("pin")}${escapeHtml(next.location)}</span>
          <span>${icon("calendar")}${escapeHtml(nextDateLabel)}</span>
        </div>
        <button class="next-tour-cta" data-action="home-view-tour">View Tour ${icon("chevron")}</button>
      </div>
    </section>
    <section class="defending-card ${state.defendingChampions?.side || "neutral"}">
      <div>
        <span>Defending Champions</span>
        <strong>${escapeHtml(state.defendingChampions?.team || "Loading...")}</strong>
        <small>${escapeHtml(state.defendingChampions?.tour || "")}${state.defendingChampions?.score ? ` · ${escapeHtml(state.defendingChampions.score)}` : ""}</small>
      </div>
      <div class="defending-player">
        ${Avatar(samFoster, "defending-avatar")}
      </div>
    </section>
    ${BillSplitterScorecard(state.teamTourWins?.crocombe || 0, state.teamTourWins?.foster || 0, { showAllTimeRecord: true })}
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
  return `${PageHero("Tours")}<div class="page-body"><div class="tour-list">${tours.map(TourCard).join("")}</div></div>`;
}

function photoUrl(filePath = "", bucketName = SUPABASE_PHOTOS_BUCKET) {
  const path = String(filePath || "").trim();
  const bucket = String(bucketName || SUPABASE_PHOTOS_BUCKET).trim();
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${SUPABASE_STORAGE_URL}/${encodeURIComponent(bucket).replace(/%2F/g, "/")}/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
}

function TourPhotos(tour) {
  const photos = state.tourPhotosByYear[tour.year] || [];

  if (state.tourPhotosLoadingYear === tour.year) {
    return Card(`<p class="empty-state">Loading tour photos...</p>`);
  }

  if (state.tourPhotosError) {
    return Card(`<p class="empty-state">${escapeHtml(state.tourPhotosError)}</p>`);
  }

  if (!photos.length) {
    return Card(`<p class="empty-state">No tour photos found for this tour.</p>`);
  }

  return `
    <div class="highlight-grid tour-photo-grid">
      ${photos.map((photo) => {
        const src = photoUrl(photo.file_path, photo.bucket_name);
        const caption = photo.caption || (photo.is_group_photo ? "Group Photo" : "Tour Photo");
        return `
          <figure>
            <div class="tour-photo-frame">
              <img src="${src}" alt="${escapeHtml(caption)}" loading="lazy" />
            </div>
            ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}
          </figure>
        `;
      }).join("")}
    </div>
  `;
}

function TourBrochures(tour) {
  const brochures = state.tourBrochuresByYear[tour.year] || [];

  if (state.tourBrochuresLoadingYear === tour.year) {
    return Card(`<p class="empty-state">Loading brochures...</p>`);
  }

  if (state.tourBrochuresError) {
    return Card(`<p class="empty-state">${escapeHtml(state.tourBrochuresError)}</p>`);
  }

  if (!brochures.length) {
    return Card(`<p class="empty-state">No brochures found for this tour.</p>`);
  }

  return `
    <div class="brochure-list">
      ${brochures.map((brochure) => {
        const href = photoUrl(brochure.file_path, brochure.bucket_name);
        const title = brochure.caption || brochure.file_path || "Tour Brochure";
        return `
          <a class="brochure-card" href="${href}" target="_blank" rel="noopener">
            <span>${escapeHtml(title)}</span>
            <b>Open</b>
          </a>
        `;
      }).join("")}
    </div>
  `;
}

function mediaTours() {
  return tours
    .filter((tour) => tour.status === "Completed" && tour.year)
    .sort((a, b) => Number(b.year) - Number(a.year));
}

function loadMediaLibrary() {
  mediaTours().forEach((tour) => {
    loadTourPhotos(tour.year);
    loadTourBrochures(tour.year);
  });
}

const tourFilmEmbedsByYear = {
  2016: {
    src: "https://player.vimeo.com/video/157360184?badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Portugal 2016",
  },
  2017: {
    src: "https://player.vimeo.com/video/207798826?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Portugal 2017",
  },
  2018: {
    src: "https://player.vimeo.com/video/260470790?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Portugal 2018 Film",
  },
  2019: {
    src: "https://player.vimeo.com/video/322430601?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Portugal 2019 Film",
  },
  2021: {
    src: "https://player.vimeo.com/video/1108806725?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Nudgers 2021 - 2023 raw footage",
  },
  2022: {
    src: "https://player.vimeo.com/video/1108806725?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Nudgers 2021 - 2023 raw footage",
  },
  2023: {
    src: "https://player.vimeo.com/video/1108806725?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Nudgers 2021 - 2023 raw footage",
  },
  2024: {
    src: "https://player.vimeo.com/video/1109696115?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Nudgers 2024 Highlights - Le Touquet",
  },
};

function TourFilm(tour) {
  const year = Number(tour.year);
  const film = tourFilmEmbedsByYear[year];
  if (!film) return "";
  const sharedFilmNote = [2021, 2022, 2023].includes(year)
    ? `<p class="tour-film-note">The following video is a summary of tours between 2021-2023</p>`
    : "";

  return `
    <h3 class="section-title">Tour Films</h3>
    ${sharedFilmNote}
    <div class="tour-film-frame">
      <iframe
        src="${escapeHtml(film.src)}"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        title="${escapeHtml(film.title)}"
      ></iframe>
    </div>
  `;
}

function MediaPhotos(tour) {
  if (state.tourPhotosLoadingYear === tour.year) {
    return Card(`<p class="empty-state">Loading photos...</p>`);
  }

  if (state.tourPhotosError) {
    return Card(`<p class="empty-state">${escapeHtml(state.tourPhotosError)}</p>`);
  }

  const photos = state.tourPhotosByYear[tour.year] || [];
  if (!photos.length) return "";

  return `
    <h3 class="section-title">Photos</h3>
    ${TourPhotos(tour)}
  `;
}

function MediaBrochures(tour) {
  if (state.tourBrochuresLoadingYear === tour.year) {
    return Card(`<p class="empty-state">Loading brochures...</p>`);
  }

  if (state.tourBrochuresError) {
    return Card(`<p class="empty-state">${escapeHtml(state.tourBrochuresError)}</p>`);
  }

  const brochures = state.tourBrochuresByYear[tour.year] || [];
  if (!brochures.length) return "";

  return `
    <h3 class="section-title">Brochures</h3>
    ${TourBrochures(tour)}
  `;
}

function MediaTourSection(tour) {
  const film = TourFilm(tour);
  const photos = MediaPhotos(tour);
  const brochures = MediaBrochures(tour);
  const hasLoadedMedia =
    Object.prototype.hasOwnProperty.call(state.tourPhotosByYear, tour.year) &&
    Object.prototype.hasOwnProperty.call(state.tourBrochuresByYear, tour.year);
  const body = [film, photos, brochures].filter(Boolean).join("");

  if (!body && hasLoadedMedia) return "";

  return `
    <section class="media-tour-section">
      <h2>${escapeHtml(tourDetailHeroTitle(tour))}</h2>
      ${body || Card(`<p class="empty-state">Loading media...</p>`)}
    </section>
  `;
}

function Media() {
  const sections = mediaTours().map(MediaTourSection).filter(Boolean);
  return `
    ${PageHero("Media")}
    <div class="page-body media-library">
      ${sections.length ? sections.join("") : Card(`<p class="empty-state">Loading media...</p>`)}
    </div>
  `;
}

function HallOfFame() {
  const rows = state.hallOfFameRows || [];
  return `
    <section class="page-hero hall-of-fame-hero">
      <div>
        <h1>Hall of Fame</h1>
      </div>
      <button class="hof-top-add-btn" data-action="show-hall-of-fame-add" type="button">+ Add</button>
    </section>
    <div class="page-body hall-of-fame-page">
      ${state.hallOfFameError ? Card(`<p class="empty-state">${escapeHtml(state.hallOfFameError)}</p>`) : ""}
      ${state.hallOfFameAdding ? Card(`
        <div class="hof-add-row">
                <label>
                  <span>Year</span>
                  <input data-hof-new-year type="number" inputmode="numeric" placeholder="2026" />
                </label>
                <label>
                  <span>Commentary</span>
                  <textarea data-hof-new-commentary rows="3" placeholder="Add Hall of Fame commentary..."></textarea>
                </label>
                <div class="hof-row-actions">
                  <button class="hof-cancel-btn" data-action="cancel-hall-of-fame-add" type="button">Cancel</button>
                  <button class="hof-add-btn" data-action="add-hall-of-fame-row" type="button" ${state.hallOfFameSavingId === "new" ? "disabled" : ""}>
                    ${state.hallOfFameSavingId === "new" ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
      `, "hof-add-card") : ""}
      ${state.hallOfFameLoading ? Card(`<p class="empty-state">Loading Hall of Fame...</p>`) : ""}
      ${!state.hallOfFameLoading && rows.length ? `
        <p class="hof-intro">Memorable moments, quotes and stories from Cultured Nudgers tours over the years.</p>
        <div class="hof-table" role="table" aria-label="Hall of Fame entries">
          <div class="hof-table-head" role="row">
            <span role="columnheader">Year</span>
            <span role="columnheader">Commentary</span>
            <span role="columnheader">Edit</span>
          </div>
          ${rows.map(HallOfFameRow).join("")}
        </div>
      ` : ""}
      ${!state.hallOfFameLoading && state.hallOfFameLoaded && !rows.length ? Card(`<p class="empty-state">No Hall of Fame rows yet.</p>`) : ""}
    </div>
  `;
}

function formatHallOfFameYear(year) {
  const numericYear = Number(year);
  if (!Number.isFinite(numericYear)) return "TBC";
  return `'${String(Math.trunc(numericYear)).slice(-2)}`;
}

function HallOfFameRow(row) {
  const draft = hallOfFameDraftForRow(row);
  const isSaving = String(state.hallOfFameSavingId) === String(row.id);
  const isEditing = String(state.hallOfFameEditingId) === String(row.id);
  if (!isEditing) {
    return `
      <div class="hof-row hof-row-read ${isSaving ? "saving" : ""}" role="row" data-hof-row-id="${row.id}">
        <span class="hof-year-cell" role="cell">${escapeHtml(formatHallOfFameYear(row.year))}</span>
        <p class="hof-commentary-cell" role="cell">${escapeHtml(row.commentary || "")}</p>
        <button class="hof-edit-btn" data-action="edit-hall-of-fame-row" data-row-id="${row.id}" type="button" ${isSaving ? "disabled" : ""}>
          ${isSaving ? "Saving..." : "Edit"}
        </button>
      </div>
    `;
  }

  return `
    <div class="hof-row hof-row-edit ${isSaving ? "saving" : ""}" role="row" data-hof-row-id="${row.id}">
      <label role="cell">
        <span>Year</span>
        <input
          data-hof-field="year"
          data-row-id="${row.id}"
          type="number"
          inputmode="numeric"
          value="${escapeHtml(draft.year)}"
          ${isSaving ? "disabled" : ""}
        />
      </label>
      <label role="cell">
        <span>Commentary</span>
        <textarea
          data-hof-field="commentary"
          data-row-id="${row.id}"
          rows="3"
          ${isSaving ? "disabled" : ""}
        >${escapeHtml(draft.commentary)}</textarea>
      </label>
      <div class="hof-row-actions">
        <small>${isSaving ? "Saving..." : "Autosaves on exit"}</small>
        <button class="hof-save-btn" data-action="save-hall-of-fame-row" data-row-id="${row.id}" type="button" ${isSaving ? "disabled" : ""}>
          ${isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  `;
}

function getMatchReportText(report) {
  return String(report?.match_report || report?.report || report?.body || "").trim();
}

function MatchReportInline(text = "") {
  return String(text)
    .split(/(\*[^*\n]+\*)/g)
    .map((part) => {
      if (/^\*[^*\n]+\*$/.test(part)) return `<strong>${escapeHtml(part.slice(1, -1))}</strong>`;
      return escapeHtml(part);
    })
    .join("");
}

function MatchReportParagraphs(text) {
  const blocks = [];
  let paragraphLines = [];
  const flushParagraph = () => {
    const paragraph = paragraphLines.join(" ").trim();
    if (paragraph) blocks.push({ type: "paragraph", text: paragraph });
    paragraphLines = [];
  };

  String(text).split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "subheading", text: trimmed.replace(/^##\s+/, "").trim() });
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      blocks.push({ type: "heading", text: trimmed.replace(/^#\s+/, "").trim() });
      return;
    }
    paragraphLines.push(trimmed);
  });
  flushParagraph();

  return blocks.map((block) => {
    if (block.type === "heading") return `<h2>${MatchReportInline(block.text)}</h2>`;
    if (block.type === "subheading") return `<h3>${MatchReportInline(block.text)}</h3>`;
    return `<p>${MatchReportInline(block.text)}</p>`;
  }).join("");
}

function MatchReportTeaser(tour) {
  const report = state.matchReportsByYear[tour.year];
  const text = getMatchReportText(report);

  if (state.matchReportsLoadingYear === tour.year) {
    return Card(`<p class="empty-state">Loading match report...</p>`, "match-report-card");
  }

  if (state.matchReportsError && report === undefined) {
    return Card(`<p class="empty-state">${escapeHtml(state.matchReportsError)}</p>`, "match-report-card");
  }

  if (!text) return "";

  return `
    <h3 class="section-title">Tour Report</h3>
    <section class="match-report-card">
      <span class="match-report-quote" aria-hidden="true">“</span>
      <p class="match-report-preview">${escapeHtml(text)}</p>
      <button class="match-report-read-more" data-action="read-match-report" data-year="${tour.year}">
        Read full report
        <span aria-hidden="true">→</span>
      </button>
    </section>
  `;
}

function MatchReportPage(tour) {
  const report = state.matchReportsByYear[tour.year];
  const text = getMatchReportText(report);

  return `
    <section class="overview-feature-screen match-report-screen">
      <div class="overview-feature-topbar">
        <button class="overview-feature-back" data-action="back-match-report" aria-label="Back to tour">${icon("back")}</button>
      </div>
      <span class="eyebrow">${tour.year}</span>
      <h1>Match Report</h1>
      <article class="match-report-full">
        ${text ? MatchReportParagraphs(text) : `<p>No match report found for this tour.</p>`}
      </article>
    </section>
  `;
}

function TourOverview(tour) {
  const resultRows = state.tourResultsByYear[tour.year] || [];
  const totals = teamPointsForRows(resultRows);
  const showScorecard = tour.status === "Completed" && resultRows.length;

  return `
    ${showScorecard ? BillSplitterScorecard(totals.crocs, totals.foz) : ""}
    ${MatchReportTeaser(tour)}
    ${TourFilm(tour)}
    <h3 class="section-title">Tour Photos</h3>
    ${TourPhotos(tour)}
  `;
}

const aberdoveyScorecardRows = [
  ["1", "441", "441", "420", "4", "10"],
  ["2", "332", "332", "310", "4", "8"],
  ["3", "173", "173", "157", "3", "17"],
  ["4", "401", "401", "374", "4", "3"],
  ["5", "202", "202", "193", "3", "13"],
  ["6", "431", "402", "331", "4", "6"],
  ["7", "518", "482", "470", "5", "2"],
  ["8", "335", "335", "310", "4", "15"],
  ["9", "160", "160", "156", "3", "12"],
  ["OUT", "2993", "2928", "2721", "34", ""],
  ["10", "440", "415", "408", "4", "5"],
  ["11", "407", "407", "370", "4", "9"],
  ["12", "149", "149", "131", "3", "18"],
  ["13", "557", "530", "509", "5", "1"],
  ["14", "401", "389", "383", "4", "11"],
  ["15", "509", "509", "477", "5", "7"],
  ["16", "288", "288", "281", "4", "16"],
  ["17", "428", "428", "405", "4", "4"],
  ["18", "443", "443", "419", "4", "14"],
  ["IN", "3622", "3558", "3383", "37", ""],
  ["TOTAL", "6615", "6486", "6104", "71", ""],
];

function AberdoveyScorecard() {
  const headers = ["Hole", "Darwin", "Medal", "Mens", "Par", "SI"];
  const formatScorecardCell = (cell) => (/^\d{4,}$/.test(cell) ? Number(cell).toLocaleString("en-GB") : cell);
  return Card(`
    <div class="scorecard-header">
      <span class="eyebrow">Scorecards</span>
      <h3>Aberdovey Golf Course</h3>
    </div>
    <div class="scorecard-table-wrap">
      <table class="scorecard-table">
        <thead>
          <tr>
            ${headers.map((header, index) => `<th class="${index === 1 ? "darwin" : index === 2 ? "medal-white" : index === 3 ? "mens-yellow" : ""}">${header}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${aberdoveyScorecardRows.map((row) => {
            const totalRow = ["OUT", "IN", "TOTAL"].includes(row[0]);
            return `
              <tr class="${totalRow ? "total-row" : ""}">
                ${row.map((cell, index) => `<td class="${index === 1 ? "darwin" : index === 2 ? "medal-white" : index === 3 ? "mens-yellow" : ""}">${escapeHtml(formatScorecardCell(cell))}</td>`).join("")}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `, "scorecard-card");
}

const thisTourOverviewActions = [
  ["Itinerary", "calendar", "itinerary"],
  ["Packing List", "suitcase", "packing-list"],
  ["Travel Info", "plane", "travel-info"],
  ["Tee Times", "flag", "tee-times"],
  ["Scorecards", "badge", "scorecards"],
  ["Random Nudger Generator", "shuffle", "random-nudger-generator"],
];

function formatOverviewFeatureTitle(view) {
  return thisTourOverviewActions.find(([, , actionView]) => actionView === view)?.[0] || "This Tour";
}

function currentTourPageYear() {
  return Number(state.thisTourOverviewYear || tours[0]?.year);
}

function firstNameForPlayer(player = {}) {
  return String(player.player_name || "Nudger").trim().split(/\s+/)[0] || "Nudger";
}

function firstNameFromName(name = "") {
  return String(name || "Nudger").trim().split(/\s+/)[0] || "Nudger";
}

function currentTourNudgers() {
  const tour = tours[0];
  const rows = state.tourProfilesByTourId[tour?.supabaseId] || [];
  const onTourIds = new Set(
    rows
      .filter((row) => row.on_tour === true || row.on_tour === "true")
      .map((row) => Number(row.player_id))
      .filter(Boolean)
  );

  return allPlayers
    .filter((player) => onTourIds.has(Number(player.id)))
    .sort((a, b) => a.player_name.localeCompare(b.player_name));
}

function shuffledIds(playersList = []) {
  const ids = playersList.map((player) => Number(player.id));
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
  }
  return ids;
}

function emptyRandomNudgerDraw(mode = state.randomNudgerDraw?.mode || "pairs") {
  return {
    mode,
    started: false,
    order: [],
    revealed: [],
    shuffling: false,
    slot: {
      spinning: false,
      currentPlayerId: null,
      selectedPlayerId: null,
    },
  };
}

function resetRandomNudgerDraw(playersList = currentTourNudgers()) {
  state.randomNudgerDraw = {
    ...emptyRandomNudgerDraw("pairs"),
    started: true,
    order: shuffledIds(playersList),
    revealed: [],
    shuffling: true,
  };
}

function RandomNudgerCard(player, index) {
  const draw = state.randomNudgerDraw;
  const started = draw.started;
  const revealed = !started || draw.revealed.includes(Number(player.id));
  const orderIndex = started ? draw.order.indexOf(Number(player.id)) : index;
  const headshot = headshotForPlayer(player);
  const firstName = firstNameForPlayer(player);

  return `
    <button
      class="random-nudger-card ${revealed ? "revealed" : "covered"} ${draw.shuffling && started ? "shuffling" : ""}"
      data-action="reveal-random-nudger"
      data-player-id="${player.id}"
      style="order: ${orderIndex < 0 ? index : orderIndex}; --shuffle-index: ${index % 7};"
      ${revealed ? "disabled" : ""}
      aria-label="${revealed ? escapeHtml(firstName) : "Reveal Nudger"}"
    >
      <span class="random-nudger-inner">
        <span class="random-nudger-face">
          <span class="random-nudger-photo">
            ${headshot ? `<img src="${headshot}" alt="${escapeHtml(player.player_name)}" />` : `<b>${escapeHtml(getInitials(player.player_name))}</b>`}
          </span>
          <strong>${escapeHtml(firstName)}</strong>
        </span>
        <span class="random-nudger-back">
          <span><img src="/assets/icons/app-logo.png" alt="" aria-hidden="true" /></span>
        </span>
      </span>
    </button>
  `;
}

function RandomNudgerModeTabs(mode) {
  return `
    <div class="random-nudger-tabs" role="tablist" aria-label="Random Nudger mode">
      ${[
        ["pairs", "Pairs"],
        ["individual", "Individual"],
      ].map(([id, label]) => `
        <button
          class="${mode === id ? "active" : ""}"
          data-action="set-random-nudger-mode"
          data-mode="${id}"
          role="tab"
          aria-selected="${mode === id ? "true" : "false"}"
        >${label}</button>
      `).join("")}
    </div>
  `;
}

function RandomNudgerPairs(playersList) {
  const draw = state.randomNudgerDraw;
  return `
    <div class="random-nudger-controls">
      <button class="random-nudger-start" data-action="start-random-nudger-draw">
        ${draw.started ? "Shuffle Again" : "Start"}
      </button>
      ${draw.started ? `<button class="random-nudger-reset" data-action="reset-random-nudger-draw">Reset</button>` : ""}
    </div>
    <div class="random-nudger-grid" aria-live="polite">
      ${playersList.map(RandomNudgerCard).join("")}
    </div>
  `;
}

function RandomNudgerSlotFace(player) {
  if (!player) {
    return `
      <div class="random-slot-placeholder">
        ${icon("shuffle")}
      </div>
    `;
  }

  const headshot = headshotForPlayer(player);
  return `
    <div class="random-slot-face">
      <span class="random-slot-photo">
        ${headshot ? `<img src="${headshot}" alt="${escapeHtml(player.player_name)}" />` : `<b>${escapeHtml(getInitials(player.player_name))}</b>`}
      </span>
      <strong>${escapeHtml(firstNameForPlayer(player))}</strong>
    </div>
  `;
}

function RandomNudgerIndividual(playersList) {
  const slot = state.randomNudgerDraw.slot || {};
  const shownPlayer =
    getPlayerById(slot.currentPlayerId) ||
    getPlayerById(slot.selectedPlayerId) ||
    playersList[0];

  return `
    <div class="random-slot-stage ${slot.spinning ? "spinning" : ""} ${slot.selectedPlayerId ? "settled" : ""}">
      <div class="random-slot-window" aria-live="polite">
        ${RandomNudgerSlotFace(shownPlayer)}
      </div>
      <button class="random-nudger-start random-slot-start" data-action="choose-random-nudger" ${slot.spinning ? "disabled" : ""}>
        ${slot.spinning ? "Choosing..." : "Choose Nudger"}
      </button>
    </div>
  `;
}

function RandomNudgerGenerator() {
  const tour = tours[0];
  const playersList = currentTourNudgers();
  const draw = state.randomNudgerDraw;
  const mode = draw.mode || "pairs";
  preloadImages(playersList.map(headshotForPlayer));

  if (state.tourProfilesLoadingTourId === tour?.supabaseId) {
    return Card(`<p class="empty-state">Loading Nudgers...</p>`);
  }

  if (state.tourProfilesError) {
    return Card(`<p class="empty-state">${escapeHtml(state.tourProfilesError)}</p>`);
  }

  if (!playersList.length) {
    return Card(`<p class="empty-state">No Nudgers found for this tour.</p>`);
  }

  return `
    <div class="random-nudger-stage ${draw.started ? "is-started" : "is-ready"}">
      ${RandomNudgerModeTabs(mode)}
      ${mode === "individual" ? RandomNudgerIndividual(playersList) : RandomNudgerPairs(playersList)}
    </div>
  `;
}

function updateRandomSlotFace(playerId) {
  const player = getPlayerById(playerId);
  const face = document.querySelector(".random-slot-face");
  if (!player || !face) return;

  const photo = face.querySelector(".random-slot-photo");
  const name = face.querySelector("strong");
  const headshot = headshotForPlayer(player);
  if (photo) {
    photo.innerHTML = headshot
      ? `<img src="${headshot}" alt="${escapeHtml(player.player_name)}" />`
      : `<b>${escapeHtml(getInitials(player.player_name))}</b>`;
  }
  if (name) name.textContent = firstNameForPlayer(player).toUpperCase();
}

function startRandomNudgerSlot(playersList = currentTourNudgers()) {
  if (!playersList.length) return;
  if (randomNudgerSpinTimer) window.clearTimeout(randomNudgerSpinTimer);

  preloadImages(playersList.map(headshotForPlayer));
  const order = shuffledIds(playersList);
  const totalSteps = Math.max(34, playersList.length * 2 + 10);
  let step = 0;

  state.randomNudgerDraw = {
    ...emptyRandomNudgerDraw("individual"),
    slot: {
      spinning: true,
      currentPlayerId: order[0],
      selectedPlayerId: null,
    },
  };
  render();
  persistRoute();

  const tick = () => {
    const progress = step / totalSteps;
    const playerId = order[step % order.length];
    state.randomNudgerDraw.slot.currentPlayerId = playerId;
    updateRandomSlotFace(playerId);

    if (step >= totalSteps) {
      state.randomNudgerDraw.slot = {
        spinning: false,
        currentPlayerId: playerId,
        selectedPlayerId: playerId,
      };
      randomNudgerSpinTimer = null;
      const slotStage = document.querySelector(".random-slot-stage");
      const slotButton = document.querySelector(".random-slot-start");
      slotStage?.classList.remove("spinning");
      slotStage?.classList.add("settled");
      if (slotButton) {
        slotButton.disabled = false;
        slotButton.textContent = "Choose Nudger";
      }
      persistRoute();
      return;
    }

    step += 1;
    const delay = 38 + Math.round(progress * progress * 250);
    randomNudgerSpinTimer = window.setTimeout(tick, delay);
  };

  randomNudgerSpinTimer = window.setTimeout(tick, 42);
}

function formatTourPageText(text = "") {
  const escaped = escapeHtml(text || "");
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
}

function TourPageContentBlock(block) {
  const text = formatTourPageText(block.text || "");
  if (block.type === "heading") return `<h2 data-type="heading">${text || "<br>"}</h2>`;
  if (block.type === "subheading") return `<h3 data-type="subheading">${text || "<br>"}</h3>`;
  if (block.type === "subheading3") return `<h4 data-type="subheading3">${text || "<br>"}</h4>`;
  if (block.type === "bullet") return `<p class="cms-bullet-line" data-type="bullet">${text || "<br>"}</p>`;
  return `<p data-type="text">${text || "<br>"}</p>`;
}

function TourPageReadBox(blocks) {
  return `
    <div class="cms-content-box">
      ${blocks.length ? blocks.map(TourPageContentBlock).join("") : `<p class="empty-state">No content yet.</p>`}
    </div>
  `;
}

function TourPageEditorBox(blocks) {
  const cacheKey = tourPageCacheKey(currentTourPageYear(), state.thisTourOverviewPanel);
  const draft = getTourPageDraft(cacheKey, blocks);
  return `
    <div class="cms-toolbar" aria-label="Editor toolbar">
      <button data-action="format-tour-page-line" data-type="heading">H1</button>
      <button data-action="format-tour-page-line" data-type="subheading">H2</button>
      <button data-action="format-tour-page-line" data-type="text">Text</button>
      <button data-action="format-tour-page-line" data-type="subheading3">Bold</button>
      <button data-action="format-tour-page-line" data-type="bullet">Bullet</button>
    </div>
    <div class="cms-content-box cms-content-editor" contenteditable="plaintext-only" spellcheck="true" role="textbox" aria-multiline="true" data-placeholder="Type freely here...">${escapeHtml(draft.text)}</div>
  `;
}

function getTourPageEditor() {
  return document.querySelector(".cms-content-editor");
}

function blockToDraftText(block) {
  const text = String(block.text || "").trim();
  if (block.type === "heading") return text ? `# ${text}` : "# ";
  if (block.type === "subheading") return text ? `## ${text}` : "## ";
  if (block.type === "subheading3") return text ? `* ${text}` : "* ";
  if (block.type === "bullet") return text ? `- ${text}` : "- ";
  return text;
}

function getTourPageDraft(cacheKey, blocks = []) {
  if (!state.tourPageDrafts[cacheKey]) {
    const safeBlocks = blocks.length ? blocks : [{ type: "text", text: "" }];
    state.tourPageDrafts[cacheKey] = {
      text: safeBlocks.map(blockToDraftText).join("\n"),
    };
  }
  return state.tourPageDrafts[cacheKey];
}

function draftParagraphs(text = "") {
  const paragraphs = String(text).split("\n");
  const starts = paragraphs.reduce((lineStarts, paragraph, index) => {
    const previousStart = lineStarts[index - 1] || 0;
    const previousLength = index ? paragraphs[index - 1].length + 1 : 0;
    lineStarts.push(previousStart + previousLength);
    return lineStarts;
  }, []);
  return { paragraphs, starts };
}

function currentDraftParagraphIndex(text = "", selectionStart = 0) {
  const { paragraphs, starts } = draftParagraphs(text);
  return starts.reduce((activeIndex, start, index) => (
    selectionStart >= start ? index : activeIndex
  ), 0);
}

function draftToTourPageBlocks(draft) {
  const { paragraphs } = draftParagraphs(draft.text);
  return paragraphs
    .map((paragraph) => {
      const text = paragraph.trim();
      if (text.startsWith("* ")) return { type: "subheading3", text: text.replace(/^\*\s+/, "").trim() };
      if (text.startsWith("### ")) return { type: "subheading3", text: text.replace(/^###\s+/, "").trim() };
      if (text.startsWith("## ")) return { type: "subheading", text: text.replace(/^##\s+/, "").trim() };
      if (text.startsWith("# ")) return { type: "heading", text: text.replace(/^#\s+/, "").trim() };
      if (text.startsWith("- ") || text.startsWith("• ")) return { type: "bullet", text: text.replace(/^[-•]\s+/, "").trim() };
      return { type: "text", text };
    })
    .filter((block) => block.text);
}

function updateTourPageDraftFromEditor() {
  const editor = getTourPageEditor();
  const cacheKey = tourPageCacheKey(currentTourPageYear(), state.thisTourOverviewPanel);
  const draft = getTourPageDraft(cacheKey, normaliseTourPageContent(state.tourPagesByKey[cacheKey]?.content));
  draft.text = editor?.innerText || "";
  state.tourPageSavedKey = null;
}

function editorTextSelectionOffset(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return (editor.innerText || "").length;
  const range = selection.getRangeAt(0).cloneRange();
  range.selectNodeContents(editor);
  range.setEnd(selection.anchorNode, selection.anchorOffset);
  return range.toString().length;
}

function setEditorTextSelectionOffset(editor, offset) {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();
  while (node) {
    if (remaining <= node.textContent.length) {
      const range = document.createRange();
      range.setStart(node, Math.max(0, remaining));
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= node.textContent.length;
    node = walker.nextNode();
  }
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertTextAtEditorSelection(editor, text) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) {
    editor.append(text);
    setEditorTextSelectionOffset(editor, (editor.innerText || "").length);
    return;
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function applyTourPageLineFormat(type) {
  const editor = getTourPageEditor();
  if (!editor) return;
  const cacheKey = tourPageCacheKey(currentTourPageYear(), state.thisTourOverviewPanel);
  const draft = getTourPageDraft(cacheKey, normaliseTourPageContent(state.tourPagesByKey[cacheKey]?.content));
  const selectionStart = editorTextSelectionOffset(editor);
  const { paragraphs, starts } = draftParagraphs(editor.innerText);
  const paragraphIndex = currentDraftParagraphIndex(editor.innerText, selectionStart);
  const paragraphStart = starts[paragraphIndex] || 0;
  const paragraph = paragraphs[paragraphIndex] || "";
  const cleanText = paragraph.trim().replace(/^#{1,3}\s+/, "").replace(/^[-•*]\s+/, "");
  const formattedParagraph =
    type === "heading" ? `# ${cleanText}` :
    type === "subheading" ? `## ${cleanText}` :
    type === "subheading3" ? `* ${cleanText}` :
    type === "bullet" ? `- ${cleanText}` :
    cleanText;
  const before = editor.innerText.slice(0, paragraphStart);
  const after = editor.innerText.slice(paragraphStart + paragraph.length);
  draft.text = `${before}${formattedParagraph}${after}`;
  state.tourPageSavedKey = null;
  editor.innerText = draft.text;
  const prefixDelta = formattedParagraph.length - paragraph.length;
  const nextSelectionStart = Math.max(paragraphStart, selectionStart + prefixDelta);
  editor.focus();
  setEditorTextSelectionOffset(editor, nextSelectionStart);
}

function continueTourPageListLine(event) {
  const editor = event.target.closest(".cms-content-editor");
  if (!editor || event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;

  const selectionStart = editorTextSelectionOffset(editor);
  const { paragraphs } = draftParagraphs(editor.innerText);
  const lineIndex = currentDraftParagraphIndex(editor.innerText, selectionStart);
  const currentLine = paragraphs[lineIndex] || "";
  if (!currentLine.trim().startsWith("- ")) return;

  event.preventDefault();
  insertTextAtEditorSelection(editor, "\n- ");
  updateTourPageDraftFromEditor();
}

function ThisTourOverviewFeature() {
  const pageKey = state.thisTourOverviewPanel;
  const year = currentTourPageYear();
  const title = formatOverviewFeatureTitle(pageKey);

  if (pageKey === "random-nudger-generator") {
    return `
      <section class="overview-feature-screen random-nudger-screen">
        <div class="overview-feature-topbar">
          <button class="overview-feature-back" data-action="overview-back" aria-label="Back to overview">${icon("back")}</button>
        </div>
        <div class="cms-page-head">
          <span class="eyebrow">${escapeHtml(tourDisplayName(tours[0]))}</span>
          <h1>${escapeHtml(title)}</h1>
        </div>
        <div class="overview-feature-body">${RandomNudgerGenerator()}</div>
      </section>
    `;
  }

  if (pageKey === "scorecards") {
    return `
      <section class="overview-feature-screen">
        <button class="overview-feature-back" data-action="overview-back" aria-label="Back to overview">${icon("back")}</button>
        <h1>${escapeHtml(title)}</h1>
        <div class="overview-feature-body">${AberdoveyScorecard()}</div>
      </section>
    `;
  }

  const cacheKey = tourPageCacheKey(year, pageKey);
  const page = state.tourPagesByKey[cacheKey];
  const blocks = normaliseTourPageContent(page?.content);
  const isLoading = state.tourPageLoadingKey === cacheKey;
  const isSaving = state.tourPageSavingKey === cacheKey;
  const saved = state.tourPageSavedKey === cacheKey;
  const isEditing = state.tourPageEditingKey === cacheKey;

  return `
    <section class="overview-feature-screen ${isEditing ? "editing" : ""}">
      <div class="overview-feature-topbar">
        <button class="overview-feature-back" data-action="overview-back" aria-label="Back to overview">${icon("back")}</button>
        ${!isLoading ? `
          <div class="cms-page-actions">
            ${isEditing ? `<button class="cms-edit-btn secondary" data-action="discard-tour-page">Discard</button>` : ""}
            <button class="cms-edit-btn" data-action="${isEditing ? "save-tour-page" : "edit-tour-page"}">${isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}</button>
          </div>
        ` : ""}
      </div>
      <div class="cms-page-head">
        <span class="eyebrow">${year}</span>
        <h1>${escapeHtml(page?.title || title)}</h1>
      </div>
      <div class="overview-feature-body">
        ${state.tourPageError ? Card(`<p class="empty-state">${escapeHtml(state.tourPageError)}</p>`) : ""}
        ${isLoading ? Card(`<p class="empty-state">Loading ${escapeHtml(title)}...</p>`) : ""}
        ${!isLoading ? Card(`
          ${isEditing ? TourPageEditorBox(blocks) : TourPageReadBox(blocks)}
          ${saved && !isSaving ? `<p class="cms-save-note">Saved.</p>` : ""}
        `, `cms-editor-card ${isEditing ? "editing" : ""}`) : ""}
      </div>
    </section>
  `;
}

function ThisTourOverview() {
  return `
    <div class="action-grid this-tour-overview">${thisTourOverviewActions.map(([label, iconName, view]) => ActionTile(label, iconName, view)).join("")}</div>
  `;
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

function formatHandicap(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "[PLACEHOLDER]" || raw.toUpperCase() === "TBC") return "?";
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return "?";
  return raw;
}

function daysBetweenDates(fromDate, toDate = new Date()) {
  if (!fromDate) return null;
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.max(0, Math.ceil((end - start) / 86400000));
}

function daysUntilDate(toDate, fromDate = new Date()) {
  if (!toDate) return null;
  const end = new Date(`${toDate}T00:00:00`);
  return Math.max(0, Math.floor((end - fromDate) / 86400000));
}

function latestCompletedTour() {
  return tours.find((tour) => tour.status === "Completed");
}

function tourDisplayName(tour) {
  return String(tour?.destination || tour?.shortTitle || tour?.title || "")
    .replace(/\s+\d{4}\b/g, "")
    .replace(/[^\w\s&-]/g, "")
    .trim();
}

function formatResultHeaderPoints(points) {
  if (points === 0.5) return `<span class="score-half-only">½</span>`;
  if (Number.isInteger(points)) return String(points);
  const whole = Math.floor(points);
  return `${whole}<span class="score-half">½</span>`;
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

function profileWordCount(profileRows = []) {
  return profileRows.reduce((total, row) => {
    const words = String(row.profile_body || "").trim().match(/\b[\w'-]+\b/g);
    return total + (words ? words.length : 0);
  }, 0);
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
            <b class="score-total crocs">${formatResultHeaderPoints(teamPointsForRows(rows).crocs)}</b>
            <i></i>
            <b class="score-total foz">${formatResultHeaderPoints(teamPointsForRows(rows).foz)}</b>
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
              <b class="score-total crocs">${formatResultHeaderPoints(teamPointsForRows(dayRows).crocs)}</b>
              <i></i>
              <b class="score-total foz">${formatResultHeaderPoints(teamPointsForRows(dayRows).foz)}</b>
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
          <button class="tour-rail-face" data-action="jump-tour-profile" data-profile-id="${row.id}" aria-label="${escapeHtml(playerName)}" aria-current="false">
            ${Avatar(player, "tour-rail-avatar")}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function TourProfileStats(profileRows) {
  const words = profileWordCount(profileRows);
  return `
    <section class="profile-stats-card">
      <span>Profile Stats</span>
      <strong>${words.toLocaleString("en-GB")}</strong>
      <p>Words across ${profileRows.length} profiles</p>
    </section>
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
      <div class="tour-profile-list with-rail">
        ${TourProfileStats(profileRows)}
        ${profileRows.map(TourProfileCard).join("")}
      </div>
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

function TeamPlayer(row, teamName = "") {
  const player = getPlayerById(row.player_id);
  const playerName = player?.player_name || `Player ${row.player_id}`;
  const firstName = playerName.split(" ")[0];
  const teamClass = teamClassForName(teamName);
  return `
    <button class="team-player" data-action="player" data-player-id="${row.player_id}" data-return="tour">
      ${Avatar(player, `team-avatar ${teamClass}`.trim())}
      <strong>${escapeHtml(firstName)}</strong>
    </button>
  `;
}

function teamClassForName(teamName = "") {
  const name = String(teamName).trim().toLowerCase();
  if (name === "croc" || name === "crocs") return "crocs";
  if (name === "foz") return "foz";
  return "";
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
      }).map(([teamName, playersForTeam]) => {
        const teamClass = teamClassForName(teamName);

        return `
        <section class="team-card${teamClass ? ` ${teamClass}` : ""}">
          <div class="team-head">
            <div>
              <h3>${escapeHtml(teamName)}</h3>
            </div>
          </div>
          <div class="team-grid">
            ${playersForTeam.map((playerRow) => TeamPlayer(playerRow, teamName)).join("")}
          </div>
        </section>
      `;
      }).join("")}
    </div>
  `;
}

function TourDetail({ forcedTour = null, thisTourMode = false } = {}) {
  const foundTour = forcedTour || tours.find((item) => item.id === state.detailTour);
  if ((!foundTour || thisTourMode) && !hasLoadedSupabase) {
    return `
      ${Header("", "locked")}
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
  if (thisTourMode && state.detailSubTab === "Overview" && state.thisTourOverviewPanel) {
    return ThisTourOverviewFeature();
  }
  if (state.detailSubTab === "Overview" && Number(state.matchReportOpenYear) === Number(tour.year)) {
    return MatchReportPage(tour);
  }

  const detailTabs = ["Overview", "Results", "Teams", "Profiles", "Roles", "Brochures"];
  const detailBody = `
    ${state.detailSubTab === "Overview" ? (thisTourMode ? ThisTourOverview() : TourOverview(tour)) : ""}
    ${state.detailSubTab === "Results" ? TourResults(tour) : ""}
    ${state.detailSubTab === "Teams" ? TourTeams(tour) : ""}
    ${state.detailSubTab === "Profiles" ? TourProfiles(tour) : ""}
    ${state.detailSubTab === "Roles" ? TourRoles(tour) : ""}
    ${state.detailSubTab === "Brochures" ? TourBrochures(tour) : ""}
    ${!["Overview", "Results", "Teams", "Profiles", "Roles", "Brochures"].includes(state.detailSubTab) ? Card(`<p class="empty-state">${state.detailSubTab} coming soon.</p>`) : ""}
  `;

  return `
    <section class="detail-hero" style="background-image: linear-gradient(180deg, rgba(2,10,7,.05), rgba(2,10,7,.88)), url('${tour.image}')">
      <div class="detail-hero-content">
        <h2>${escapeHtml(tourDetailHeroTitle(tour))}</h2>
        ${DetailHeroMeta(tour)}
      </div>
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

function leadersBy(records, valueFn, tieBreakFn = () => 0) {
  const sorted = [...records]
    .filter((record) => Number(valueFn(record)) > 0)
    .sort((a, b) => Number(valueFn(b)) - Number(valueFn(a)) || tieBreakFn(a, b));

  if (!sorted.length) return [];
  const topValue = Number(valueFn(sorted[0]));
  return sorted.filter((record) => Number(valueFn(record)) === topValue);
}

function percentLeaders(records, matchesKey, winsKey) {
  const sorted = [...records]
    .filter((record) => record[matchesKey] > 0)
    .sort((a, b) => {
      const percentDiff = percentage(b[winsKey], b[matchesKey]) - percentage(a[winsKey], a[matchesKey]);
      if (percentDiff) return percentDiff;
      return b[matchesKey] - a[matchesKey];
    });
  const top = sorted[0];

  if (!top) return [];
  return sorted.filter((record) => (
    percentage(record[winsKey], record[matchesKey]) === percentage(top[winsKey], top[matchesKey]) &&
    record[matchesKey] === top[matchesKey]
  ));
}

function activePlayerNames() {
  return new Set(
    allPlayers
      .filter((player) => player.is_active !== false)
      .map((player) => player.player_name)
  );
}

function tourStarsByPlayer(rows = [], activeOnly = true) {
  const winners = tourWinnerByYear(rows);
  const allowedPlayers = activeOnly ? activePlayerNames() : null;
  const playerRowsByName = allPlayers.reduce((playersByName, player) => {
    playersByName[player.player_name] = {
      player,
      profileRows: state.touristProfileRows.filter((row) => Number(row.player_id) === Number(player.id)),
    };
    return playersByName;
  }, {});
  const playerNames = new Set([
    ...Object.keys(playerRowsByName),
    ...rows.flatMap((row) => [...splitTeamNames(row.crocs_team), ...splitTeamNames(row.foz_team)]),
  ]);

  return [...playerNames]
    .filter((playerName) => !allowedPlayers || allowedPlayers.has(playerName))
    .reduce((starsByPlayer, playerName) => {
      const profileRows = playerRowsByName[playerName]?.profileRows || [];
      const profileByYear = profileRows.reduce((byYear, row) => {
        const year = tours.find((tour) => Number(tour.supabaseId) === Number(row.tour_id))?.year;
        if (year && !byYear[year]) byYear[year] = row;
        return byYear;
      }, {});
      const resultYears = rows
        .filter((row) => splitTeamNames(row.crocs_team).includes(playerName) || splitTeamNames(row.foz_team).includes(playerName))
        .map((row) => row.year)
        .filter(Boolean);
      const years = [...new Set([...Object.keys(profileByYear), ...resultYears].map(Number).filter(Boolean))];

      starsByPlayer[playerName] = years.reduce((wins, year) => {
        const winner = winners[year];
        const profileTeam = profileByYear[year]?.team_name;
        const resultTeam =
          rows.find((match) => Number(match.year) === Number(year) && splitTeamNames(match.crocs_team).includes(playerName)) ? "Crocs" :
          rows.find((match) => Number(match.year) === Number(year) && splitTeamNames(match.foz_team).includes(playerName)) ? "Foz" :
          "";
        const teamName = profileTeam || resultTeam;

        if (winner === "Half") return wins + 0.5;
        if (winner && teamName === winner) return wins + 1;
        return wins;
      }, 0);

      return starsByPlayer;
    }, {});
}

function addRivalPair(pairs, playerA, playerB) {
  if (!playerA || !playerB || playerA === playerB) return;
  const names = [playerA, playerB].sort((a, b) => a.localeCompare(b));
  const key = names.join("::");
  if (!pairs[key]) {
    pairs[key] = {
      players: names,
      matches: 0,
    };
  }
  pairs[key].matches += 1;
}

function mostPlayedRivals(rows = [], activeOnly = true) {
  const allowedPlayers = activeOnly ? activePlayerNames() : null;
  const pairs = {};

  rows.forEach((match) => {
    const crocs = splitTeamNames(match.crocs_team).filter((playerName) => !allowedPlayers || allowedPlayers.has(playerName));
    const foz = splitTeamNames(match.foz_team).filter((playerName) => !allowedPlayers || allowedPlayers.has(playerName));
    crocs.forEach((crocsPlayer) => {
      foz.forEach((fozPlayer) => addRivalPair(pairs, crocsPlayer, fozPlayer));
    });
  });

  const leaders = leadersBy(
    Object.values(pairs),
    (pair) => pair.matches,
    (a, b) => a.players.join(" & ").localeCompare(b.players.join(" & "))
  );
  const leader = leaders[0];

  if (!leader) {
    return { name: "N/A", value: "No matches", detail: "", players: [], pairs: [] };
  }

  return {
    name: leaders.map((pair) => pair.players.join(" vs ")).join(", "),
    value: String(leader.matches),
    detail: leader.matches === 1 ? "match" : "matches",
    players: leader.players,
    pairs: leaders.map((pair) => pair.players),
  };
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

  const starsByPlayer = tourStarsByPlayer(rows, activeOnly);
  const records = Object.values(recordsByPlayer).map((record) => ({
    ...record,
    stars: starsByPlayer[record.playerName] || 0,
  }));
  const highestWin = bestBy(records, "matches", "wins");
  const highestFourball = bestBy(records, "fourballMatches", "fourballWins");
  const highestSingles = bestBy(records, "singlesMatches", "singlesWins");
  const mostWins = [...records].sort((a, b) => b.wins - a.wins || b.matches - a.matches)[0];
  const mostPoints = [...records].sort((a, b) => b.points - a.points || b.wins - a.wins)[0];
  const mostMatches = [...records].sort((a, b) => b.matches - a.matches || b.wins - a.wins)[0];
  const highestWinLeaders = percentLeaders(records, "matches", "wins");
  const highestFourballLeaders = percentLeaders(records, "fourballMatches", "fourballWins");
  const highestSinglesLeaders = percentLeaders(records, "singlesMatches", "singlesWins");
  const mostWinsLeaders = leadersBy(records, (record) => record.wins, (a, b) => b.matches - a.matches);
  const mostPointsLeaders = leadersBy(records, (record) => record.points, (a, b) => b.wins - a.wins);
  const mostMatchesLeaders = leadersBy(records, (record) => record.matches, (a, b) => b.wins - a.wins);
  const rivals = mostPlayedRivals(rows, activeOnly);

  return {
    highestWin,
    highestFourball,
    highestSingles,
    mostWins,
    mostPoints,
    mostMatches,
    highestWinLeaders,
    highestFourballLeaders,
    highestSinglesLeaders,
    mostWinsLeaders,
    mostPointsLeaders,
    mostMatchesLeaders,
    rivals,
    records,
    totalMatches: rows.length,
  };
}

function LeaderStat(label, name, value, detail = "", options = {}) {
  const nameText = String(name || "N/A");
  const nameLength = nameText.length;
  const nameCount = nameText.split(/\s*(?:,|\/|&)\s*/).filter(Boolean).length;
  const compactClass = nameLength > 34 || nameCount > 1 ? " compact" : "";
  const tightClass = nameLength > 48 || nameCount > 3 ? " tight" : "";
  const Tag = options.action ? "button" : "article";
  const attrs = options.action
    ? ` type="button" data-action="${escapeHtml(options.action)}"${options.detail ? ` data-detail="${escapeHtml(options.detail)}"` : ""}${options.disabled ? " disabled" : ""}`
    : "";

  return `
    <${Tag} class="leader-stat${options.action ? " clickable" : ""}"${attrs}>
      <span>${label}</span>
      <strong class="leader-name${compactClass}${tightClass}">${escapeHtml(nameText)}</strong>
      <div class="leader-value"><b>${escapeHtml(value)}</b>${detail ? `<small>(${escapeHtml(detail)})</small>` : ""}</div>
    </${Tag}>
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

function namesForLeaders(records = []) {
  if (!records.length) return "N/A";
  return records.map((record) => record.playerName).join(", ");
}

function percentLeaderDisplay(records, fallback, matchesKey, winsKey) {
  const leader = records[0] || fallback;
  if (!leader) return { name: "N/A", value: "No matches", detail: "" };

  return {
    name: namesForLeaders(records.length ? records : [leader]),
    value: `${percentage(leader[winsKey], leader[matchesKey])}%`,
    detail: `${leader[winsKey]}/${leader[matchesKey]}`,
  };
}

function mostTourStars(rows = [], activeOnly = true) {
  const records = Object.entries(tourStarsByPlayer(rows, activeOnly))
    .map(([playerName, stars]) => ({ playerName, stars }));
  const leaders = leadersBy(records, (record) => record.stars, (a, b) => a.playerName.localeCompare(b.playerName));

  return {
    name: namesForLeaders(leaders),
    value: formatTeamPoints(leaders[0]?.stars || 0),
    detail: "tour wins",
    leaders,
  };
}

function playerTeamInMatch(match, playerName) {
  if (splitTeamNames(match.crocs_team).includes(playerName)) return "Crocs";
  if (splitTeamNames(match.foz_team).includes(playerName)) return "Foz";
  return "";
}

function rowsForPlayerStat(rows = [], playerName = "", key = "") {
  return rows.filter((match) => {
    const team = playerTeamInMatch(match, playerName);
    if (!team) return false;
    const format = String(match.format || "").toLowerCase();
    if (key === "highest-fourball") return format.includes("fourball");
    if (key === "highest-singles") return format.includes("singles");
    return true;
  });
}

function playerMatchOutcome(match, playerName) {
  const team = playerTeamInMatch(match, playerName);
  if (match.result === "Half") return "Halved";
  if (match.result === `Win Team ${team}`) return "Win";
  return "Loss";
}

function OverviewPlayerMatchCard(match, playerName) {
  return `
    <article class="meeting-card">
      <div class="meeting-head">
        <div>
          <strong>${escapeHtml(match.tour_name || tourDisplayName(tours.find((tour) => Number(tour.year) === Number(match.year))) || "Tour")}</strong>
          <span>${escapeHtml(String(match.year || ""))} · Day ${escapeHtml(String(match.day || ""))} · Match ${escapeHtml(String(match.match_number || ""))}</span>
        </div>
        <b>${escapeHtml(match.score || "A/S")}</b>
      </div>
      <p class="meeting-course">${escapeHtml(courseNameForMatch(match))}</p>
      <div class="meeting-meta">
        <span>${escapeHtml(match.format || "Match")}</span>
        <span>${escapeHtml(rivalTeamLine(match))}</span>
      </div>
      <div class="meeting-result">
        <span>${escapeHtml(firstNameFromName(playerName))}</span>
        <strong>${escapeHtml(playerMatchOutcome(match, playerName))}</strong>
      </div>
    </article>
  `;
}

function starRowsForPlayer(playerName, rows = []) {
  const winners = tourWinnerByYear(rows);
  const profileRows = state.touristProfileRows.filter((row) => allPlayers.some((player) =>
    player.player_name === playerName && Number(player.id) === Number(row.player_id)
  ));
  const profileByYear = profileRows.reduce((byYear, row) => {
    const year = tours.find((tour) => Number(tour.supabaseId) === Number(row.tour_id))?.year;
    if (year && !byYear[year]) byYear[year] = row;
    return byYear;
  }, {});
  const years = [...new Set([
    ...Object.keys(profileByYear).map(Number),
    ...rows
      .filter((match) => playerTeamInMatch(match, playerName))
      .map((match) => Number(match.year))
      .filter(Boolean),
  ])].sort((a, b) => b - a);

  return years
    .map((year) => {
      const winner = winners[year];
      const playerMatch = rows.find((match) => Number(match.year) === Number(year) && playerTeamInMatch(match, playerName));
      const resultTeam = playerMatch ? playerTeamInMatch(playerMatch, playerName) : "";
      const teamName = profileByYear[year]?.team_name || resultTeam;
      const stars = winner === "Half" ? 0.5 : winner && teamName === winner ? 1 : 0;
      const tour = tours.find((item) => Number(item.year) === Number(year));
      return { year, tourName: tourDisplayName(tour) || String(year), teamName, winner, stars };
    })
    .filter((row) => row.stars > 0);
}

function StarBreakdownRows(playerName, rows = []) {
  const starRows = starRowsForPlayer(playerName, rows);
  if (!starRows.length) return Card(`<p class="empty-state">No tour wins found.</p>`);
  return `
    <div class="stats-breakdown-list">
      ${starRows.map((row) => `
        <div class="stats-breakdown-row">
          <span>${escapeHtml(row.tourName)} ${escapeHtml(String(row.year))}</span>
          <strong>${escapeHtml(formatTeamPoints(row.stars))}</strong>
          <small>${escapeHtml(row.teamName || "Team TBC")} · ${escapeHtml(row.winner === "Half" ? "Halved tour" : "Tour winners")}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function rowsForRivals(rows = [], players = []) {
  const [playerA, playerB] = players;
  if (!playerA || !playerB) return [];

  return rows.filter((match) => {
    const crocs = splitTeamNames(match.crocs_team);
    const foz = splitTeamNames(match.foz_team);
    return (
      (crocs.includes(playerA) && foz.includes(playerB)) ||
      (crocs.includes(playerB) && foz.includes(playerA))
    );
  });
}

function rivalTeamLine(match) {
  const crocs = compactTeamNames(match.crocs_team);
  const foz = compactTeamNames(match.foz_team);
  return `${crocs || "Crocs"} vs ${foz || "Foz"}`;
}

function rivalWinner(match, players = []) {
  if (match.result === "Half") return "Halved";
  const winningTeam = String(match.result || "").replace("Win Team ", "");
  if (winningTeam === "Crocs" || winningTeam === "Foz") {
    const winningNames = splitTeamNames(winningTeam === "Crocs" ? match.crocs_team : match.foz_team);
    const winner = players.find((playerName) => winningNames.includes(playerName));
    if (winner) return firstNameFromName(winner);
  }
  if (match.winner_name) return firstNameFromName(match.winner_name);
  return match.result || "N/A";
}

function RivalMatchCard(match, players = []) {
  return `
    <article class="meeting-card">
      <div class="meeting-head">
        <div>
          <strong>${escapeHtml(match.tour_name || tourDisplayName(tours.find((tour) => Number(tour.year) === Number(match.year))) || "Tour")}</strong>
          <span>${escapeHtml(String(match.year || ""))} · Day ${escapeHtml(String(match.day || ""))} · Match ${escapeHtml(String(match.match_number || ""))}</span>
        </div>
        <b>${escapeHtml(match.score || "A/S")}</b>
      </div>
      <p class="meeting-course">${escapeHtml(courseNameForMatch(match))}</p>
      <div class="meeting-meta">
        <span>${escapeHtml(match.format || "Match")}</span>
        <span>${escapeHtml(rivalTeamLine(match))}</span>
      </div>
      <div class="meeting-result">
        <span>Result</span>
        <strong>${escapeHtml(rivalWinner(match, players))}</strong>
      </div>
    </article>
  `;
}

function RivalsOverlay(stats) {
  const pairs = state.selectedRivalPairs.length ? state.selectedRivalPairs : stats.rivals.pairs;
  const firstPair = pairs[0] || stats.rivals.players;
  const title = pairs.length > 1 ? "Top rivalries" : firstPair.length === 2 ? firstPair.join(" vs ") : "Rivals";
  const activeIndex = Math.min(Math.max(Number(state.activeRivalPairIndex) || 0, 0), Math.max(pairs.length - 1, 0));
  const activePair = pairs[activeIndex] || firstPair;
  const matches = rowsForRivals(state.statsOverviewRows || [], activePair);

  return `
    <section class="rivals-overlay" role="dialog" aria-label="Rivals match history">
      <div class="overview-feature-topbar rivals-overlay-topbar">
        <button class="overview-feature-back" data-action="back-stats-overview" aria-label="Back to Stats overview">${icon("back")}</button>
        <div>
          <span>Rivals</span>
          <h2>${escapeHtml(title)}</h2>
        </div>
      </div>
      ${pairs.length > 1 ? `
        <div class="rivals-tabs" role="tablist" aria-label="Top rivalries">
          ${pairs.map((players, index) => `
            <button
              class="${index === activeIndex ? "active" : ""}"
              data-action="select-rival-pair"
              data-index="${index}"
              type="button"
              role="tab"
              aria-selected="${index === activeIndex ? "true" : "false"}"
            >
              ${escapeHtml(players.map((name) => firstNameFromName(name)).join(" vs "))}
            </button>
          `).join("")}
        </div>
      ` : ""}
      ${Card(`
        <div class="data-row"><span>Matches played</span><strong>${matches.length}</strong></div>
      `, "rivals-summary-card")}
      <h3 class="section-title">Match History</h3>
      ${activePair.length ? `
        <div class="meeting-list">
          <section class="rivals-pair-section">
            ${matches.map((match) => RivalMatchCard(match, activePair)).join("")}
          </section>
        </div>
      ` : Card(`<p class="empty-state">No rival matches found.</p>`)}
    </section>
  `;
}

function currentStatsTour() {
  return tours.find((tour) => Number(tour.year) === currentTourPageYear()) || tours.find((tour) => tour.status === "Upcoming") || tours[0];
}

function formatHandicapChange(value) {
  const rounded = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(rounded)) return "";
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/\.0$/, "");
}

function mostImprovedHandicap(activeOnly = true) {
  const pending = { name: "TBC - pending input of this year's handicaps", value: "", detail: "", leaders: [] };
  const currentTour = currentStatsTour();
  const currentYear = Number(currentTour?.year);
  const currentTourId = Number(currentTour?.supabaseId);
  const playerById = allPlayers.reduce((playersById, player) => {
    playersById[Number(player.id)] = player;
    return playersById;
  }, {});
  const tourById = tours.reduce((toursById, tour) => {
    toursById[Number(tour.supabaseId)] = tour;
    return toursById;
  }, {});
  const rows = (state.touristHandicapRows || [])
    .map((row) => ({
      ...row,
      handicap: Number(row.handicap),
      playerId: Number(row.player_id),
      tourId: Number(row.tour_id),
      year: Number(tourById[Number(row.tour_id)]?.year),
    }))
    .filter((row) => Number.isFinite(row.handicap) && Number.isFinite(row.playerId) && Number.isFinite(row.year));

  if (!Number.isFinite(currentYear)) return pending;

  const currentRows = rows.filter((row) =>
    Number.isFinite(currentTourId) ? row.tourId === currentTourId : row.year === currentYear
  );

  if (!currentRows.length) return pending;

  const improvements = currentRows
    .filter((row) => !activeOnly || playerById[row.playerId]?.is_active !== false)
    .map((currentRow) => {
      const previousRow = rows
        .filter((row) => row.playerId === currentRow.playerId && row.year < currentYear)
        .sort((a, b) => b.year - a.year)[0];

      return {
        playerName: playerById[currentRow.playerId]?.player_name || "N/A",
        currentHandicap: currentRow.handicap,
        previousHandicap: previousRow?.handicap,
        drop: Number(previousRow?.handicap) - currentRow.handicap,
      };
    })
    .filter((record) => Number.isFinite(record.drop) && record.drop > 0);

  const leaders = leadersBy(improvements, (record) => record.drop, (a, b) => a.playerName.localeCompare(b.playerName));
  const leader = leaders[0];

  if (!leader) return pending;

  return {
    name: namesForLeaders(leaders),
    value: `-${formatHandicapChange(leader.drop)}`,
    detail: "handicap drop",
    leaders,
  };
}

function statsDetailConfig(key, stats, context = {}) {
  const configs = {
    "most-stars": {
      title: "Most Stars",
      subtitle: "Tour wins",
      leaders: context.tourStars?.leaders || [],
      value: (record) => formatTeamPoints(record.stars || 0),
      detail: (record) => `${formatTeamPoints(record.stars || 0)} tour wins`,
      body: (record) => StarBreakdownRows(record.playerName, state.statsOverviewRows || []),
    },
    "highest-win": {
      title: "Highest Win %",
      subtitle: "Overall record",
      leaders: stats.highestWinLeaders,
      value: (record) => `${percentage(record.wins, record.matches)}%`,
      detail: (record) => `${record.wins}/${record.matches}`,
      body: (record) => StatsMatchList(record, "highest-win"),
    },
    "highest-fourball": {
      title: "Highest Fourball Win %",
      subtitle: "Fourball record",
      leaders: stats.highestFourballLeaders,
      value: (record) => `${percentage(record.fourballWins, record.fourballMatches)}%`,
      detail: (record) => `${record.fourballWins}/${record.fourballMatches}`,
      body: (record) => StatsMatchList(record, "highest-fourball"),
    },
    "highest-singles": {
      title: "Highest Singles Win %",
      subtitle: "Singles record",
      leaders: stats.highestSinglesLeaders,
      value: (record) => `${percentage(record.singlesWins, record.singlesMatches)}%`,
      detail: (record) => `${record.singlesWins}/${record.singlesMatches}`,
      body: (record) => StatsMatchList(record, "highest-singles"),
    },
    "most-points": {
      title: "Most Points",
      subtitle: "Total points record",
      leaders: stats.mostPointsLeaders,
      value: (record) => formatTeamPoints(record.points || 0),
      detail: (record) => `${record.wins || 0} wins`,
      body: (record) => StatsMatchList(record, "most-points"),
    },
    "most-matches": {
      title: "Most Matches Played",
      subtitle: "Appearance record",
      leaders: stats.mostMatchesLeaders,
      value: (record) => String(record.matches || 0),
      detail: () => "matches",
      body: (record) => StatsMatchList(record, "most-matches"),
    },
    "most-improved": {
      title: "Most Improved",
      subtitle: "Handicap movement",
      leaders: context.mostImproved?.leaders || [],
      value: (record) => `-${formatHandicapChange(record.drop)}`,
      detail: () => "handicap drop",
      body: (record) => `
        <div class="stats-breakdown-list">
          <div class="stats-breakdown-row">
            <span>Previous handicap</span>
            <strong>${escapeHtml(formatHandicapChange(record.previousHandicap))}</strong>
          </div>
          <div class="stats-breakdown-row">
            <span>Current handicap</span>
            <strong>${escapeHtml(formatHandicapChange(record.currentHandicap))}</strong>
          </div>
          <div class="stats-breakdown-row highlight">
            <span>Total improvement</span>
            <strong>-${escapeHtml(formatHandicapChange(record.drop))}</strong>
          </div>
        </div>
      `,
    },
    "total-matches": {
      title: "Total Matches Played",
      subtitle: "All recorded matches",
      leaders: [{ playerName: "All matches", matches: stats.totalMatches }],
      value: () => String(stats.totalMatches),
      detail: () => "matches",
      body: () => TotalMatchesBreakdown(state.statsOverviewRows || []),
    },
  };
  return configs[key] || null;
}

function StatsMatchList(record, key) {
  const matches = rowsForPlayerStat(state.statsOverviewRows || [], record.playerName, key);
  if (!matches.length) return Card(`<p class="empty-state">No matches found.</p>`);
  return `
    <div class="meeting-list">
      ${matches.map((match) => OverviewPlayerMatchCard(match, record.playerName)).join("")}
    </div>
  `;
}

function TotalMatchesBreakdown(rows = []) {
  const byYear = rows.reduce((groups, match) => {
    const year = Number(match.year) || "Unknown";
    groups[year] = (groups[year] || 0) + 1;
    return groups;
  }, {});
  return `
    <div class="stats-breakdown-list">
      ${Object.entries(byYear)
        .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
        .map(([year, count]) => {
          const tour = tours.find((item) => Number(item.year) === Number(year));
          return `
            <div class="stats-breakdown-row">
              <span>${escapeHtml(tourDisplayName(tour) || "Tour")} ${escapeHtml(String(year))}</span>
              <strong>${escapeHtml(String(count))}</strong>
              <small>${Number(count) === 1 ? "match" : "matches"}</small>
            </div>
          `;
        }).join("")}
    </div>
  `;
}

function StatsDetailOverlay(stats, context = {}) {
  const config = statsDetailConfig(state.statsOverlayKey, stats, context);
  if (!config) return "";
  const leaders = config.leaders || [];
  const activeIndex = Math.min(Math.max(Number(state.statsOverlayIndex) || 0, 0), Math.max(leaders.length - 1, 0));
  const active = leaders[activeIndex];
  if (!active) return "";
  const activeName = active.playerName || "All matches";

  return `
    <section class="rivals-overlay stats-detail-overlay" role="dialog" aria-label="${escapeHtml(config.title)} detail">
      <div class="overview-feature-topbar rivals-overlay-topbar">
        <button class="overview-feature-back" data-action="close-stats-detail" aria-label="Back to Stats overview">${icon("back")}</button>
        <div>
          <span>${escapeHtml(config.subtitle)}</span>
          <h2>${escapeHtml(config.title)}</h2>
        </div>
      </div>
      ${leaders.length > 1 ? `
        <div class="rivals-tabs" role="tablist" aria-label="${escapeHtml(config.title)} leaders">
          ${leaders.map((record, index) => `
            <button
              class="${index === activeIndex ? "active" : ""}"
              data-action="select-stats-detail-leader"
              data-index="${index}"
              type="button"
              role="tab"
              aria-selected="${index === activeIndex ? "true" : "false"}"
            >
              ${escapeHtml(firstNameFromName(record.playerName || "All"))}
            </button>
          `).join("")}
        </div>
      ` : ""}
      ${Card(`
        <div class="data-row"><span>${escapeHtml(activeName)}</span><strong>${escapeHtml(config.value(active))}</strong></div>
        <div class="data-row"><span>Detail</span><strong>${escapeHtml(config.detail(active))}</strong></div>
      `, "rivals-summary-card")}
      <h3 class="section-title">${state.statsOverlayKey === "total-matches" ? "Breakdown" : "Details"}</h3>
      ${config.body(active)}
    </section>
  `;
}

function StatsOverview() {
  const rows = state.statsOverviewRows || [];
  const stats = buildOverviewStats(rows, state.statsActiveOnly);
  const highestWin = percentLeaderDisplay(stats.highestWinLeaders, stats.highestWin, "matches", "wins");
  const highestFourball = percentLeaderDisplay(stats.highestFourballLeaders, stats.highestFourball, "fourballMatches", "fourballWins");
  const highestSingles = percentLeaderDisplay(stats.highestSinglesLeaders, stats.highestSingles, "singlesMatches", "singlesWins");
  const tourStars = mostTourStars(rows, state.statsActiveOnly);
  const mostImproved = mostImprovedHandicap(state.statsActiveOnly);

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
    <div class="stats-filter" role="group" aria-label="Player filter">
      <button class="${state.statsActiveOnly ? "active" : ""}" data-action="set-active-nudgers" data-active="1">Active Only</button>
      <button class="${state.statsActiveOnly ? "" : "active"}" data-action="set-active-nudgers" data-active="0">All Players</button>
    </div>
    <div class="leader-grid">
      ${LeaderStat("Most Stars (Tour Wins)", tourStars.name, tourStars.value, tourStars.detail, {
        action: "show-stats-detail",
        detail: "most-stars",
        disabled: !tourStars.leaders?.length,
      })}
      ${LeaderStat("Highest Win %", highestWin.name, highestWin.value, highestWin.detail, {
        action: "show-stats-detail",
        detail: "highest-win",
        disabled: !stats.highestWinLeaders.length,
      })}
      ${LeaderStat("Highest Fourball Win %", highestFourball.name, highestFourball.value, highestFourball.detail, {
        action: "show-stats-detail",
        detail: "highest-fourball",
        disabled: !stats.highestFourballLeaders.length,
      })}
      ${LeaderStat("Highest Singles Win %", highestSingles.name, highestSingles.value, highestSingles.detail, {
        action: "show-stats-detail",
        detail: "highest-singles",
        disabled: !stats.highestSinglesLeaders.length,
      })}
      ${LeaderStat("Most Points", namesForLeaders(stats.mostPointsLeaders), formatTeamPoints(stats.mostPoints?.points || 0), `${stats.mostPoints?.wins || 0} wins`, {
        action: "show-stats-detail",
        detail: "most-points",
        disabled: !stats.mostPointsLeaders.length,
      })}
      ${LeaderStat("Most Matches Played", namesForLeaders(stats.mostMatchesLeaders), String(stats.mostMatches?.matches || 0), "matches", {
        action: "show-stats-detail",
        detail: "most-matches",
        disabled: !stats.mostMatchesLeaders.length,
      })}
      ${LeaderStat("Rivals", stats.rivals.name, stats.rivals.value, stats.rivals.detail, {
        action: "show-rivals-detail",
        disabled: !stats.rivals.players.length,
      })}
      ${LeaderStat("Most Improved", mostImproved.name, mostImproved.value, mostImproved.detail, {
        action: "show-stats-detail",
        detail: "most-improved",
        disabled: !mostImproved.leaders?.length,
      })}
      ${LeaderStat("Total Matches Played", String(stats.totalMatches), "")}
    </div>
    ${state.statsOverlayKey ? StatsDetailOverlay(stats, { tourStars, mostImproved }) : ""}
    ${state.rivalsOverlayOpen ? RivalsOverlay(stats) : ""}
    ${OverviewLeaderboard(stats.records)}
  `;
}

const overviewLeaderboardColumns = [
  {
    key: "points",
    label: ["Total", "Points"],
    value: (record) => record.points,
    render: (record) => formatTeamPoints(record.points),
  },
  {
    key: "stars",
    label: ["Total", "Stars"],
    value: (record) => record.stars,
    render: (record) => formatTeamPoints(record.stars),
  },
  {
    key: "fourballWinPercent",
    label: ["Fourball", "Win %"],
    value: (record) => percentage(record.fourballWins, record.fourballMatches),
    render: (record) => `${percentage(record.fourballWins, record.fourballMatches)}%`,
  },
  {
    key: "singlesWinPercent",
    label: ["Singles", "Win %"],
    value: (record) => percentage(record.singlesWins, record.singlesMatches),
    render: (record) => `${percentage(record.singlesWins, record.singlesMatches)}%`,
  },
  {
    key: "totalWinPercent",
    label: ["Total", "Win %"],
    value: (record) => percentage(record.wins, record.matches),
    render: (record) => `${percentage(record.wins, record.matches)}%`,
  },
  {
    key: "matches",
    label: ["Total", "Played"],
    value: (record) => record.matches,
    render: (record) => record.matches,
  },
];

function sortOverviewLeaderboard(records = []) {
  const sortKey = overviewLeaderboardColumns.some((column) => column.key === state.statsOverviewSortKey)
    ? state.statsOverviewSortKey
    : "points";
  const sortColumn = overviewLeaderboardColumns.find((column) => column.key === sortKey);

  return [...records].sort((a, b) => {
    const valueDiff = Number(sortColumn.value(b)) - Number(sortColumn.value(a));
    if (valueDiff) return valueDiff;
    return b.points - a.points || b.matches - a.matches || a.playerName.localeCompare(b.playerName);
  });
}

function OverviewHeaderButton(column) {
  const isActive = state.statsOverviewSortKey === column.key;
  const label = column.label.join(" ");

  return `
    <button class="overview-sort-button${isActive ? " active" : ""}" data-action="overview-sort" data-sort="${column.key}" aria-label="Sort by ${escapeHtml(label)} descending">
      ${column.label.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}
    </button>
  `;
}

function OverviewLeaderboard(records = []) {
  const rows = sortOverviewLeaderboard(records);

  return `
    <section class="overview-table-card">
      <div class="overview-table-heading">
        <h3>Player Records</h3>
        <span>Swipe for more stats &rarr;</span>
      </div>
      <div class="overview-table-wrap">
        <table class="overview-table">
          <thead>
            <tr>
              <th>Name</th>
              ${overviewLeaderboardColumns.map((column) => `<th>${OverviewHeaderButton(column)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map((record) => `
              <tr>
                <th>${escapeHtml(record.playerName)}</th>
                ${overviewLeaderboardColumns.map((column) => `<td>${escapeHtml(column.render(record))}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function Stats() {
  const statTabs = ["Overview", "Head-to-Head", "Individual"];
  if (!statTabs.includes(state.statSubTab)) state.statSubTab = "Overview";

  return `
    ${PageHero("Stats")}
    <div class="stats-sticky">
      <nav class="subnav top">
        ${statTabs.map((x) => `<button class="${x === state.statSubTab ? "active" : ""}" data-action="stat-tab" data-tab="${x}">${x}</button>`).join("")}
      </nav>
    </div>
    <div class="stats-body">
      ${state.statSubTab === "Overview" ? StatsOverview() : ""}
      ${state.statSubTab === "Head-to-Head" ? HeadToHeadStats() : ""}
      ${state.statSubTab === "Individual" ? IndividualStats() : ""}
    </div>
  `;
}

function latestByTourId(rows = []) {
  return [...rows].sort((a, b) => Number(b.tour_id || 0) - Number(a.tour_id || 0))[0];
}

function profileForTourYear(profileRows = [], year) {
  const tour = tours.find((item) => Number(item.year) === Number(year));
  if (!tour?.supabaseId) return null;
  return profileRows.find((row) => Number(row.tour_id) === Number(tour.supabaseId)) || null;
}

function formatTourRole(value, year = 2026) {
  const role = String(value || "").trim();
  return `${year} Role: ${role && role !== "[PLACEHOLDER]" ? role : "TBC"}`;
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
      role: formatTourRole(null),
      handicapHistory: [],
      debutTour: "N/A",
      winPercent: "N/A",
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
      const tour2026Profile = profileForTourYear(profileRows, 2026);
      const latestHandicap = latestByTourId(handicapRows);
      const handicapHistory = handicapRows
        .map((row) => ({
          ...row,
          year: tours.find((tour) => Number(tour.supabaseId) === Number(row.tour_id))?.year,
        }))
        .filter((row) => row.year);
      const record = recordsByName[player.player_name] || emptyPlayerRecord(player.player_name);
      const tourYears = playerTourYears(player.player_name, profileRows);
      const debutTour = tourYears.length ? Math.min(...tourYears) : "N/A";
      const winPercent = record.matches ? `${percentage(record.wins, record.matches)}%` : "N/A";

      return {
        id: player.id,
        name: player.player_name,
        nick: playerNickname(player),
        isActive: player.is_active !== false,
        handicap: formatHandicap(latestHandicap?.handicap),
        role: formatTourRole(tour2026Profile?.tour_role, 2026),
        tours: tourYears.length || "[PLACEHOLDER]",
        tourWins: formatTeamPoints(playerTourWins(player.player_name, profileRows)),
        individualWins: record.wins || 0,
        about: latestProfile?.profile_body || "[PLACEHOLDER]",
        handicapHistory,
        debutTour,
        winPercent,
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
  if (!player) {
    return Card(`<p class="empty-state">Loading tourist profile...</p>`);
  }

  return `
    <div class="tourist-profile-page">
      <button class="tourist-back" data-action="tourist-back" aria-label="Back to Tourists">${icon("back")}</button>
      ${PlayerCard(player)}
    </div>
  `;
}

function Profiles() {
  const touristPlayers = buildTouristPlayers();
  const selectedIndex = Math.min(state.playerIndex, Math.max(touristPlayers.length - 1, 0));
  const selectedPlayer = touristPlayers[selectedIndex];

  if (state.touristDataLoading) {
    return `
      ${PageHero("Tourists")}
      <div class="page-body">${Card(`<p class="empty-state">Loading tourist profiles...</p>`)}</div>
    `;
  }

  if (state.touristDataError) {
    return `
      ${PageHero("Tourists")}
      <div class="page-body">${Card(`<p class="empty-state">${escapeHtml(state.touristDataError)}</p>`)}</div>
    `;
  }

  return `
    ${PageHero("Tourists", "", state.touristProfileOpen ? "/assets/tourist-background.png" : "")}
    <div class="page-body">
      ${
        state.touristProfileOpen
          ? TouristProfilePage(selectedPlayer)
          : TouristRoster(touristPlayers, selectedIndex)
      }
    </div>
  `;
}

function BottomNav() {
  return `
    <nav class="bottom-nav">
      ${navItems.map(([id, label, iconName]) => `
        <button class="${state.tab === id ? "active" : ""}" data-action="tab" data-tab="${id}">
          ${icon(iconName)}
          <span>${label}</span>
        </button>
      `).join("")}
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
    thisTourOverviewPanel: state.thisTourOverviewPanel,
    thisTourOverviewYear: state.thisTourOverviewYear,
    statSubTab: state.statSubTab,
    playerIndex: state.playerIndex,
    touristProfileOpen: state.touristProfileOpen,
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
  if (route.tab === "profiles") {
    params.set("player", route.playerIndex);
    if (route.touristProfileOpen) params.set("profile", "1");
    else params.delete("profile");
  } else {
    params.delete("player");
    params.delete("profile");
  }
  if (route.selectedPlayerAId) params.set("pa", route.selectedPlayerAId);
  if (route.selectedPlayerBId) params.set("pb", route.selectedPlayerBId);
  if (route.selectedIndividualPlayerId) params.set("pi", route.selectedIndividualPlayerId);
  params.set("active", route.statsActiveOnly ? "1" : "0");
  if (route.scrollTop) params.set("scroll", route.scrollTop);
  else params.delete("scroll");

  let nextPath = "/";
  if (route.tab === "this-tour" && route.detailSubTab === "Overview" && route.thisTourOverviewPanel) {
    params.set("page", route.thisTourOverviewPanel);
    params.set("year", route.thisTourOverviewYear || tours[0]?.year);
    params.delete("scroll");
  } else {
    params.delete("page");
    params.delete("year");
  }

  const nextUrl = `${nextPath}?${params.toString()}`;
  if (replace) window.history.replaceState(null, "", nextUrl);
}

function restoreRoute() {
  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/^\/tour\/(\d{4})\/([a-z0-9-]+)\/?$/);
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("nudgers-route") || "{}");
  } catch {
    saved = {};
  }

  const requestedTab = pathMatch ? "this-tour" : params.get("tab");
  state.tab = requestedTab || saved.tab || state.tab;
  state.detailTour = params.has("tour") ? params.get("tour") : requestedTab ? null : saved.detailTour || state.detailTour;
  state.detailSubTab = params.get("detail") || saved.detailSubTab || state.detailSubTab;
  if (pathMatch) {
    state.detailSubTab = "Overview";
    state.thisTourOverviewYear = Number(pathMatch[1]);
    state.thisTourOverviewPanel = pathMatch[2];
  } else if (requestedTab === "this-tour" && !params.has("page")) {
    state.thisTourOverviewPanel = "";
    state.thisTourOverviewYear = null;
  } else {
    state.thisTourOverviewPanel = params.get("page") || saved.thisTourOverviewPanel || state.thisTourOverviewPanel;
    state.thisTourOverviewYear = Number(params.get("year") || saved.thisTourOverviewYear || state.thisTourOverviewYear) || null;
  }
  if (state.detailSubTab === "Gallery") state.detailSubTab = "Teams";
  if (state.detailSubTab === "Awards") state.detailSubTab = "Brochures";
  if (requestedTab === "this-tour" && !params.has("detail")) state.detailSubTab = "Overview";
  state.statSubTab = params.get("stat") || saved.statSubTab || state.statSubTab;
  if (!["Overview", "Head-to-Head", "Individual"].includes(state.statSubTab)) state.statSubTab = "Overview";
  state.playerIndex = Number(params.get("player") || saved.playerIndex || state.playerIndex);
  state.touristProfileOpen = params.has("profile")
    ? params.get("profile") === "1"
    : !requestedTab && state.tab === "profiles" && saved.touristProfileOpen === true;
  if (state.tab !== "profiles") state.touristProfileOpen = false;
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
    updateActiveTourProfileRail();
  });
}

function render() {
  if (window.matchMedia("(min-width: 769px)").matches) {
    app.innerHTML = DesktopGate();
    syncBirthdayOverlay();
    return;
  }
  const screens = {
    home: Home,
    tours: Tours,
    "this-tour": ThisTour,
    stats: Stats,
    profiles: Profiles,
    media: Media,
    "hall-of-fame": HallOfFame,
  };
  if (!screens[state.tab]) state.tab = "home";
  const screenContent = state.tab === "this-tour" ? ThisTour() : state.detailTour ? TourDetail() : screens[state.tab]();
  const contentClass = [
    "content",
    state.tourPageEditingKey ? "editing-tour-page" : "",
    state.tab === "profiles" && state.touristProfileOpen ? "tourist-profile-open" : "",
  ].filter(Boolean).join(" ");
  app.innerHTML = `
    <div class="phone-shell">
      <div class="${contentClass}">${screenContent}</div>
      ${BottomNav()}
    </div>
  `;
  updateCountdown();
  syncBirthdayOverlay();
  restoreScrollPosition();
  requestAnimationFrame(updateActiveTourProfileRail);
  if (state.tourPageEditingKey) {
    requestAnimationFrame(() => {
      const editor = getTourPageEditor();
      editor?.focus();
    });
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action='dismiss-birthday-overlay']");
  if (!target) return;
  state.birthdayOverlayDismissed = true;
  syncBirthdayOverlay();
  persistRoute();
});

app.addEventListener("click", (event) => {
  const clickedHomeMenu = event.target.closest(".home-menu, .home-menu-btn");
  let closedHomeMenu = false;
  if (state.homeMenuOpen && !clickedHomeMenu) {
    state.homeMenuOpen = false;
    closedHomeMenu = true;
  }

  const target = event.target.closest("[data-action]");
  if (!target) {
    if (closedHomeMenu) {
      render();
      persistRoute();
    }
    return;
  }
  const action = target.dataset.action;
  if (action === "tab") {
    if (randomNudgerSpinTimer) window.clearTimeout(randomNudgerSpinTimer);
    randomNudgerSpinTimer = null;
    state.restoredScrollTop = 0;
    state.tab = target.dataset.tab;
    state.detailTour = null;
    state.matchReportOpenYear = null;
    if (state.tab === "home") state.birthdayOverlayDismissed = false;
    if (state.tab === "this-tour") {
      state.detailSubTab = "Overview";
      state.thisTourOverviewPanel = "";
      loadTourProfiles(tours[0]?.supabaseId);
    }
    if (state.tab === "profiles") {
      state.touristProfileOpen = false;
      state.touristProfileReturn = null;
    } else {
      state.touristProfileOpen = false;
    }
    state.openHeadToHeadPicker = null;
    state.openIndividualPicker = false;
    state.rivalsOverlayOpen = false;
    state.statsOverlayKey = "";
    state.homeMenuOpen = false;
  }
  if (action === "toggle-home-menu") {
    state.homeMenuOpen = !state.homeMenuOpen;
    render();
    persistRoute();
    return;
  }
  if (action === "open-menu-page") {
    if (randomNudgerSpinTimer) window.clearTimeout(randomNudgerSpinTimer);
    randomNudgerSpinTimer = null;
    state.restoredScrollTop = 0;
    state.tab = target.dataset.tab || "home";
    state.detailTour = null;
    state.detailSubTab = "Overview";
    state.thisTourOverviewPanel = "";
    state.matchReportOpenYear = null;
    state.touristProfileOpen = false;
    state.touristProfileReturn = null;
    state.rivalsOverlayOpen = false;
    state.statsOverlayKey = "";
    state.homeMenuOpen = false;
    if (state.tab === "media") loadMediaLibrary();
    if (state.tab === "hall-of-fame") loadHallOfFame();
  }
  if (action === "dismiss-birthday-overlay") {
    state.birthdayOverlayDismissed = true;
    syncBirthdayOverlay();
    persistRoute();
    return;
  }
  if (action === "logout") {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      window.location.href = "/login.html";
    });
    return;
  }
  if (action === "tour-detail") {
    state.restoredScrollTop = 0;
    state.matchReportOpenYear = null;
    const tour = tours.find((item) => item.id === target.dataset.tour);
    if (tour?.status === "Upcoming") {
      state.tab = "this-tour";
      state.detailTour = null;
      state.detailSubTab = "Overview";
    } else {
      state.detailTour = target.dataset.tour;
      state.detailSubTab = "Overview";
      const tour = tours.find((item) => item.id === state.detailTour);
      loadTourProfiles(tour?.supabaseId);
      if (tour?.status === "Completed") loadTourResults(tour.year);
      loadTourPhotos(tour?.year);
      loadMatchReport(tour?.year);
    }
  }
  if (action === "home-view-tour") {
    state.restoredScrollTop = 0;
    state.tab = "this-tour";
    state.detailTour = null;
    state.detailSubTab = "Overview";
    state.thisTourOverviewPanel = "";
    loadTourProfiles(tours[0]?.supabaseId);
  }
  if (action === "refresh-app-update") {
    if (waitingServiceWorker) {
      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    window.location.reload();
  }
  if (action === "back") {
    if (randomNudgerSpinTimer) window.clearTimeout(randomNudgerSpinTimer);
    randomNudgerSpinTimer = null;
    state.restoredScrollTop = 0;
    state.detailTour = null;
    state.detailSubTab = "Overview";
    state.matchReportOpenYear = null;
  }
  if (action === "detail-subtab") {
    if (randomNudgerSpinTimer) window.clearTimeout(randomNudgerSpinTimer);
    randomNudgerSpinTimer = null;
    state.restoredScrollTop = 0;
    state.detailSubTab = target.dataset.tab;
    state.thisTourOverviewPanel = "";
    state.matchReportOpenYear = null;
    const tour = state.tab === "this-tour" ? tours[0] : tours.find((item) => item.id === state.detailTour);
    if (state.detailSubTab === "Overview" && state.tab !== "this-tour" && tour?.status === "Completed") loadTourResults(tour?.year);
    if (state.detailSubTab === "Overview" && state.tab !== "this-tour") {
      loadTourPhotos(tour?.year);
      loadMatchReport(tour?.year);
    }
    if (state.detailSubTab === "Results") loadTourResults(tour?.year);
    if (["Teams", "Profiles", "Roles"].includes(state.detailSubTab)) loadTourProfiles(tour?.supabaseId);
    if (state.detailSubTab === "Brochures") loadTourBrochures(tour?.year);
  }
  if (action === "read-match-report") {
    const year = Number(target.dataset.year);
    state.restoredScrollTop = 0;
    state.matchReportOpenYear = year;
    loadMatchReport(year);
  }
  if (action === "back-match-report") {
    state.restoredScrollTop = 0;
    state.matchReportOpenYear = null;
  }
  if (action === "overview-panel") {
    state.restoredScrollTop = 0;
    state.thisTourOverviewYear = Number(tours[0]?.year) || state.thisTourOverviewYear;
    state.thisTourOverviewPanel = target.dataset.view;
    if (state.thisTourOverviewPanel === "random-nudger-generator") {
      if (randomNudgerSpinTimer) window.clearTimeout(randomNudgerSpinTimer);
      randomNudgerSpinTimer = null;
      state.randomNudgerDraw = emptyRandomNudgerDraw(state.randomNudgerDraw?.mode || "pairs");
      loadTourProfiles(tours[0]?.supabaseId);
    } else if (state.thisTourOverviewPanel !== "scorecards") {
      loadTourPage(currentTourPageYear(), state.thisTourOverviewPanel, formatOverviewFeatureTitle(state.thisTourOverviewPanel));
    }
  }
  if (action === "overview-back") {
    state.restoredScrollTop = 0;
    state.thisTourOverviewPanel = "";
    if (randomNudgerSpinTimer) window.clearTimeout(randomNudgerSpinTimer);
    randomNudgerSpinTimer = null;
  }
  if (action === "edit-tour-page") {
    const year = currentTourPageYear();
    const pageKey = state.thisTourOverviewPanel;
    const cacheKey = tourPageCacheKey(year, pageKey);
    getTourPageDraft(cacheKey, normaliseTourPageContent(state.tourPagesByKey[cacheKey]?.content));
    state.tourPageEditingKey = cacheKey;
  }
  if (action === "discard-tour-page") {
    const year = currentTourPageYear();
    const pageKey = state.thisTourOverviewPanel;
    const cacheKey = tourPageCacheKey(year, pageKey);
    delete state.tourPageDrafts[cacheKey];
    state.tourPageEditingKey = null;
    state.tourPageSavedKey = null;
  }
  if (action === "format-tour-page-line") {
    applyTourPageLineFormat(target.dataset.type);
    state.tourPageSavedKey = null;
    persistRoute();
    return;
  }
  if (action === "save-tour-page") {
    const year = currentTourPageYear();
    const pageKey = state.thisTourOverviewPanel;
    const cacheKey = tourPageCacheKey(year, pageKey);
    const page = state.tourPagesByKey[cacheKey];
    if (page) {
      updateTourPageDraftFromEditor();
      page.content = draftToTourPageBlocks(state.tourPageDrafts[cacheKey]);
      state.tourPageSavedKey = null;
    }
    saveTourPage(year, pageKey);
  }
  if (action === "start-random-nudger-draw") {
    if (randomNudgerSpinTimer) window.clearTimeout(randomNudgerSpinTimer);
    randomNudgerSpinTimer = null;
    resetRandomNudgerDraw();
    render();
    persistRoute();
    window.setTimeout(() => {
      state.randomNudgerDraw.shuffling = false;
      render();
      persistRoute();
    }, 900);
    return;
  }
  if (action === "set-random-nudger-mode") {
    if (randomNudgerSpinTimer) window.clearTimeout(randomNudgerSpinTimer);
    randomNudgerSpinTimer = null;
    state.randomNudgerDraw = emptyRandomNudgerDraw(target.dataset.mode || "pairs");
  }
  if (action === "reset-random-nudger-draw") {
    state.randomNudgerDraw = emptyRandomNudgerDraw("pairs");
  }
  if (action === "reveal-random-nudger") {
    const playerId = Number(target.dataset.playerId);
    if (state.randomNudgerDraw.started && playerId && !state.randomNudgerDraw.revealed.includes(playerId)) {
      const content = document.querySelector(".content");
      state.restoredScrollTop = content ? Math.round(content.scrollTop) : 0;
      state.randomNudgerDraw.revealed = [...state.randomNudgerDraw.revealed, playerId];
      target.classList.remove("covered");
      target.classList.add("revealed");
      target.disabled = true;
      target.setAttribute("aria-label", firstNameForPlayer(getPlayerById(playerId)));
      persistRoute();
      return;
    }
  }
  if (action === "choose-random-nudger") {
    startRandomNudgerSlot();
    return;
  }
  if (action === "add-hall-of-fame-row") {
    addHallOfFameRow();
    return;
  }
  if (action === "show-hall-of-fame-add") {
    state.hallOfFameAdding = true;
  }
  if (action === "cancel-hall-of-fame-add") {
    state.hallOfFameAdding = false;
  }
  if (action === "edit-hall-of-fame-row") {
    const rowId = target.dataset.rowId;
    const row = state.hallOfFameRows.find((item) => String(item.id) === String(rowId));
    if (row) {
      state.hallOfFameEditingId = rowId;
      state.hallOfFameDrafts[String(rowId)] = hallOfFameDraftForRow(row);
    }
  }
  if (action === "save-hall-of-fame-row") {
    saveHallOfFameRow(target.dataset.rowId);
    return;
  }
  if (action === "stat-tab") {
    state.restoredScrollTop = 0;
    state.statSubTab = target.dataset.tab;
    state.rivalsOverlayOpen = false;
    state.statsOverlayKey = "";
    if (state.statSubTab === "Overview") loadStatsOverview();
    if (state.statSubTab === "Head-to-Head" && allPlayers.length) loadHeadToHeadMatches();
    if (state.statSubTab === "Individual" && allPlayers.length) loadIndividualMatches();
  }
  if (action === "set-active-nudgers") {
    state.statsActiveOnly = target.dataset.active !== "0";
    state.rivalsOverlayOpen = false;
    state.statsOverlayKey = "";
  }
  if (action === "show-stats-detail") {
    state.statsOverlayKey = target.dataset.detail || "";
    state.statsOverlayIndex = 0;
    state.rivalsOverlayOpen = false;
  }
  if (action === "select-stats-detail-leader") {
    state.statsOverlayIndex = Number(target.dataset.index) || 0;
  }
  if (action === "close-stats-detail") {
    state.statsOverlayKey = "";
  }
  if (action === "show-rivals-detail") {
    const stats = buildOverviewStats(state.statsOverviewRows || [], state.statsActiveOnly);
    if (stats.rivals.players.length) {
      state.selectedRivals = stats.rivals.players;
      state.selectedRivalPairs = stats.rivals.pairs;
      state.activeRivalPairIndex = 0;
      state.statsOverlayKey = "";
      state.rivalsOverlayOpen = true;
    }
  }
  if (action === "select-rival-pair") {
    state.activeRivalPairIndex = Number(target.dataset.index) || 0;
  }
  if (action === "back-stats-overview") {
    state.rivalsOverlayOpen = false;
  }
  if (action === "overview-sort") {
    const content = document.querySelector(".content");
    state.restoredScrollTop = content ? Math.round(content.scrollTop) : 0;
    state.statsOverviewSortKey = target.dataset.sort || "points";
  }
  if (action === "player") {
    const touristPlayers = buildTouristPlayers();
    const requestedIndex = target.dataset.playerId
      ? touristPlayers.findIndex((player) => Number(player.id) === Number(target.dataset.playerId))
      : Number(target.dataset.index);
    const content = document.querySelector(".content");
    const shouldReturnToTour = target.dataset.return === "tour" && state.tab !== "profiles";

    state.restoredScrollTop = 0;
    state.playerIndex = Math.max(0, requestedIndex);
    if (shouldReturnToTour) {
      state.touristProfileReturn = {
        tab: state.tab,
        detailTour: state.detailTour,
        detailSubTab: state.detailSubTab,
        thisTourOverviewPanel: state.thisTourOverviewPanel,
        thisTourOverviewYear: state.thisTourOverviewYear,
        scrollTop: content ? Math.round(content.scrollTop) : 0,
      };
      state.tab = "profiles";
      state.detailTour = null;
      state.homeMenuOpen = false;
    } else {
      state.touristProfileReturn = null;
    }
    state.touristProfileOpen = true;
  }
  if (action === "tourist-back") {
    if (state.touristProfileReturn) {
      const returnTarget = state.touristProfileReturn;
      state.tab = returnTarget.tab || "profiles";
      state.detailTour = returnTarget.detailTour || null;
      state.detailSubTab = returnTarget.detailSubTab || "Overview";
      state.thisTourOverviewPanel = returnTarget.thisTourOverviewPanel || "";
      state.thisTourOverviewYear = returnTarget.thisTourOverviewYear || null;
      state.restoredScrollTop = returnTarget.scrollTop || 0;
      state.touristProfileReturn = null;
    } else {
      state.restoredScrollTop = 0;
    }
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

app.addEventListener("input", (event) => {
  const hallOfFameField = event.target.closest("[data-hof-field]");
  if (hallOfFameField) {
    const rowId = hallOfFameField.dataset.rowId;
    const row = state.hallOfFameRows.find((item) => String(item.id) === String(rowId));
    if (!row) return;
    const key = String(rowId);
    state.hallOfFameDrafts[key] = {
      ...hallOfFameDraftForRow(row),
      [hallOfFameField.dataset.hofField]: hallOfFameField.value,
    };
    return;
  }

  const target = event.target.closest(".cms-content-editor");
  if (!target) return;
  updateTourPageDraftFromEditor();
});

app.addEventListener("focusout", (event) => {
  const hallOfFameField = event.target.closest("[data-hof-field]");
  if (!hallOfFameField) return;
  const row = hallOfFameField.closest("[data-hof-row-id]");
  if (String(state.hallOfFameEditingId) !== String(hallOfFameField.dataset.rowId)) return;
  if (row && event.relatedTarget && row.contains(event.relatedTarget)) return;
  saveHallOfFameRow(hallOfFameField.dataset.rowId);
});

app.addEventListener("keydown", (event) => {
  continueTourPageListLine(event);
});

app.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-action='format-tour-page-line']")) {
    event.preventDefault();
  }
});

function jumpToTourProfile(profileId) {
  const target = document.getElementById(`tour-profile-${profileId}`);
  if (!target) return;

  const content = document.querySelector(".content");
  const targetTop = target.getBoundingClientRect().top + (content?.scrollTop || 0) - tourProfileTopOffset();
  content?.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" });
  updateActiveTourProfileRail(profileId);
}

function tourProfileTopOffset() {
  const detailTabs = document.querySelector(".detail-tabs");
  return (detailTabs?.getBoundingClientRect().bottom || 176) + 20;
}

function updateActiveTourProfileRail(forcedProfileId = null) {
  const rail = document.querySelector(".tour-profile-rail");
  if (!rail) return;

  const cards = Array.from(document.querySelectorAll(".tour-profile-card"));
  if (!cards.length) return;

  const probeY = tourProfileTopOffset() + 6;
  const activeCard = forcedProfileId
    ? document.getElementById(`tour-profile-${forcedProfileId}`)
    : cards.reduce((closest, card) => {
        const rect = card.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom > probeY) return card;
        if (!closest) return card;
        const closestRect = closest.getBoundingClientRect();
        return Math.abs(rect.top - probeY) < Math.abs(closestRect.top - probeY) ? card : closest;
      }, null);

  const activeId = activeCard?.id?.replace("tour-profile-", "");
  if (!activeId) return;

  let activeButton = null;
  rail.querySelectorAll(".tour-rail-face").forEach((button) => {
    if (button.dataset.profileId === activeId) activeButton = button;
  });

  rail.querySelectorAll(".tour-rail-face").forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "true" : "false");
  });

  activeButton?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

document.addEventListener("scroll", (event) => {
  if (event.target?.closest?.(".tour-profile-rail")) return;
  persistRoute();
  updateActiveTourProfileRail();
}, true);
window.addEventListener("resize", render);
restoreRoute();
render();
loadSupabaseData();

if (!countdownTimer) {
  countdownTimer = window.setInterval(updateCountdown, 1000);
}

function showUpdateAvailable(worker) {
  waitingServiceWorker = worker;
  if (!state.updateAvailable) {
    state.updateAvailable = true;
    render();
  }
}

function activateWaitingServiceWorker(worker) {
  waitingServiceWorker = worker;
  worker?.postMessage({ type: "SKIP_WAITING" });
}

function checkForAppUpdate({ autoApply = false } = {}) {
  if (!serviceWorkerRegistration) return;
  const now = Date.now();
  if (now - lastAutoUpdateCheckAt < 30000) return;
  lastAutoUpdateCheckAt = now;

  serviceWorkerRegistration.update().then(() => {
    const waitingWorker = serviceWorkerRegistration.waiting;
    if (!waitingWorker || !navigator.serviceWorker.controller) return;
    if (autoApply) activateWaitingServiceWorker(waitingWorker);
    else showUpdateAvailable(waitingWorker);
  }).catch(() => {});
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((registration) => {
      serviceWorkerRegistration = registration;
      if (registration.waiting && navigator.serviceWorker.controller) {
        activateWaitingServiceWorker(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            activateWaitingServiceWorker(newWorker);
          }
        });
      });
      checkForAppUpdate({ autoApply: true });
    }).catch(() => {});
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForAppUpdate({ autoApply: true });
  });
}
