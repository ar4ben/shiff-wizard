/*global chrome*/
import React from "react";
import { DataGrid } from '@mui/x-data-grid';
import { withStyles } from "@mui/styles";

// a hack to give rows in the table dynamic height. Otherwise response text in cells will be partially hidden 
// based on https://github.com/mui-org/material-ui-x/issues/417#issuecomment-917069476
const StyledDataGrid = withStyles({
  root: {
    '& .MuiDataGrid-viewport, & .MuiDataGrid-renderingZone, & .MuiDataGrid-row': {
      maxHeight: 'fit-content!important',
    },
    '& .MuiDataGrid-row .MuiDataGrid-columnsContainer': {
      maxHeight: 'none!important'
    },
    '& .MuiDataGrid-columnHeaderTitle, & .MuiDataGrid-cell': {
      textOverflow: 'unset',
      whiteSpace: 'normal',
      lineHeight: '1.2!important',
      maxHeight: 'fit-content!important',
      minHeight: 'auto!important',
      height: 'auto',
      display: 'flex',
      alignItems: 'center',
      alignSelf: 'stretch',

      '& > div': {
        maxHeight: 'inherit',
        width: '100%',
        whiteSpace: 'initial',
        lineHeight: '1'
      }
    },

    '& .MuiDataGrid-columnHeader > div': {
      height: '100%'
    },

    '& .MuiDataGrid-columnHeaderWrapper': {
      maxHeight: 'none!important',
      flex: '1 0 auto',
    },

    '& .MuiDataGrid-row .MuiDataGrid-columnsContainer': {
      maxHeight: 'none!important'
    },
  }
})(DataGrid);

const columns = [
  { field: 'snippet', headerName: 'Snippet', flex: 1, },
  { field: 'resource', headerName: 'Resource', flex: 2, },
  { field: 'response', headerName: 'Response', flex: 3, },
];

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
      <div style={{ width: '100%' }}>
        <StyledDataGrid
          autoHeight
          rows={ this.renderResponses() }
          columns={columns}
          checkboxSelection
        />
    </div>
    );
  }
}

export default ResponsesTable;
