/*global chrome*/
import React from "react";

class WizardForm extends React.Component {
  state = {
    selectedSnippet: "",
    allSnippets: [],
    responses: {}
  };

  componentDidMount() {
    window.addEventListener("message", (event) => {
      this.setState({
        selectedSnippet: event.data,
      });
    });
    chrome.runtime.onMessage.addListener((msg, x, sendResponse) => {
      if (msg === 'toggle') {
        toggle();
      } else {
        console.log(msg.greeting);
        sendResponse({answer: "accepted"});
        this.setState({
          responses: msg.greeting.matches.responses
        });
      }
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

  renderResponses = () => {
    let responseList = [];
    Object.keys(this.state.responses).forEach(textSnippet => {
      Object.keys(this.state.responses[textSnippet]).forEach((resourse, index) => {
        console.log('state responses:');
        console.log(this.state.responses);
        console.log('textSnippet:');
        console.log(textSnippet);
        console.log('resourse:');
        console.log(resourse);
        const snippetInfo = this.state.responses[textSnippet][resourse];
        let tdResponse = snippetInfo.slice(0, 5).join('\n');
        if (snippetInfo.length > 5) {
          tdResponse += `\n...More than ${snippetInfo.length} matches founded...`;
        }
        responseList.push(
          <tr>
            <td>{textSnippet}</td>
            <td>{resourse}</td>
            <td>{tdResponse}</td>
          </tr>
        )
      });
    });
    return responseList;
  }

  render() {
    return (
      <div>
        <form id="form" onSubmit={this.handleSubmit}>
          <button id="clearAll" onClick={this.clearAll}>
            Clear All2
          </button>
          <input
            type="text"
            id="snippet"
            value={this.state.selectedSnippet}
            onChange={this.handleChange}
          />
          <button id="addSnippet" onClick={this.addSnippet}>
            Add Snippet2
          </button>
          <textarea
            id="code"
            value={this.state.allSnippets}
            readOnly
          ></textarea>
          <button type="submit" id="checkPage" onClick={this.handleClick}>
            Track Snippets2
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
              <th>Snippet2</th>
              <th>Resource2</th>
              <th>Response2</th>
            </tr>
            { this.renderResponses() }
          </thead>
        </table>
      </div>
    );
  }
}

export default WizardForm;
