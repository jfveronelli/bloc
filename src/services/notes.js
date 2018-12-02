import Dexie from "dexie";
import uuid from "uuid/v4";
import yaml from "js-yaml";
import JSZip from "jszip";
import axios from "axios";
import base64 from "base64-js";
import {sha256} from "js-sha256";
import aes from "aes-js";
import argon2 from "argon2-browser";
import utils from "@/services/utils";
window.argon2 = argon2;


class Model {
  constructor() {
    this.FILE_HEADER_START = "```yaml\n";
    this.FILE_HEADER_END = "\n```\n\n";
    this.types = {basic: "basic"};
  }

  note(note) {
    note = note || {};
    return {
      uuid: note.uuid || uuid().replace(/-/g, ""),
      date: note.date || new Date(),
      title: note.title || "",
      tags: note.tags? note.tags.slice(): [],
      type: note.type || this.types.basic,
      crypto: note.crypto? {salt: note.crypto.salt, iv: note.crypto.iv, hmac: note.crypto.hmac}: null,
      text: note.text || ""
    };
  }

  summary(note) {
    return {
      uuid: note.uuid,
      date: note.date,
      title: note.title,
      tags: note.tags.slice(),
      type: note.type,
      crypto: note.crypto? {salt: note.crypto.salt, iv: note.crypto.iv, hmac: note.crypto.hmac}: null
    };
  }

  status(uuid, date, active) {
    return {uuid, date, active};
  }

  note2str(note) {
    let header = {title: note.title, tags: note.tags};
    if (note.type !== this.types.basic) {
      header.type = note.type;
    }
    if (note.crypto) {
      header.crypto = note.crypto;
    }
    header = yaml.safeDump(header, {schema: yaml.FAILSAFE_SCHEMA}).trim();
    return this.FILE_HEADER_START + header + this.FILE_HEADER_END + note.text;
  }

  str2note(str, uuid, date) {
    let note = this.note();
    note.uuid = uuid;
    note.date = date;

    let endPos = str.indexOf(this.FILE_HEADER_END);
    let header = str.slice(str.indexOf(this.FILE_HEADER_START) + this.FILE_HEADER_START.length, endPos);
    header = yaml.safeLoad(header, {schema: yaml.FAILSAFE_SCHEMA});

    note.title = header.title;
    note.tags = header.tags || [];
    if (header.type) {
      note.type = header.type;
    }
    if (header.crypto) {
      note.crypto = header.crypto;
    }
    note.text = str.slice(endPos + this.FILE_HEADER_END.length);

    return note;
  }
}


class NotesDB {
  constructor() {
    this.db = new Dexie("bloc");
    this.db.version(1).stores({
      notes: "uuid, *tags, type",
      removed: "uuid"
    });
    this.db.open();
  }

  async list(params) { //tags, type, text
    let notes = [];
    let query = this.db.notes;
    let hasWhere = false;
    if (params.tags && params.tags.length > 0) {
      query = query.where("tags").anyOf(params.tags).distinct();
      hasWhere = true;
    }
    if (params.type) {
      query = (hasWhere? query.and("type"): query.where("type")).equals(params.type);
      hasWhere = true;
    }
    if (params.text) {
      query = query.filter(note => this.__hasText(note, params.text));
    }
    await query.each(note => notes.push(model.summary(note)));
    return notes.sort((a, b) => utils.fuzzyCompare(a.title, b.title));
  }

  async tags() {
    let tags = await this.db.notes.orderBy("tags").uniqueKeys();
    return tags.sort((a, b) => utils.fuzzyCompare(a, b));
  }

  async get(uuid) {
    return await this.db.notes.get({uuid});
  }

  async add(note) {
    await this.db.notes.add(note);
  }

  async update(note) {
    await this.db.notes.put(note);
  }

  async remove(uuid, date) {
    await this.db.notes.delete(uuid);
    await this.db.removed.put(model.status(uuid, date || new Date(), false));
  }

  async updateTag(tag, newTags) {
    let date = new Date();
    await this.db.notes.where("tags").equals(tag).modify(note => {
      note.date = date;
      let pos = note.tags.indexOf(tag);
      if (newTags) {
        note.tags.splice(pos, 1, ...newTags);
      } else {
        note.tags.splice(pos, 1);
      }
    });
  }

