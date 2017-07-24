window.plugin_dhtmlxGantt = {};
plugin_dhtmlxGantt.version = "x.x.x";

plugin_dhtmlxGantt.init = function() {

    //create jQuery objects for region ID and chart container ID (see also plugin pl/sql source)
    plugin_dhtmlxGantt.regionIdElement = apex.jQuery("#" + plugin_dhtmlxGantt.regionId);
    plugin_dhtmlxGantt.chartContainerIdElement = apex.jQuery("#" + plugin_dhtmlxGantt.chartContainerId);

    //register apexrefresh event
    plugin_dhtmlxGantt.regionIdElement.bind("apexrefresh", function() {
        plugin_dhtmlxGantt.load();
    });

    //normalize apexPageItemsToSubmit from string to array
    plugin_dhtmlxGantt.pageItemsToSubmit = (
        plugin_dhtmlxGantt.pageItemsToSubmit === "" ?
        false :
        plugin_dhtmlxGantt.pageItemsToSubmit.replace(/\s/g, "").split(",")
    );

    //catch task double click event for APEX, so that a custom APEX form can be opened
    gantt.attachEvent("onTaskDblClick", function(id) {
        //get the url from the task data (if given) and open it
        if (id) { // if link is double clicked this event is also fired with empty id, so we check here the id
            var task = gantt.getTask(id);
            if (task.url_edit) {
                plugin_dhtmlxGantt.util_openUrl(task.url_edit);
            }
            apex.event.trigger(plugin_dhtmlxGantt.chartContainerIdElement, "dhtmlxgantt_task_double_click", task);
            return false; //this prevents the default action
        } else {
            return true; //without this link double click would not be fired
        }
    });

    //catch task create event for APEX, so that a custom APEX form can be opened
    gantt.attachEvent("onTaskCreated", function(task) {
        //get the url from the task data (if given) and open it
        if (task.parent) {
            // replace parent id with the parent task object
            task.parent = gantt.getTask(task.parent);
            if (task.parent.url_create_child) {
                plugin_dhtmlxGantt.util_openUrl(task.parent.url_create_child);
            }
        } else if (plugin_dhtmlxGantt.dataParsed.task_create_url_no_child.url) {
            plugin_dhtmlxGantt.util_openUrl(plugin_dhtmlxGantt.dataParsed.task_create_url_no_child.url);
        }
        apex.event.trigger(plugin_dhtmlxGantt.chartContainerIdElement, "dhtmlxgantt_task_create", task);
        return false; //this prevents the default action
    });

    //catch link double click event for APEX, so that a custom APEX form can be opened
    gantt.attachEvent("onLinkDblClick", function(id) {
        //get the url from the link data (if given) and open it
        var link = gantt.getLink(id);
        if (link.url_edit) {
            plugin_dhtmlxGantt.util_openUrl(link.url_edit);
        }
        apex.event.trigger(plugin_dhtmlxGantt.chartContainerIdElement, "dhtmlxgantt_link_double_click", link);
        return false; //this prevents the default action
    });

    //catch link add event for APEX, so that a custom APEX form can be opened
    gantt.attachEvent("onBeforeLinkAdd", function(id, link) {
        if (gantt.isLinkAllowed(link)) {
            apex.event.trigger(plugin_dhtmlxGantt.chartContainerIdElement, "dhtmlxgantt_link_create", link);
        }
        return false; //this prevents the default action
    });

    //catch task drag event for APEX, so that a dynamic action can be registered
    //mode can be "resize", "progress", "move", "ignore"
    gantt.attachEvent("onAfterTaskDrag", function(id, mode, e) {
        var data = {
            mode: mode,
            task: gantt.getTask(id)
        };
        apex.event.trigger(plugin_dhtmlxGantt.chartContainerIdElement, "dhtmlxgantt_task_drag", data);
    });

    //load initial data
    plugin_dhtmlxGantt.load();

    //rerender on window resize
    apex.jQuery(window).on("apexwindowresized", function(event) {
        gantt.render();
    });
    apex.jQuery('#t_Button_navControl').click(function() {
        setTimeout(function() {
            gantt.render();
        }, 500);
    });
};

