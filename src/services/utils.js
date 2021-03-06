function localDate() {
  let now = new Date();
  let year = ("" + now.getFullYear()).padStart(4, "0");
  let month = ("" + (now.getMonth() + 1)).padStart(2, "0");
  let day = ("" + now.getDate()).padStart(2, "0");
  return year + month + day;
}


function comparable(str) {
  str = str.toLocaleLowerCase();
  STR_REPLACEMENTS.forEach(repl => str = str.replace(repl[0], repl[1]));
  return str;
}


function fuzzyCompare(strA, strB) {
  return comparable(strA).localeCompare(comparable(strB));
}


function uniques(array) {
  if (array) {
    for (let c = array.length - 1; c > 0; c--) {
      let pos = array.indexOf(array[c]);
      if (pos < c) {
        array.splice(c, 1);
      }
    }
  }
  return array;
}


class IsPhrase {
  constructor(phrase) {
    this.regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  in(str) {
    return this.regex.test(str);
  }
}


class Settings {
  debug() {
    return !!localStorage.debug;
  }

  updateDebug(flag) {
    if (flag) {
      localStorage.debug = "true";
    } else {
      localStorage.removeItem("debug");
    }
  }
  tagFilter() {
    return localStorage.tagFilter || "";
  }

  updateTagFilter(text) {
    localStorage.tagFilter = text || "";
  }

  selectedTags() {
    let tags = localStorage.selectedTags;
    return tags? tags.split("\n"): [];
  }

  updateSelectedTags(tags) {
    if (tags && tags.length > 0) {
      localStorage.selectedTags = tags.join("\n");
    } else {
      localStorage.removeItem("selectedTags");
    }
  }

  searchText() {
    return localStorage.searchText || "";
  }

  updateSearchText(text) {
    localStorage.searchText = text || "";
  }

  wipe() {
    localStorage.removeItem("debug");
    localStorage.removeItem("tagFilter");
    localStorage.removeItem("selectedTags");
    localStorage.removeItem("searchText");
  }
}


const STR_REPLACEMENTS = [[/á/g, "a"], [/é/g, "e"], [/í/g, "i"], [/ó/g, "o"], [/ú/g, "u"]];
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
const settings = new Settings();


export default {
  localDate,
  fuzzyCompare,
  uniques,
  isPhrase: phrase => new IsPhrase(phrase),
  isMobile,
  settings
};