  async export(uuids) {
    let zip = new JSZip();
    for (let uuid of uuids) {
      let note = await this.get(uuid);
      let date = new Date(note.date.getTime() - note.date.getTimezoneOffset() * 60000); // fixes bug in JSZip: date is saved in UTC instead of local time
      zip.file(uuid + ".md", model.note2str(note), {date})
    }
    let options = {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9
      }
    };
    return zip.generateAsync(options);
  }

  async import(zipFile) {
    let imported = 0;
    let ignored = 0;
    let zip = new JSZip();
    await zip.loadAsync(zipFile);
    let noteName = /^[a-f0-9]{32}\.md$/i;
    for (let name in zip.files) {
      if (noteName.test(name)) {
        let uuid = name.slice(0, 32).toLowerCase();
        let date = zip.files[name].date;
        date = new Date(date.getTime() + date.getTimezoneOffset() * 60000); // fixes bug in JSZip: date is read in UTC instead of local time
        let content = await zip.file(name).async("string");
        try {
          await this.add(model.str2note(content, uuid, date));
          imported++;
        } catch (error) {
          if (error.name === "ConstraintError") {
            ignored++;
          } else {
            throw error;
          }
        }
      }
    }
    return {imported, ignored};
  }

  async state() {
    let map = new Map();
    await this.db.removed.each(status => map.set(status.uuid, status));
    await this.db.notes.each(note => map.set(note.uuid, model.status(note.uuid, note.date, true)));
    return map;
  }

  wipe() {
    this.db.notes.clear();
    this.db.removed.clear();
  }

  __hasText(note, text) {
    let isPhrase = utils.isPhrase(text);
    return isPhrase.in(note.title) || note.tags.filter(tag => isPhrase.in(tag)).length > 0 ||
        (!note.crypto && isPhrase.in(note.text));
  }
}


class NotesGDrive {
  constructor() {
    this.clientId = "806239310351-m2kct1om18ppmgbujjp5254vvud7s5a0.apps.googleusercontent.com";
    this.scope = "https://www.googleapis.com/auth/drive.appdata";
    this.parents = ["appDataFolder"];
    this.http = axios.create({baseURL: "https://www.googleapis.com", maxContentLength: 10000});
    this.http.defaults.headers.common["Authorization"] = "Bearer " + this.token();
    this.cache = new Map();
  }

  token() {
    return localStorage.googleAccessToken;
  }

  updateToken(text) {
    const TOKEN_START = "access_token=";
    if (text && text.includes(TOKEN_START)) {
      let startPos = text.indexOf(TOKEN_START) + TOKEN_START.length;
      localStorage.googleAccessToken = text.slice(startPos, text.indexOf("&", startPos));
    } else {
      localStorage.removeItem("googleAccessToken");
    }
    this.http.defaults.headers.common["Authorization"] = "Bearer " + this.token();
  }

  requestToken() {
    let redirectUri = document.location.origin + document.location.pathname;
    let url = "https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=" + this.clientId +
        "&scope=" + this.scope + "&redirect_uri=" + redirectUri;
    window.location.replace(url);
  }

  newStatus(file, active) {
    let uuid = file.name.slice(0, file.name.indexOf("."));
    let date = new Date(file.modifiedTime);
    this.cache.set(uuid, {id: file.id, date});
    return model.status(uuid, date, active);
  }

  async get(uuid) {
    let cached = this.cache.get(uuid);
    let result = await this.http.get("/drive/v3/files/" + cached.id + "?alt=media", {responseType: "text"});
    return model.str2note(result.data, uuid, cached.date);
  }

  async add(note) {
    let headers = {"Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": "text/plain; charset=UTF-8"};
    let data = {name: note.uuid + ".md", modifiedTime: note.date, parents: this.parents};
    let result = await this.http.post("/upload/drive/v3/files?uploadType=resumable", data, {headers});
    await this.http.put(result.headers.location, model.note2str(note));
  }

  async update(note) {
    let cached = this.cache.get(note.uuid);
    let headers = {"Content-Type": "text/plain"};
    await this.http.patch("/upload/drive/v3/files/" + cached.id + "?uploadType=media", model.note2str(note), {headers});
    await this.http.patch("/drive/v3/files/" + cached.id, {name: note.uuid + ".md", modifiedTime: note.date});
  }

  async remove(uuid, date) {
    let cached = this.cache.get(uuid);
    if (cached) {
      await this.http.delete("/drive/v3/files/" + cached.id);
    }
    let data = {name: uuid + ".removed", modifiedTime: date, parents: this.parents};
    await this.http.post("/drive/v3/files", data);
  }

