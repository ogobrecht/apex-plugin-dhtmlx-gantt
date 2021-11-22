[Download latest version](https://github.com/ogobrecht/apex-plugin-dhtmlx-gantt/releases/latest) |
[Online demo app](https://apex.oracle.com/pls/apex/ogobrecht/r/playground/gantt-chart) |
[Wiki](https://github.com/ogobrecht/apex-plugin-dhtmlx-gantt/wiki) |
[Issues](https://github.com/ogobrecht/apex-plugin-dhtmlx-gantt/issues)

# Oracle APEX Region Type Plugin: dhtmlxGantt

- Based on [DHTMLX Gantt](https://dhtmlx.com/docs/products/dhtmlxGantt/) library v7.0.11 ([docs](http://docs.dhtmlx.com/gantt/))
- This is the GPLv2 version of the library with a reduced set of functions - [Compare the free and the Pro version](https://docs.dhtmlx.com/gantt/desktop__editions_comparison.html)
- If you need all functionality you can buy the Pro version and copy the Pro files into the plugin
- "Export to PDF" functionality with the help of DHTMLX internet API (watermark without PRO version) - [more infos here...](https://docs.dhtmlx.com/gantt/desktop__export.html#exporttopdf)
- Minimum supported APEX version for the plug-in is 5.1
- Data can be delivered as XML (string) or JSON (string or object)
- The plugin delivers sample data, if no query is defined
- There are five events available to react on chart actions: Task Create, Task Double Click, Task Drag (change of progress, start date, duration), Link Create, Link Double Click
- In the region attributes you can configure some aspects of the Gantt chart - for an example the height, the skin, the UI language (30 different delivered by the vendor); There is also the possibility to place custom before and after initialization JavaScript code
- Everything else can be done with the extensive JavaScript API available from DHTMLX - [please refer to the docs](http://docs.dhtmlx.com/gantt/)

## You need to understand this

- The whole idea of the plug-in ist to integrate the Gantt JavaScript library and to expose relevant events to be able to use standard APEX modal dialogs to edit the tasks and links
- The downside of this is, that you need to work with the event data to open your modal dialogs and that you need to prepare your URLs somewhere
- You can prepare the edit URLs beforehand in the region SQL
- When you change data by interacting with the graph you need to prepare the URL with a dynamic action
- It is highly recommendet to install the demo app and inspect the implementation details:
  - Open the [online demo app](https://apex.oracle.com/pls/apex/ogobrecht/r/playground/gantt-chart)
  - Download it as it is (top right navigation menu, under the question mark)
  - Install it in your own APEX instance or [apex.oracle.com](https://apex.oracle.com/), if your instance has not the same version as [apex.oracle.com](https://apex.oracle.com/)

## How To Use

1. Download the [latest version](https://github.com/ogobrecht/apex-plugin-dhtmlx-gantt/releases/latest)
2. Install the plugin from the subdirectory `plugin`
3. On your page create a new region of type `dhtmlxGantt [Plug-In]`
4. Provide a query to load data from your tables
   - If you provide no query, then the plugin will provide sample data
   - For an example query see the inline help in APEX, `plugin/demo-objects/demo-query.sql` or the following section

### Example Query

You can deliver JSON or XML. In both cases you need to create a query that returns a single CLOB result. To support also older databases without JSON functionality the example below is a XML query.

No fear, if you look in detail to the example query, you will find out that you have to define only some sort of "standard selects" for the tasks and the links between the tasks - holiday dates are optional as also the prepared URLs. Grab the example, put it in your preferred SQL tool and play around with it.

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
  <holiday date="2017-04-04"/>
  <holiday date="2017-12-25"/>
  <holiday date="2017-12-26"/>
  <task_create_url_no_child url="f?p=103328:2:399391190576:::2::"/>
</data>
```

If you need an JSON example please have a look at the file under `sources/plugin-dhtmlxgantt-helper.js` starting around line 130 - there is the sample data defined for the case that no region query is defined.

The following example query runs against demo tables as delivered with the supporting objects of the demo app:

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
), holidays AS ( --> START YOUR HOLIDAYS QUERY HERE
    SELECT
        XMLELEMENT(
            "holiday",
            XMLATTRIBUTES(
                to_char(h_date, 'yyyy-mm-dd') AS "date"
            )
        ) AS holiday_xml
    FROM
        plugin_gantt_demo_holidays --< STOP YOUR HOLIDAYS QUERY HERE
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
            (SELECT XMLAGG(holiday_xml) FROM holidays),
            (SELECT XMLAGG(special_url_xml) FROM special_urls)
        )
    ) INDENT) AS single_clob_result
FROM
    dual;
```


## Changelog

This project uses [semantic versioning](http://semver.org).

Please use for all comments and discussions the [issues functionality on GitHub](https://github.com/ogobrecht/apex-plugin-dhtmlx-gantt/issues).

### 0.11.1 (2021-11-22)

- Move demo app, update README

### 0.11.0 (2020-12-09)

- Update to dhtmlx Gantt library version 7.0.11
- New: Attribute "After Refresh JS Code" for things which needs to run after each refresh of the region like adding vertical markers - thanks to [Jochen](https://github.com/jzzh) for the hint and sorry for the delay


### 0.10.0 (2020-10-26)

- Update to dhtmlx Gantt library version 7.0.10
- You need to revisit your Gantt region attributes because of breaking changes (previous library version was 4.1.0)
- New: Support for RTL languages
- New: Skin Material


### 0.9.0 (2018-09-30)

- Switch internal handling of task ID's from integer to string - thanks to github.com/flunanica to remind me that not all data models use number data types for their identifiers...


### 0.8.0 (2017-11-13)

- New language Persian: Thanks to [meysam khashie](https://telegram.me/meysammkw) for the translation and to ask for including it into the plugin


### 0.7.0 (2017-08-02)

- New option: It is now possible to load the needed files for up to 12 extension like tooltips and other stuff - check out also the help in the attributes of a Gantt region - thanks to [ShantveerS](https://github.com/ShantveerS) to show me this missing feature


### 0.6.0 (2017-07-24)

- New options regarding non working days - thanks to [GasparYYC](https://github.com/GasparYYC) for the ideas:
  - Option to exclude non working days from time calculation - defaults to true
  - Option to highlight non working days - defaults to true
  - Option for the highlighting color - defaults to #f4f7f4
  - You can deliver additional holidays - see example data and query above
- Fixed: Tasks (or links) deleted from DB are displayed on chart after region refresh - thanks to [S-Marek](https://github.com/S-Marek) to report this issue
- Some small code refactoring


### 0.5.1 (2017-03-23)

- correct LOV (100% not always correct displayed)
- forgotten code fragment in JavaScript plugin helper function


### 0.5.0 (2017-03-14)

- First public release
