#!/usr/bin/env node

/**
 * Schleich Animal Scraper & Image Downloader
 *
 * Fetches all animal products from gb.schleich-s.com using the Shopify JSON API,
 * downloads product images locally, and creates a JSON file with local image paths.
 *
 * Usage: node download_schleich.js
 *
 * Output:
 *   ./images/          - folder with all downloaded product images
 *   ./schleich_animals.json - JSON array with name, description, local image path, category, url
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://gb.schleich-s.com';
const CATEGORIES = [
  'horses',
  'wild-animals-adventure',
  'farm-animals-farm-toys',
  'monsters-and-dragons',
  'dinosaurs-and-volcano'
];

const IMAGES_DIR = path.join(__dirname, 'images');
const OUTPUT_JSON = path.join(__dirname, 'schleich_animals.json');

// Simple HTTPS GET that returns a promise
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Download an image to disk
async function downloadImage(url, filepath) {
  if (fs.existsSync(filepath)) return; // Skip if already downloaded
  try {
    const data = await httpGet(url);
    fs.writeFileSync(filepath, data);
  } catch (err) {
    console.error(`  Failed to download ${path.basename(filepath)}: ${err.message}`);
  }
}

// Strip HTML tags from a string
function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

// Create a safe filename from a product handle
function safeFilename(handle) {
  return handle.replace(/[^a-z0-9_-]/gi, '_') + '.jpg';
}

async function fetchCategoryProducts(category) {
  const products = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${BASE_URL}/collections/${category}/products.json?limit=250&page=${page}`;
    console.log(`  Fetching ${category} page ${page}...`);

    try {
      const data = await httpGet(url);
      const json = JSON.parse(data.toString());

      if (json.products && json.products.length > 0) {
        for (const p of json.products) {
          const mainImage = p.images && p.images.length > 0
            ? p.images[0].src.split('?')[0]
            : '';

          products.push({
            id: p.id,
            name: p.title,
            description: stripHtml(p.body_html),
            image_url: mainImage,
            handle: p.handle,
            category: category,
            url: `${BASE_URL}/products/${p.handle}`
          });
        }

        if (json.products.length < 250) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    } catch (err) {
      console.error(`  Error fetching ${category} page ${page}: ${err.message}`);
      hasMore = false;
    }
  }

  return products;
}

async function main() {
  console.log('=== Schleich Animal Scraper ===\n');

  // Create images directory
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log('Created images/ directory\n');
  }

  // Fetch all products from all categories
  console.log('Step 1: Fetching product data from all categories...\n');
  const allProducts = [];
  const seen = new Set();

  for (const category of CATEGORIES) {
    console.log(`Fetching: ${category}`);
    const products = await fetchCategoryProducts(category);

    for (const p of products) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        allProducts.push(p);
      }
    }

    console.log(`  Found ${products.length} products (${allProducts.length} unique total)\n`);
  }

  console.log(`\nTotal unique products: ${allProducts.length}\n`);

  // Download all images
  console.log('Step 2: Downloading images...\n');
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];

    if (!product.image_url) {
      product.local_image = null;
      skipped++;
      continue;
    }

    const filename = safeFilename(product.handle);
    const filepath = path.join(IMAGES_DIR, filename);
    product.local_image = `images/${filename}`;

    if (fs.existsSync(filepath)) {
      skipped++;
    } else {
      await downloadImage(product.image_url, filepath);
      if (fs.existsSync(filepath)) {
        downloaded++;
      } else {
        failed++;
        product.local_image = null;
      }
    }

    // Progress update every 25 images
    if ((i + 1) % 25 === 0 || i === allProducts.length - 1) {
      process.stdout.write(`\r  Progress: ${i + 1}/${allProducts.length} (${downloaded} downloaded, ${skipped} skipped, ${failed} failed)`);
    }
  }

  console.log('\n');

  // Create final JSON output (without internal fields)
  console.log('Step 3: Writing schleich_animals.json...\n');
  const output = allProducts.map(p => ({
    name: p.name,
    description: p.description,
    image: p.local_image,
    image_url: p.image_url,
    category: p.category,
    url: p.url
  }));

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));

  console.log(`Done! Saved ${output.length} animals to schleich_animals.json`);
  console.log(`Images saved to ./images/`);

  // Summary by category
  console.log('\nBy category:');
  const counts = {};
  output.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  for (const [cat, count] of Object.entries(counts)) {
    console.log(`  ${cat}: ${count}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
