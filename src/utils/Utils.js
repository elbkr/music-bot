module.exports = class Util {
  constructor(client) {
    this.client = client;
  }

  static formatPerms(perm) {
    return perm
      .toLowerCase()
      .replace(/(^|"|_)(\S)/g, (string) => string.toUpperCase())
      .replace(/_/g, " ")
      .replace(/To/g, "to")
      .replace(/And/g, "and")
      .replace(/Guild/g, "Server")
      .replace(/Tts/g, "Text-to-Speech")
      .replace(/Use Vad/g, "Use Voice Acitvity");
  }

  static formatArray(array, type = "conjunction") {
    return new Intl.ListFormat("en-GB", { style: "short", type: type }).format(
      array
    );
  }

  static removeDuplicates(arr) {
    return [...new Set(arr)];
  }

  static msToSeconds(ms) {
    return parseInt(Math.floor(ms / 1000));
  }

  static secondsToMs(s) {
    return parseInt(s * 1000);
  }

  static readTime(time) {
    let s = time % 60;
    time -= s;
    let m = (time / 60) % 60;
    time -= m * 60;
    let h = (time / 3600) % 24;

    if (m <= 0) {
      return `${s} sec`;
    } else if (h <= 0){
      return `${m} min`;
    } else {
      return `${h}h`;
    }
  }
};
