import { execSync } from "child_process";
import path from "path";
import fsExtra, { mkdirpSync } from "fs-extra";
const { copySync } = fsExtra;

execSync("npm -w main run build");
execSync("npm -w ui run build");
copySync(path.join("main", "build"), path.join(process.cwd(), "build"), { overwrite: true });
copySync(path.join("ui", "dist"), path.join(process.cwd(), "build", "public", "ui"), { overwrite: true });
