CREATE TABLE plugin_gantt_demo_tasks (
    t_id            NUMBER NOT NULL PRIMARY KEY,
    t_parent_t_id   NUMBER
        REFERENCES plugin_gantt_demo_tasks ( t_id ),
    t_title         VARCHAR2(80 CHAR) NOT NULL,
    t_description   VARCHAR2(400 CHAR),
    t_start_date    DATE NOT NULL,
    t_duration      NUMBER DEFAULT 0 NOT NULL,
    t_progress      NUMBER(4,3) DEFAULT 0 NOT NULL CHECK (
        t_progress BETWEEN 0 AND 1
    ),
    t_sort_order    NUMBER DEFAULT 0 NOT NULL
);

CREATE TABLE plugin_gantt_demo_links (
    l_id       NUMBER NOT NULL PRIMARY KEY,
    l_source   NUMBER NOT NULL
        REFERENCES plugin_gantt_demo_tasks ( t_id ),
    l_target   NUMBER NOT NULL
        REFERENCES plugin_gantt_demo_tasks ( t_id ),
    l_type     NUMBER(1) NOT NULL CHECK (
        l_type IN (
            0,1,2,3
        )
    )
);

CREATE TABLE plugin_gantt_demo_holidays (
    h_date     DATE NOT NULL PRIMARY KEY CHECK (h_date = trunc(h_date)),
    h_comment  VARCHAR2 (30)
);

--

INSERT INTO plugin_gantt_demo_tasks VALUES (
    1,
    NULL,
    'Project #1',
    NULL,
    DATE '2017-04-01',
    11,
    0.6,
    1
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    2,
    1,
    'Task #1',
    NULL,
    DATE '2017-04-03',
    5,
    1,
    2
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    3,
    1,
    'Task #2',
    NULL,
    DATE '2017-04-02',
    7,
    0.5,
    3
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    4,
    3,
    'Task #2.1',
    NULL,
    DATE '2017-04-03',
    2,
    1,
    4
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    5,
    3,
    'Task #2.2',
    NULL,
    DATE '2017-04-04',
    3,
    0.8,
    5
);

INSERT INTO plugin_gantt_demo_tasks VALUES (
    6,
    3,
    'Task #2.3',
    NULL,
    DATE '2017-04-05',
    4,
    0.2,
    6
);

CREATE SEQUENCE plugin_gantt_demo_tasks_seq START WITH 7;

CREATE OR REPLACE TRIGGER plugin_gantt_demo_tasks_bi BEFORE
    INSERT ON plugin_gantt_demo_tasks
    FOR EACH ROW
    WHEN (
        new.t_id IS NULL
    )
BEGIN
    SELECT
        plugin_gantt_demo_tasks_seq.NEXTVAL
    INTO
        :new.t_id
    FROM
        dual;

END;
/

--

INSERT INTO plugin_gantt_demo_links VALUES (
    1,
    1,
    2,
    1
);

INSERT INTO plugin_gantt_demo_links VALUES (
    2,
    1,
    3,
    1
);

INSERT INTO plugin_gantt_demo_links VALUES (
    3,
    3,
    4,
    1
);

INSERT INTO plugin_gantt_demo_links VALUES (
    4,
    4,
    5,
    0
);

INSERT INTO plugin_gantt_demo_links VALUES (
    5,
    5,
    6,
    0
);

CREATE SEQUENCE plugin_gantt_demo_links_seq START WITH 6;

CREATE OR REPLACE TRIGGER plugin_gantt_demo_links_bi BEFORE
    INSERT ON plugin_gantt_demo_links
    FOR EACH ROW
    WHEN (
        new.l_id IS NULL
    )
BEGIN
    SELECT
        plugin_gantt_demo_links_seq.NEXTVAL
    INTO
        :new.l_id
    FROM
        dual;

END;
/

--

INSERT INTO plugin_gantt_demo_holidays VALUES (
    date '2017-04-04',
    'Dummy holiday'
);


COMMIT;
