import type { SubjectId, SyllabusTopic, TopicConfidence } from "@/lib/types";

const NOT_STARTED: TopicConfidence = "not_started";

function topic(
  id: string,
  subjectId: SubjectId,
  topicNumber: string,
  title: string,
  parentTopicId?: string
): SyllabusTopic {
  return {
    id,
    subjectId,
    topicNumber,
    title,
    ...(parentTopicId ? { parentTopicId } : {}),
    confidence: NOT_STARTED,
  };
}

// ---------------------------------------------------------------------------
// Math AA HL (Topics 1-5, including AHL extensions)
// ---------------------------------------------------------------------------
function mathTopics(): SyllabusTopic[] {
  const s: SubjectId = "math_aa_hl";
  return [
    // Topic 1 – Number and Algebra
    topic("math-1", s, "1", "Number and Algebra"),
    topic("math-1-1", s, "1.1", "Sequences and series", "math-1"),
    topic("math-1-2", s, "1.2", "Arithmetic and geometric series applications", "math-1"),
    topic("math-1-3", s, "1.3", "Binomial theorem", "math-1"),
    topic("math-1-4", s, "1.4", "Counting principles and permutations", "math-1"),
    topic("math-1-5", s, "1.5", "Complex numbers", "math-1"),
    topic("math-1-6", s, "1.6", "Proof by induction", "math-1"),

    // Topic 2 – Functions
    topic("math-2", s, "2", "Functions"),
    topic("math-2-1", s, "2.1", "Functions and their graphs", "math-2"),
    topic("math-2-2", s, "2.2", "Transformations of graphs", "math-2"),
    topic("math-2-3", s, "2.3", "Quadratic functions", "math-2"),
    topic("math-2-4", s, "2.4", "Rational and polynomial functions", "math-2"),
    topic("math-2-5", s, "2.5", "Exponential and logarithmic functions", "math-2"),
    topic("math-2-6", s, "2.6", "Partial fractions and factor/remainder theorems", "math-2"),

    // Topic 3 – Geometry and Trigonometry
    topic("math-3", s, "3", "Geometry and Trigonometry"),
    topic("math-3-1", s, "3.1", "Trigonometric ratios and identities", "math-3"),
    topic("math-3-2", s, "3.2", "Trigonometric functions and equations", "math-3"),
    topic("math-3-3", s, "3.3", "Vectors", "math-3"),
    topic("math-3-4", s, "3.4", "Vector applications (lines, planes, angles)", "math-3"),
    topic("math-3-5", s, "3.5", "Complex number geometry (Argand plane, de Moivre)", "math-3"),

    // Topic 4 – Statistics and Probability
    topic("math-4", s, "4", "Statistics and Probability"),
    topic("math-4-1", s, "4.1", "Descriptive statistics and data presentation", "math-4"),
    topic("math-4-2", s, "4.2", "Probability concepts and rules", "math-4"),
    topic("math-4-3", s, "4.3", "Discrete probability distributions (binomial, Poisson)", "math-4"),
    topic("math-4-4", s, "4.4", "Continuous distributions (normal)", "math-4"),
    topic("math-4-5", s, "4.5", "Hypothesis testing and statistical inference", "math-4"),

    // Topic 5 – Calculus
    topic("math-5", s, "5", "Calculus"),
    topic("math-5-1", s, "5.1", "Limits and continuity", "math-5"),
    topic("math-5-2", s, "5.2", "Differentiation (rules and techniques)", "math-5"),
    topic("math-5-3", s, "5.3", "Applications of differentiation", "math-5"),
    topic("math-5-4", s, "5.4", "Integration (techniques)", "math-5"),
    topic("math-5-5", s, "5.5", "Applications of integration (area, volume)", "math-5"),
    topic("math-5-6", s, "5.6", "Differential equations", "math-5"),
    topic("math-5-7", s, "5.7", "Maclaurin series", "math-5"),
  ];
}

