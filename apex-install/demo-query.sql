WITH tasks AS ( --> START YOUR TASKS QUERY HERE
    SELECT
        XMLELEMENT(
            "task",
            XMLATTRIBUTES(
                t_id AS "id",
                t_text AS "text",
                TO_CHAR(t_start_date,'dd-mm-yyyy') AS "start_date",-- default format from dhtmlxGantt library, is configurable in JavaScript
                t_progress AS "progress",
                t_duration AS "duration",
                t_parent_t_id AS "parent",
                'true' AS "open", -- for the visualization, if child tasks should be expanded(shown) or not
                -- If you provide here a URL,then this URL is automatically opened by the plugin when a task is double clicked.
                -- This saves you time during development and also extra AJAX calls to the server to prepare the url 
                -- in a dynamic action. The triggering element is set her to #my_gantt which is the static id of the 
                -- gantt chart region. You get then on this region the event "Dialog Closed",which helps you to refresh
                -- the gantt chart with a dynamic action.
                apex_util.prepare_url(
                    p_url                  => 'f?p='
                     ||  :app_id
                     ||  ':2:'
                     ||  :app_session
                     ||  ':::2:P2_T_ID:'
                     ||  t_id,
                    p_triggering_element   => 'apex.jQuery("#my_gantt")'
                ) AS "url"
            )
        ) AS xml_tasks
    FROM
        plugin_gantt_demo_tasks
    ORDER BY t_sortorder --< STOP YOUR TASKS QUERY HERE
),links AS ( --> START YOUR LINKS QUERY HERE
    SELECT
        XMLELEMENT(
            "link",
            XMLATTRIBUTES(
                l_id AS "id",
                l_source AS "source",
                l_target AS "target",
                l_type AS "type"
            )
        ) AS xml_links
    FROM
        plugin_gantt_demo_links --< STOP YOUR LINKS QUERY HERE
) SELECT
    XMLSERIALIZE(DOCUMENT(
        XMLELEMENT(
            "data",
            (
                SELECT
                    XMLAGG(xml_tasks)
                FROM
                    tasks
            ),
        (
            SELECT
                XMLAGG(xml_links)
            FROM
                links
        ) )
    ) INDENT) AS single_clob_result
FROM
    dual;