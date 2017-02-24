WITH tasks AS ( --> START YOUR TASKS QUERY HERE
    SELECT
        XMLELEMENT(
            "task",
            XMLATTRIBUTES(
                t_id AS id,
                t_text AS text,
                TO_CHAR(t_start_date,'dd-mm-yyyy') AS start_date,-- default from dhtmlxGantt library,is configurable in JavaScript
                t_duration AS duration,
                t_progress AS progress
            )
        ) AS xml_tasks
    FROM
        plugin_gantt_demo_tasks
    ORDER BY t_sortorder--< STOP YOUR TASKS QUERY HERE
),links AS ( --> START YOUR LINKS QUERY HERE
    SELECT
        XMLELEMENT(
            "link",
            XMLATTRIBUTES(
                l_id AS id,
                l_source AS source,
                l_target AS target,
                l_type AS type
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