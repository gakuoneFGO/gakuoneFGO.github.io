function modifyTemplate(template) {
    template.buffs.buffs.forEach(buffSet => buffSet.flatDamage = 0);
}

var fs = require("fs");
console.log()
const path = __dirname + "/../src/templates.json";
const file = fs.readFileSync(path, 'utf8');
const templates = JSON.parse(file);
templates.forEach(modifyTemplate);
fs.writeFileSync(path, JSON.stringify(templates, undefined, 4));