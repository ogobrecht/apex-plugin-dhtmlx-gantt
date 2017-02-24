window.plugin = window.plugin || {};
plugin.dhtmlxGantt = {};
plugin.dhtmlxGantt.version = "0.1.0";

plugin.dhtmlxGantt.init = function() {
    //create jQuery objects for region ID and chart container ID
    plugin.dhtmlxGantt.regionIdElement = apex.jQuery("#" + plugin.dhtmlxGantt.regionId);
    plugin.dhtmlxGantt.chartContainerIdElement = apex.jQuery("#" + plugin.dhtmlxGantt.chartContainerId);
    //register apexrefresh event
    plugin.dhtmlxGantt.regionIdElement.bind("apexrefresh", function() {
        plugin.dhtmlxGantt.load();
    });
    //normalize apexPageItemsToSubmit from string to array
    plugin.dhtmlxGantt.pageItemsToSubmit = (
        plugin.dhtmlxGantt.pageItemsToSubmit === "" ?
        false :
        plugin.dhtmlxGantt.pageItemsToSubmit.replace(/\s/g, "").split(",")
    );
    //catch edit event for APEX, so that a custom APEX form can be opened by double clicking a task
    gantt.attachEvent("onBeforeLightbox", function(id) {
        apex.event.trigger(plugin.dhtmlxGantt.chartContainerIdElement, "dhtmlx_task_double_click", id);
        return false; //this prevents the default Gantt edit popup
    });
    //load initial data
    plugin.dhtmlxGantt.load();
};

plugin.dhtmlxGantt.load = function(data) {
    //trigger event, so that other dynamic actions registered on this event are called
    apex.event.trigger(plugin.dhtmlxGantt.regionIdElement, "apexbeforerefresh");
    //if data is provided (from anywhere) we save it and start the parsing
    if (data) {
        plugin.dhtmlxGantt.dataRaw = data;
        plugin.dhtmlxGantt.parse();
    }
    //without provided data...
    else {
        //...get new data from db via AJAX call...
        if (plugin.dhtmlxGantt.queryDefined) {
            apex.server.plugin(
                plugin.dhtmlxGantt.pluginId, {
                    p_debug: $v("pdebug"),
                    pageItems: plugin.dhtmlxGantt.pageItems
                }, {
                    //refreshObject: plugin.dhtmlxGantt.regionIdElement,
                    loadingIndicator: plugin.dhtmlxGantt.chartContainerIdElement,
                    success: function(dataString) {
                        plugin.dhtmlxGantt.dataRaw = dataString;
                        //data from query is allowed to be XML or JSON, so we have to parse it first here
                        plugin.dhtmlxGantt.parse();
                    },
                    error: function(xhr, status, errorThrown) {
                        plugin.dhtmlxGantt.util_logError("Unable to load data - message from jQuery AJAX call: " + xhr.responseText);
                        //trigger event, so that other dynamic actions registered on this event are called
                        apex.event.trigger(plugin.dhtmlxGantt.regionIdElement, "apexafterrefresh");
                    },
                    dataType: "text"
                }
            );
        }
        //...or provide example data
        else {
            plugin.dhtmlxGantt.dataParsed = {
                "data": [{
                        "id": 1,
                        "text": "Project #1 (NO REGION QUERY DEFINED: EXAMPLE DATA USED)",
                        "start_date": "01-04-2013",
                        "duration": 11,
                        "progress": 0.6,
                        "open": true
                    },
                    {
                        "id": 2,
                        "text": "Task #1",
                        "start_date": "03-04-2013",
                        "duration": 5,
                        "progress": 1,
                        "open": true,
                        "parent": 1
                    },
                    {
                        "id": 3,
                        "text": "Task #2",
                        "start_date": "02-04-2013",
                        "duration": 7,
                        "progress": 0.5,
                        "open": true,
                        "parent": 1
                    },
                    {
                        "id": 4,
                        "text": "Task #2.1",
                        "start_date": "03-04-2013",
                        "duration": 2,
                        "progress": 1,
                        "open": true,
                        "parent": 3
                    },
                    {
                        "id": 5,
                        "text": "Task #2.2",
                        "start_date": "04-04-2013",
                        "duration": 3,
                        "progress": 0.8,
                        "open": true,
                        "parent": 3
                    },
                    {
                        "id": 6,
                        "text": "Task #2.3",
                        "start_date": "05-04-2013",
                        "duration": 4,
                        "progress": 0.2,
                        "open": true,
                        "parent": 3
                    }
                ],
                "links": [{
                        "id": 1,
                        "source": 1,
                        "target": 2,
                        "type": "1"
                    },
                    {
                        "id": 2,
                        "source": 1,
                        "target": 3,
                        "type": "1"
                    },
                    {
                        "id": 3,
                        "source": 3,
                        "target": 4,
                        "type": "1"
                    },
                    {
                        "id": 4,
                        "source": 4,
                        "target": 5,
                        "type": "0"
                    },
                    {
                        "id": 5,
                        "source": 5,
                        "target": 6,
                        "type": "0"
                    }
                ]
            };
            plugin.dhtmlxGantt.render();
        }
    }
};

