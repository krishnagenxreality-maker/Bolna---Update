import fs from 'fs';
import path from 'path';

const srcDir = './src';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);
const jsFiles = allFiles.filter(f => f.endsWith('.js') || f.endsWith('.jsx'));

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /from ['"](\.?\.?\/[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const fullPath = path.resolve(path.dirname(file), importPath);
      const extensions = ['', '.js', '.jsx', '.css'];
      let found = false;
      for (const ext of extensions) {
        const p = fullPath + ext;
        if (fs.existsSync(p)) {
          const dir = path.dirname(p);
          const base = path.basename(p);
          const realFiles = fs.readdirSync(dir);
          if (!realFiles.includes(base)) {
            console.log(`CASE MISMATCH in ${file}: import "${importPath}" resolves to "${p}" but actual filename is different.`);
          }
          found = true;
          break;
        }
      }
    }
  }
});
