const CSL = require('citeproc');
const { citables } = require('./citables');


async function fetchTextFileContents(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text(); // Assuming the file is in text format
        return data;
    } catch (error) {
        console.error('Error fetching the file:', error);
    }
}


export class CSLEngine {
    constructor(citationData, locale, lang, sytle) {
        this.sytle = sytle;
        this.lang = lang;
        this.locale = locale;
        this.allItemIDs = [];
        this.typeLookup = {};
        this.citations = {};
        this.updateItems(citationData);
        this.citeproc = new CSL.Engine(this, this.sytle);
    }
    updateItems(citationData) {
        for (var i = 0, ilen = citationData.length; i < ilen; i++) {
            var item = citationData[i];
            if (!item.issued) continue;
            if (item.URL) delete item.URL;
            var id = item.id;
            this.citations[id] = item;
            this.allItemIDs.push(id);
            this.typeLookup[item.type] = id;
        }
    }
    retrieveLocale(lang) {
        return this.locale;
    }
    retrieveItem(id) {
        return this.citations[id];
    }
    updateStyle(style) {
        this.sytle = style;
        this.citeproc = new CSL.Engine(this, this.sytle, this.lang, this.lang);
    }
    static async build(lang, citationData) {
        const style = await fetchTextFileContents("https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-fullnote-bibliography.csl");
        const locale = await fetchTextFileContents(`https://raw.githubusercontent.com/citation-style-language/locales/4fa753374e7998a2fa53edbfed13ed480095a484/locales-${lang}.xml`);
        return new CSLEngine(citationData, locale, lang, style);
    }
    createBibliography(itemIDs) {
        this.citeproc.updateItems(itemIDs);
        return this.citeproc.makeBibliography()[1];
    }
    previewType(type) {
        return this.createBibliography([this.typeLookup[type]]);
    }
}
/*
const test = async () => {
    console.log("Fetching style...");
    const style = await fetchTextFileContents("https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-fullnote-bibliography.csl");
    console.log("Style fetched.");
    console.log("Building engine...");
    const engine = await CSLEngine.build('de-DE', citables, style);
    console.log("Engine built.");
    console.log("Creating bibliography...");
    const bibliography = engine.previewType("article-newspaper");
    console.log("Bibliography created.");
    console.log("Printing bibliography...");
    console.log(bibliography);
    console.log("Bibliography printed.");
}

test();*/