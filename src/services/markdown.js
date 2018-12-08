import marked from "marked";
import highlight from "highlight.js";
import "highlight.js/styles/github.css";


marked.setOptions({
  highlight(text, language) {
    if (language && highlight.getLanguage(language)) {
      return highlight.highlight(language, text).value;
    } else {
      return highlight.highlightAuto(text).value;
    }
  }
});


function render(text) {
  return marked(text);
}


export default {
  render
};
