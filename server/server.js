(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('http'), require('fs'), require('crypto')) :
        typeof define === 'function' && define.amd ? define(['http', 'fs', 'crypto'], factory) :
            (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Server = factory(global.http, global.fs, global.crypto));
}(this, (function (http, fs, crypto) {
    'use strict';

    function _interopDefaultLegacy(e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    class ServiceError extends Error {
        constructor(message = 'Service Error') {
            super(message);
            this.name = 'ServiceError';
        }
    }

    class NotFoundError extends ServiceError {
        constructor(message = 'Resource not found') {
            super(message);
            this.name = 'NotFoundError';
            this.status = 404;
        }
    }

    class RequestError extends ServiceError {
        constructor(message = 'Request error') {
            super(message);
            this.name = 'RequestError';
            this.status = 400;
        }
    }

    class ConflictError extends ServiceError {
        constructor(message = 'Resource conflict') {
            super(message);
            this.name = 'ConflictError';
            this.status = 409;
        }
    }

    class AuthorizationError extends ServiceError {
        constructor(message = 'Unauthorized') {
            super(message);
            this.name = 'AuthorizationError';
            this.status = 401;
        }
    }

    class CredentialError extends ServiceError {
        constructor(message = 'Forbidden') {
            super(message);
            this.name = 'CredentialError';
            this.status = 403;
        }
    }

    var errors = {
        ServiceError,
        NotFoundError,
        RequestError,
        ConflictError,
        AuthorizationError,
        CredentialError
    };

    const { ServiceError: ServiceError$1 } = errors;


    function createHandler(plugins, services) {
        return async function handler(req, res) {
            const method = req.method;
            console.info(`<< ${req.method} ${req.url}`);

            // Redirect fix for admin panel relative paths
            if (req.url.slice(-6) == '/admin') {
                res.writeHead(302, {
                    'Location': `http://${req.headers.host}/admin/`
                });
                return res.end();
            }

            let status = 200;
            let headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            };
            let result = '';
            let context;

            // NOTE: the OPTIONS method results in undefined result and also it never processes plugins - keep this in mind
            if (method == 'OPTIONS') {
                Object.assign(headers, {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Credentials': false,
                    'Access-Control-Max-Age': '86400',
                    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin'
                });
            } else {
                try {
                    context = processPlugins();
                    await handle(context);
                } catch (err) {
                    if (err instanceof ServiceError$1) {
                        status = err.status || 400;
                        result = composeErrorObject(err.code || status, err.message);
                    } else {
                        // Unhandled exception, this is due to an error in the service code - REST consumers should never have to encounter this;
                        // If it happens, it must be debugged in a future version of the server
                        console.error(err);
                        status = 500;
                        result = composeErrorObject(500, 'Server Error');
                    }
                }
            }

            res.writeHead(status, headers);
            if (context != undefined && context.util != undefined && context.util.throttle) {
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            }
            res.end(result);

            function processPlugins() {
                const context = { params: {} };
                plugins.forEach(decorate => decorate(context, req));
                return context;
            }

            async function handle(context) {
                const { serviceName, tokens, query, body } = await parseRequest(req);
                if (serviceName == 'admin') {
                    return ({ headers, result } = services['admin'](method, tokens, query, body));
                } else if (serviceName == 'favicon.ico') {
                    return ({ headers, result } = services['favicon'](method, tokens, query, body));
                }

                const service = services[serviceName];

                if (service === undefined) {
                    status = 400;
                    result = composeErrorObject(400, `Service "${serviceName}" is not supported`);
                    console.error('Missing service ' + serviceName);
                } else {
                    result = await service(context, { method, tokens, query, body });
                }

                // NOTE: logout does not return a result
                // in this case the content type header should be omitted, to allow checks on the client
                if (result !== undefined) {
                    result = JSON.stringify(result);
                } else {
                    status = 204;
                    delete headers['Content-Type'];
                }
            }
        };
    }



    function composeErrorObject(code, message) {
        return JSON.stringify({
            code,
            message
        });
    }

    async function parseRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokens = url.pathname.split('/').filter(x => x.length > 0);
        const serviceName = tokens.shift();
        const queryString = url.search.split('?')[1] || '';
        const query = queryString
            .split('&')
            .filter(s => s != '')
            .map(x => x.split('='))
            .reduce((p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v) }), {});
        const body = await parseBody(req);

        return {
            serviceName,
            tokens,
            query,
            body
        };
    }

    function parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    resolve(body);
                }
            });
        });
    }

    var requestHandler = createHandler;

    class Service {
        constructor() {
            this._actions = [];
            this.parseRequest = this.parseRequest.bind(this);
        }

        /**
         * Handle service request, after it has been processed by a request handler
         * @param {*} context Execution context, contains result of middleware processing
         * @param {{method: string, tokens: string[], query: *, body: *}} request Request parameters
         */
        async parseRequest(context, request) {
            for (let { method, name, handler } of this._actions) {
                if (method === request.method && matchAndAssignParams(context, request.tokens[0], name)) {
                    return await handler(context, request.tokens.slice(1), request.query, request.body);
                }
            }
        }

        /**
         * Register service action
         * @param {string} method HTTP method
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        registerAction(method, name, handler) {
            this._actions.push({ method, name, handler });
        }

        /**
         * Register GET action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        get(name, handler) {
            this.registerAction('GET', name, handler);
        }

        /**
         * Register POST action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        post(name, handler) {
            this.registerAction('POST', name, handler);
        }

        /**
         * Register PUT action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        put(name, handler) {
            this.registerAction('PUT', name, handler);
        }

        /**
         * Register PATCH action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        patch(name, handler) {
            this.registerAction('PATCH', name, handler);
        }

        /**
         * Register DELETE action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        delete(name, handler) {
            this.registerAction('DELETE', name, handler);
        }
    }

    function matchAndAssignParams(context, name, pattern) {
        if (pattern == '*') {
            return true;
        } else if (pattern[0] == ':') {
            context.params[pattern.slice(1)] = name;
            return true;
        } else if (name == pattern) {
            return true;
        } else {
            return false;
        }
    }

    var Service_1 = Service;

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var util = {
        uuid
    };

    const uuid$1 = util.uuid;


    const data = fs__default['default'].existsSync('./data') ? fs__default['default'].readdirSync('./data').reduce((p, c) => {
        const content = JSON.parse(fs__default['default'].readFileSync('./data/' + c));
        const collection = c.slice(0, -5);
        p[collection] = {};
        for (let endpoint in content) {
            p[collection][endpoint] = content[endpoint];
        }
        return p;
    }, {}) : {};

    const actions = {
        get: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            return responseData;
        },
        post: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            // TODO handle collisions, replacement
            let responseData = data;
            for (let token of tokens) {
                if (responseData.hasOwnProperty(token) == false) {
                    responseData[token] = {};
                }
                responseData = responseData[token];
            }

            const newId = uuid$1();
            responseData[newId] = Object.assign({}, body, { _id: newId });
            return responseData[newId];
        },
        put: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens.slice(0, -1)) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined && responseData[tokens.slice(-1)] !== undefined) {
                responseData[tokens.slice(-1)] = body;
            }
            return responseData[tokens.slice(-1)];
        },
        patch: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined) {
                Object.assign(responseData, body);
            }
            return responseData;
        },
        delete: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (responseData.hasOwnProperty(token) == false) {
                    return null;
                }
                if (i == tokens.length - 1) {
                    const body = responseData[token];
                    delete responseData[token];
                    return body;
                } else {
                    responseData = responseData[token];
                }
            }
        }
    };

    const dataService = new Service_1();
    dataService.get(':collection', actions.get);
    dataService.post(':collection', actions.post);
    dataService.put(':collection', actions.put);
    dataService.patch(':collection', actions.patch);
    dataService.delete(':collection', actions.delete);


    var jsonstore = dataService.parseRequest;

    /*
     * This service requires storage and auth plugins
     */

    const { AuthorizationError: AuthorizationError$1 } = errors;



    const userService = new Service_1();

    userService.get('me', getSelf);
    userService.post('register', onRegister);
    userService.post('login', onLogin);
    userService.get('logout', onLogout);


    function getSelf(context, tokens, query, body) {
        if (context.user) {
            const result = Object.assign({}, context.user);
            delete result.hashedPassword;
            return result;
        } else {
            throw new AuthorizationError$1();
        }
    }

    function onRegister(context, tokens, query, body) {
        return context.auth.register(body);
    }

    function onLogin(context, tokens, query, body) {
        return context.auth.login(body);
    }

    function onLogout(context, tokens, query, body) {
        return context.auth.logout();
    }

    var users = userService.parseRequest;

    const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } = errors;


    var crud = {
        get,
        post,
        put,
        patch,
        delete: del
    };


    function validateRequest(context, tokens, query) {
        /*
        if (context.params.collection == undefined) {
            throw new RequestError('Please, specify collection name');
        }
        */
        if (tokens.length > 1) {
            throw new RequestError$1();
        }
    }

    function parseWhere(query) {
        const operators = {
            '<=': (prop, value) => record => record[prop] <= JSON.parse(value),
            '<': (prop, value) => record => record[prop] < JSON.parse(value),
            '>=': (prop, value) => record => record[prop] >= JSON.parse(value),
            '>': (prop, value) => record => record[prop] > JSON.parse(value),
            '=': (prop, value) => record => record[prop] == JSON.parse(value),
            ' like ': (prop, value) => record => record[prop].toLowerCase().includes(JSON.parse(value).toLowerCase()),
            ' in ': (prop, value) => record => JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
        };
        const pattern = new RegExp(`^(.+?)(${Object.keys(operators).join('|')})(.+?)$`, 'i');

        try {
            let clauses = [query.trim()];
            let check = (a, b) => b;
            let acc = true;
            if (query.match(/ and /gi)) {
                // inclusive
                clauses = query.split(/ and /gi);
                check = (a, b) => a && b;
                acc = true;
            } else if (query.match(/ or /gi)) {
                // optional
                clauses = query.split(/ or /gi);
                check = (a, b) => a || b;
                acc = false;
            }
            clauses = clauses.map(createChecker);

            return (record) => clauses
                .map(c => c(record))
                .reduce(check, acc);
        } catch (err) {
            throw new Error('Could not parse WHERE clause, check your syntax.');
        }

        function createChecker(clause) {
            let [match, prop, operator, value] = pattern.exec(clause);
            [prop, value] = [prop.trim(), value.trim()];

            return operators[operator.toLowerCase()](prop, value);
        }
    }


    function get(context, tokens, query, body) {
        validateRequest(context, tokens);

        let responseData;

        try {
            if (query.where) {
                responseData = context.storage.get(context.params.collection).filter(parseWhere(query.where));
            } else if (context.params.collection) {
                responseData = context.storage.get(context.params.collection, tokens[0]);
            } else {
                // Get list of collections
                return context.storage.get();
            }

            if (query.sortBy) {
                const props = query.sortBy
                    .split(',')
                    .filter(p => p != '')
                    .map(p => p.split(' ').filter(p => p != ''))
                    .map(([p, desc]) => ({ prop: p, desc: desc ? true : false }));

                // Sorting priority is from first to last, therefore we sort from last to first
                for (let i = props.length - 1; i >= 0; i--) {
                    let { prop, desc } = props[i];
                    responseData.sort(({ [prop]: propA }, { [prop]: propB }) => {
                        if (typeof propA == 'number' && typeof propB == 'number') {
                            return (propA - propB) * (desc ? -1 : 1);
                        } else {
                            return propA.localeCompare(propB) * (desc ? -1 : 1);
                        }
                    });
                }
            }

            if (query.offset) {
                responseData = responseData.slice(Number(query.offset) || 0);
            }
            const pageSize = Number(query.pageSize) || 10;
            if (query.pageSize) {
                responseData = responseData.slice(0, pageSize);
            }

            if (query.distinct) {
                const props = query.distinct.split(',').filter(p => p != '');
                responseData = Object.values(responseData.reduce((distinct, c) => {
                    const key = props.map(p => c[p]).join('::');
                    if (distinct.hasOwnProperty(key) == false) {
                        distinct[key] = c;
                    }
                    return distinct;
                }, {}));
            }

            if (query.count) {
                return responseData.length;
            }

            if (query.select) {
                const props = query.select.split(',').filter(p => p != '');
                responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                function transform(r) {
                    const result = {};
                    props.forEach(p => result[p] = r[p]);
                    return result;
                }
            }

            if (query.load) {
                const props = query.load.split(',').filter(p => p != '');
                props.map(prop => {
                    const [propName, relationTokens] = prop.split('=');
                    const [idSource, collection] = relationTokens.split(':');
                    console.log(`Loading related records from "${collection}" into "${propName}", joined on "_id"="${idSource}"`);
                    const storageSource = collection == 'users' ? context.protectedStorage : context.storage;
                    responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                    function transform(r) {
                        const seekId = r[idSource];
                        const related = storageSource.get(collection, seekId);
                        delete related.hashedPassword;
                        r[propName] = related;
                        return r;
                    }
                });
            }

        } catch (err) {
            console.error(err);
            if (err.message.includes('does not exist')) {
                throw new NotFoundError$1();
            } else {
                throw new RequestError$1(err.message);
            }
        }

        context.canAccess(responseData);

        return responseData;
    }

    function post(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length > 0) {
            throw new RequestError$1('Use PUT to update records');
        }
        context.canAccess(undefined, body);

        body._ownerId = context.user._id;
        let responseData;

        try {
            responseData = context.storage.add(context.params.collection, body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function put(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.set(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function patch(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.merge(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function del(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing);

        try {
            responseData = context.storage.delete(context.params.collection, tokens[0]);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    /*
     * This service requires storage and auth plugins
     */

    const dataService$1 = new Service_1();
    dataService$1.get(':collection', crud.get);
    dataService$1.post(':collection', crud.post);
    dataService$1.put(':collection', crud.put);
    dataService$1.patch(':collection', crud.patch);
    dataService$1.delete(':collection', crud.delete);

    var data$1 = dataService$1.parseRequest;

    const imgdata = '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Td4DLneAwSddMiRH8tMU8nng/Yy+KQsM3AKBNbe35j5OH4A0dbV8AxwcAqMFyl73eHd3e2//nmn29wOGi3Kv+RixSgAAEkxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOmlwdGNFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjdjZDM3NWM3LTcwNmItNDlkMy1hOWRkLWNmM2Q3MmMwY2I4ZCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NGY2YTJlYy04ZjA5LTRkZTMtOTY3ZC05MTUyY2U5NjYxNTAiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmE1NzI5Mi1kNmJkLTRlYjQtOGUxNi1hODEzYjMwZjU0NWYiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjEzMzAwNzI5NTMwNjQzIgogICBHSU1QOlZlcnNpb249IjIuMTAuMTIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiPgogICA8aXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgIDxpcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvblNob3duPgogICA8aXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgIDxpcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpSZWdpc3RyeUlkPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjOTQ2M2MxMC05OWE4LTQ1NDQtYmRlOS1mNzY0ZjdhODJlZDkiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDItMTRUMTM6MDU6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8cGx1czpJbWFnZVN1cHBsaWVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VTdXBwbGllcj4KICAgPHBsdXM6SW1hZ2VDcmVhdG9yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VDcmVhdG9yPgogICA8cGx1czpDb3B5cmlnaHRPd25lcj4KICAgIDxyZGY6U2VxLz4KICAgPC9wbHVzOkNvcHlyaWdodE93bmVyPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMTUwMzQ1MzQxLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgIDxkYzpjcmVhdG9yPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT5WbGFkeXNsYXYgU2VyZWRhPC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOmRlc2NyaXB0aW9uPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5TZXJ2aWNlIHRvb2xzIGljb24gb24gd2hpdGUgYmFja2dyb3VuZC4gVmVjdG9yIGlsbHVzdHJhdGlvbi48L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PmWJCnkAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQflAg4LBR0CZnO/AAAARHRFWHRDb21tZW50AFNlcnZpY2UgdG9vbHMgaWNvbiBvbiB3aGl0ZSBiYWNrZ3JvdW5kLiBWZWN0b3IgaWxsdXN0cmF0aW9uLlwvEeIAAAMxSURBVHja7Z1bcuQwCEX7qrLQXlp2ynxNVWbK7dgWj3sl9JvYRhxACD369erW7UMzx/cYaychonAQvXM5ABYkpynoYIiEGdoQog6AYfywBrCxF4zNrX/7McBbuXJe8rXx/KBDULcGsMREzCbeZ4J6ME/9wVH5d95rogZp3npEgPLP3m2iUSGqXBJS5Dr6hmLm8kRuZABYti5TMaailV8LodNQwTTUWk4/WZk75l0kM0aZQdaZjMqkrQDAuyMVJWFjMB4GANXr0lbZBxQKr7IjI7QvVWkok/Jn5UHVh61CYPs+/i7eL9j3y/Au8WqoAIC34k8/9k7N8miLcaGWHwgjZXE/awyYX7h41wKMCskZM2HXAddDkTdglpSjz5bcKPbcCEKwT3+DhxtVpJvkEC7rZSgq32NMSBoXaCdiahDCKrND0fpX8oQlVsQ8IFQZ1VARdIF5wroekAjB07gsAgDUIbQHFENIDEX4CQANIVe8Iw/ASiACLXl28eaf579OPuBa9/mrELUYHQ1t3KHlZZnRcXb2/c7ygXIQZqjDMEzeSrOgCAhqYMvTUE+FKXoVxTxgk3DEPREjGzj3nAk/VaKyB9GVIu4oMyOlrQZgrBBEFG9PAZTfs3amYDGrP9Wl964IeFvtz9JFluIvlEvcdoXDOdxggbDxGwTXcxFRi/LdirKgZUBm7SUdJG69IwSUzAMWgOAq/4hyrZVaJISSNWHFVbEoCFEhyBrCtXS9L+so9oTy8wGqxbQDD350WTjNESVFEB5hdKzUGcV5QtYxVWR2Ssl4Mg9qI9u6FCBInJRXgfEEgtS9Cgrg7kKouq4mdcDNBnEHQvWFTdgdgsqP+MiluVeBM13ahx09AYSWi50gsF+I6vn7BmCEoHR3NBzkpIOw4+XdVBBGQUioblaZHbGlodtB+N/jxqwLX/x/NARfD8ADxTOCKIcwE4Lw0OIbguMYcGTlymEpHYLXIKx8zQEqIfS2lGJPaADFEBR/PMH79ErqtpnZmTBlvM4wgihPWDEEhXn1LISj50crNgfCp+dWHYQRCfb2zgfnBZmKGAyi914anK9Coi4LOMhoAn3uVtn+AGnLKxPUZnCuAAAAAElFTkSuQmCC';
    const img = Buffer.from(imgdata, 'base64');

    var favicon = (method, tokens, query, body) => {
        console.log('serving favicon...');
        const headers = {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        };
        let result = img;

        return {
            headers,
            result
        };
    };

    var require$$0 = "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>SUPS Admin Panel</title>\r\n    <style>\r\n        * {\r\n            padding: 0;\r\n            margin: 0;\r\n        }\r\n\r\n        body {\r\n            padding: 32px;\r\n            font-size: 16px;\r\n        }\r\n\r\n        .layout::after {\r\n            content: '';\r\n            clear: both;\r\n            display: table;\r\n        }\r\n\r\n        .col {\r\n            display: block;\r\n            float: left;\r\n        }\r\n\r\n        p {\r\n            padding: 8px 16px;\r\n        }\r\n\r\n        table {\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        caption {\r\n            font-size: 120%;\r\n            text-align: left;\r\n            padding: 4px 8px;\r\n            font-weight: bold;\r\n            background-color: #ddd;\r\n        }\r\n\r\n        table, tr, th, td {\r\n            border: 1px solid #ddd;\r\n        }\r\n\r\n        th, td {\r\n            padding: 4px 8px;\r\n        }\r\n\r\n        ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .collection-list a {\r\n            display: block;\r\n            width: 120px;\r\n            padding: 4px 8px;\r\n            text-decoration: none;\r\n            color: black;\r\n            background-color: #ccc;\r\n        }\r\n        .collection-list a:hover {\r\n            background-color: #ddd;\r\n        }\r\n        .collection-list a:visited {\r\n            color: black;\r\n        }\r\n    </style>\r\n    <script type=\"module\">\nimport { html, render } from 'https://unpkg.com/lit-html?module';\nimport { until } from 'https://unpkg.com/lit-html/directives/until?module';\n\nconst api = {\r\n    async get(url) {\r\n        return json(url);\r\n    },\r\n    async post(url, body) {\r\n        return json(url, {\r\n            method: 'POST',\r\n            headers: { 'Content-Type': 'application/json' },\r\n            body: JSON.stringify(body)\r\n        });\r\n    }\r\n};\r\n\r\nasync function json(url, options) {\r\n    return await (await fetch('/' + url, options)).json();\r\n}\r\n\r\nasync function getCollections() {\r\n    return api.get('data');\r\n}\r\n\r\nasync function getRecords(collection) {\r\n    return api.get('data/' + collection);\r\n}\r\n\r\nasync function getThrottling() {\r\n    return api.get('util/throttle');\r\n}\r\n\r\nasync function setThrottling(throttle) {\r\n    return api.post('util', { throttle });\r\n}\n\nasync function collectionList(onSelect) {\r\n    const collections = await getCollections();\r\n\r\n    return html`\r\n    <ul class=\"collection-list\">\r\n        ${collections.map(collectionLi)}\r\n    </ul>`;\r\n\r\n    function collectionLi(name) {\r\n        return html`<li><a href=\"javascript:void(0)\" @click=${(ev) => onSelect(ev, name)}>${name}</a></li>`;\r\n    }\r\n}\n\nasync function recordTable(collectionName) {\r\n    const records = await getRecords(collectionName);\r\n    const layout = getLayout(records);\r\n\r\n    return html`\r\n    <table>\r\n        <caption>${collectionName}</caption>\r\n        <thead>\r\n            <tr>${layout.map(f => html`<th>${f}</th>`)}</tr>\r\n        </thead>\r\n        <tbody>\r\n            ${records.map(r => recordRow(r, layout))}\r\n        </tbody>\r\n    </table>`;\r\n}\r\n\r\nfunction getLayout(records) {\r\n    const result = new Set(['_id']);\r\n    records.forEach(r => Object.keys(r).forEach(k => result.add(k)));\r\n\r\n    return [...result.keys()];\r\n}\r\n\r\nfunction recordRow(record, layout) {\r\n    return html`\r\n    <tr>\r\n        ${layout.map(f => html`<td>${JSON.stringify(record[f]) || html`<span>(missing)</span>`}</td>`)}\r\n    </tr>`;\r\n}\n\nasync function throttlePanel(display) {\r\n    const active = await getThrottling();\r\n\r\n    return html`\r\n    <p>\r\n        Request throttling: </span>${active}</span>\r\n        <button @click=${(ev) => set(ev, true)}>Enable</button>\r\n        <button @click=${(ev) => set(ev, false)}>Disable</button>\r\n    </p>`;\r\n\r\n    async function set(ev, state) {\r\n        ev.target.disabled = true;\r\n        await setThrottling(state);\r\n        display();\r\n    }\r\n}\n\n//import page from '//unpkg.com/page/page.mjs';\r\n\r\n\r\nfunction start() {\r\n    const main = document.querySelector('main');\r\n    editor(main);\r\n}\r\n\r\nasync function editor(main) {\r\n    let list = html`<div class=\"col\">Loading&hellip;</div>`;\r\n    let viewer = html`<div class=\"col\">\r\n    <p>Select collection to view records</p>\r\n</div>`;\r\n    display();\r\n\r\n    list = html`<div class=\"col\">${await collectionList(onSelect)}</div>`;\r\n    display();\r\n\r\n    async function display() {\r\n        render(html`\r\n        <section class=\"layout\">\r\n            ${until(throttlePanel(display), html`<p>Loading</p>`)}\r\n        </section>\r\n        <section class=\"layout\">\r\n            ${list}\r\n            ${viewer}\r\n        </section>`, main);\r\n    }\r\n\r\n    async function onSelect(ev, name) {\r\n        ev.preventDefault();\r\n        viewer = html`<div class=\"col\">${await recordTable(name)}</div>`;\r\n        display();\r\n    }\r\n}\r\n\r\nstart();\n\n</script>\r\n</head>\r\n<body>\r\n    <main>\r\n        Loading&hellip;\r\n    </main>\r\n</body>\r\n</html>";

    const mode = process.argv[2] == '-dev' ? 'dev' : 'prod';

    const files = {
        index: mode == 'prod' ? require$$0 : fs__default['default'].readFileSync('./client/index.html', 'utf-8')
    };

    var admin = (method, tokens, query, body) => {
        const headers = {
            'Content-Type': 'text/html'
        };
        let result = '';

        const resource = tokens.join('/');
        if (resource && resource.split('.').pop() == 'js') {
            headers['Content-Type'] = 'application/javascript';

            files[resource] = files[resource] || fs__default['default'].readFileSync('./client/' + resource, 'utf-8');
            result = files[resource];
        } else {
            result = files.index;
        }

        return {
            headers,
            result
        };
    };

    /*
     * This service requires util plugin
     */

    const utilService = new Service_1();

    utilService.post('*', onRequest);
    utilService.get(':service', getStatus);

    function getStatus(context, tokens, query, body) {
        return context.util[context.params.service];
    }

    function onRequest(context, tokens, query, body) {
        Object.entries(body).forEach(([k, v]) => {
            console.log(`${k} ${v ? 'enabled' : 'disabled'}`);
            context.util[k] = v;
        });
        return '';
    }

    var util$1 = utilService.parseRequest;

    var services = {
        jsonstore,
        users,
        data: data$1,
        favicon,
        admin,
        util: util$1
    };

    const { uuid: uuid$2 } = util;


    function initPlugin(settings) {
        const storage = createInstance(settings.seedData);
        const protectedStorage = createInstance(settings.protectedData);

        return function decoreateContext(context, request) {
            context.storage = storage;
            context.protectedStorage = protectedStorage;
        };
    }


    /**
     * Create storage instance and populate with seed data
     * @param {Object=} seedData Associative array with data. Each property is an object with properties in format {key: value}
     */
    function createInstance(seedData = {}) {
        const collections = new Map();

        // Initialize seed data from file    
        for (let collectionName in seedData) {
            if (seedData.hasOwnProperty(collectionName)) {
                const collection = new Map();
                for (let recordId in seedData[collectionName]) {
                    if (seedData.hasOwnProperty(collectionName)) {
                        collection.set(recordId, seedData[collectionName][recordId]);
                    }
                }
                collections.set(collectionName, collection);
            }
        }


        // Manipulation

        /**
         * Get entry by ID or list of all entries from collection or list of all collections
         * @param {string=} collection Name of collection to access. Throws error if not found. If omitted, returns list of all collections.
         * @param {number|string=} id ID of requested entry. Throws error if not found. If omitted, returns of list all entries in collection.
         * @return {Object} Matching entry.
         */
        function get(collection, id) {
            if (!collection) {
                return [...collections.keys()];
            }
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!id) {
                const entries = [...targetCollection.entries()];
                let result = entries.map(([k, v]) => {
                    return Object.assign(deepCopy(v), { _id: k });
                });
                return result;
            }
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            const entry = targetCollection.get(id);
            return Object.assign(deepCopy(entry), { _id: id });
        }

        /**
         * Add new entry to collection. ID will be auto-generated
         * @param {string} collection Name of collection to access. If the collection does not exist, it will be created.
         * @param {Object} data Value to store.
         * @return {Object} Original value with resulting ID under _id property.
         */
        function add(collection, data) {
            const record = assignClean({ _ownerId: data._ownerId }, data);

            let targetCollection = collections.get(collection);
            if (!targetCollection) {
                targetCollection = new Map();
                collections.set(collection, targetCollection);
            }
            let id = uuid$2();
            // Make sure new ID does not match existing value
            while (targetCollection.has(id)) {
                id = uuid$2();
            }

            record._createdOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Replace entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Record will be replaced!
         * @return {Object} Updated entry.
         */
        function set(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = targetCollection.get(id);
            const record = assignSystemProps(deepCopy(data), existing);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Modify entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Shallow merge will be performed!
         * @return {Object} Updated entry.
         */
        function merge(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = deepCopy(targetCollection.get(id));
            const record = assignClean(existing, data);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Delete entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @return {{_deletedOn: number}} Server time of deletion.
         */
        function del(collection, id) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            targetCollection.delete(id);

            return { _deletedOn: Date.now() };
        }

        /**
         * Search in collection by query object
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {Object} query Query object. Format {prop: value}.
         * @return {Object[]} Array of matching entries.
         */
        function query(collection, query) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            const result = [];
            // Iterate entries of target collection and compare each property with the given query
            for (let [key, entry] of [...targetCollection.entries()]) {
                let match = true;
                for (let prop in entry) {
                    if (query.hasOwnProperty(prop)) {
                        const targetValue = query[prop];
                        // Perform lowercase search, if value is string
                        if (typeof targetValue === 'string' && typeof entry[prop] === 'string') {
                            if (targetValue.toLocaleLowerCase() !== entry[prop].toLocaleLowerCase()) {
                                match = false;
                                break;
                            }
                        } else if (targetValue != entry[prop]) {
                            match = false;
                            break;
                        }
                    }
                }

                if (match) {
                    result.push(Object.assign(deepCopy(entry), { _id: key }));
                }
            }

            return result;
        }

        return { get, add, set, merge, delete: del, query };
    }


    function assignSystemProps(target, entry, ...rest) {
        const whitelist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let prop of whitelist) {
            if (entry.hasOwnProperty(prop)) {
                target[prop] = deepCopy(entry[prop]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }


    function assignClean(target, entry, ...rest) {
        const blacklist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let key in entry) {
            if (blacklist.includes(key) == false) {
                target[key] = deepCopy(entry[key]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }

    function deepCopy(value) {
        if (Array.isArray(value)) {
            return value.map(deepCopy);
        } else if (typeof value == 'object') {
            return [...Object.entries(value)].reduce((p, [k, v]) => Object.assign(p, { [k]: deepCopy(v) }), {});
        } else {
            return value;
        }
    }

    var storage = initPlugin;

    const { ConflictError: ConflictError$1, CredentialError: CredentialError$1, RequestError: RequestError$2 } = errors;

    function initPlugin$1(settings) {
        const identity = settings.identity;

        return function decorateContext(context, request) {
            context.auth = {
                register,
                login,
                logout
            };

            const userToken = request.headers['x-authorization'];
            if (userToken !== undefined) {
                let user;
                const session = findSessionByToken(userToken);
                if (session !== undefined) {
                    const userData = context.protectedStorage.get('users', session.userId);
                    if (userData !== undefined) {
                        console.log('Authorized as ' + userData[identity]);
                        user = userData;
                    }
                }
                if (user !== undefined) {
                    context.user = user;
                } else {
                    throw new CredentialError$1('Invalid access token');
                }
            }

            function register(body) {
                if (body.hasOwnProperty(identity) === false ||
                    body.hasOwnProperty('password') === false ||
                    body[identity].length == 0 ||
                    body.password.length == 0) {
                    throw new RequestError$2('Missing fields');
                } else if (context.protectedStorage.query('users', { [identity]: body[identity] }).length !== 0) {
                    throw new ConflictError$1(`A user with the same ${identity} already exists`);
                } else {
                    const newUser = Object.assign({}, body, {
                        [identity]: body[identity],
                        hashedPassword: hash(body.password)
                    });
                    const result = context.protectedStorage.add('users', newUser);
                    delete result.hashedPassword;

                    const session = saveSession(result._id);
                    result.accessToken = session.accessToken;

                    return result;
                }
            }

            function login(body) {
                const targetUser = context.protectedStorage.query('users', { [identity]: body[identity] });
                if (targetUser.length == 1) {
                    if (hash(body.password) === targetUser[0].hashedPassword) {
                        const result = targetUser[0];
                        delete result.hashedPassword;

                        const session = saveSession(result._id);
                        result.accessToken = session.accessToken;

                        return result;
                    } else {
                        throw new CredentialError$1('Login or password don\'t match');
                    }
                } else {
                    throw new CredentialError$1('Login or password don\'t match');
                }
            }

            function logout() {
                if (context.user !== undefined) {
                    const session = findSessionByUserId(context.user._id);
                    if (session !== undefined) {
                        context.protectedStorage.delete('sessions', session._id);
                    }
                } else {
                    throw new CredentialError$1('User session does not exist');
                }
            }

            function saveSession(userId) {
                let session = context.protectedStorage.add('sessions', { userId });
                const accessToken = hash(session._id);
                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken }, session));
                return session;
            }

            function findSessionByToken(userToken) {
                return context.protectedStorage.query('sessions', { accessToken: userToken })[0];
            }

            function findSessionByUserId(userId) {
                return context.protectedStorage.query('sessions', { userId })[0];
            }
        };
    }


    const secret = 'This is not a production server';

    function hash(string) {
        const hash = crypto__default['default'].createHmac('sha256', secret);
        hash.update(string);
        return hash.digest('hex');
    }

    var auth = initPlugin$1;

    function initPlugin$2(settings) {
        const util = {
            throttle: false
        };

        return function decoreateContext(context, request) {
            context.util = util;
        };
    }

    var util$2 = initPlugin$2;

    /*
     * This plugin requires auth and storage plugins
     */

    const { RequestError: RequestError$3, ConflictError: ConflictError$2, CredentialError: CredentialError$2, AuthorizationError: AuthorizationError$2 } = errors;

    function initPlugin$3(settings) {
        const actions = {
            'GET': '.read',
            'POST': '.create',
            'PUT': '.update',
            'PATCH': '.update',
            'DELETE': '.delete'
        };
        const rules = Object.assign({
            '*': {
                '.create': ['User'],
                '.update': ['Owner'],
                '.delete': ['Owner']
            }
        }, settings.rules);

        return function decorateContext(context, request) {
            // special rules (evaluated at run-time)
            const get = (collectionName, id) => {
                return context.storage.get(collectionName, id);
            };
            const isOwner = (user, object) => {
                return user._id == object._ownerId;
            };
            context.rules = {
                get,
                isOwner
            };
            const isAdmin = request.headers.hasOwnProperty('x-admin');

            context.canAccess = canAccess;

            function canAccess(data, newData) {
                const user = context.user;
                const action = actions[request.method];
                let { rule, propRules } = getRule(action, context.params.collection, data);

                if (Array.isArray(rule)) {
                    rule = checkRoles(rule, data);
                } else if (typeof rule == 'string') {
                    rule = !!(eval(rule));
                }
                if (!rule && !isAdmin) {
                    throw new CredentialError$2();
                }
                propRules.map(r => applyPropRule(action, r, user, data, newData));
            }

            function applyPropRule(action, [prop, rule], user, data, newData) {
                // NOTE: user needs to be in scope for eval to work on certain rules
                if (typeof rule == 'string') {
                    rule = !!eval(rule);
                }

                if (rule == false) {
                    if (action == '.create' || action == '.update') {
                        delete newData[prop];
                    } else if (action == '.read') {
                        delete data[prop];
                    }
                }
            }

            function checkRoles(roles, data, newData) {
                if (roles.includes('Guest')) {
                    return true;
                } else if (!context.user && !isAdmin) {
                    throw new AuthorizationError$2();
                } else if (roles.includes('User')) {
                    return true;
                } else if (context.user && roles.includes('Owner')) {
                    return context.user._id == data._ownerId;
                } else {
                    return false;
                }
            }
        };



        function getRule(action, collection, data = {}) {
            let currentRule = ruleOrDefault(true, rules['*'][action]);
            let propRules = [];

            // Top-level rules for the collection
            const collectionRules = rules[collection];
            if (collectionRules !== undefined) {
                // Top-level rule for the specific action for the collection
                currentRule = ruleOrDefault(currentRule, collectionRules[action]);

                // Prop rules
                const allPropRules = collectionRules['*'];
                if (allPropRules !== undefined) {
                    propRules = ruleOrDefault(propRules, getPropRule(allPropRules, action));
                }

                // Rules by record id 
                const recordRules = collectionRules[data._id];
                if (recordRules !== undefined) {
                    currentRule = ruleOrDefault(currentRule, recordRules[action]);
                    propRules = ruleOrDefault(propRules, getPropRule(recordRules, action));
                }
            }

            return {
                rule: currentRule,
                propRules
            };
        }

        function ruleOrDefault(current, rule) {
            return (rule === undefined || rule.length === 0) ? current : rule;
        }

        function getPropRule(record, action) {
            const props = Object
                .entries(record)
                .filter(([k]) => k[0] != '.')
                .filter(([k, v]) => v.hasOwnProperty(action))
                .map(([k, v]) => [k, v[action]]);

            return props;
        }
    }

    var rules = initPlugin$3;

    var identity = "email";
    var protectedData = {
        users: {
            "35c62d76-8152-4626-8712-eeb96381bea8": {
                email: "peter@abv.bg",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
            },
            "847ec027-f659-4086-8032-5173e2f9c93a": {
                email: "john@abv.bg",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
            }
        },
        sessions: {
        }
    };
    var seedData = {
        destinations: {
            'b559bd24-5fb6-4a42-bc48-40c17dea649d': {
                '_ownerId': '35c62d76-8152-4626-8712-eeb96381bea8',
                'destination': 'London',
                'description': 'Feyre\'s survival rests upon her ability to hunt and kill – the forest where she lives is a cold, bleak place in the long winter months. So when she spots a deer in the forest being pursued by a wolf, she cannot resist fighting it for the flesh. But to do so, she must kill the predator and killing something so precious comes at a price ...',
                'imageUrl': 'https://images.ctfassets.net/bguk4g2zwmps/01P63pQ6finbFwRzcnJyT5/fef2459e294ec08c960acbc7320271e0/img-London-LG-2x.jpg',
                'type': 'Town',
                'comments': [],
                '_createdOn': 1617797078108
            },
            '2949b54d-b163-4a00-b65c-41fb8b641561': {
                '_ownerId': '35c62d76-8152-4626-8712-eeb96381bea8',
                'destination': 'Barselona',
                'description': 'The year is 1945. Claire Randall, a former combat nurse, is just back from the war and reunited with her husband on a second honeymoon when she walks through a standing stone in one of the ancient circles that dot the British Isles. Suddenly she is a Sassenach—an “outlander”—in a Scotland torn by war and raiding border clans in the year of Our Lord...1743.',
                'imageUrl': 'https://img1.10bestmedia.com/Images/Photos/378847/GettyImages-1085317916_55_660x440.jpg',
                'type': 'Town',
                'comments': [],
                '_createdOn': 1617799443179
            },
            'f6f54fcd-0469-470b-8ffa-a33ae6c7a524': {
                '_ownerId': '847ec027-f659-4086-8032-5173e2f9c93a',
                'destination': 'Paris',
                'description': 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. "To Kill A Mockingbird" became both an instant bestseller and a critical success when it was first published in 1960. It went on to win the Pulitzer Prize in 1961 and was later made into an Academy Award-winning film, also a classic.',
                'imageUrl': 'https://media.istockphoto.com/id/635758088/photo/sunrise-at-the-eiffel-tower-in-paris-along-the-seine.jpg?s=612x612&w=0&k=20&c=rdy3aU1CDyh66mPyR5AAc1yJ0yEameR_v2vOXp2uuMM=',
                'type': 'Town',
                'comments': [{ 'comment': ' aasdasdsad' }],
                '_createdOn': 1617799658349
            },
            'f6f54fcd-0469-470b-8ffa-a33ae6c7a525': {
                "_ownerId": "08ea9ed0-6b1e-4746-b2b4-53537e436b81",
                "destination": "Buenos Aires",
                "description": "Buenos Aires is the capital and largest city in the South American country of Argentina. It has its own executive, legislative and judicial powers. It is in the central-eastern region of the country, on the southern shore of the Río de la Plata, in the Pampas region. The city was ceded in 1880 by the Province of Buenos Aires to be the federal capital of the country. It is the \"main capital\", along with 24 alternate capitals, because of the constitutional reform of 1994. Buenos Aires city is also known as Capital Federal to differentiate the city from the Buenos Aires Province. Until 1994 Buenos Aires city was under the presidential government, but after a constitutional reform in that year, the city became self-governed, allowing citizens to elect their city authorities.",
                "imageUrl": "https://img.itinari.com/pages/images/original/f34ef104-d986-49cf-b10d-a60d8c6134ed-istock-685850438.jpg?ch=DPR&dpr=2.625&w=1600&s=95b157b850ca2003d0db3ea03d5afb01",
                "type": "Town",
                "_createdOn": 1691143135754,
                'comments': [],
                "_id": "9fad05af-eabd-4bf4-a618-1a8d2a82a2e8"
            },
            'f6f54fcd-0469-470b-8ffa-a33ae6c7a526': {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "destination": "Sicily",
                "description": "Sicily, Italian Sicilia, island, southern Italy, the largest and one of the most densely populated islands in the Mediterranean Sea. Together with the Egadi, Lipari, Pelagie, and Panteleria islands, Sicily forms an autonomous region of Italy. It lies about 100 miles (160 km) northeast of Tunisia (northern Africa).",
                "imageUrl": "https://www.paesana.com/hubfs/Blog/Sicily%20Italy%20landscape%20with%20water%20and%20homes%20in%20background.jpg",
                "type": "Sea",
                "_createdOn": 1691143004719,
                'comments': [],
                "_id": "b084fd85-f860-40d4-88e1-27eb5ce6226e"
            },
            'f6f54fcd-0469-470b-8ffa-a33ae6c7a527': {
                "destination": "Crete",
                "description": "Crete is the largest island in Greece, and the fifth largest one in the Mediterranean Sea. Here, you can admire the remnants of brilliant civilizations, explore glorious beaches, impressive mountainscapes, fertile valleys and steep gorges, and become part of the island's rich gastronomic culture.",
                "imageUrl": "https://content.api.news/v3/images/bin/d64d9deae0649db3a9948d85beb7638f",
                "type": "Beach",
                "_createdOn": 1691142841787,
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "_updatedOn": 1691142930255,
                'comments': [],
                "_id": "76d88740-b483-4e71-81a9-0240eace33b3"
            },
            'f6f54fcd-0469-470b-8ffa-a33ae6c7a528': {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "destination": "Paros",
                "description": "Paros is an island at the center of the Cyclades island group. Combining modern with traditional elements in the most unique way, it is a mix of traditional Cycladic architecture, vivid nightlife, magical beaches, enchanting rural villages and historical monuments.",
                "imageUrl": "https://www.solosophie.com/wp-content/uploads/2020/02/Paros-Greece_336327542-1024x768.jpeg.webp",
                "type": "Sea",
                "_createdOn": 1691142720352,
                'comments': [],
                "_id": "dcb404e9-9e85-4f98-b4f1-1195fce2deeb"
            },
            'f6f54fcd-0469-470b-8ffa-a33ae6c7a529': {
                "destination": "Kozia Stena hut",
                "description": "Goat Wall Hut is located in the area of Haiduk Cheshma, in the Troyanska Planina, part of the Middle Stara Planina, at 1560 meters above sea level. It was built in 1940 and later rebuilt. It is a massive three-story building with a capacity of 100 seats. The hut is a stop on the European route E3.",
                "imageUrl": "https://www.myfreshes.eu/wp-content/uploads/2020/07/sunsetkozia-117-1000x640.jpg",
                "type": "Mountain",
                "_createdOn": 1691140988150,
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "_updatedOn": 1691141623020,
                'comments': [],
                "_id": "83bdf37d-5e78-4cc2-a993-48702bc2ac0c"
            },
            'f6f54fcd-1469-470b-8ffa-a33ae6c7a529': {
                "destination": "Echo hut",
                "description": "\"Echo\" is a hut on the ridge of Stara Planina between Yumruka and Kavladan peaks at 1675 meters above sea level in the area of Zhelezni vrata. There are 57 places available in rooms with 4, 6, 7 and more beds, and some of the rooms have their own bathrooms. There is a living room, a bar-bench, a kitchenette for tourists.",
                "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHCBYVFRgWFRYYGBgZGhocGRkYGhwaGhkaGhoaGhoaGBkcIS4lHh4rIRwaJjgnKy8xNTU1GiQ7QDszPy40NTEBDAwMEA8QHhISHzQrJSs0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NP/AABEIALUBFwMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAACAwAEBQEGB//EADoQAAEDAgQEAwYGAQQCAwAAAAEAAhEDIQQSMUFRYXGBBSKREzKhscHwBkJS0eHxchQjYpKCshUzov/EABoBAAMBAQEBAAAAAAAAAAAAAAECAwAEBgX/xAAmEQACAgICAgEEAwEAAAAAAAAAAQIREiEDMUFRYQQTIjIUcZGh/9oADAMBAAIRAxEAPwD3bBLhC0qzwLDZZjGkEEKy986rukrZxx0ixRqnQIjVjVUxUhD7WUuOw5F41pRCsSICzs6bSxACzgZSLJLmzf0SMRiiRBJTn1wQs2qtGNvaNJ10C+oqz3onhKLFdJEjmqeWZUptk5ptdBhRXe9LL0VRKgooVh5kwXCFtJWqLNgEHJDRiym1hOiJuHedlpsoHYK7gAc0OFvkklyV0OoGPh6L2uggzw/dbLJ78kys3KSQLlDQrgEZgpyllsooqIzCYIElzh0G1+Ka+g1pmOdrfJHVxbQJAnos6pXzTH3ySLKTtheMUaWEa6DmII+9UmvUYCGi54DZZ4xDm+UutpCA1RMntCK43dsRz1o2m0ARIKW7AtJvokUvEmgAeq4/HibJcZ2PnE5isOG2GiT7cNAsuYvGk6Qs+o8qsONtbJz5Eui5R8RAcZb0TKuMAIM2tPJZBC45tpVvsxsl96Rax/iGazRbpeOazHOKYWoXNVoQjFUiM5Sk7YBedEKItXIVEIDlXVIXVrMb7iJS3uCW96Q9640jsbGvPNBmSS9A56KQrZYNRDmVfMiujQLHtrLueUDKRidlxjltGoeymXGAhqUXN1Ct4J+WQVrf6YPapyni9jqF9HnWU1x1Mr0DfDgmNwTR/KR8yHXGzyzqJXKdO+i9RWwlv2VangwDwCK5bQMNmdTwbjoCeNtFbNIQIsRvHzWvUcAIG6rUWAnzaJFO1bGcadIThHke8U5zNwmmk02BCsNpxbZTlJDqLM4vO6W+nIK1nMG4CrupiZAsjGZnEymyBHFV6gjqtWswAqjXZJlVjInKJTe8nVC8pxYuOarJokwGOTXNiI4JSsMvpfZZugJWIeUDk2pTIN0vKnTQjQstQuanQhLU1goSWoCE9zUJaipAxK5auFqaWoYTZAxFZVFZoUZMHRRL9yhlx2g3vSXuQl6hBU6KWcLkJcumkYkLlLDPcYARtAdhUl6Pw6kxzTmaDpcrHweAeXRlNtV6Olgy1tteC5uaS6stxxfdCMb4cHZWtIAmTxXMPgKbTe8cd+yJ9VwKVUqSUiUmqsZtXdAeJUwTY2+Su+HOysAcQqZBOl0DSQmcbjVgUqdmu2rJgI3U51KoYbERqFY/1gKk4NPRSMlWywIA1VTGNNiNAlVMSUpuI7oxg1sEpJ6LDHTqjFMHdJfiSf4RsqgotMGiyykBzTwVQzuNgFcYyBBMqcl7KRfoIpNSAOuia5wCXUeI+SCCysQNXKniKw0AgBWXBzheOkpf+jGW93G4kwB6KsWl2Tkm+jPddA5HUplpgoXK6ZFr2KJVvAPhwBMCVWyq1TDAWuJJIiyE3qgxWy9icMXHytHGTbsqGKw+SASCTwV+pj590EKpiSXATspwcl2PKMWikQhITMt10sHFdGRDEQQoG8k2FCyxOgGpNgOp2WyNiIczkiZQnUws+t+I8Mw5TWa4n9DXvH/ZjSPiqj/xbhQ4tL3wNHezcWkQLiPNrI026JXyx9jKPwbbwGnyyoqbfFaBdlFelmJIAzgTAJME2NgfRRbOPsNP0dFNX6eFsDsUkutsjdidIsmlbMqRew+FM5jGUayneHZXOI7jX5qjReSNbfOEf+sIs23a/qpOMnaGTXZunyixk8/qlMxhm+iyG4ondOY9J9r2N9z0X8RWa62/FLp02n9rXVcldp1SJ003+i2FLQMrezSozJkRO9tdEnEYQl0iAN+qlBziLR3tdI9u4E5nRrod1NJp6KNqqZWqtLTB7p9eswthogjlf1SXtBN3TxSHi9laroldWECTpdC4wuNrECBYcreqgMpxBrHSrWHoE6EBUYTqWJLdClmnWhotLs18LRyi+pTys7DYpx1v1MJ1Wt5b2XM4u9nQpKtA1qkOvBVd9ZsRPS6rPqE80pxVVAm5D87gbfMD4qy3EuF3ACx3B+t1muMrkpnGwZBsYajiZAG5P04ocQwssYPMfsuschqEuP0RV38A1QoOT6dFxvFl5zxv8UMwxLGM9rVAuJAps/zfxH6R0JC8pjvGsRiJ9pUIa4R7OkS2mGjbLJzE7lxPySz5EugJLye5xn4rwdJ2U1c7tIpDPHVw8s8plVa/4zw8NLW1XTcgMALf8pdHpI5r5+KcCGhrRx1K57E63cfvQGAFF8noa0e0b+O8Pmh1OsObQ13dwzCO0rTo/irCFsl751y+zfm7GI+K+etLQQCd4i2vDmuveQTIDW8TJFzy/eySXPI0Uj0viP4wefLQYGXjO+HO/wCgOUHkS7svNY3FPrOAq1XuMSZJO590e60cracbJPmDoAzOjVpny8hqJ6hWKFPKHZg2+3vHuTbsFKXLKXYdIQ+mI8mmoNr3gmJHS5KKlhzGZzgLzMSTb8sa/JPcyD7gGkcPTcrjmjeZ5a/wp5aGsrupA2F+ZaCf2CitWAtaNgSPW6i2Zj3XtVGvVeV0PX32jisuNqnRNa+VRa9NY9K0FMuNcrNKqs8VExtRI0FM1GvnVdlUmVk9r0jRRMuUcQGzbpdIqPkk6TsEouQl6VR3YXLwESuSgL0tz09CjShzQlZ1M0ogHtejVUFMbUQaCi4HNA1JPwC7Vrl2pVTOpKTEayyDCAlLa9Y3jf4gZRDmMIdUuL+4w/8APiR+kcLwhJqO2FbNPxHH06DM9V4a3QbuceDGi7j8t4XjvE/xjVfIoMFJswHvhzyOOUjK3e3m6rz9esXOc97nPe73nu1NzYcG30AgbJTqjevS/wAwpObfRhmI8YxDzmdWqGN/aOaOoAIDeyaz8R4ksyPrvy6SQA6BsXgZz3ddVg0G8RyG/C0wpkI0cBppfqBayRz8GRBTECBwidB2lQgAXdmPKzRzN1HkbmQfvQJTQPdj0b84SGoY183sTyP8lca9rjsY7xylOYwC0aDYR/KNtLiejRff8x4JJNGxBpsJM3HMxHYfynBg3nkinh3PDohDeIJ7fTdSbsajodwsD8eq5n3mef3oiIkXcINtRGsfYujywNByMW7JG6DQpjSeQ4n91xuUbA8z9O10FbFNANy46HX4HYKiTmPmkzIDYt1vt1TRi32MkOxmLdFuU8AD3G6iVlESCQDykyI1tr048FE1peAnvsymZLlQOXoGfPGtcmNeq2Zda9LRi4x6bmVNr01tRK0Miyx6sMqqhmXQ9I0FM1A9C4qmysme0lChrGF6helEoQVjDS5czIV0MKxrDD1JWdi/FqNL3ngn9LPM7vFh3IWNifxY42pUwP8Ak8yf+ogD1KnKcUFHrPaBolxAA1JIAHUlZmP/ABNRZIYfaP2DTDe7z9AV4zGYqpVOaq/NGgtA6AQB2VRzg2IgTvueilLlb6GRtY78QYmrMP8AZt/TT8vq8+Y9iByWSCdZlAxxJ37pNeqeUDT+pUqcnsKDfTzaDRJ9mAYLhwslnEGIHwt6BBTcZ1jvCONBLrnAD5XIP9JQfrwXHcJ9SuNdH8wB6CUjGQTiSbX6qzQphttyRJvATMNhyQC4ZQdyLm2wKtuIaLfKTp81CfIloKiJZTOpkAW5lE9wFot6Su3PYSfviiFHKbgTwmw5qWTfYcSUmF19B8T+yY9pIhkdTfZGALT2ja2g4aLlZ4ytIcCBe9miDl1PPT7hopt6GoquoBkWzO0Bm+mkDYBZmPDifMYBNmiwAEbfe60WPmZdpwMWE2J1gkTGlhZU6lyCAJ37iZPO/wBwrPGO/JmhVNhdudrjj9z6Jj2u0B8sxf8ANxvFxKNtNxFxE9J5ajsmlsekHZc8p2wFanhp9N5jtC6muBOhgfttCiW37DR66VLogQiBC9G5HFivYsArsFNDgu5wkc36CoR9igSia4oi8IRUCOTfgzivYxpKK6WKwRtqBC2aohtlOYSlZ2gFxIAFyTYAcydFnVfxPh2WGd52DWwD3cQe8JJSrsaMUzce4MaXvc1jRq5xDQO535LzuJ/GNFrsrGPqcHWY08xMujq0LD8b8RfiXAu8jG2aySYnUm13nSbWt1z2U2t93TcqD5WNSPUM/Fro/wDqa13N5eOUgNb81n4rxN9X33OLeHus/wCoseuqxvagc/vgifWJ0ty3Qby7NRaeRFhwS/adlGVY4fVRz+d90MUuhRb3Eu3PDgFXp3fcyeOvNPDt9b7bJJABkagzyWQ/gfiKmVscRx+cfJVHX10TXGQJ+5/tMbhHPHlBPQaJtJGsoz2TmtAEk9h+6vYTwV7nAGB3BPwsPVbFDwdrD5YzAS4vMvbtcC420HqoSl62NGNmLQwj3iSMjeLpBO9mxJ+C0GU6dMSNf1uPyA/tdx1bI4NJaXEAw2TqSLkiJ1VRlEvIgwb+6duBJ+9dFyycpd6K40OqYoaT10A/fYrlFjneY6EC9wY/pEzCsYJPndcEnzbRDZ/pMc6SRIHA5ZJ26cN91Gl0jUExoLbDQmY2n6ppgCSY3vr/AB99UvT3hfgNN4HEmPmEutUzEAntpvy7J1G0ahOIrFxhgJEjzGYHMWvwv/CbSZm8ojhmNyIn5Sd9SUTaU7iP42CNrIGnrHDf77JvuKKBZUqYaTczHGCBwttp1uEMgHiTx03PXsrNTjc+kfwkOZP5T6g/JSlyp9gyFveSYB7CfgVC4CxIE+vdMdR2mOpi3olmkwauAjpKnnfRrYDXDjP1XUmtXpixe7u0AKJsX6Zj1edTOlSu5l6ezioPOuZkBKkIWahko2oGU/TidO6w/E/FySGUiQ3d2hceA3A+coSlitmjHI3MZjWURLzeJDRdx+g6mFQH4mYNKbjwlwj/AMoHylefdh3EyR3dv63RMpZbm55aBc0uZlVBB18VUef9x7nXkAkkD/FujewCqBpJ3TpIHWf4hCXwI35BTcigxoHD6/Bcf9xb1hdw7bX6/wAlDWrbD4D6qfkwqb/sia+NfguNNpPxt/aVm9FgUNzzpKaTLiRx3+9VDTy3f5R8dTcD91KNQGQ1gtN3anWIbP1KDm0MkE55d5WzPAT9NdFxmFcdSG/EnsD8yFcpUnGBAAJiLC5kxAtJAKu08PlvF9iT9IUJ86j0MolfD4OIaGvceknjZom3rYLaw/hz2wXjII/OTPXIJd6rNrPDdg47Aazttx4cVof/AAoc/OyoWgwSxhto6btdbUH/AMUOOTltjxjG9lxtNgMjM887D0Fz3KzH1mUnudVqAOl8Na4l+Rzy8A06Y47nhqixPhFUmA9z2eUNZndJeXFpn9QgtEEwIWHXPsnvY8ZctgwDzNJDT5rW31O4V1FtX4KPl44fqt/JrYn8Q0WulvtKjgI8uZjY94BxdE6/pKzcV+JKzx5WspiJsPaPA38z5Ho0LDfjMr5Ohb7piJiJngixGJaQCN4FiDBi5tqJWUEaXPKXwhtLEVS6W1Hmbw+XN9Dp2WrRxZjzMIjdsuG+1iNuOiz8HhWuDyHPztylg/K4B3nBJsIF9dt0QeX6AmNI2Qlxx8ksjTGKYf1XBGk3tqJJAv8AFNw1XPdrCBe5aW+k80rAUcpDnNBIMiSLcDN4umlhe7M5xNrNaC1v1vzK4+SUV5DobEakdJkrjntjU97Im4fcQOqA4cAzm77lc0pIUTVGsRxuCRPa6p167xOQP7NaDO/vC4nkrtQsEkATa9h3mCquJxLyS1jRcWLnRYiXWbcXn4JYSt9f6FJGXjDUcSS554B0n/8AI36KpXD2gHNJuCDraL30F/gtrBeHuaCX1HHi21Rh3/OLeqs+yZmDgxlou5rXEc54+nZdH8iEddho83QFVwIbRzcTBj1iOKi9SfN7xd0G3z4fBRb+V8Bo1VyVETWr0pwHAiqVGsYXv0HqTsBzK617ASC9oIiQXAETpIOiyPG8Yx0MaA/KQ7MDaYIgRtBSSmooyi2zPxOKfXfJ90aMzeUabnfifkg9mADBk8YNuICSXHQnTb+OCgMa/FccpNvsskkMzxM9lx1TMQNkqZRsZ17JXQxHGbcV1rIvEpgZAvb5eirOfzt0S2Yc55IgQBr+0qu1h4JgaYJ2GqbSczK0mbiYESBx+/gs5GqyUqBcQNATEmwmCYHEwDbkm1sUyhamA59vO6ZHQfl6Azx4KricS5+UNBa0Wa1pjjc8dTJ5rQw3hzC3M6XE31N5vwFuihKairl/g6VGRiKjiWvfNzMaSBAAmFvYamxwD3GA64BkkcCZMA73VPF+Gtc/OXwzZjGi9xadttv3VluFZYCzf0XbF5gk68/NtvNpS5IyjpjJCXYSo+rna9rQD5coLjIBhxPuzrcaSBuCrbcLUDGMbUJfmP8AuFkwACcpvDRoJJRwBMmA3iCBGlibffZIr1mN98tAmQ1wLibzIBvwvYc1yLknKSVa/o17B9l5y3OwuBaBMxLy2RDXGZZMOa6TJAIISPxRiXtNENc5jSHteGucGktyFpeItZw42A5rMxPiFMvzhkOBa4EuJOZujiNJ3j+1cpYnEvkAuY25zRlJJJJgkh25AuBsu7LFK3r5GuKL/wCGPES5jqXtHiCSBDHNyh7S4BrgZJnfi7gCsnFYl2YNLmueYyiWkkxJhsgMEzw0sCtnCMcwFxLnucAC55LiANYBIAHOfVdw9NrYytDRESJ9eeqSX1UI9bA6ZnYJjHZQ8HOWycpMCDlIe4AiZBtyS6MOJDaDjB/U+eMl0AC0LdNQ6XM8jHof6RhxOrrAEk6CBe39qK+sk7pf9M2VcLhAxrmuhheIs4PIB2aS2ZInT4pjMNSAgN9dTz/lTE4trIDjBOjQCSd7AAz8kDYeAYIniI7Qb8OCnLk5JbbZh5LR+Uch06o5JFjF+AMepUZRGpiTvomMo33PKYt6WU1HyagXt0+p+MKo8GQN9gf226q45jmyXENHBo46GTMnoOKRUdYmTJEW2ndCao1FYUATO1r2ntv9ExwkRlsD0HxA+yuuETByt+J13NuHryS6ogxFhzNzwAB2GvUKLoOKQ05RqYGp39I1QB1xk3GrpHKUxjDxPYd9P5XWUwInThqfRIpeDChSM3J7WHQAKKySJ4dLfJRNchqL5aAC5xAA1J0WRifGDdrAG3MGcziOMR5fiUOKxD/zk2E7MHI2/ZUaTGNEu9b3PIXn70XqJ87l+ukckeNLsGlhg4y4jcyQfrzXKz2zABgdr8SB9UGMrueby0bN0A6BVQ6VFJ9sZsaBJPyRBoCXm/L99E5lKNbcgg5GR1lNxjYffojNQNE2PQW9UGIfA4cv3VUebWT+6Ca7YTtSrmPyT2MAgkgX4osBgXvlzmZWSA0kQTyA3015jVbVHwxgu4B5ncSBy1gRyGylyfURjoZRb7MZ9MvaQxrnmwGw11mYA0V7w/wsMH+4Q53IyGixjTitBlNujZO/AEchYcUp+PZmIaQ87kk5B3iPRcs+eUtRKKJHYWnObIJ2JvHAgOkD0XX1JnTLP3JQvxbC2XPZImSJAEcJkk6qvUqtc2SSGiTLhlDuAuCb6iIm99lzvJumagm4hkw14J4dBeCR10TKj2mWZpNtBx4nbbf0WazGGqcrS+CQHFukADWxsOfEJ1Z7GCIa3QRmaS4wNQNTPGToi+PF/IKLDg5klpJBmdRB2gD6LIZ4YwHzve8nUAeb/wAgC5x01V6lhajpPuNOxsTpqZsB97p1DBkQXOBbbyNBjh5nTB6ABMuVxVWHsmGwTGe4yCYuNe51CtMbHACddZ4cym1BGw13i+5F9466ykvbm8ziY1jWeQ5c/sQdy3IyihToI6k6zJ9L+nBC4Bx11BFhJvrrv23uiY1pEwQABDpyySTsOveeyc1gbJib3EwOl95FxfgikrDQVKwnsZ9P5UqOM6RtP39FylMzDQLzwmNZgXm2nBHTJMD4mL20QlpmBDZk2nTeY5nh1RNMTYE7kjT5I2UeJO+5+90bKM7dr/IIKSAcY6I+ZMfDZEbfcfBFnaLDXePr2QVq0AkCBraJ4k8h92us5NsJx4tN+F7Dfsku1F+nGf4CBlcOILfNOkm2l4AgcbzuidMQAJdI8wIAA1NxtYzI47Qg4uTCo2cLDuAYiBrHpvI+fBNaw3yjTXrF12sxr4BcYETlMTvB5afVGKhDQGtBcOcAegP3utiumNiisZny+jROttk1rIBJsZjTUja15suurRIGQTNxci9zOlr7b9kh1QkiMzuJv8R+b+UHBAxRYbStIidtCY3sO3HVRKfUi8xflM73KiZL4DSPOue57hqXHbjy6KxicrAADmfuYMN1s3nrf0Up1Wsad3kEEagTrm2I5DfXgs575+/Veh8nIG487rrGCyWwFxgAk8Bc+gV/DeGPcRmBHKD8VOfJGK2zKLYVOiTp5RyjtJ1TAH6UmF50JF2t/wAnG0ytJmCptjO5okEZXOAmNRDSO4uhxLGz5nuDNGMYMo6Rcu7QLril9Sr0VUSngvBnvINV4AdJIbDzp+Ygw3v8YWoMPRoj/bHm0l3nd8N+QA+aotqvDTlZ7Ng1c+BJPBskkm2v9V2F7TIcQOTRN9wHeVoi1531UZzlPt69DKKRpOxjyTkYR/nY+m2u9ua4zDkky6It5Qcz42l8nKJ1iPpnPxdQ2Y/K0btgA85gSeenIQrOFzwYO/lkF+Z03c50wAL+m0XlJNLwEsvo55GcBos4NuSQdzffblqs6vWptdlax9YtIEASBMxZrYvB1R18Q73XuvMWPvf5ZJ9AUh1Z8ZWZgOMR1N4k2+CMIPywstvp5Ic9lJsAZGAFzj1iQI5C/FBVqUz5nh54tnyzroJJ6SeaQzBFnmdUBcT7rpIaCJkxb4WXXeHF93Vob+loAd2LtBzIRqN7YCsMdTLg3zsZMTlytbOsmNNJtsequ08SxhBbla002vDiBncXEmC4n3YiR0vdSjgWUXs99xDXy6S+XeUARewEnTbbdzKTDo3MNmuY0Bp4DM0EXv35ppzhjqzAUsYXOHlDpsCTdx2yje6ste4wbHvAsNANhpOuyVXw/mcWxnLXDOGgFktygNIvAG0nrskYVtdrQ0tY1jWhrXF0FwbZstJJHHpKi1GUbj2YbjMP5g9pDXsa7KDf3gJMTGgMn4oXeJSC1gDnaFzGugyDGWREb3Ow6IGVc5y531HWLmURlaLERmgwNLuIFttFqPwzmgRDLR5QHOGuhdYkTtxOqz/FJS2YqitVbazpuIB/9ibaj7C67EzIDXOJBEgiL65ZIFp5KtjfF2NOVgYcx8xfBcTpedYJHLorjMI8kHytZlEyCXHlEAAbj5FMo0raowylUY1jQGmzQC0CQLaTp/a4yq15te8cL205R8+qbU8PYGT5n8nmGNPAMbaOTpPTZOGlscPNc23NwBpM+kcEs1Ffl5MWiBqTEdP/AGOyF5Js1xA3FrzqTNzaUD6xJEAyLT1tIbN+pXKploEggG8W81zJE7c9zKmnQUHUgi3u2N4F+NpvcWVLF4kt91jng65RJ4w69gL/AHdNyRIiS3M1uUgCdSDJEuuTPXRcpsBdcAlvuiJLJEDJaB878EU0tsOgKTCWS6eJblaAzcRk1ce+qtNjIQBeLyIvtJHONTxQPa5xMXyiSb6kmJgRtp/xSsrREiY5yQOps0WQlPZroOm0QCYEWi0G9tf6TaZDic9pNjcQSL7w4320jeVWqYj8+0iANJkRpr6+qJjhlEiI24neZ5JU32zKRYc9rTAJN58pMWsDfX71SWm0AEcIgfXW/wA0zCvzug+UDZpifj8v4TqmFH5bWgb7Ra6qrktD97KtXSTDuIkENvxidlFH0bwW2Ouu2mh+5UWsU809aPhPhLKlM1XkkNnyi0wDq7twUUX2PqJNR0cy7Nuhh2ZAQ3KNQGmInjMydbkbocRWEWbHQxaNJ481FF8qW2XRmeIYv2JzNY0vP5zcgSRAmUzwphewV3uLiYIadBJ34m/Tkoonf6ABrYl1R7gSQGHSdYMdtAu0qGdzoJBa4CXebbUARGu86LqiTwMOp4ETmLnE84O8cLa7Qm4x0M3MkM2sCJ4ctNFFFKT/ACQEYuMd7JzmC8OyzprrYaC+g9VaGFLYJdmJIExESwvtB5R8eSii6X+qMyqK5NRtNoDcxu65McLm/wAuS5iMVlhsTIlxJMmWh5E7CSooiltAO4PGuqF+a2UgQ0lszBuQZjlKsUcS8uDQYBDrQD7pj7+qii04rZh9PGOcPL5ZcGzqdSCZ5wrFbwlj3N9o57zYnzFoJHIXGvHYKKLln+L/ABGPNYzFudVbTYG02nQNBDRtJaCMxuZJN16ahgfYgNzF5dd7nSZEkZWiYaPVcUXTy/ogIs0MMxl2sYCdSGgT31+KNjzveD9J7a/BRRcrdyChWIGXynzeVxvpMSLcBpEqASeg4cAP3XVFuTo0irgzm2AJc+8Ax7Prub32lZ3imNc2Q2A0BxIG4b9TxM9FFFXjSyN4LnhlX2tJtV4kkm23lJAtpNpmJurUZLi5J32kTp3UUU+T9n/YF0cosGdwFjAM9SQk1LR/y7bnXjpyUUSSC+gaZk3vHPiOOyc53kHb9lFEEKNYCCIO37c+atsfJv01UUV+IeJxwz8gRoOv8KKKIvsc/9k=",
                "type": "Mountain",
                "_createdOn": 1691141386956,
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "_updatedOn": 1691141664120,
                'comments': [],
                "_id": "1f19937e-f202-4ecc-b707-45c21bcb6868"
            },
            'f6f54fcd-2469-470b-8ffa-a33ae6c7a529': {
                "destination": "Borovec",
                "description": "Borovets is the first resort in Bulgaria. It is located in Samokov municipality, Sofia region. According to the National Statistical Institute, as of 2020, the complex has 4,536 beds in 28 places of accommodation, the number of overnight stays is 338,000, and the number of overnight stays is 98,000.",
                "imageUrl": "https://littlebg.com/wp-content/uploads/2016/01/night_ski_at_borovets.jpg",
                "type": "Mountain",
                "_createdOn": 1691141528265,
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "_updatedOn": 1691141693344,
                'comments': [],
                "_id": "5b794f9d-9c91-4677-8b4d-332ed1dada64"
            },
            'f6f54fcd-3469-470b-8ffa-a33ae6c7a529': {
                "destination": "Pamporovo",
                "description": "Pamporovo is one of the largest mountain resorts in Bulgaria. According to the National Statistical Institute, by 2020 the complex has 6,145 beds in 60 accommodation facilities, the number of overnight stays is 410,000, and the number of overnight stays is 120,000.",
                "imageUrl": "https://smolyanpress.net/wp-content/uploads/2021/01/Pamporovo-1.jpg",
                "type": "Mountain",
                "_createdOn": 1691141574889,
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "_updatedOn": 1691141716108,
                'comments': [],
                "_id": "0b3f0b3a-3eff-4b03-9f6a-e45c6b8317e7"
            },
            'f6f54fcd-4469-470b-8ffa-a33ae6c7a529': {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "destination": "Bansko",
                "description": "Bansko is a city in Southwestern Bulgaria, the administrative center of Bansko municipality, Blagoevgrad district. In the 19th century, it was the center of Bulgaria in Razloga, on a territory bordering on Greek and Turkish populations. The city is a famous winter resort, and the overnight guests – 120 thousand people.",
                "imageUrl": "https://balkanjewel.com/wp-content/uploads/2020/10/bansko-1-1150x610-1.jpg",
                "type": "Mountain",
                "_createdOn": 1691141825239,
                'comments': [],
                "_id": "f7bc5654-d857-4f4b-9905-2d898f02f71f"
            },
            'f6f54fcd-5469-470b-8ffa-a33ae6c7a529': {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "destination": "Saalbach-Hinterglemm",
                "description": "Saalbach-Hinterglemm is a municipality in the district of Zell am See (Pinzgau region), in the Austrian state of Salzburg. It is well known for its skiing and other winter sports. A four piste network consisting of Saalbach, Hinterglemm, Fieberbrunn and Leogang is located in the municipality, adding up to 270 kilometers of ski slopes.[3] It is short transfer to resort from Salzburg Airport.",
                "imageUrl": "https://www.hubertushof-hinterglemm.at/andsrv/content/files/hinterglemm.83.jpg",
                "type": "Mountain",
                "_createdOn": 1691141980495,
                'comments': [],
                "_id": "b0df901c-702d-4487-9114-a9ed86b08fcc"
            },
            'f6f54fcd-6469-470b-8ffa-a33ae6c7a529': {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "destination": "Chamonix Mont-Blanc",
                "description": "Chamonix (French: Chamonix-Mont-Blanc) is a city in eastern France. It is located in the Haute-Savoie department of the Rhône-Alpes region at the foot of Mont Blanc. The Arv River runs through the Chamonix Valley, upper part of the Arv Valley. The town and its surroundings are a famous winter resort, suitable for all kinds of sports, and in summer for mountain climbing and hiking. It has been called the \"Cradle of Mountaineering\" and the \"Mecca of Mountaineering\". In 1924, the first Winter Olympic Games were held there. Population 9,086 inhabitants (2007).",
                "imageUrl": "https://a.cdn-hotels.com/gdcs/production64/d660/912c7882-cd32-4512-9360-2690bcad6074.jpg?impolicy=fcrop&w=800&h=533&q=medium",
                "type": "Mountain",
                "_createdOn": 1691142099361,
                'comments': [],
                "_id": "e5f53134-3fca-45bb-a018-59ecfb80648d"
            },
            'f6f54fcd-7469-470b-8ffa-a33ae6c7a529': {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "destination": "kavourotrypes",
                "description": "Kavourotrypes, known also as Portokali (Orange beach) is located between Armenistis and Platanitsi beaches in Sithonia. Undoubtedly, it is the real paradise on earth; it is a golden sandy beach with crystal-clear, emerald and shallow waters with great view to Mt. Athos surrounded by pine trees and white rocks.",
                "imageUrl": "https://nikana.gr/images/1813/orange-beach-7.jpg",
                "type": "Sea",
                "_createdOn": 1691142263848,
                'comments': [],
                "_id": "ef3400c1-c773-46bf-abb9-a292e8e881b5"
            },
            'f6f54fcd-8469-470b-8ffa-a33ae6c7a529': {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "destination": "Rhodes",
                "description": "Rhodes is one of the most popular Greek islands, known for its beaches and excellent choice hotels and villas and the cosmopolitan atmosphere of its medieval Old Town. It is also known for its delicious food and local products and has a wine-making tradition that goes back to antiquity.",
                "imageUrl": "https://www.arenatravel.bg/img/kobekti/BIG_pochivki-do-ostrov-rodos-2_159705658166.jpg.webp",
                "type": "Sea",
                "_createdOn": 1691142597449,
                'comments': [],
                "_id": "6f2ac0a5-e616-46aa-8f58-8aaaebd1795c"
            },
            'f6f54fcd-9469-470b-8ffa-a33ae6c7a529': {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "destination": "Thassos",
                "description": "Thassos (or Thasos) is situated in the north Aegean Sea. It is the northernmost island in the Aegean region and is just off the coastline of the Greek mainland. This island is part of the Kavala prefecture. Thassos is situated about 10 km away from the southeast of the Macedonian seaport of Kavala.",
                "imageUrl": "https://images.musement.com/cover/0003/14/thassos-xl-jpg_header-213790.jpeg",
                "type": "Sea",
                "_createdOn": 1691142656390,
                'comments': [],
                "_id": "5e086ef4-75f2-498c-8c9b-b244b7432685"
            },
        },
        likes: {

        }
    };
    var rules$1 = {
        users: {
            ".create": false,
            ".read": [
                "Owner"
            ],
            ".update": false,
            ".delete": false
        }
    };
    var settings = {
        identity: identity,
        protectedData: protectedData,
        seedData: seedData,
        rules: rules$1
    };

    const plugins = [
        storage(settings),
        auth(settings),
        util$2(),
        rules(settings)
    ];

    const server = http__default['default'].createServer(requestHandler(plugins, services));

    const port = 3030;
    server.listen(port);
    console.log(`Server started on port ${port}. You can make requests to http://localhost:${port}/`);
    console.log(`Admin panel located at http://localhost:${port}/admin`);

    var softuniPracticeServer = {

    };

    return softuniPracticeServer;

})));
