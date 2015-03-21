import _ from "lodash";

var IT_PARAM_REPOS = {
    INTEGRATION_TEST_GIT_REF: "Integration-Test",
    FRONTEND_GIT_REF: "Frontend",
    BACKEND_GIT_REF: "Backend-Service",
    SUPPLIERINTEGRATIONS_GIT_REF: "Supplier-Integrations", // different
    PROXY2_GIT_REF: "Tradeshift-Proxy2",
    CONVERSIONS_GIT_REF: "Backend-Conversions",
    INTEGRATION_GIT_REF: "Integrations",
    APPTOOL_GIT_REF: "App-Tool", // different
    APPSERVICE_GIT_REF: "App-Service", // different
    APPS_GIT_REF: "Apps",
    APPS_SERVER_GIT_REF: "Apps-Server",
    CITISCF_GIT_REF: "Financing-CitiSCF",
    CLOUDSCAN_GIT_REF: "cloudscan-service",
    AUDITSERVER_GIT_REF: "Audit-Server",
    WORKFLOW_GIT_REF: "Workflow",
    FINANCINGDD_GIT_REF: "Financing-DD", // different
    C8_GIT_REF: "Financing-C8",
    BUSINESSEVENTSERVICE_GIT_REF: "BusinessEventHandler",
    LOCKING_GIT_REF: "Locking",
    EMAILINCOMING_GIT_REF: "Email-Incoming-Service",
    CHINAPAYMENT_GIT_REF: "tradeshift-china-payment"
};

/**
 * A build of a specific Jenkins job.
 */
export default class Build {
    constructor(data) {
        _.assign(this, data);
    }

    isBuilding() {
        return this.building;
    }

    isSuccess() {
        return this.result === "SUCCESS";
    }

    isUnstable() {
        return this.result === "UNSTABLE";
    }

    isFailed() {
        return this.result === "FAILED" || this.result === "FAILURE";
    }

    isAborted() {
        return this.result === "ABORTED";
    }

    _causeWithProperty(name) {
        var cause = null;
        _.forEach(this.actions, (action) => {
            if (action.causes &&
                action.causes[0] &&
                action.causes[0][name]) {
                cause = action.causes[0];
            }
        });
        return cause;
    }

    getUpstream() {
        var cause = this._causeWithProperty("upstreamBuild");
        if (cause) {
            return {
                id: cause.upstreamBuild,
                name: cause.upstreamProject
            }
        } else {
            return {};
        }
    }

    getUserFullName() {
        var cause = this._causeWithProperty("userName");
        if (cause) {
            return cause.userName;
        } else {
            return null;
        }
    }

    getUserId() {
        var cause = this._causeWithProperty("userId");
        if (cause) {
            return cause.userId;
        } else {
            return null;
        }
    }

    getName() {
        return /\/job\/(.+?)\/./.exec(this.url)[0];
    }

    getParametersList() {
        var paramList = [];
        _.find(this.actions, (action) => {
            if (action.parameters) {
                paramList = action.parameters;
                return true;
            }
        });
        return paramList;
    }

    getParameters() {
        var params = {};
        _.forEach(this.getParametersList(), (param) => {
            params[param.name] = param.value;
        });
        return params;
    }

    getRepoBranches() {
        var repos = {};
        _.forEach(this.getParameters(), (value, name) => {
            if (_.endsWith(name, "_GIT_REF")) {
                var repo = IT_PARAM_REPOS[name];
                var branch = _.startsWith(value, "origin/") ? value.substr(7) : value;

                repos[repo] = branch;
            }
        });

        return repos;
    }
}
