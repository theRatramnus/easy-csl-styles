"use strict";

const { group } = require('console');
const { type } = require('os');
const { citables } = require('./citables');
const { createCSL, setCreatorParameters, setShortenNames } = require('./csl-creator');
const { CSLEngine } = require('./csl-engine');


// Example usage assuming 'placeholders' is properly defined
//console.log(createCSL(placeholders));
/*<locale xml:lang="de">
            <terms>
            <term name="et-al">${et_al_term}</term>
            <term name="ibid">${ibid_term}</term>
            <term name="retrieved">zugegriffen am</term>
            <term name="accessed">Zugriff:</term>
            </terms>
    </locale>*/


function createStyle(title, ID, name, summary, published, updated, book, article_journal, chapter, entry_encyclopedia, article_newspaper, et_al_term, citation, ibid_term) {
    return `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="note" version="1.0" demote-non-dropping-particle="never" default-locale="de">
  <info>
    <title>${title}</title>
    <id>${ID}</id>
    <author>
      <name>${name}</name>
    </author>
    <contributor>
      <name>Ludwig Patzold</name>
    </contributor>
    <summary>${summary}</summary>
    <updated>${updated}</updated>
    <category citation-format="note"/>
  </info>


<!--#############Hier steht die Zitation in den Fußnoten/-->
  ${citation}
  
<!--#############Hier beginnt die Bibliographie/-->
  <bibliography>
    <layout>
      
<!--##############Hier beginnen die Angaben zum Buch/-->
        <choose>
          <if type="book" match="any">
          ${book}
          </if>
        </choose>

<!--###############Hier beginnt der Zeitschriftenartikel/-->
        <choose>
          <if type="article-journal" match="any">
            ${article_journal}
          </if>
        </choose>

<!--###############Hier beginnt der Artikel im Sammelband/-->
        <choose>
          <if type="chapter" match="any">
            ${chapter}
          </if>
        </choose>



<!--###############Hier beginnt der Lexikoneintrag/-->
        <choose>
          <if type="entry-encyclopedia" match="any">
            ${entry_encyclopedia}
          </if>
        </choose>


<!--###############Hier beginnt der Zeitungsartikel/-->
        <choose>
          <if type="article-newspaper" match="any">
            ${article_newspaper}
          </if>
        </choose>


    </layout>
  </bibliography>
</style>
`;
}


function createCitation(book, article_journal, chapter, entry_encyclopedia, article_newspaper, subsequent, querverweis) {
    return `
    <citation>
    <layout>
      <choose>
        <if match="all" position="first">

            <choose>
              <if type="book" match="any">
              ${book}
              </if>
            </choose>

            <choose>
              <if type="article-journal" match="any">
              ${article_journal}
              </if>
            </choose>

            <choose>
              <if type="chapter" match="any">
                ${chapter}
                </if>
            </choose>

            <choose>
              <if type="entry-encyclopedia" match="any">
                ${entry_encyclopedia}
              </if>
            </choose>

            <choose>
              <if type="article-newspaper" match="any">
                ${article_newspaper}
              </if>
            </choose>
  
        </if>
      </choose>
     
      <choose>
        <if match="any" position="ibid">
          <text term="ibid"/>
        </if>
        
        <else>
          <choose>
            <if match="any" position="subsequent">
             ${subsequent}
            </if>
          </choose>
          <choose>
            <if variable="first-reference-note-number">
            ${querverweis}
            </if>
        </choose>

        
        </else>
      </choose>
    
    </layout>
  </citation>`
}


function getCurrentXMLTimestamp() {
    const now = new Date();

    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');

    const timestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;

    return timestamp;
}

function getCurrentYear() {
    const now = new Date();

    const year = now.getUTCFullYear();
    
    return year
}

function fetchInfo(ids, shorten) {
    let results = {}
        
    // Loop through each id and get the updated textContent or value
    for (const id of ids) {
        const element = document.getElementById(id);
        console.log(id)
        console.log(element)
        const result = element.getAttribute("value")
        let key = id
        if (shorten) {
            key = key.slice(4, key.length)
        }
        results[key] = result
        console.log("fetched ", key, result)
        console.log(result);
    }
    return results
}

function fetchGeneralInfo() {
    const ids = ["NameDesStyles", "AutorDesStyles", "BeschreibungdesStyles", "IDDesStyles", "cit-EbdForm", "bib-etalLabel"]
    return fetchInfo(ids, false)
}

function fetchStylingInfo(prefix) {
    const ids = [prefix + "book", prefix + "article", prefix + "chapter", prefix + "encyclopedia-entry", prefix + "article-newspaper" , prefix + "delimiter", prefix + "etal"]
    return { ...fetchInfo(ids, true), shortenNames: document.getElementById(prefix + 'AutorGekuerzt').checked }
}

