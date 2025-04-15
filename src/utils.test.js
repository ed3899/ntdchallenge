const {parseUserInput, filterJournalEntries} = require("./utils");

describe("filterJournalEntries", () => {
  const journalEntries = [
    {
      ACCOUNT: 1000,
      PERIOD: new Date("2016-03-01T00:00:00Z"),
      DEBIT: 100,
      CREDIT: 50,
    },
    {
      ACCOUNT: 2000,
      PERIOD: new Date("2016-04-01T00:00:00Z"),
      DEBIT: 200,
      CREDIT: 100,
    },
    {
      ACCOUNT: 3000,
      PERIOD: new Date("2016-05-01T00:00:00Z"),
      DEBIT: 300,
      CREDIT: 150,
    },
  ];

  const accounts = [
    {ACCOUNT: 1000, LABEL: "Cash"},
    {ACCOUNT: 2000, LABEL: "Receivables"},
    {ACCOUNT: 3000, LABEL: "Payables"},
  ];

  it("filters entries within account and period range", () => {
    const userInput = {
      startAccount: 1000,
      endAccount: 2000,
      startPeriod: "2016-03-01T00:00:00Z",
      endPeriod: "2016-04-01T00:00:00Z",
      format: "HTML",
    };

    const result = filterJournalEntries(journalEntries, userInput, accounts);
    expect(result).toEqual([
      {
        ACCOUNT: 1000,
        PERIOD: new Date("2016-03-01T00:00:00Z"),
        DEBIT: 100,
        CREDIT: 50,
      },
      {
        ACCOUNT: 2000,
        PERIOD: new Date("2016-04-01T00:00:00Z"),
        DEBIT: 200,
        CREDIT: 100,
      },
    ]);
  });

  it("handles wildcard (*) for accounts and periods", () => {
    const userInput = {
      startAccount: "*",
      endAccount: "*",
      startPeriod: "*",
      endPeriod: "*",
      format: "HTML",
    };

    const result = filterJournalEntries(journalEntries, userInput, accounts);
    expect(result).toEqual(journalEntries);
  });
});

describe("parseUserInput", () => {
  it("parses valid user input correctly", () => {
    const input = "1000 2000 MAR-16 APR-16 HTML";
    const result = parseUserInput(input);

    expect(result).toEqual({
      startAccount: 1000,
      endAccount: 2000,
      startPeriod: new Date("2016-03-01T00:00:00Z"),
      endPeriod: new Date("2016-04-01T00:00:00Z"),
      format: "HTML",
    });
  });

  it("handles wildcard (*) inputs", () => {
    const input = "* * * * HTML";
    const result = parseUserInput(input);

    expect(result).toEqual({
      startAccount: "*",
      endAccount: "*",
      startPeriod: "*",
      endPeriod: "*",
      format: "HTML",
    });
  });
});
