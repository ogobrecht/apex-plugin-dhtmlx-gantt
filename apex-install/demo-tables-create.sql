CREATE TABLE plugin_gantt_demo_tasks (
    t_id            NUMBER NOT NULL PRIMARY KEY,
    t_text          VARCHAR2(255 CHAR) NOT NULL,
    t_start_date    DATE NOT NULL,
    t_duration      NUMBER DEFAULT 0 NOT NULL,
    t_progress      NUMBER DEFAULT 0 NOT NULL,
    t_sortorder     NUMBER DEFAULT 0 NOT NULL,
    t_parent_t_id   NUMBER
        REFERENCES plugin_gantt_demo_tasks ( t_id )
);

CREATE TABLE plugin_gantt_demo_links (
    l_id       NUMBER NOT NULL PRIMARY KEY,
    l_source   NUMBER NOT NULL
        REFERENCES plugin_gantt_demo_tasks ( t_id ),
    l_target   NUMBER NOT NULL
        REFERENCES plugin_gantt_demo_tasks ( t_id ),
    l_type     VARCHAR(1) NOT NULL
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    1,
    'Project #1',
    DATE '2017-04-01',
    11,
    0.6,
    1,
    NULL
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    2,
    'Task #1',
    DATE '2017-04-03',
    5,
    1,
    2,
    1
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    3,
    'Task #2',
    DATE '2017-04-02',
    7,
    0.5,
    3,
    1
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    4,
    'Task #2.1',
    DATE '2017-04-03',
    2,
    1,
    4,
    3
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    5,
    'Task #2.2',
    DATE '2017-04-04',
    3,
    0.8,
    5,
    3
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    6,
    'Task #2.2',
    DATE '2017-04-05',
    4,
    0.2,
    6,
    3
);

INSERT INTO plugin_gantt_demo_links VALUES (
    1,
    1,
    2,
    '1'
);

INSERT INTO plugin_gantt_demo_links VALUES (
    2,
    1,
    3,
    '1'
);

INSERT INTO plugin_gantt_demo_links VALUES (
    4,
    4,
    5,
    '0'
);

INSERT INTO plugin_gantt_demo_links VALUES (
    5,
    5,
    6,
    '0'
);

COMMIT;