plugin_dhtmlxGantt.load = function(data) {
    //trigger event, so that other dynamic actions registered on this event are called
    apex.event.trigger(plugin_dhtmlxGantt.regionIdElement, "apexbeforerefresh");
    //if data is provided (from anywhere) we save it and start the parsing
    if (data) {
        plugin_dhtmlxGantt.parse(data);
    }
    //without provided data...
    else {
        //...get new data from db via AJAX call...
        if (plugin_dhtmlxGantt.queryDefined) {
            apex.server.plugin(
                plugin_dhtmlxGantt.pluginId, {
                    p_debug: $v("pdebug"),
                    pageItems: plugin_dhtmlxGantt.pageItems
                }, {
                    //refreshObject: plugin_dhtmlxGantt.regionIdElement,
                    loadingIndicator: plugin_dhtmlxGantt.chartContainerIdElement,
                    loadingIndicatorPosition: "centered",
                    success: function(dataString) {
                        //data from query is allowed to be XML or JSON, so we have to parse it first here
                        plugin_dhtmlxGantt.parse(dataString);
                    },
                    error: function(xhr, status, errorThrown) {
                        plugin_dhtmlxGantt.util_logError("Unable to load data - message from jQuery AJAX call: " + xhr.responseText);
                        //trigger event, so that other dynamic actions registered on this event are called
                        apex.event.trigger(plugin_dhtmlxGantt.regionIdElement, "apexafterrefresh");
                    },
                    dataType: "text"
                }
            );
        }
        //...or provide example data
        else {
            plugin_dhtmlxGantt.parse({
                "tasks": [{
                        "id": 1,
                        "text": "Project #1 (NO REGION QUERY DEFINED: EXAMPLE DATA USED)",
                        "start_date": "2017-04-01",
                        "duration": 11,
                        "progress": 0.6,
                        "open": true
                    },
                    {
                        "id": 2,
                        "text": "Task #1",
                        "start_date": "2017-04-03",
                        "duration": 5,
                        "progress": 1,
                        "open": true,
                        "parent": 1
                    },
                    {
                        "id": 3,
                        "text": "Task #2",
                        "start_date": "2017-04-02",
                        "duration": 7,
                        "progress": 0.5,
                        "open": true,
                        "parent": 1
                    },
                    {
                        "id": 4,
                        "text": "Task #2.1",
                        "start_date": "2017-04-03",
                        "duration": 2,
                        "progress": 1,
                        "open": true,
                        "parent": 3
                    },
                    {
                        "id": 5,
                        "text": "Task #2.2",
                        "start_date": "2017-04-04",
                        "duration": 3,
                        "progress": 0.8,
                        "open": true,
                        "parent": 3
                    },
                    {
                        "id": 6,
                        "text": "Task #2.3",
                        "start_date": "2017-04-05",
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
                ],
                "holidays": [{
                    "date": "2017-04-04"
                }]
            });
        }
    }
};

plugin_dhtmlxGantt.parse = function(data) {
    if (data) {
        plugin_dhtmlxGantt.dataRaw = data;
    }
    // data is an object
    if (plugin_dhtmlxGantt.dataRaw.constructor === Object) {
        plugin_dhtmlxGantt.dataParsed = plugin_dhtmlxGantt.dataRaw;
    }
    // data is a string
    else if (plugin_dhtmlxGantt.dataRaw.constructor === String) {
        // convert incoming data depending on type
        if (plugin_dhtmlxGantt.dataRaw.trim().substr(0, 1) === "<") {
            try {
                plugin_dhtmlxGantt.dataParsed = plugin_dhtmlxGantt.util_xml2json(plugin_dhtmlxGantt.util_parseXml(plugin_dhtmlxGantt.dataRaw));
            } catch (e) {
                plugin_dhtmlxGantt.util_logError("Unable to parse XML string: " + e.message);
            }
            if (plugin_dhtmlxGantt.dataParsed === null) {
                plugin_dhtmlxGantt.util_logError("Unable to parse XML string");
            }
        } else if (plugin_dhtmlxGantt.dataRaw.trim().substr(0, 1) === "{") {
            try {
                plugin_dhtmlxGantt.dataParsed = JSON.parse(plugin_dhtmlxGantt.dataRaw);
            } catch (e) {
                plugin_dhtmlxGantt.util_logError("Unable to parse JSON string - please check for valid JSON before use here in plugin (e.g. https://jsonformatter.curiousconcept.com): " + e.message);
            }
        } else {
            plugin_dhtmlxGantt.util_logError("Your data string is not starting with \"<\" or \"{\" - parsing not possible");
        }
    }
    // data has unknown format
    else {
        plugin_dhtmlxGantt.util_logError("Unable to parse your data - input data can be a XML string, JSON string or JavaScript object.");
    }
    if (!plugin_dhtmlxGantt.dataParsed) {
        plugin_dhtmlxGantt.util_logError("No data available for rendering");
    } else {
        //correct data structure: we allow the name "tasks" instead of "data" (feels more natural), the vendor library needs to have a "data" attribute:
        if (!plugin_dhtmlxGantt.dataParsed.data && plugin_dhtmlxGantt.dataParsed.tasks) {
            plugin_dhtmlxGantt.dataParsed.data = plugin_dhtmlxGantt.dataParsed.tasks;
        }
        //correct data types
        plugin_dhtmlxGantt.dataParsed.data.forEach(function(t) {
            t.id = parseInt(t.id);
            t.progress = parseFloat(t.progress);
            t.duration = parseFloat(t.duration);
            t.parent = parseInt(t.parent);
            t.open = plugin_dhtmlxGantt.util_parseBool(t.open);
        });
        plugin_dhtmlxGantt.dataParsed.links.forEach(function(l) {
            l.id = parseInt(l.id);
            l.source = parseInt(l.source);
            l.target = parseInt(l.target);
        });
        //add holidays to gantt config
        if (plugin_dhtmlxGantt.dataParsed.holidays && plugin_dhtmlxGantt.dataParsed.holidays.length > 0) {
            plugin_dhtmlxGantt.dataParsed.holidays.forEach(function(holiday) {
                try {
                    var date = holiday.date.split('-');
                    // months are starting with 0 in JavaScript
                    gantt.setWorkTime({
                        date: new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2])),
                        hours: false
                    });
                } catch (e) {
                    plugin_dhtmlxGantt.util_logError("unable to set a holiday with your data - format must be yyyy-mm-dd: " + e.message);
                }
            });
        }
        //push data into gantt chart
        try {
            gantt.clearAll();
            gantt.parse(plugin_dhtmlxGantt.dataParsed);
        } catch (e) {
            plugin_dhtmlxGantt.util_logError("vendor base library was unable to use your data: " + e.message);
        }
    }
    //trigger event, so that other dynamic actions registered on this event are called
    apex.event.trigger(plugin_dhtmlxGantt.regionIdElement, "apexafterrefresh");
};

