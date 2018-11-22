import Dexie from "dexie";
import uuid from "uuid/v4";

const db = new Dexie("bloc");
db.version(1).stores({
  notes: "uuid, *tags"
});

function hasText(note, text) {
  if (!text) {
    return true;
  }
  text = text.toLowerCase();
  return note.title.toLowerCase().includes(text) ||
      note.tags.filter(tag => tag.toLowerCase().includes(text)).length > 0 || note.text.toLowerCase().includes(text);
}

class NotesService {
  new() {
    return {
      uuid: uuid().replace(/-/g, ""),
      title: "",
      tags: [],
      text: ""
    };
  }

  newSummary(uuid, title, tags) {
    return {uuid, title, tags};
  }

  async list(tags, text) {
    let notes = [];
    let query = db.notes;
    if (tags && tags.length > 0) {
      query = query.where("tags").anyOfIgnoreCase(tags).distinct();
    }
    await query.filter(note => hasText(note, text))
        .each(note => notes.push(this.newSummary(note.uuid, note.title, note.tags)));
    return notes.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  }

  async tags() {
    let tags = await db.notes.orderBy("tags").uniqueKeys();
    return tags.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }

  async get(uuid) {
    return await db.notes.get({uuid});
  }

  async add(note) {
    return await db.notes.add(note);
  }

  async update(note) {
    return await db.notes.put(note);
  }

  async remove(uuid) {
    return await db.notes.delete(uuid);
  }
}

export default new NotesService();
