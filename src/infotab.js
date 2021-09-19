import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import InfotabUI from './InfotabUI';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <InfotabUI />
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.unregister();
