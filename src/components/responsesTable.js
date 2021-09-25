/*global chrome*/
import React from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { spacing } from "@mui/system";

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

  prepareResponses = () => {
    let responseList = [];
    Object.keys(this.state.responses).forEach(snippet => {
      Object.keys(this.state.responses[snippet]).forEach((resource, index) => {
        const snippetInfo = this.state.responses[snippet][resource];
        let response = snippetInfo.slice(0, 5).join('\n');
        if (snippetInfo.length > 5) {
          response += `\n...More than ${snippetInfo.length} matches founded...`;
        }
        responseList.push(
          { id: index, snippet, resource, response}
        )
      });
    });
    return responseList;
  }

  render() {
    return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Snippet</TableCell>
            <TableCell>Resource</TableCell>
            <TableCell>Response</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.prepareResponses().map((row) => (
            <TableRow
              key={row.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>{row.snippet}</TableCell>
              <TableCell>{row.resource}</TableCell>
              <TableCell sx={{ whiteSpace: 'pre'}}>{row.response}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    );
  }
}

export default ResponsesTable;
