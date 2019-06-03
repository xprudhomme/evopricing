# Evopricing scrapers

Evopricing car rental quotes test scrapers, based on Node.js + [Puppeteer](https://github.com/GoogleChrome/puppeteer) (headless chrome)

## Requirements
* [Node.js](https://nodejs.org/en/download/) 8.12.0 or greater

## Installation

1. Clone this repository on your machine
```bash
git clone https://github.com/xprudhomme/evopricing.git
```

2. Use the package manager [npm](https://www.npmjs.com/) to install Node.js modules dependencies

```bash
cd evopricing/
npm i
```

## Usage

To run the test/fake server (mockup), and see enqueued URLs sent from the scripts:

```bash
cd tests/
node fakeserver.js
```
