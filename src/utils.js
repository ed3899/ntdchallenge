export const stringToDate = str => {
  const [month, year] = str.split("-");
  return new Date(`${month} 1 20${year}`);
};

export const dateToString = d => {
  if (isNaN(d.valueOf())) {
    return "*";
  }

  const [_, month, __, year] = d.toString().split(" ");
  return `${month.toUpperCase()}-${year.slice(2, 4)}`;
};

export const parseCSV = str => {
  let [headers, ...lines] = str.split(";\n");

  headers = headers.split(";");

  return lines.map(line => {
    return line.split(";").reduce((acc, value, i) => {
      if (["ACCOUNT", "DEBIT", "CREDIT"].includes(headers[i])) {
        acc[headers[i]] = parseInt(value, 10);
      } else if (headers[i] === "PERIOD") {
        acc[headers[i]] = stringToDate(value);
      } else {
        acc[headers[i]] = value;
      }
      return acc;
    }, {});
  });
};

export const toCSV = arr => {
  let headers = Object.keys(arr[0]).join(";");
  let lines = arr.map(obj => Object.values(obj).join(";"));
  return [headers, ...lines].join(";\n");
};

export const parseUserInput = str => {
  const [startAccount, endAccount, startPeriod, endPeriod, format] =
    str.split(" ");

  return {
    startAccount: startAccount === "*" ? "*" : parseInt(startAccount, 10),
    endAccount: endAccount === "*" ? "*" : parseInt(endAccount, 10),
    startPeriod: startPeriod === "*" ? "*" : stringToDate(startPeriod),
    endPeriod: endPeriod === "*" ? "*" : stringToDate(endPeriod),
    format,
  };
};

export const isValidDate = date => {
  return date instanceof Date && !isNaN(date.valueOf());
};

export const isValidAccount = account => {
  return typeof account === "number" && account > 0;
};

export function resolveWildcardValues(userInput, accounts, journalEntries) {
  const accountNumbers = accounts
    .map(account => account.ACCOUNT)
    .sort((a, b) => a - b);
  const periods = journalEntries
    .map(entry => entry.PERIOD)
    .sort((a, b) => a - b);

  return {
    startAccount:
      userInput.startAccount === "*"
        ? accountNumbers[0]
        : userInput.startAccount,
    endAccount:
      userInput.endAccount === "*"
        ? accountNumbers[accountNumbers.length - 1]
        : userInput.endAccount,
    startPeriod:
      userInput.startPeriod === "*" ? periods[0] : userInput.startPeriod,
    endPeriod:
      userInput.endPeriod === "*"
        ? periods[periods.length - 1]
        : userInput.endPeriod,
    format: userInput.format,
  };
}

export function filterJournalEntries(journalEntries, userInput, accounts) {
  const resolvedInput = resolveWildcardValues(
    userInput,
    accounts,
    journalEntries
  );
  const {startAccount, endAccount, startPeriod, endPeriod} = resolvedInput;

  // Defensive checks for invalid inputs
  if (
    (startAccount !== "*" && !isValidAccount(startAccount)) ||
    (endAccount !== "*" && !isValidAccount(endAccount)) ||
    (startPeriod !== "*" && !isValidDate(new Date(startPeriod))) ||
    (endPeriod !== "*" && !isValidDate(new Date(endPeriod)))
  ) {
    console.error("Invalid input detected:", resolvedInput);
    return []; // Return an empty array if inputs are invalid, we could potentially display to validation UI for feedback
  }

  const startDate = new Date(startPeriod);
  const endDate = new Date(endPeriod);

  return journalEntries.filter(entry => {
    const accountNumber = entry.ACCOUNT;
    const entryDate = entry.PERIOD;

    return (
      accountNumber >= startAccount &&
      accountNumber <= endAccount &&
      entryDate >= startDate &&
      entryDate <= endDate
    );
  });
}
