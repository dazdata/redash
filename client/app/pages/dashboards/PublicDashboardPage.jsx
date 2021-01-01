import { isEmpty, has } from "lodash";
import React from "react";
import PropTypes from "prop-types";

import routeWithApiKeySession from "@/components/ApplicationArea/routeWithApiKeySession";
import Link from "@/components/Link";
import BigMessage from "@/components/BigMessage";
import PageHeader from "@/components/PageHeader";
import Parameters from "@/components/Parameters";
import DashboardGrid from "@/components/dashboards/DashboardGrid";
import Filters from "@/components/Filters";

import { Dashboard } from "@/services/dashboard";
import location from "@/services/location";
import routes from "@/services/routes";

import logoUrl from "@/assets/images/redash_icon_small.png";

import useDashboard from "./hooks/useDashboard";

import "./PublicDashboardPage.less";

function PublicDashboard({ dashboard }) {
  const { globalParameters, filters, setFilters, refreshDashboard, loadWidget, refreshWidget } = useDashboard(
    dashboard
  );

  const hideHeader = has(location.search, "hide_header");
  const hideParametersUI = has(location.search, "hide_parameters");

  return (
    <div className="container p-t-10 p-b-20">
      {!hideHeader && (
        <PageHeader title={dashboard.name} />
      )}
      {!hideParametersUI && !isEmpty(globalParameters) && (
        <div className="m-b-10 p-15 bg-white tiled">
          <Parameters parameters={globalParameters} onValuesChange={refreshDashboard} />
        </div>
      )}
      {!hideParametersUI && !isEmpty(filters) && (
        <div className="m-b-10 p-15 bg-white tiled">
          <Filters filters={filters} onChange={setFilters} />
        </div>
      )}
      <div id="dashboard-container">
        <DashboardGrid
          dashboard={dashboard}
          widgets={dashboard.widgets}
          filters={filters}
          isEditing={false}
          isPublic
          onLoadWidget={loadWidget}
          onRefreshWidget={refreshWidget}
        />
      </div>
    </div>
  );
}

PublicDashboard.propTypes = {
  dashboard: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

class PublicDashboardPage extends React.Component {
  static propTypes = {
    token: PropTypes.string.isRequired,
    onError: PropTypes.func,
  };

  static defaultProps = {
    onError: () => {},
  };

  state = {
    loading: true,
    dashboard: null,
  };

  componentDidMount() {
    Dashboard.getByToken({ token: this.props.token })
      .then(dashboard => this.setState({ dashboard, loading: false }))
      .catch(error => this.props.onError(error));
  }

  render() {
    const { loading, dashboard } = this.state;
    const hideFooter = has(location.search, "hide_footer");

    return (
      <div className="public-dashboard-page">
        {loading ? (
          <div className="container loading-message">
            <BigMessage className="" icon="fa-spinner fa-2x fa-pulse" message="加载中..." />
          </div>
        ) : (
          <PublicDashboard dashboard={dashboard} />
        )}
        {!hideFooter && (
        <div id="footer">
          <div className="text-center">
            <Link href="https://redash.io">
              <img alt="Redash Logo" src={logoUrl} width="38" />
            </Link>
          </div>
          Powered by <Link href="https://redash.io/?ref=public-dashboard">Redash</Link>
        </div>
        )}
      </div>
    );
  }
}

routes.register(
  "Dashboards.ViewShared",
  routeWithApiKeySession({
    path: "/public/dashboards/:token",
    render: pageProps => <PublicDashboardPage {...pageProps} />,
    getApiKey: currentRoute => currentRoute.routeParams.token,
  })
);
