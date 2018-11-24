import Dexie from "dexie";
import uuid from "uuid/v4";
import yaml from "js-yaml";
import JSZip from "jszip";
import axios from "axios";


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


function hasText(note, text) {
  if (!text) {
    return true;
  }
  text = text.toLowerCase();
  return note.title.toLowerCase().includes(text) ||
      note.tags.filter(tag => tag.toLowerCase().includes(text)).length > 0 || note.text.toLowerCase().includes(text);
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
    await query.filter(note => hasText(note, text))
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
    return await this.db.notes.add(note);
  }

  async update(note) {
    return await this.db.notes.put(note);
  }

  async remove(uuid, date) {
    await this.db.notes.delete(uuid);
    return await this.db.removed.put(newNoteState(uuid, date || new Date(), false));
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
}


class NotesGDrive {
  constructor() {
    this.clientId = "806239310351-m2kct1om18ppmgbujjp5254vvud7s5a0.apps.googleusercontent.com";
    this.scope = "https://www.googleapis.com/auth/drive.appdata";
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
    return newNoteStatus(uuid, data, active);
  }

  async get(uuid) {
    let cached = this.cache.get(uuid);
    let result = await this.http.get("/drive/v3/files/" + cached.id + "?alt=media", {responseType: "text"});
    return inflate(result.data, uuid, cached.date);
  }

  async add(note) {
    let headers = {"Content-Type": "text/plain"};
    let data = stringify(note);
    let result = await this.http.post("/upload/drive/v3/files?uploadType=media", data, {headers});

    data = {name: note.uuid + ".md", modifiedTime: note.date};
    return await this.http.patch("/drive/v3/files/" + result.data.id, data);
  }

  async update(note) {
    let cached = this.cache.get(note.uuid);
    let headers = {"Content-Type": "text/plain"};
    let data = stringify(note);
    await this.http.patch("/upload/drive/v3/files/" + cached.id + "?uploadType=media", data, {headers});

    data = {name: note.uuid + ".md", modifiedTime: note.date};
    return await this.http.patch("/drive/v3/files/" + cached.id, data);
  }

  async remove(uuid, date) {
    let cached = this.cache.get(uuid);
    await this.http.delete("/drive/v3/files/" + cached.id);

    let data = {name: note.uuid + ".removed", modifiedTime: date};
    return await this.http.post("/drive/v3/files", data);
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


const FILE_HEADER_START = "```yaml\n";
const FILE_HEADER_END = "\n```\n\n";
const local = new NotesDB();
const remote = new NotesGDrive();


export default {
  local,
  remote,
  new: newNote,
  localDate
};
