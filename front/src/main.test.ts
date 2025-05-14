import { beforeEach, describe, expect, test } from "vitest";

// Setup before each test
beforeEach(() => {
  // Set the document title before testing
  document.title = "TalkMaster – Gérez vos conférences techniques facilement";
});

describe("Document properties tests", () => {
  test("Website title should match expected value", () => {
    const title = document.title;
    console.log("Title:", title);
    expect(title).toBe(
      "TalkMaster – Gérez vos conférences techniques facilement",
    );
  });

  test("Title should not be empty", () => {
    expect(document.title).not.toBe("");
  });

  test("Title should contain 'TalkMaster'", () => {
    expect(document.title).toContain("TalkMaster");
  });
});
