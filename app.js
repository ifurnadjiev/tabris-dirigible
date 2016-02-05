var CATALOG_URL = "examples/index.json";

tabris.registerType("_AppManager", {
  _type: "tabris.AppManager",
  _properties: {current: "any"}
});

tabris.registerType("_Dialog", {
  _type: "tabris.ClientDialog",
  _properties: {title: "any", message: "any", buttonOk: "any"}
});

var page = tabris.create("Page", {
  title: "Tabris.js for Dirigible",
  topLevel: true
});

var scriptsList = createScriptsList().appendTo(page);

function createScriptsList() {
  var list = tabris.create("CollectionView", {
    layoutData: {left: 0, right: 0, top: 0, bottom: 0},
    itemHeight: 72,
    refreshEnabled: true,
    refreshMessage: " ",
    initializeCell: initializeScriptsListCell
  });
  list.on("select", function(widget, item) {
    startApplication("examples/" + item.url);
  }).on("refresh", function() {
    loadScripts();
  });
  return list;
}

function initializeScriptsListCell(cell) {
  var nameLabel = tabris.create("TextView", {
    markupEnabled: true,
    maxLines: 1,
    textColor: "rgb(74, 74, 74)",
    layoutData: {left: 15, right: 15, top: 0}
  });
  var descriptionLabel = tabris.create("TextView", {
    markupEnabled: true,
    maxLines: 2,
    textColor: "rgb(123, 123, 123)",
    layoutData: {left: 15, right: 15, top: [nameLabel, 5]}
  });
  tabris.create("Composite", {
    layoutData: {left: 0, right: 0,  centerY: 0}
  }).append(nameLabel, descriptionLabel).appendTo(cell);
  tabris.create("Composite", {
    layoutData: {height: 1, right: 0, left: 0, bottom: 0},
    background: "rgba(0, 0, 0, 0.1)"
  }).appendTo(cell);
  cell.on("change:item", function(widget, item) {
    nameLabel.set("text", item.name);
    descriptionLabel.set("text", item.description);
  });
}

function loadScripts() {
  scriptsList.set("refreshIndicator", true);
  scriptsList.set("refreshMessage", "Downloading Scripts List...");
  sendRequest(CATALOG_URL, function(response) {
    try {
      var items = JSON.parse(response).map(function(item) {
        return {
          name: item.title,
          description: "<small>" + item.description + "</small>",
          url: item.path
        };
      });
      scriptsList.set("items", items);
    } catch (error) {
      scriptsList.set("items", []);
    }
    scriptsList.set("refreshIndicator", false);
    scriptsList.set("refreshMessage", " ");
  });
}

function sendRequest(url, callback) {
  var request = new tabris.XMLHttpRequest();
  request.timeout = 5000;
  request.onreadystatechange = function() {
    if (callback && request.readyState === request.DONE) {
      callback.apply(null, [request.responseText, request.status]);
    }
  };
  request.open("GET", url);
  request.send();
}

function startApplication(url, beforeStart) {
  var normalizedUrl = normalizeURL(url, "package.json");
  sendRequest(normalizedUrl, function(response, status) {
    if (status === 200) {
      if (beforeStart) {
        beforeStart.apply(null, [url]);
      }
      tabris("_AppManager").set("current", normalizedUrl);
    } else {
      showDialog("Could not establish connection", "Could not load file: " + normalizedUrl);
    }
  });
}

function normalizeURL(url, fileName) {
  var urlParts = url.split("?");
  var baseUrl = urlParts[0];
  var queryString = urlParts.length === 1 ? "" : "?" + urlParts[1];
  if (endsWith(baseUrl, "/" + fileName)) {
    return url;
  } else if (endsWith(baseUrl, "/")) {
    return baseUrl + fileName + queryString;
  }
  return baseUrl + "/" + fileName + queryString;
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function showDialog(title, message) {
  tabris.create("_Dialog", {
    title: title,
    message: message,
    buttonOk: "OK"
  })._nativeCall("open");
}

loadScripts();
page.open();