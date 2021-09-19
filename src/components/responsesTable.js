/*global chrome*/
import React from "react";

class ResponsesTable extends React.Component {
  state = {
    responses: {}
  };

  componentDidMount() {
    chrome.runtime.onMessage.addListener((msg, x, sendResponse) => {
        if (msg.responses) {
          sendResponse({answer: "accepted"});
          this.setState({
            responses: msg.responses
          });
        }
    });
  }

  renderResponses = () => {
    let responseList = [];
    Object.keys(this.state.responses).forEach(snippet => {
      Object.keys(this.state.responses[snippet]).forEach((resourse, index) => {
        const snippetInfo = this.state.responses[snippet][resourse];
        let response = snippetInfo.slice(0, 5).join('\n');
        if (snippetInfo.length > 5) {
          response += `\n...More than ${snippetInfo.length} matches founded...`;
        }
        responseList.push(
          <tr key={index}>
            <td>{snippet}</td>
            <td>{resourse}</td>
            <td>{response}</td>
          </tr>
        )
      });
    });
    return responseList;
  }

  render() {
    return (
      <div>
        <table>
          <thead>
            <tr>
              <th>Snippet</th>
              <th>Resourse</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>{ this.renderResponses() }</tbody>
        </table>
      </div>
    );
  }
}

export default ResponsesTable;
