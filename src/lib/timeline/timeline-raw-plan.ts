export type TimelineRawItem = {
  time: string;
  text: string;
};

export type TimelineRawDay = {
  date: string;
  dayLabel: string;
  focusedHours: string;
  understanding: string;
  doneLooksLike: string;
  items: TimelineRawItem[];
};

export const RAW_TIMELINE_DAYS: TimelineRawDay[] = [
  {
    date: "2026-04-06",
    dayLabel: "Mon 06 Apr 2026",
    focusedHours: "2.5 h",
    understanding: "Read simple motion graphs confidently and rearrange basic algebra/index rules.",
    doneLooksLike:
      "6-8 kinematics graph questions marked, 10 algebra drills completed, and both error logs created.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: A.1 Kinematics. Rebuild displacement, velocity, acceleration, and graph interpretation, then solve 6-8 short motion-graph questions and mark them properly.",
      },
      {
        time: "11:00-12:15",
        text: "Math: 1.5 Integer Exponents and 1.7 Rational Exponents, Log Laws and Exponential Equations. Rebuild algebra and complete 10 short drills.",
      },
      {
        time: "19:30-20:00",
        text: "General setup: make one Math error log and one Physics error log and keep them open. Admin block only.",
      },
    ],
  },
  {
    date: "2026-04-07",
    dayLabel: "Tue 07 Apr 2026",
    focusedHours: "3.0 h",
    understanding:
      "Draw basic force diagrams correctly and distinguish core business entity types.",
    doneLooksLike:
      "8 force questions marked, one business definition sheet made, and one quick German memory dump completed.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: A.2 Forces and Momentum. Focus on Newton laws, free-body diagrams, friction, tension, and normal force; do 8 short force questions.",
      },
      {
        time: "11:00-12:15",
        text: "Business: Unit 1 1.1 What is a Business and 1.2 Types of Business Entities. Build one-page distinctions between sectors and entity types.",
      },
      {
        time: "19:30-20:00",
        text: "German: comparison note on Tonio Kroger and Die Ladenhueterin. Write from memory and fill major gaps.",
      },
    ],
  },
  {
    date: "2026-04-08",
    dayLabel: "Wed 08 Apr 2026",
    focusedHours: "3.0 h",
    understanding:
      "Know when a sequence is arithmetic vs geometric and how momentum/impulse setup works.",
    doneLooksLike:
      "One short sequence formula page, one marked momentum/collision set, and quick formula recall pass.",
    items: [
      {
        time: "09:30-10:45",
        text: "Math: 1.2 Arithmetic Sequences and Series and 1.3 Geometric Sequences and Series. Drill nth term and sum formulas.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: A.2 Forces and Momentum. Work on momentum, impulse, and collisions; complete 6 short and 2 medium problems.",
      },
      { time: "17:00-17:30", text: "Easy run." },
      {
        time: "19:30-19:45",
        text: "Physics: quick recall from A.1 and A.2.",
      },
      {
        time: "19:45-20:00",
        text: "Math: quick recall of arithmetic and geometric sequence formulas.",
      },
    ],
  },
  {
    date: "2026-04-09",
    dayLabel: "Thu 09 Apr 2026",
    focusedHours: "3.0 h",
    understanding:
      "Explain work, energy, efficiency, and power, and know basic asymptote/intercept meaning.",
    doneLooksLike:
      "8 physics questions marked, one German Paper 1 plan made, and one short functions recall note written.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: A.3 Work, Energy and Power. Rebuild work, kinetic/potential energy, conservation, efficiency, power. Solve 8 mixed questions.",
      },
      {
        time: "11:00-12:15",
        text: "German: German hub. Run a Paper 1 method session on unseen non-literary text and write thesis with paragraph plan.",
      },
      {
        time: "19:30-20:00",
        text: "Math: 2.4 Key Features of Graphs and 2.8 Reciprocal and Simple Rational Functions. Review asymptotes, intercepts, end behaviour.",
      },
    ],
  },
  {
    date: "2026-04-10",
    dayLabel: "Fri 10 Apr 2026",
    focusedHours: "5.0 h",
    understanding:
      "Mechanics basics should connect as one system and first German comparison should exist.",
    doneLooksLike:
      "Two mixed physics sets completed, one business decision sheet written, and one German comparative grid drafted.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: A.1 Kinematics. Mixed set with graph interpretation and constant-acceleration questions.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: A.2 Forces and Momentum. Mixed mechanics set with Newton, force balance, momentum, and collisions.",
      },
      {
        time: "14:00-15:15",
        text: "Business: 1.3 Business Objectives, 1.4 Stakeholders, Unit 1 overview. Build decision sheet for objectives, stakeholder conflicts, and external pressure language.",
      },
      {
        time: "15:30-16:45",
        text: "German: comparison note. First real comparative grid with themes, contrasts, and 2-3 usable references.",
      },
      { time: "17:00-17:30", text: "Easy run." },
    ],
  },
  {
    date: "2026-04-11",
    dayLabel: "Sat 11 Apr 2026",
    focusedHours: "5.5 h",
    understanding:
      "Solve basic current, resistance, and circuit setups and recognize common function families.",
    doneLooksLike:
      "Two B.5 sets marked, two math function blocks finished, and physics error log updated.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: B.5 Current and Circuits. Rebuild charge, current, potential difference, resistance, Ohm's law; short calculations.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: B.5 Current and Circuits. Series, parallel, power, resistance combinations with repeated setup drills.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 2.1 Straight Lines, 2.2 Function Concept, 2.3 Graphing, 2.4 Key Features. Drill lines, notation, domain/range, and graphs.",
      },
      {
        time: "15:30-16:45",
        text: "Math: 2.8 Reciprocal and 2.9 Exponential and Logarithmic Functions. Focus on asymptotes and graph-family recognition.",
      },
      {
        time: "19:30-20:00",
        text: "Physics: mark and rewrite all mistakes into physics error log.",
      },
    ],
  },
  {
    date: "2026-04-12",
    dayLabel: "Sun 12 Apr 2026",
    focusedHours: "5.0 h",
    understanding:
      "Handle thermal and gas-law basics and know finance vocabulary cleanly.",
    doneLooksLike:
      "One thermal set, one gas-laws set, one finance basics sheet, and one German intro/body paragraph.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: B.1 Thermal Energy Transfers. Rebuild heating, energy transfer, specific heat and process language.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: B.3 Gas Laws. Solve pressure-volume-temperature questions and ideal gas manipulations.",
      },
      {
        time: "14:00-15:15",
        text: "Business: 3.1 Intro to Finance, 3.2 Sources, 3.3 Costs and Revenues. Build finance basics sheet and classification questions.",
      },
      {
        time: "15:30-16:45",
        text: "German: German hub. One timed Paper 1 intro plus one full body paragraph from unseen text.",
      },
      { time: "19:30 onwards", text: "Evening fully off." },
    ],
  },
  {
    date: "2026-04-13",
    dayLabel: "Mon 13 Apr 2026",
    focusedHours: "5.5 h",
    understanding:
      "Know core wave relationships and understand derivative meaning geometrically.",
    doneLooksLike:
      "One C.2 set, one C.3 set, one functions-solving set, and one intro calculus set marked.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: C.2 Wave Model. Rebuild wavelength, frequency, period, speed, wave equation; calculation drills.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: C.3 Wave Phenomena. Reflection, refraction, diffraction, interference with sketch-based questions.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 2.10 Solving Equations and 2.11 Transformations of Graphs. Shift/translation and graphical vs analytic solving.",
      },
      {
        time: "15:30-16:45",
        text: "Math: 5.1 Limits and Meaning of Derivative, 5.3 Differentiation of Integer-Power Polynomials, 5.4 Tangents and Normals. Start derivative rebuild.",
      },
      {
        time: "19:30-19:45",
        text: "Physics: quick wave formula recall.",
      },
      { time: "19:45-20:00", text: "Math: quick derivative and tangent-normal recall." },
    ],
  },
  {
    date: "2026-04-14",
    dayLabel: "Tue 14 Apr 2026",
    focusedHours: "5.0 h",
    understanding:
      "Distinguish gravitational-field and electric-field ideas and apply basic marketing tools to a case.",
    doneLooksLike:
      "Two fields blocks completed, one marketing application set written, and one full German Paper 2 plan.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: D.1 Gravitational Fields. Rebuild field strength, potential, force, and orbits.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: D.2 Electric and Magnetic Fields. Electric field and potential reasoning.",
      },
      {
        time: "14:00-15:15",
        text: "Business: 4.1 Introduction to Marketing, 4.2 Marketing Planning, 4.4 Market Research. Learn tools and write one short application for each.",
      },
      {
        time: "15:30-16:45",
        text: "German: comparison note on Tonio Kroger and Die Ladenhueterin. Plan one full Paper 2 response and select useful references.",
      },
      { time: "17:15-17:45", text: "Walk outside." },
    ],
  },
  {
    date: "2026-04-15",
    dayLabel: "Wed 15 Apr 2026",
    focusedHours: "5.0 h",
    understanding:
      "Follow charged-particle motion setups, use basic trig tools, and actively code Java basics.",
    doneLooksLike:
      "Two field blocks marked, one trig block done, and one short Java practice file or handwritten session.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: D.2 Electric and Magnetic Fields. Charged-particle direction work and magnetic field problems.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: D.3 Motion in Electromagnetic Fields. Cross-field and circular-motion style questions.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 3.2 Sine Rule, Cosine Rule and Triangle Area; 3.4 Radians/Arc Length/Sector Area; 3.5 Unit Circle and Exact Values; 3.6 Trig identities. Build trig foundations.",
      },
      {
        time: "15:30-16:45",
        text: "Computer Science: Java Rebuild Checklist. Relearn classes, objects, constructors, methods, arrays with active coding.",
      },
      { time: "17:00-17:30", text: "Easy run." },
    ],
  },
  {
    date: "2026-04-16",
    dayLabel: "Thu 16 Apr 2026",
    focusedHours: "5.5 h",
    understanding:
      "Know atom/quantum basics and read ratio/cash-flow/investment questions without panic.",
    doneLooksLike:
      "Two nuclear/quantum blocks marked, one finance applications block finished, and one full German unseen outline.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: E.1 Structure of the Atom. Rebuild atomic model, nucleons, isotopes, notation.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: E.2 Quantum Physics. Focus on photoelectric and photon equations and common traps.",
      },
      {
        time: "14:00-15:15",
        text: "Business: 3.4 Final Accounts, 3.5 Ratio Analysis, 3.7 Cash Flow, 3.8 Investment Appraisal. Do one ratio set and one mini investment case.",
      },
      {
        time: "15:30-16:45",
        text: "German: German hub. Build one full unseen-text outline and convert it into essay structure.",
      },
      {
        time: "19:30-19:45",
        text: "Physics: formula review from D and E topics.",
      },
      { time: "19:45-20:00", text: "Math: quick trig and derivative recall." },
    ],
  },
  {
    date: "2026-04-17",
    dayLabel: "Fri 17 Apr 2026",
    focusedHours: "5.0 h",
    understanding:
      "Do half-life work correctly, distinguish fission vs fusion, use vectors and scalar products cleanly.",
    doneLooksLike:
      "One decay set, one nuclear comparison set, one vector set, and one mixed physics MCQ set.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: E.3 Radioactive Decay. Half-life, decay equations, graphs, and constants.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: E.4 Fission and E.5 Fusion and Stars. Study compare/contrast and energy-release patterns.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 3.12 Vector Basics and 3.13 Scalar Product. Rebuild vector notation, magnitude, direction, and dot products.",
      },
      {
        time: "15:30-16:45",
        text: "Physics: Syllabus map. Mixed Paper 1 mechanics/thermal/electricity MCQ set and mark it thoroughly.",
      },
      { time: "17:00-17:30", text: "Easy run." },
    ],
  },
  {
    date: "2026-04-18",
    dayLabel: "Sat 18 Apr 2026",
    focusedHours: "5.5 h",
    understanding:
      "Know torque/equilibrium and relativity basics; explain operations and location choices.",
    doneLooksLike:
      "Two Theme A blocks done, one operations answer written, and two German intro/thesis starts.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: A.4 Rigid Body Mechanics. Torque, equilibrium, and rotational thinking.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: A.5 Galilean and Special Relativity. Learn basic time dilation, length contraction, and frame language.",
      },
      {
        time: "14:00-15:15",
        text: "Business: 5.1 Introduction to Operations, 5.2 Operations Methods, 5.4 Location. Learn tools and do one decision-style answer.",
      },
      {
        time: "15:30-16:45",
        text: "German: comparison note. Write thesis lines and intros for two Paper 2 prompts.",
      },
      { time: "19:30-20:00", text: "German: light review of strongest contrasts and references." },
    ],
  },
  {
    date: "2026-04-19",
    dayLabel: "Sun 19 Apr 2026",
    focusedHours: "5.0 h",
    understanding:
      "Know SHM and standing-wave basics; have usable English Paper 1 workflow.",
    doneLooksLike:
      "One SHM set, one resonance plus Doppler review, one business case skim, and one English Paper 1 plan.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: C.1 Simple Harmonic Motion. Rebuild displacement, velocity, acceleration, phase, and graph language.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: C.4 Standing Waves and Resonance plus Theme C overview. Work standing waves, resonance conditions, frequency shift logic for Doppler.",
      },
      {
        time: "14:00-15:15",
        text: "Business: Business SL Paper System. Controlled case-study pass on Abraca terms and context; stop after one focused pass.",
      },
      {
        time: "15:30-16:45",
        text: "English: English Paper 1 System. Annotate one unseen non-literary text and write full paragraph order.",
      },
      { time: "17:00-17:30", text: "Easy run." },
      { time: "19:30 onwards", text: "Evening fully off." },
    ],
  },
  {
    date: "2026-04-20",
    dayLabel: "Mon 20 Apr 2026",
    focusedHours: "5.5 h",
    understanding:
      "Know induction basics and remove randomness around logs, partial fractions, and complex arithmetic.",
    doneLooksLike:
      "One induction set, one B.2/B.4 set, one timed German Paper 1, one math cleanup block finished.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: D.4 Induction. Rebuild flux change, induced emf, direction rules, and graph patterns.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: B.2 Greenhouse Effect and B.4 Thermodynamics. Build standard reasoning and first-law chain.",
      },
      {
        time: "14:00-15:15",
        text: "German: German hub. Write one timed Paper 1 response.",
      },
      {
        time: "15:30-16:45",
        text: "Math: 1.5 Integer Exponents, 1.7 Log Laws, 1.11 Partial Fractions, 1.12 Complex Numbers. Mix algebra cleanup and first touch on complex arithmetic/Argand.",
      },
      { time: "19:30-20:00", text: "Physics: mark work and update error log only." },
    ],
  },
  {
    date: "2026-04-21",
    dayLabel: "Tue 21 Apr 2026",
    focusedHours: "5.5 h",
    understanding: "Mechanics review and business tools should connect directly to case application.",
    doneLooksLike:
      "One mixed mechanics set, one longer mechanics Paper 2 set, one business response, and one Abraca toolkit page.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: Theme A overview. Full mechanics mixed set from A.1 to A.4.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: Theme A overview. Longer mechanics Paper 2 style questions with full working.",
      },
      {
        time: "14:00-15:15",
        text: "Business: Business SL Paper System. Run structured Paper 2 response block with concise application.",
      },
      {
        time: "15:30-16:45",
        text: "Business: 1.4 Stakeholders, 1.5 Growth and Evolution, 4.2 Marketing Planning. Build toolkit for SWOT, stakeholder analysis, STEEPLE, growth options.",
      },
      { time: "19:30-20:00", text: "German: quick theme recall and comparison refresh." },
    ],
  },
  {
    date: "2026-04-22",
    dayLabel: "Wed 22 Apr 2026",
    focusedHours: "5.0 h",
    understanding:
      "Waves should be in review mode and German Paper 2 should be writable under time pressure.",
    doneLooksLike:
      "One mixed waves review, one waves/electricity set, one timed German essay, one CS inheritance/recursion session.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: Theme C overview. Full waves review set across SHM, model, phenomena, standing waves, Doppler.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: Theme C overview. Paper 1 mixed waves and electricity set.",
      },
      {
        time: "14:00-15:15",
        text: "German: comparison note. Write one timed Paper 2 essay.",
      },
      {
        time: "15:30-16:45",
        text: "Computer Science: Java Rebuild Checklist. Focus on inheritance, polymorphism, ArrayList, recursion and tracing.",
      },
      { time: "17:00-17:30", text: "Easy run." },
    ],
  },
  {
    date: "2026-04-23",
    dayLabel: "Thu 23 Apr 2026",
    focusedHours: "5.5 h",
    understanding:
      "Fields and circuits should be revision territory; English comparison should have a real skeleton.",
    doneLooksLike:
      "One mixed fields set, one circuits review set, one mixed business set, and one English comparison grid.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: Theme D overview. Mixed review across D.1 to D.4.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: B.5 Current and Circuits. Mixed circuits set with clean redraw of circuit setups.",
      },
      {
        time: "14:00-15:15",
        text: "Business: Unit 3 overview and Unit 5 overview. Finance plus operations mixed questions with evaluation.",
      },
      {
        time: "15:30-16:45",
        text: "English: English Paper 2 Comparative System and Comparative Grid. Build comparison grid for Death of a Salesman and A Doll's House.",
      },
      { time: "19:30-20:00", text: "Physics: quick recall of weakest field/circuit formulas." },
    ],
  },
  {
    date: "2026-04-24",
    dayLabel: "Fri 24 Apr 2026",
    focusedHours: "5.0 h",
    understanding:
      "Theme B and E should feel consolidated; business case answers should be shorter and sharper.",
    doneLooksLike:
      "One mixed thermal/nuclear/quantum review, one half Paper 1, one timed German Paper 1, and one business mini-answer set.",
    items: [
      {
        time: "09:30-10:45",
        text: "Physics: Theme B and Theme E overview. Mixed thermal, nuclear, quantum review set.",
      },
      {
        time: "11:00-12:15",
        text: "Physics: Half Paper 1 under strict timed conditions.",
      },
      {
        time: "14:00-15:15",
        text: "German: German hub. Write another timed Paper 1 and compare against the one from 20 Apr.",
      },
      {
        time: "15:30-16:45",
        text: "Business: Business SL Paper System. Paper 1 case mini-answers focused on short application and recommendations.",
      },
      { time: "17:00-17:30", text: "Easy run." },
    ],
  },
  {
    date: "2026-04-25",
    dayLabel: "Sat 25 Apr 2026",
    focusedHours: "5.5 h",
    understanding:
      "Know exact physics weak points and strongest German Paper 2 material.",
    doneLooksLike:
      "One half Paper 2 timed and marked, one last-weak-spots sheet, one repaired German paragraph, and one short business drill.",
    items: [
      {
        time: "09:30-12:15",
        text: "Physics: Half Paper 2 timed full two-block window. No note checking.",
      },
      {
        time: "14:00-15:15",
        text: "Physics: Mark half-paper brutally and make one sheet of last weak spots.",
      },
      {
        time: "15:30-16:45",
        text: "German: comparison note cleanup of final comparison grid plus one repaired body paragraph.",
      },
      {
        time: "19:30-20:00",
        text: "Business: one short Paper 2 drill only, then stop.",
      },
    ],
  },
  {
    date: "2026-04-26",
    dayLabel: "Sun 26 Apr 2026",
    focusedHours: "5.0 h",
    understanding:
      "Today is confidence and recall only, with no new learning.",
    doneLooksLike:
      "One German Paper 1 warm plan, one German Paper 2 recall session, 10 mixed physics questions, and one light business skim.",
    items: [
      {
        time: "09:30-10:45",
        text: "German: German hub. Final Paper 1 session: one clean plan and opening paragraph.",
      },
      {
        time: "11:00-12:15",
        text: "German: comparison note. Final Paper 2 session: themes, contrasts, structure, and 6-8 flexible references.",
      },
      {
        time: "14:00-15:15",
        text: "Physics: Physics syllabus map. Formula recall plus 10 short mixed questions only.",
      },
      {
        time: "15:30-16:45",
        text: "Business: Business SL Paper System definitions, case skim, light structure review only.",
      },
      { time: "19:30 onwards", text: "Evening fully off and early sleep." },
    ],
  },
  {
    date: "2026-04-27",
    dayLabel: "Mon 27 Apr 2026",
    focusedHours: "2.0 h",
    understanding: "Warm up German briefly and keep energy protected; evening physics should stay light.",
    doneLooksLike: "One clean German warm-up and one short physics formula+MCQ refresh.",
    items: [
      {
        time: "09:30-10:30",
        text: "German: German hub. Warm-up only. Annotate one text and write one thesis.",
      },
      {
        time: "13:00",
        text: "German Lang Lit SL Paper 1 (exam).",
      },
      {
        time: "18:30-19:30",
        text: "Physics: syllabus map formula sheet with 8 MCQ, then stop.",
      },
    ],
  },
  {
    date: "2026-04-28",
    dayLabel: "Tue 28 Apr 2026",
    focusedHours: "1.5 h",
    understanding:
      "Stay calm with two exams; no cramming between them.",
    doneLooksLike:
      "One short German theme glance before exam and one business Unit 1 plus case skim after Physics.",
    items: [
      {
        time: "07:50-08:20",
        text: "German: comparison note themes only. No new material.",
      },
      {
        time: "09:00",
        text: "German Lang Lit SL Paper 2 (exam).",
      },
      {
        time: "13:00",
        text: "Physics HL Paper 1A + 1B (exam).",
      },
      {
        time: "18:30-19:30",
        text: "Business: Unit 1 overview and Business SL Paper System. Unit 1 plus Abraca skim only.",
      },
    ],
  },
  {
    date: "2026-04-29",
    dayLabel: "Wed 29 Apr 2026",
    focusedHours: "1.25 h",
    understanding:
      "Do only a formula glance for Physics; then switch to light CS review after exams.",
    doneLooksLike:
      "One ultra-short Physics warm-up and one light CS Paper 1 review hour.",
    items: [
      {
        time: "08:15-08:30",
        text: "Physics: syllabus map formula glance only.",
      },
      {
        time: "09:00",
        text: "Physics HL Paper 2 (exam).",
      },
      {
        time: "13:00",
        text: "Business SL Paper 1 (exam).",
      },
      {
        time: "18:00-19:00",
        text: "Computer Science: Paper Strategy light Paper 1 review with syntax and tracing.",
      },
    ],
  },
  {
    date: "2026-04-30",
    dayLabel: "Thu 30 Apr 2026",
    focusedHours: "0.75 h",
    understanding:
      "After two exams, do not push heavy CS; organize next step only.",
    doneLooksLike:
      "One short CS Paper 2 and Paper 3 weak-spots checklist.",
    items: [
      {
        time: "09:00",
        text: "Business SL Paper 2 (exam).",
      },
      {
        time: "13:00",
        text: "Computer Science HL Paper 1 (exam).",
      },
      {
        time: "18:30-19:15",
        text: "Computer Science: Paper Strategy and Java Rebuild checklist for Paper 2 and Paper 3 weak spots.",
      },
    ],
  },
  {
    date: "2026-05-01",
    dayLabel: "Fri 01 May 2026",
    focusedHours: "5.0 h",
    understanding:
      "Java syntax should be active again and English Paper 1 should restart cleanly.",
    doneLooksLike:
      "Two Java blocks, one Paper 3 summary page, and one English plan plus body paragraph.",
    items: [
      {
        time: "09:30-10:45",
        text: "Computer Science: Java Rebuild Checklist. Classes, constructors, method calls, encapsulation.",
      },
      {
        time: "11:00-12:15",
        text: "Computer Science: Java Rebuild Checklist. Arrays, ArrayList, loops, searching, sorting.",
      },
      {
        time: "14:00-15:15",
        text: "Computer Science: Paper Strategy. Read Paper 3 case materials and make one-page issue summary.",
      },
      {
        time: "15:30-16:45",
        text: "English: English Paper 1 System. One full plan and one strong body paragraph.",
      },
      { time: "17:00-17:30", text: "Easy run." },
    ],
  },
  {
    date: "2026-05-02",
    dayLabel: "Sat 02 May 2026",
    focusedHours: "5.5 h",
    understanding:
      "CS should move into timed mode and Math restart should become concrete.",
    doneLooksLike:
      "One timed coding set, one Paper 3 drill, one English comparison grid, and one math asymptote/inverse/complex refresh.",
    items: [
      {
        time: "09:30-10:45",
        text: "Computer Science: Java Rebuild Checklist. Timed coding with constructors, loops, arrays, methods.",
      },
      {
        time: "11:00-12:15",
        text: "Computer Science: Paper Strategy. Paper 3 likely-question drill.",
      },
    ],
  },
  {
    date: "2026-05-03",
    dayLabel: "Sun 03 May 2026",
    focusedHours: "5.0 h",
    understanding:
      "Identify CS weak spots and keep both English papers active again.",
    doneLooksLike:
      "One CS weak-pattern redo, one timed English Paper 1, two English Paper 2 plans, one math algebra block.",
    items: [
      {
        time: "09:30-10:45",
        text: "Computer Science: Java Rebuild Checklist. Redo weakest coding patterns and trace by hand.",
      },
      {
        time: "11:00-12:15",
        text: "English: English Paper 1 System. Write one full timed Paper 1 response.",
      },
      {
        time: "14:00-15:15",
        text: "English: English Paper 2 Comparative System and Comparative Grid. Build thesis bank and two full Paper 2 plans.",
      },
      {
        time: "15:30-16:45",
        text: "Math: 1.5, 1.7, and 1.11. Algebra repair and calculator discipline.",
      },
      { time: "17:00-17:30", text: "Easy run." },
      { time: "19:30 onwards", text: "Evening off." },
    ],
  },
  {
    date: "2026-05-04",
    dayLabel: "Mon 04 May 2026",
    focusedHours: "1.0 h",
    understanding:
      "After CS exams, only light English refresh then recover.",
    doneLooksLike:
      "One short English comparative refresh hour then stop.",
    items: [
      {
        time: "09:00",
        text: "Computer Science HL Paper 2 + Paper 3 session (exam).",
      },
      {
        time: "17:00-18:00",
        text: "English: English Paper 2 Comparative System. Light comparative refresh only.",
      },
    ],
  },
  {
    date: "2026-05-05",
    dayLabel: "Tue 05 May 2026",
    focusedHours: "5.0 h",
    understanding:
      "English themes should be stable; math restart should now include probability.",
    doneLooksLike:
      "One English Paper 2 theme session, one English close read, one math sequences-plus-probability block, one math functions block.",
    items: [
      {
        time: "09:30-10:45",
        text: "English: English Paper 2 Comparative System and Comparative Grid. Main themes and flexible pairings.",
      },
      {
        time: "11:00-12:15",
        text: "English: English Paper 1 System. Close reading of a difficult non-literary text.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 1.2, 1.3, 4.5, and 4.8. Sequences then first-pass probability and binomial.",
      },
      {
        time: "15:30-16:45",
        text: "Math: 2.8, 2.9, 2.5. Rational/log/exp graphs plus inverse/composite basics.",
      },
      { time: "17:00-17:30", text: "Easy run." },
    ],
  },
  {
    date: "2026-05-06",
    dayLabel: "Wed 06 May 2026",
    focusedHours: "5.5 h",
    understanding:
      "English in exam mode and math trig/calculus actively usable under time pressure.",
    doneLooksLike:
      "One timed English Paper 1, one Paper 2 partial response, one calculus rules block, one trig-solving block.",
    items: [
      {
        time: "09:30-10:45",
        text: "English: English Paper 1 System. Full timed Paper 1 plus quick self-mark.",
      },
      {
        time: "11:00-12:15",
        text: "English: English Paper 2 Comparative System. One timed plan, intro, and body paragraph.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 5.6 and 5.4. Product, quotient, chain rules; tangent and normal practice.",
      },
      {
        time: "15:30-16:45",
        text: "Math: 3.4, 3.6, 3.8. Make trig equations and formula links less random.",
      },
      { time: "19:30-20:00", text: "Math: practice formula booklet navigation." },
    ],
  },
  {
    date: "2026-05-07",
    dayLabel: "Thu 07 May 2026",
    focusedHours: "2.0 h",
    understanding:
      "Light warm-up and stop on time; avoid overwork after the exam.",
    doneLooksLike:
      "One English warm-up and one short post-exam Paper 2 refresh.",
    items: [
      {
        time: "09:30-10:30",
        text: "English: English Paper 1 System warm-up, annotate one text and write one thesis.",
      },
      {
        time: "13:00",
        text: "English Lang Lit SL Paper 1 (exam).",
      },
      {
        time: "18:00-19:00",
        text: "English: English Paper 2 Comparative System comparative refresh only.",
      },
    ],
  },
  {
    date: "2026-05-08",
    dayLabel: "Fri 08 May 2026",
    focusedHours: "1.5 h",
    understanding:
      "After English, start an honest math diagnostic.",
    doneLooksLike:
      "One mixed math diagnostic set and clear list of weak topics.",
    items: [
      {
        time: "09:00",
        text: "English Lang Lit SL Paper 2 (exam).",
      },
      {
        time: "15:30-17:00",
        text: "Math: Math hub mixed diagnostic and ugly-topic list.",
      },
    ],
  },
  {
    date: "2026-05-09",
    dayLabel: "Sat 09 May 2026",
    focusedHours: "5.0 h",
    understanding:
      "Move number/algebra and functions from 'knowing' to execution.",
    doneLooksLike:
      "Three targeted math blocks and one Paper 1 short-question set.",
    items: [
      {
        time: "09:30-10:45",
        text: "Math: 1.5, 1.7, 1.11. Logs, exponents, algebra repair, partial fractions.",
      },
      {
        time: "11:00-12:15",
        text: "Math: 1.2, 1.3, 1.4, 1.9. Fast arithmetic/geometric short questions.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 2.2, 2.5, 2.11, 2.13. Domain/range, inverse/composite, transformations, asymptotes.",
      },
      {
        time: "15:30-16:45",
        text: "Math: Paper 1 short questions from covered topics.",
      },
      { time: "17:00-17:30", text: "Easy run." },
    ],
  },
  {
    date: "2026-05-10",
    dayLabel: "Sun 10 May 2026",
    focusedHours: "5.0 h",
    understanding:
      "Trig, vectors, and probability should become review topics.",
    doneLooksLike:
      "One trig block, one vectors block, one stats/prob block, one mixed Paper 1 set.",
    items: [
      {
        time: "09:30-10:45",
        text: "Math: 3.5, 3.6, 3.8. Trig identities and equation solving.",
      },
      {
        time: "11:00-12:15",
        text: "Math: 3.12, 3.13, 3.14. Vector notation, dot products, line equations.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 4.8, 4.9, 4.11, 4.12. Binomial, normal, conditional probability, standardization.",
      },
      {
        time: "15:30-16:45",
        text: "Math: mixed Paper 1 set.",
      },
      { time: "19:30 onwards", text: "Evening off." },
    ],
  },
  {
    date: "2026-05-11",
    dayLabel: "Mon 11 May 2026",
    focusedHours: "5.0 h",
    understanding:
      "Bring calculus core and HL calculus techniques into timed usability.",
    doneLooksLike:
      "Three calculus blocks and one Paper 2 calculator set.",
    items: [
      {
        time: "09:30-10:45",
        text: "Math: 5.6, 5.7, 5.8. Differentiation rules, chain/product/quotient, graph behaviour.",
      },
      {
        time: "11:00-12:15",
        text: "Math: 5.8, 5.9, 5.11. Optimization, kinematics, and areas.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 5.14, 5.16, 5.15. Implicit differentiation, substitution, parts, advanced derivative/integral work.",
      },
      {
        time: "15:30-16:45",
        text: "Math: Paper 2 calculator set focused on calculus and functions.",
      },
      { time: "17:00-17:30", text: "Easy run." },
    ],
  },
  {
    date: "2026-05-12",
    dayLabel: "Tue 12 May 2026",
    focusedHours: "5.5 h",
    understanding:
      "Complex numbers should be second-pass; HL-only topics should be recognizable and workable.",
    doneLooksLike:
      "One complex block, one proof/systems block, one HL-only block, and one Paper 3 extended set.",
    items: [
      {
        time: "09:30-10:45",
        text: "Math: 1.12, 1.13, 1.14. Complex numbers in Cartesian/polar/Euler and De Moivre second-pass.",
      },
      {
        time: "11:00-12:15",
        text: "Math: 1.14, 1.16, 1.15. De Moivre, systems of equations, induction/contradiction/counterexample.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 5.18, 5.19, 2.15. Differential equations, Maclaurin series, inequalities between functions.",
      },
      {
        time: "15:30-16:45",
        text: "Math: Paper 3 style extended problem set.",
      },
      { time: "19:30-20:00", text: "Math: recall only, no new content." },
    ],
  },
  {
    date: "2026-05-13",
    dayLabel: "Wed 13 May 2026",
    focusedHours: "5.0 h",
    understanding:
      "Simulate first, mark second, patch weak spots only after marking.",
    doneLooksLike:
      "One full Paper 1, one mistakes sheet, one targeted redo block.",
    items: [
      {
        time: "09:30-12:15",
        text: "Math: full Paper 1 timed at exam time.",
      },
      {
        time: "14:00-15:15",
        text: "Math: mark Paper 1 brutally and build one-page Last Mistakes sheet.",
      },
      {
        time: "15:30-16:45",
        text: "Math: redo only blank or wrong questions.",
      },
      { time: "19:30 onwards", text: "Evening off." },
    ],
  },
  {
    date: "2026-05-14",
    dayLabel: "Thu 14 May 2026",
    focusedHours: "2.0 h",
    understanding:
      "Keep warm-up light and shift to Paper 2 mode after exam.",
    doneLooksLike:
      "One light warm-up and one short Paper 2 refresh block.",
    items: [
      {
        time: "09:45-10:30",
        text: "Math: light no-calculator warm-up with one algebra, one trig, and one derivative question.",
      },
      {
        time: "13:00",
        text: "Math AA HL Paper 1 (exam).",
      },
      {
        time: "18:00-19:15",
        text: "Math: light calculator routine plus stats, functions, and calculus refresh for Paper 2.",
      },
    ],
  },
  {
    date: "2026-05-15",
    dayLabel: "Fri 15 May 2026",
    focusedHours: "1.25 h",
    understanding:
      "After Paper 2, diagnose specific Paper 3 weaknesses.",
    doneLooksLike: "One Paper 3 diagnosis list with four weak areas.",
    items: [
      {
        time: "09:00",
        text: "Math AA HL Paper 2 (exam).",
      },
      {
        time: "16:00-17:15",
        text: "Math: diagnose Paper 3 with four weakest HL areas.",
      },
      {
        time: "17:30-18:00",
        text: "Easy run or long walk.",
      },
    ],
  },
  {
    date: "2026-05-16",
    dayLabel: "Sat 16 May 2026",
    focusedHours: "5.5 h",
    understanding:
      "Differential equations, complex/vectors, and Maclaurin/L'Hopital should all be active Paper 3 topics.",
    doneLooksLike:
      "Three HL-topic blocks and one timed extended problem marked.",
    items: [
      {
        time: "09:30-10:45",
        text: "Math: 5.18 Differential Equations. Separation, setup, interpretation.",
      },
      {
        time: "11:00-12:15",
        text: "Math: 1.12, 1.13, 3.17, 3.18. Complex numbers plus vectors/planes.",
      },
      {
        time: "14:00-15:15",
        text: "Math: 5.13 l'Hopital and 5.19 Maclaurin Series limits and series cleanup.",
      },
      {
        time: "15:30-16:45",
        text: "Math: one full Paper 3 style extended problem timed.",
      },
      {
        time: "19:30-20:00",
        text: "Math: mark only.",
      },
    ],
  },
  {
    date: "2026-05-17",
    dayLabel: "Sun 17 May 2026",
    focusedHours: "5.0 h",
    understanding:
      "Proof and advanced vectors should now be clearer than before.",
    doneLooksLike:
      "One proof block, one advanced vectors block, one timed extended problem, one model-methods page.",
    items: [
      {
        time: "09:30-10:45",
        text: "Math: 1.15 Induction, contradiction, and counterexample method practice.",
      },
      {
        time: "11:00-12:15",
        text: "Math: 3.16, 3.17, 3.18. Advanced vectors and planes.",
      },
      {
        time: "14:00-15:15",
        text: "Math: second Paper 3 style extended problem timed.",
      },
      {
        time: "15:30-16:45",
        text: "Math: write model methods for every mistake.",
      },
      { time: "19:30 onwards", text: "Evening off." },
    ],
  },
  {
    date: "2026-05-18",
    dayLabel: "Mon 18 May 2026",
    focusedHours: "5.0 h",
    understanding:
      "Paper 3 styles should feel familiar even if still difficult.",
    doneLooksLike:
      "Two mixed Paper 3 sets, one weakest-type redo, one calm summary sheet.",
    items: [
      {
        time: "09:30-10:45",
        text: "Math: mixed Paper 3 set focused on calculus and modeling.",
      },
      {
        time: "11:00-12:15",
        text: "Math: mixed Paper 3 set focused on complex numbers and vectors.",
      },
      {
        time: "14:00-15:15",
        text: "Math: redo weakest Paper 3 question type until setup is stable.",
      },
      {
        time: "15:30-16:45",
        text: "Math: formula booklet navigation and calm summary sheet.",
      },
      {
        time: "17:00-17:30",
        text: "Easy run.",
      },
    ],
  },
  {
    date: "2026-05-19",
    dayLabel: "Tue 19 May 2026",
    focusedHours: "2.5 h",
    understanding:
      "Be sharp but calm; avoid panic and end by scheduled hard stop.",
    doneLooksLike: "One hard Paper 3 question, one error-log review, and hard stop by 17:00.",
    items: [
      {
        time: "09:30-10:45",
        text: "Math: one hard Paper 3 question only.",
      },
      {
        time: "11:00-12:15",
        text: "Math: error-log review, calculator fluency, calm recall.",
      },
      { time: "15:00 onwards", text: "Outside time and recovery. No hard work after 17:00." },
    ],
  },
  {
    date: "2026-05-20",
    dayLabel: "Wed 20 May 2026",
    focusedHours: "0.75 h",
    understanding:
      "Only wake up methods; avoid draining before final Paper 3.",
    doneLooksLike: "One ultra-light warm-up and then full stop before exam.",
    items: [
      {
        time: "10:00-10:45",
        text: "Math: ultra-light warm-up with one mini complex-number, one mini vector, and one mini differential-equation setup.",
      },
      {
        time: "13:00",
        text: "Math AA HL Paper 3 (exam).",
      },
    ],
  },
];
