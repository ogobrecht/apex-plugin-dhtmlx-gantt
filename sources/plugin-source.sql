FUNCTION dhtmlx_gantt_render (
    p_region                IN apex_plugin.t_region,
    p_plugin                IN apex_plugin.t_plugin,
    p_is_printer_friendly   IN BOOLEAN
) RETURN apex_plugin.t_region_render_result IS
    v_region_id       VARCHAR2(100);
    v_chart_container VARCHAR2(100);
    v_extensions      APEX_APPLICATION_GLOBAL.VC_ARR2;
BEGIN
    -- load skin css file
    apex_css.add_file( p_name      => p_region.attribute_04
                     , p_directory => p_plugin.file_prefix || 'dhtmlxgantt/');

    -- load gantt library js file
    apex_javascript.add_library( p_name                  => 'dhtmlxgantt'
                               , p_directory             => p_plugin.file_prefix || 'dhtmlxgantt/');

    -- load translation js file
    apex_javascript.add_library( p_name                  => replace(p_region.attribute_05, '.js', '')
                               , p_directory             => p_plugin.file_prefix || 'dhtmlxgantt/locale/');

    -- load extensions
    v_extensions := APEX_UTIL.STRING_TO_TABLE(p_region.attribute_17);
    for i in 1..v_extensions.count loop
        apex_javascript.add_library( p_name                  => v_extensions(i)
                                   , p_directory             => p_plugin.file_prefix || 'dhtmlxgantt/ext/');
    end loop;

    -- load helper js file
    apex_javascript.add_library( p_name                  => 'plugin-dhtmlxgantt-helper'
                               , p_directory             => p_plugin.file_prefix
                               , p_check_to_add_minified => TRUE );


    -- prepare chart container
    v_region_id := apex_plugin_util.escape( p_region.static_id, true);
    v_chart_container := v_region_id || '_dhtmlxGantt';
    htp.p( '<a class="dhtmlxgantt-open-url-helper" style="display:none;"></a>' ||
        '<div id="'|| v_chart_container || '" style="width:100%; height:' || nvl(p_region.attribute_01,500) || 'px;"></div>' );

    apex_javascript.add_onload_code( '
plugin_dhtmlxGantt.pluginId = "' || apex_plugin.get_ajax_identifier || '";
plugin_dhtmlxGantt.regionId = "' || v_region_id || '";
plugin_dhtmlxGantt.chartContainerId = "' || v_chart_container || '";
plugin_dhtmlxGantt.pageItemsToSubmit = "' || p_region.ajax_items_to_submit || '";
plugin_dhtmlxGantt.queryDefined = ' || case when p_region.source is null then 'false' else 'true' end || ';
gantt.config.xml_date = "%Y-%m-%d";
gantt.config.show_grid = ' || p_region.attribute_06 || ';
gantt.config.show_task_cells = ' || p_region.attribute_09 || ';
gantt.config.show_links = ' || p_region.attribute_07 || ';
gantt.config.show_progress = ' || p_region.attribute_08 || ';
gantt.config.drag_move = ' || p_region.attribute_10 || ';
gantt.config.drag_progress = ' || p_region.attribute_11 || ';
gantt.config.drag_resize = ' || p_region.attribute_12 || ';
gantt.config.drag_links = ' || p_region.attribute_13 || ';
gantt.config.work_time = ' || p_region.attribute_14 || ';
' || case when p_region.attribute_15 = 'true' then ' /* highlight weekends */
gantt.templates.task_cell_class = function(task, date){
    if ( gantt.config.scale_unit === "day" && !gantt.isWorkTime(date) ) return "no_work_time";
    return "";
};
gantt.templates.scale_cell_class = function(date){
    if ( gantt.config.scale_unit === "day" && !gantt.isWorkTime(date) ) return "no_work_time";
    return "";
};
' else null end || '
/* before init JS code */
' || p_region.attribute_02 || '
gantt.init("' || v_chart_container || '");
/* after init JS code */
' || p_region.attribute_03 || '
plugin_dhtmlxGantt.init();
/* add additional styles for non working days - skin dependend: must run after first render cycle */
apex.jQuery("body").prepend("<style> .gantt_scale_cell.no_work_time, .gantt_task_cell.no_work_time {background-color:'
  || nvl(p_region.attribute_16,'#f4f7f4') ||
';} .gantt_selected .gantt_scale_cell.no_work_time, .gantt_selected .gantt_task_cell.no_work_time {background-color:transparent;} .gantt_scale_cell.no_work_time {border-bottom: 1px solid " + apex.jQuery(".gantt_task_scale:first").css("border-bottom-color") + ";} </style>");
');
    RETURN NULL;
    --
END dhtmlx_gantt_render;

FUNCTION dhtmlx_gantt_ajax( p_region IN apex_plugin.t_region, p_plugin IN apex_plugin.t_plugin )
   RETURN apex_plugin.t_region_ajax_result
IS
   v_clob  CLOB;
   v_binds DBMS_SQL.varchar2_table;
   v_cur   INTEGER;
   v_ret   INTEGER;
BEGIN
   IF p_region.source IS NOT NULL THEN
      v_binds := wwv_flow_utilities.get_binds( p_region.source );
      v_cur   := DBMS_SQL.open_cursor;
      DBMS_SQL.parse( c => v_cur, statement => REGEXP_REPLACE(p_region.source,';\s*$',''), language_flag => DBMS_SQL.native );

      IF v_binds.COUNT > 0 THEN
         FOR i IN v_binds.FIRST .. v_binds.LAST LOOP
            DBMS_SQL.bind_variable( v_cur
                                  , v_binds( i )
                                  , APEX_UTIL.get_session_state( SUBSTR( v_binds( i ), 2 ) ) );
         END LOOP;
      END IF;

      DBMS_SQL.define_column( c => v_cur, position => 1, column => v_clob );
      v_ret   := DBMS_SQL.execute( c => v_cur );

      WHILE DBMS_SQL.fetch_rows( v_cur ) > 0 LOOP
         DBMS_SQL.COLUMN_VALUE( v_cur, 1, v_clob );
      END LOOP;

      DBMS_SQL.close_cursor( v_cur );

      IF sys.DBMS_LOB.getlength( v_clob ) > 0 THEN
         DECLARE
            v_len PLS_INTEGER;
            v_pos PLS_INTEGER := 1;
            v_amo PLS_INTEGER := 8000;
            v_chu VARCHAR2( 32767 );
         BEGIN
            v_len := DBMS_LOB.getlength( v_clob );

            WHILE v_pos <= v_len LOOP
               v_amo := LEAST( v_amo, v_len - ( v_pos - 1 ) );
               v_chu := DBMS_LOB.SUBSTR( v_clob, v_amo, v_pos );
               v_pos := v_pos + v_amo;
               HTP.prn( v_chu );
            END LOOP;
         END;
      ELSE
         HTP.prn( 'query_returned_no_data' ); --> prn prints without newline
      END IF;
   ELSE
      HTP.prn( 'no_query_defined' );
   END IF;

   --> Free the temp LOB, if necessary
   BEGIN
      DBMS_LOB.freetemporary( v_clob );
   EXCEPTION
      WHEN OTHERS THEN
         NULL;
   END;

   RETURN NULL;
EXCEPTION
   WHEN OTHERS THEN
      --> Close the cursor, if open
      BEGIN
         IF     v_cur IS NOT NULL
            AND DBMS_SQL.is_open( v_cur ) THEN
            DBMS_SQL.close_cursor( v_cur );
         END IF;
      EXCEPTION
         WHEN OTHERS THEN
            NULL;
      END;

      apex_debug.MESSAGE( SQLERRM );
      --> Write error back to the Browser
      HTP.prn( SQLERRM );
      RETURN NULL;
END dhtmlx_gantt_ajax;
