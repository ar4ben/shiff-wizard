import React from 'react';
import './App.css';
import ResponsesTable from './components/responsesTable';

function InfotabUI() {
  return (
    <div className="App">
      <header className="App-header">
        <ResponsesTable />
      </header>
    </div>
  );
}

export default InfotabUI;