function localDate() {
  let now = new Date();
  let year = ("" + now.getFullYear()).padStart(4, "0");
  let month = ("" + (now.getMonth() + 1)).padStart(2, "0");
  let day = ("" + now.getDate()).padStart(2, "0");
  return year + month + day;
}


const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);


export default {
  localDate,
  isMobile
};
