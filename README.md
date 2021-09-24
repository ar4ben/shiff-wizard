## Sniff Wizzard
An extension for Chrome browser. Allows to select different text snippets on a page and find requests which contains this snippets.
Based on `chrome.debugger` API. 

`Reactjs`, `Material-UI` are used for UI part.

### Installation 
```bash
1. git clone git@github.com:ar4ben/shiff-wizard.git
2. cd shiff-wizard
3. npm install
4. npm run build
5. Go to chrome://extensions/ page in your Chrome browser. 
6. Click 'Load unpacked' button in the top left corner and specify the path to 'build' folder inside 'sniff-wizard' project.
```
### Development
For development use command `npm run build && npm run watch`. 
The project uses 'hot reload' feature which automatically reloads the extension after each save in project files.   
