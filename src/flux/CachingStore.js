import _ from "lodash";
import Store from "./Store";

/**
 * Specialized store that saves its state in localstorage as JSON between sessions.
 */
export default class CachingStore extends Store {
    /**
     * @param {String} storageKey The key to save data under in localstorage.
     */
    constructor(storageKey) {
        super();
        this.storageKey = storageKey;
        window.addEventListener("unload", this.saveToLocalStorage.bind(this));
    }

    saveToLocalStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    /**
     * Get the cached state.
     * Use this when assigning state in your subclass constructor.
     * @returns {Object}
     */
    getCachedState() {
        var rawData = localStorage.getItem(this.storageKey);
        if (rawData) {
            var data = JSON.parse(rawData);
            return this.unmarshalState(data);
        } else {
            return null;
        }
    }

    /**
     * Optionally modify data after retrieving it (e.g. to replace raw objects with classes).
     * @param {Object} data
     * @returns {Object}
     */
    unmarshalState(data) {
        return data;
    }

    /**
     * Transforms a list of untyped objects into a list of class instances, created with the objects.
     * @param {Object[]} list
     * @param {*} Klass
     * @returns {*[]}
     */
    static listOf(list, Klass) {
        if (!list) {
            return [];
        }
        return _.map(list, (item) => {
            return new Klass(item);
        });
    }

    /**
     * Transforms a map with untyped object values into a map with class instance values, created with the objects.
     * @param {Object} obj
     * @param {*} Klass
     * @returns {Object}
     */
    static mapOf(obj, Klass) {
        if (!obj) {
            return {};
        }
        return _.reduce(obj, (result, value, key) => {
            result[key] = new Klass(value);
            return result;
        }, {});
    }
}