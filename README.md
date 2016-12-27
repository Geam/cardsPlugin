# cardsPlugin
A task management plugin for [KeeeX chatops](https://keeex.me/download-keeex/) allowing to track work in scrum-like display working model

## How to build
### Install dependencies
With npm
```
npm install
```

With yarn (https://yarnpkg.com/)
```
yarn
```

### Create the zip
```
$(npm bin)/grunt
```

### Clean
```
$(npm bin)/grunt mrproper
```

## How to set up development environement
First, install dependencies, see How to build -> Install dependencies

Then, you need to have the latest [Node web kit](https://nwjs.io/) stable sdk.

To start the plugin, you need to have [KeeeX chatops](https://keeex.me/download-keeex/) started. Then issue the following command:
```
/path/to/nw app/
```
