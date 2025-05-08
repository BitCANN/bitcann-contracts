import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputDir = path.join(__dirname, '../contracts');
const outputDir = path.join(__dirname, '../lib/compiled');

try {
  await fs.mkdir(outputDir, { recursive: true }); // Ensure output dir exists

  const files = await fs.readdir(inputDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  for (const file of jsonFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace(/\.json$/, '.ts'));

    const json = await fs.readFile(inputPath, 'utf8');
    const content = `export default ${json};\n`;

    await fs.writeFile(outputPath, content, 'utf8');
    console.log(`✓ Generated: lib/contracts/${path.basename(outputPath)}`);

    // Remove the JSON file after processing
    await fs.unlink(inputPath);
    console.log(`✓ Removed: ${inputPath}`);
  }

  if (jsonFiles.length === 0) {
    console.log('No .json files found in contracts/');
  }
} catch (err) {
  console.error('❌ Error in JSON to JS conversion:', err);
  process.exit(1);
}
