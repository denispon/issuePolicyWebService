var EMPTY = 0;
var LOADING = 1;
var DONE = 2;
var positiveIdAndUpdateVersionRegex = /id="[0-9]{1,}" updateVersion="[0-9]{1,}"/ig; 
var ID = 'id';
var UPDATE_VERSION = 'updateVersion';
var TYPE = 'type';
var file = null;
var productVersionLobVORefKey = 'productVersionLobVORef';
var coverIVOsKey = 'coverIVOs';

function execute(file, callback){
    var reader = new FileReader();
    var text = null;
    var xml = null;

    reader.onload = function(event){
        text = reader.result;   
    };

    reader.onloadend = function () {
        textObj = countAndReplace(text, positiveIdAndUpdateVersionRegex, '');
        parser = new DOMParser();
        var parsedXml = parser.parseFromString(textObj.updatedText, "text/xml");
        callback(parsedXml);
    };

    reader.readAsText(file);

    if(reader.error != null){
        console.log(reader.error);
    }
}

function countAndReplace(text, regex, value){
    var counter = (text.match(regex)).length;
    var updatedText = text.replace(regex, value);
    return {updatedText: updatedText, count: counter};
}


function saveToFile(document){
    var serializer = new XMLSerializer();
    var serialized = serializer.serializeToString(document)
    var blob = new Blob([serialized],  {type : 'text/xml'});
    saveAs(blob, "issuePolicy.xml");
}

function prepareIssuePolicyRequest(){
    console.log("In prepare issuePolicy request");
    execute(file, editIssuePolicyRequest);
    return false;
}

function analyzePolicyLobIVO(element, assetIVOs, policyLobIVOMap){
    var children = element.children;
    for(var i in children){
        var child = children[i];
        if(child.tagName === 'coverIVOs'){
            coverIVOs = policyLobIVOMap.get(coverIVOsKey); 
            coverIVOs.push(child);
        }
        analyzePolicyLobIVO(child, assetIVOs, policyLobIVOMap);
    }

}

function analyzeXML(){
    execute(file, runAnalyzeXML);
    return false;
}

function  getAssetDetails(assetIVOArray, assetIVOElement){
    var attributes = assetIVOElement.attributes;
    if(attributes){
        var typeAttriute = attributes.getNamedItem(TYPE);
        assetIVOArray.push(typeAttriute.nodeValue);
    }
    return assetIVOArray;
}

function analyzeCoverIVOs(coverIVOs){
    var policyLobIVOsDetailsDiv = document.getElementById('policyLobIVOsDetailsDiv');
    var coverIVOsDetailsDiv = document.createElement('div');
    policyLobIVOsDetailsDiv.appendChild(coverIVOsDetailsDiv);
    var coverIVOsParagraph = document.createElement('p');
    coverIVOsParagraph.innerText += 'Covers:';
    coverIVOsDetailsDiv.appendChild(coverIVOsParagraph);

    for(var i in coverIVOs){
        var children = coverIVOs[i].children;
        for(var i in children){
            if(children[i].tagName === 'productLineGroupVORef'){
                var coverIVODetailsDiv = document.createElement('div');
                coverIVODetailsDiv.innerText += children[i].textContent;
                coverIVOsDetailsDiv.appendChild(coverIVODetailsDiv);
            }
        }
    }
}

function analyzePolicyContacts(policyContacts, policyContactsMap){
    console.log("In analyzePolicyContacts");
    var policyContactsIVOsDiv = document.getElementById('policyContactsIVOsDiv');
    if(policyContacts !== null){
        policyContactsIVOsDiv.innerHTML += '<p>Policy Contact Details:</p>'
        var children = policyContacts.children;
        for(var i in children){
           var child = children[i];
           if(child.children !== null && child.children !== undefined){
               var policyContactRole = child.children[0].textContent;
               var policyContactExtNum = child.children[1].textContent;
               var policyContactDetailsDiv = document.createElement('div');
               policyContactDetailsDiv.innerText +=  policyContactRole + "  "
                         + policyContactExtNum;
               policyContactsIVOsDiv.appendChild(policyContactDetailsDiv);
           }
       
           
        }
    }

    
}

function runAnalyzeXML(xmlFile){
    console.log("In runAnalyzeXML ");
    var policyLobIVOs = [];
    var policyContactsMap = new Map();
   
    for(var i in xmlFile.all){
        var tagName = xmlFile.all[i].tagName;
        if(tagName === 'policyLobIVOs'){
            policyLobIVOs.push(xmlFile.all[i]);
        }
        if(tagName === 'policyContactIVOsList'){
            analyzePolicyContacts(xmlFile.all[i], policyContactsMap);
        }
    }


    var policyLobIVOsDetailsDiv = document.getElementById('policyLobIVOsDetailsDiv');

    policyLobIVOs.forEach(policyLobIVO => {
        var policyLobIVOMap = new Map();
        policyLobIVOMap.set(productVersionLobVORefKey, policyLobIVO.children[2].textContent);
        var policyLobIVOsDetailsDiv = document.getElementById('policyLobIVOsDetailsDiv');
        var policyLobIVODetailsDiv = document.createElement('div');
        policyLobIVOsDetailsDiv.appendChild(policyLobIVODetailsDiv);
        var policyLobIVOTypeParagraph = document.createElement('p');
        policyLobIVODetailsDiv.appendChild(policyLobIVOTypeParagraph);
        policyLobIVOTypeParagraph.innerText += "Line Of Busines:  " + policyLobIVOMap.get(productVersionLobVORefKey);
        var assetIVOs = [];
        var coverIVOs = [];
        policyLobIVOMap.set(coverIVOsKey, coverIVOs);
        analyzePolicyLobIVO(policyLobIVO, assetIVOs, policyLobIVOMap);
        analyzeCoverIVOs(policyLobIVOMap.get(coverIVOsKey));
       
       

    });

    return false;
  
}

function editIssuePolicyRequest(xmlFile){
    console.log("In editIssuePolicyRequest");
    for(var i in xmlFile.all){
        var tagName = xmlFile.all[i].tagName;
        if(tagName === 'assetIVO' || tagName === 'policyHeaderIVO'){
            var attributes = xmlFile.all[i].attributes;
            if(attributes){
                attributes.removeNamedItem(ID);
                attributes.removeNamedItem(UPDATE_VERSION);
            }
        }

        if(tagName === 'externalHeaderNumber'       || 
           tagName === 'externalProposalNr'         || 
           tagName === 'externalProposalNr'         || 
           tagName === 'preferredDeliveryTypeRef'   ||  
           tagName === 'preferredDeliveryTypeRef'   ||
           tagName === 'preferredDeliveryAddressIVO'||
           tagName === 'activePolicyId'             ||
           tagName === 'originalLobAssetId'
        ){
            xmlFile.all[i].replaceWith('');
        }

    }

    saveToFile(xmlFile);

}



function handleFileSelect(event) {
    console.log("In the handleFileSelect");
    file = event.target.files[0];
    if(file){
        document.getElementById("runPrepareIssuePolicyRequest").disabled = false;
        document.getElementById("analyzeXML").disabled = false;
    }else{
        alert("You have to select file to be able to run the service");
    }  
  }

