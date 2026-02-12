import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const subjectIds = [
  "math_aa_hl",
  "physics_hl",
  "computer_science_hl",
  "german_lang_lit_sl",
  "english_lang_lit_sl",
  "business_sl",
];

const schema = a.schema({
  SubjectId: a.enum(subjectIds),
  StudySession: a
    .model({
      subjectId: a.ref("SubjectId").required(),
      startedAt: a.datetime().required(),
      endedAt: a.datetime().required(),
      durationSec: a.integer().required(),
      createdAt: a.datetime().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  TodoItem: a
    .model({
      title: a.string().required(),
      subjectId: a.ref("SubjectId").required(),
      deadline: a.datetime().required(),
      ultraPriority: a.boolean().required(),
      completed: a.boolean().required(),
      archived: a.boolean().required(),
      createdAt: a.datetime().required(),
      completedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  DashboardSettings: a
    .model({
      timezone: a.string().required(),
      examHighlightColor: a.string().required(),
      exams: a.json().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
      description: "Yan Study OS data API key",
    },
  },
});
