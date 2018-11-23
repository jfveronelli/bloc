import Dexie from "dexie";
import uuid from "uuid/v4";
import yaml from "js-yaml";
import JSZip from "jszip";


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
      notes: "uuid, *tags"
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

  async remove(uuid) {
    return await this.db.notes.delete(uuid);
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
}


const FILE_HEADER_START = "```yaml\n";
const FILE_HEADER_END = "\n```\n\n";
const local = new NotesDB();


export default {
  local,
  new: newNote,
  localDate
};
