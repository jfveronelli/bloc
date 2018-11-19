import Dexie from "dexie";
import uuid from "uuid/v4";

const db = new Dexie("bloc");
db.version(1).stores({
  notes: "id, *tags"
});

class NotesService {
  new() {
    return {
      id: uuid().replace(/-/g, ""),
      title: "",
      tags: [],
      text: ""
    };
  }

  async list() {
    return await db.notes.toArray();
  }

  async get(id) {
    return await db.notes.get({id});
  }

  async add(note) {
    return await db.notes.add(note);
  }

  async update(note) {
    return await db.notes.put(note);
  }

  async remove(id) {
    return await db.notes.delete(id);
  }
}

export default new NotesService();
