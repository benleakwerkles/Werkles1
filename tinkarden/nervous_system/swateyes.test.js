"use strict";

const assert = require("node:assert/strict");
const { classifyRisk, RISK } = require("./swateyes.js");

const cases = [
  {
    name: "file read is GNAT",
    payload: { type: "file_read", path: "foreman/source-truth/SOURCE_TRUTH_POINTER.json" },
    expected: RISK.GNAT,
  },
  {
    name: "bounded reversible local write is MOSQUITO",
    payload: {
      type: "file_write",
      path: "work/demo.txt",
      branch: "local-dev/swateyes-test",
      reversible: true,
      localDev: true,
    },
    expected: RISK.MOSQUITO,
  },
  {
    name: "canonical commit is WOUND",
    payload: { type: "commit", branch: "main" },
    expected: RISK.WOUND,
  },
  {
    name: "destructive delete is FRACTURE",
    payload: { type: "delete", path: "foreman/source-truth", destructive: true },
    expected: RISK.FRACTURE,
  },
  {
    name: "secret access is FRACTURE",
    payload: { type: "secret_access", target: "Ben vault" },
    expected: RISK.FRACTURE,
  },
];

const results = cases.map((testCase) => {
  const actual = classifyRisk(testCase.payload);
  assert.equal(actual, testCase.expected, testCase.name);
  return {
    name: testCase.name,
    expected: testCase.expected,
    actual,
    pass: true,
  };
});

console.log(JSON.stringify({
  status: "PASS",
  module: "C:\\tinkarden\\nervous_system\\swateyes.js",
  tested_at: new Date().toISOString(),
  results,
}, null, 2));
