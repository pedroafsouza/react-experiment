import React from "react";
import _ from "lodash";
import moment from "moment";
import {Panel, Table} from "react-bootstrap"
import Mixins from "../util/Mixins";
import SubscribeMixin from "../flux/SubscribeMixin";
import FlakyTestDetector from "./FlakyTestDetector";

/**
 * Statistics about flaky and failing tests.
 */
export default class UnstableStats extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            testReports: this.props.integrationTests.getTestReports()
        };

        this.subscribe(this.props.integrationTests.onTestReportsChanged(this.onTestReportsChanged.bind(this)));
    }

    onTestReportsChanged() {
        this.setState({testReports: this.props.integrationTests.getTestReports()});
    }

    sortAndFilter(getKey) {
        var count = {};
        _.forEach(this.state.testReports, (report) => {
            _.forEach(report.getFailedTests(), (failure) => {
                var key = getKey(failure);
                if (key) {
                    if (count[key]) {
                        count[key] = count[key] + 1;
                    } else {
                        count[key] = 1;
                    }
                }
            });
        });
        var failList = _.map(count, (count, name) => {
            return {name: name, count: count};
        });
        var sorted = failList.sort((a, b) => {
            var x = b.count - a.count;
            if (x !== 0) {
                return x;
            } else {
                return b.name.localeCompare(a.name);
            }
        });
        var interesting = _.filter(sorted, (item) => {
            return item.count > 1;
        });

        return interesting;
    }

    renderTestFailures(failures) {
        return _.map(failures, (item) => {
            var fullKlass = item.name.substr(0, item.name.indexOf(" "));
            var klass = fullKlass.substr(fullKlass.lastIndexOf(".") + 1);
            var method = item.name.substr(item.name.indexOf(" "));
            var klassLink = "https://github.com/Tradeshift/Integration-Test/tree/master/src/test/groovy/" + fullKlass.replace(/\./g, "/") + ".groovy";
            return (
                <tr key={item.name}>
                    <td>
                        <a href={klassLink} target="_blank">
                            {klass}
                        </a>
                    </td>
                    <td>{method}</td>
                    <td>{item.count}</td>
                </tr>
            )
        });
    }

    renderTests() {
        var failedTests = this.sortAndFilter((failure) => {
            return failure.file + " " + failure.name;
        });

        return this.renderTestFailures(failedTests);
    }

    renderNodes() {
        var nodes = this.sortAndFilter((failure) => {
            return failure.slave;
        });

        return _.map(nodes, (item) => {
            return (
                <tr key={item.name}>
                    <td>
                        <a href={"/computer/slave-" + item.name} target="_blank">{item.name}</a>
                    </td>
                    <td>{item.count}</td>
                </tr>
            )
        });
    }

    renderFlaky() {
        var detector = new FlakyTestDetector(this.props.integrationTests);
        var flaky = detector.findInconsistentlyUnstableTestsForSameBranches();

        var count = {};
        _.forEach(flaky, (failure) => {
            var key = failure.file + " " + failure.name;
            if (key) {
                if (count[key]) {
                    count[key] = count[key] + 1;
                } else {
                    count[key] = 1;
                }
            }
        });
        var failList = _.map(count, (count, name) => {
            return {name: name, count: count};
        });
        var sorted = failList.sort((a, b) => {
            var x = b.count - a.count;
            if (x !== 0) {
                return x;
            } else {
                return b.name.localeCompare(a.name);
            }
        });

        return this.renderTestFailures(sorted);
    }

    render() {
        return (
            <div>
                <Panel header={<h1>Possibly randomly failing tests</h1>}>
                    <p>A <strong>guess</strong> at tests that might be failing randomly, based on other builds with the same branches where that test did not fail.</p>
                    <p>Only branch names are compared, not the actual Git revisions used, so any tests that are fixed between test runs are still counted as randomly failing.</p>
                    <Table striped condensed hover>
                        <thead>
                        <tr>
                            <th>Class</th>
                            <th>Method</th>
                            <th>Score</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.renderFlaky()}
                        </tbody>
                    </Table>
                </Panel>
                <Panel header={<h1>Failures by method</h1>}>
                    <p>Counting failures from all builds there are data for, regardless of whether the test failure was correct. Methods with only a single failure are not shown.</p>
                    <Table striped condensed hover>
                        <thead>
                        <tr>
                            <th>Class</th>
                            <th>Method</th>
                            <th>Failures</th>
                        </tr>
                        </thead>
                        <tbody>
                            {this.renderTests()}
                        </tbody>
                    </Table>
                </Panel>
                <Panel header={<h1>Failures by node</h1>}>
                    <p>Counting failures from all builds there are data for, regardless of how many builds the node has run. Nodes with only a single failure are not shown.</p>

                    <Table striped condensed hover>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Failures</th>
                        </tr>
                        </thead>
                        <tbody>
                            {this.renderNodes()}
                        </tbody>
                    </Table>
                </Panel>
            </div>
        );
    }
}

Mixins.add(UnstableStats.prototype, [SubscribeMixin]);