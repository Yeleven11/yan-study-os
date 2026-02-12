import { defineBackend } from "@aws-amplify/backend";
import { data } from "./data/resource";
import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";

const backend = defineBackend({
  data,
});

const storageStack = backend.createStack("StudyStorage");

const sessionsTable = new Table(storageStack, "StudySessionsTable", {
  partitionKey: { name: "id", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

const todosTable = new Table(storageStack, "TodosTable", {
  partitionKey: { name: "id", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

const settingsTable = new Table(storageStack, "SettingsTable", {
  partitionKey: { name: "pk", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

new CfnOutput(storageStack, "SessionsTableName", {
  value: sessionsTable.tableName,
});

new CfnOutput(storageStack, "TodosTableName", {
  value: todosTable.tableName,
});

new CfnOutput(storageStack, "SettingsTableName", {
  value: settingsTable.tableName,
});

backend.addOutput({
  custom: {
    studyStorage: {
      sessionsTableName: sessionsTable.tableName,
      todosTableName: todosTable.tableName,
      settingsTableName: settingsTable.tableName,
      region: "eu-central-1",
    },
  },
});
