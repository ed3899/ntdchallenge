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
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
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

function filterJournalEntries(journalEntries, userInput) {
  const {startAccount, endAccount, startPeriod, endPeriod} = userInput;

  // Convert startPeriod and endPeriod to Date objects if they are not already
  const startDate = new Date(startPeriod);
  const endDate = new Date(endPeriod);

  debugger

  return journalEntries.filter(entry => {
    const accountNumber = entry.ACCOUNT;
    const entryDate = entry.PERIOD;
    debugger

    // Filter based on account range and period range (inclusive)
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
      state.userInput
    );
    balance = transformData(state.accounts, filteredEntries);
  }

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput,
  };
})(BalanceOutput);
