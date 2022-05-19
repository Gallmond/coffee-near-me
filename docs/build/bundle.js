
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text$1(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text$1(' ');
    }
    function empty() {
        return text$1('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const ors_url = 'https://api.openrouteservice.org';
    const api_key = '5b3ce3597851110001cf6248511c38bca6e2470b828a93edf1d33fe6';
    /**
     * Just a convenience function to make the request to ORS
     *
     * @param path The api path to use
     * @param getParams the get params to use
     * @returns Promise<Response>
     */
    const ORSRequest = async (path, getParams) => {
        const params = Object.assign({ api_key: api_key }, getParams);
        const queryString = new URLSearchParams(params).toString();
        const res = await fetch(`${ors_url}${path}?${queryString}`);
        return res;
    };
    const getWalkingDirections = async (from, to) => {
        // nb: ors expect lng then lat
        const start = [from.lng, from.lat].join(',');
        const end = [to.lng, to.lat].join(',');
        const res = await ORSRequest('/v2/directions/foot-walking', {
            start: start,
            end: end,
        });
        const json = await res.json();
        return json;
    };
    var ORSHelper = {
        getWalkingDirections,
    };

    const save = (key, data) => {
        console.log('save', key, data);
        if (!window.localStorage)
            return;
        window.localStorage.setItem(key, JSON.stringify(data));
    };
    const load = (key) => {
        if (!window.localStorage)
            return;
        const data = window.localStorage.getItem(key);
        console.log('load', key, data);
        return JSON.parse(data);
    };
    var LocalStorageHelper = {
        load,
        save,
    };

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // richmond park 51.44335302653705, -0.27522446597719047
    const HomeLocation = writable({
        lat: 51.44335302653705,
        lng: -0.27522446597719047
    });

    const ShopStore = writable([]);

    const SplashOverlayVisible = writable(true);

    const latLonBoundingBox$1 = (coordinates) => {
        let minLat = coordinates[0][0];
        let minLon = coordinates[0][1];
        let maxLat = coordinates[0][0];
        let maxLon = coordinates[0][1];
        coordinates.forEach(coord => {
            if (coord[0] < minLat)
                minLat = coord[0];
            if (coord[1] < minLon)
                minLon = coord[1];
            if (coord[0] > maxLat)
                maxLat = coord[0];
            if (coord[1] > maxLon)
                maxLon = coord[1];
        });
        return [
            [minLat, minLon],
            [maxLat, maxLon]
        ];
    };
    const getMarkerBoundingBox$1 = (markers) => {
        const allMarkerCoordinates = [];
        Object.entries(markers).forEach(([key, marker]) => {
            allMarkerCoordinates.push([marker.getLatLng().lat, marker.getLatLng().lng]);
        });
        if (allMarkerCoordinates.length === 0)
            return null;
        return latLonBoundingBox$1(allMarkerCoordinates);
    };
    var MarkerHelpers = {
        getMarkerBoundingBox: getMarkerBoundingBox$1,
        latLonBoundingBox: latLonBoundingBox$1
    };

    const { getMarkerBoundingBox, latLonBoundingBox } = MarkerHelpers;
    class Application {
        constructor(options = null) {
            this.markerData = {};
            this.leafletMarkers = [];
            this.polyLines = [];
            this.houseIconData = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNzUycHQiIGhlaWdodD0iNzUycHQiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDc1MiA3NTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8cGF0aCBkPSJtMzc1IDE0OC4zOWMtNC40NTcgMC04LjkxNDEgMS40OTYxLTEyLjU2NiA0LjQ5MjJsLTIxMC44NyAxNzNjLTYuNDgwNSA1LjMyMDMtOC45MTQxIDE0LjE0MS02LjA3MDMgMjIuMDI3IDIuODMyIDcuODYzMyAxMC4yODUgMTMuMDk4IDE4LjYzNyAxMy4wOThoMC4wODU5MzhsMzguNzA3LTAuMTcxODh2MC4wMDM5MDZsMC4xNDA2MiAyMTIuODljMC4wMDM5MDYgNS4yNTc4IDIuMDk3NyAxMC4zMDEgNS44MTY0IDE0LjAxMiAzLjcxNDggMy43MDcgOC43NDYxIDUuNzg1MiAxMy45OTIgNS43ODUyaDAuMDM1MTU2bDk4LjU4Ni0wLjE3MTg4aDAuMDI3MzQ0Yy0wLjExNzE5LTAuODAwNzgtMC4xNzU3OC0xLjYxMzMtMC4xNzU3OC0yLjQyOTd2LTE2MS4yMWMwLTQuNDQxNCAxLjc2NTYtOC43MDcgNC45MDYyLTExLjg0OCAzLjE0MDYtMy4xNDA2IDcuNDAyMy00LjkwNjIgMTEuODQ4LTQuOTA2Mmw3My40MTQgMC4wMDc4MTJjOS4yNTM5IDAgMTYuNzU0IDcuNSAxNi43NTQgMTYuNzU0djE2MS4yYzAgMC45Mjk2OS0wLjA3NDIxOSAxLjgzOTgtMC4yMjI2NiAyLjcyNjZoMC4wMjczNDRsNTYuODI4IDAuMzA0NjloMC4xMDkzOGMwLjg2NzE5IDAgMS43MjI3LTAuMDU0Njg4IDIuNTYyNS0wLjE2NDA2aDAuMDA3ODEyYzAuMDg5ODQ0IDAuMDAzOTA2IDAuMTc5NjkgMC4wMDM5MDYgMC4yNzM0NCAwLjAwMzkwNmwzOC42NTIgMC4wMTU2MjZoMC4wMDc4MTNjMTAuOTIyIDAgMTkuNzg1LTguODQzOCAxOS44MDktMTkuNzY2bDAuNDkyMTktMjEyLjk2IDM4Ljc1LTAuMTMyODFjOC4zNTE2LTAuMDMxMjUgMTUuNzg5LTUuMjk2OSAxOC41OTQtMTMuMTY0IDIuODAwOC03Ljg2NzIgMC4zNjcxOS0xNi42NDgtNi4wODU5LTIxLjk1M2wtMjEwLjUtMTcyLjkzYy0zLjY1NjItMy04LjExNzItNC41LTEyLjU3NC00LjV6IiBmaWxsPSIjMDA0NDllIi8+Cjwvc3ZnPgo=';
            this.longPressTimeMs = 500;
            this.options = options !== null && options !== void 0 ? options : null;
        }
        option(key) {
            if (Object.keys(this.options).includes(key)) {
                return this.options[key];
            }
            return null;
        }
        setLeaflet(leaflet) {
            this.leaflet = leaflet;
            return this;
        }
        createMap(element, options) {
            //@ts-ignore
            this.map = this.leaflet.map(element, options);
            if (this.option('startLocation')) {
                this.map.setView(this.option('startLocation'), 18);
            }
            //@ts-ignore
            this.leaflet.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox/streets-v11',
                tileSize: 512,
                zoomOffset: -1,
                accessToken: this.option('mapBox').accessToken
                //@ts-ignore
            }).addTo(this.map);
            return this.map;
        }
        /** zoom the map to contain these coords */
        fitCoords(latLonArray) {
            const bounds = latLonBoundingBox(latLonArray);
            this.map.flyToBounds(bounds, {
                maxZoom: 17,
            });
        }
        fitBoundsToAllMarkers() {
            const bounds = getMarkerBoundingBox(this.markerData);
            if (!bounds)
                return;
            this.map.flyToBounds(bounds);
        }
        flyTo(coord) {
            this.map.flyTo([coord.lat, coord.lng], 17);
        }
        clearLines() {
            this.polyLines.forEach(line => {
                line.remove();
            });
        }
        drawLine(latLonArray) {
            //@ts-ignore
            const polyLine = this.leaflet.polyline(latLonArray, {
                color: 'red',
            }).addTo(this.map);
            this.polyLines.push(polyLine);
        }
        drawMarkers(shops) {
            const existingMarkersKeys = Object.keys(this.markerData);
            shops.forEach((shop) => {
                // check if it already exists
                const pretendId = `${shop.location.lat}-${shop.location.lng}`;
                if (existingMarkersKeys.includes(pretendId)) {
                    // already exists, do nothing
                    const existingMarkerIndex = existingMarkersKeys.findIndex(key => key === pretendId);
                    if (existingMarkerIndex > -1) {
                        existingMarkersKeys.splice(existingMarkerIndex, 1);
                    }
                    return;
                }
                //@ts-ignore
                this.markerData[pretendId] = this.leaflet.marker(shop.location);
                this.markerData[pretendId].addTo(this.map);
                this.markerData[pretendId].on('click', this.markerClickHandler);
            });
            // any markers still in the list should not be set
            existingMarkersKeys.forEach(key => {
                this.markerData[key].removeFrom(this.map);
                delete this.markerData[key];
            });
        }
        drawHouse(HomeLocation) {
            if (this.homeLocationMarker) {
                this.homeLocationMarker.removeFrom(this.map);
            }
            //@ts-ignore
            const houseIcon = this.leaflet.icon({
                iconUrl: this.houseIconData,
                iconSize: [50, 50],
                iconAnchor: [25, 50],
                // popupAnchor: [-3, -76],
                // shadowUrl: 'my-icon-shadow.png',
                // shadowSize: [68, 95],
                // shadowAnchor: [22, 94]
            });
            //@ts-ignore
            const marker = this.leaflet.marker(HomeLocation, { icon: houseIcon }).addTo(this.map);
            this.homeLocationMarker = marker;
        }
        onMarkerClick(fn) {
            this.markerClickHandler = fn;
        }
        onClick(fn) {
            this.map.on('click', fn);
        }
        onLongClick(fn) {
            this.map.on('mousedown', (e) => {
                this.mouseDownTimeout = setTimeout(() => {
                    fn(e);
                }, this.longPressTimeMs);
            });
            this.map.on('mouseup', (e) => {
                clearTimeout(this.mouseDownTimeout);
            });
            this.map.on('mousemove', (e) => {
                clearTimeout(this.mouseDownTimeout);
            });
        }
        addStore(price, name, coord, description = null) {
            // add to the ShopStore
            ShopStore.update(shops => {
                const newShop = {
                    price,
                    name,
                    location: coord,
                };
                if (description)
                    newShop['description'] = description;
                return [...shops, newShop];
            });
            // add marker to map
            return this;
        }
        initMap() { }
    }

    /* src\Components\LeafletMap.svelte generated by Svelte v3.48.0 */

    const file$c = "src\\Components\\LeafletMap.svelte";

    function create_fragment$c(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "map");
    			attr_dev(div, "class", "svelte-kr17y5");
    			add_location(div, file$c, 58, 0, 1760);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LeafletMap', slots, []);
    	const dispatch = createEventDispatcher();
    	let application;

    	const flyTo = coord => {
    		if (application === undefined) return;
    		application.flyTo(coord);
    	};

    	/**
     * A helper to get the leaflet root object without lots of ts-ignore directives
     */
    	const LEAFLET = () => {
    		//@ts-ignore
    		return L === undefined ? undefined : L;
    	};

    	const drawRoute = latLonArray => {
    		if (application === undefined) return;
    		application.clearLines();
    		application.drawLine(latLonArray);
    		application.fitCoords(latLonArray);
    	};

    	// required to access window objects
    	onMount(() => {
    		application = new Application({
    				debug: true,
    				startLocation: [51.46521575117327, -0.2595353314797258],
    				mapBox: {
    					accessToken: 'pk.eyJ1IjoiZnVuYW5kY29vbGd1eSIsImEiOiJjbDJyYWh2ZzYzMXNoM2lwOWhudGQ1NGpnIn0.PG_RcxkH973h1MEirqweDg'
    				}
    			});

    		application.setLeaflet(LEAFLET());
    		application.createMap('map');

    		ShopStore.subscribe(shops => {
    			application.drawMarkers(shops);
    			application.fitBoundsToAllMarkers();
    		});

    		HomeLocation.subscribe(coord => {
    			application.drawHouse(coord);
    		});

    		application.onMarkerClick(e => {
    			dispatch('markerClick', e);
    		});

    		application.onClick(e => {
    			dispatch('mapClick', e);
    		});

    		application.onLongClick(e => {
    			dispatch('mapLongPress', e);
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LeafletMap> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		ShopStore,
    		HomeLocation,
    		Application,
    		dispatch,
    		application,
    		flyTo,
    		LEAFLET,
    		drawRoute
    	});

    	$$self.$inject_state = $$props => {
    		if ('application' in $$props) application = $$props.application;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [flyTo, drawRoute];
    }

    class LeafletMap extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { flyTo: 0, drawRoute: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LeafletMap",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get flyTo() {
    		return this.$$.ctx[0];
    	}

    	set flyTo(value) {
    		throw new Error("<LeafletMap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drawRoute() {
    		return this.$$.ctx[1];
    	}

    	set drawRoute(value) {
    		throw new Error("<LeafletMap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const distanceBetweenKM = (coord1, coord2) => {
      let [lat1, lng1] = coord1;
      let [lat2, lng2] = coord2;

      // The math module contains a function
      // named toRadians which converts from
      // degrees to radians.
      lng1 = (lng1 * Math.PI) / 180;
      lng2 = (lng2 * Math.PI) / 180;
      lat1 = (lat1 * Math.PI) / 180;
      lat2 = (lat2 * Math.PI) / 180;

      // Haversine formula
      let dlng = lng2 - lng1;
      let dlat = lat2 - lat1;
      let a =
        Math.pow(Math.sin(dlat / 2), 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlng / 2), 2);

      let c = 2 * Math.asin(Math.sqrt(a));

      // Radius of earth in kilometers. Use 3956
      // for miles
      let r = 6371;

      // calculate the result
      return c * r;
    };

    var distanceBetweenKM_1 = distanceBetweenKM;

    /* src\Components\ShopCard.svelte generated by Svelte v3.48.0 */
    const file$b = "src\\Components\\ShopCard.svelte";

    function create_fragment$b(ctx) {
    	let div4;
    	let div2;
    	let div0;
    	let t0_value = /*shop*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*thisShopDistance*/ ctx[1].toFixed(2) + "";
    	let t2;
    	let t3;
    	let t4;
    	let div3;
    	let t5;
    	let t6_value = /*shop*/ ctx[0].price.toFixed(2) + "";
    	let t6;
    	let div4_title_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text$1(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text$1(t2_value);
    			t3 = text$1("km");
    			t4 = space();
    			div3 = element("div");
    			t5 = text$1("£");
    			t6 = text$1(t6_value);
    			attr_dev(div0, "class", "title svelte-1clp0r6");
    			add_location(div0, file$b, 14, 4, 591);
    			attr_dev(div1, "class", "distance svelte-1clp0r6");
    			add_location(div1, file$b, 15, 4, 633);
    			attr_dev(div2, "class", "left svelte-1clp0r6");
    			add_location(div2, file$b, 13, 2, 567);
    			attr_dev(div3, "class", "right svelte-1clp0r6");
    			add_location(div3, file$b, 17, 2, 706);
    			attr_dev(div4, "class", "shop-card svelte-1clp0r6");
    			attr_dev(div4, "title", div4_title_value = /*shop*/ ctx[0].description);
    			add_location(div4, file$b, 12, 0, 494);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, t5);
    			append_dev(div3, t6);

    			if (!mounted) {
    				dispose = listen_dev(div4, "click", /*onClick*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*shop*/ 1 && t0_value !== (t0_value = /*shop*/ ctx[0].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*thisShopDistance*/ 2 && t2_value !== (t2_value = /*thisShopDistance*/ ctx[1].toFixed(2) + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*shop*/ 1 && t6_value !== (t6_value = /*shop*/ ctx[0].price.toFixed(2) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*shop*/ 1 && div4_title_value !== (div4_title_value = /*shop*/ ctx[0].description)) {
    				attr_dev(div4, "title", div4_title_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let thisShopDistance;
    	let $HomeLocation;
    	validate_store(HomeLocation, 'HomeLocation');
    	component_subscribe($$self, HomeLocation, $$value => $$invalidate(3, $HomeLocation = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ShopCard', slots, []);
    	const dispatch = createEventDispatcher();
    	let { shop } = $$props;

    	const onClick = e => {
    		dispatch("shopClick", shop);
    	};

    	const writable_props = ['shop'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ShopCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('shop' in $$props) $$invalidate(0, shop = $$props.shop);
    	};

    	$$self.$capture_state = () => ({
    		HomeLocation,
    		createEventDispatcher,
    		distanceBetweenKM: distanceBetweenKM_1,
    		dispatch,
    		shop,
    		onClick,
    		thisShopDistance,
    		$HomeLocation
    	});

    	$$self.$inject_state = $$props => {
    		if ('shop' in $$props) $$invalidate(0, shop = $$props.shop);
    		if ('thisShopDistance' in $$props) $$invalidate(1, thisShopDistance = $$props.thisShopDistance);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$HomeLocation, shop*/ 9) {
    			// recalculate distance if HomeLocation changes.
    			$$invalidate(1, thisShopDistance = distanceBetweenKM_1([$HomeLocation.lat, $HomeLocation.lng], [shop.location.lat, shop.location.lng]));
    		}
    	};

    	return [shop, thisShopDistance, onClick, $HomeLocation];
    }

    class ShopCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { shop: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShopCard",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*shop*/ ctx[0] === undefined && !('shop' in props)) {
    			console.warn("<ShopCard> was created without expected prop 'shop'");
    		}
    	}

    	get shop() {
    		throw new Error("<ShopCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shop(value) {
    		throw new Error("<ShopCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\List.svelte generated by Svelte v3.48.0 */
    const file$a = "src\\Components\\List.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (9:2) {#each shops as shop}
    function create_each_block$1(ctx) {
    	let shopcard;
    	let current;

    	shopcard = new ShopCard({
    			props: { shop: /*shop*/ ctx[2] },
    			$$inline: true
    		});

    	shopcard.$on("shopClick", /*shopClick_handler*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(shopcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shopcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const shopcard_changes = {};
    			if (dirty & /*shops*/ 1) shopcard_changes.shop = /*shop*/ ctx[2];
    			shopcard.$set(shopcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shopcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shopcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shopcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(9:2) {#each shops as shop}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let current;
    	let each_value = /*shops*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "container svelte-a5c4d2");
    			add_location(div, file$a, 7, 0, 180);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*shops*/ 1) {
    				each_value = /*shops*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('List', slots, []);
    	let { shops } = $$props;
    	const writable_props = ['shops'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	function shopClick_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('shops' in $$props) $$invalidate(0, shops = $$props.shops);
    	};

    	$$self.$capture_state = () => ({ ShopCard, shops });

    	$$self.$inject_state = $$props => {
    		if ('shops' in $$props) $$invalidate(0, shops = $$props.shops);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [shops, shopClick_handler];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { shops: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*shops*/ ctx[0] === undefined && !('shops' in props)) {
    			console.warn("<List> was created without expected prop 'shops'");
    		}
    	}

    	get shops() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shops(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\TransparentOverlay.svelte generated by Svelte v3.48.0 */

    const file$9 = "src\\Components\\TransparentOverlay.svelte";

    // (4:0) {#if visible}
    function create_if_block$5(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "overlay svelte-1vngmk0");
    			add_location(div, file$9, 4, 2, 77);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(4:0) {#if visible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*visible*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*visible*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*visible*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TransparentOverlay', slots, ['default']);
    	let { visible = false } = $$props;
    	const writable_props = ['visible'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TransparentOverlay> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('visible' in $$props) $$invalidate(0, visible = $$props.visible);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ visible });

    	$$self.$inject_state = $$props => {
    		if ('visible' in $$props) $$invalidate(0, visible = $$props.visible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [visible, $$scope, slots];
    }

    class TransparentOverlay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { visible: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TransparentOverlay",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get visible() {
    		throw new Error("<TransparentOverlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<TransparentOverlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * True when a given string is not empty.
     *
     * @param value A string or number
     * @returns boolean
     */
    const text = (value) => {
        return value.toString().trim().length > 0;
    };
    /**
     * True when a given number is not empty, and above 0.
     *
     * @param value A number
     * @returns boolean
     */
    const floatOverZero = (value) => {
        return typeof value === 'number' && value > 0;
    };
    var isValid = {
        text,
        floatOverZero
    };

    /* src\Components\TextInput.svelte generated by Svelte v3.48.0 */

    const file$8 = "src\\Components\\TextInput.svelte";

    // (14:2) {#if label !== ''}
    function create_if_block$4(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text$1(/*label*/ ctx[2]);
    			attr_dev(label_1, "for", /*id*/ ctx[4]);
    			attr_dev(label_1, "class", "svelte-1ioo2o9");
    			add_location(label_1, file$8, 14, 4, 386);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(14:2) {#if label !== ''}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let t;
    	let input;
    	let input_class_value;
    	let mounted;
    	let dispose;
    	let if_block = /*label*/ ctx[2] !== '' && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			input = element("input");
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*inputClasses*/ ctx[3]) + " svelte-1ioo2o9"));
    			attr_dev(input, "id", /*id*/ ctx[4]);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			add_location(input, file$8, 16, 2, 430);
    			attr_dev(div, "class", "container svelte-1ioo2o9");
    			add_location(div, file$8, 12, 0, 335);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);
    			append_dev(div, input);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keyup", /*onKeyUp*/ ctx[5], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[2] !== '') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*inputClasses*/ 8 && input_class_value !== (input_class_value = "" + (null_to_empty(/*inputClasses*/ ctx[3]) + " svelte-1ioo2o9"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*placeholder*/ 2) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let inputClasses;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextInput', slots, []);
    	let { placeholder = '' } = $$props;
    	let { value = '' } = $$props;
    	let { label = '' } = $$props;
    	const id = 'id-' + Math.random().toString(36).substring(2, 5);
    	let isValid = true;
    	let { validIf = e => true } = $$props;

    	const onKeyUp = e => {
    		$$invalidate(7, isValid = validIf(value));
    	};

    	const writable_props = ['placeholder', 'value', 'label', 'validIf'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('validIf' in $$props) $$invalidate(6, validIf = $$props.validIf);
    	};

    	$$self.$capture_state = () => ({
    		placeholder,
    		value,
    		label,
    		id,
    		isValid,
    		validIf,
    		onKeyUp,
    		inputClasses
    	});

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('isValid' in $$props) $$invalidate(7, isValid = $$props.isValid);
    		if ('validIf' in $$props) $$invalidate(6, validIf = $$props.validIf);
    		if ('inputClasses' in $$props) $$invalidate(3, inputClasses = $$props.inputClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isValid*/ 128) {
    			$$invalidate(3, inputClasses = isValid ? '' : 'invalid');
    		}
    	};

    	return [
    		value,
    		placeholder,
    		label,
    		inputClasses,
    		id,
    		onKeyUp,
    		validIf,
    		isValid,
    		input_input_handler
    	];
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			placeholder: 1,
    			value: 0,
    			label: 2,
    			validIf: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextInput",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get placeholder() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get validIf() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set validIf(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\NumberInput.svelte generated by Svelte v3.48.0 */
    const file$7 = "src\\Components\\NumberInput.svelte";

    // (23:2) {#if label !== ''}
    function create_if_block$3(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text$1(/*label*/ ctx[2]);
    			attr_dev(label_1, "for", /*id*/ ctx[5]);
    			attr_dev(label_1, "class", "svelte-lo7ls3");
    			add_location(label_1, file$7, 23, 4, 675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(23:2) {#if label !== ''}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let t;
    	let input;
    	let input_class_value;
    	let mounted;
    	let dispose;
    	let if_block = /*label*/ ctx[2] !== '' && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			input = element("input");
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*inputClasses*/ ctx[4]) + " svelte-lo7ls3"));
    			attr_dev(input, "id", /*id*/ ctx[5]);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			add_location(input, file$7, 25, 2, 719);
    			attr_dev(div, "class", "container svelte-lo7ls3");
    			add_location(div, file$7, 21, 0, 624);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);
    			append_dev(div, input);
    			/*input_binding*/ ctx[9](input);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keyup", /*onKeyUp*/ ctx[6], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[2] !== '') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*inputClasses*/ 16 && input_class_value !== (input_class_value = "" + (null_to_empty(/*inputClasses*/ ctx[4]) + " svelte-lo7ls3"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*placeholder*/ 2) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1 && to_number(input.value) !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			/*input_binding*/ ctx[9](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let inputClasses;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NumberInput', slots, []);
    	let { placeholder = '' } = $$props;
    	let { value = '' } = $$props;
    	let { label = '' } = $$props;
    	const id = 'id-' + Math.random().toString(36).substring(2, 5);

    	// validity check
    	let isValid = true;

    	let { validIf = e => true } = $$props;

    	const onKeyUp = e => {
    		$$invalidate(8, isValid = validIf(value !== null && value !== void 0 ? value : 0));
    	};

    	// grab the element and disable the wheel changing the value
    	let inputElement;

    	onMount(() => {
    		inputElement.addEventListener('wheel', e => {
    			e.preventDefault();
    		});
    	});

    	const writable_props = ['placeholder', 'value', 'label', 'validIf'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NumberInput> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			inputElement = $$value;
    			$$invalidate(3, inputElement);
    		});
    	}

    	function input_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('validIf' in $$props) $$invalidate(7, validIf = $$props.validIf);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		placeholder,
    		value,
    		label,
    		id,
    		isValid,
    		validIf,
    		onKeyUp,
    		inputElement,
    		inputClasses
    	});

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('isValid' in $$props) $$invalidate(8, isValid = $$props.isValid);
    		if ('validIf' in $$props) $$invalidate(7, validIf = $$props.validIf);
    		if ('inputElement' in $$props) $$invalidate(3, inputElement = $$props.inputElement);
    		if ('inputClasses' in $$props) $$invalidate(4, inputClasses = $$props.inputClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isValid*/ 256) {
    			$$invalidate(4, inputClasses = isValid ? '' : 'invalid');
    		}
    	};

    	return [
    		value,
    		placeholder,
    		label,
    		inputElement,
    		inputClasses,
    		id,
    		onKeyUp,
    		validIf,
    		isValid,
    		input_binding,
    		input_input_handler
    	];
    }

    class NumberInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			placeholder: 1,
    			value: 0,
    			label: 2,
    			validIf: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NumberInput",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get placeholder() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get validIf() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set validIf(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Button.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1$1 } = globals;
    const file$6 = "src\\Components\\Button.svelte";

    // (25:2) {:else}
    function create_else_block$1(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text$1(/*text*/ ctx[0]);
    			attr_dev(div0, "class", "text svelte-lqqv5g");
    			add_location(div0, file$6, 27, 4, 696);
    			attr_dev(div1, "style", /*cssVarStyles*/ ctx[2]);
    			attr_dev(div1, "class", "button svelte-lqqv5g");
    			add_location(div1, file$6, 26, 2, 608);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);

    			if (dirty & /*cssVarStyles*/ 4) {
    				attr_dev(div1, "style", /*cssVarStyles*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(25:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (19:2) {#if disabled}
    function create_if_block$2(ctx) {
    	let div1;
    	let div0;
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text$1(/*text*/ ctx[0]);
    			attr_dev(div0, "class", "text svelte-lqqv5g");
    			add_location(div0, file$6, 21, 4, 549);
    			attr_dev(div1, "style", /*cssVarStyles*/ ctx[2]);
    			attr_dev(div1, "class", "button disabled svelte-lqqv5g");
    			add_location(div1, file$6, 20, 2, 491);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);

    			if (dirty & /*cssVarStyles*/ 4) {
    				attr_dev(div1, "style", /*cssVarStyles*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(19:2) {#if disabled}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*disabled*/ ctx[1]) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container svelte-lqqv5g");
    			add_location(div, file$6, 16, 0, 442);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let cssVarStyles;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, []);
    	const dispatch = createEventDispatcher();
    	let { text = 'button' } = $$props;
    	let { disabled = false } = $$props;
    	let { highlight = undefined } = $$props;
    	let styles = {};
    	const writable_props = ['text', 'disabled', 'highlight'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	const click_handler = e => {
    		dispatch('click', e);
    	};

    	$$self.$$set = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('disabled' in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ('highlight' in $$props) $$invalidate(4, highlight = $$props.highlight);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		text,
    		disabled,
    		highlight,
    		styles,
    		cssVarStyles
    	});

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('disabled' in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ('highlight' in $$props) $$invalidate(4, highlight = $$props.highlight);
    		if ('styles' in $$props) $$invalidate(5, styles = $$props.styles);
    		if ('cssVarStyles' in $$props) $$invalidate(2, cssVarStyles = $$props.cssVarStyles);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*highlight*/ 16) {
    			{
    				if (highlight !== undefined) {
    					$$invalidate(5, styles['background-color'] = highlight, styles);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*styles*/ 32) {
    			$$invalidate(2, cssVarStyles = Object.entries(styles).map(([key, value]) => `${key}:${value}`).join(';'));
    		}
    	};

    	return [text, disabled, cssVarStyles, dispatch, highlight, styles, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { text: 0, disabled: 1, highlight: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlight() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlight(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\NewMarkerPopup.svelte generated by Svelte v3.48.0 */
    const file$5 = "src\\Components\\NewMarkerPopup.svelte";

    function create_fragment$5(ctx) {
    	let div1;
    	let numberinput;
    	let updating_value;
    	let t0;
    	let textinput0;
    	let updating_value_1;
    	let t1;
    	let textinput1;
    	let updating_value_2;
    	let t2;
    	let div0;
    	let button0;
    	let t3;
    	let button1;
    	let current;

    	function numberinput_value_binding(value) {
    		/*numberinput_value_binding*/ ctx[7](value);
    	}

    	let numberinput_props = {
    		label: "A flat white costs",
    		placeholder: "1.23",
    		validIf: isValid.floatOverZero
    	};

    	if (/*newShopPrice*/ ctx[1] !== void 0) {
    		numberinput_props.value = /*newShopPrice*/ ctx[1];
    	}

    	numberinput = new NumberInput({ props: numberinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(numberinput, 'value', numberinput_value_binding));

    	function textinput0_value_binding(value) {
    		/*textinput0_value_binding*/ ctx[8](value);
    	}

    	let textinput0_props = {
    		label: "At",
    		placeholder: "shop name",
    		validIf: isValid.text
    	};

    	if (/*newShopName*/ ctx[0] !== void 0) {
    		textinput0_props.value = /*newShopName*/ ctx[0];
    	}

    	textinput0 = new TextInput({ props: textinput0_props, $$inline: true });
    	binding_callbacks.push(() => bind(textinput0, 'value', textinput0_value_binding));

    	function textinput1_value_binding(value) {
    		/*textinput1_value_binding*/ ctx[9](value);
    	}

    	let textinput1_props = {
    		label: "Notes?",
    		placeholder: "A nice coffee shop"
    	};

    	if (/*newShopDesc*/ ctx[2] !== void 0) {
    		textinput1_props.value = /*newShopDesc*/ ctx[2];
    	}

    	textinput1 = new TextInput({ props: textinput1_props, $$inline: true });
    	binding_callbacks.push(() => bind(textinput1, 'value', textinput1_value_binding));

    	button0 = new Button({
    			props: {
    				text: "add",
    				disabled: !/*canSubmit*/ ctx[5]
    			},
    			$$inline: true
    		});

    	button0.$on("click", function () {
    		if (is_function(/*add*/ ctx[3])) /*add*/ ctx[3].apply(this, arguments);
    	});

    	button1 = new Button({
    			props: { text: "cancel" },
    			$$inline: true
    		});

    	button1.$on("click", function () {
    		if (is_function(/*cancel*/ ctx[4])) /*cancel*/ ctx[4].apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(numberinput.$$.fragment);
    			t0 = space();
    			create_component(textinput0.$$.fragment);
    			t1 = space();
    			create_component(textinput1.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			create_component(button0.$$.fragment);
    			t3 = space();
    			create_component(button1.$$.fragment);
    			attr_dev(div0, "class", "buttons svelte-1msqfqr");
    			add_location(div0, file$5, 48, 2, 1338);
    			attr_dev(div1, "class", "new-marker-prompt-container svelte-1msqfqr");
    			add_location(div1, file$5, 33, 0, 939);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(numberinput, div1, null);
    			append_dev(div1, t0);
    			mount_component(textinput0, div1, null);
    			append_dev(div1, t1);
    			mount_component(textinput1, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			mount_component(button0, div0, null);
    			append_dev(div0, t3);
    			mount_component(button1, div0, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			const numberinput_changes = {};

    			if (!updating_value && dirty & /*newShopPrice*/ 2) {
    				updating_value = true;
    				numberinput_changes.value = /*newShopPrice*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			numberinput.$set(numberinput_changes);
    			const textinput0_changes = {};

    			if (!updating_value_1 && dirty & /*newShopName*/ 1) {
    				updating_value_1 = true;
    				textinput0_changes.value = /*newShopName*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			textinput0.$set(textinput0_changes);
    			const textinput1_changes = {};

    			if (!updating_value_2 && dirty & /*newShopDesc*/ 4) {
    				updating_value_2 = true;
    				textinput1_changes.value = /*newShopDesc*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			textinput1.$set(textinput1_changes);
    			const button0_changes = {};
    			if (dirty & /*canSubmit*/ 32) button0_changes.disabled = !/*canSubmit*/ ctx[5];
    			button0.$set(button0_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(numberinput.$$.fragment, local);
    			transition_in(textinput0.$$.fragment, local);
    			transition_in(textinput1.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(numberinput.$$.fragment, local);
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(numberinput);
    			destroy_component(textinput0);
    			destroy_component(textinput1);
    			destroy_component(button0);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let canSubmit;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NewMarkerPopup', slots, []);
    	let { newShopName = '' } = $$props;
    	let { newShopDesc = '' } = $$props;
    	let { newShopPrice = '' } = $$props;
    	let { add } = $$props;
    	let { cancel } = $$props;

    	const clearFields = () => {
    		$$invalidate(0, newShopName = '');
    		$$invalidate(2, newShopDesc = '');
    		$$invalidate(1, newShopPrice = '');
    	};

    	const onKeyDown = e => {
    		if (e.key === 'Escape') {
    			cancel(e);
    		}

    		if (e.key === 'Enter') {
    			canSubmit && add(e);
    		}
    	};

    	onMount(() => {
    		document.addEventListener('keydown', onKeyDown);
    	});

    	const writable_props = ['newShopName', 'newShopDesc', 'newShopPrice', 'add', 'cancel'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NewMarkerPopup> was created with unknown prop '${key}'`);
    	});

    	function numberinput_value_binding(value) {
    		newShopPrice = value;
    		$$invalidate(1, newShopPrice);
    	}

    	function textinput0_value_binding(value) {
    		newShopName = value;
    		$$invalidate(0, newShopName);
    	}

    	function textinput1_value_binding(value) {
    		newShopDesc = value;
    		$$invalidate(2, newShopDesc);
    	}

    	$$self.$$set = $$props => {
    		if ('newShopName' in $$props) $$invalidate(0, newShopName = $$props.newShopName);
    		if ('newShopDesc' in $$props) $$invalidate(2, newShopDesc = $$props.newShopDesc);
    		if ('newShopPrice' in $$props) $$invalidate(1, newShopPrice = $$props.newShopPrice);
    		if ('add' in $$props) $$invalidate(3, add = $$props.add);
    		if ('cancel' in $$props) $$invalidate(4, cancel = $$props.cancel);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		isValid,
    		TextInput,
    		NumberInput,
    		Button,
    		newShopName,
    		newShopDesc,
    		newShopPrice,
    		add,
    		cancel,
    		clearFields,
    		onKeyDown,
    		canSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ('newShopName' in $$props) $$invalidate(0, newShopName = $$props.newShopName);
    		if ('newShopDesc' in $$props) $$invalidate(2, newShopDesc = $$props.newShopDesc);
    		if ('newShopPrice' in $$props) $$invalidate(1, newShopPrice = $$props.newShopPrice);
    		if ('add' in $$props) $$invalidate(3, add = $$props.add);
    		if ('cancel' in $$props) $$invalidate(4, cancel = $$props.cancel);
    		if ('canSubmit' in $$props) $$invalidate(5, canSubmit = $$props.canSubmit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*newShopName, newShopPrice*/ 3) {
    			/**
     * This form must have a name and a price more than 0 to be added
     */
    			$$invalidate(5, canSubmit = isValid.text(newShopName) && isValid.floatOverZero(parseFloat(newShopPrice !== null ? newShopPrice.toString() : '0')));
    		}
    	};

    	return [
    		newShopName,
    		newShopPrice,
    		newShopDesc,
    		add,
    		cancel,
    		canSubmit,
    		clearFields,
    		numberinput_value_binding,
    		textinput0_value_binding,
    		textinput1_value_binding
    	];
    }

    class NewMarkerPopup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			newShopName: 0,
    			newShopDesc: 2,
    			newShopPrice: 1,
    			add: 3,
    			cancel: 4,
    			clearFields: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewMarkerPopup",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*add*/ ctx[3] === undefined && !('add' in props)) {
    			console.warn("<NewMarkerPopup> was created without expected prop 'add'");
    		}

    		if (/*cancel*/ ctx[4] === undefined && !('cancel' in props)) {
    			console.warn("<NewMarkerPopup> was created without expected prop 'cancel'");
    		}
    	}

    	get newShopName() {
    		throw new Error("<NewMarkerPopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set newShopName(value) {
    		throw new Error("<NewMarkerPopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get newShopDesc() {
    		throw new Error("<NewMarkerPopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set newShopDesc(value) {
    		throw new Error("<NewMarkerPopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get newShopPrice() {
    		throw new Error("<NewMarkerPopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set newShopPrice(value) {
    		throw new Error("<NewMarkerPopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<NewMarkerPopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<NewMarkerPopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cancel() {
    		throw new Error("<NewMarkerPopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cancel(value) {
    		throw new Error("<NewMarkerPopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearFields() {
    		return this.$$.ctx[6];
    	}

    	set clearFields(value) {
    		throw new Error("<NewMarkerPopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\HomeLocationListItem.svelte generated by Svelte v3.48.0 */
    const file$4 = "src\\Components\\HomeLocationListItem.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2_value = /*$HomeLocation*/ ctx[0].lat.toFixed(4) + "";
    	let t2;
    	let t3;
    	let t4_value = /*$HomeLocation*/ ctx[0].lng.toFixed(4) + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Home Location";
    			t1 = space();
    			div1 = element("div");
    			t2 = text$1(t2_value);
    			t3 = text$1(", ");
    			t4 = text$1(t4_value);
    			attr_dev(div0, "class", "title svelte-1oagpos");
    			add_location(div0, file$4, 4, 2, 114);
    			attr_dev(div1, "class", "latlng svelte-1oagpos");
    			add_location(div1, file$4, 7, 2, 166);
    			attr_dev(div2, "class", "container svelte-1oagpos");
    			add_location(div2, file$4, 3, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$HomeLocation*/ 1 && t2_value !== (t2_value = /*$HomeLocation*/ ctx[0].lat.toFixed(4) + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$HomeLocation*/ 1 && t4_value !== (t4_value = /*$HomeLocation*/ ctx[0].lng.toFixed(4) + "")) set_data_dev(t4, t4_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $HomeLocation;
    	validate_store(HomeLocation, 'HomeLocation');
    	component_subscribe($$self, HomeLocation, $$value => $$invalidate(0, $HomeLocation = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HomeLocationListItem', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HomeLocationListItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ HomeLocation, $HomeLocation });
    	return [$HomeLocation];
    }

    class HomeLocationListItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HomeLocationListItem",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Components\ShopInfo.svelte generated by Svelte v3.48.0 */
    const file$3 = "src\\Components\\ShopInfo.svelte";

    // (53:0) {#if shop !== undefined}
    function create_if_block$1(ctx) {
    	let div1;
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let div0;
    	let current_block_type_index_1;
    	let if_block1;
    	let t1;
    	let button0;
    	let t2;
    	let button1;
    	let current;
    	const if_block_creators = [create_if_block_2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*editing*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block_1, create_else_block];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*editing*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	button0 = new Button({ props: { text: "Nav" }, $$inline: true });
    	button0.$on("click", /*navigateButtonClicked*/ ctx[6]);

    	button1 = new Button({
    			props: {
    				highlight: /*deletePendingConfirm*/ ctx[2] ? '#ce6688' : 'white',
    				text: /*deletePendingConfirm*/ ctx[2] ? 'confirm' : 'delete'
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*deleteButtonClicked*/ ctx[5]);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			if_block1.c();
    			t1 = space();
    			create_component(button0.$$.fragment);
    			t2 = space();
    			create_component(button1.$$.fragment);
    			attr_dev(div0, "class", "buttons svelte-4u5bf7");
    			add_location(div0, file$3, 69, 2, 2432);
    			attr_dev(div1, "class", "container wireframe svelte-4u5bf7");
    			add_location(div1, file$3, 53, 0, 1673);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			if_blocks_1[current_block_type_index_1].m(div0, null);
    			append_dev(div0, t1);
    			mount_component(button0, div0, null);
    			append_dev(div0, t2);
    			mount_component(button1, div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div1, t0);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks_1[current_block_type_index_1];

    				if (!if_block1) {
    					if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div0, t1);
    			}

    			const button1_changes = {};
    			if (dirty & /*deletePendingConfirm*/ 4) button1_changes.highlight = /*deletePendingConfirm*/ ctx[2] ? '#ce6688' : 'white';
    			if (dirty & /*deletePendingConfirm*/ 4) button1_changes.text = /*deletePendingConfirm*/ ctx[2] ? 'confirm' : 'delete';
    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    			if_blocks_1[current_block_type_index_1].d();
    			destroy_component(button0);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(53:0) {#if shop !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (61:2) {:else}
    function create_else_block_1(ctx) {
    	let div0;
    	let t0_value = /*shop*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*shop*/ ctx[0].location.lat.toFixed(4) + "";
    	let t2;
    	let t3;
    	let t4_value = /*shop*/ ctx[0].location.lng.toFixed(4) + "";
    	let t4;
    	let t5;
    	let t6;
    	let div2;
    	let t7;
    	let t8_value = /*shop*/ ctx[0].price.toFixed(2) + "";
    	let t8;
    	let if_block = /*shop*/ ctx[0].description && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text$1(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text$1(t2_value);
    			t3 = text$1(", ");
    			t4 = text$1(t4_value);
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			div2 = element("div");
    			t7 = text$1("£");
    			t8 = text$1(t8_value);
    			attr_dev(div0, "class", "title-text");
    			add_location(div0, file$3, 61, 4, 2124);
    			attr_dev(div1, "class", "small-text");
    			add_location(div1, file$3, 62, 4, 2171);
    			attr_dev(div2, "class", "price-text");
    			add_location(div2, file$3, 66, 4, 2363);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t7);
    			append_dev(div2, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*shop*/ 1 && t0_value !== (t0_value = /*shop*/ ctx[0].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*shop*/ 1 && t2_value !== (t2_value = /*shop*/ ctx[0].location.lat.toFixed(4) + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*shop*/ 1 && t4_value !== (t4_value = /*shop*/ ctx[0].location.lng.toFixed(4) + "")) set_data_dev(t4, t4_value);

    			if (/*shop*/ ctx[0].description) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(t6.parentNode, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*shop*/ 1 && t8_value !== (t8_value = /*shop*/ ctx[0].price.toFixed(2) + "")) set_data_dev(t8, t8_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(61:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (56:2) {#if editing}
    function create_if_block_2(ctx) {
    	let textinput0;
    	let updating_value;
    	let t0;
    	let div;
    	let t1_value = /*shop*/ ctx[0].location.lat.toFixed(4) + "";
    	let t1;
    	let t2;
    	let t3_value = /*shop*/ ctx[0].location.lng.toFixed(4) + "";
    	let t3;
    	let t4;
    	let textinput1;
    	let updating_value_1;
    	let t5;
    	let numberinput;
    	let updating_value_2;
    	let current;

    	function textinput0_value_binding(value) {
    		/*textinput0_value_binding*/ ctx[7](value);
    	}

    	let textinput0_props = {
    		placeholder: /*shop*/ ctx[0].name ?? 'shop name'
    	};

    	if (/*shop*/ ctx[0].name !== void 0) {
    		textinput0_props.value = /*shop*/ ctx[0].name;
    	}

    	textinput0 = new TextInput({ props: textinput0_props, $$inline: true });
    	binding_callbacks.push(() => bind(textinput0, 'value', textinput0_value_binding));

    	function textinput1_value_binding(value) {
    		/*textinput1_value_binding*/ ctx[8](value);
    	}

    	let textinput1_props = {
    		placeholder: /*shop*/ ctx[0].description.length
    		? /*shop*/ ctx[0].description
    		: 'description'
    	};

    	if (/*shop*/ ctx[0].description !== void 0) {
    		textinput1_props.value = /*shop*/ ctx[0].description;
    	}

    	textinput1 = new TextInput({ props: textinput1_props, $$inline: true });
    	binding_callbacks.push(() => bind(textinput1, 'value', textinput1_value_binding));

    	function numberinput_value_binding(value) {
    		/*numberinput_value_binding*/ ctx[9](value);
    	}

    	let numberinput_props = {
    		placeholder: `£${/*shop*/ ctx[0].price ?? 0}`
    	};

    	if (/*shop*/ ctx[0].price !== void 0) {
    		numberinput_props.value = /*shop*/ ctx[0].price;
    	}

    	numberinput = new NumberInput({ props: numberinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(numberinput, 'value', numberinput_value_binding));

    	const block = {
    		c: function create() {
    			create_component(textinput0.$$.fragment);
    			t0 = space();
    			div = element("div");
    			t1 = text$1(t1_value);
    			t2 = text$1(", ");
    			t3 = text$1(t3_value);
    			t4 = space();
    			create_component(textinput1.$$.fragment);
    			t5 = space();
    			create_component(numberinput.$$.fragment);
    			attr_dev(div, "class", "small-text");
    			add_location(div, file$3, 57, 4, 1812);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textinput0, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			insert_dev(target, t4, anchor);
    			mount_component(textinput1, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(numberinput, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textinput0_changes = {};
    			if (dirty & /*shop*/ 1) textinput0_changes.placeholder = /*shop*/ ctx[0].name ?? 'shop name';

    			if (!updating_value && dirty & /*shop*/ 1) {
    				updating_value = true;
    				textinput0_changes.value = /*shop*/ ctx[0].name;
    				add_flush_callback(() => updating_value = false);
    			}

    			textinput0.$set(textinput0_changes);
    			if ((!current || dirty & /*shop*/ 1) && t1_value !== (t1_value = /*shop*/ ctx[0].location.lat.toFixed(4) + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*shop*/ 1) && t3_value !== (t3_value = /*shop*/ ctx[0].location.lng.toFixed(4) + "")) set_data_dev(t3, t3_value);
    			const textinput1_changes = {};

    			if (dirty & /*shop*/ 1) textinput1_changes.placeholder = /*shop*/ ctx[0].description.length
    			? /*shop*/ ctx[0].description
    			: 'description';

    			if (!updating_value_1 && dirty & /*shop*/ 1) {
    				updating_value_1 = true;
    				textinput1_changes.value = /*shop*/ ctx[0].description;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			textinput1.$set(textinput1_changes);
    			const numberinput_changes = {};
    			if (dirty & /*shop*/ 1) numberinput_changes.placeholder = `£${/*shop*/ ctx[0].price ?? 0}`;

    			if (!updating_value_2 && dirty & /*shop*/ 1) {
    				updating_value_2 = true;
    				numberinput_changes.value = /*shop*/ ctx[0].price;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			numberinput.$set(numberinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput0.$$.fragment, local);
    			transition_in(textinput1.$$.fragment, local);
    			transition_in(numberinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(numberinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textinput0, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t4);
    			destroy_component(textinput1, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(numberinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(56:2) {#if editing}",
    		ctx
    	});

    	return block;
    }

    // (64:4) {#if shop.description}
    function create_if_block_3(ctx) {
    	let div;
    	let t_value = /*shop*/ ctx[0].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text$1(t_value);
    			attr_dev(div, "class", "desc-text");
    			add_location(div, file$3, 64, 6, 2299);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*shop*/ 1 && t_value !== (t_value = /*shop*/ ctx[0].description + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(64:4) {#if shop.description}",
    		ctx
    	});

    	return block;
    }

    // (74:4) {:else}
    function create_else_block(ctx) {
    	let button;
    	let current;
    	button = new Button({ props: { text: "edit" }, $$inline: true });
    	button.$on("click", /*editButtonClicked*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(74:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (72:4) {#if editing}
    function create_if_block_1(ctx) {
    	let button;
    	let current;
    	button = new Button({ props: { text: "save" }, $$inline: true });
    	button.$on("click", /*saveButtonClicked*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(72:4) {#if editing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*shop*/ ctx[0] !== undefined && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*shop*/ ctx[0] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*shop*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $ShopStore;
    	validate_store(ShopStore, 'ShopStore');
    	component_subscribe($$self, ShopStore, $$value => $$invalidate(10, $ShopStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ShopInfo', slots, []);
    	let { shop } = $$props;
    	const dispatch = createEventDispatcher();
    	let editing = false;
    	let deletePendingConfirm = false;

    	const setInitialDeleteState = () => {
    		// the shop has changed, set pending confirm false
    		toggleDeletePendingConfirm(false);
    	};

    	const toggleEditing = newState => {
    		$$invalidate(1, editing = newState !== undefined ? newState : !editing);
    	};

    	const toggleDeletePendingConfirm = newState => {
    		$$invalidate(2, deletePendingConfirm = newState !== undefined
    		? newState
    		: !deletePendingConfirm);
    	};

    	const editButtonClicked = () => {
    		toggleEditing(); // Turn on editing
    	};

    	const saveButtonClicked = () => {
    		dispatch('shopUpdated', shop); // Dispatch an event so parents know a shop was updated
    		toggleEditing(); // Turn off editing
    	};

    	const deleteButtonClicked = () => {
    		if (!deletePendingConfirm) {
    			toggleDeletePendingConfirm(true);
    			return;
    		}

    		const allOtherShops = $ShopStore.filter(thisShop => !(thisShop === shop));
    		ShopStore.set(allOtherShops);
    		toggleDeletePendingConfirm(false);
    		$$invalidate(0, shop = undefined);
    	};

    	const navigateButtonClicked = () => {
    		dispatch('navigateToShop', shop);
    	};

    	const writable_props = ['shop'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ShopInfo> was created with unknown prop '${key}'`);
    	});

    	function textinput0_value_binding(value) {
    		if ($$self.$$.not_equal(shop.name, value)) {
    			shop.name = value;
    			$$invalidate(0, shop);
    		}
    	}

    	function textinput1_value_binding(value) {
    		if ($$self.$$.not_equal(shop.description, value)) {
    			shop.description = value;
    			$$invalidate(0, shop);
    		}
    	}

    	function numberinput_value_binding(value) {
    		if ($$self.$$.not_equal(shop.price, value)) {
    			shop.price = value;
    			$$invalidate(0, shop);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('shop' in $$props) $$invalidate(0, shop = $$props.shop);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ShopStore,
    		Button,
    		NumberInput,
    		TextInput,
    		shop,
    		dispatch,
    		editing,
    		deletePendingConfirm,
    		setInitialDeleteState,
    		toggleEditing,
    		toggleDeletePendingConfirm,
    		editButtonClicked,
    		saveButtonClicked,
    		deleteButtonClicked,
    		navigateButtonClicked,
    		$ShopStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('shop' in $$props) $$invalidate(0, shop = $$props.shop);
    		if ('editing' in $$props) $$invalidate(1, editing = $$props.editing);
    		if ('deletePendingConfirm' in $$props) $$invalidate(2, deletePendingConfirm = $$props.deletePendingConfirm);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*shop*/ 1) {
    			// if the shop becomes undefined, set editing false
    			{
    				if (shop === undefined) {
    					toggleEditing(false);
    					toggleDeletePendingConfirm(false);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*shop*/ 1) {
    			{
    				setInitialDeleteState();
    			}
    		}
    	};

    	return [
    		shop,
    		editing,
    		deletePendingConfirm,
    		editButtonClicked,
    		saveButtonClicked,
    		deleteButtonClicked,
    		navigateButtonClicked,
    		textinput0_value_binding,
    		textinput1_value_binding,
    		numberinput_value_binding
    	];
    }

    class ShopInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { shop: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShopInfo",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*shop*/ ctx[0] === undefined && !('shop' in props)) {
    			console.warn("<ShopInfo> was created without expected prop 'shop'");
    		}
    	}

    	get shop() {
    		throw new Error("<ShopInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shop(value) {
    		throw new Error("<ShopInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * A helper class for parsing GeoJSON data.
     */
    class GJ {
        constructor(json) {
            this.json = json;
        }
        getFeatures() {
            var _a;
            return (_a = this.json["features"]) !== null && _a !== void 0 ? _a : [];
        }
        /**
         * Return segments from all features
         */
        getAllSegments() {
            const collectedSegments = [];
            this.getFeatures().forEach((feature) => {
                var _a;
                if (feature.properties && feature.properties.segments) {
                    collectedSegments.push(...((_a = feature.properties.segments) !== null && _a !== void 0 ? _a : []));
                }
            });
            return collectedSegments;
        }
        // Return all steps from all segments
        getAllSteps() {
            const collectedSteps = [];
            this.getAllSegments().forEach(segment => {
                var _a;
                collectedSteps.push(...((_a = segment.steps) !== null && _a !== void 0 ? _a : []));
            });
            return collectedSteps;
        }
    }

    /* src\Components\TextDirections.svelte generated by Svelte v3.48.0 */
    const file$2 = "src\\Components\\TextDirections.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (21:2) {#each directionSteps as directionStep}
    function create_each_block(ctx) {
    	let div2;
    	let div0;
    	let t0_value = /*directionStep*/ ctx[5].instruction + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*directionStep*/ ctx[5].name + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text$1(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text$1(t2_value);
    			t3 = space();
    			add_location(div0, file$2, 22, 6, 702);
    			attr_dev(div1, "class", "small-text");
    			add_location(div1, file$2, 23, 6, 748);
    			attr_dev(div2, "class", "step-container svelte-zekzf4");
    			add_location(div2, file$2, 21, 4, 666);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div2, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*directionSteps*/ 1 && t0_value !== (t0_value = /*directionStep*/ ctx[5].instruction + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*directionSteps*/ 1 && t2_value !== (t2_value = /*directionStep*/ ctx[5].name + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(21:2) {#each directionSteps as directionStep}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let button;
    	let t;
    	let current;
    	button = new Button({ props: { text: "close" }, $$inline: true });
    	button.$on("click", /*click_handler*/ ctx[3]);
    	let each_value = /*directionSteps*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(button.$$.fragment);
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "button svelte-zekzf4");
    			add_location(div0, file$2, 16, 4, 508);
    			attr_dev(div1, "class", "button-container svelte-zekzf4");
    			add_location(div1, file$2, 15, 2, 472);
    			attr_dev(div2, "class", "container svelte-zekzf4");
    			add_location(div2, file$2, 14, 0, 445);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(button, div0, null);
    			append_dev(div2, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*directionSteps*/ 1) {
    				each_value = /*directionSteps*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(button);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextDirections', slots, []);
    	const dispatch = createEventDispatcher();
    	let { directions } = $$props;

    	const getDirectionSteps = inputDirections => {
    		const GeoJson = new GJ(inputDirections);
    		return GeoJson.getAllSteps();
    	};

    	let directionSteps = [];
    	const writable_props = ['directions'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextDirections> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		dispatch('close');
    	};

    	$$self.$$set = $$props => {
    		if ('directions' in $$props) $$invalidate(2, directions = $$props.directions);
    	};

    	$$self.$capture_state = () => ({
    		GJ,
    		Button,
    		createEventDispatcher,
    		dispatch,
    		directions,
    		getDirectionSteps,
    		directionSteps
    	});

    	$$self.$inject_state = $$props => {
    		if ('directions' in $$props) $$invalidate(2, directions = $$props.directions);
    		if ('directionSteps' in $$props) $$invalidate(0, directionSteps = $$props.directionSteps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*directions*/ 4) {
    			$$invalidate(0, directionSteps = getDirectionSteps(directions));
    		}
    	};

    	return [directionSteps, dispatch, directions, click_handler];
    }

    class TextDirections extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { directions: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextDirections",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*directions*/ ctx[2] === undefined && !('directions' in props)) {
    			console.warn("<TextDirections> was created without expected prop 'directions'");
    		}
    	}

    	get directions() {
    		throw new Error("<TextDirections>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set directions(value) {
    		throw new Error("<TextDirections>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\SplashInfo.svelte generated by Svelte v3.48.0 */
    const file$1 = "src\\Components\\SplashInfo.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let ul;
    	let li0;
    	let t3;
    	let li1;
    	let t5;
    	let li2;
    	let t7;
    	let div1;
    	let button;
    	let current;

    	button = new Button({
    			props: { text: "Got it" },
    			$$inline: true
    		});

    	button.$on("click", /*click_handler*/ ctx[1]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Coffee-near-me";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Click on the map to add new shops.";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Click the marker or the item on the list to edit.";
    			t5 = space();
    			li2 = element("li");
    			li2.textContent = "Long-press on anywhere on the map to set your current location.";
    			t7 = space();
    			div1 = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div0, "class", "title-text");
    			add_location(div0, file$1, 6, 2, 199);
    			add_location(li0, file$1, 8, 4, 270);
    			add_location(li1, file$1, 9, 4, 319);
    			add_location(li2, file$1, 10, 4, 383);
    			attr_dev(ul, "class", "list svelte-1b0x8lx");
    			add_location(ul, file$1, 7, 2, 247);
    			attr_dev(div1, "class", "buttons");
    			add_location(div1, file$1, 12, 2, 468);
    			attr_dev(div2, "class", "container wireframe svelte-1b0x8lx");
    			add_location(div2, file$1, 5, 0, 162);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			mount_component(button, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SplashInfo', slots, []);
    	const dispatch = createEventDispatcher();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SplashInfo> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		dispatch('close');
    	};

    	$$self.$capture_state = () => ({ createEventDispatcher, Button, dispatch });
    	return [dispatch, click_handler];
    }

    class SplashInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SplashInfo",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    // store like
    /**
     * {
     *  "lat,lng": {
     *    "stored": 12343425412,
     *    "json": {oprseresponse}
     *  }
     * }
     */
    const MemoisedDirections = writable({});

    /* src\App.svelte generated by Svelte v3.48.0 */

    const { Error: Error_1, Object: Object_1 } = globals;
    const file = "src\\App.svelte";

    // (250:2) <TransparentOverlay visible={newMarkerOverlayVisible}>
    function create_default_slot_1(ctx) {
    	let newmarkerpopup;
    	let updating_newShopName;
    	let updating_newShopDesc;
    	let updating_newShopPrice;
    	let current;

    	function newmarkerpopup_newShopName_binding(value) {
    		/*newmarkerpopup_newShopName_binding*/ ctx[20](value);
    	}

    	function newmarkerpopup_newShopDesc_binding(value) {
    		/*newmarkerpopup_newShopDesc_binding*/ ctx[21](value);
    	}

    	function newmarkerpopup_newShopPrice_binding(value) {
    		/*newmarkerpopup_newShopPrice_binding*/ ctx[22](value);
    	}

    	let newmarkerpopup_props = {
    		add: /*addClicked*/ ctx[13],
    		cancel: /*cancelClicked*/ ctx[14]
    	};

    	if (/*newShopName*/ ctx[4] !== void 0) {
    		newmarkerpopup_props.newShopName = /*newShopName*/ ctx[4];
    	}

    	if (/*newShopDesc*/ ctx[5] !== void 0) {
    		newmarkerpopup_props.newShopDesc = /*newShopDesc*/ ctx[5];
    	}

    	if (/*newShopPrice*/ ctx[6] !== void 0) {
    		newmarkerpopup_props.newShopPrice = /*newShopPrice*/ ctx[6];
    	}

    	newmarkerpopup = new NewMarkerPopup({
    			props: newmarkerpopup_props,
    			$$inline: true
    		});

    	/*newmarkerpopup_binding*/ ctx[19](newmarkerpopup);
    	binding_callbacks.push(() => bind(newmarkerpopup, 'newShopName', newmarkerpopup_newShopName_binding));
    	binding_callbacks.push(() => bind(newmarkerpopup, 'newShopDesc', newmarkerpopup_newShopDesc_binding));
    	binding_callbacks.push(() => bind(newmarkerpopup, 'newShopPrice', newmarkerpopup_newShopPrice_binding));

    	const block = {
    		c: function create() {
    			create_component(newmarkerpopup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(newmarkerpopup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const newmarkerpopup_changes = {};

    			if (!updating_newShopName && dirty[0] & /*newShopName*/ 16) {
    				updating_newShopName = true;
    				newmarkerpopup_changes.newShopName = /*newShopName*/ ctx[4];
    				add_flush_callback(() => updating_newShopName = false);
    			}

    			if (!updating_newShopDesc && dirty[0] & /*newShopDesc*/ 32) {
    				updating_newShopDesc = true;
    				newmarkerpopup_changes.newShopDesc = /*newShopDesc*/ ctx[5];
    				add_flush_callback(() => updating_newShopDesc = false);
    			}

    			if (!updating_newShopPrice && dirty[0] & /*newShopPrice*/ 64) {
    				updating_newShopPrice = true;
    				newmarkerpopup_changes.newShopPrice = /*newShopPrice*/ ctx[6];
    				add_flush_callback(() => updating_newShopPrice = false);
    			}

    			newmarkerpopup.$set(newmarkerpopup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(newmarkerpopup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(newmarkerpopup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*newmarkerpopup_binding*/ ctx[19](null);
    			destroy_component(newmarkerpopup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(250:2) <TransparentOverlay visible={newMarkerOverlayVisible}>",
    		ctx
    	});

    	return block;
    }

    // (261:2) <TransparentOverlay visible={splashOverlayVisible}>
    function create_default_slot(ctx) {
    	let splashinfo;
    	let current;
    	splashinfo = new SplashInfo({ $$inline: true });
    	splashinfo.$on("close", /*close_handler*/ ctx[23]);

    	const block = {
    		c: function create() {
    			create_component(splashinfo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(splashinfo, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(splashinfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(splashinfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(splashinfo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(261:2) <TransparentOverlay visible={splashOverlayVisible}>",
    		ctx
    	});

    	return block;
    }

    // (290:4) {#if directionsOpen && directions}
    function create_if_block(ctx) {
    	let textdirections;
    	let current;

    	textdirections = new TextDirections({
    			props: { directions: /*directions*/ ctx[8] },
    			$$inline: true
    		});

    	textdirections.$on("close", /*close_handler_1*/ ctx[25]);

    	const block = {
    		c: function create() {
    			create_component(textdirections.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textdirections, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textdirections_changes = {};
    			if (dirty[0] & /*directions*/ 256) textdirections_changes.directions = /*directions*/ ctx[8];
    			textdirections.$set(textdirections_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textdirections.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textdirections.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textdirections, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(290:4) {#if directionsOpen && directions}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let transparentoverlay0;
    	let t0;
    	let transparentoverlay1;
    	let t1;
    	let div1;
    	let homelocationlistitem;
    	let t2;
    	let div0;
    	let list;
    	let t3;
    	let shopinfo;
    	let t4;
    	let div2;
    	let leafletmap;
    	let t5;
    	let current;

    	transparentoverlay0 = new TransparentOverlay({
    			props: {
    				visible: /*newMarkerOverlayVisible*/ ctx[2],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	transparentoverlay1 = new TransparentOverlay({
    			props: {
    				visible: /*splashOverlayVisible*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	homelocationlistitem = new HomeLocationListItem({ $$inline: true });

    	list = new List({
    			props: { shops: /*$ShopStore*/ ctx[10] },
    			$$inline: true
    		});

    	list.$on("shopClick", /*itemClicked*/ ctx[16]);

    	shopinfo = new ShopInfo({
    			props: { shop: /*selectedShop*/ ctx[7] },
    			$$inline: true
    		});

    	shopinfo.$on("shopUpdated", /*onShopUpdated*/ ctx[17]);
    	shopinfo.$on("navigateToShop", /*onNavigate*/ ctx[18]);
    	let leafletmap_props = {};
    	leafletmap = new LeafletMap({ props: leafletmap_props, $$inline: true });
    	/*leafletmap_binding*/ ctx[24](leafletmap);
    	leafletmap.$on("mapClick", /*mapClicked*/ ctx[12]);
    	leafletmap.$on("mapLongPress", /*mapLongPress*/ ctx[11]);
    	leafletmap.$on("markerClick", /*markerClicked*/ ctx[15]);
    	let if_block = /*directionsOpen*/ ctx[9] && /*directions*/ ctx[8] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(transparentoverlay0.$$.fragment);
    			t0 = space();
    			create_component(transparentoverlay1.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(homelocationlistitem.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			create_component(list.$$.fragment);
    			t3 = space();
    			create_component(shopinfo.$$.fragment);
    			t4 = space();
    			div2 = element("div");
    			create_component(leafletmap.$$.fragment);
    			t5 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "list-container svelte-bu5kqh");
    			add_location(div0, file, 270, 4, 8882);
    			attr_dev(div1, "class", "left svelte-bu5kqh");
    			add_location(div1, file, 268, 2, 8830);
    			attr_dev(div2, "class", "right svelte-bu5kqh");
    			add_location(div2, file, 281, 2, 9117);
    			attr_dev(main, "class", "svelte-bu5kqh");
    			add_location(main, file, 248, 0, 8381);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(transparentoverlay0, main, null);
    			append_dev(main, t0);
    			mount_component(transparentoverlay1, main, null);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			mount_component(homelocationlistitem, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			mount_component(list, div0, null);
    			append_dev(div1, t3);
    			mount_component(shopinfo, div1, null);
    			append_dev(main, t4);
    			append_dev(main, div2);
    			mount_component(leafletmap, div2, null);
    			append_dev(div2, t5);
    			if (if_block) if_block.m(div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const transparentoverlay0_changes = {};
    			if (dirty[0] & /*newMarkerOverlayVisible*/ 4) transparentoverlay0_changes.visible = /*newMarkerOverlayVisible*/ ctx[2];

    			if (dirty[0] & /*newMarkerPopup, newShopName, newShopDesc, newShopPrice*/ 120 | dirty[1] & /*$$scope*/ 1024) {
    				transparentoverlay0_changes.$$scope = { dirty, ctx };
    			}

    			transparentoverlay0.$set(transparentoverlay0_changes);
    			const transparentoverlay1_changes = {};
    			if (dirty[0] & /*splashOverlayVisible*/ 2) transparentoverlay1_changes.visible = /*splashOverlayVisible*/ ctx[1];

    			if (dirty[1] & /*$$scope*/ 1024) {
    				transparentoverlay1_changes.$$scope = { dirty, ctx };
    			}

    			transparentoverlay1.$set(transparentoverlay1_changes);
    			const list_changes = {};
    			if (dirty[0] & /*$ShopStore*/ 1024) list_changes.shops = /*$ShopStore*/ ctx[10];
    			list.$set(list_changes);
    			const shopinfo_changes = {};
    			if (dirty[0] & /*selectedShop*/ 128) shopinfo_changes.shop = /*selectedShop*/ ctx[7];
    			shopinfo.$set(shopinfo_changes);
    			const leafletmap_changes = {};
    			leafletmap.$set(leafletmap_changes);

    			if (/*directionsOpen*/ ctx[9] && /*directions*/ ctx[8]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*directionsOpen, directions*/ 768) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(transparentoverlay0.$$.fragment, local);
    			transition_in(transparentoverlay1.$$.fragment, local);
    			transition_in(homelocationlistitem.$$.fragment, local);
    			transition_in(list.$$.fragment, local);
    			transition_in(shopinfo.$$.fragment, local);
    			transition_in(leafletmap.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(transparentoverlay0.$$.fragment, local);
    			transition_out(transparentoverlay1.$$.fragment, local);
    			transition_out(homelocationlistitem.$$.fragment, local);
    			transition_out(list.$$.fragment, local);
    			transition_out(shopinfo.$$.fragment, local);
    			transition_out(leafletmap.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(transparentoverlay0);
    			destroy_component(transparentoverlay1);
    			destroy_component(homelocationlistitem);
    			destroy_component(list);
    			destroy_component(shopinfo);
    			/*leafletmap_binding*/ ctx[24](null);
    			destroy_component(leafletmap);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const debounceSaveTimeout = 2500;

    function instance($$self, $$props, $$invalidate) {
    	let $HomeLocation;
    	let $MemoisedDirections;
    	let $ShopStore;
    	validate_store(HomeLocation, 'HomeLocation');
    	component_subscribe($$self, HomeLocation, $$value => $$invalidate(29, $HomeLocation = $$value));
    	validate_store(MemoisedDirections, 'MemoisedDirections');
    	component_subscribe($$self, MemoisedDirections, $$value => $$invalidate(30, $MemoisedDirections = $$value));
    	validate_store(ShopStore, 'ShopStore');
    	component_subscribe($$self, ShopStore, $$value => $$invalidate(10, $ShopStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const { getWalkingDirections } = ORSHelper;
    	const { save, load } = LocalStorageHelper;

    	// bound component variables
    	let leafletMap;

    	// show/hide the transparent overlay
    	let splashOverlayVisible;

    	let newMarkerOverlayVisible = false;
    	let newMarkerPopup;

    	// shop input fields
    	let lastClickedCoord = { lat: 0, lng: 0 };

    	let newShopName;
    	let newShopDesc;
    	let newShopPrice;

    	/**
     * Adds a new shop to the ShopStore
     */
    	const addNewShop = () => {
    		const existingShops = $ShopStore;

    		existingShops.push({
    			name: newShopName,
    			description: newShopDesc,
    			price: newShopPrice,
    			location: lastClickedCoord
    		});

    		ShopStore.set(existingShops);
    	};

    	/**
     * Sets the home location to the given leafletEvent.latlng
     * @param leafletEvent
     */
    	const setHomeLocation = leafletEvent => {
    		const { lat, lng } = leafletEvent.latlng;
    		HomeLocation.set({ lat, lng });
    	};

    	/**
     * flag to check if we're pending a release of a long press.
     * prevents the map click handler firing on release of long press.
     */
    	let longPressPendingRelease = false;

    	const mapLongPress = e => {
    		const leafletEvent = e.detail;
    		longPressPendingRelease = true;

    		if (confirm("Set this location as home?")) {
    			setHomeLocation(leafletEvent);
    		}
    	};

    	const mapClicked = e => {
    		/**
     * If we're waiting for a long press release, don't do anything.
     */
    		if (longPressPendingRelease) {
    			longPressPendingRelease = false;
    			return;
    		}

    		const leafletEvent = e.detail;

    		// set location
    		lastClickedCoord = {
    			lat: leafletEvent.latlng.lat,
    			lng: leafletEvent.latlng.lng
    		};

    		// show the overlay
    		$$invalidate(2, newMarkerOverlayVisible = true);
    	};

    	/**
     * Overlay add button clicked
     */
    	const addClicked = e => {
    		addNewShop();

    		// after adding the shop clear the input fields and set the overlay to invisible
    		newMarkerPopup.clearFields();

    		$$invalidate(2, newMarkerOverlayVisible = false);
    	};

    	/**
     * Overlay cancel button clicked
     */
    	const cancelClicked = e => {
    		$$invalidate(2, newMarkerOverlayVisible = false);
    	};

    	const markerClicked = e => {
    		let leafletMouseEvent = e.detail;
    		let { latlng } = leafletMouseEvent;

    		// fly to this marker
    		leafletMap.flyTo({ lat: latlng.lat, lng: latlng.lng });

    		// get the lat-lng "id" and get the corrosponding shop
    		let markerPretendId = `${latlng.lat}-${latlng.lng}`;

    		let thisShop;

    		$ShopStore.forEach(shop => {
    			let pretendId = `${shop.location.lat}-${shop.location.lng}`;

    			if (pretendId === markerPretendId) {
    				thisShop = shop;
    			}
    		});

    		// open the shop info in the side bar
    		$$invalidate(7, selectedShop = thisShop === selectedShop ? undefined : thisShop);
    	};

    	let selectedShop;

    	const itemClicked = e => {
    		const thisShop = e.detail;
    		leafletMap.flyTo(thisShop.location);
    		$$invalidate(7, selectedShop = thisShop === selectedShop ? undefined : thisShop);
    	};

    	const onShopUpdated = e => {
    		e.detail;
    		ShopStore.set($ShopStore);
    	};

    	let directions = undefined;
    	let directionsOpen = false;

    	/**
     * Attempt to read any stored existing directions from the Store
     * @param {string} pretendId Id composed of the to:from latlons
     */
    	const getExistingDirections = pretendId => {
    		// how long until directions are considered old
    		const expiresMs = 1000 * 60 * 60 * 24 * 5; // 5 days

    		if (!Object.keys($MemoisedDirections).includes(pretendId)) {
    			return;
    		}

    		const existing = $MemoisedDirections[pretendId];
    		const now = new Date().valueOf();

    		if (now - existing.added < expiresMs) {
    			// use the existing info if it is not too old
    			return existing.json;
    		}

    		// remove it if it's too old
    		MemoisedDirections.update(existing => {
    			delete existing[pretendId];
    			return existing;
    		});

    		return;
    	};

    	const onNavigate = async e => {
    		const shop = e.detail;
    		const from = $HomeLocation;
    		const to = shop.location;
    		let parsedDirections;

    		// first check stored locations
    		const pretendId = `${from.lat},${from.lng}:${to.lat},${to.lng}`;

    		parsedDirections = getExistingDirections(pretendId);

    		// if we've not been set above, now make an actual API call
    		if (!parsedDirections) {
    			parsedDirections = await getWalkingDirections(from, to);

    			// saving directions
    			MemoisedDirections.update(existing => {
    				existing[pretendId] = {
    					added: new Date().valueOf(),
    					json: parsedDirections
    				};

    				return existing;
    			});
    		}

    		GeoJSONToMapDirections(parsedDirections);
    		$$invalidate(8, directions = parsedDirections);
    		$$invalidate(9, directionsOpen = true);
    	};

    	/**
     * Parse a list of direction coordinates from GeoJSON and pass them to the
     * map's drawRoute method
     * @param GeoJSON
     */
    	const GeoJSONToMapDirections = GeoJSON => {
    		// get the lines
    		const features = GeoJSON.features;

    		const latLonArray = [];

    		features.forEach(feature => {
    			const { geometry } = feature;
    			const { coordinates } = geometry;

    			coordinates.forEach(([lon, lat]) => {
    				latLonArray.push([lat, lon]);
    			});
    		});

    		leafletMap.drawRoute(latLonArray);
    	};

    	let saveDebounceId;

    	const saveDebounce = (key, value) => {
    		if (saveDebounceId) clearTimeout(saveDebounceId);

    		saveDebounceId = setTimeout(
    			() => {
    				save(key, value);
    			},
    			debounceSaveTimeout
    		);
    	};

    	/** Load data from localstorage into the Stores */
    	const loadSavedData = () => {
    		if (!window.localStorage) {
    			throw new Error("loadSavedData called before window.localStorage is available");
    		}

    		const existingShopStore = load("$ShopStore");
    		const existingHomeLocation = load("$HomeLocation");
    		const existingSplashOverlayVisible = load("$SplashOverlayVisible");
    		const existingMemoisedDirections = load("$MemoisedDirections");

    		if (existingShopStore !== null && typeof existingShopStore === "object") {
    			ShopStore.set(existingShopStore);
    		}

    		if (existingHomeLocation !== null && typeof existingHomeLocation === "object") {
    			HomeLocation.set(existingHomeLocation);
    		}

    		if (existingSplashOverlayVisible !== null && typeof existingSplashOverlayVisible === "boolean") {
    			SplashOverlayVisible.set(existingSplashOverlayVisible);
    		}

    		if (existingMemoisedDirections !== null && typeof existingMemoisedDirections === "object") {
    			SplashOverlayVisible.set(existingMemoisedDirections);
    		}
    	};

    	/** register all the store listners for saving to localStorage*/
    	const storeUpdaters = () => {
    		// update the stores on changes
    		ShopStore.subscribe(shops => {
    			saveDebounce("$ShopStore", shops);
    		});

    		HomeLocation.subscribe(homeLocation => {
    			saveDebounce("$HomeLocation", homeLocation);
    		});

    		MemoisedDirections.subscribe(directions => {
    			saveDebounce("$MemoisedDirections", directions);
    		});

    		SplashOverlayVisible.subscribe(isVisible => {
    			saveDebounce("$SplashOverlayVisible", isVisible);
    			$$invalidate(1, splashOverlayVisible = isVisible);
    		});
    	};

    	storeUpdaters();

    	onMount(() => {
    		// load the stores
    		loadSavedData();
    	});

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function newmarkerpopup_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			newMarkerPopup = $$value;
    			$$invalidate(3, newMarkerPopup);
    		});
    	}

    	function newmarkerpopup_newShopName_binding(value) {
    		newShopName = value;
    		$$invalidate(4, newShopName);
    	}

    	function newmarkerpopup_newShopDesc_binding(value) {
    		newShopDesc = value;
    		$$invalidate(5, newShopDesc);
    	}

    	function newmarkerpopup_newShopPrice_binding(value) {
    		newShopPrice = value;
    		$$invalidate(6, newShopPrice);
    	}

    	const close_handler = () => {
    		SplashOverlayVisible.set(false);
    	};

    	function leafletmap_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			leafletMap = $$value;
    			$$invalidate(0, leafletMap);
    		});
    	}

    	const close_handler_1 = () => {
    		$$invalidate(9, directionsOpen = false);
    	};

    	$$self.$capture_state = () => ({
    		ORSHelper,
    		getWalkingDirections,
    		LocalStorageHelper,
    		save,
    		load,
    		HomeLocation,
    		ShopStore,
    		SplashOverlayVisible,
    		LeafletMap,
    		List,
    		TransparentOverlay,
    		NewMarkerPopup,
    		HomeLocationListItem,
    		ShopInfo,
    		TextDirections,
    		SplashInfo,
    		onMount,
    		MemoisedDirections,
    		leafletMap,
    		splashOverlayVisible,
    		newMarkerOverlayVisible,
    		newMarkerPopup,
    		lastClickedCoord,
    		newShopName,
    		newShopDesc,
    		newShopPrice,
    		debounceSaveTimeout,
    		addNewShop,
    		setHomeLocation,
    		longPressPendingRelease,
    		mapLongPress,
    		mapClicked,
    		addClicked,
    		cancelClicked,
    		markerClicked,
    		selectedShop,
    		itemClicked,
    		onShopUpdated,
    		directions,
    		directionsOpen,
    		getExistingDirections,
    		onNavigate,
    		GeoJSONToMapDirections,
    		saveDebounceId,
    		saveDebounce,
    		loadSavedData,
    		storeUpdaters,
    		$HomeLocation,
    		$MemoisedDirections,
    		$ShopStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('leafletMap' in $$props) $$invalidate(0, leafletMap = $$props.leafletMap);
    		if ('splashOverlayVisible' in $$props) $$invalidate(1, splashOverlayVisible = $$props.splashOverlayVisible);
    		if ('newMarkerOverlayVisible' in $$props) $$invalidate(2, newMarkerOverlayVisible = $$props.newMarkerOverlayVisible);
    		if ('newMarkerPopup' in $$props) $$invalidate(3, newMarkerPopup = $$props.newMarkerPopup);
    		if ('lastClickedCoord' in $$props) lastClickedCoord = $$props.lastClickedCoord;
    		if ('newShopName' in $$props) $$invalidate(4, newShopName = $$props.newShopName);
    		if ('newShopDesc' in $$props) $$invalidate(5, newShopDesc = $$props.newShopDesc);
    		if ('newShopPrice' in $$props) $$invalidate(6, newShopPrice = $$props.newShopPrice);
    		if ('longPressPendingRelease' in $$props) longPressPendingRelease = $$props.longPressPendingRelease;
    		if ('selectedShop' in $$props) $$invalidate(7, selectedShop = $$props.selectedShop);
    		if ('directions' in $$props) $$invalidate(8, directions = $$props.directions);
    		if ('directionsOpen' in $$props) $$invalidate(9, directionsOpen = $$props.directionsOpen);
    		if ('saveDebounceId' in $$props) saveDebounceId = $$props.saveDebounceId;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		leafletMap,
    		splashOverlayVisible,
    		newMarkerOverlayVisible,
    		newMarkerPopup,
    		newShopName,
    		newShopDesc,
    		newShopPrice,
    		selectedShop,
    		directions,
    		directionsOpen,
    		$ShopStore,
    		mapLongPress,
    		mapClicked,
    		addClicked,
    		cancelClicked,
    		markerClicked,
    		itemClicked,
    		onShopUpdated,
    		onNavigate,
    		newmarkerpopup_binding,
    		newmarkerpopup_newShopName_binding,
    		newmarkerpopup_newShopDesc_binding,
    		newmarkerpopup_newShopPrice_binding,
    		close_handler,
    		leafletmap_binding,
    		close_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
