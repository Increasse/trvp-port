import express from 'express';
import path, { dirname } from 'path';
import * as http from "node:http";
import pg from 'pg';
import * as fs from "node:fs";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { Client } = pg;
class httpServer {
    constructor() {
        this.port = 3000;
        this.dbClient = undefined;
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '..')));
        this.app.use(express.static(path.join(__dirname, '..', 'static')));
        this.app.use(express.static('public', {
            setHeaders: (res, path) => {
                if (path.endsWith('.js')) {
                    res.set('Content-Type', 'application/javascript');
                }
            }
        }));
        this.port = 3000;
        http.createServer(this.app).listen(this.port, () => {
            console.log(`Server started on port ${this.port}.\n http://localhost:${this.port}`);
        });
    }
    async dbConnect(config) {
        try {
            this.dbClient = new Client(config);
            await this.dbClient.connect();
        }
        catch (e) {
            console.error(e);
        }
    }
    async dbExecute(sql, commit, values) {
        if (this.dbClient) {
            try {
                await this.dbClient.query('BEGIN');
                const result = this.dbClient.query(sql, values);
                if (commit) {
                    await this.dbClient.query('COMMIT');
                }
                return result;
            }
            catch (e) {
                await this.dbClient.query('ROLLBACK');
                console.error(e);
            }
        }
        throw new Error('Not connected to DB');
    }
}
try {
    const server = new httpServer();
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pg.json')).toString());
    await server.dbConnect(config);
    server.app.get('/', (req, res) => {
        res.sendFile(path.resolve('static/html/index.html'));
    });
    server.app.get('/allTrips', async (req, res) => {
        try {
            const sql = 'SELECT public.trip.id, public.destination.value as destination, public.ferry.value as ferry, '
                + 'cargos, cars_count, cargos_count FROM public.trip '
                + 'JOIN public.destination ON public.trip.destination = public.destination.id '
                + 'JOIN public.ferry ON public.trip.ferry = public.ferry.id ';
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.get('/destination', async (req, res) => {
        try {
            const { id } = req.query;
            const sql = `SELECT * FROM public.destination `
                + (id ? `WHERE id = '${id}'` : '');
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.put('/destination', async (req, res) => {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const sql = `INSERT INTO public.destination (id, value) `
                + `VALUES ('${body.id}', '${body.value}')`;
            await server.dbExecute(sql, true);
            res.status(200).send();
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.get('/ferry', async (req, res) => {
        try {
            const { id } = req.query;
            const sql = `SELECT * FROM public.ferry `
                + (id ? `WHERE id = '${id}'` : '');
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.post('/trip', async (req, res) => {
        try {
            const { id, cargoId } = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            let sql;
            if (cargoId) {
                const cargo = body.cargo;
                if (cargo.remove) {
                    sql = `DELETE FROM public.cargo WHERE id = '${cargoId}'`;
                    await server.dbExecute(sql, false);
                }
                else {
                    sql = `INSERT INTO public.cargo (id, name, type` + (cargo.subType ? ', car_type)' : ') ')
                        + `VALUES ('${cargo.id}', '${cargo.name}', '${cargo.type}'` + (cargo.subType ? `, '${cargo.subType}')` : ')');
                    await server.dbExecute(sql, false);
                }
            }
            const set = [(body.itemId
                    ? (body.remove
                        ? `cargos = array_remove(cargos, '${body.itemId}')`
                        : `cargos = array_append(cargos, '${body.itemId}')`)
                    : ''),
                (body.destination
                    ? `destination = '${body.destination}'`
                    : ''),
                (body.ferry
                    ? `ferry = '${body.ferry}'`
                    : '')];
            sql = `UPDATE public.trip `
                + `SET `
                + set.filter(value => value.length > 0).join(', ') + ' '
                + `WHERE id = '${id}' `
                + (body.itemId
                    ? (body.remove
                        ? `AND '${body.itemId}' = ANY(cargos)`
                        : `AND '${body.itemId}' != ALL(cargos)`)
                    : '');
            await server.dbExecute(sql, true);
            res.status(200).send();
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.put('/trip', async (req, res) => {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const sql = `INSERT INTO public.trip (id, destination, ferry) `
                + `VALUES ('${body.id}', '${body.destination}', '${body.ferry}')`;
            await server.dbExecute(sql, true);
            res.status(200).send();
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.delete('/trip', async (req, res) => {
        try {
            const { id } = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            let sql = `SELECT cargos FROM public.trip WHERE id = '${id}'`;
            const cargos = (await server.dbExecute(sql, true)).rows[0].cargos;
            if (cargos.length > 0) {
                sql = `DELETE FROM public.cargo `
                    + `WHERE id IN (${cargos.map(cargo => `'${cargo}'`).join(', ')})`;
                await server.dbExecute(sql, false);
            }
            sql = `DELETE FROM public.trip `
                + `WHERE id = '${id}'`;
            await server.dbExecute(sql, true);
            res.status(200).send();
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.get('/cargo', async (req, res) => {
        try {
            const { id } = req.query;
            const sql = `SELECT * FROM public.cargo `
                + (id
                    ? `WHERE id = '${id}' `
                    : '');
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.post('/cargo', async (req, res) => {
        try {
            const { id } = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const set = [(body.name
                    ? `name = '${body.name}'`
                    : ''),
                (body.type
                    ? `type = '${body.type}'`
                    : ''),
                (body.subType
                    ? `car_type = '${body.subType}'`
                    : '')];
            const sql = 'UPDATE public.cargo '
                + 'SET '
                + set.filter(value => value.length > 0).join(', ') + ' '
                + `WHERE id = '${id}'`;
            await server.dbExecute(sql, true);
            res.status(200).send();
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.put('/cargo', async (req, res) => {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const sql = `INSERT INTO public.cargo (id, name, type` + (body.subType ? ', car_type)' : ') ')
                + `VALUES ('${body.id}', '${body.name}', '${body.type}'` + (body.subType ? `, '${body.subType}')` : ')');
            await server.dbExecute(sql, true);
            res.status(200).send();
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
    server.app.delete('/cargo', async (req, res) => {
        try {
            const { id } = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const sql = `DELETE FROM public.cargo WHERE id = '${id}'`;
            await server.dbExecute(sql, true);
            res.status(200).send();
        }
        catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });
}
catch (e) {
    console.error(e);
}
