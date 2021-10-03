function modifyTemplate(template) {
    template.buffs.buffs.flatMap(buffset => buffset.powerMods).forEach(pm => pm.trigger = [pm.trigger])
}

var fs = require("fs");
console.log()
const path = __dirname + "/../src/templates.json";
const file = fs.readFileSync(path, 'utf8');
const templates = JSON.parse(file);
templates.forEach(modifyTemplate);
fs.writeFileSync(path, JSON.stringify(templates, undefined, 4));