// parse XML string to XML
plugin_dhtmlxGantt.util_parseXml = function(xml) {
    var dom = null;
    if (xml) {
        if (window.DOMParser) {
            try {
                dom = (new DOMParser()).parseFromString(xml, "text/xml");
            } catch (e) {
                dom = null;
                plugin_dhtmlxGantt.util_logError("DOMParser - unable to parse XML: " + e.message);
            }
        } else if (window.ActiveXObject) {
            try {
                dom = new ActiveXObject("Microsoft.XMLDOM");
                dom.async = false;
                // parse error ...
                if (!dom.loadXML(xml)) {
                    plugin_dhtmlxGantt.util_logError("Microsoft.XMLDOM - unable to parse XML: " + dom.parseError.reason +
                        dom.parseError.srcText);
                }
            } catch (e) {
                dom = null;
                plugin_dhtmlxGantt.util_logError("Microsoft.XMLDOM - unable to parse XML: " + e.message);
            }
        }
    }
    return dom;
};

plugin_dhtmlxGantt.util_xml2json = function(xml) {
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
        obj.holidays = [];
        if (xml.childNodes.item(0).hasChildNodes()) {
            for (var i = 0; i < xml.childNodes.item(0).childNodes.length; i++) {
                subobj = null;
                item = xml.childNodes.item(0).childNodes.item(i);
                nodeName = item.nodeName;
                if (nodeName === "task" || nodeName === "tasks" || nodeName === "data") {
                    obj.data.push(item2json(item));
                } else if (nodeName === "link" || nodeName === "links") {
                    obj.links.push(item2json(item));
                } else if (nodeName === "holiday" || nodeName === "holidays") {
                    obj.holidays.push(item2json(item));
                } else if (nodeName === "task_create_url_no_child" || nodeName === "link_create_url_template") {
                    obj[nodeName] = item2json(item);
                }
            }
        }
    }
    return obj;
};

// helper to check boolean values
plugin_dhtmlxGantt.util_parseBool = function(value) {
    switch (String(value).trim().toLowerCase()) {
        case "true":
        case "yes":
        case "y":
        case "1":
            return true;
        case "false":
        case "no":
        case "n":
        case "0":
        case "":
            return false;
        default:
            return false;
    }
};

// helper to open a APEX prepared URL
plugin_dhtmlxGantt.util_openUrl = function(url) {
    var elem = apex.jQuery('a.dhtmlxgantt-open-url-helper:first');
    elem.attr('href', url);
    //method chaining was not working with click, so we try to use the first array element
    elem[0].click();
};

// helper to get local date string in ISO format
// http://stackoverflow.com/questions/2573521/how-do-i-output-an-iso-8601-formatted-string-in-javascript
plugin_dhtmlxGantt.util_toLocalIsoString = function(date) {
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    var localIsoString = date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + 'T' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes()) + ':' +
        pad(date.getSeconds());
    if (date.getTimezoneOffset() === 0) localIsoString += 'Z';
    return localIsoString;
};

// helper to round a number with specified precision
// examples: plugin_dhtmlxGantt.round(1234.5678, 1); // 1234.6
//         : plugin_dhtmlxGantt.round(1234.5678, -1); // 1230
// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Math/round
plugin_dhtmlxGantt.util_round = function(number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
};

plugin_dhtmlxGantt.util_logError = function(message) {
    console.error("Plugin dhtmlxGantt: " + message);
    gantt.message({
        type: "error",
        text: "Plugin dhtmlxGantt: " + message,
        expire: -1
    });
};
