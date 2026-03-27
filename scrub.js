const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, 'scripts');
const files = fs.readdirSync(scriptsDir);

const replacements = [
  { search: /samuel540wisesamura@gmail\.com/g, replace: 'admin1@dclm-youth.org' },
  { search: /paulannehk@gmail\.com/g, replace: 'admin2@dclm-youth.org' },
  { search: /princessconteh673@gmail\.com/g, replace: 'admin3@dclm-youth.org' },
  { search: /jonathanksenessie@gmail\.com/g, replace: 'coordinator@dclm-youth.org' },
  { search: /S@muR4#9xL!27/g, replace: 'REDACTED_PASS_1' },
  { search: /P@uL#83vK!2zX/g, replace: 'REDACTED_PASS_2' },
  { search: /Pr1nC3ss!2024\$yF/g, replace: 'REDACTED_PASS_3' }
];

let changedFiles = 0;

for (const file of files) {
  if (!file.endsWith('.sql') && !file.endsWith('.ts')) continue;
  
  const filePath = path.join(scriptsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const { search, replace } of replacements) {
    content = content.replace(search, replace);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles++;
    console.log(`Scrubbed ${file}`);
  }
}

console.log(`Scrubbed ${changedFiles} files in total.`);
