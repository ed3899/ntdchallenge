import React, {Component} from "react";
import PropTypes from "prop-types";
import {connect} from "react-redux";
import * as utils from "../utils";

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className="output">
        <p>
          Total Debit: {this.props.totalDebit} Total Credit:{" "}
          {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount ||
            "*"} to {this.props.userInput.endAccount || "*"} from period{" "}
          {utils.dateToString(this.props.userInput.startPeriod)} to{" "}
          {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === "CSV" ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === "HTML" ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired,
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    endAccount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string,
  }).isRequired,
};

function transformData(accounts, journalEntries) {
  const accountLabels = accounts.reduce((acc, account) => {
    acc[account.ACCOUNT] = account.LABEL;
    return acc;
  }, {});

  const aggregatedEntries = journalEntries.reduce((acc, entry) => {
    const account = String(entry.ACCOUNT); // Ensure account is a string for the final output

    if (!acc[account]) {
      acc[account] = {
        DEBIT: 0,
        CREDIT: 0,
      };
    }
    acc[account].DEBIT += parseInt(entry.DEBIT, 10);
    acc[account].CREDIT += parseInt(entry.CREDIT, 10);
    return acc;
  }, {});

  const balance = Object.entries(aggregatedEntries).map(
    ([accountNumber, aggregated]) => {
      const debit = aggregated.DEBIT;
      const credit = aggregated.CREDIT;
      const balanceValue = debit - credit; // Assuming Debit increases balance, Credit decreases

      return {
        ACCOUNT: parseInt(accountNumber, 10),
        DESCRIPTION: accountLabels[parseInt(accountNumber, 10)] || "",
        DEBIT: debit,
        CREDIT: credit,
        BALANCE: balanceValue,
      };
    }
  );

  return balance;
}

function resolveWildcardValues(userInput, accounts, journalEntries) {
  const accountNumbers = accounts
    .map(account => account.ACCOUNT)
    .sort((a, b) => a - b);
  const periods = journalEntries
    .map(entry => entry.PERIOD)
    .sort((a, b) => a - b);

  debugger

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

function filterJournalEntries(journalEntries, userInput, accounts) {
  const resolvedInput = resolveWildcardValues(
    userInput,
    accounts,
    journalEntries
  );
  const {startAccount, endAccount, startPeriod, endPeriod} = resolvedInput;

  debugger

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

export default connect(state => {
  let balance = [];
  /* YOUR CODE GOES HERE */
  if (state.journalEntries.length > 0 && state.accounts.length > 0) {
    const filteredEntries = filterJournalEntries(
      state.journalEntries,
      state.userInput,
      state.accounts
    );
    balance = transformData(state.accounts, filteredEntries);
  }

  debugger

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput,
  };
})(BalanceOutput);
