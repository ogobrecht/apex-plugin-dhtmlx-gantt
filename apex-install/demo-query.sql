WITH tasks AS ( --> START YOUR TASKS QUERY HERE
    SELECT
        XMLELEMENT(
            "task",
            XMLATTRIBUTES(
                t_id AS "id",
                t_text AS "text",
                -- default format from dhtmlxGantt library is dd-mm-yyyy (configurable in JavaScript):
                TO_CHAR(t_start_date,'dd-mm-yyyy') AS "start_date",
                t_progress AS "progress",
                t_duration AS "duration",
                t_parent_t_id AS "parent",
                -- For the visualization,if child tasks should be expanded(shown) or not:
                'true' AS "open",
                -- If you provide here a URL,then this URL is automatically opened by the plugin when a task is double clicked.
                -- This saves you time during development and also extra AJAX calls to the server to prepare the url 
                -- in a dynamic action. The triggering element is set her to #my_gantt which is the static id of the 
                -- gantt chart region. You get then on this region the event "Dialog Closed". With this event you can 
                -- which helps you to refresh the gantt chart with a dynamic action:
                apex_util.prepare_url(
                    p_url                  => 'f?p='
                     ||  :app_id
                     ||  ':2:'
                     ||  :app_session
                     ||  ':::2:P2_T_ID:'
                     ||  t_id,
                    p_triggering_element   => 'apex.jQuery("#my_gantt")'
                ) AS "url_edit",
                -- The url to call when the user click a plus sign to create a child task (our task id is here the parent):
                apex_util.prepare_url(
                    p_url                  => 'f?p='
                     ||  :app_id
                     ||  ':2:'
                     ||  :app_session
                     ||  ':::2:P2_T_PARENT_T_ID:'
                     ||  t_id,
                    p_triggering_element   => 'apex.jQuery("#my_gantt")'
                ) AS "url_create_child"
            )
        ) AS task_xml
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
                l_type AS "type",
                apex_util.prepare_url(
                    p_url                  => 'f?p='
                     ||  :app_id
                     ||  ':3:'
                     ||  :app_session
                     ||  ':::3:P3_L_ID:'
                     ||  l_id,
                    p_triggering_element   => 'apex.jQuery("#my_gantt")'
                ) AS "url_edit"
            )
        ) AS link_xml
    FROM
        plugin_gantt_demo_links --< STOP YOUR LINKS QUERY HERE
),special_urls AS ( --> START SPECIAL URL's
    SELECT
        XMLELEMENT(
            "task_create_url_no_child",
            XMLATTRIBUTES(
                -- The url to call when the user click the first plus sign in the chart to 
                -- create a new task (no child,because without parent id):
                apex_util.prepare_url(
                    p_url                  => 'f?p='
                     ||  :app_id
                     ||  ':2:'
                     ||  :app_session
                     ||  ':::2',
                    p_triggering_element   => 'apex.jQuery("#my_gantt")'
                ) AS "url"
            )
        ) AS special_url_xml
    FROM
        dual --< STOP SPECIAL URL's
) SELECT
    XMLSERIALIZE(DOCUMENT(
        XMLELEMENT(
            "data",
            (
                SELECT
                    XMLAGG(task_xml)
                FROM
                    tasks
            ),
        (
            SELECT
                XMLAGG(link_xml)
            FROM
                links
        ),(
            SELECT
                XMLAGG(special_url_xml)
            FROM
                special_urls
        ) )
    ) INDENT) AS single_clob_result
FROM
    dual;