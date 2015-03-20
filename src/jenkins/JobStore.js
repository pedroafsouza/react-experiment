import CachingStore from "../flux/CachingStore"
import request from "superagent-bluebird-promise";
import Build from "./Build";
import TestReport from "./TestReport";
import FailureData from "./FailureData";

/**
 * Store for the data from a single Jenkins build job.
 */
export default class JobStore extends CachingStore {
    /**
     * @param {String} name The job name, as seen in the Jenkins url.
     * @param {Number} [limit=50] The number of builds to fetch.
     */
    constructor(name, limit=50) {
        super(__filename + name);

        this.name = name;
        this.limit = limit;
        this.state = this.getCachedState() || {
            builds: [],
            reports: {},
            failureData: {}
        };

        this.pendingReports = {};
        this.pendingFailureData = {};

        this._updateBuilds();

        setInterval(this._updateBuilds.bind(this), 30 * 1000);

        window["clearData-" + name.replace(/-/g, "")] = () => {
            this.setState({reports: {}, failureData: {}});
        }
    }

    onBuildsChanged(listener) {
        return this._registerListener("builds", listener);
    }

    getBuilds() {
        return this.state.builds;
    }

    onTestReportsChanged(listener) {
        return this._registerListener("reports", listener);
    }

    getTestReports() {
        return this.state.reports;
    }

    onFailureDataChanged(listener) {
        return this._registerListener("failureData", listener);
    }

    getFailureData() {
        return this.state.failureData;
    }

    _updateBuilds() {
        request.get("/job/" + this.name + "/api/json")
            .query("tree=builds[number,building,result,timestamp,duration,url,keepLog,actions[parameters[*],causes[userName,upstreamBuild,upstreamProject]]]{0," + this.limit + "}")
            .then((result) => {
                var builds = _.map(result.body.builds, (data) => {
                    return new Build(data);
                });

                _.forEach(builds, (build) => {
                    if (build.isUnstable()) {
                        this._updateTestReport(build.number);
                    } else if (build.isFailed()) {
                        this._updateFailureData(build.number);
                    }
                });

                this.setState({builds: builds});
            })
            .catch((err) => {});
    }

    _updateTestReport(id, retry=true) {
        if (this.state.reports[id] || this.pendingReports[id]) {
            return;
        }
        this.pendingReports[id] = true;

        request.get("/job/" + this.name + "/" + id + "/testReport/api/json")
            .query("tree=failCount,passCount,skipCount,suites[name,cases[name,status,stdout]]")
            .then((result) => {
                if (result.body && result.body.suites) {
                    var report = new TestReport(result.body);
                    this.setState({reports: _.assign({[id]: report}, this.state.reports)});
                }
            })
            .catch(() => {
                if (retry) {
                    // Sometimes the test reports aren't ready when the build finishes.
                    return Promise.delay(10000)
                        .then(() => {
                            this._updateTestReport(id, false);
                        });
                }
            });
    }

    _updateFailureData(id) {
        if (this.state.failureData[id] || this.pendingFailureData[id]) {
            return;
        }
        this.pendingFailureData[id] = true;

        request.get("/job/" + this.name + "/" + id + "/consoleText")
            .then((result) => {
                var data = FailureData.fromConsoleOutput(result.text);
                this.setState({failureData: _.assign({[id]: data}, this.state.failureData)});
            })
            .catch((err) => {});
    }

    unmarshalState(data) {
        return {
            builds: CachingStore.listOf(data.builds, Build),
            reports: CachingStore.mapOf(data.reports, TestReport),
            failureData: CachingStore.mapOf(data.failureData, FailureData)
        };
    }
}