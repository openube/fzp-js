/**
* BUILD ARTIFACT, DO NOT EDIT BY HAND
**/'use strict';

var xml2js = require('xml2js');
var parseXml = xml2js.parseString;
var FZP = require('./fzp/fzp');
var FZPConnector = require('./fzp/connector');
var FZPConnectorView = require('./fzp/connector-view');

var _require = require('fritzing-parts-api-client-js'),
    FritzingPartsAPI = _require.FritzingPartsAPI,
    FritzingPartsAPIClient = _require.FritzingPartsAPIClient;

/**
 * Load a FZP file from the given URL.
 *
 * @example
 * const {FZPUtils} = require('fzp-js')
 *
 * FZPUtils.loadFZP('core/Arduino Nano3(fix).fzp')
 * .then((fzz) => {
 *   console.log(fzz.fz)
 * })
 * .catch((err) => {
 *   console.error(err)
 * })
 *
 * @param {String} src
 * @param {String} url URL to the FZP file.
 * @return {Promise}
 */


function loadFZP(src) {
  var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : FritzingPartsAPI;

  return FritzingPartsAPIClient.getFzp(src, url).then(function (fzp) {
    // let tmp = parseFZP(fzp);
    // console.log(tmp);
    return parseFZP(fzp);
  });
}

/**
 * Load a FZP and all linked SVGs
 *
 * @example
 * const {FZPUtils} = require('fzp-js')
 *
 * FZPUtils.loadFZPandSVGs('core/Arduino Nano3(fix).fzp')
 * .then((fzz) => {
 *   console.log(fzz)
 * })
 * .catch((err) => {
 *   console.error(err)
 * })
 *
 * @param {String} src
 * @param {String} url URL to the FZP file.
 * @return {FZP}
 */
function loadFZPandSVGs(src) {
  var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : FritzingPartsAPI;

  return loadFZP(src, url).then(function (fzp) {
    return fzp.loadSVGs(url + '/svg/core/').then(function () {
      return fzp;
    });
  });
}

/**
 * parse a fzp xml string
 * @param {String} data
 * @return {Promise}
 */
function parseFZP(data) {
  return new Promise(function (resolve, reject) {
    var fzp = new FZP();
    if (data) {
      parseXml(data, function (err, xml) {
        if (err) {
          return reject(err);
        }

        console.log(xml.module.tags);
        fzp.moduleId = xml.module.$.moduleId;
        fzp.fritzingVersion = xml.module.$.fritzingVersion;
        if (xml.module.version) fzp.version = xml.module.version[0];
        if (xml.module.title) fzp.title = xml.module.title[0];
        if (xml.module.description) fzp.description = xml.module.description[0];
        if (xml.module.author) fzp.author = xml.module.author[0];
        if (xml.module.date) fzp.date = xml.module.date[0];
        if (xml.module.url) fzp.url = xml.module.url[0];
        if (xml.module.label) fzp.label = xml.module.label[0];
        if (xml.module.tags) fzp.tags = xml.module.tags[0].tag;
        if (xml.module.taxonomy) fzp.taxonomy = xml.module.taxonomy;
        if (xml.module.language) fzp.language = xml.module.language;
        if (xml.module.family) fzp.family = xml.module.family;
        if (xml.module.variant) fzp.variant = xml.module.variant;
        if (xml.module.properties) {
          fzp.properties = parseProperties(xml.module.properties[0].property);
        }

        if (xml.module.views) {
          if (xml.module.views[0].iconView) {
            var iconViewLayer = xml.module.views[0].iconView[0].layers[0];
            fzp.views.icon.setImage(iconViewLayer.$.image);
            fzp.views.icon.setLayerId(iconViewLayer.layer[0].$.layerId);
          }
          if (xml.module.views[0].breadboardView) {
            var breadboardLayer = xml.module.views[0].breadboardView[0].layers[0];
            fzp.views.breadboard.setImage(breadboardLayer.$.image);
            fzp.views.breadboard.setLayerId(breadboardLayer.layer[0].$.layerId);
          }
          if (xml.module.views[0].pcbView) {
            var pcbViewLayer = xml.module.views[0].pcbView[0].layers[0];
            fzp.views.pcb.setImage(pcbViewLayer.$.image);
            for (var iLayer = 0; iLayer < pcbViewLayer.layer.length; iLayer++) {
              fzp.views.pcb.setLayerId(pcbViewLayer.layer[iLayer].$.layerId);
            }
          }
          if (xml.module.views[0].schematicView) {
            var schematicViewLayer = xml.module.views[0].schematicView[0].layers[0];
            fzp.views.schematic.setImage(schematicViewLayer.$.image);
            fzp.views.schematic.setLayerId(schematicViewLayer.layer[0].$.layerId);
          }
        }

        if (xml.module.connectors) {
          if (xml.module.connectors[0].connector) {
            for (var i = 0; i < xml.module.connectors[0].connector.length; i++) {
              var connector = xml.module.connectors[0].connector[i];

              // create the connector for the three views.
              var c = new FZPConnector();
              c.id = connector.$.id;
              c.name = connector.$.name;
              c.type = connector.$.type;
              if (connector.description) {
                c.description = connector.description[0];
              }

              if (connector.views[0].breadboardView) {
                c.views.breadboard = parseConnectorView(connector.views[0].breadboardView[0].p[0]);
              }

              if (connector.views[0].schematicView) {
                c.views.schematic = parseConnectorView(connector.views[0].schematicView[0].p[0]);
              }

              if (connector.views[0].pcbView) {
                for (var iPcb = 0; iPcb < connector.views[0].pcbView[0].p.length; iPcb++) {
                  switch (connector.views[0].pcbView[0].p[iPcb].$.layer) {
                    case 'copper0':
                      c.views.pcb.copper0 = parseConnectorView(connector.views[0].pcbView[0].p[iPcb]);
                      break;
                    case 'copper1':
                      c.views.pcb.copper1 = parseConnectorView(connector.views[0].pcbView[0].p[iPcb]);
                      break;
                  }
                }
              }

              fzp.connectors[c.id] = c;
            }
          }
        }

        return resolve(fzp);
      });
    }
  });
}

