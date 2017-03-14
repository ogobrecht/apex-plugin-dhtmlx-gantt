Please do not download directly this code - this is the development version and can be unstable. You can find the [latest stable version here][1].


# Oracle APEX Region Type Plugin: dhtmlxGantt

* Based on [dhtmlxGantt][2] ([docs][3]) library
  * This is the GPLv2 version of the library with a reduced set of functions
  * If you need all functionality you can buy a Pro version
  * I was asked to create this plugin and I have nothing to do with the company DHTMLX, so please do not complain ;-)
* Currently supported is only APEX 5.1
* Features of the APEX integration:
  * Data can be delivered as XML or JSON string or as JSON object
    * For the XML format there is an own parser integrated to support easy SQL queries - see example below
  * The plugin delivers sample data, if no query is defined
  * There are five events available to react on chart actions: Task Create, Task Double Click, Task Drag (change of progress, start date, duration), Link Create, Link Double Click
  * In the region attributes you can configure some aspects of Gantt chart - for an example the height, the skin, the UI language (30 different delivered by the vendor); There is also the possibility to place custom before and after initialization JavaScript code
  * Everything else can be done with the extensive JavaScript API available from DHTMLX - please refer to the [docs][3]


## Links

* [Download][1]
* [Issues][4]
* [Online Demo App][5]


## How To Use

### The Recommended First Way

1. Download the [latest version][1]
2. Go to subdirectory `plugin/demo-objects`, unzip demo-app-including-supporting-objects.sql.zip and install this application
3. Run the demo app and inspect, how it was implemented

### The DIY Second Way

1. Download the [latest version][1]
2. Install the plugin from the subdirectory `plugin`
3. On your page create a new region of type `dhtmlxGantt [Plug-In]`
4. Optionally provide a query to load data from your tables
   * If you provide no query, then the plugin will provide sample data


### Example Query

You can deliver JSON or XML. In both cases you need to create a query that returns a single CLOB result. To support also older databases without JSON functionality the example below is a XML query.

No fear, if you look in detail to the example query, you will find out that you have to define only some sort of "standard selects" for the tasks and the links between the tasks. Grab the example, put it in your preferred SQL tool and play around with it.

The result of the query should look like this example (prepared URL's are removed for better readability):

```xml
<data>
  <task id="1" text="Project #1" start_date="2017-04-01" progress=".6" duration="11" open="true"/>
  <task id="2" text="Task #1" start_date="2017-04-03" progress="1" duration="5" parent="1" open="true"/>
  <task id="3" text="Task #2" start_date="2017-04-02" progress=".5" duration="7" parent="1" open="true"/>
  <task id="4" text="Task #2.1" start_date="2017-04-03" progress="1" duration="2" parent="3" open="true"/>
  <task id="5" text="Task #2.2" start_date="2017-04-04" progress=".8" duration="3" parent="3" open="true"/>
  <task id="6" text="Task #2.2" start_date="2017-04-05" progress=".2" duration="4" parent="3" open="true"/>
  <link id="1" source="1" target="2" type="1"/>
  <link id="2" source="1" target="3" type="1"/>
  <link id="3" source="3" target="4" type="1"/>
  <link id="4" source="4" target="5" type="0"/>
  <link id="5" source="5" target="6" type="0"/>
</data>
```

```sql
WITH tasks AS ( --> START YOUR TASKS QUERY HERE
    SELECT
        XMLELEMENT(
            "task",
            XMLATTRIBUTES(
                t_id AS "id",
                t_title AS "text",
                TO_CHAR(t_start_date,'yyyy-mm-dd') AS "start_date",
                TO_CHAR(t_progress,'TM9','nls_numeric_characters=''.,''') AS "progress",
                TO_CHAR(t_duration,'TM9','nls_numeric_characters=''.,''') AS "duration",
                t_parent_t_id AS "parent",
                -- For the visualization, if child tasks should be expanded(shown) or not:
                'true' AS "open",
                -- If you provide here a URL, then this URL is automatically opened by the plugin when a task is double clicked.
                -- This saves you time during development and also extra AJAX calls to the server to prepare the url
                -- in a dynamic action. The triggering element is set her to #my_gantt which is the static id of the
                -- gantt chart region. You get then on this region the event "Dialog Closed". With this event you can
                -- refresh the gantt chart with a dynamic action:
                apex_util.prepare_url(
                    p_url => 'f?p=' || :app_id || ':2:' || :app_session || ':::2:P2_T_ID:' || t_id,
                    p_triggering_element => 'apex.jQuery("#my_gantt")'
                ) AS "url_edit",
                -- The url to call when the user click a plus sign to create a child task (our task id is here the parent):
                apex_util.prepare_url(
                    p_url => 'f?p=' || :app_id || ':2:' || :app_session || ':::2:P2_T_PARENT_T_ID:' || t_id,
                    p_triggering_element => 'apex.jQuery("#my_gantt")'
                ) AS "url_create_child"
            )
        ) AS task_xml
    FROM
        plugin_gantt_demo_tasks
    ORDER BY t_sort_order --< STOP YOUR TASKS QUERY HERE
), links AS ( --> START YOUR LINKS QUERY HERE
    SELECT
        XMLELEMENT(
            "link",
            XMLATTRIBUTES(
                l_id AS "id",
                l_source AS "source",
                l_target AS "target",
                l_type AS "type",
                apex_util.prepare_url(
                    p_url => 'f?p=' || :app_id || ':3:' || :app_session || ':::3:P3_L_ID:' || l_id,
                    p_triggering_element => 'apex.jQuery("#my_gantt")'
                ) AS "url_edit"
            )
        ) AS link_xml
    FROM
        plugin_gantt_demo_links --< STOP YOUR LINKS QUERY HERE
), special_urls AS ( --> START SPECIAL URL's (optional)
    SELECT
        XMLELEMENT(
            "task_create_url_no_child",
            XMLATTRIBUTES(
                -- The url to call when the user click the first plus sign in the chart to
                -- create a new task (no child, because without parent id):
                apex_util.prepare_url(
                    p_url => 'f?p=' || :app_id || ':2:' || :app_session || ':::2',
                    p_triggering_element => 'apex.jQuery("#my_gantt")'
                ) AS "url"
            )
        ) AS special_url_xml
    FROM
        dual --< STOP SPECIAL URL's
) SELECT
    XMLSERIALIZE(DOCUMENT(
        XMLELEMENT(
            "data",
            (SELECT XMLAGG(task_xml) FROM tasks),
            (SELECT XMLAGG(link_xml) FROM links),
            (SELECT XMLAGG(special_url_xml) FROM special_urls)
        )
    ) INDENT) AS single_clob_result
FROM
    dual;
```


## Changelog

This project uses [semantic versioning][6].

Please use for all comments and discussions the [issues functionality on GitHub][4].

### 0.5.0 (2017-03-14)

* First public release

[1]: https://github.com/ogobrecht/apex-plugin-dhtmlx-gantt/releases/latest
[2]: https://dhtmlx.com/docs/products/dhtmlxGantt/
[3]: http://docs.dhtmlx.com/gantt/
[4]: https://github.com/ogobrecht/apex-plugin-dhtmlx-gantt/issues
[5]: https://apex.oracle.com/pls/apex/f?p=116612
[6]: http://semver.org