// ---------------------------------------------------------------------------
// Physics HL (2023+ syllabus: Topics A-E)
// ---------------------------------------------------------------------------
function physicsTopics(): SyllabusTopic[] {
  const s: SubjectId = "physics_hl";
  return [
    // Topic A – Space, time and motion
    topic("physics-a", s, "A", "Space, time and motion"),
    topic("physics-a-1", s, "A.1", "Kinematics", "physics-a"),
    topic("physics-a-2", s, "A.2", "Forces and momentum", "physics-a"),
    topic("physics-a-3", s, "A.3", "Work, energy and power", "physics-a"),
    topic("physics-a-4", s, "A.4", "Rigid body mechanics (HL)", "physics-a"),
    topic("physics-a-5", s, "A.5", "Galilean and special relativity (HL)", "physics-a"),

    // Topic B – The particulate nature of matter
    topic("physics-b", s, "B", "The particulate nature of matter"),
    topic("physics-b-1", s, "B.1", "Thermal energy transfers", "physics-b"),
    topic("physics-b-2", s, "B.2", "Greenhouse effect", "physics-b"),
    topic("physics-b-3", s, "B.3", "Gas laws", "physics-b"),
    topic("physics-b-4", s, "B.4", "Thermodynamics (HL)", "physics-b"),
    topic("physics-b-5", s, "B.5", "Current and circuits", "physics-b"),

    // Topic C – Wave behaviour
    topic("physics-c", s, "C", "Wave behaviour"),
    topic("physics-c-1", s, "C.1", "Simple harmonic motion", "physics-c"),
    topic("physics-c-2", s, "C.2", "Wave model", "physics-c"),
    topic("physics-c-3", s, "C.3", "Wave phenomena (interference, diffraction, standing waves)", "physics-c"),
    topic("physics-c-4", s, "C.4", "Standing waves and resonance", "physics-c"),
    topic("physics-c-5", s, "C.5", "Doppler effect", "physics-c"),

    // Topic D – Fields
    topic("physics-d", s, "D", "Fields"),
    topic("physics-d-1", s, "D.1", "Gravitational fields", "physics-d"),
    topic("physics-d-2", s, "D.2", "Electric and magnetic fields", "physics-d"),
    topic("physics-d-3", s, "D.3", "Motion in electromagnetic fields", "physics-d"),
    topic("physics-d-4", s, "D.4", "Induction (HL)", "physics-d"),

    // Topic E – Nuclear and quantum physics
    topic("physics-e", s, "E", "Nuclear and quantum physics"),
    topic("physics-e-1", s, "E.1", "Structure of the atom", "physics-e"),
    topic("physics-e-2", s, "E.2", "Quantum physics (HL)", "physics-e"),
    topic("physics-e-3", s, "E.3", "Radioactive decay", "physics-e"),
    topic("physics-e-4", s, "E.4", "Fission and fusion", "physics-e"),
    topic("physics-e-5", s, "E.5", "Astrophysics and cosmology", "physics-e"),
  ];
}