/**
 * Get the parsed xml object and map to a proper structure
 * @param {String} xml
 * @return {Object}
 */
function parseProperties(xml) {
  var data = {};
  // if (xml) {
  //   if (xml.length > 0) {
  for (var i = 0; i < xml.length; i++) {
    data[xml[i].$.name] = {
      value: xml[i]._,
      showInLabel: xml[i].$.showInLabel
    };
  }
  //   }
  // }
  return data;
}

/**
 * @param {Object} xml
 * @return {FZPConnectorView}
 */
function parseConnectorView(xml) {
  var conView = new FZPConnectorView();
  conView.layer = xml.$.layer || null;
  conView.svgId = xml.$.svgId || null;
  conView.legId = xml.$.legId || null;
  conView.terminalId = xml.$.terminalId || null;
  return conView;
}

/**
 * Create a xml string of a FZP instance.
 *
 * @example
 * const {marshalToXML} = require('fzp-js')
 *
 * const xmlData = FZPUtils.marshalToXML(fzp)
 * console.log(xmlData)
 *
 * @param {FZP} fzp
 * @return {String}
 */
function marshalToXML(fzp) {
  var builder = new xml2js.Builder();
  var data = {
    module: {
      $: {
        moduleId: fzp.moduleId,
        fritzingVersion: fzp.fritzingVersion
      },
      version: [fzp.version],
      title: [fzp.title],
      author: [fzp.author],
      label: [fzp.label],
      date: [fzp.date],
      tags: [{ tag: fzp.tags }],
      // properties: fzp.properties,
      description: [fzp.description],
      views: [[{}]],
      connectors: [[{}]]
    }
  };
  // let data = {
  //   module: Object.assign({}, fzp),
  // };
  // data.module.$ = {
  // };
  // delete data.moduleId;
  // delete data.fritzingVersion;
  //
  // data.module.tags =
  //
  // if (data.module) {
  //   if (data.module.views) {
  //     if (data.module.icon) {
  //       delete data.module.views.icon.svg;
  //     }
  //     if (data.module.breadboard) {
  //       delete data.module.views.breadboard.svg;
  //     }
  //     if (data.module.schematic) {
  //       delete data.module.views.schematic.svg;
  //     }
  //     if (data.module.pcb) {
  //       delete data.module.views.pcb.svg;
  //     }
  //   }
  // }
  return builder.buildObject(data);
}

module.exports = {
  loadFZP: loadFZP,
  loadFZPandSVGs: loadFZPandSVGs,
  parseFZP: parseFZP,
  parseProperties: parseProperties,
  marshalToXML: marshalToXML
};