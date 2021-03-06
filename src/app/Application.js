import React from "react";
import Promise from "bluebird";
import "bootstrap/dist/css/bootstrap.css";
import ExampleNavbar from "./ExampleNavbar"
import LoginForm from "../auth/LoginForm"
import CurrentUserStore from "../auth/CurrentUserStore";
import Mixins from "../util/Mixins";
import SubscribeMixin from "../flux/SubscribeMixin";
import ExampleApi from "./ExampleApi";
import Router from "../flux/Router";
import Route from "../flux/Route";
import Test2Page from "./Test2Page";

/**
 * The example application itself.
 */
export default class Application extends React.Component {
    constructor(props) {
        super(props);
        var api = new ExampleApi();
        this.currentUserStore = new CurrentUserStore(api);
        this.router = new Router();

        this.state = {
            user: this.currentUserStore.getUser()
        };

        this.subscribe(this.currentUserStore.onUserChange(this.onUserChange.bind(this)));
    }

    onUserChange(user) {
        this.setState({user: user});
    }

    render () {
        if (this.state.user) {
            return (
                <div>
                    <ExampleNavbar {...this.state.user} router={this.router} />
                    <div className="container">
                        <Route path="test1">
                            <h1>Test 1</h1>
                        </Route>
                        <Route path="test2/:id">
                            <Test2Page />
                        </Route>
                        <Route defaultPath>
                            <h1>Dashboard</h1>
                        </Route>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="container">
                    <LoginForm userStore={this.currentUserStore}/>
                </div>
            );
        }
    }
}

Mixins.add(Application.prototype, [SubscribeMixin]);