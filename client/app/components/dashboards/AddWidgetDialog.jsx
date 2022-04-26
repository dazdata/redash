import { map, includes, groupBy, first, find } from "lodash";
import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import Select from "antd/lib/select";
import Modal from "antd/lib/modal";
import { wrap as wrapDialog, DialogPropType } from "@/components/DialogWrapper";
import { MappingType, ParameterMappingListInput } from "@/components/ParameterMappingInput";
import QuerySelector from "@/components/QuerySelector";
import notification from "@/services/notification";
import { Query } from "@/services/query";
import { useUniqueId } from "@/lib/hooks/useUniqueId";

function VisualizationSelect({ query, visualization, onChange }) {
  const visualizationGroups = useMemo(() => {
    return query ? groupBy(query.visualizations, "type") : {};
  }, [query]);

  const vizSelectId = useUniqueId("visualization-select");

  const handleChange = useCallback(
    visualizationId => {
      const selectedVisualization = query ? find(query.visualizations, { id: visualizationId }) : null;
      onChange(selectedVisualization || null);
    },
    [query, onChange]
  );

  if (!query) {
    return null;
  }

  const groups = {"BOXPLOT":"箱线图","CHART":"图表","CHOROPLETH":"地理分布图",
    "COHORT":"同期群分析","COUNTER":"计数器","DETAILS":"记录明细显示","FUNNEL":"漏斗分析",
    "MAP":"地理标记","PIVOT":"数据透视表","SANKEY":"桑基图","SUNBURST_SEQUENCE":"旭辉图",
    "TABLE":"表格","WORD_CLOUD":"词云图"};

  return (
    <div>
      <div className="form-group">
        <label htmlFor={vizSelectId}>选择视图</label>
        <Select
          id={vizSelectId}
          className="w-100"
          value={visualization ? visualization.id : undefined}
          onChange={handleChange}>
          {map(visualizationGroups, (visualizations, groupKey) => (
            <Select.OptGroup key={groupKey} label={groups[groupKey]}>
              {map(visualizations, visualization => (
                <Select.Option key={`${visualization.id}`} value={visualization.id}>
                  {visualization.name}
                </Select.Option>
              ))}
            </Select.OptGroup>
          ))}
        </Select>
      </div>
    </div>
  );
}

VisualizationSelect.propTypes = {
  query: PropTypes.object,
  visualization: PropTypes.object,
  onChange: PropTypes.func,
};

VisualizationSelect.defaultProps = {
  query: null,
  visualization: null,
  onChange: () => {},
};

function AddWidgetDialog({ dialog, dashboard }) {
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [selectedVisualization, setSelectedVisualization] = useState(null);
  const [parameterMappings, setParameterMappings] = useState([]);

  const selectQuery = useCallback(
    queryId => {
      // Clear previously selected query (if any)
      setSelectedQuery(null);
      setSelectedVisualization(null);
      setParameterMappings([]);

      if (queryId) {
        Query.get({ id: queryId }).then(query => {
          if (query) {
            const existingParamNames = map(dashboard.getParametersDefs(), param => param.name);
            setSelectedQuery(query);
            setParameterMappings(
              map(query.getParametersDefs(), param => ({
                name: param.name,
                type: includes(existingParamNames, param.name)
                  ? MappingType.DashboardMapToExisting
                  : MappingType.DashboardAddNew,
                mapTo: param.name,
                value: param.normalizedValue,
                title: "",
                param,
              }))
            );
            if (query.visualizations.length > 0) {
              setSelectedVisualization(first(query.visualizations));
            }
          }
        });
      }
    },
    [dashboard]
  );

  const saveWidget = useCallback(() => {
    dialog.close({ visualization: selectedVisualization, parameterMappings }).catch(() => {
      notification.error("部件未能添加！");
    });
  }, [dialog, selectedVisualization, parameterMappings]);

  const existingParams = dashboard.getParametersDefs();
  const parameterMappingsId = useUniqueId("parameter-mappings");

  return (
    <Modal
      {...dialog.props}
      title="添加部件"
      onOk={saveWidget}
      okButtonProps={{
        ...dialog.props.okButtonProps,
        disabled: !selectedQuery || dialog.props.okButtonProps.disabled,
      }}
      okText="添加至报表"
      cancelText="取消"
      width={700}>
      <div data-test="AddWidgetDialog">
        <QuerySelector onChange={query => selectQuery(query ? query.id : null)} />

        {selectedQuery && (
          <VisualizationSelect
            query={selectedQuery}
            visualization={selectedVisualization}
            onChange={setSelectedVisualization}
          />
        )}

        {parameterMappings.length > 0 && [
          <label key="parameters-title" htmlFor={parameterMappingsId}>
           参数
          </label>,
          <ParameterMappingListInput
            key="parameters-list"
            id={parameterMappingsId}
            mappings={parameterMappings}
            existingParams={existingParams}
            onChange={setParameterMappings}
          />,
        ]}
      </div>
    </Modal>
  );
}

AddWidgetDialog.propTypes = {
  dialog: DialogPropType.isRequired,
  dashboard: PropTypes.object.isRequired,
};

export default wrapDialog(AddWidgetDialog);
