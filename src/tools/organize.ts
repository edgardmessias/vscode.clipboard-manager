import * as fs from "fs";
import * as path from "path";

interface IPackage {
  [key: string]: any;
  contributes: {
    [key: string]: any;
    commands: Array<{
      command: string;
    }>;
    configuration: Array<{
      title: string;
      properties: {
        [key: string]: any;
      };
    }>;
  };
}

function sortObjectKeys(obj: { [key: string]: any }) {
  const clone = Object.assign({}, obj);

  for (const key of Object.keys(clone).sort()) {
    delete obj[key];
    obj[key] = clone[key];
  }
}

function replaceStringRange(
  s: string,
  start: number,
  end: number,
  substitute: string
) {
  return s.substring(0, start) + substitute + s.substring(end);
}

/**
 * Format package.json
 */
const packageFile = path.join(__dirname, "..", "..", "package.json");

let packageJson = fs.readFileSync(packageFile, { encoding: "utf8" });

const packageData = JSON.parse(packageJson) as IPackage;

const sortByCommand = (a: any, b: any) => a.command.localeCompare(b.command);

packageData.contributes.commands.sort(sortByCommand);
packageData.contributes.menus.commandPalette.sort(sortByCommand);
packageData.contributes.keybindings.sort(sortByCommand);

sortObjectKeys(packageData.contributes.configuration[0].properties);
sortObjectKeys(packageData.scripts);
sortObjectKeys(packageData.devDependencies);
sortObjectKeys(packageData.dependencies);

packageJson = JSON.stringify(packageData, null, 4) + "\n";

fs.writeFileSync(packageFile, packageJson, { encoding: "utf8" });

/**
 * Format README.md settings part
 */

const settings: string[] = [];
const settingKeys = Object.keys(
  packageData.contributes.configuration[0].properties
);

for (const key of settingKeys) {
  const s = packageData.contributes.configuration[0].properties[key];

  let desc = "";

  // Turn description to comment
  if (s.description) {
    desc += "  // " + s.description.replace(/\n/g, "\n  // ") + "\n";
  }

  desc += "  " + JSON.stringify(key) + ": " + JSON.stringify(s.default || null);

  settings.push(desc);
}

const readmeFile = path.join(__dirname, "..", "..", "README.md");
let readmeContent = fs.readFileSync(readmeFile, { encoding: "utf8" });

const settingsBegin = readmeContent.indexOf("<!--begin-settings-->") + 21;
const settingsEnd = readmeContent.indexOf("<!--end-settings-->");

readmeContent = replaceStringRange(
  readmeContent,
  settingsBegin,
  settingsEnd,
  "\n```js\n{\n" + settings.join(",\n\n") + "\n}\n```\n"
);

fs.writeFileSync(readmeFile, readmeContent, { encoding: "utf8" });