// ---------------------------------------------------------------------------
// Computer Science HL (Topics 1-7 + OOP option)
// ---------------------------------------------------------------------------
function csTopics(): SyllabusTopic[] {
  const s: SubjectId = "computer_science_hl";
  return [
    // Topic 1 – System fundamentals
    topic("cs-1", s, "1", "System fundamentals"),
    topic("cs-1-1", s, "1.1", "Systems in organisations", "cs-1"),
    topic("cs-1-2", s, "1.2", "System design basics", "cs-1"),
    topic("cs-1-3", s, "1.3", "System backup and data management", "cs-1"),

    // Topic 2 – Computer organisation
    topic("cs-2", s, "2", "Computer organisation"),
    topic("cs-2-1", s, "2.1", "CPU architecture and machine instruction cycle", "cs-2"),
    topic("cs-2-2", s, "2.2", "Secondary memory and operating systems", "cs-2"),
    topic("cs-2-3", s, "2.3", "Logic gates and Boolean algebra", "cs-2"),

    // Topic 3 – Networks
    topic("cs-3", s, "3", "Networks"),
    topic("cs-3-1", s, "3.1", "Network fundamentals (protocols, topologies)", "cs-3"),
    topic("cs-3-2", s, "3.2", "Web technologies (HTML, CSS, scripting)", "cs-3"),

    // Topic 4 – Computational thinking, problem-solving and programming
    topic("cs-4", s, "4", "Computational thinking, problem-solving and programming"),
    topic("cs-4-1", s, "4.1", "Thinking procedurally and logically", "cs-4"),
    topic("cs-4-2", s, "4.2", "Algorithms (searching, sorting)", "cs-4"),
    topic("cs-4-3", s, "4.3", "Programming fundamentals (variables, loops, conditionals)", "cs-4"),
    topic("cs-4-4", s, "4.4", "Collections and arrays", "cs-4"),

    // Topic 5 – Abstract data structures (HL)
    topic("cs-5", s, "5", "Abstract data structures (HL)"),
    topic("cs-5-1", s, "5.1", "Stacks, queues and linked lists", "cs-5"),
    topic("cs-5-2", s, "5.2", "Trees and binary search trees", "cs-5"),
    topic("cs-5-3", s, "5.3", "Recursion", "cs-5"),

    // Topic 6 – Resource management (HL)
    topic("cs-6", s, "6", "Resource management (HL)"),
    topic("cs-6-1", s, "6.1", "Operating system resource management", "cs-6"),
    topic("cs-6-2", s, "6.2", "Scheduling and multitasking", "cs-6"),

    // Topic 7 – Control (HL)
    topic("cs-7", s, "7", "Control (HL)"),
    topic("cs-7-1", s, "7.1", "Control systems and feedback loops", "cs-7"),

    // Option D – Object-oriented programming
    topic("cs-d", s, "D", "Object-oriented programming (Option D)"),
    topic("cs-d-1", s, "D.1", "Classes, objects and encapsulation", "cs-d"),
    topic("cs-d-2", s, "D.2", "Inheritance and polymorphism", "cs-d"),
    topic("cs-d-3", s, "D.3", "Design patterns and UML", "cs-d"),
  ];
}

// ---------------------------------------------------------------------------
// German Language and Literature SL
// ---------------------------------------------------------------------------
function germanTopics(): SyllabusTopic[] {
  const s: SubjectId = "german_lang_lit_sl";
  return [
    // Area of Exploration 1
    topic("german-aoe1", s, "1", "Readers, writers and texts"),
    topic("german-aoe1-1", s, "1.1", "Purpose and audience in non-literary texts", "german-aoe1"),
    topic("german-aoe1-2", s, "1.2", "Literary analysis techniques", "german-aoe1"),
    topic("german-aoe1-3", s, "1.3", "Stylistic choices and their effects", "german-aoe1"),
    topic("german-aoe1-4", s, "1.4", "Authorial intent and reception", "german-aoe1"),

    // Area of Exploration 2
    topic("german-aoe2", s, "2", "Time and space"),
    topic("german-aoe2-1", s, "2.1", "Context and cultural setting", "german-aoe2"),
    topic("german-aoe2-2", s, "2.2", "Historical and social influences on texts", "german-aoe2"),
    topic("german-aoe2-3", s, "2.3", "Transformation of texts across time", "german-aoe2"),

    // Area of Exploration 3
    topic("german-aoe3", s, "3", "Intertextuality"),
    topic("german-aoe3-1", s, "3.1", "Connecting texts and comparative analysis", "german-aoe3"),
    topic("german-aoe3-2", s, "3.2", "Adaption, allusion and influence", "german-aoe3"),

    // Assessment components
    topic("german-p1", s, "P1", "Paper 1: Guided textual analysis"),
    topic("german-p2", s, "P2", "Paper 2: Comparative essay"),
    topic("german-io", s, "IO", "Individual Oral"),
  ];
}

