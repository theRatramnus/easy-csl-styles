const CSL = require('citeproc');


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



async function main() {
  var chosenLibraryItems = "https://api.zotero.org/groups/459003/items?format=csljson&limit=8&itemType=journalArticle";

  var chosenStyleID = "chicago-fullnote-bibliography";

  var citationData = JSON.parse(await fetchTextFileContents(chosenLibraryItems));

  var citations = {};
  var itemIDs = [];
  for (var i=0,ilen=citationData.items.length;i<ilen;i++) {
    var item = citationData.items[i];
    if (!item.issued) continue;
    if (item.URL) delete item.URL;
    var id = item.id;
    citations[id] = item;
    itemIDs.push(id);
  }

  var locale = await fetchTextFileContents("https://raw.githubusercontent.com/citation-style-language/locales/4fa753374e7998a2fa53edbfed13ed480095a484/locales-de-DE.xml")
  var style =  await fetchTextFileContents("https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-fullnote-bibliography.csl")

  var citeprocSys = {
    retrieveLocale: function (lang){
      return locale
    },
    retrieveItem: function(id){
      return citations[id];
    }
  };

  function getProcessor(styleID) {
    
    var styleAsText = style;
    var citeproc = new CSL.Engine(citeprocSys, styleAsText);
    return citeproc;
  };

  function processorOutput() {
    var citeproc = getProcessor(chosenStyleID);
    citeproc.updateItems(itemIDs);
    var result = citeproc.makeBibliography();
    return result[1].join('\n');
  }

  console.log(processorOutput());
}
