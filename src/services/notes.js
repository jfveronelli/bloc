import Dexie from "dexie";
import uuid from "uuid/v4";

const db = new Dexie("bloc");
db.version(1).stores({
  notes: "uuid, *tags"
});

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

  async list(tag) {
    let query = db.notes;
    if (tag) {
      query = query.where("tags").equalsIgnoreCase(tag);
    }
    let notes = [];
    await query.each(note => notes.push(this.newSummary(note.uuid, note.title, note.tags)));
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
