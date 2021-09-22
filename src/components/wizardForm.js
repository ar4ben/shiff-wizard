/*global chrome*/
import React from "react";
import Button from '@mui/material/Button';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import ClearAllIcon from '@material-ui/icons/ClearAll';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';

const CustomTextField = styled(TextField)({
  '& .MuiInputLabel-root': {
    color: '#1976d2',
  },
  '& .MuiOutlinedInput-root': {
    color: 'ghostwhite',
    '& fieldset': {
      borderColor: 'rgba(25, 118, 210, 0.5)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(25, 118, 210, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'rgba(25, 118, 210, 0.5)',
    },
  },
});

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
          <Stack spacing={2}>
            <CustomTextField
              id="outlined-basic" 
              label="Select Text Snippet" 
              variant="outlined" 
              value={this.state.selectedSnippet} 
              onChange={this.handleChange}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={this.addSnippet}>
              Add Snippet
            </Button>
            <CustomTextField
              multiline
              value={this.state.allSnippets}
              id="outlined-textarea" 
              label="Selected Snippets" 
              variant="outlined" 
              value={this.state.allSnippets} 
            />
            <Button variant="contained" startIcon={<SearchIcon />} type="submit">
              Track Snippets
            </Button>
            <Button variant="contained" startIcon={<ClearAllIcon />} onClick={this.clearAll}>
              Clear All
            </Button>
          </Stack>
        </form>
      </div>
    );
  }
}

export default WizardForm;
