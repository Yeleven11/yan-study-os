import type { TimelineEntryKind } from "@/lib/types";

export type TimelineEnrichmentKind = TimelineEntryKind | "recovery";

export interface TimelineEnrichmentEntry {
  date: string;
  startTime: string;
  endTime: string;
  kind: TimelineEnrichmentKind;
  subject: string;
  title: string;
  summary: string;
  checklist: string[];
  successCriteria: string[];
  whyThisMatters: string;
  loggingPrompt?: string;
  recoveryPrompt?: string;
  rewardPrompt?: string;
}

export const TIMELINE_ENRICHMENT_ENTRIES: TimelineEnrichmentEntry[] = [
  {
    "date": "2026-04-06",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-06",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "A.1 Kinematics",
    "summary": "This block focuses on A.1 Kinematics. Rebuild displacement, velocity, acceleration, and graph interpretation from memory, then do `6-8` short motion-graph questions and mark them properly. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rebuild displacement, velocity, acceleration, and graph interpretation from memory,.",
      "Then do `6-8` short motion-graph questions and mark them properly.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Rebuild displacement, velocity, acceleration, and graph interpretation from memory, then do `6-8` short motion-graph questions and mark them properly.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in A.1 Kinematics still costs you the most time or marks?",
    "rewardPrompt": "Nice. A.1 Kinematics is a little less chaotic now."
  },
  {
    "date": "2026-04-06",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "1.5 Integer Exponents and Introductory Logarithms",
    "summary": "This block focuses on 1.5 Integer Exponents and Introductory Logarithms. Use this as algebra repair: fractions, rearranging equations, index laws, calculator fluency, then `10` short drills. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Use this as algebra repair: fractions, rearranging equations, index laws, calculator fluency,.",
      "Then `10` short drills.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Use this as algebra repair: fractions, rearranging equations, index laws, calculator fluency, then `10` short drills.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.5 Integer Exponents and Introductory Logarithms still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.5 Integer Exponents and Introductory Logarithms just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-06",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-06",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-06",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-06",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "admin",
    "subject": "none",
    "title": "General setup",
    "summary": "This block is for getting the system set up so the rest of the plan has somewhere to land. It is small, but it makes every later correction easier to track.",
    "checklist": [
      "Create the Math error log.",
      "Create the Physics error log.",
      "Leave both logs easy to open during future blocks."
    ],
    "successCriteria": [
      "Both logs exist and are ready to use immediately.",
      "You will not have to improvise your tracking system later."
    ],
    "whyThisMatters": "If mistakes are not captured somewhere, they just keep repeating. This block gives your practice a memory.",
    "loggingPrompt": "Are both logs ready enough that future mistakes will actually get written down?",
    "rewardPrompt": "Good. The plan has a backbone now."
  },
  {
    "date": "2026-04-06",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-06",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-07",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-07",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "A.2 Forces and Momentum",
    "summary": "This block focuses on A.2 Forces and Momentum. Focus on Newton's laws, free-body diagrams, friction, tension, and normal force, then do `8` short force questions. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Focus on newton's laws, free-body diagrams, friction, tension, and normal force,.",
      "Then do `8` short force questions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Focus on Newton's laws, free-body diagrams, friction, tension, and normal force, then do `8` short force questions.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in A.2 Forces and Momentum still costs you the most time or marks?",
    "rewardPrompt": "Nice. A.2 Forces and Momentum is a little less chaotic now."
  },
  {
    "date": "2026-04-07",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Business",
    "title": "1.1 What is a Business",
    "summary": "This block focuses on 1.1 What is a Business. Learn the core definitions and build a one-page distinction sheet for sectors, public/private, profit/non-profit, and common entity types. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Learn the core definitions and build a one-page distinction sheet for sectors, public/private, profit/non-profit, and common entity types.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for 1.1 What is a Business is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from 1.1 What is a Business still feels least natural to write?",
    "rewardPrompt": "Solid. 1.1 What is a Business is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-07",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-07",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-07",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-07",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "German",
    "title": "Comparison note",
    "summary": "This block focuses on Comparison note. Write from memory what you remember about both works, then fill the biggest gaps. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Write from memory what you remember about both works,.",
      "Then fill the biggest gaps.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for Comparison note is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Comparison note felt strongest today?",
    "rewardPrompt": "Nice work. Comparison note now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-07",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-07",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-08",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-08",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "1.2 Arithmetic Sequences and Series",
    "summary": "This block focuses on 1.2 Arithmetic Sequences and Series. Drill nth term, common difference, common ratio, and sum questions until the formulas feel automatic. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Drill nth term, common difference, common ratio, and sum questions until the formulas feel automatic.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 1.2 Arithmetic Sequences and Series is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.2 Arithmetic Sequences and Series still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.2 Arithmetic Sequences and Series just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-08",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "A.2 Forces and Momentum",
    "summary": "This block focuses on A.2 Forces and Momentum. Shift to momentum, impulse, and collision questions; do `6` short and `2` medium problems. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Shift to momentum, impulse, and collision questions; do `6` short and `2` medium problems.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Shift to momentum, impulse, and collision questions; do `6` short and `2` medium problems.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in A.2 Forces and Momentum still costs you the most time or marks?",
    "rewardPrompt": "Nice. A.2 Forces and Momentum is a little less chaotic now."
  },
  {
    "date": "2026-04-08",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-08",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-08",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-08",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-08",
    "startTime": "19:30",
    "endTime": "19:45",
    "kind": "study",
    "subject": "Physics",
    "title": "Quick formula recall from A",
    "summary": "This block focuses on Quick formula recall from A. 1 and A.2. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "1 and a.2.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: 1 and A.2.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Quick formula recall from A still costs you the most time or marks?",
    "rewardPrompt": "Nice. Quick formula recall from A is a little less chaotic now."
  },
  {
    "date": "2026-04-08",
    "startTime": "19:45",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Math",
    "title": "Quick recall of arithmetic and geometric sequence",
    "summary": "This block focuses on Quick recall of arithmetic and geometric sequence. formulas. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Formulas.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Quick recall of arithmetic and geometric sequence is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Quick recall of arithmetic and geometric sequence still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Quick recall of arithmetic and geometric sequence just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-08",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-08",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-09",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-09",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "A.3 Work, Energy and Power",
    "summary": "This block focuses on A.3 Work, Energy and Power. Rebuild work done, kinetic and potential energy, conservation, efficiency, and power, then do `8` mixed questions. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rebuild work done, kinetic and potential energy, conservation, efficiency, and power,.",
      "Then do `8` mixed questions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Rebuild work done, kinetic and potential energy, conservation, efficiency, and power, then do `8` mixed questions.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in A.3 Work, Energy and Power still costs you the most time or marks?",
    "rewardPrompt": "Nice. A.3 Work, Energy and Power is a little less chaotic now."
  },
  {
    "date": "2026-04-09",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "German",
    "title": "German hub",
    "summary": "This block focuses on German hub. Do a Paper 1 method session: annotate one unseen non-literary text for audience, purpose, tone, structure, and language choices, then write a clean thesis and paragraph plan. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Do a paper 1 method session: annotate one unseen non-literary text for audience, purpose, tone, structure, and language choices,.",
      "Then write a clean thesis and paragraph plan.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do a Paper 1 method session: annotate one unseen non-literary text for audience, purpose, tone, structure, and language choices, then write a clean thesis and paragraph plan.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from German hub felt strongest today?",
    "rewardPrompt": "Nice work. German hub now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-09",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-09",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-09",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-09",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Math",
    "title": "2.4 Key Features of Graphs",
    "summary": "This block focuses on 2.4 Key Features of Graphs. Learn what asymptotes, intercepts, and end behavior actually look like. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Learn what asymptotes, intercepts, and end behavior actually look like.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 2.4 Key Features of Graphs is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 2.4 Key Features of Graphs still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 2.4 Key Features of Graphs just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-09",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-09",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-10",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-10",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "A.1 Kinematics",
    "summary": "This block focuses on A.1 Kinematics. Mixed kinematics set with graph interpretation plus constant-acceleration questions. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Mixed kinematics set with graph interpretation plus constant-acceleration questions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for A.1 Kinematics is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in A.1 Kinematics still costs you the most time or marks?",
    "rewardPrompt": "Nice. A.1 Kinematics is a little less chaotic now."
  },
  {
    "date": "2026-04-10",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "A.2 Forces and Momentum",
    "summary": "This block focuses on A.2 Forces and Momentum. Mixed mechanics set with Newton, force balance, momentum, and collisions. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Mixed mechanics set with newton, force balance, momentum, and collisions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for A.2 Forces and Momentum is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in A.2 Forces and Momentum still costs you the most time or marks?",
    "rewardPrompt": "Nice. A.2 Forces and Momentum is a little less chaotic now."
  },
  {
    "date": "2026-04-10",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-10",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-10",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Business",
    "title": "1.3 Business Objectives",
    "summary": "This block focuses on 1.3 Business Objectives. Build a short decision sheet for objectives, stakeholder conflicts, and external-pressure language. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Build a short decision sheet for objectives, stakeholder conflicts, and external-pressure language.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for 1.3 Business Objectives is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from 1.3 Business Objectives still feels least natural to write?",
    "rewardPrompt": "Solid. 1.3 Business Objectives is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-10",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "German",
    "title": "Comparison note",
    "summary": "This block focuses on Comparison note. Make your first real comparative grid with themes, contrasts, and `2-3` usable references for each work. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Make your first real comparative grid with themes, contrasts, and `2-3` usable references for each work.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Make your first real comparative grid with themes, contrasts, and `2-3` usable references for each work.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Comparison note felt strongest today?",
    "rewardPrompt": "Nice work. Comparison note now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-10",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-10",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-10",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-10",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-11",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-11",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "B.5 Current and Circuits",
    "summary": "This block focuses on B.5 Current and Circuits. Rebuild charge, current, potential difference, resistance, and Ohm's law, then do short calculations fast. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rebuild charge, current, potential difference, resistance, and ohm's law,.",
      "Then do short calculations fast.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for B.5 Current and Circuits is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in B.5 Current and Circuits still costs you the most time or marks?",
    "rewardPrompt": "Nice. B.5 Current and Circuits is a little less chaotic now."
  },
  {
    "date": "2026-04-11",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "B.5 Current and Circuits",
    "summary": "This block focuses on B.5 Current and Circuits. Do series, parallel, power, and resistance-combination problems until you can set them up without guessing. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do series, parallel, power, and resistance-combination problems until you can set them up without guessing.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for B.5 Current and Circuits is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in B.5 Current and Circuits still costs you the most time or marks?",
    "rewardPrompt": "Nice. B.5 Current and Circuits is a little less chaotic now."
  },
  {
    "date": "2026-04-11",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-11",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-11",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "2.1 Straight Lines",
    "summary": "This block focuses on 2.1 Straight Lines. Drill lines, notation, domain/range, intercepts, and reading graphs. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Drill lines, notation, domain/range, intercepts, and reading graphs.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 2.1 Straight Lines is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 2.1 Straight Lines still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 2.1 Straight Lines just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-11",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "2.8 Reciprocal and Simple Rational Functions",
    "summary": "This block focuses on 2.8 Reciprocal and Simple Rational Functions. and 2.9 Exponential and Logarithmic Functions. Focus hard on asymptotes, graph shape, and how to tell which function family you are seeing. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "And 2.9 exponential and logarithmic functions. focus hard on asymptotes, graph shape, and how to tell which function family you are seeing.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: and 2.9 Exponential and Logarithmic Functions. Focus hard on asymptotes, graph shape, and how to tell which function family you are seeing.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 2.8 Reciprocal and Simple Rational Functions still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 2.8 Reciprocal and Simple Rational Functions just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-11",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-11",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Physics",
    "title": "Mark the whole day's circuit work and",
    "summary": "This block focuses on Mark the whole day's circuit work and. rewrite every mistake into the physics error log. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rewrite every mistake into the physics error log.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Mark the whole day's circuit work and is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Mark the whole day's circuit work and still costs you the most time or marks?",
    "rewardPrompt": "Nice. Mark the whole day's circuit work and is a little less chaotic now."
  },
  {
    "date": "2026-04-11",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-11",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-12",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-12",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "B.1 Thermal Energy Transfers",
    "summary": "This block focuses on B.1 Thermal Energy Transfers. Rebuild heating, energy transfer, specific heat style calculations, and process language. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rebuild heating, energy transfer, specific heat style calculations, and process language.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for B.1 Thermal Energy Transfers is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in B.1 Thermal Energy Transfers still costs you the most time or marks?",
    "rewardPrompt": "Nice. B.1 Thermal Energy Transfers is a little less chaotic now."
  },
  {
    "date": "2026-04-12",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "B.3 Gas Laws",
    "summary": "This block focuses on B.3 Gas Laws. Do pressure-volume-temperature questions and basic ideal-gas style manipulations. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do pressure-volume-temperature questions and basic ideal-gas style manipulations.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for B.3 Gas Laws is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in B.3 Gas Laws still costs you the most time or marks?",
    "rewardPrompt": "Nice. B.3 Gas Laws is a little less chaotic now."
  },
  {
    "date": "2026-04-12",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-12",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-12",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Business",
    "title": "3.1 Introduction to Finance",
    "summary": "This block focuses on 3.1 Introduction to Finance. Build a clean finance basics sheet and do a few classification questions. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Build a clean finance basics sheet and do a few classification questions.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for 3.1 Introduction to Finance is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from 3.1 Introduction to Finance still feels least natural to write?",
    "rewardPrompt": "Solid. 3.1 Introduction to Finance is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-12",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "German",
    "title": "German hub",
    "summary": "This block focuses on German hub. Do one timed Paper 1 intro plus one full body paragraph from an unseen text. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Do one timed paper 1 intro plus one full body paragraph from an unseen text.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do one timed Paper 1 intro plus one full body paragraph from an unseen text.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from German hub felt strongest today?",
    "rewardPrompt": "Nice work. German hub now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-12",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-12",
    "startTime": "19:30",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening fully off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-12",
    "startTime": "19:30",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-12",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-12",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-13",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-13",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "C.2 Wave Model",
    "summary": "This block focuses on C.2 Wave Model. Rebuild wavelength, frequency, period, speed, and the basic wave equation, then do quick calculation drills. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rebuild wavelength, frequency, period, speed, and the basic wave equation,.",
      "Then do quick calculation drills.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for C.2 Wave Model is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in C.2 Wave Model still costs you the most time or marks?",
    "rewardPrompt": "Nice. C.2 Wave Model is a little less chaotic now."
  },
  {
    "date": "2026-04-13",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "C.3 Wave Phenomena",
    "summary": "This block focuses on C.3 Wave Phenomena. Do reflection, refraction, diffraction, and interference questions, with sketches where needed. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do reflection, refraction, diffraction, and interference questions, with sketches where needed.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for C.3 Wave Phenomena is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in C.3 Wave Phenomena still costs you the most time or marks?",
    "rewardPrompt": "Nice. C.3 Wave Phenomena is a little less chaotic now."
  },
  {
    "date": "2026-04-13",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-13",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-13",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "2.10 Solving Equations",
    "summary": "This block focuses on 2.10 Solving Equations. Focus on solving graphically vs analytically and on translation, reflection, and stretch questions. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Focus on solving graphically vs analytically and on translation, reflection, and stretch questions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 2.10 Solving Equations is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 2.10 Solving Equations still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 2.10 Solving Equations just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-13",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "5.1 Limits and the Meaning of the Derivative",
    "summary": "This block focuses on 5.1 Limits and the Meaning of the Derivative. Start the derivative rebuild properly. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Start the derivative rebuild properly.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 5.1 Limits and the Meaning of the Derivative is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 5.1 Limits and the Meaning of the Derivative still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 5.1 Limits and the Meaning of the Derivative just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-13",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-13",
    "startTime": "19:30",
    "endTime": "19:45",
    "kind": "study",
    "subject": "Physics",
    "title": "Quick wave formula recall",
    "summary": "This block focuses on Quick wave formula recall. quick wave formula recall. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Quick wave formula recall.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Quick wave formula recall is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Quick wave formula recall still costs you the most time or marks?",
    "rewardPrompt": "Nice. Quick wave formula recall is a little less chaotic now."
  },
  {
    "date": "2026-04-13",
    "startTime": "19:45",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Math",
    "title": "Quick derivative and tangent-normal recall",
    "summary": "This block focuses on Quick derivative and tangent-normal recall. quick derivative and tangent-normal recall. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Quick derivative and tangent-normal recall.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Quick derivative and tangent-normal recall is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Quick derivative and tangent-normal recall still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Quick derivative and tangent-normal recall just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-13",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-13",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-14",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-14",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "D.1 Gravitational Fields",
    "summary": "This block focuses on D.1 Gravitational Fields. Rebuild field strength, potential, force, and orbit-style relationships. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rebuild field strength, potential, force, and orbit-style relationships.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for D.1 Gravitational Fields is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in D.1 Gravitational Fields still costs you the most time or marks?",
    "rewardPrompt": "Nice. D.1 Gravitational Fields is a little less chaotic now."
  },
  {
    "date": "2026-04-14",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "D.2 Electric and Magnetic Fields",
    "summary": "This block focuses on D.2 Electric and Magnetic Fields. Focus on electric field basics and electric potential reasoning. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Focus on electric field basics and electric potential reasoning.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for D.2 Electric and Magnetic Fields is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in D.2 Electric and Magnetic Fields still costs you the most time or marks?",
    "rewardPrompt": "Nice. D.2 Electric and Magnetic Fields is a little less chaotic now."
  },
  {
    "date": "2026-04-14",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-14",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-14",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Business",
    "title": "4.1 Introduction to Marketing",
    "summary": "This block focuses on 4.1 Introduction to Marketing. Learn the tool language and do one short application answer for each. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Learn the tool language and do one short application answer for each.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for 4.1 Introduction to Marketing is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from 4.1 Introduction to Marketing still feels least natural to write?",
    "rewardPrompt": "Solid. 4.1 Introduction to Marketing is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-14",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "German",
    "title": "Comparison note",
    "summary": "This block focuses on Comparison note. Plan one full Paper 2 response on a shared theme and decide which references you would actually use. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Plan one full paper 2 response on a shared theme and decide which references you would actually use.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Plan one full Paper 2 response on a shared theme and decide which references you would actually use.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Comparison note felt strongest today?",
    "rewardPrompt": "Nice work. Comparison note now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-14",
    "startTime": "17:15",
    "endTime": "17:45",
    "kind": "outside",
    "subject": "none",
    "title": "Walk outside",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-14",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-14",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-14",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-15",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-15",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "D.2 Electric and Magnetic Fields",
    "summary": "This block focuses on D.2 Electric and Magnetic Fields. Shift to magnetic fields and charged-particle direction work. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Shift to magnetic fields and charged-particle direction work.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for D.2 Electric and Magnetic Fields is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in D.2 Electric and Magnetic Fields still costs you the most time or marks?",
    "rewardPrompt": "Nice. D.2 Electric and Magnetic Fields is a little less chaotic now."
  },
  {
    "date": "2026-04-15",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "D.3 Motion in Electromagnetic Fields",
    "summary": "This block focuses on D.3 Motion in Electromagnetic Fields. Practice cross-field and circular-motion style problems. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Practice cross-field and circular-motion style problems.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for D.3 Motion in Electromagnetic Fields is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in D.3 Motion in Electromagnetic Fields still costs you the most time or marks?",
    "rewardPrompt": "Nice. D.3 Motion in Electromagnetic Fields is a little less chaotic now."
  },
  {
    "date": "2026-04-15",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-15",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-15",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "3.2 Sine Rule, Cosine Rule and Triangle Area",
    "summary": "This block focuses on 3.2 Sine Rule, Cosine Rule and Triangle Area. 3.4 Radians, Arc Length and Sector Area, 3.5 Unit Circle and Exact Values, and 3.6 Fundamental Trig Identities and Double Angle. This is your trig foundations block. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "3.4 radians, arc length and sector area, 3.5 unit circle and exact values, and 3.6 fundamental trig identities and double angle. this is your trig foundations block.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: 3.4 Radians, Arc Length and Sector Area, 3.5 Unit Circle and Exact Values, and 3.6 Fundamental Trig Identities and Double Angle. This is your trig foundations block.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 3.2 Sine Rule, Cosine Rule and Triangle Area still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 3.2 Sine Rule, Cosine Rule and Triangle Area just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-15",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Java Rebuild Checklist",
    "summary": "This block focuses on Java Rebuild Checklist. Relearn classes, objects, constructors, methods, and arrays by writing tiny examples yourself. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Relearn classes, objects, constructors, methods, and arrays by writing tiny examples yourself.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The named task for Java Rebuild Checklist is finished in writing or on paper, not just skimmed.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Java Rebuild Checklist would you still want one more rep on?",
    "rewardPrompt": "Nice. Java Rebuild Checklist is staying active instead of rusting in the background."
  },
  {
    "date": "2026-04-15",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-15",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-15",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-15",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-16",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-16",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "E.1 Structure of the Atom",
    "summary": "This block focuses on E.1 Structure of the Atom. Rebuild the atomic model, nucleons, isotopes, and standard notation. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rebuild the atomic model, nucleons, isotopes, and standard notation.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for E.1 Structure of the Atom is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in E.1 Structure of the Atom still costs you the most time or marks?",
    "rewardPrompt": "Nice. E.1 Structure of the Atom is a little less chaotic now."
  },
  {
    "date": "2026-04-16",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "E.2 Quantum Physics",
    "summary": "This block focuses on E.2 Quantum Physics. Focus on photoelectric-effect style reasoning, photon equations, and the standard conceptual traps. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Focus on photoelectric-effect style reasoning, photon equations, and the standard conceptual traps.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for E.2 Quantum Physics is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in E.2 Quantum Physics still costs you the most time or marks?",
    "rewardPrompt": "Nice. E.2 Quantum Physics is a little less chaotic now."
  },
  {
    "date": "2026-04-16",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-16",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-16",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Business",
    "title": "3.4 Final Accounts",
    "summary": "This block focuses on 3.4 Final Accounts. Do one ratio set and one investment appraisal mini-case. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Do one ratio set and one investment appraisal mini-case.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for 3.4 Final Accounts is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from 3.4 Final Accounts still feels least natural to write?",
    "rewardPrompt": "Solid. 3.4 Final Accounts is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-16",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "German",
    "title": "German hub",
    "summary": "This block focuses on German hub. Build one full unseen-text outline and make sure you can turn it into an essay under time. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Build one full unseen-text outline and make sure you can turn it into an essay under time.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for German hub is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from German hub felt strongest today?",
    "rewardPrompt": "Nice work. German hub now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-16",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-16",
    "startTime": "19:30",
    "endTime": "19:45",
    "kind": "study",
    "subject": "Physics",
    "title": "Formula review from D and E topics",
    "summary": "This block focuses on Formula review from D and E topics. formula review from D and E topics. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Formula review from d and e topics.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Formula review from D and E topics is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Formula review from D and E topics still costs you the most time or marks?",
    "rewardPrompt": "Nice. Formula review from D and E topics is a little less chaotic now."
  },
  {
    "date": "2026-04-16",
    "startTime": "19:45",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Math",
    "title": "Quick trig and derivative recall",
    "summary": "This block focuses on Quick trig and derivative recall. quick trig and derivative recall. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Quick trig and derivative recall.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Quick trig and derivative recall is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Quick trig and derivative recall still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Quick trig and derivative recall just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-16",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-16",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-17",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-17",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "E.3 Radioactive Decay",
    "summary": "This block focuses on E.3 Radioactive Decay. Drill half-life, decay equations, graph interpretation, and decay constants. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Drill half-life, decay equations, graph interpretation, and decay constants.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for E.3 Radioactive Decay is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in E.3 Radioactive Decay still costs you the most time or marks?",
    "rewardPrompt": "Nice. E.3 Radioactive Decay is a little less chaotic now."
  },
  {
    "date": "2026-04-17",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "E.4 Fission",
    "summary": "This block focuses on E.4 Fission. Learn the usual compare/contrast and energy-release patterns. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Learn the usual compare/contrast and energy-release patterns.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for E.4 Fission is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in E.4 Fission still costs you the most time or marks?",
    "rewardPrompt": "Nice. E.4 Fission is a little less chaotic now."
  },
  {
    "date": "2026-04-17",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-17",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-17",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "3.12 Vector Basics in 2D and 3D",
    "summary": "This block focuses on 3.12 Vector Basics in 2D and 3D. Rebuild vector notation, magnitude, direction, and scalar-product angle work. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Rebuild vector notation, magnitude, direction, and scalar-product angle work.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 3.12 Vector Basics in 2D and 3D is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 3.12 Vector Basics in 2D and 3D still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 3.12 Vector Basics in 2D and 3D just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-17",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Physics",
    "title": "Physics syllabus map",
    "summary": "This block focuses on Physics syllabus map. Do a mixed Paper 1 style mechanics-thermal-electricity MCQ set and mark it hard. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do a mixed paper 1 style mechanics-thermal-electricity mcq set and mark it hard.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do a mixed Paper 1 style mechanics-thermal-electricity MCQ set and mark it hard.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Physics syllabus map still costs you the most time or marks?",
    "rewardPrompt": "Nice. Physics syllabus map is a little less chaotic now."
  },
  {
    "date": "2026-04-17",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-17",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-17",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-17",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-18",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-18",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "A.4 Rigid Body Mechanics",
    "summary": "This block focuses on A.4 Rigid Body Mechanics. Work on torque, equilibrium, turning effects, and rotational thinking. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Work on torque, equilibrium, turning effects, and rotational thinking.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for A.4 Rigid Body Mechanics is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in A.4 Rigid Body Mechanics still costs you the most time or marks?",
    "rewardPrompt": "Nice. A.4 Rigid Body Mechanics is a little less chaotic now."
  },
  {
    "date": "2026-04-18",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "A.5 Galilean and Special Relativity",
    "summary": "This block focuses on A.5 Galilean and Special Relativity. Learn the basic time dilation, length contraction, and frame language without overcomplicating it. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Learn the basic time dilation, length contraction, and frame language without overcomplicating it.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for A.5 Galilean and Special Relativity is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in A.5 Galilean and Special Relativity still costs you the most time or marks?",
    "rewardPrompt": "Nice. A.5 Galilean and Special Relativity is a little less chaotic now."
  },
  {
    "date": "2026-04-18",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-18",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-18",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Business",
    "title": "5.1 Introduction to Operations Management",
    "summary": "This block focuses on 5.1 Introduction to Operations Management. Learn the operations tools and do one decision-style answer. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Learn the operations tools and do one decision-style answer.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for 5.1 Introduction to Operations Management is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from 5.1 Introduction to Operations Management still feels least natural to write?",
    "rewardPrompt": "Solid. 5.1 Introduction to Operations Management is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-18",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "German",
    "title": "Comparison note",
    "summary": "This block focuses on Comparison note. Write thesis bank lines and intros for two different Paper 2 questions. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Write thesis bank lines and intros for two different paper 2 questions.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Write thesis bank lines and intros for two different Paper 2 questions.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Comparison note felt strongest today?",
    "rewardPrompt": "Nice work. Comparison note now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-18",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-18",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "German",
    "title": "Light review of your best contrasts and",
    "summary": "This block focuses on Light review of your best contrasts and. references. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "References.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for Light review of your best contrasts and is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Light review of your best contrasts and felt strongest today?",
    "rewardPrompt": "Nice work. Light review of your best contrasts and now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-18",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-18",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-19",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-19",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "C.1 Simple Harmonic Motion",
    "summary": "This block focuses on C.1 Simple Harmonic Motion. Rebuild displacement, velocity, acceleration, phase, and graph language. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rebuild displacement, velocity, acceleration, phase, and graph language.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for C.1 Simple Harmonic Motion is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in C.1 Simple Harmonic Motion still costs you the most time or marks?",
    "rewardPrompt": "Nice. C.1 Simple Harmonic Motion is a little less chaotic now."
  },
  {
    "date": "2026-04-19",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "C.4 Standing Waves and Resonance",
    "summary": "This block focuses on C.4 Standing Waves and Resonance. Focus on standing-wave patterns, resonance conditions, and the frequency-shift logic you need for Doppler questions. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Focus on standing-wave patterns, resonance conditions, and the frequency-shift logic you need for doppler questions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for C.4 Standing Waves and Resonance is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in C.4 Standing Waves and Resonance still costs you the most time or marks?",
    "rewardPrompt": "Nice. C.4 Standing Waves and Resonance is a little less chaotic now."
  },
  {
    "date": "2026-04-19",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-19",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-19",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Business",
    "title": "Business SL Paper System",
    "summary": "This block focuses on Business SL Paper System. Spend a controlled case-study block on Abraca terms, context, and likely application angles. Stop after one focused pass. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Spend a controlled case-study block on abraca terms, context, and likely application angles. stop after one focused pass.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for Business SL Paper System is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from Business SL Paper System still feels least natural to write?",
    "rewardPrompt": "Solid. Business SL Paper System is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-19",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 1 System",
    "summary": "This block focuses on English Paper 1 System. Annotate one unseen non-literary text, write the thesis, and make the whole paragraph order. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Annotate one unseen non-literary text, write the thesis, and make the whole paragraph order.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for English Paper 1 System is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 1 System would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 1 System is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-04-19",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-19",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-19",
    "startTime": "19:30",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-19",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-19",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-20",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-20",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "D.4 Induction",
    "summary": "This block focuses on D.4 Induction. Rebuild flux change, induced emf, direction rules, and common graph patterns. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Rebuild flux change, induced emf, direction rules, and common graph patterns.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for D.4 Induction is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in D.4 Induction still costs you the most time or marks?",
    "rewardPrompt": "Nice. D.4 Induction is a little less chaotic now."
  },
  {
    "date": "2026-04-20",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "B.2 Greenhouse Effect",
    "summary": "This block focuses on B.2 Greenhouse Effect. Learn the standard explanation chains and first-law style reasoning. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Learn the standard explanation chains and first-law style reasoning.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for B.2 Greenhouse Effect is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in B.2 Greenhouse Effect still costs you the most time or marks?",
    "rewardPrompt": "Nice. B.2 Greenhouse Effect is a little less chaotic now."
  },
  {
    "date": "2026-04-20",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-20",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-20",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "German",
    "title": "German hub",
    "summary": "This block focuses on German hub. Write one timed Paper 1 response. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Write one timed paper 1 response.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Write one timed Paper 1 response.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from German hub felt strongest today?",
    "rewardPrompt": "Nice work. German hub now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-20",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "1.5 Integer Exponents and Introductory Logarithms",
    "summary": "This block focuses on 1.5 Integer Exponents and Introductory Logarithms. Use the first half for algebra cleanup and the last `25-30 min` for a first touch on complex arithmetic and Argand plotting, so complex numbers are not brand new in the final week. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Use the first half for algebra cleanup and the last `25-30 min` for a first touch on complex arithmetic and argand plotting, so complex numbers are not brand new in the final week.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Use the first half for algebra cleanup and the last `25-30 min` for a first touch on complex arithmetic and Argand plotting, so complex numbers are not brand new in the final week.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.5 Integer Exponents and Introductory Logarithms still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.5 Integer Exponents and Introductory Logarithms just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-04-20",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-20",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Physics",
    "title": "Mark only and update the error log",
    "summary": "This block focuses on Mark only and update the error log. mark only and update the error log. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Mark only and update the error log.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Mark only and update the error log is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Mark only and update the error log still costs you the most time or marks?",
    "rewardPrompt": "Nice. Mark only and update the error log is a little less chaotic now."
  },
  {
    "date": "2026-04-20",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-20",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-21",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-21",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "Theme A overview",
    "summary": "This block focuses on Theme A overview. Do a full mechanics mixed set from A.1 to A.4. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do a full mechanics mixed set from a.1 to a.4.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do a full mechanics mixed set from A.1 to A.4.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Theme A overview still costs you the most time or marks?",
    "rewardPrompt": "Nice. Theme A overview is a little less chaotic now."
  },
  {
    "date": "2026-04-21",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "Theme A overview",
    "summary": "This block focuses on Theme A overview. Do longer Paper 2 style mechanics questions and write full working, not shortcuts. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do longer paper 2 style mechanics questions and write full working, not shortcuts.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do longer Paper 2 style mechanics questions and write full working, not shortcuts.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Theme A overview still costs you the most time or marks?",
    "rewardPrompt": "Nice. Theme A overview is a little less chaotic now."
  },
  {
    "date": "2026-04-21",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-21",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-21",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Business",
    "title": "Business SL Paper System",
    "summary": "This block focuses on Business SL Paper System. Do a proper Paper 2 structured-response block with concise application. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Do a proper paper 2 structured-response block with concise application.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do a proper Paper 2 structured-response block with concise application.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from Business SL Paper System still feels least natural to write?",
    "rewardPrompt": "Solid. Business SL Paper System is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-21",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Business",
    "title": "1.4 Stakeholders",
    "summary": "This block focuses on 1.4 Stakeholders. Build an Abraca toolkit for SWOT, stakeholder analysis, STEEPLE, and growth options. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Build an abraca toolkit for swot, stakeholder analysis, steeple, and growth options.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for 1.4 Stakeholders is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from 1.4 Stakeholders still feels least natural to write?",
    "rewardPrompt": "Solid. 1.4 Stakeholders is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-21",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-21",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "German",
    "title": "Quick theme recall and comparison refresh",
    "summary": "This block focuses on Quick theme recall and comparison refresh. quick theme recall and comparison refresh. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Quick theme recall and comparison refresh.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for Quick theme recall and comparison refresh is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Quick theme recall and comparison refresh felt strongest today?",
    "rewardPrompt": "Nice work. Quick theme recall and comparison refresh now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-21",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-21",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-22",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-22",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "Theme C overview",
    "summary": "This block focuses on Theme C overview. Do a full waves review set across SHM, wave model, phenomena, standing waves, and Doppler logic. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do a full waves review set across shm, wave model, phenomena, standing waves, and doppler logic.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Theme C overview is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Theme C overview still costs you the most time or marks?",
    "rewardPrompt": "Nice. Theme C overview is a little less chaotic now."
  },
  {
    "date": "2026-04-22",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "Theme C overview",
    "summary": "This block focuses on Theme C overview. Do a Paper 1 style mixed waves and electricity set. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do a paper 1 style mixed waves and electricity set.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do a Paper 1 style mixed waves and electricity set.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Theme C overview still costs you the most time or marks?",
    "rewardPrompt": "Nice. Theme C overview is a little less chaotic now."
  },
  {
    "date": "2026-04-22",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-22",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-22",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "German",
    "title": "Comparison note",
    "summary": "This block focuses on Comparison note. Write a timed Paper 2 essay. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Write a timed paper 2 essay.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Write a timed Paper 2 essay.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Comparison note felt strongest today?",
    "rewardPrompt": "Nice work. Comparison note now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-22",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Java Rebuild Checklist",
    "summary": "This block focuses on Java Rebuild Checklist. Focus on inheritance, polymorphism, ArrayList, recursion, and tracing. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Focus on inheritance, polymorphism, arraylist, recursion, and tracing.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The named task for Java Rebuild Checklist is finished in writing or on paper, not just skimmed.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Java Rebuild Checklist would you still want one more rep on?",
    "rewardPrompt": "Nice. Java Rebuild Checklist is staying active instead of rusting in the background."
  },
  {
    "date": "2026-04-22",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-22",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-22",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-22",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-23",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-23",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "Theme D overview",
    "summary": "This block focuses on Theme D overview. Do a full fields review set across D.1 to D.4. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do a full fields review set across d.1 to d.4.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do a full fields review set across D.1 to D.4.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Theme D overview still costs you the most time or marks?",
    "rewardPrompt": "Nice. Theme D overview is a little less chaotic now."
  },
  {
    "date": "2026-04-23",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "B.5 Current and Circuits",
    "summary": "This block focuses on B.5 Current and Circuits. Do a full circuits mixed set and force yourself to redraw circuits cleanly. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do a full circuits mixed set and force yourself to redraw circuits cleanly.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for B.5 Current and Circuits is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in B.5 Current and Circuits still costs you the most time or marks?",
    "rewardPrompt": "Nice. B.5 Current and Circuits is a little less chaotic now."
  },
  {
    "date": "2026-04-23",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-23",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-23",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Business",
    "title": "Unit 3 overview and Unit 5 overview",
    "summary": "This block focuses on Unit 3 overview and Unit 5 overview. Do finance plus operations mixed questions with short written evaluation. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Do finance plus operations mixed questions with short written evaluation.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for Unit 3 overview and Unit 5 overview is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from Unit 3 overview and Unit 5 overview still feels least natural to write?",
    "rewardPrompt": "Solid. Unit 3 overview and Unit 5 overview is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-23",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 2 Comparative System and Comparative",
    "summary": "This block focuses on English Paper 2 Comparative System and Comparative. Build the main comparison grid for *Death of a Salesman* and *A Doll's House*. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Build the main comparison grid for *death of a salesman* and *a doll's house*.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for English Paper 2 Comparative System and Comparative is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 2 Comparative System and Comparative would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 2 Comparative System and Comparative is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-04-23",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-23",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Physics",
    "title": "Quick recall of your weakest field/circuit formulas",
    "summary": "This block focuses on Quick recall of your weakest field/circuit formulas. quick recall of your weakest field/circuit formulas. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Quick recall of your weakest field/circuit formulas.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Quick recall of your weakest field/circuit formulas is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Quick recall of your weakest field/circuit formulas still costs you the most time or marks?",
    "rewardPrompt": "Nice. Quick recall of your weakest field/circuit formulas is a little less chaotic now."
  },
  {
    "date": "2026-04-23",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-23",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-24",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-24",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Physics",
    "title": "Theme B overview and Theme E overview",
    "summary": "This block focuses on Theme B overview and Theme E overview. Do a full thermal, nuclear, and quantum mixed review. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Do a full thermal, nuclear, and quantum mixed review.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Theme B overview and Theme E overview is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Theme B overview and Theme E overview still costs you the most time or marks?",
    "rewardPrompt": "Nice. Theme B overview and Theme E overview is a little less chaotic now."
  },
  {
    "date": "2026-04-24",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "Half Paper 1 timed under strict exam",
    "summary": "This block focuses on Half Paper 1 timed under strict exam. conditions. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Conditions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Half Paper 1 timed under strict exam is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Half Paper 1 timed under strict exam still costs you the most time or marks?",
    "rewardPrompt": "Nice. Half Paper 1 timed under strict exam is a little less chaotic now."
  },
  {
    "date": "2026-04-24",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-24",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-24",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "German",
    "title": "German hub",
    "summary": "This block focuses on German hub. Write another timed Paper 1 response and compare it to the one from `20 Apr`. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Write another timed paper 1 response and compare it to the one from `20 apr`.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Write another timed Paper 1 response and compare it to the one from `20 Apr`.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from German hub felt strongest today?",
    "rewardPrompt": "Nice work. German hub now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-24",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Business",
    "title": "Business SL Paper System",
    "summary": "This block focuses on Business SL Paper System. Do Paper 1 case mini-answers, especially short application and recommendation questions. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Do paper 1 case mini-answers, especially short application and recommendation questions.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do Paper 1 case mini-answers, especially short application and recommendation questions.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from Business SL Paper System still feels least natural to write?",
    "rewardPrompt": "Solid. Business SL Paper System is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-24",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-24",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-24",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-24",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-25",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-25",
    "startTime": "09:30",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Physics",
    "title": "Half Paper 2 timed",
    "summary": "This block focuses on Half Paper 2 timed. Use the full two-block window without pausing to check notes. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Use the full two-block window without pausing to check notes.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Half Paper 2 timed is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Half Paper 2 timed still costs you the most time or marks?",
    "rewardPrompt": "Nice. Half Paper 2 timed is a little less chaotic now."
  },
  {
    "date": "2026-04-25",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-25",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-25",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Physics",
    "title": "Mark the half-paper brutally and make one",
    "summary": "This block focuses on Mark the half-paper brutally and make one. page called `Last Weak Spots Before Physics`. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Page called `last weak spots before physics`.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Mark the half-paper brutally and make one is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Mark the half-paper brutally and make one still costs you the most time or marks?",
    "rewardPrompt": "Nice. Mark the half-paper brutally and make one is a little less chaotic now."
  },
  {
    "date": "2026-04-25",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "German",
    "title": "Comparison note",
    "summary": "This block focuses on Comparison note. Final comparison grid cleanup plus one repaired body paragraph. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Final comparison grid cleanup plus one repaired body paragraph.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for Comparison note is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Comparison note felt strongest today?",
    "rewardPrompt": "Nice work. Comparison note now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-25",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-25",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Business",
    "title": "One short Paper 2 drill only",
    "summary": "This block focuses on One short Paper 2 drill only. then stop. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Then stop.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for One short Paper 2 drill only is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from One short Paper 2 drill only still feels least natural to write?",
    "rewardPrompt": "Solid. One short Paper 2 drill only is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-25",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-25",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-26",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-26",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "German",
    "title": "German hub. Final Paper 1 session",
    "summary": "This block focuses on German hub. Final Paper 1 session. one clean plan and one opening paragraph only. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "One clean plan and one opening paragraph only.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for German hub. Final Paper 1 session is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from German hub. Final Paper 1 session felt strongest today?",
    "rewardPrompt": "Nice work. German hub. Final Paper 1 session now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-26",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "German",
    "title": "Comparison note. Final Paper 2 session",
    "summary": "This block focuses on Comparison note. Final Paper 2 session. themes, contrasts, structure, and `6-8` flexible references. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Themes, contrasts, structure, and `6-8` flexible references.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: themes, contrasts, structure, and `6-8` flexible references.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Comparison note. Final Paper 2 session felt strongest today?",
    "rewardPrompt": "Nice work. Comparison note. Final Paper 2 session now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-26",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-26",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-26",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Physics",
    "title": "Physics syllabus map",
    "summary": "This block focuses on Physics syllabus map. Formula recall plus `10` short mixed questions only. No new learning. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Formula recall plus `10` short mixed questions only. no new learning.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Formula recall plus `10` short mixed questions only. No new learning.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Physics syllabus map still costs you the most time or marks?",
    "rewardPrompt": "Nice. Physics syllabus map is a little less chaotic now."
  },
  {
    "date": "2026-04-26",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Business",
    "title": "Business SL Paper System",
    "summary": "This block focuses on Business SL Paper System. Definitions, case skim, and light structure review only. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "Definitions, case skim, and light structure review only.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The named task for Business SL Paper System is finished in writing or on paper, not just skimmed.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from Business SL Paper System still feels least natural to write?",
    "rewardPrompt": "Solid. Business SL Paper System is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-26",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-26",
    "startTime": "19:30",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening fully off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-26",
    "startTime": "19:30",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening fully off and early sleep",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-26",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-26",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-27",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-27",
    "startTime": "09:30",
    "endTime": "10:30",
    "kind": "study",
    "subject": "German",
    "title": "German hub",
    "summary": "This block focuses on German hub. Annotate one text, write one thesis, then stop. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Annotate one text, write one thesis,.",
      "Then stop.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for German hub is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from German hub felt strongest today?",
    "rewardPrompt": "Nice work. German hub now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-27",
    "startTime": "11:00",
    "endTime": "11:45",
    "kind": "meal",
    "subject": "none",
    "title": "Pre-exam lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-27",
    "startTime": "11:45",
    "endTime": "12:15",
    "kind": "outside",
    "subject": "none",
    "title": "Pre-exam outside reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-27",
    "startTime": "13:00",
    "endTime": "14:15",
    "kind": "exam",
    "subject": "German Lang Lit",
    "title": "German Lang Lit SL Paper 1",
    "summary": "This is the actual exam block for German Lang Lit SL Paper 1. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 14:15.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-04-27",
    "startTime": "18:30",
    "endTime": "19:30",
    "kind": "study",
    "subject": "Physics",
    "title": "Physics syllabus map",
    "summary": "This block focuses on Physics syllabus map. Formula sheet, `8` MCQ, and then off. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "Formula sheet, `8` mcq, and.",
      "Then off.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Formula sheet, `8` MCQ, and then off.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Physics syllabus map still costs you the most time or marks?",
    "rewardPrompt": "Nice. Physics syllabus map is a little less chaotic now."
  },
  {
    "date": "2026-04-27",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-27",
    "startTime": "20:00",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-27",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-27",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-28",
    "startTime": "07:15",
    "endTime": "07:40",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-28",
    "startTime": "07:50",
    "endTime": "08:20",
    "kind": "study",
    "subject": "German",
    "title": "Comparison note",
    "summary": "This block focuses on Comparison note. Themes only. No new material. This is a writing-and-thinking block, not a vague memory block. Leave with something written, planned, or compared.",
    "checklist": [
      "Themes only. no new material.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for Comparison note is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "German performance improves when the thinking and writing process becomes automatic, not when you vaguely remember the books.",
    "loggingPrompt": "What comparison, theme, or writing move from Comparison note felt strongest today?",
    "rewardPrompt": "Nice work. Comparison note now exists in writing, which is what matters."
  },
  {
    "date": "2026-04-28",
    "startTime": "09:00",
    "endTime": "10:45",
    "kind": "exam",
    "subject": "German Lang Lit",
    "title": "German Lang Lit SL Paper 2",
    "summary": "This is the actual exam block for German Lang Lit SL Paper 2. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 10:45.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-04-28",
    "startTime": "10:45",
    "endTime": "11:30",
    "kind": "meal",
    "subject": "none",
    "title": "Between-exam meal",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-28",
    "startTime": "11:30",
    "endTime": "12:15",
    "kind": "outside",
    "subject": "none",
    "title": "Between-exam walk",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-28",
    "startTime": "13:00",
    "endTime": "15:00",
    "kind": "exam",
    "subject": "Physics Paper 1A",
    "title": "Physics HL Paper 1A + 1B",
    "summary": "This is the actual exam block for Physics HL Paper 1A + 1B. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 15:00.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-04-28",
    "startTime": "18:30",
    "endTime": "19:30",
    "kind": "study",
    "subject": "Business",
    "title": "Unit 1 overview and Business SL Paper",
    "summary": "This block focuses on Unit 1 overview and Business SL Paper. System. Unit 1 plus Abraca skim only. Treat this as application work, not passive reading. You should leave with terms, structure, and at least one written output.",
    "checklist": [
      "System. unit 1 plus abraca skim only.",
      "Tie the concept to a concrete business application or case angle.",
      "Write at least one structured answer, tool page, or recommendation sentence."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: System. Unit 1 plus Abraca skim only.",
      "The concept is tied to application, not left as a loose definition list.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Business can move quickly once the concepts are tied to application, so this block is about converting knowledge into answerable marks.",
    "loggingPrompt": "Which term, tool, or application from Unit 1 overview and Business SL Paper still feels least natural to write?",
    "rewardPrompt": "Solid. Unit 1 overview and Business SL Paper is now more usable in an answer, not just familiar in your head."
  },
  {
    "date": "2026-04-28",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-28",
    "startTime": "20:00",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Early night",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-28",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-28",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-29",
    "startTime": "07:30",
    "endTime": "08:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-29",
    "startTime": "08:15",
    "endTime": "08:30",
    "kind": "study",
    "subject": "Physics",
    "title": "Physics syllabus map",
    "summary": "This block focuses on Physics syllabus map. One last formula glance only. Keep it practical: rebuild the idea quickly, do the exact questions named here, and finish by marking the set before you move on.",
    "checklist": [
      "One last formula glance only.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Physics error log."
    ],
    "successCriteria": [
      "The named task for Physics syllabus map is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Physics is early and one of your weakest subjects, so every solid block here buys you marks fast.",
    "loggingPrompt": "What question type in Physics syllabus map still costs you the most time or marks?",
    "rewardPrompt": "Nice. Physics syllabus map is a little less chaotic now."
  },
  {
    "date": "2026-04-29",
    "startTime": "09:00",
    "endTime": "11:30",
    "kind": "exam",
    "subject": "Physics",
    "title": "Physics HL Paper 2",
    "summary": "This is the actual exam block for Physics HL Paper 2. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 11:30.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-04-29",
    "startTime": "11:30",
    "endTime": "12:00",
    "kind": "meal",
    "subject": "none",
    "title": "Between-exam meal",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-29",
    "startTime": "12:00",
    "endTime": "12:30",
    "kind": "outside",
    "subject": "none",
    "title": "Between-exam walk",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-29",
    "startTime": "13:00",
    "endTime": "14:30",
    "kind": "exam",
    "subject": "Business",
    "title": "Business SL Paper 1",
    "summary": "This is the actual exam block for Business SL Paper 1. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 14:30.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-04-29",
    "startTime": "18:00",
    "endTime": "19:00",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Paper Strategy",
    "summary": "This block focuses on Paper Strategy. Light Paper 1 review with syntax and tracing. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Light paper 1 review with syntax and tracing.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Light Paper 1 review with syntax and tracing.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Paper Strategy would you still want one more rep on?",
    "rewardPrompt": "Nice. Paper Strategy is staying active instead of rusting in the background."
  },
  {
    "date": "2026-04-29",
    "startTime": "19:00",
    "endTime": "19:45",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-29",
    "startTime": "19:45",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-29",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-29",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-04-30",
    "startTime": "07:30",
    "endTime": "08:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-30",
    "startTime": "09:00",
    "endTime": "10:30",
    "kind": "exam",
    "subject": "Business",
    "title": "Business SL Paper 2",
    "summary": "This is the actual exam block for Business SL Paper 2. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 10:30.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-04-30",
    "startTime": "10:30",
    "endTime": "11:15",
    "kind": "meal",
    "subject": "none",
    "title": "Between-exam meal",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-30",
    "startTime": "11:15",
    "endTime": "12:00",
    "kind": "outside",
    "subject": "none",
    "title": "Between-exam walk",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-04-30",
    "startTime": "13:00",
    "endTime": "15:10",
    "kind": "exam",
    "subject": "Computer Science",
    "title": "Computer Science HL Paper 1",
    "summary": "This is the actual exam block for Computer Science HL Paper 1. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 15:10.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-04-30",
    "startTime": "18:30",
    "endTime": "19:15",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Paper Strategy",
    "summary": "This block focuses on Paper Strategy. Rebuild Checklist. Build a short checklist for Paper 2 and Paper 3 weak spots. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Rebuild checklist. build a short checklist for paper 2 and paper 3 weak spots.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Rebuild Checklist. Build a short checklist for Paper 2 and Paper 3 weak spots.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Paper Strategy would you still want one more rep on?",
    "rewardPrompt": "Nice. Paper Strategy is staying active instead of rusting in the background."
  },
  {
    "date": "2026-04-30",
    "startTime": "19:15",
    "endTime": "20:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-04-30",
    "startTime": "20:00",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-30",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-04-30",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-01",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-01",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Java Rebuild Checklist",
    "summary": "This block focuses on Java Rebuild Checklist. Classes, constructors, method calls, and encapsulation. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Classes, constructors, method calls, and encapsulation.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The named task for Java Rebuild Checklist is finished in writing or on paper, not just skimmed.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Java Rebuild Checklist would you still want one more rep on?",
    "rewardPrompt": "Nice. Java Rebuild Checklist is staying active instead of rusting in the background."
  },
  {
    "date": "2026-05-01",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Java Rebuild Checklist",
    "summary": "This block focuses on Java Rebuild Checklist. Arrays, ArrayList, loops, searching, and sorting. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Arrays, arraylist, loops, searching, and sorting.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The named task for Java Rebuild Checklist is finished in writing or on paper, not just skimmed.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Java Rebuild Checklist would you still want one more rep on?",
    "rewardPrompt": "Nice. Java Rebuild Checklist is staying active instead of rusting in the background."
  },
  {
    "date": "2026-05-01",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-01",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-01",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Paper Strategy",
    "summary": "This block focuses on Paper Strategy. Read the Paper 3 case study materials and make a one-page issue summary. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Read the paper 3 case study materials and make a one-page issue summary.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Read the Paper 3 case study materials and make a one-page issue summary.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Paper Strategy would you still want one more rep on?",
    "rewardPrompt": "Nice. Paper Strategy is staying active instead of rusting in the background."
  },
  {
    "date": "2026-05-01",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 1 System",
    "summary": "This block focuses on English Paper 1 System. Do one full plan and one strong body paragraph. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Do one full plan and one strong body paragraph.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for English Paper 1 System is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 1 System would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 1 System is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-01",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-01",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-01",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-01",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-02",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-02",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Java Rebuild Checklist",
    "summary": "This block focuses on Java Rebuild Checklist. Timed coding set with constructors, loops, arrays, and method calls. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Timed coding set with constructors, loops, arrays, and method calls.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The named task for Java Rebuild Checklist is finished in writing or on paper, not just skimmed.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Java Rebuild Checklist would you still want one more rep on?",
    "rewardPrompt": "Nice. Java Rebuild Checklist is staying active instead of rusting in the background."
  },
  {
    "date": "2026-05-02",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Paper Strategy",
    "summary": "This block focuses on Paper Strategy. Paper 3 likely-question drill. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Paper 3 likely-question drill.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Paper 3 likely-question drill.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Paper Strategy would you still want one more rep on?",
    "rewardPrompt": "Nice. Paper Strategy is staying active instead of rusting in the background."
  },
  {
    "date": "2026-05-02",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-02",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-02",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 2 Comparative System and Comparative",
    "summary": "This block focuses on English Paper 2 Comparative System and Comparative. Build the full comparison grid for the two plays. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Build the full comparison grid for the two plays.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for English Paper 2 Comparative System and Comparative is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 2 Comparative System and Comparative would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 2 Comparative System and Comparative is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-02",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "2.8 Reciprocal and Simple Rational Functions",
    "summary": "This block focuses on 2.8 Reciprocal and Simple Rational Functions. 2.9 Exponential and Logarithmic Functions, 2.5 Composite Functions and Inverse Functions, and 1.12 Complex Numbers in Cartesian Form. Restart math with asymptotes and inverse/composite cleanup, then spend the last `20-25 min` on a second touch of complex arithmetic and simple Argand work. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "2.9 exponential and logarithmic functions, 2.5 composite functions and inverse functions, and 1.12 complex numbers in cartesian form. restart math with asymptotes and inverse/composite cleanup,.",
      "Then spend the last `20-25 min` on a second touch of complex arithmetic and simple Argand work.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: 2.9 Exponential and Logarithmic Functions, 2.5 Composite Functions and Inverse Functions, and 1.12 Complex Numbers in Cartesian Form. Restart math with asymptotes and inverse/composite cleanup, then spend the last `20-25 min` on a second touch of complex arithmetic and simple Argand work.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 2.8 Reciprocal and Simple Rational Functions still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 2.8 Reciprocal and Simple Rational Functions just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-02",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-02",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Redo the weakest coding pattern from the",
    "summary": "This block focuses on Redo the weakest coding pattern from the. day without looking at notes. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Day without looking at notes.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The named task for Redo the weakest coding pattern from the is finished in writing or on paper, not just skimmed.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Redo the weakest coding pattern from the would you still want one more rep on?",
    "rewardPrompt": "Nice. Redo the weakest coding pattern from the is staying active instead of rusting in the background."
  },
  {
    "date": "2026-05-02",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-02",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-03",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-03",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Computer Science",
    "title": "Java Rebuild Checklist",
    "summary": "This block focuses on Java Rebuild Checklist. Redo your weakest coding patterns and trace them by hand. Write code, pseudocode, or traced logic actively through the block. Reading only counts if it becomes something you can produce yourself.",
    "checklist": [
      "Redo your weakest coding patterns and trace them by hand.",
      "Write or trace the logic yourself instead of only reading it.",
      "Note the coding or tracing pattern that still feels shaky."
    ],
    "successCriteria": [
      "The named task for Java Rebuild Checklist is finished in writing or on paper, not just skimmed.",
      "You can reproduce or trace the core pattern without immediately checking the notes.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Computer Science stays strong only if you keep writing code and tracing logic actively, especially for the Java-heavy papers.",
    "loggingPrompt": "Which coding or tracing pattern from Java Rebuild Checklist would you still want one more rep on?",
    "rewardPrompt": "Nice. Java Rebuild Checklist is staying active instead of rusting in the background."
  },
  {
    "date": "2026-05-03",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 1 System",
    "summary": "This block focuses on English Paper 1 System. Write one full timed Paper 1 response. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Write one full timed paper 1 response.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Write one full timed Paper 1 response.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 1 System would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 1 System is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-03",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-03",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-03",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 2 Comparative System and Comparative",
    "summary": "This block focuses on English Paper 2 Comparative System and Comparative. Build a thesis bank and make `2` full Paper 2 plans. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Build a thesis bank and make `2` full paper 2 plans.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Build a thesis bank and make `2` full Paper 2 plans.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 2 Comparative System and Comparative would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 2 Comparative System and Comparative is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-03",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "1.5",
    "summary": "This block focuses on 1.5. Do algebra repair and calculator discipline. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Do algebra repair and calculator discipline.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 1.5 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.5 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.5 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-03",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-03",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-03",
    "startTime": "19:30",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-03",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-03",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-04",
    "startTime": "07:30",
    "endTime": "08:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-04",
    "startTime": "09:00",
    "endTime": "11:20",
    "kind": "exam",
    "subject": "Computer Science Paper 2 +",
    "title": "Computer Science HL Paper 2 + Paper 3",
    "summary": "This is the actual exam block for Computer Science HL Paper 2 + Paper 3. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 11:20.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-05-04",
    "startTime": "12:00",
    "endTime": "13:00",
    "kind": "meal",
    "subject": "none",
    "title": "Post-exam lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-04",
    "startTime": "13:00",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Long break outside",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-04",
    "startTime": "17:00",
    "endTime": "18:00",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 2 Comparative System",
    "summary": "This block focuses on English Paper 2 Comparative System. Light comparative refresh only. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Light comparative refresh only.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for English Paper 2 Comparative System is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 2 Comparative System would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 2 Comparative System is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-04",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-04",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-04",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-05",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-05",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 2 Comparative System and Comparative",
    "summary": "This block focuses on English Paper 2 Comparative System and Comparative. Grid. Main themes, scenes, and flexible pairings. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Grid. main themes, scenes, and flexible pairings.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for English Paper 2 Comparative System and Comparative is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 2 Comparative System and Comparative would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 2 Comparative System and Comparative is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-05",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 1 System",
    "summary": "This block focuses on English Paper 1 System. Do a close reading of a non-literary text type you dislike. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Do a close reading of a non-literary text type you dislike.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for English Paper 1 System is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 1 System would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 1 System is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-05",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-05",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-05",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "1.2",
    "summary": "This block focuses on 1.2. Rebuild sequences quickly, then use the last `30-35 min` for a first-pass probability and binomial block so statistics is not brand new on `10 May`. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Rebuild sequences quickly,.",
      "Then use the last `30-35 min` for a first-pass probability and binomial block so statistics is not brand new on `10 May`.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Rebuild sequences quickly, then use the last `30-35 min` for a first-pass probability and binomial block so statistics is not brand new on `10 May`.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.2 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.2 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-05",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "2.8",
    "summary": "This block focuses on 2.8. Focus on rational/log/exp graphs plus inverse/composite basics. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Focus on rational/log/exp graphs plus inverse/composite basics.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 2.8 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 2.8 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 2.8 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-05",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-05",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-05",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-05",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-06",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-06",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 1 System",
    "summary": "This block focuses on English Paper 1 System. Full timed Paper 1 plus quick self-mark. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Full timed paper 1 plus quick self-mark.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Full timed Paper 1 plus quick self-mark.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 1 System would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 1 System is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-06",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 2 Comparative System",
    "summary": "This block focuses on English Paper 2 Comparative System. Do one timed Paper 2 plan, intro, and one body paragraph. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Do one timed paper 2 plan, intro, and one body paragraph.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Do one timed Paper 2 plan, intro, and one body paragraph.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 2 Comparative System would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 2 Comparative System is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-06",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-06",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-06",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "5.6",
    "summary": "This block focuses on 5.6. Drill product, quotient, and chain rule plus tangent/normal work. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Drill product, quotient, and chain rule plus tangent/normal work.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 5.6 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 5.6 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 5.6 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-06",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "3.4",
    "summary": "This block focuses on 3.4. Make trig equation-solving feel less random. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Make trig equation-solving feel less random.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 3.4 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 3.4 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 3.4 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-06",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-06",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Math",
    "title": "Practice formula booklet navigation so you stop",
    "summary": "This block focuses on Practice formula booklet navigation so you stop. wasting time hunting. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Wasting time hunting.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Practice formula booklet navigation so you stop is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Practice formula booklet navigation so you stop still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Practice formula booklet navigation so you stop just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-06",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-06",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-07",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-07",
    "startTime": "09:30",
    "endTime": "10:30",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 1 System. Warm-up only",
    "summary": "This block focuses on English Paper 1 System. Warm-up only. annotate one text, write one thesis, and stop. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Annotate one text, write one thesis, and stop.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for English Paper 1 System. Warm-up only is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 1 System. Warm-up only would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 1 System. Warm-up only is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-07",
    "startTime": "11:00",
    "endTime": "11:45",
    "kind": "meal",
    "subject": "none",
    "title": "Pre-exam lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-07",
    "startTime": "11:45",
    "endTime": "12:15",
    "kind": "outside",
    "subject": "none",
    "title": "Pre-exam outside reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-07",
    "startTime": "13:00",
    "endTime": "14:15",
    "kind": "exam",
    "subject": "English Lang Lit",
    "title": "English Lang Lit SL Paper 1",
    "summary": "This is the actual exam block for English Lang Lit SL Paper 1. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 14:15.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-05-07",
    "startTime": "18:00",
    "endTime": "19:00",
    "kind": "study",
    "subject": "English",
    "title": "English Paper 2 Comparative System",
    "summary": "This block focuses on English Paper 2 Comparative System. Comparative refresh only. Keep this anchored to technique, structure, and actual writing. By the end, you should have something you could build into an essay.",
    "checklist": [
      "Comparative refresh only.",
      "Leave a visible written output: plan, grid, paragraph, or timed response.",
      "Underline one thing you would improve if this were the real paper."
    ],
    "successCriteria": [
      "The named task for English Paper 2 Comparative System is finished in writing or on paper, not just skimmed.",
      "A usable written artifact exists for later revision: plan, comparison, paragraph, or timed answer.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "English marks come from controlled planning and execution under time, so this block is about building repeatable writing habits.",
    "loggingPrompt": "What technique or comparison from English Paper 2 Comparative System would you trust most in the real paper?",
    "rewardPrompt": "Good. English Paper 2 Comparative System is becoming something you can execute, not just think about."
  },
  {
    "date": "2026-05-07",
    "startTime": "19:00",
    "endTime": "19:45",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-07",
    "startTime": "19:45",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-07",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-07",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-08",
    "startTime": "07:30",
    "endTime": "08:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-08",
    "startTime": "09:00",
    "endTime": "10:45",
    "kind": "exam",
    "subject": "English Lang Lit",
    "title": "English Lang Lit SL Paper 2",
    "summary": "This is the actual exam block for English Lang Lit SL Paper 2. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 10:45.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-05-08",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-08",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Long break outside",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-08",
    "startTime": "15:30",
    "endTime": "17:00",
    "kind": "study",
    "subject": "Math",
    "title": "Math hub",
    "summary": "This block focuses on Math hub. Do a mixed diagnostic set and identify what still feels ugly before the final push. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Do a mixed diagnostic set and identify what still feels ugly before the final push.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Math hub is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Math hub still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Math hub just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-08",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-08",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-08",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-09",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-09",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "1.5",
    "summary": "This block focuses on 1.5. Do logs, exponents, algebra repair, and partial fractions. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Do logs, exponents, algebra repair, and partial fractions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 1.5 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.5 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.5 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-09",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "1.2",
    "summary": "This block focuses on 1.2. Do short questions fast. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Do short questions fast.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 1.2 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.2 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.2 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-09",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-09",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-09",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "2.2",
    "summary": "This block focuses on 2.2. Focus on domain/range, inverse/composite, transformations, and asymptotes. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Focus on domain/range, inverse/composite, transformations, and asymptotes.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 2.2 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 2.2 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 2.2 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-09",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "Paper 1 short questions from everything covered",
    "summary": "This block focuses on Paper 1 short questions from everything covered. today. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Today.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Paper 1 short questions from everything covered is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Paper 1 short questions from everything covered still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Paper 1 short questions from everything covered just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-09",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-09",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-09",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-09",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-10",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-10",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "3.5",
    "summary": "This block focuses on 3.5. Do trig identities and equation solving. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Do trig identities and equation solving.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 3.5 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 3.5 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 3.5 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-10",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "3.12",
    "summary": "This block focuses on 3.12. Rebuild vector notation, dot product, and line equations. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Rebuild vector notation, dot product, and line equations.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 3.12 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 3.12 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 3.12 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-10",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-10",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-10",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "4.8 Binomial Distribution",
    "summary": "This block focuses on 4.8 Binomial Distribution. Do binomial, normal, and conditional probability questions. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Do binomial, normal, and conditional probability questions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 4.8 Binomial Distribution is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 4.8 Binomial Distribution still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 4.8 Binomial Distribution just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-10",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "Mixed Paper 1 set",
    "summary": "This block focuses on Mixed Paper 1 set. mixed Paper 1 set. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Mixed paper 1 set.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: mixed Paper 1 set.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Mixed Paper 1 set still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Mixed Paper 1 set just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-10",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-10",
    "startTime": "19:30",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-10",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-10",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-11",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-11",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "5.6",
    "summary": "This block focuses on 5.6. Do the core derivative rule set plus graph behavior. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Do the core derivative rule set plus graph behavior.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 5.6 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 5.6 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 5.6 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-11",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "5.8",
    "summary": "This block focuses on 5.8. Focus on applications, optimization, areas, and kinematics. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Focus on applications, optimization, areas, and kinematics.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 5.8 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 5.8 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 5.8 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-11",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-11",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-11",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "5.14",
    "summary": "This block focuses on 5.14. 5.16, and 5.15. This is the HL calculus block. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "5.16, and 5.15. this is the hl calculus block.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: 5.16, and 5.15. This is the HL calculus block.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 5.14 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 5.14 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-11",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "Paper 2 calculator set focused on calculus",
    "summary": "This block focuses on Paper 2 calculator set focused on calculus. and functions. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "And functions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Paper 2 calculator set focused on calculus is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Paper 2 calculator set focused on calculus still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Paper 2 calculator set focused on calculus just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-11",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-11",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-11",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-11",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-12",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-12",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "1.12",
    "summary": "This block focuses on 1.12. 1.13, and 1.14. Second-pass the complex-number chain: consolidate arithmetic and Argand basics first, then extend into polar/Euler form and De Moivre. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "1.13, and 1.14. second-pass the complex-number chain: consolidate arithmetic and argand basics first,.",
      "Then extend into polar/Euler form and De Moivre.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: 1.13, and 1.14. Second-pass the complex-number chain: consolidate arithmetic and Argand basics first, then extend into polar/Euler form and De Moivre.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.12 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.12 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-12",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "1.14",
    "summary": "This block focuses on 1.14. Do De Moivre, systems, and proof basics. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Do de moivre, systems, and proof basics.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 1.14 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.14 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.14 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-12",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-12",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-12",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "5.18",
    "summary": "This block focuses on 5.18. Use this as an HL-only problem-solving block. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Use this as an hl-only problem-solving block.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 5.18 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 5.18 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 5.18 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-12",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "Paper 3 style extended problem set",
    "summary": "This block focuses on Paper 3 style extended problem set. Paper 3 style extended problem set. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Paper 3 style extended problem set.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: Paper 3 style extended problem set.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Paper 3 style extended problem set still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Paper 3 style extended problem set just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-12",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-12",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Math",
    "title": "Recall only",
    "summary": "This block focuses on Recall only. No more new content tonight. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "No more new content tonight.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Recall only is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Recall only still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Recall only just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-12",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-12",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-13",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-13",
    "startTime": "09:30",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "Full Paper 1 timed at exam time",
    "summary": "This block focuses on Full Paper 1 timed at exam time. full Paper 1 timed at exam time. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Full paper 1 timed at exam time.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: full Paper 1 timed at exam time.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Full Paper 1 timed at exam time still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Full Paper 1 timed at exam time just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-13",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-13",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-13",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "Mark it brutally and make a one-page",
    "summary": "This block focuses on Mark it brutally and make a one-page. `Last Mistakes` sheet. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "`last mistakes` sheet.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Mark it brutally and make a one-page is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Mark it brutally and make a one-page still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Mark it brutally and make a one-page just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-13",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "Redo only the blank or wrong questions",
    "summary": "This block focuses on Redo only the blank or wrong questions. redo only the blank or wrong questions. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Redo only the blank or wrong questions.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Redo only the blank or wrong questions is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Redo only the blank or wrong questions still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Redo only the blank or wrong questions just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-13",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-13",
    "startTime": "19:30",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-13",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-13",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-14",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-14",
    "startTime": "09:45",
    "endTime": "10:30",
    "kind": "study",
    "subject": "Math",
    "title": "Light no-calculator warm-up with one algebra",
    "summary": "This block focuses on Light no-calculator warm-up with one algebra. one trig, and one derivative question. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "One trig, and one derivative question.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Light no-calculator warm-up with one algebra is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Light no-calculator warm-up with one algebra still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Light no-calculator warm-up with one algebra just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-14",
    "startTime": "11:00",
    "endTime": "11:45",
    "kind": "meal",
    "subject": "none",
    "title": "Pre-exam lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-14",
    "startTime": "11:45",
    "endTime": "12:15",
    "kind": "outside",
    "subject": "none",
    "title": "Pre-exam outside reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-14",
    "startTime": "13:00",
    "endTime": "15:00",
    "kind": "exam",
    "subject": "Math AA",
    "title": "Math AA HL Paper 1",
    "summary": "This is the actual exam block for Math AA HL Paper 1. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 15:00.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-05-14",
    "startTime": "18:00",
    "endTime": "19:15",
    "kind": "study",
    "subject": "Math",
    "title": "Calculator routine plus light stats",
    "summary": "This block focuses on Calculator routine plus light stats. functions, and calculus refresh for Paper 2. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Functions, and calculus refresh for paper 2.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: functions, and calculus refresh for Paper 2.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Calculator routine plus light stats still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Calculator routine plus light stats just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-14",
    "startTime": "19:15",
    "endTime": "20:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-14",
    "startTime": "20:00",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-14",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-14",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-15",
    "startTime": "07:30",
    "endTime": "08:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-15",
    "startTime": "09:00",
    "endTime": "11:00",
    "kind": "exam",
    "subject": "Math AA",
    "title": "Math AA HL Paper 2",
    "summary": "This is the actual exam block for Math AA HL Paper 2. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 11:00.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-05-15",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-15",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Long break outside",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-15",
    "startTime": "16:00",
    "endTime": "17:15",
    "kind": "study",
    "subject": "Math",
    "title": "Diagnose Paper 3",
    "summary": "This block focuses on Diagnose Paper 3. Identify the four HL areas that still feel weakest. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Identify the four hl areas that still feel weakest.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Diagnose Paper 3 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Diagnose Paper 3 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Diagnose Paper 3 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-15",
    "startTime": "17:30",
    "endTime": "18:00",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-15",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-15",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-15",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-16",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-16",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "5.18 Differential Equations",
    "summary": "This block focuses on 5.18 Differential Equations. Focus on separation, setup, and interpretation. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Focus on separation, setup, and interpretation.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 5.18 Differential Equations is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 5.18 Differential Equations still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 5.18 Differential Equations just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-16",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "1.12",
    "summary": "This block focuses on 1.12. 1.13, 3.17, and 3.18. Complex plus vectors/planes. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "1.13, 3.17, and 3.18. complex plus vectors/planes.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: 1.13, 3.17, and 3.18. Complex plus vectors/planes.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.12 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.12 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-16",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-16",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-16",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "5.13 l'Hopital and Indeterminate Limits",
    "summary": "This block focuses on 5.13 l'Hopital and Indeterminate Limits. and 5.19 Maclaurin Series. Limits and Maclaurin cleanup. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "And 5.19 maclaurin series. limits and maclaurin cleanup.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: and 5.19 Maclaurin Series. Limits and Maclaurin cleanup.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 5.13 l'Hopital and Indeterminate Limits still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 5.13 l'Hopital and Indeterminate Limits just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-16",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "One full Paper 3 style extended problem",
    "summary": "This block focuses on One full Paper 3 style extended problem. timed. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Timed.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for One full Paper 3 style extended problem is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in One full Paper 3 style extended problem still breaks down when you try it on paper?",
    "rewardPrompt": "Good. One full Paper 3 style extended problem just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-16",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-16",
    "startTime": "19:30",
    "endTime": "20:00",
    "kind": "study",
    "subject": "Math",
    "title": "Mark only",
    "summary": "This block focuses on Mark only. mark only. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Mark only.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Mark only is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Mark only still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Mark only just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-16",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-16",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-17",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-17",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "1.15",
    "summary": "This block focuses on 1.15. Do contradiction, induction, and counterexample method practice. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Do contradiction, induction, and counterexample method practice.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for 1.15 is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 1.15 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 1.15 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-17",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "3.16",
    "summary": "This block focuses on 3.16. 3.17, and 3.18. Advanced vectors and planes. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "3.17, and 3.18. advanced vectors and planes.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: 3.17, and 3.18. Advanced vectors and planes.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in 3.16 still breaks down when you try it on paper?",
    "rewardPrompt": "Good. 3.16 just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-17",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-17",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-17",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "One second Paper 3 style extended problem",
    "summary": "This block focuses on One second Paper 3 style extended problem. timed. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Timed.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for One second Paper 3 style extended problem is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in One second Paper 3 style extended problem still breaks down when you try it on paper?",
    "rewardPrompt": "Good. One second Paper 3 style extended problem just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-17",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "Write model methods for every mistake from",
    "summary": "This block focuses on Write model methods for every mistake from. the problem. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "The problem.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Write model methods for every mistake from is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Write model methods for every mistake from still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Write model methods for every mistake from just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-17",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-17",
    "startTime": "19:30",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Evening off",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-17",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-17",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-18",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-18",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "Mixed Paper 3 set focused on calculus",
    "summary": "This block focuses on Mixed Paper 3 set focused on calculus. and modeling. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "And modeling.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Mixed Paper 3 set focused on calculus is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Mixed Paper 3 set focused on calculus still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Mixed Paper 3 set focused on calculus just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-18",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "Mixed Paper 3 set focused on complex",
    "summary": "This block focuses on Mixed Paper 3 set focused on complex. numbers and vectors. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Numbers and vectors.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Mixed Paper 3 set focused on complex is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Mixed Paper 3 set focused on complex still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Mixed Paper 3 set focused on complex just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-18",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-18",
    "startTime": "13:15",
    "endTime": "14:00",
    "kind": "outside",
    "subject": "none",
    "title": "Daylight reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-18",
    "startTime": "14:00",
    "endTime": "15:15",
    "kind": "study",
    "subject": "Math",
    "title": "Redo the single weakest Paper 3 question",
    "summary": "This block focuses on Redo the single weakest Paper 3 question. type until the setup stops feeling random. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Type until the setup stops feeling random.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Redo the single weakest Paper 3 question is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Redo the single weakest Paper 3 question still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Redo the single weakest Paper 3 question just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-18",
    "startTime": "15:30",
    "endTime": "16:45",
    "kind": "study",
    "subject": "Math",
    "title": "Formula booklet navigation plus one calm summary",
    "summary": "This block focuses on Formula booklet navigation plus one calm summary. sheet. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Sheet.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Formula booklet navigation plus one calm summary is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Formula booklet navigation plus one calm summary still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Formula booklet navigation plus one calm summary just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-18",
    "startTime": "17:00",
    "endTime": "17:30",
    "kind": "outside",
    "subject": "none",
    "title": "Easy run",
    "summary": "This run is here to clear your head, not to train hard. Keep it easy enough that you come back fresher, not more tired.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-18",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-18",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-18",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-19",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-19",
    "startTime": "09:30",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "One hard Paper 3 question only",
    "summary": "This block focuses on One hard Paper 3 question only. one hard Paper 3 question only. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "One hard paper 3 question only.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The exact workload named in the block is completed: one hard Paper 3 question only.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in One hard Paper 3 question only still breaks down when you try it on paper?",
    "rewardPrompt": "Good. One hard Paper 3 question only just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-19",
    "startTime": "11:00",
    "endTime": "12:15",
    "kind": "study",
    "subject": "Math",
    "title": "Error-log review",
    "summary": "This block focuses on Error-log review. calculator fluency, and calm recall. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "Calculator fluency, and calm recall.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Error-log review is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Error-log review still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Error-log review just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-19",
    "startTime": "12:15",
    "endTime": "13:15",
    "kind": "meal",
    "subject": "none",
    "title": "Lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-19",
    "startTime": "15:00",
    "endTime": "17:00",
    "kind": "outside",
    "subject": "none",
    "title": "Outside recovery block",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-19",
    "startTime": "15:00",
    "endTime": "21:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Outside time and recovery. No hard work after `17:00`",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-19",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-19",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-19",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  },
  {
    "date": "2026-05-20",
    "startTime": "08:15",
    "endTime": "09:00",
    "kind": "meal",
    "subject": "none",
    "title": "Breakfast",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-20",
    "startTime": "10:00",
    "endTime": "10:45",
    "kind": "study",
    "subject": "Math",
    "title": "Ultra-light warm-up with one mini complex-number question",
    "summary": "This block focuses on Ultra-light warm-up with one mini complex-number question. one mini vector question, and one mini differential-equation setup. Do this on paper, not in your head. The point is to make the method usable under pressure, not merely familiar.",
    "checklist": [
      "One mini vector question, and one mini differential-equation setup.",
      "Mark the work before the block ends.",
      "Add any repeated mistake to the Math error log."
    ],
    "successCriteria": [
      "The named task for Ultra-light warm-up with one mini complex-number question is finished in writing or on paper, not just skimmed.",
      "The work is marked and at least one real mistake is identified clearly.",
      "You know what still feels weak before the next block starts."
    ],
    "whyThisMatters": "Math needs repeated active practice, not vague familiarity, so this block matters because it turns recognition into usable method.",
    "loggingPrompt": "What step in Ultra-light warm-up with one mini complex-number question still breaks down when you try it on paper?",
    "rewardPrompt": "Good. Ultra-light warm-up with one mini complex-number question just moved closer to something you can actually do under pressure."
  },
  {
    "date": "2026-05-20",
    "startTime": "11:00",
    "endTime": "11:45",
    "kind": "meal",
    "subject": "none",
    "title": "Pre-exam lunch",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-20",
    "startTime": "11:45",
    "endTime": "12:15",
    "kind": "outside",
    "subject": "none",
    "title": "Pre-exam outside reset",
    "summary": "This block is for daylight, circulation, and getting your brain out of tunnel vision before the next demand starts.",
    "checklist": [
      "Leave the desk and get actual fresh air or daylight.",
      "Keep the pace easy and sustainable.",
      "Come back on time instead of letting the reset eat the next block."
    ],
    "successCriteria": [
      "You moved and reset without turning this into avoidance.",
      "You return feeling at least a little lighter and more awake than before."
    ],
    "whyThisMatters": "These blocks stop the day from turning into one long anxious blur. They protect focus for the next study or exam block.",
    "recoveryPrompt": "Do you feel more reset than you did before stepping outside?",
    "rewardPrompt": "Nice. That reset counts too."
  },
  {
    "date": "2026-05-20",
    "startTime": "13:00",
    "endTime": "14:15",
    "kind": "exam",
    "subject": "Math AA",
    "title": "Math AA HL Paper 3",
    "summary": "This is the actual exam block for Math AA HL Paper 3. The job here is not to do extra study but to arrive settled, pace the paper cleanly from the opening minutes, and protect focus all the way to 14:15.",
    "checklist": [
      "Start calmly and read the paper before committing to your first answer path.",
      "Manage time against the paper length instead of letting one question eat the block.",
      "Keep working, structure, labels, and units clean enough to earn method marks where available.",
      "Use the final minutes to check blanks, labels, units, or unanswered parts."
    ],
    "successCriteria": [
      "You stayed inside the paper with no panic-switching into last-minute cramming behaviour.",
      "You attempted the paper with deliberate pacing and gave every section a fair shot.",
      "You leave knowing which parts felt steady and which parts felt rough."
    ],
    "whyThisMatters": "This block matters because the exam is the only place the marks are actually awarded. Calm execution matters more here than extra last-minute effort.",
    "loggingPrompt": "What felt strongest, what felt roughest, and what would you not want to forget before the next paper?",
    "rewardPrompt": "You got through the real thing. That counts."
  },
  {
    "date": "2026-05-20",
    "startTime": "18:15",
    "endTime": "19:00",
    "kind": "meal",
    "subject": "none",
    "title": "Dinner",
    "summary": "This block is for eating properly so the next part of the day does not run on stress and leftovers. Keep it simple, steady, and easy to repeat.",
    "checklist": [
      "Eat enough to support the next block instead of just taking the edge off hunger.",
      "Drink water before the block ends.",
      "Keep the meal calm enough that it does not bleed into the next scheduled item."
    ],
    "successCriteria": [
      "You ate enough to feel stable instead of hungry again fifteen minutes later.",
      "You leave the block hydrated and ready for the next item."
    ],
    "whyThisMatters": "A decent meal is part of the plan, not time stolen from it. Energy crashes make the later blocks worse than they need to be.",
    "recoveryPrompt": "Did this meal actually help you feel steady for the next block?",
    "rewardPrompt": "Good. You refueled on purpose instead of improvising."
  },
  {
    "date": "2026-05-20",
    "startTime": "21:30",
    "endTime": "22:30",
    "kind": "recovery",
    "subject": "none",
    "title": "Wind-down",
    "summary": "This block is for deliberately coming down, not half-studying in the background. Let your brain settle so the next day or next paper is not built on exhaustion.",
    "checklist": [
      "Put the books away or leave them closed.",
      "Keep the phone from swallowing the whole block if possible.",
      "Do one low-effort thing that actually feels restful."
    ],
    "successCriteria": [
      "You stopped pushing and actually let the day taper off.",
      "You end the block less wound up than when it started."
    ],
    "whyThisMatters": "Recovery is part of making the schedule survivable. A long plan only works if some blocks are allowed to be genuinely off.",
    "recoveryPrompt": "Did you actually switch off, even a little?",
    "rewardPrompt": "Good. Rest now is part of staying dangerous later."
  },
  {
    "date": "2026-05-20",
    "startTime": "22:30",
    "endTime": "08:00",
    "kind": "sleep",
    "subject": "none",
    "title": "Sleep",
    "summary": "This sleep block is here because memory, attention, and stress tolerance all get worse when sleep becomes optional. The aim is not perfect sleep, just a repeatable night that keeps tomorrow workable.",
    "checklist": [
      "Get into bed on time instead of stretching the day for no reason.",
      "Leave notes and error logs for tomorrow, not for the pillow.",
      "Let the room and your head get quiet enough to actually sleep."
    ],
    "successCriteria": [
      "You gave yourself a real night instead of a half-night.",
      "Tomorrow starts from a decent floor rather than emergency recovery."
    ],
    "whyThisMatters": "Sleep is one of the few things that improves every subject at once. It is part of the workload, not time stolen from it.",
    "recoveryPrompt": "Did you give tomorrow a fair chance tonight?",
    "rewardPrompt": "Nice. Tomorrow just got easier."
  }
];