plugin.dhtmlxGantt.parse = function(data) {
    if (data) {
        plugin.dhtmlxGantt.dataRaw = data;
    }
    // data is an object
    if (plugin.dhtmlxGantt.dataRaw.constructor === Object) {
        plugin.dhtmlxGantt.dataParsed = plugin.dhtmlxGantt.dataRaw;
        plugin.dhtmlxGantt.render();
    }
    // data is a string
    else if (plugin.dhtmlxGantt.dataRaw.constructor === String) {
        // convert incoming data depending on type
        if (plugin.dhtmlxGantt.dataRaw.trim().substr(0, 1) === "<") {
            try {
                plugin.dhtmlxGantt.dataParsed = plugin.dhtmlxGantt.util_xml2json(plugin.dhtmlxGantt.util_parseXml(plugin.dhtmlxGantt.dataRaw));
            } catch (e) {
                plugin.dhtmlxGantt.util_logError("Unable to parse XML string: " + e.message);
            }
            if (plugin.dhtmlxGantt.dataParsed === null) {
                plugin.dhtmlxGantt.util_logError("Unable to parse XML string");
            } else {
                plugin.dhtmlxGantt.render();
            }
        } else if (plugin.dhtmlxGantt.dataRaw.trim().substr(0, 1) === "{") {
            try {
                plugin.dhtmlxGantt.dataParsed = JSON.parse(plugin.dhtmlxGantt.dataRaw);
            } catch (e) {
                plugin.dhtmlxGantt.util_logError("Unable to parse JSON string - please check for valid JSON before use here in plugin (e.g. https://jsonformatter.curiousconcept.com): " + e.message);
            }
            plugin.dhtmlxGantt.render();
        } else {
            plugin.dhtmlxGantt.util_logError("Your data string is not starting with \"<\" or \"{\" - parsing not possible");
        }
    }
    // data has unknown format
    else {
        plugin.dhtmlxGantt.util_logError("Unable to parse your data - input data can be a XML string, JSON string or JavaScript object.");
    }
};

plugin.dhtmlxGantt.render = function() {
    //correct data structure: we allow the name "tasks" instead of "data" (feels more natural), the vendor library needs to have a "data" attribute:
    if (!plugin.dhtmlxGantt.dataParsed.data && plugin.dhtmlxGantt.dataParsed.tasks) {
        plugin.dhtmlxGantt.dataParsed.data = plugin.dhtmlxGantt.dataParsed.tasks;
    }
    //push data into gantt chart
    try {
        gantt.parse(plugin.dhtmlxGantt.dataParsed);
    } catch (e) {
        plugin.dhtmlxGantt.util_logError("vendor base library was unable to use your data: " + e.message);
    }
    //trigger event, so that other dynamic actions registered on this event are called
    apex.event.trigger(plugin.dhtmlxGantt.regionIdElement, "apexafterrefresh");
};

// parse XML string to XML
plugin.dhtmlxGantt.util_parseXml = function(xml) {
    var dom = null;
    if (xml) {
        if (window.DOMParser) {
            try {
                dom = (new DOMParser()).parseFromString(xml, "text/xml");
            } catch (e) {
                dom = null;
                plugin.dhtmlxGantt.util_logError("DOMParser - unable to parse XML: " + e.message);
            }
        } else if (window.ActiveXObject) {
            try {
                dom = new ActiveXObject("Microsoft.XMLDOM");
                dom.async = false;
                // parse error ...
                if (!dom.loadXML(xml)) {
                    plugin.dhtmlxGantt.util_logError("Microsoft.XMLDOM - unable to parse XML: " + dom.parseError.reason +
                        dom.parseError.srcText);
                }
            } catch (e) {
                dom = null;
                plugin.dhtmlxGantt.util_logError("Microsoft.XMLDOM - unable to parse XML: " + e.message);
            }
        }
    }
    return dom;
};

plugin.dhtmlxGantt.util_xml2json = function(xml) {
    var obj = null,
        subobj, item, subItem, nodeName, attribute;
    //helper
    var item2json = function(item) {
        subobj = {};
        if (item.attributes.length > 0) {
            for (var i = 0; i < item.attributes.length; i++) {
                attribute = item.attributes.item(i);
                subobj[attribute.nodeName] = attribute.nodeValue;
            }
        }
        if (item.hasChildNodes()) {
            for (var j = 0; j < item.childNodes.length; j++) {
                subItem = item.childNodes.item(j);
                // check, if subItem has minimum one child (hopefully a textnode) inside
                if (subItem.hasChildNodes()) {
                    subobj[subItem.nodeName] = subItem.childNodes.item(0).nodeValue;
                } else {
                    subobj[subItem.nodeName] = "";
                }
            }
        }
        return subobj;
    };
    //main
    if (xml) {
        obj = {};
        obj.data = [];
        obj.links = [];
        if (xml.childNodes.item(0).hasChildNodes()) {
            for (var i = 0; i < xml.childNodes.item(0).childNodes.length; i++) {
                subobj = null;
                item = xml.childNodes.item(0).childNodes.item(i);
                nodeName = item.nodeName;
                if (nodeName === "task" || nodeName === "tasks" || nodeName === "data") {
                    obj.data.push(item2json(item));
                } else if (nodeName === "link" || nodeName === "links") {
                    obj.links.push(item2json(item));
                }
            }
        }
    }
    return obj;
};

plugin.dhtmlxGantt.util_logError = function(message) {
    console.error("Plugin dhtmlxGantt: " + message);
    gantt.message({
        type: "error",
        text: "Plugin dhtmlxGantt: " + message,
        expire: -1
    });
};
