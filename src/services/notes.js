import Dexie from "dexie";
import uuid from "uuid/v4";
import yaml from "js-yaml";
import JSZip from "jszip";
import axios from "axios";
import base64 from "base64-js";
import {sha256} from "js-sha256";
import aes from "aes-js";
import argon2 from "argon2-browser";
window.argon2 = argon2;


function newNote() {
  return {
    uuid: uuid().replace(/-/g, ""),
    date: new Date(),
    title: "",
    tags: [],
    text: ""
  };
}


function newNoteSummary(uuid, title, tags) {
  return {uuid, title, tags};
}


function newNoteStatus(uuid, date, active) {
  return {uuid, date, active};
}


function stringify(note) {
  let str = FILE_HEADER_START + "title: " + note.title + "\ntags:";
  note.tags.forEach(tag => str += "\n  - " + tag);
  return str + FILE_HEADER_END + note.text;
}


function inflate(str, uuid, date) {
  let note = newNote();
  note.uuid = uuid;
  note.date = date;

  let endPos = str.indexOf(FILE_HEADER_END);
  let header = str.slice(str.indexOf(FILE_HEADER_START) + FILE_HEADER_START.length, endPos);
  header = yaml.safeLoad(header, {schema: yaml.FAILSAFE_SCHEMA});
  note.title = header.title;
  note.tags = header.tags || [];
  note.text = str.slice(endPos + FILE_HEADER_END.length);

  return note;
}


function localDate() {
  let now = new Date();
  let year = ("" + now.getFullYear()).padStart(4, "0");
  let month = ("" + (now.getMonth() + 1)).padStart(2, "0");
  let day = ("" + now.getDate()).padStart(2, "0");
  return year + month + day;
}


class NotesDB {
  constructor() {
    this.db = new Dexie("bloc");
    this.db.version(1).stores({
      notes: "uuid, *tags",
      removed: "uuid"
    });
  }

  async list(tags, text) {
    let notes = [];
    let query = this.db.notes;
    if (tags && tags.length > 0) {
      query = query.where("tags").anyOfIgnoreCase(tags).distinct();
    }
    await query.filter(note => this.__hasText(note, text))
        .each(note => notes.push(newNoteSummary(note.uuid, note.title, note.tags)));
    return notes.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  }

  async tags() {
    let tags = await this.db.notes.orderBy("tags").uniqueKeys();
    return tags.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
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
    await this.db.removed.put(newNoteStatus(uuid, date || new Date(), false));
  }

  async export() {
    let zip = new JSZip();
    let uuids = await this.db.notes.orderBy("uuid").primaryKeys();
    for (let uuid of uuids) {
      let note = await this.get(uuid);
      let date = new Date(note.date.getTime() - note.date.getTimezoneOffset() * 60000); // fixes bug in JSZip: date is saved in UTC instead of local time
      zip.file(uuid + ".md", stringify(note), {date})
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

  async state() {
    let map = new Map();
    await this.db.removed.each(status => map.set(status.uuid, status));
    await this.db.notes.each(note => map.set(note.uuid, newNoteStatus(note.uuid, note.date, true)));
    return map;
  }

  wipe() {
    this.db.notes.clear();
    this.db.removed.clear();
  }

  __hasText(note, text) {
    if (!text) {
      return true;
    }
    text = text.toLowerCase();
    return note.title.toLowerCase().includes(text) ||
        note.tags.filter(tag => tag.toLowerCase().includes(text)).length > 0 ||
        note.text.toLowerCase().includes(text);
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
    document.location.href = "https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=" +
        this.clientId + "&scope=" + this.scope + "&redirect_uri=" + redirectUri;
  }

  newStatus(file, active) {
    let uuid = file.name.slice(0, file.name.indexOf("."));
    let date = new Date(file.modifiedTime);
    this.cache.set(uuid, {id: file.id, date});
    return newNoteStatus(uuid, date, active);
  }

  async get(uuid) {
    let cached = this.cache.get(uuid);
    let result = await this.http.get("/drive/v3/files/" + cached.id + "?alt=media", {responseType: "text"});
    return inflate(result.data, uuid, cached.date);
  }

  async add(note) {
    let headers = {"Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": "text/plain; charset=UTF-8"};
    let data = {name: note.uuid + ".md", modifiedTime: note.date, parents: this.parents};
    let result = await this.http.post("/upload/drive/v3/files?uploadType=resumable", data, {headers});
    await this.http.put(result.headers.location, stringify(note));
  }

  async update(note) {
    let cached = this.cache.get(note.uuid);
    let headers = {"Content-Type": "text/plain"};
    await this.http.patch("/upload/drive/v3/files/" + cached.id + "?uploadType=media", stringify(note), {headers});
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
        if (deltaMillis >= 1000) {
          if (statusX.active) {
            console.log("Updating note " + uuid);
            await notesY.update(await notesX.get(uuid));
          } else {
            console.log("Removing note " + uuid);
            await notesY.remove(uuid, statusX.date);
          }
        } else if (Math.abs(deltaMillis) >= 0 && Math.abs(deltaMillis) < 1000 && statusX.active && !statusY.active) {
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
    return await argon2.hash({pass, salt, hashLen: 32, time: 50, mem: 1024, parallelism: 1,
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

    note.enc_salt = saltStr;
    note.enc_iv = ivStr;
    note.enc_hmac = hmac;
    note.text = cipher;
  }

  async decrypt(note, pass) {
    let key = await this.key(pass, aes.utils.hex.toBytes(note.enc_salt));

    let hmac = this.hmac(key.hashHex, [note.enc_iv, note.text]);
    if (hmac !== note.enc_hmac) {
      return false;
    }

    let iv = aes.utils.hex.toBytes(note.enc_iv);
    let cipher = base64.toByteArray(note.text);
    let cbc = new aes.ModeOfOperation.cbc(key.hash, iv);
    let buffer = Array.from(cbc.decrypt(cipher));
    let padding = buffer[buffer.length - 1];
    buffer.splice(buffer.length - padding, buffer.length);
    return aes.utils.utf8.fromBytes(buffer);
  }
}


const FILE_HEADER_START = "```yaml\n";
const FILE_HEADER_END = "\n```\n\n";
const local = new NotesDB();
const remote = new NotesGDrive();
const synchronizer = new NotesSynchronizer(local, remote);
const crypto = new NoteCrypto();


export default {
  local,
  remote,
  synchronizer,
  crypto,
  new: newNote,
  localDate
};
