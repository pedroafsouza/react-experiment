import CachingStore from "../flux/CachingStore";
import AuthActions from "./AuthActions";
import Logger from "../util/Logger";
import User from "./User";
import OAuth2AccessToken from "./OAuth2AccessToken";

var log = new Logger(__filename);

/**
 * Store for the User currently logged into the application.
 */
export default class CurrentUserStore extends CachingStore {
    constructor(api) {
        super(__filename);
        this.api = api;

        this.state = this.getCachedState() || {
            user: null,
            accessToken: null
        };

        if (this.state.accessToken) {
            this.api.setAuthToken(this.state.accessToken.accessToken);
            // Reload current user in case the token has expired.
            this._fetchCurrentUser();
        }

        AuthActions.login.onDispatch(this.login.bind(this));
        AuthActions.logout.onDispatch(this.logout.bind(this));

        this._registerListener("accessToken", () => {
            if (this.state.accessToken) {
                this.api.setAuthToken(this.state.accessToken.accessToken);
            } else {
                this.api.setAuthToken(null);
            }
        });
    }

    login(username, password) {
        // TODO Remove demo login
        if (username === "demo" && password === "demo") {
            this.setState({
                user: new User({id: 1, username: "demo", name: "Demo Demosen", email: "demo@example.com"}),
                accessToken: "demo"
            });
        } else {
            this._fetchAccesstoken(username, password)
                .then(() => {
                    this._fetchCurrentUser();
                });
        }
    }

    logout() {
        this.setState({
            user: null,
            accessToken: null
        });
    }

    /**
     * Get the current user if one exists.
     * @returns {null|User}
     */
    getUser() {
        return this.state.user;
    }

    /**
     * Listen for the current user changing.
     * @param {Function} listener
     * @returns {Function}
     */
    onUserChange(listener) {
        return this._registerListener("user", listener);
    }

    /**
     * Listen for the next successful login (but not any subsequent or failed logins).
     * @param {Function} listener
     */
    onNextSuccessfulLogin(listener) {
        var unsubscribe = this.onUserChange(user => {
            if (user) {
                unsubscribe();
                listener();
            }
        });
    }

    /**
     * Listen for unsuccessful login attempts.
     * @param {Function} listener
     * @returns {Function}
     */
    onInvalidLogin(listener) {
        return this._registerListener("invalidLogin", listener);
    }

    unmarshalState(data) {
        return {
            user: data.user ? new User(data.user) : null,
            accessToken: data.accessToken ? new OAuth2AccessToken(data.accessToken) : null
        };
    }

    _fetchAccesstoken(username, password) {
        return this.api.post("/token")
            .send({
                username: username,
                password: password,
                grant_type: "password"
            })
            .set("Content-Type", "application/x-www-form-urlencoded")
            .as(OAuth2AccessToken)
            .catch(() => {
                //console.info("Login failed with username", username, err);
                this._trigger("invalidLogin");
            })
            .then((accessToken) => {
                this.setState({accessToken: accessToken});
                return accessToken;
            });
    }

    _fetchCurrentUser() {
        return this.api.get("/users/current")
            .as(User)
            .then((user) => {
                log.info("Logged in as", user.username);
                this.setState({user: user});
            })
            .catch((err) => {
                log.error("Unable to get current user:", err);
                this.setState({
                    user: null,
                    accessToken: null
                });
            });
    }
}