// ---------------------------------------------------------------------------
// English Language and Literature SL
// ---------------------------------------------------------------------------
function englishTopics(): SyllabusTopic[] {
  const s: SubjectId = "english_lang_lit_sl";
  return [
    // Area of Exploration 1
    topic("english-aoe1", s, "1", "Readers, writers and texts"),
    topic("english-aoe1-1", s, "1.1", "Purpose and audience in non-literary texts", "english-aoe1"),
    topic("english-aoe1-2", s, "1.2", "Literary analysis techniques", "english-aoe1"),
    topic("english-aoe1-3", s, "1.3", "Stylistic choices and their effects", "english-aoe1"),
    topic("english-aoe1-4", s, "1.4", "Authorial intent and reception", "english-aoe1"),

    // Area of Exploration 2
    topic("english-aoe2", s, "2", "Time and space"),
    topic("english-aoe2-1", s, "2.1", "Context and cultural setting", "english-aoe2"),
    topic("english-aoe2-2", s, "2.2", "Historical and social influences on texts", "english-aoe2"),
    topic("english-aoe2-3", s, "2.3", "Transformation of texts across time", "english-aoe2"),

    // Area of Exploration 3
    topic("english-aoe3", s, "3", "Intertextuality"),
    topic("english-aoe3-1", s, "3.1", "Connecting texts and comparative analysis", "english-aoe3"),
    topic("english-aoe3-2", s, "3.2", "Adaption, allusion and influence", "english-aoe3"),

    // Assessment components
    topic("english-p1", s, "P1", "Paper 1: Guided textual analysis"),
    topic("english-p2", s, "P2", "Paper 2: Comparative essay"),
    topic("english-io", s, "IO", "Individual Oral"),
  ];
}

// ---------------------------------------------------------------------------
// Business Management SL (Topics 1-5)
// ---------------------------------------------------------------------------
function businessTopics(): SyllabusTopic[] {
  const s: SubjectId = "business_sl";
  return [
    // Topic 1 – Introduction to business management
    topic("bm-1", s, "1", "Introduction to business management"),
    topic("bm-1-1", s, "1.1", "The nature of business activity", "bm-1"),
    topic("bm-1-2", s, "1.2", "Types of business entities", "bm-1"),
    topic("bm-1-3", s, "1.3", "Business objectives and stakeholders", "bm-1"),
    topic("bm-1-4", s, "1.4", "Growth and evolution of business", "bm-1"),
    topic("bm-1-5", s, "1.5", "External environment (STEEPLE analysis)", "bm-1"),

    // Topic 2 – Human resource management
    topic("bm-2", s, "2", "Human resource management"),
    topic("bm-2-1", s, "2.1", "HR planning and workforce", "bm-2"),
    topic("bm-2-2", s, "2.2", "Organisational structure", "bm-2"),
    topic("bm-2-3", s, "2.3", "Leadership and management styles", "bm-2"),
    topic("bm-2-4", s, "2.4", "Motivation and theories", "bm-2"),

    // Topic 3 – Finance and accounts
    topic("bm-3", s, "3", "Finance and accounts"),
    topic("bm-3-1", s, "3.1", "Sources of finance", "bm-3"),
    topic("bm-3-2", s, "3.2", "Costs and revenues", "bm-3"),
    topic("bm-3-3", s, "3.3", "Break-even analysis", "bm-3"),
    topic("bm-3-4", s, "3.4", "Final accounts (profit & loss, balance sheet)", "bm-3"),
    topic("bm-3-5", s, "3.5", "Profitability and liquidity ratios", "bm-3"),

    // Topic 4 – Marketing
    topic("bm-4", s, "4", "Marketing"),
    topic("bm-4-1", s, "4.1", "Marketing and its role", "bm-4"),
    topic("bm-4-2", s, "4.2", "Market research and segmentation", "bm-4"),
    topic("bm-4-3", s, "4.3", "The marketing mix (4Ps / 7Ps)", "bm-4"),
    topic("bm-4-4", s, "4.4", "E-commerce and digital marketing", "bm-4"),

    // Topic 5 – Operations management
    topic("bm-5", s, "5", "Operations management"),
    topic("bm-5-1", s, "5.1", "Production methods and supply chain", "bm-5"),
    topic("bm-5-2", s, "5.2", "Quality management", "bm-5"),
    topic("bm-5-3", s, "5.3", "Location and scale of production", "bm-5"),
    topic("bm-5-4", s, "5.4", "Crisis and contingency planning", "bm-5"),
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getDefaultSyllabusTopics(): SyllabusTopic[] {
  return [
    ...mathTopics(),
    ...physicsTopics(),
    ...csTopics(),
    ...germanTopics(),
    ...englishTopics(),
    ...businessTopics(),
  ];
}