function buildStyle() {
    const generalInfo = fetchGeneralInfo()
    const bibInfo = fetchStylingInfo("bib-")
    const citInfo = fetchStylingInfo("cit-")
        
    // Using the results array to create the text
    const styleTitle = generalInfo["NameDesStyles"]

        

    //createCitation(book, article_journal, chapter, entry_encyclopedia, subsequent)
    function setCSLParameters(info) {
        setCreatorParameters(info["delimiter"], info["etal"], info.shortenNames)
    }
    setCSLParameters(citInfo);

    const createStyleCSL = (obj) => {
        return {
            book: createCSL(obj["book"]),
            article: createCSL(obj["article"]),
            chapter: createCSL(obj["chapter"]),
            entry_encyclopedia: createCSL(obj["encyclopedia-entry"]),
            article_newspaper: createCSL(obj["article-newspaper"])
        }
    }
    const citCSL = createStyleCSL(citInfo)
        
    setShortenNames(document.getElementById("cit-KurzzitatAbkuerzung").checked);
    const kurzzitat = createCSL(document.getElementById("cit-Kurzzitat").value)
        


    const citation = createCitation(citCSL.book, citCSL.article, citCSL.chapter, citCSL.entry_encyclopedia, citCSL.article_newspaper, kurzzitat, createCSL(document.getElementById("cit-Querverweis").value))

    //console.log(citation)



    setCSLParameters(bibInfo)

    const bibCSL = createStyleCSL(bibInfo)

    let text = createStyle(styleTitle, generalInfo["IDDesStyles"], generalInfo["NameDesStyles"], generalInfo["BeschreibungdesStyles"], getCurrentYear(), getCurrentXMLTimestamp(), bibCSL.book, bibCSL.article, bibCSL.chapter, bibCSL.entry_encyclopedia, bibCSL.article_newspaper, generalInfo["etalLabel"], citation, generalInfo["cit-EbdForm"])
        

    // make the generated xml look nice (needed, zotero won't accept it otherwise)
    var convert = require('xml-js');
    const convertOptions = { compact: false, spaces: 4 }
    var jsonRepresentation = convert.xml2json(text, convertOptions);
    text = convert.json2xml(jsonRepresentation, convertOptions);

    return text
}


async function main() {

    const previewEngine = await CSLEngine.build("de-DE", citables)


    document.getElementById('btn').addEventListener('click', function () {
        const text = buildStyle();
        
        // update the preview engine
        previewEngine.updateStyle(text);

        //  download the style
        const filename = styleTitle + ".csl";

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

        updatePreview(previewEngine);

        // set the style to the preview style
        
        
    });
    document.getElementById('Uebernehmen-btn').addEventListener('click', function () {
        const bibInfo = fetchStylingInfo("bib-")

        
        const ids = function (prefix) { return [prefix + "book", prefix + "article", prefix + "chapter", prefix + "encyclopedia-entry", prefix + "delimiter", prefix + "etal"] }
        console.log(bibInfo)
        for (const id of ids("cit-")) {
            const element = document.getElementById(id);
            console.log(id, element, bibInfo[id.slice(4, id.length)])
            element.setAttribute("value", bibInfo[id.slice(4, id.length)])
        }
        


    });
    document.getElementById('updateCitables-btn').addEventListener('click', function(event) {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    console.log("citation data loaded", e.target.result);
                    previewEngine.updateItems(JSON.parse(e.target.result));
                };
                reader.readAsText(file);
            } else {
                console.log('No file selected');
            }
    });
    getAllElementsByTag("ENTRY-FIELD").filter((element) => element.id.includes("bib-")).forEach((element) => {
        element.addEventListener("value-changed", (event) => {
            const style = buildStyle();
            previewEngine.updateStyle(style);
            updatePreview(previewEngine);
        })
    })
}

function updatePreview(previewEngine) {
    console.log("Updating preview...");
    const preview = document.getElementById("preview");
    console.log(preview)
    console.log(preview.children)
    for (const child of preview.children) {
        console.log(child.tagName)
        if (child.tagName === "DIV") {
            const type = child.id.substring(12, child.id.length);
            console.log("Updating preview type:", type);
            child.innerHTML = previewEngine.previewType(type);
            console.log("Updated preview type:", type, child.innerHTML);
        }
    }
    console.log("Updated preview.");
}

function getAllElementsByTag(tagName) {
  // Use document.getElementsByTagName to get a collection of all elements with the specified tag name
  const elements = document.getElementsByTagName(tagName);
  
  // Convert the HTMLCollection to an array
  const elementsArray = Array.from(elements);
  
  return elementsArray;
}


addEventListener("DOMContentLoaded", (event) => { main(); });