  async state() {
    this.cache.clear();
    let map = new Map();
    let pageToken = false;
    do {
      let params = {spaces: "appDataFolder", pageSize: 1000, fields: "files(id,name,modifiedTime),nextPageToken"};
      if (pageToken) {
        params.pageToken = pageToken;
      }
      let result = await this.http.get("/drive/v3/files", {params});
      result.data.files.filter(file => file.name.endsWith(".removed")).forEach(file => {
        let status = this.newStatus(file, false);
        map.set(status.uuid, status);
      });
      result.data.files.filter(file => file.name.endsWith(".md")).forEach(file => {
        let status = this.newStatus(file, true);
        map.set(status.uuid, status);
      });
      pageToken = result.data.nextPageToken;
    } while(pageToken);
    return map;
  }
}


class NotesSynchronizer {
  constructor(notesA, notesB) {
    this.notesA = notesA;
    this.notesB = notesB;
  }

  async sync() {
    let stateA = await this.notesA.state();
    let stateB = await this.notesB.state();
    await this.__applyChanges(this.notesA, stateA, this.notesB, stateB);
    await this.__applyChanges(this.notesB, stateB, this.notesA, stateA);
  }

  async __applyChanges(notesX, stateX, notesY, stateY) {
    for (let statusX of stateX.values()) {
      let uuid = statusX.uuid;
      let statusY = stateY.get(uuid);
      if (!statusY) {
        if (statusX.active) {
          console.log("Adding note " + uuid);
          await notesY.add(await notesX.get(uuid));
        } else {
          console.log("Informing removed note " + uuid);
          await notesY.remove(uuid, statusX.date);
        }
      } else {
        let deltaMillis = statusX.date.getTime() - statusY.date.getTime();
        if (deltaMillis >= 2000) {
          if (statusX.active) {
            console.log("Updating note " + uuid + "  millis " + deltaMillis);
            await notesY.update(await notesX.get(uuid));
          } else {
            console.log("Removing note " + uuid);
            await notesY.remove(uuid, statusX.date);
          }
        } else if (Math.abs(deltaMillis) >= 0 && Math.abs(deltaMillis) < 2000 && statusX.active && !statusY.active) {
          console.log("Updating (conflicted) note " + uuid);
          await notesY.update(await notesX.get(uuid));
        }
      }
    }
  }
}


class NoteCrypto {
  random(array) {
    (window.crypto || window.msCrypto).getRandomValues(array);
  }

  async key(pass, salt) {
    return await argon2.hash({pass, salt, hashLen: 32, time: 10, mem: 1024, parallelism: 1,
        type: argon2.ArgonType.Argon2d, distPath: "js"});
  }

  hmac(keyStr, strArray) {
    let hmac = sha256.hmac.create(keyStr);
    strArray.forEach(str => hmac.update(str));
    return hmac.hex();
  }

  async encrypt(note, pass) {
    let salt = new Uint8Array(16);
    this.random(salt);
    let saltStr = aes.utils.hex.fromBytes(salt);
    let key = await this.key(pass, salt);

    let iv = new Uint8Array(16);
    this.random(iv);
    let ivStr = aes.utils.hex.fromBytes(iv);
    let buffer = Array.from(aes.utils.utf8.toBytes(note.text));
    let padding = (16 - (buffer.length % 16)) || 16;
    for (let c = 0; c < padding; c++) {
      buffer.push(padding);
    }
    let cbc = new aes.ModeOfOperation.cbc(key.hash, iv);
    let cipher = base64.fromByteArray(cbc.encrypt(buffer));

    let hmac = this.hmac(key.hashHex, [ivStr, cipher]);

    note.crypto = {salt: saltStr, iv: ivStr, hmac};
    note.text = cipher;
    return note;
  }

  async decrypt(note, pass) {
    let key = await this.key(pass, aes.utils.hex.toBytes(note.crypto.salt));

    let hmac = this.hmac(key.hashHex, [note.crypto.iv, note.text]);
    if (hmac !== note.crypto.hmac) {
      return note;
    }

    let iv = aes.utils.hex.toBytes(note.crypto.iv);
    let cipher = base64.toByteArray(note.text);
    let cbc = new aes.ModeOfOperation.cbc(key.hash, iv);
    let buffer = Array.from(cbc.decrypt(cipher));
    let padding = buffer[buffer.length - 1];
    buffer.splice(buffer.length - padding, buffer.length);

    note.crypto = null;
    note.text = aes.utils.utf8.fromBytes(buffer);
    return note;
  }
}


const model = new Model();
const local = new NotesDB();
const remote = new NotesGDrive();
const synchronizer = new NotesSynchronizer(local, remote);
const crypto = new NoteCrypto();


export default {
  model,
  local,
  remote,
  synchronizer,
  crypto
};
