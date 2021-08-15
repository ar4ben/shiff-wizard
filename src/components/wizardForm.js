/*global chrome*/
import React from "react";

class WizardForm extends React.Component {
  state = {
    selectedSnippet: "",
    allSnippets: [],
  };

  componentDidMount() {
    window.addEventListener("message", (event) => {
      this.setState({
        selectedSnippet: event.data,
      });
    });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      const tabUrl = tabs[0].url;
      chrome.storage.local.set({ toggled: true, tabUrl });
      chrome.runtime.sendMessage({
        message: "wanted",
        goal: this.state.allSnippets,
        tabId,
        url: tabUrl,
      });
    });
  };

  handleChange = (event) => {
    this.setState({ selectedSnippet: event.target.value });
  };

  clearAll = (e) => {
    this.setState({ selectedSnippet: "", allSnippets: [] });
  };

  addSnippet = (e) => {
    e.preventDefault();
    this.setState({
      allSnippets: [...this.state.allSnippets, this.state.selectedSnippet],
    });
  };

  render() {
    return (
      <div>
        <form id="form" onSubmit={this.handleSubmit}>
          <button id="clearAll" onClick={this.clearAll}>
            Clear All
          </button>
          <input
            type="text"
            id="snippet"
            value={this.state.selectedSnippet}
            onChange={this.handleChange}
          />
          <button id="addSnippet" onClick={this.addSnippet}>
            Add Snippet
          </button>
          <textarea
            id="code"
            value={this.state.allSnippets}
            readOnly
          ></textarea>
          <button type="submit" id="checkPage" onClick={this.handleClick}>
            Track Snippets
          </button>
        </form>
        <table
          style={{
            width: "100%",
            border: "solid 1px black",
            borderCollapse: "collapse",
          }}
          id="traffic_result"
        >
          <thead>
            <tr>
              <th>Snippet</th>
              <th>Resource</th>
              <th>Response</th>
            </tr>
          </thead>
        </table>
      </div>
    );
  }
}

export default WizardForm;
