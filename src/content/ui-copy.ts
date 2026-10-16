/** The record, split so the Intro board's cell can show label and value apart while `career` says it once. */
const RECORD = { label: "RECORD", value: "99 – 1" } as const;

/** Said in more than one place, so said once. */
const HUB = "HUB";
const BACK_TO_HUB = "BACK TO THE HUB";

/** Interface copy that is not resume data (spec §6). Screens never hard-code strings. */
export const ui = {
  brand: { mark: "YS", wordmark: "THE ARENA", siteName: "The Arena" },
  hud: {
    quickView: "QUICK VIEW",
    skipIntro: "SKIP INTRO",
    replay: "REPLAY",
    rematch: "REMATCH",
    nextVenue: "NEXT VENUE",
  },
  venues: { cricket: "CRICKET GROUND", tennis: "CENTRE COURT", badminton: "BADMINTON HALL" },
  tabs: {
    label: "Main",
    arena: "ARENA",
    career: "CAREER",
    projects: "PROJECTS",
    skills: "SKILLS",
    teamUp: "TEAM UP",
  },
  pages: {
    breadcrumb: "Breadcrumb",
    career: {
      eyebrow: "THE SCORECARD",
      stats: { proSince: "PRO SINCE", club: "CLUB", current: "CURRENT" },
      cols: { inn: "INN", team: "TEAM", role: "ROLE", span: "SPAN", status: "STATUS" },
      listLabel: "Innings",
      academy: "ACADEMY",
      academyLink: "SEE IT IN THE TROPHY ROOM",
      legend: "NOT OUT = CURRENT ROLE · DEBUT = FIRST INNINGS",
      viewCard: "VIEW PLAYER CARD",
      innings: "INNINGS",
      ballByBall: "BALL BY BALL",
      shots: "SHOTS PLAYED",
    },
    highlights: {
      eyebrow: "THE TOURNAMENT RUN · BEST PROJECT PLAYS THE FINAL",
      unlocked: "UNLOCKED",
      of: "OF",
      draw: "THE DRAW",
      listLabel: "Projects",
      replay: "REPLAY",
      comingSoon: "REPLAY COMING SOON",
      // The captions track of a project video: its language name and code.
      captions: { label: "English", lang: "en" },
      serve: "THE SERVE · PROBLEM",
      rally: "THE RALLY · APPROACH",
      winner: "THE WINNER · RESULT",
      shotData: "SHOT DATA",
      stack: "STACK",
      code: "CODE ON GITHUB",
      demo: "LIVE DEMO",
      caseStudy: "FULL CASE STUDY",
      commFinal: "Match point. This one went the distance.",
    },
    attributes: {
      eyebrow: "EVERY SKILL IS A SHOT IN THE BAG",
      legend: {
        shipped: "SHIPPED AT DEUTSCHE BANK",
        built: "BUILT IN PROJECTS",
        kit: "IN THE KIT BAG",
      },
      position: "POSITION",
      portraitAlt: "Yash Sarda",
      profile: { playingStyle: "Playing style", languages: "Languages", kitBag: "Kit bag" },
      shot: "SHOT",
      comm: "Full kit bag. Still undefeated.",
      next: "ENTER THE TROPHY ROOM",
    },
    trophies: {
      eyebrow: "ACHIEVEMENTS · LIT ONE BY ONE",
      listLabel: "Trophies",
      plinth: "ON THE PLINTH",
      plaqueLabel: "PAPER",
      academy: {
        eyebrow: "EDUCATION",
        aside: "WHERE THE FUNDAMENTALS CAME FROM",
        extras: "EXTRA DRILLS",
      },
      next: "PLAYER CARD",
    },
    card: {
      eyebrow: "RESUME · ONE CARD, EVERYTHING ON IT",
      titleLines: ["PLAYER", "PROFILE"],
      rows: { home: "Home ground", debut: "Pro debut", club: "Current club", academy: "Academy" },
      season: "SEASON",
      number: "THE ARENA · NO. 01",
      position: "POSITION",
      hint: "DRAG TO TILT · CLICK TO FLIP FOR FULL RESUME",
      hintTouch: "TAP TO FLIP",
      flipToBack: "Flip card: show the back",
      flipToFront: "Flip card: show the front",
      backTitle: "THE FULL SHEET",
      back: {
        career: "CAREER STATS",
        highlights: "MATCH HIGHLIGHTS",
        skills: "PLAYER ATTRIBUTES",
        trophies: "TROPHY ROOM",
        contact: "TEAM UP",
      },
      take: "TAKE THE CARD WITH YOU",
      view: { title: "VIEW PLAYER CARD", sub: "FULL RESUME · OPENS AS PDF" },
      download: { title: "DOWNLOAD PDF", sub: "YASH-SARDA-RESUME.PDF" },
      request: { title: "REQUEST RESUME", sub: "OPENS YOUR EMAIL APP" },
      copy: {
        title: "COPY SCOUTING LINK",
        sub: "OPENS STRAIGHT TO QUICK VIEW",
        done: "LINK COPIED ✓",
        fallback: "COPY THIS LINK",
      },
      backNote: {
        label: "ON THE BACK OF THE CARD",
        text: "Career scorecard · Match highlights · Attributes · Trophy room · Academy · Contact — the same facts as the PDF, one tap from flipping.",
        meta: "SOFTWARE ENGINEER 1 · SDE RESUME",
      },
      comm: "Scouts usually stop here. Good call.",
      next: "TEAM UP",
    },
    teamUp: {
      eyebrow: "CONTACT",
      intro: "You've seen how I play. I'd rather be on your side of the net.",
      formats: {
        legend: "CHOOSE YOUR FORMAT",
        sign: { title: "SIGN A PLAYER", sub: "You're hiring for a role." },
        doubles: { title: "DOUBLES", sub: "Let's build something together." },
        rally: { title: "FRIENDLY RALLY", sub: "Just saying hi. Or talking sport." },
      },
      fields: {
        name: "YOUR NAME",
        namePh: "Who's challenging?",
        email: "EMAIL",
        emailPh: "you@company.com",
        message: "THE CHALLENGE",
        messagePh: "The role, the problem, or the match you want to talk about.",
      },
      /** F10: what a visitor who has played starts with, in an empty, untouched message (derived). */
      prefill: "Good game, Yash.",
      errors: {
        name: "Tell me who's challenging.",
        email: "That email doesn't look right.",
        message: "Add a line or two about the challenge (at least 10 characters).",
      },
      send: "SEND CHALLENGE",
      sending: "SENDING…",
      orEmail: "OR EMAIL",
      skip: "OR SKIP THE FORM",
      channels: {
        email: "EMAIL",
        linkedin: "LINKEDIN",
        github: "GITHUB",
        coding: "CODING PROFILES",
        codingSub: "LeetCode · Codeforces · CodeChef — {solved} solved",
      },
      after: {
        label: "AFTER YOU SEND",
        comm: "Challenge received. I'll serve first.",
        text: "Floodlights pulse once, the crowd lifts, and the scoreboard reads",
        board: "NEW FIXTURE · VISITOR vs YASH",
      },
      success: {
        title: "CHALLENGE RECEIVED",
        again: "SEND ANOTHER",
        // The fixture strip on the success panel: the same words as `after.board`, in the parts the board lays out.
        board: { fixture: "NEW FIXTURE", visitor: "VISITOR", versus: "vs", home: "YASH" },
      },
      error: "That didn't go through. Your message is still here.",
      // No form service is set: the visitor's email app is opened with the message ready (nothing has been sent yet).
      mailto: {
        note: "YOUR EMAIL APP SHOULD OPEN WITH THE MESSAGE READY. PRESS SEND THERE.",
        copy: "COPY MESSAGE",
        copied: "MESSAGE COPIED ✓",
      },
      honeypot: "Leave this empty",
    },
  },
  skipToContent: "Skip to content",
  comm: { tag: "COMM" },
  audio: { name: "Crowd audio", label: "CROWD", labelPhone: "SOUND", on: "ON", off: "OFF" },
  /** The hub's short name in the breadcrumb. */
  breadcrumb: {
    hub: HUB,
  },
  /** P6: the OUT OF BOUNDS page (derived, §12 404 row). The heading and description are ui.routes.notFound's. */
  notFound: {
    tried: "You tried",
    hub: BACK_TO_HUB,
    home: "HOME",
  },
  landing: {
    live: "LIVE · THE ARENA",
    player: "PLAYER 01 / 01",
    playerShort: "01 / 01",
    home: "HOME",
    status: "STATUS",
    undefeated: "UNDEFEATED",
    away: "AWAY",
    you: "YOU?",
    challenge: "Think you can beat me?",
    enter: "ENTER THE ARENA",
    enterSub: "INTERACTIVE · ~3 MIN",
    enterSubPhone: "LITE · ONE-THUMB GAMES",
    view: "VIEW PORTFOLIO",
    viewSub: "RECRUITER VIEW · 90 SEC",
    hint: "ENTER ↵ TO PLAY · Q FOR QUICK VIEW",
  },
  intro: {
    live: "LIVE · PLAYER INTRODUCTION",
    matchday: "THE ARENA · MATCHDAY",
    tagline: ["PLAYER 01", "ENGINEER", "BUILDER", "COMPETITOR"],
    introducing: "INTRODUCING",
    number: "NO. 01",
    welcome: "WELCOME TO MY ARENA",
    enter: "ENTER THE ARENA",
    portraitAlt: "Portrait of Yash Sarda",
  },
  routes: {
    home: {
      title: "Yash Sarda — The Arena",
      description:
        "Software Engineer Yash Sarda's portfolio, built as a night-time sports arena. Play against him, or read the 90-second scouting report.",
      heading: "YASH SARDA",
    },
    intro: {
      title: "Player Introduction — The Arena",
      description: "Yash Sarda walks out under the floodlights.",
      heading: "PLAYER INTRODUCTION",
    },
    arena: {
      title: "Arena Hub — The Arena",
      description:
        "Choose your venue: cricket, tennis or badminton. Every game reveals real portfolio content.",
      heading: "CHOOSE YOUR VENUE",
    },
    cricket: {
      title: "Bowl at Me — Cricket Ground",
      description: "Bowl a three-ball over at Yash. Every ball unlocks an innings of his career.",
      heading: "BOWL AT ME",
    },
    tennis: {
      title: "Return of Serve — Centre Court",
      description: "Return Yash's serve. Every return puts a project on the big screen.",
      heading: "RETURN OF SERVE",
    },
    badminton: {
      title: "Smash or Clear — Badminton Hall",
      description: "Play four rallies. Each one charges a group of Yash's skills.",
      heading: "SMASH OR CLEAR",
    },
    fullTime: {
      title: "Full Time — The Arena",
      description: "Your matchday against Yash Sarda: the final score.",
      heading: "FULL TIME",
    },
    career: {
      title: "Career Stats — Yash Sarda",
      description:
        "Yash Sarda's career scorecard: Software Engineer at Deutsche Bank since Jul 2024.",
      heading: "CAREER STATS",
    },
    highlights: {
      title: "Match Highlights — Yash Sarda",
      description: "Yash Sarda's best projects, played as a tournament run.",
      heading: "MATCH HIGHLIGHTS",
    },
    attributes: {
      title: "Player Attributes — Yash Sarda",
      description: "Yash Sarda's skills, shown by evidence: shipped, built or in the kit bag.",
      heading: "PLAYER ATTRIBUTES",
    },
    trophies: {
      title: "Trophy Room — Yash Sarda",
      description:
        "Achievements and education: 750+ problems solved, 99.5 percentile, published research.",
      heading: "TROPHY ROOM",
    },
    card: {
      title: "Player Card — Yash Sarda",
      description: "Yash Sarda's resume as a player card.",
      heading: "PLAYER CARD",
    },
    teamUp: {
      title: "Team Up — Contact Yash Sarda",
      description: "Challenge Yash: hire him, collaborate, or just say hello.",
      heading: "TEAM UP",
    },
    scout: {
      title: "Scouting Report — Yash Sarda",
      description:
        "The 90-second read: who Yash is, what he builds, his stack, his projects and how to reach him.",
      heading: "YASH SARDA",
      navLabel: "SCOUTING REPORT",
    },
    notFound: {
      title: "Out of Bounds — The Arena",
      description: "This page is out of bounds.",
      heading: "OUT OF BOUNDS",
    },
  },
  scout: {
    label: "SCOUTING REPORT",
    sectionsNav: "Sections",
    nav: {
      career: "CAREER",
      highlights: "HIGHLIGHTS",
      attributes: "ATTRIBUTES",
      trophies: "TROPHIES",
      teamUp: "TEAM UP",
    },
    enter: "ENTER THE ARENA",
    enterShort: "ARENA",
    eyebrow: "90-SECOND READ",
    eyebrowMore: "EVERYTHING, NO GAMES",
    problemsSolved: "PROBLEMS SOLVED",
    solved: "SOLVED",
    cgpa: "CGPA",
    resume: {
      view: "VIEW PLAYER CARD (PDF)",
      request: "REQUEST RESUME",
      row: "Resume (PDF)",
      rowRequest: "Request resume",
      fileName: "Yash-Sarda-Resume.pdf",
    },
    teamUpCta: "TEAM UP",
    career: { title: "CAREER STATS", meta: "EXPERIENCE · MOST RECENT FIRST", innings: "INNINGS" },
    highlights: {
      title: "MATCH HIGHLIGHTS",
      meta: "PROJECTS · STRONGEST FIRST",
      swipe: "SWIPE",
      list: "Projects",
      more: "MORE ON GITHUB",
    },
    attributes: {
      title: "PLAYER ATTRIBUTES",
      meta: "SKILLS",
      craft: "CRAFT & TOOLS",
      legend: "FILLED = SHIPPED IN PRODUCTION AT DEUTSCHE BANK",
    },
    trophies: { title: "TROPHY ROOM" },
    academy: { title: "TRAINING ACADEMY" },
    teamUp: {
      eyebrow: "TEAM UP",
      headline: "THINK YOU CAN BEAT ME? LET'S FIND OUT ON A REAL PROBLEM.",
      linkedin: "LinkedIn",
      github: "GitHub",
    },
    footer: { arena: "PREFER THE FULL EXPERIENCE? ENTER THE ARENA" },
    actions: { label: "Quick actions", card: "PLAYER CARD", teamUp: "TEAM UP" },
  },
  hub: {
    hud: "ARENA HUB",
    eyebrow: "THE ARENA HUB",
    record: { yash: "YASH", you: "YOU" }, // the label is ui.record.yours ("YOUR RECORD")
    matchday: {
      label: "MATCHDAY CARD",
      of: "OF",
      venues: "VENUES",
      fixtures: "TODAY'S FIXTURES",
      played: "PLAYED",
      /** What screen readers hear for the bars: "1 of 3 venues played". */
      progress: { of: "of", tail: "venues played" },
    },
    venue: {
      number: "VENUE",
      played: "PLAYED",
      unplayed: "UNPLAYED",
      play: "PLAY",
      skip: "SKIP",
      reveals: "REVEALS",
    },
    venues: {
      cricket: {
        blurb: "Bowl me a 3-ball over. Every ball you bowl unlocks an innings of my career.",
        reveals: "CAREER STATS",
        duration: "~30s",
        category: "CAREER",
        see: "SEE STATS",
      },
      tennis: {
        blurb: "Return my serve. Every shot you get back puts a project on the big screen.",
        reveals: "MATCH HIGHLIGHTS",
        duration: "~12s",
        category: "PROJECTS",
        see: "SEE PROJECTS",
      },
      badminton: {
        blurb: "Hold, release, smash. Every rally won charges one of my player attributes.",
        reveals: "PLAYER ATTRIBUTES",
        duration: "~10s",
        category: "SKILLS",
        see: "SEE SKILLS",
      },
    },
    index: {
      label: "Portfolio index",
      title: "JUMP STRAIGHT TO",
      seen: "SEEN",
      links: {
        career: { label: "Career Stats", tag: "CAREER" },
        highlights: { label: "Match Highlights", tag: "PROJECTS" },
        attributes: { label: "Player Attributes", tag: "SKILLS" },
        trophies: { label: "Trophy Room", tag: "AWARDS" },
        academy: { label: "Training Academy", tag: "EDUCATION" },
        card: { label: "Player Card", tag: "RESUME" },
        teamUp: { label: "Team Up", tag: "CONTACT" },
        scout: { label: "Quick View", tag: "RECRUITER" },
        fullTime: { label: "Full Time", tag: "RESULT" }, // derived
      },
    },
    /** F8: the rail's bottom box, where the artboard draws HIDDEN ACHIEVEMENTS (derived). */
    fullTime: {
      label: "FULL TIME",
      pending: "The final whistle blows after all three venues.",
      done: "Final whistle. Your result is up.",
    },
    facilities: {
      trophies: { label: "ACHIEVEMENTS", title: "TROPHY ROOM", labelPhone: "AWARDS" },
      academy: { label: "EDUCATION", title: "TRAINING ACADEMY", titlePhone: "ACADEMY" },
      card: { label: "RESUME", title: "VIEW PLAYER CARD" },
      teamUp: { label: "CONTACT", title: "TEAM UP" },
    },
    comm: {
      none: "Three venues. One opponent. Pick your ground.",
      one: "One down. Two venues left. Still undefeated.",
      two: "Two down. One venue left. Still undefeated.",
      all: "Full matchday. Still undefeated.",
    },
    // Shown joined by the separator glyph, each part only where it works (drag: a mouse or finger with motion on; keys: a keyboard).
    hint: { drag: "DRAG TO ORBIT", keys: "1 2 3 TO PICK A VENUE" },
    drawer: { open: "INDEX", close: "Close the index" },
  },
  games: {
    /** The score bug's group name for screen readers. */
    bug: "Score",
    rally: "RALLY",
    unlocked: "UNLOCKED",
    /** G9: after two losses at one venue. */
    highlight: "WATCH THE HIGHLIGHT INSTEAD",
    /** F3: the end's main button once all three venues are played. */
    fullTime: "SEE FULL TIME",
    /** Shown by the column under the reveal chip until the first reveal (derived). */
    firstReveal: "EVERY INPUT UNLOCKS SOMETHING",
    /** The phone's SKIP chip: the long "SKIP TO …" is its accessible name (derived). */
    skipShort: "SKIP",
    /** The breadcrumb's first step, back to the Hub (derived). */
    hubLabel: HUB,
    /** The column's quiet third link at the end of a game, where the desktop has the breadcrumb (derived, m-8). */
    backToHub: BACK_TO_HUB,
    /** The speed gun's unit: tennis's serve line and cricket's 3D speed line. */
    kmh: "KM/H",
    cricket: {
      headline: "3 BALLS. ONE BATTER WHO HATES GETTING OUT.",
      how: "Release when the marker hits the yorker zone. Every ball you bowl — dot ball or six — unlocks an innings of my career.",
      screen: "STADIUM SCREEN",
      innings: "INNINGS",
      locked: "LOCKED",
      bowlBall: "BOWL BALL",
      meter: { short: "SHORT", yorker: "YORKER", full: "FULL TOSS" },
      pitch: { yorker: "YORKER", good: "GOOD LENGTH" },
      onStrike: "ON STRIKE",
      bowling: "BOWLING",
      away: "YOU BOWLING",
      ball: "BALL",
      of: "OF",
      over: "OVER COMPLETE",
      notOutMark: "*",
      notOut: "NOT OUT",
      bowl: "BOWL · SPACE",
      bowlPhone: "TAP TO BOWL",
      release: "RELEASE · SPACE", // derived (Phase 8)
      releasePhone: "TAP TO RELEASE", // derived (Phase 8)
      line: {
        label: "LINE",
        keys: "← →",
        off: "OFF",
        middle: "MIDDLE",
        leg: "LEG",
        said: "LINE: {line}",
      }, // derived (Phase 8)
      loading: "PREPARING THE PITCH", // derived (Phase 8)
      how3d:
        "Pick a line, run in, and release when the marker hits the yorker zone. Every ball you bowl — dot ball or six — unlocks an innings of my career.", // derived (Phase 8)
      touchHint: "WIDER YORKER ZONE ON TOUCH · HAPTIC ON RELEASE",
      calls: { dot: "DOT BALL.", four: "FOUR.", six: "SIX." },
      comm: {
        start: "Your ball. Let's see what you've got.",
        dot: "Yorker. Dug out. I respect that.",
        four: "On a length. Still found the gap.",
        six: "Too short. That one is going on the highlight reel.",
        lastPerfect: "Perfect yorker. Flicked off the toes anyway. Still not out.",
        lastGood: "Good ball. Better shot. Career high score updated.",
        lastSix: "Into the second tier. Still not out.",
        beaten: "Beaten! Missed off stump by a whisker.", // derived (Phase 8)
        sixFull: "Full toss. Thank you very much.", // derived (Phase 8)
        lastPerfectOff: "Perfect yorker. Squeezed through point anyway. Still not out.", // derived (Phase 8)
      },
      see: "SEE THE FULL SCORECARD",
      again: "BOWL AGAIN",
      skip: "SKIP TO CAREER STATS",
    },
    tennis: {
      how: "Pick the open side before the bounce.",
      keys: "← →",
      tap: "or tap a side.",
      phoneHint: "SWIPE OR TAP THE OPEN SIDE", // derived
      serving: "SERVING",
      aim: {
        left: "LEFT",
        right: "RIGHT",
        open: "OPEN COURT",
        /** Accessible names (the artboard's aria-labels): "Return to the left", "Return to the right — open court". */
        to: { left: "Return to the left", right: "Return to the right" },
        openName: "open court",
        dash: "—",
      },
      progress: "EACH RETURN UNLOCKS A HIGHLIGHT",
      highlight: "HIGHLIGHT",
      recording: "[SCREEN RECORDING]",
      marquee: {
        highlights: "MATCH HIGHLIGHTS",
        shipped: "ANOTHER PROJECT SHIPPED",
        isNext: "IS NEXT",
        matchPoint: "MATCH POINT",
        allIn: "ALL THREE ON THE BIG SCREEN", // derived
      },
      status: { game: "GAME YASH" }, // derived
      calls: {
        clean: "CLEAN RETURN.",
        returned: "RETURNED.",
        ace: "ACE.",
        wrong: "WRONG SIDE.",
        early: "TOO EARLY.",
        line: "ON THE LINE.",
      }, // derived
      comm: {
        // start: content.commentary.entrance[0]
        shipped: "Another project shipped. He's not letting up.",
        missed: "Ace. The project ships anyway.", // derived
        line: "Clipped the line. Still undefeated.", // derived
      },
      see: "SEE MATCH HIGHLIGHTS", // derived
      skip: "SKIP TO MATCH HIGHLIGHTS",
    },
    badminton: {
      power: "SHOT POWER",
      shots: {
        smash: { name: "SMASH", note: ["Top 20%. Fast,", "but he reads it."] },
        clear: { name: "CLEAR", note: ["Push him", "to the back line."] },
        drop: { name: "DROP", note: ["Soft. Risky.", "Very satisfying."] },
      },
      hold: "HOLD · RELEASE",
      phoneHint: "PRESS AND HOLD · LET GO TO PLAY", // derived
      reading: "READING YOUR GRIP",
      charged: "ATTRIBUTE CHARGED",
      upNext: "UP NEXT",
      matchPoint: "MATCH POINT",
      status: { game: "GAME YASH" }, // derived
      calls: {
        smash: "HE READS IT.",
        clear: "BACK LINE. STILL HIS.",
        drop: "AT THE NET. STILL HIS.",
        perfect: "PERFECT WEIGHT.",
      }, // derived
      comm: {
        start: "Your serve. He's reading your grip.", // derived
        rally: "He reads it. Another attribute charged.", // derived
        perfect: "Perfect weight. He still got there.", // derived
        matchPoint: "Match point. He's done this before.",
        // the final rally: content.commentary.yashWins[0]
      },
      see: "SEE PLAYER ATTRIBUTES", // derived
      skip: "SKIP TO PLAYER ATTRIBUTES",
    },
  },
  /** The Full Time page (Phase 6): every string is derived, the one artboard (Easter-Egg) is the Giant Killer's flip. */
  fullTime: {
    eyebrow: { done: "MATCHDAY COMPLETE", pending: "MATCHDAY IN PROGRESS" }, // derived
    /** The scoreboard's name for screen readers: "Final score: You 0, Yash 3". */
    board: "Final score", // derived
    grades: {
      goodTry: {
        headline: "GOOD TRY.", // derived
        line: "Three venues, three losses. He's had a lot of practice.", // derived
      },
      niceEffort: {
        headline: "NICE EFFORT.", // derived
        line: "Three venues, three losses. But you made him work for it.", // derived
      },
      soClose: {
        headline: "SO CLOSE.", // derived
        line: "Three venues, three losses. You had him worried there.", // derived
      },
    },
    pending: {
      headline: "NOT YET.", // derived
      /** "1 of 3 venues played. The final whistle blows after all three." */
      of: "of", // derived
      played: "venues played.", // derived
      tail: "The final whistle blows after all three.", // derived
    },
    teamUp: {
      eyebrow: "NEXT FIXTURE · OFF THE PITCH", // derived
      title: "TEAM UP WITH YASH", // derived
      body: "Hiring, building something, or just want a rematch? Send him a line.", // derived
      cta: "TEAM UP", // derived
    },
    next: { eyebrow: "NEXT VENUE", cta: "PLAY" }, // derived
    again: "PLAY AGAIN", // derived
    card: "SEE THE PLAYER CARD", // derived
    comm: {
      done: "The crowd's on its feet for the challenger.", // derived
      pending: "Half-time. The rest of the matchday is waiting.", // derived
    },
    note: "SAVED TO YOUR RECORD", // derived
  },
  // Shared by every screen. Links stay in the same tab, as drawn; only a document (the resume PDF) opens a new one, and says so.
  a11y: { newTab: "(opens in a new tab)", copied: "Scouting link copied" },
  glyph: { next: "→", prev: "←", external: "↗", download: "↓", sep: "·", bullet: "•", period: "." },
  record: { ...RECORD, career: `${RECORD.label} ${RECORD.value}` as const, yours: "YOUR RECORD" },
} as const;

export type UiCopy = typeof ui;
export type RouteKey = keyof typeof ui.routes;
