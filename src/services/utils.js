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


class IsPhrase {
  constructor(phrase) {
    this.regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  in(str) {
    return this.regex.test(str);
  }
}


const STR_REPLACEMENTS = [[/á/g, "a"], [/é/g, "e"], [/í/g, "i"], [/ó/g, "o"], [/ú/g, "u"]];
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);


export default {
  localDate,
  fuzzyCompare,
  isPhrase: phrase => new IsPhrase(phrase),
  isMobile
};